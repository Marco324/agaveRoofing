import { db } from '../db.ts';
import {
  EstadoInspeccion,
  EstadoTrayecto,
  OrigenTransicion,
  TipoNotificacion
} from '../../../shared/src/types/estados.ts';
import type {
  IniciarTrayectoDTO,
  RegistrarPuntoUbicacionDTO,
  EstadoSeguimientoVivoDTO
} from '../../../shared/src/types/dtos.ts';
import { transicionar } from './maquinaEstadosService.ts';
import {
  encolarNotificacion,
  despacharNotificacionesPendientes,
  ErrorNotificacionDuplicadaRN13
} from './notificacionService.ts';

// Coordenadas base de la central operativa de Agave Roofing en San Antonio, TX (Loop 410 / US-281)
export const CENTRAL_AGAVE_SATX = {
  latitud: 29.521500,
  longitud: -98.486200
};

// Canal en memoria tipo Supabase Realtime para eventos por inspección (`inspeccion:{id}`)
const ultimoEventoRealtimePorInspeccion = new Map<number, any>();

export class ErrorTrayectoActivoRN03 extends Error {
  idInspector: number;
  idTrayectoConflictivo: number;

  constructor(idInspector: number, idTrayectoConflictivo: number) {
    super(
      `El inspector #${idInspector} ya cuenta con un trayecto ACTIVO (#${idTrayectoConflictivo}). Violación de regla RN-03 (un solo trayecto activo por inspector).`
    );
    this.name = 'ErrorTrayectoActivoRN03';
    this.idInspector = idInspector;
    this.idTrayectoConflictivo = idTrayectoConflictivo;
  }
}

export class ErrorTrayectoNoActivoRN08 extends Error {
  idTrayecto: number;
  estadoActual: string;

  constructor(idTrayecto: number, estadoActual: string) {
    super(
      `El trayecto #${idTrayecto} se encuentra en estado [${estadoActual}]. No se permite publicar ubicación fuera de un trayecto ACTIVO (RN-08).`
    );
    this.name = 'ErrorTrayectoNoActivoRN08';
    this.idTrayecto = idTrayecto;
    this.estadoActual = estadoActual;
  }
}

/**
 * Calcula la distancia en metros entre dos coordenadas GPS mediante la fórmula de Haversine.
 */
export function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * E10 — Calcula el ETA en segundos y la distancia hasta el domicilio (RN-09).
 * Si Google Directions está disponible, aplica factor vial urbano en San Antonio (~1.25x, 42 km/h).
 * Si el servicio falla (`simularFalloDirections = true`), estima en línea recta a `velocidad_promedio_kmh` (35 km/h)
 * y marca `etaAproximado = true` conforme a RN-09.
 */
export function calcularEtaTrayecto(
  latOrigen: number,
  lonOrigen: number,
  latDestino: number,
  lonDestino: number,
  simularFalloDirections = false
): {
  distanciaLineaRectaM: number;
  distanciaRutaM: number;
  etaSegundos: number;
  etaMinutos: number;
  etaAproximado: boolean;
} {
  const distanciaLineaRectaM = calcularDistanciaMetros(latOrigen, lonOrigen, latDestino, lonDestino);

  if (simularFalloDirections) {
    // Respaldo RN-09: distancia en línea recta y velocidad_promedio_kmh configurada (35 km/h)
    const rowVel = db
      .prepare("SELECT valor FROM configuracion WHERE clave = 'velocidad_promedio_kmh'")
      .get() as { valor: string } | undefined;
    const velKmh = rowVel ? parseFloat(rowVel.valor) : 35;
    const velMps = (velKmh * 1000) / 3600;
    const etaSegundos = Math.max(60, Math.round(distanciaLineaRectaM / velMps));
    return {
      distanciaLineaRectaM,
      distanciaRutaM: distanciaLineaRectaM,
      etaSegundos,
      etaMinutos: Math.max(1, Math.round(etaSegundos / 60)),
      etaAproximado: true
    };
  }

  // Cálculo tipo Google Directions en vialidades de San Antonio, TX (I-10 / US-281 / Loop 1604)
  const distanciaRutaM = Math.round(distanciaLineaRectaM * 1.22);
  const velocidadVialMps = (42 * 1000) / 3600; // ~42 km/h promedio urbano
  const etaSegundos = Math.max(60, Math.round(distanciaRutaM / velocidadVialMps));

  return {
    distanciaLineaRectaM,
    distanciaRutaM,
    etaSegundos,
    etaMinutos: Math.max(1, Math.round(etaSegundos / 60)),
    etaAproximado: false
  };
}

