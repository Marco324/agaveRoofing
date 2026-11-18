import { db } from '../db.ts';
import { hoy } from '../fechaReferencia.ts';
import {
  EstadoInspeccion,
  OrigenTransicion,
  TipoNotificacion
} from '../../../shared/src/types/estados.ts';
import type {
  ConfirmarInspeccionDTO,
  HorarioDisponibleDTO,
  SolicitarReprogramacionDTO,
  ResolverReprogramacionDTO
} from '../../../shared/src/types/dtos.ts';
import { transicionar } from './maquinaEstadosService.ts';
import {
  validarTraslapeInspector,
  validarVentanaOperacion,
  obtenerInspeccionPorId
} from './agendaService.ts';
import {
  encolarNotificacion,
  despacharNotificacionesPendientes
} from './notificacionService.ts';

export class ErrorReprogramacionEnCaminoRN05 extends Error {
  estadoActual: string;
  constructor(estadoActual: string) {
    super(
      `No es posible reprogramar una inspección cuando el inspector ya va en camino o la visita concluyó (estado actual: ${estadoActual}). Violación de regla RN-05.`
    );
    this.name = 'ErrorReprogramacionEnCaminoRN05';
    this.estadoActual = estadoActual;
  }
}

export class ErrorLimiteReprogramacionesRN06 extends Error {
  vecesReprogramada: number;
  constructor(vecesReprogramada: number) {
    super(
      `Se alcanzó el límite máximo de 3 reprogramaciones permitidas para esta inspección (lleva ${vecesReprogramada}). Por favor comuníquese por teléfono con la oficina de Agave Roofing. Violación de regla RN-06.`
    );
    this.name = 'ErrorLimiteReprogramacionesRN06';
    this.vecesReprogramada = vecesReprogramada;
  }
}

export class ErrorConfirmacionInmutableRN04 extends Error {
  constructor(mensaje = 'La confirmación de una cita es definitiva y no se puede deshacer (Regla RN-04).') {
    super(mensaje);
    this.name = 'ErrorConfirmacionInmutableRN04';
  }
}

/**
 * E09 — Confirmar disponibilidad de una inspección (desde botón de notificación push, app del cliente o llamada en panel).
 * POST /api/inspecciones/:id/confirmar
 */
export function confirmarInspeccion(idInspeccion: number, dto: ConfirmarInspeccionDTO = {}) {
  const cita = db.prepare('SELECT * FROM inspeccion WHERE id_inspeccion = ?').get(idInspeccion) as any;
  if (!cita) {
    throw new Error(`Inspección #${idInspeccion} no encontrada.`);
  }

  // Si ya estaba CONFIRMADA, es idempotente pero recuerda RN-04
  if (cita.estado === EstadoInspeccion.CONFIRMADA) {
    return obtenerInspeccionPorId(idInspeccion);
  }

  const origen: OrigenTransicion = dto.confirmadaPorLlamada
    ? 'PANEL'
    : dto.origen || 'APP_CLI';

  const nota =
    dto.nota ||
    (dto.confirmadaPorLlamada
      ? 'Confirmación registrada por llamada telefónica desde el panel administrativo'
      : 'Cliente confirmó asistencia ("Sí estaré")');

  transicionar(
    idInspeccion,
    EstadoInspeccion.CONFIRMADA,
    dto.idUsuario,
    origen,
    nota
  );

  db.prepare(`
    UPDATE inspeccion
    SET confirmado_en = datetime('now'),
        actualizado_en = datetime('now')
    WHERE id_inspeccion = ?
  `).run(idInspeccion);

  return obtenerInspeccionPorId(idInspeccion);
}

/**
 * E09 — Obtener horarios disponibles reales en la zona del domicilio para los próximos días.
 * GET /api/inspecciones/:id/horarios-disponibles
 */