/**
 * E10 — Función transaccional `iniciar_trayecto` (Jorge BD / Anuar IN).
 * 1. Valida que la cita exista y pueda pasar a `EN_CAMINO` (RN-01).
 * 2. Verifica que el inspector no tenga otro trayecto activo (RN-03).
 * 3. Cambia la cita a `EN_CAMINO` y escribe en `inspeccion_historial`.
 * 4. Abre el registro en `trayecto` y guarda el primer punto GPS.
 * 5. Encola y despacha la notificación urgente `EN_CAMINO` al cliente.
 */
export function iniciarTrayecto(idInspeccion: number, dto: IniciarTrayectoDTO = {}) {
  const cita = db
    .prepare(
      `
      SELECT i.*, d.latitud AS dom_lat, d.longitud AS dom_lon, d.calle, d.numero, d.colonia,
             ins.id_usuario AS inspector_usuario_id, ins.nombre AS inspector_nombre
      FROM inspeccion i
      JOIN domicilio d ON i.id_domicilio = d.id_domicilio
      LEFT JOIN inspector ins ON i.id_inspector = ins.id_inspector
      WHERE i.id_inspeccion = ?
    `
    )
    .get(idInspeccion) as any;

  if (!cita) {
    throw new Error(`La inspección #${idInspeccion} no existe.`);
  }

  const idInspector = dto.idInspector || cita.id_inspector;
  if (!idInspector) {
    throw new Error(`La inspección #${idInspeccion} no tiene un inspector asignado.`);
  }

  // Verificar RN-03 antes de abrir transacción: un inspector no puede tener dos trayectos activos
  const trayectoExistente = db
    .prepare(`SELECT * FROM trayecto WHERE id_inspector = ? AND estado = 'ACTIVO'`)
    .get(idInspector) as any;

  if (trayectoExistente) {
    throw new ErrorTrayectoActivoRN03(idInspector, trayectoExistente.id_trayecto);
  }

  // Coordenada inicial del inspector (o central Agave Roofing San Antonio por defecto)
  const latInicial = dto.latitudInicial ?? CENTRAL_AGAVE_SATX.latitud;
  const lonInicial = dto.longitudInicial ?? CENTRAL_AGAVE_SATX.longitud;
  const latDestino = cita.dom_lat ?? 29.62012;
  const lonDestino = cita.dom_lon ?? -98.49823;

  const calculoEta = calcularEtaTrayecto(
    latInicial,
    lonInicial,
    latDestino,
    lonDestino,
    Boolean(dto.simularFalloDirections)
  );

  const etaInicialS = dto.etaSegundos ?? calculoEta.etaSegundos;
  const etaAproximado = dto.simularFalloDirections ? 1 : calculoEta.etaAproximado ? 1 : 0;
  const ahoraISO = new Date().toISOString();

  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    // 1 y 2. Transicionar cita a EN_CAMINO y registrar en historial (RN-01)
    transicionar(
      idInspeccion,
      EstadoInspeccion.EN_CAMINO,
      dto.idUsuario || cita.inspector_usuario_id || 'u-insp-001',
      OrigenTransicion.APP_INSP,
      'Inspector inició trayecto hacia el domicilio ("Voy en camino")'
    );

    // 3. Abrir el trayecto (índice ux_trayecto_activo garantiza RN-03 a nivel motor BD)
    const resTrayecto = db
      .prepare(
        `
        INSERT INTO trayecto (
          id_inspeccion, id_inspector, estado, iniciado_en,
          eta_inicial_s, eta_actual_s, eta_actualizado_en, eta_aproximado
        ) VALUES (?, ?, 'ACTIVO', ?, ?, ?, ?, ?)
      `
      )
      .run(
        idInspeccion,
        idInspector,
        ahoraISO,
        etaInicialS,
        etaInicialS,
        ahoraISO,
        etaAproximado
      );

    const idTrayecto = Number(resTrayecto.lastInsertRowid);

    // Registrar el punto GPS de salida
    db.prepare(
      `
      INSERT INTO punto_ubicacion (id_trayecto, latitud, longitud, precision_m, velocidad_ms, capturado_en)
      VALUES (?, ?, ?, 8, 11.5, ?)
    `
    ).run(idTrayecto, latInicial, lonInicial, ahoraISO);

    db.exec('COMMIT');

    // 4. Encolar y despachar notificación urgente EN_CAMINO (ignora horario de silencio RN-14)
    const etaMin = Math.max(1, Math.round(etaInicialS / 60));
    let notificacionEnCamino = null;
    try {
      notificacionEnCamino = encolarNotificacion({
        idInspeccion,
        tipo: TipoNotificacion.EN_CAMINO,
        programadaPara: ahoraISO,
        variablesExtras: {
          eta: String(etaMin)
        }
      });
      despacharNotificacionesPendientes(ahoraISO);
    } catch (err) {
      if (!(err instanceof ErrorNotificacionDuplicadaRN13)) {
        throw err;
      }
    }

    const trayectoCreado = db
      .prepare('SELECT * FROM trayecto WHERE id_trayecto = ?')
      .get(idTrayecto) as any;

    const payloadRealtime = {
      canal: `inspeccion:${idInspeccion}`,
      evento: 'TRAYECTO_INICIADO',
      idTrayecto,
      idInspeccion,
      latitud: latInicial,
      longitud: lonInicial,
      etaSegundos: etaInicialS,
      etaMinutos: etaMin,
      etaAproximado: Boolean(etaAproximado),
      distanciaRestanteM: calculoEta.distanciaLineaRectaM,
      timestamp: ahoraISO
    };
    ultimoEventoRealtimePorInspeccion.set(idInspeccion, payloadRealtime);

    return {
      trayecto: trayectoCreado,
      etaMinutos: etaMin,
      etaAproximado: Boolean(etaAproximado),
      distanciaRestanteM: calculoEta.distanciaLineaRectaM,
      notificacionEnCamino,
      realtime: payloadRealtime
    };
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore if already rolled back
    }
    throw err;
  }
}