export function obtenerHorariosDisponibles(
  idInspeccion: number,
  diasBusqueda = 5,
  fechaBaseStr?: string
): HorarioDisponibleDTO[] {
  const cita = db.prepare(`
    SELECT i.*, d.id_zona, z.nombre AS zona_nombre
    FROM inspeccion i
    JOIN domicilio d ON i.id_domicilio = d.id_domicilio
    LEFT JOIN zona z ON d.id_zona = z.id_zona
    WHERE i.id_inspeccion = ?
  `).get(idInspeccion) as any;

  if (!cita) {
    throw new Error(`Inspección #${idInspeccion} no encontrada.`);
  }

  // Buscar inspectores que cubren la zona del domicilio (o el inspector actual si no hay zona)
  let inspectoresZona = db.prepare(`
    SELECT insp.id_inspector, insp.nombre
    FROM inspector insp
    JOIN inspector_zona iz ON insp.id_inspector = iz.id_inspector
    WHERE iz.id_zona = ? AND insp.activo = 1
  `).all(cita.id_zona) as { id_inspector: number; nombre: string }[];

  if (inspectoresZona.length === 0) {
    inspectoresZona = db.prepare(`
      SELECT id_inspector, nombre FROM inspector WHERE activo = 1
    `).all() as { id_inspector: number; nombre: string }[];
  }

  const ventanasEstandar = [
    { inicio: '09:00', fin: '11:00' },
    { inicio: '11:30', fin: '13:30' },
    { inicio: '14:30', fin: '16:30' }
  ];

  // Los horarios se buscan a partir de la fecha de la cita o de hoy, lo que sea
  // más tarde (una cita vencida no debe ofrecer días que ya pasaron).
  const fechaBase = fechaBaseStr || (cita.fecha_programada > hoy() ? cita.fecha_programada : hoy());
  const baseDate = new Date(`${fechaBase}T12:00:00Z`);
  const disponibles: HorarioDisponibleDTO[] = [];

  for (let d = 1; d <= diasBusqueda; d++) {
    const fechaCursor = new Date(baseDate);
    fechaCursor.setUTCDate(fechaCursor.getUTCDate() + d);
    const fechaISO = fechaCursor.toISOString().split('T')[0];

    for (const ventana of ventanasEstandar) {
      for (const insp of inspectoresZona) {
        // Verificar si el inspector tiene cita traslapada en esa fecha y ventana (RN-02)
        const ocupada = db.prepare(`
          SELECT id_inspeccion FROM inspeccion
          WHERE id_inspector = ?
            AND fecha_programada = ?
            AND id_inspeccion != ?
            AND estado NOT IN ('CANCELADA', 'COMPLETADA', 'CLIENTE_AUSENTE', 'NO_REALIZADA')
            AND (ventana_inicio < ? AND ventana_fin > ?)
        `).get(insp.id_inspector, fechaISO, idInspeccion, ventana.fin, ventana.inicio);

        if (!ocupada) {
          disponibles.push({
            fecha: fechaISO,
            ventanaInicio: ventana.inicio,
            ventanaFin: ventana.fin,
            idInspector: insp.id_inspector,
            inspectorNombre: insp.nombre,
            idZona: cita.id_zona,
            zonaNombre: cita.zona_nombre
          });
          break; // Basta con un inspector disponible por bloque horario para el cliente
        }
      }
    }
  }

  return disponibles;
}

/**
 * E09 — Solicitar reprogramación por parte del cliente (valida RN-05 y RN-06).
 * POST /api/inspecciones/:id/reprogramacion
 */
export function solicitarReprogramacion(
  idInspeccion: number,
  dto: SolicitarReprogramacionDTO
) {
  const cita = db.prepare('SELECT * FROM inspeccion WHERE id_inspeccion = ?').get(idInspeccion) as any;
  if (!cita) {
    throw new Error(`Inspección #${idInspeccion} no encontrada.`);
  }

  // RN-05: No permitir reprogramar cuando la cita ya va en camino o terminó
  // (PENDIENTE_CIERRE: la visita ocurrió y falta su cierre).
  if (['EN_CAMINO', 'EN_SITIO', 'COMPLETADA', 'CLIENTE_AUSENTE', 'CANCELADA', 'PENDIENTE_CIERRE'].includes(cita.estado)) {
    throw new ErrorReprogramacionEnCaminoRN05(cita.estado);
  }

  // RN-06: Límite máximo de 3 reprogramaciones por inspección
  const maxReprog = Number(
    (db.prepare(`SELECT valor FROM configuracion WHERE clave = 'max_reprogramaciones'`).get() as any)?.valor || 3
  );
  if (cita.veces_reprogramada >= maxReprog) {
    throw new ErrorLimiteReprogramacionesRN06(cita.veces_reprogramada);
  }

  // Calcular ventana fin si solo envió ventanaInicioSolicitada (2 horas por defecto)
  let ventanaFinSolicitada = dto.ventanaFinSolicitada;
  if (!ventanaFinSolicitada) {
    const [hh, mm] = dto.ventanaInicioSolicitada.split(':').map(Number);
    const finH = String(hh + 2).padStart(2, '0');
    ventanaFinSolicitada = `${finH}:${String(mm || 0).padStart(2, '0')}`;
  }

  validarVentanaOperacion(dto.ventanaInicioSolicitada, ventanaFinSolicitada);

  if (dto.fechaSolicitada < hoy()) {
    throw new Error(`La fecha solicitada (${dto.fechaSolicitada}) ya pasó; elige una a partir de ${hoy()}.`);
  }

  // Transicionar la cita a REPROG_SOLICITADA (RN-01)
  transicionar(
    idInspeccion,
    EstadoInspeccion.REPROG_SOLICITADA,
    dto.idUsuario,
    'APP_CLI',
    `Cliente solicitó mover cita al ${dto.fechaSolicitada} (${dto.ventanaInicioSolicitada} - ${ventanaFinSolicitada}). Motivo: ${dto.motivo || 'Sin motivo especificado'}`
  );

  const insertResult = db.prepare(`
    INSERT INTO reprogramacion (
      id_inspeccion, fecha_anterior, ventana_inicio_anterior, ventana_fin_anterior,
      fecha_solicitada, ventana_inicio_solicitada, ventana_fin_solicitada,
      motivo, solicitada_por, estado, creado_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SOLICITADA', datetime('now'))
  `).run(
    idInspeccion,
    cita.fecha_programada,
    cita.ventana_inicio,
    cita.ventana_fin,
    dto.fechaSolicitada,
    dto.ventanaInicioSolicitada,
    ventanaFinSolicitada,
    dto.motivo || 'Solicitud de cambio de horario desde la app del cliente',
    dto.solicitadaPor || 'CLIENTE'
  );

  const idReprogramacion = Number(insertResult.lastInsertRowid);
  const solicitud = db.prepare('SELECT * FROM reprogramacion WHERE id_reprogramacion = ?').get(idReprogramacion);

  return {
    solicitud,
    inspeccion: obtenerInspeccionPorId(idInspeccion)
  };
}

/**
 * E09 — Aprobar o rechazar una solicitud de reprogramación desde la bandeja del panel (Marco LP / Jorge BD).
 * PATCH /api/reprogramaciones/:id/resolver
 */