/**
 * E10 — Recepción de punto GPS (`POST /api/trayectos/:id/punto`).
 * - Rechaza puntos si el trayecto no está `ACTIVO` (RN-08).
 * - Publica en el canal Realtime `inspeccion:{id}`.
 * - Recalcula ETA a intervalos (cada 60 s, Riesgo R6) o si `forzarCalculoEta = true`.
 * - Si la distancia baja de `distancia_por_llegar_m` (1000 m), encola la notificación urgente `POR_LLEGAR` (1 sola vez por cita).
 */
export function registrarPuntoUbicacion(
  idTrayecto: number,
  dto: RegistrarPuntoUbicacionDTO
) {
  const trayecto = db
    .prepare(
      `
      SELECT t.*, i.id_inspeccion, i.folio, d.latitud AS dom_lat, d.longitud AS dom_lon
      FROM trayecto t
      JOIN inspeccion i ON t.id_inspeccion = i.id_inspeccion
      JOIN domicilio d ON i.id_domicilio = d.id_domicilio
      WHERE t.id_trayecto = ?
    `
    )
    .get(idTrayecto) as any;

  if (!trayecto) {
    throw new Error(`El trayecto #${idTrayecto} no existe.`);
  }

  if (trayecto.estado !== EstadoTrayecto.ACTIVO) {
    throw new ErrorTrayectoNoActivoRN08(idTrayecto, trayecto.estado);
  }

  if (typeof dto.latitud !== 'number' || typeof dto.longitud !== 'number') {
    throw new Error('latitud y longitud numéricas son obligatorias para registrar un punto GPS.');
  }

  const capturadoEn = dto.capturadoEn || new Date().toISOString();

  // 1. Insertar punto GPS
  const resPunto = db
    .prepare(
      `
      INSERT INTO punto_ubicacion (id_trayecto, latitud, longitud, precision_m, velocidad_ms, capturado_en)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      idTrayecto,
      dto.latitud,
      dto.longitud,
      dto.precisionM ?? 6,
      dto.velocidadMs ?? 12.0,
      capturadoEn
    );

  const idPunto = Number(resPunto.lastInsertRowid);

  // 2. Calcular distancia restante al domicilio
  const latDestino = trayecto.dom_lat ?? 29.62012;
  const lonDestino = trayecto.dom_lon ?? -98.49823;
  const distanciaRestanteM = calcularDistanciaMetros(
    dto.latitud,
    dto.longitud,
    latDestino,
    lonDestino
  );

  // 3. Verificar si toca recalcular ETA (cada 60 s por Riesgo R6, o si se fuerza o está a < 1000 m)
  const ultimaActualizacionEtaMs = trayecto.eta_actualizado_en
    ? new Date(trayecto.eta_actualizado_en).getTime()
    : 0;
  const ahoraMs = new Date(capturadoEn).getTime();
  const segundosDesdeUltimoEta = (ahoraMs - ultimaActualizacionEtaMs) / 1000;

  let etaActualS = trayecto.eta_actual_s;
  let etaAproximado = Boolean(trayecto.eta_aproximado);

  if (
    dto.forzarCalculoEta !== false &&
    (segundosDesdeUltimoEta >= 60 ||
      dto.forzarCalculoEta === true ||
      Boolean(dto.simularFalloDirections) ||
      distanciaRestanteM <= 1000)
  ) {
    const nuevoCalculo = calcularEtaTrayecto(
      dto.latitud,
      dto.longitud,
      latDestino,
      lonDestino,
      Boolean(dto.simularFalloDirections)
    );
    etaActualS = nuevoCalculo.etaSegundos;
    etaAproximado = nuevoCalculo.etaAproximado;

    db.prepare(
      `
      UPDATE trayecto
      SET eta_actual_s = ?,
          eta_actualizado_en = ?,
          eta_aproximado = ?
      WHERE id_trayecto = ?
    `
    ).run(etaActualS, capturadoEn, etaAproximado ? 1 : 0, idTrayecto);
  }

  const etaMinutos = Math.max(1, Math.round((etaActualS || 60) / 60));

  // 4. Aviso "está por llegar" cuando la distancia baja de distancia_por_llegar_m (1000 m)
  const rowUmbral = db
    .prepare("SELECT valor FROM configuracion WHERE clave = 'distancia_por_llegar_m'")
    .get() as { valor: string } | undefined;
  const umbralPorLlegarM = rowUmbral ? parseInt(rowUmbral.valor, 10) : 1000;

  let avisoPorLlegarDisparado = false;
  if (distanciaRestanteM <= umbralPorLlegarM) {
    const yaExistePorLlegar = db
      .prepare(
        `SELECT id_notificacion FROM notificacion WHERE id_inspeccion = ? AND tipo = 'POR_LLEGAR' AND reenvio_manual = 0`
      )
      .get(trayecto.id_inspeccion);

    if (!yaExistePorLlegar) {
      try {
        encolarNotificacion({
          idInspeccion: trayecto.id_inspeccion,
          tipo: TipoNotificacion.POR_LLEGAR,
          programadaPara: capturadoEn,
          variablesExtras: {
            eta: String(etaMinutos)
          }
        });
        despacharNotificacionesPendientes(capturadoEn);
        avisoPorLlegarDisparado = true;
      } catch (err) {
        if (!(err instanceof ErrorNotificacionDuplicadaRN13)) {
          throw err;
        }
      }
    }
  }

  // 5. Publicar en el canal Realtime de la inspección
  const payloadRealtime = {
    canal: `inspeccion:${trayecto.id_inspeccion}`,
    evento: 'PUNTO_UBICACION',
    idPunto,
    idTrayecto,
    idInspeccion: trayecto.id_inspeccion,
    latitud: dto.latitud,
    longitud: dto.longitud,
    etaSegundos: etaActualS,
    etaMinutos,
    etaAproximado,
    distanciaRestanteM,
    avisoPorLlegarDisparado,
    capturadoEn
  };
  ultimoEventoRealtimePorInspeccion.set(trayecto.id_inspeccion, payloadRealtime);

  return {
    idPunto,
    idTrayecto,
    idInspeccion: trayecto.id_inspeccion,
    latitud: dto.latitud,
    longitud: dto.longitud,
    distanciaRestanteM,
    etaSegundos: etaActualS,
    etaMinutos,
    etaAproximado,
    avisoPorLlegarDisparado,
    realtime: payloadRealtime
  };
}

/**
 * E10 — Generador de punto simulado de Jorge (`POST /api/inspecciones/:id/simular-avance`).
 * Acerca la posición del inspector hacia el domicilio del cliente para probar en vivo el mapa y el ETA.
 */
export function simularPasoTrayecto(idInspeccion: number, acercarPorLlegar = false) {
  let trayecto = db
    .prepare(`SELECT * FROM trayecto WHERE id_inspeccion = ? AND estado = 'ACTIVO'`)
    .get(idInspeccion) as any;

  if (!trayecto) {
    const iniciado = iniciarTrayecto(idInspeccion);
    trayecto = iniciado.trayecto;
  }

  const dom = db
    .prepare(
      `
      SELECT d.latitud, d.longitud
      FROM inspeccion i
      JOIN domicilio d ON i.id_domicilio = d.id_domicilio
      WHERE i.id_inspeccion = ?
    `
    )
    .get(idInspeccion) as any;

  const ultimoPunto = db
    .prepare(
      `SELECT * FROM punto_ubicacion WHERE id_trayecto = ? ORDER BY capturado_en DESC, id_punto DESC LIMIT 1`
    )
    .get(trayecto.id_trayecto) as any;

  const latActual = ultimoPunto ? Number(ultimoPunto.latitud) : CENTRAL_AGAVE_SATX.latitud;
  const lonActual = ultimoPunto ? Number(ultimoPunto.longitud) : CENTRAL_AGAVE_SATX.longitud;
  const latDest = Number(dom?.latitud ?? 29.62012);
  const lonDest = Number(dom?.longitud ?? -98.49823);

  // Si acercarPorLlegar = true, colocamos al inspector a ~550 metros del domicilio (< 1000 m)
  const factorAvance = acercarPorLlegar ? 0.94 : 0.40;
  const nuevaLat = Number((latActual + (latDest - latActual) * factorAvance).toFixed(6));
  const nuevaLon = Number((lonActual + (lonDest - lonActual) * factorAvance).toFixed(6));

  return registrarPuntoUbicacion(trayecto.id_trayecto, {
    latitud: nuevaLat,
    longitud: nuevaLon,
    precisionM: 5,
    velocidadMs: 13.5,
    forzarCalculoEta: true
  });
}

/**
 * E10 — Función `cerrar_trayecto` (al llegar, marcar cliente ausente o cancelar).
 * Calcula y guarda `distancia_m` y `duracion_s` en `trayecto` antes de que se purguen los puntos (RN-17).
 */
export function cerrarTrayecto(
  idTrayecto: number,
  motivo: 'LLEGADA' | 'CLIENTE_AUSENTE' | 'CANCELADO' = 'LLEGADA',
  finalizadoEnISO?: string
) {
  const trayecto = db
    .prepare('SELECT * FROM trayecto WHERE id_trayecto = ?')
    .get(idTrayecto) as any;

  if (!trayecto) {
    throw new Error(`El trayecto #${idTrayecto} no existe.`);
  }

  if (trayecto.estado !== EstadoTrayecto.ACTIVO) {
    return trayecto;
  }

  const puntos = db
    .prepare('SELECT * FROM punto_ubicacion WHERE id_trayecto = ? ORDER BY id_punto ASC')
    .all(idTrayecto) as any[];

  let distanciaTotalM = 0;
  for (let i = 1; i < puntos.length; i++) {
    distanciaTotalM += calcularDistanciaMetros(
      Number(puntos[i - 1].latitud),
      Number(puntos[i - 1].longitud),
      Number(puntos[i].latitud),
      Number(puntos[i].longitud)
    );
  }

  // Si solo hubo 1 punto al iniciar y luego se cerró al llegar, calcular distancia desde el punto inicial al domicilio
  if (puntos.length === 1) {
    const dom = db
      .prepare(
        `
        SELECT d.latitud, d.longitud
        FROM inspeccion i
        JOIN domicilio d ON i.id_domicilio = d.id_domicilio
        WHERE i.id_inspeccion = ?
      `
      )
      .get(trayecto.id_inspeccion) as any;
    if (dom?.latitud && dom?.longitud) {
      distanciaTotalM = calcularDistanciaMetros(
        Number(puntos[0].latitud),
        Number(puntos[0].longitud),
        Number(dom.latitud),
        Number(dom.longitud)
      );
    }
  }

  const finISO = finalizadoEnISO || new Date().toISOString();
  const inicioMs = new Date(trayecto.iniciado_en).getTime();
  const finMs = new Date(finISO).getTime();
  const duracionS = Math.max(60, Math.round((finMs - inicioMs) / 1000));
  const nuevoEstado =
    motivo === 'CANCELADO' ? EstadoTrayecto.CANCELADO : EstadoTrayecto.FINALIZADO;

  db.prepare(
    `
    UPDATE trayecto
    SET estado = ?,
        finalizado_en = ?,
        distancia_m = ?,
        duracion_s = ?,
        eta_actual_s = 0
    WHERE id_trayecto = ?
  `
  ).run(nuevoEstado, finISO, distanciaTotalM, duracionS, idTrayecto);

  ultimoEventoRealtimePorInspeccion.set(trayecto.id_inspeccion, {
    canal: `inspeccion:${trayecto.id_inspeccion}`,
    evento: 'TRAYECTO_CERRADO',
    idTrayecto,
    idInspeccion: trayecto.id_inspeccion,
    estado: nuevoEstado,
    distanciaM: distanciaTotalM,
    duracionS,
    finalizadoEn: finISO
  });

  return db.prepare('SELECT * FROM trayecto WHERE id_trayecto = ?').get(idTrayecto) as any;
}