export function resolverReprogramacion(
  idReprogramacion: number,
  dto: ResolverReprogramacionDTO
) {
  const reprog = db.prepare('SELECT * FROM reprogramacion WHERE id_reprogramacion = ?').get(idReprogramacion) as any;
  if (!reprog) {
    throw new Error(`Solicitud de reprogramación #${idReprogramacion} no encontrada.`);
  }

  if (reprog.estado !== 'SOLICITADA') {
    throw new Error(`La solicitud #${idReprogramacion} ya fue resuelta previamente (${reprog.estado}).`);
  }

  const cita = db.prepare('SELECT * FROM inspeccion WHERE id_inspeccion = ?').get(reprog.id_inspeccion) as any;
  if (!cita) {
    throw new Error(`Inspección #${reprog.id_inspeccion} no encontrada.`);
  }

  const usuarioAdmin = dto.resueltaPor || 'u-admin-001';

  if (dto.aprobada) {
    // Validar límite RN-06 antes de aprobar
    if (cita.veces_reprogramada >= 3) {
      throw new ErrorLimiteReprogramacionesRN06(cita.veces_reprogramada);
    }

    const idInspectorDestino = dto.idInspectorNuevo || cita.id_inspector;
    const ventanaFin = reprog.ventana_fin_solicitada || '11:00';

    if (idInspectorDestino) {
      validarTraslapeInspector(
        idInspectorDestino,
        reprog.fecha_solicitada,
        reprog.ventana_inicio_solicitada,
        ventanaFin,
        cita.id_inspeccion
      );
    }

    // 1. Transición por máquina de estados: REPROG_SOLICITADA -> REPROGRAMADA -> NOTIFICADA (conservando el mismo folio RN-06).
    //    También desde NO_REALIZADA: la cita vencida recibe su nueva fecha.
    if (
      cita.estado === EstadoInspeccion.REPROG_SOLICITADA ||
      cita.estado === EstadoInspeccion.NO_REALIZADA
    ) {
      transicionar(
        cita.id_inspeccion,
        EstadoInspeccion.REPROGRAMADA,
        usuarioAdmin,
        'PANEL',
        `Reprogramación aprobada para ${reprog.fecha_solicitada} (${reprog.ventana_inicio_solicitada} - ${ventanaFin})`
      );
      transicionar(
        cita.id_inspeccion,
        EstadoInspeccion.NOTIFICADA,
        usuarioAdmin,
        'SISTEMA',
        `Cita actualizada con su mismo folio ${cita.folio} y aviso enviado al cliente`
      );
    }

    // 2. Actualizar fecha, ventana e incrementar veces_reprogramada conservando el folio
    db.prepare(`
      UPDATE inspeccion
      SET fecha_programada = ?,
          ventana_inicio = ?,
          ventana_fin = ?,
          id_inspector = ?,
          veces_reprogramada = veces_reprogramada + 1,
          confirmado_en = NULL,
          actualizado_en = datetime('now')
      WHERE id_inspeccion = ?
    `).run(
      reprog.fecha_solicitada,
      reprog.ventana_inicio_solicitada,
      ventanaFin,
      idInspectorDestino,
      cita.id_inspeccion
    );

    // 3. Marcar solicitud como APROBADA
    db.prepare(`
      UPDATE reprogramacion
      SET estado = 'APROBADA',
          resuelta_por = ?,
          resuelta_en = datetime('now')
      WHERE id_reprogramacion = ?
    `).run(usuarioAdmin, idReprogramacion);

    // 4. Encolar y despachar notificación del cambio de fecha al cliente
    const notifCambio = encolarNotificacion({
      idInspeccion: cita.id_inspeccion,
      tipo: TipoNotificacion.REPROGRAMADA,
      reenvioManual: true
    });
    despacharNotificacionesPendientes();

    return {
      resolucion: 'APROBADA',
      notificacionEnviada: notifCambio,
      inspeccion: obtenerInspeccionPorId(cita.id_inspeccion)
    };
  } else {
    if (!dto.motivoRechazo || !dto.motivoRechazo.trim()) {
      throw new Error('Debe indicar el motivo del rechazo para informar al cliente.');
    }

    // Marcar solicitud como RECHAZADA
    db.prepare(`
      UPDATE reprogramacion
      SET estado = 'RECHAZADA',
          motivo_rechazo = ?,
          resuelta_por = ?,
          resuelta_en = datetime('now')
      WHERE id_reprogramacion = ?
    `).run(dto.motivoRechazo.trim(), usuarioAdmin, idReprogramacion);

    // Regresar la cita a NOTIFICADA por máquina de estados
    if (cita.estado === EstadoInspeccion.REPROG_SOLICITADA) {
      transicionar(
        cita.id_inspeccion,
        EstadoInspeccion.NOTIFICADA,
        usuarioAdmin,
        'PANEL',
        `Solicitud de reprogramación rechazada: ${dto.motivoRechazo.trim()}`
      );
    }

    return {
      resolucion: 'RECHAZADA',
      motivoRechazo: dto.motivoRechazo.trim(),
      inspeccion: obtenerInspeccionPorId(cita.id_inspeccion)
    };
  }
}