/**
 * E10 — Apagado automático de trayectos activos con más de 90 minutos (Riesgo R5).
 */
export function cerrarTrayectosOlvidados(ahoraISO?: string) {
  const rowMax = db
    .prepare("SELECT valor FROM configuracion WHERE clave = 'trayecto_max_minutos'")
    .get() as { valor: string } | undefined;
  const maxMinutos = rowMax ? parseInt(rowMax.valor, 10) : 90;

  const refMs = ahoraISO ? new Date(ahoraISO).getTime() : Date.now();
  const activos = db
    .prepare(`SELECT * FROM trayecto WHERE estado = 'ACTIVO'`)
    .all() as any[];

  const cancelados: number[] = [];
  for (const t of activos) {
    const iniciadoMs = new Date(t.iniciado_en).getTime();
    const minutosTranscurridos = (refMs - iniciadoMs) / 60000;
    if (minutosTranscurridos >= maxMinutos) {
      cerrarTrayecto(t.id_trayecto, 'CANCELADO', ahoraISO || new Date().toISOString());
      cancelados.push(t.id_trayecto);
    }
  }

  return {
    maxMinutosConfigurado: maxMinutos,
    totalCancelados: cancelados.length,
    trayectosCancelados: cancelados
  };
}

/**
 * E10 — Estado del seguimiento en vivo para la App del Cliente (`GET /api/inspecciones/:id/seguimiento`).
 * Cumple estrictamente RN-08 y Riesgo R7:
 * - Antes de que el inspector salga o después de que llegue, `ubicacionVisible = false` y NO expone coordenadas del inspector.
 * - Si dejan de llegar puntos por pérdida de señal, calcula `minutosDesdeUltimoPunto` y `senalPerdida = true`.
 */
export function obtenerSeguimientoVivo(
  idInspeccion: number,
  ahoraISO?: string
): EstadoSeguimientoVivoDTO {
  const cita = db
    .prepare(
      `
      SELECT i.*,
             d.calle, d.numero, d.colonia, d.ciudad, d.estado AS dom_estado, d.codigo_postal,
             d.latitud AS dom_lat, d.longitud AS dom_lon,
             ins.id_inspector, ins.nombre AS inspector_nombre, ins.telefono AS inspector_telefono,
             ins.placa_vehiculo
      FROM inspeccion i
      JOIN domicilio d ON i.id_domicilio = d.id_domicilio
      LEFT JOIN inspector ins ON i.id_inspector = ins.id_inspector
      WHERE i.id_inspeccion = ?
    `
    )
    .get(idInspeccion) as any;

  if (!cita) {
    throw new Error(`La inspección #${idInspeccion} no existe.`);
  }

  const direccionCompleta = `${cita.numero} ${cita.calle}, ${cita.colonia}, ${cita.ciudad}, TX ${cita.codigo_postal}`;
  const domLat = Number(cita.dom_lat ?? 29.62012);
  const domLon = Number(cita.dom_lon ?? -98.49823);

  const trayectoActivo = db
    .prepare(
      `SELECT * FROM trayecto WHERE id_inspeccion = ? AND estado = 'ACTIVO' ORDER BY id_trayecto DESC LIMIT 1`
    )
    .get(idInspeccion) as any;

  // Compromiso de privacidad RN-08 / Riesgo R7: solo visible mientras EN_CAMINO y trayecto ACTIVO
  if (cita.estado !== EstadoInspeccion.EN_CAMINO || !trayectoActivo) {
    let motivoPrivacidad =
      'El mapa en vivo solo se activa cuando el inspector inicia su trayecto hacia su domicilio (Privacidad RN-08 / R7).';
    if (cita.estado === EstadoInspeccion.EN_SITIO) {
      motivoPrivacidad =
        'El inspector ya llegó a su domicilio. El seguimiento GPS se detuvo automáticamente (RN-08).';
    } else if (cita.estado === EstadoInspeccion.COMPLETADA) {
      motivoPrivacidad =
        'La inspección ha concluido y el seguimiento GPS se encuentra cerrado (RN-08).';
    }

    return {
      idInspeccion: cita.id_inspeccion,
      folio: cita.folio,
      estadoInspeccion: cita.estado,
      ubicacionVisible: false,
      motivoPrivacidad,
      presenciaConfirmadaEn: cita.presencia_confirmada_en || undefined,
      domicilioDestino: {
        direccionCompleta,
        latitud: domLat,
        longitud: domLon
      },
      inspector: cita.id_inspector
        ? {
            idInspector: cita.id_inspector,
            nombre: cita.inspector_nombre,
            telefono: cita.inspector_telefono,
            placaVehiculo: cita.placa_vehiculo
          }
        : undefined
    };
  }

  const puntos = db
    .prepare(
      `SELECT * FROM punto_ubicacion WHERE id_trayecto = ? ORDER BY capturado_en DESC, id_punto DESC LIMIT 10`
    )
    .all(trayectoActivo.id_trayecto) as any[];

  const ultimoPunto = puntos[0];
  const refMs = ahoraISO ? new Date(ahoraISO).getTime() : Date.now();
  const ultimoPuntoMs = ultimoPunto ? new Date(ultimoPunto.capturado_en).getTime() : refMs;
  const segundosSinSenal = Math.max(0, Math.round((refMs - ultimoPuntoMs) / 1000));
  const minutosDesdeUltimoPunto = Math.floor(segundosSinSenal / 60);
  const senalPerdida = segundosSinSenal > 45;

  const distanciaRestanteM = ultimoPunto
    ? calcularDistanciaMetros(
        Number(ultimoPunto.latitud),
        Number(ultimoPunto.longitud),
        domLat,
        domLon
      )
    : 0;

  const etaActualS = trayectoActivo.eta_actual_s ?? 600;
  const etaMinutos = Math.max(1, Math.round(etaActualS / 60));
  const etaAproximado = Boolean(trayectoActivo.eta_aproximado);
  const etaTexto = etaAproximado
    ? `Aproximadamente ${etaMinutos} minutos`
    : `Llega en ${etaMinutos} minutos`;

  const notifPorLlegar = db
    .prepare(
      `SELECT id_notificacion FROM notificacion WHERE id_inspeccion = ? AND tipo = 'POR_LLEGAR'`
    )
    .get(idInspeccion);

  return {
    idInspeccion: cita.id_inspeccion,
    folio: cita.folio,
    estadoInspeccion: cita.estado,
    ubicacionVisible: true,
    presenciaConfirmadaEn: cita.presencia_confirmada_en || undefined,
    trayecto: {
      idTrayecto: trayectoActivo.id_trayecto,
      estado: trayectoActivo.estado,
      iniciadoEn: trayectoActivo.iniciado_en,
      etaActualS,
      etaMinutos,
      etaAproximado,
      etaTexto,
      distanciaRestanteM,
      porLlegarNotificado: Boolean(notifPorLlegar),
      senalPerdida,
      minutosDesdeUltimoPunto,
      ultimoPunto: ultimoPunto
        ? {
            latitud: Number(ultimoPunto.latitud),
            longitud: Number(ultimoPunto.longitud),
            precisionM: ultimoPunto.precision_m,
            velocidadMs: ultimoPunto.velocidad_ms,
            capturadoEn: ultimoPunto.capturado_en
          }
        : undefined,
      rastroReciente: puntos.map((p) => ({
        latitud: Number(p.latitud),
        longitud: Number(p.longitud),
        capturadoEn: p.capturado_en
      }))
    },
    domicilioDestino: {
      direccionCompleta,
      latitud: domLat,
      longitud: domLon
    },
    inspector: cita.id_inspector
      ? {
          idInspector: cita.id_inspector,
          nombre: cita.inspector_nombre,
          telefono: cita.inspector_telefono,
          placaVehiculo: cita.placa_vehiculo
        }
      : undefined
  };
}