/**
 * E09 — Temporizador de citas sin confirmar (RN-07).
 * Pasa citas en estado NOTIFICADA sin respuesta a SIN_CONFIRMAR y genera alerta para el panel.
 * Nunca se cancelan automáticamente.
 */
export function ejecutarTemporizadorSinConfirmar(fechaLimite?: string) {
  let sql = `SELECT * FROM inspeccion WHERE estado = 'NOTIFICADA' AND confirmado_en IS NULL`;
  const params: any[] = [];

  if (fechaLimite) {
    sql += ` AND fecha_programada <= ?`;
    params.push(fechaLimite);
  }

  const citasSinRespuesta = db.prepare(sql).all(...params) as any[];
  const marcadas: any[] = [];

  for (const cita of citasSinRespuesta) {
    transicionar(
      cita.id_inspeccion,
      EstadoInspeccion.SIN_CONFIRMAR,
      undefined,
      'SISTEMA',
      'Plazo de confirmación vencido sin respuesta del cliente (RN-07). Requiere llamada de oficina.'
    );
    marcadas.push({
      idInspeccion: cita.id_inspeccion,
      folio: cita.folio,
      fechaProgramada: cita.fecha_programada
    });
  }

  return {
    totalMarcadasSinConfirmar: marcadas.length,
    citas: marcadas
  };
}

/**
 * E09 — Listar solicitudes para la Bandeja de Reprogramaciones del Panel (Marco LP).
 */
export function listarBandejaReprogramaciones(estadoFiltro?: string) {
  let sql = `
    SELECT r.*,
           i.folio, i.estado AS inspec_estado, i.veces_reprogramada,
           c.id_cliente, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
           d.calle, d.numero, d.colonia, d.ciudad, d.codigo_postal,
           insp.id_inspector, insp.nombre AS inspector_nombre
    FROM reprogramacion r
    JOIN inspeccion i ON r.id_inspeccion = i.id_inspeccion
    JOIN cliente c ON i.id_cliente = c.id_cliente
    JOIN domicilio d ON i.id_domicilio = d.id_domicilio
    LEFT JOIN inspector insp ON i.id_inspector = insp.id_inspector
    WHERE 1=1
  `;
  const params: any[] = [];

  if (estadoFiltro) {
    sql += ` AND r.estado = ?`;
    params.push(estadoFiltro);
  }

  sql += ` ORDER BY CASE WHEN r.estado = 'SOLICITADA' THEN 0 ELSE 1 END, r.id_reprogramacion DESC`;

  return db.prepare(sql).all(...params);
}

/**
 * E09 — Listar citas en estado SIN_CONFIRMAR para el panel de alerta administrativa (Marco LP).
 */
export function listarCitasSinConfirmar() {
  return db.prepare(`
    SELECT i.*,
           c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.canal_preferido,
           d.calle, d.numero, d.colonia, d.ciudad, d.codigo_postal,
           insp.nombre AS inspector_nombre, insp.telefono AS inspector_telefono
    FROM inspeccion i
    JOIN cliente c ON i.id_cliente = c.id_cliente
    JOIN domicilio d ON i.id_domicilio = d.id_domicilio
    LEFT JOIN inspector insp ON i.id_inspector = insp.id_inspector
    WHERE i.estado = 'SIN_CONFIRMAR'
    ORDER BY i.fecha_programada ASC, i.ventana_inicio ASC
  `).all();
}