/**
 * E10 — Monitor en vivo para el Panel de Administración (`GET /api/monitor-vivo`).
 * Devuelve todos los inspectores que van en camino ahora mismo + la lista de citas de hoy con semáforo.
 */
export function listarMonitorVivoPanel(fecha?: string) {
  const trayectosActivosRows = db
    .prepare(
      `
      SELECT t.*,
             i.folio, i.fecha_programada, i.ventana_inicio, i.ventana_fin, i.estado AS inspeccion_estado,
             i.presencia_confirmada_en,
             c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
             d.calle, d.numero, d.colonia, d.codigo_postal, d.latitud AS dom_lat, d.longitud AS dom_lon,
             ins.nombre AS inspector_nombre, ins.telefono AS inspector_telefono, ins.placa_vehiculo
      FROM trayecto t
      JOIN inspeccion i ON t.id_inspeccion = i.id_inspeccion
      JOIN cliente c ON i.id_cliente = c.id_cliente
      JOIN domicilio d ON i.id_domicilio = d.id_domicilio
      JOIN inspector ins ON t.id_inspector = ins.id_inspector
      WHERE t.estado = 'ACTIVO'
      ORDER BY t.iniciado_en DESC
    `
    )
    .all() as any[];

  const inspectoresEnCamino = trayectosActivosRows.map((t) => {
    const ultimoPunto = db
      .prepare(
        `SELECT * FROM punto_ubicacion WHERE id_trayecto = ? ORDER BY capturado_en DESC, id_punto DESC LIMIT 1`
      )
      .get(t.id_trayecto) as any;

    const lat = ultimoPunto ? Number(ultimoPunto.latitud) : CENTRAL_AGAVE_SATX.latitud;
    const lon = ultimoPunto ? Number(ultimoPunto.longitud) : CENTRAL_AGAVE_SATX.longitud;
    const distanciaRestanteM = calcularDistanciaMetros(
      lat,
      lon,
      Number(t.dom_lat ?? 29.62012),
      Number(t.dom_lon ?? -98.49823)
    );
    const etaMinutos = Math.max(1, Math.round((t.eta_actual_s || 600) / 60));

    return {
      idTrayecto: t.id_trayecto,
      idInspeccion: t.id_inspeccion,
      folio: t.folio,
      inspector: {
        idInspector: t.id_inspector,
        nombre: t.inspector_nombre,
        telefono: t.inspector_telefono,
        placaVehiculo: t.placa_vehiculo
      },
      cliente: {
        nombre: t.cliente_nombre,
        telefono: t.cliente_telefono,
        enCasa: Boolean(t.presencia_confirmada_en)
      },
      destino: {
        direccion: `${t.numero} ${t.calle}, ${t.colonia}, TX ${t.codigo_postal}`,
        latitud: Number(t.dom_lat),
        longitud: Number(t.dom_lon)
      },
      posicionActual: {
        latitud: lat,
        longitud: lon,
        capturadoEn: ultimoPunto?.capturado_en || t.iniciado_en
      },
      etaMinutos,
      etaAproximado: Boolean(t.eta_aproximado),
      distanciaRestanteM,
      ventana: `${t.ventana_inicio} - ${t.ventana_fin}`
    };
  });

  // Lista de citas del día con semáforo de puntualidad
  const fechaFiltro = fecha || '2026-11-12';
  const citasHoy = db
    .prepare(
      `
      SELECT i.*,
             c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
             d.calle, d.numero, d.colonia, d.codigo_postal,
             ins.nombre AS inspector_nombre, ins.placa_vehiculo
      FROM inspeccion i
      JOIN cliente c ON i.id_cliente = c.id_cliente
      JOIN domicilio d ON i.id_domicilio = d.id_domicilio
      LEFT JOIN inspector ins ON i.id_inspector = ins.id_inspector
      WHERE i.fecha_programada = ? AND i.estado <> 'CANCELADA'
      ORDER BY i.ventana_inicio ASC
    `
    )
    .all(fechaFiltro) as any[];

  const citasConSemaforo = citasHoy.map((c) => {
    let semaforo: 'VERDE' | 'AMARILLO' | 'ROJO' = 'VERDE';
    let etiquetaSemaforo = 'En tiempo';

    if (c.estado === 'COMPLETADA' || c.estado === 'EN_SITIO' || c.estado === 'EN_CAMINO') {
      semaforo = 'VERDE';
      etiquetaSemaforo = c.estado === 'COMPLETADA' ? 'Completada a tiempo' : 'En atención activa';
    } else if (c.estado === 'SIN_CONFIRMAR' || c.estado === 'CLIENTE_AUSENTE') {
      semaforo = 'ROJO';
      etiquetaSemaforo = c.estado === 'CLIENTE_AUSENTE' ? 'Visita fallida (Ausente)' : 'Riesgo: Sin confirmar';
    } else if (c.ventana_inicio <= '11:30' && c.estado === 'NOTIFICADA') {
      semaforo = 'AMARILLO';
      etiquetaSemaforo = 'Por iniciar ventana';
    }

    return {
      idInspeccion: c.id_inspeccion,
      folio: c.folio,
      ventanaInicio: c.ventana_inicio,
      ventanaFin: c.ventana_fin,
      estado: c.estado,
      clienteNombre: c.cliente_nombre,
      inspectorNombre: c.inspector_nombre || 'Sin asignar',
      colonia: c.colonia,
      presenciaConfirmada: Boolean(c.presencia_confirmada_en),
      semaforo,
      etiquetaSemaforo
    };
  });

  return {
    fecha: fechaFiltro,
    totalEnCamino: inspectoresEnCamino.length,
    inspectoresEnCamino,
    citasHoy: citasConSemaforo
  };
}
