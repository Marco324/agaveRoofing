import { db } from '../db.ts';
import {
  EstadoInspeccion,
  EstadoTecho,
  OrigenTransicion,
  TipoEvidencia,
  TipoNotificacion
} from '../../../shared/src/types/estados.ts';
import type {
  ConfirmarPresenciaDTO,
  RegistrarLlegadaDTO,
  RegistrarEvidenciaDTO,
  RegistrarResultadoDTO,
  RegistrarClienteAusenteDTO,
  LoteSincronizacionDTO,
  EnviarMensajeDTO
} from '../../../shared/src/types/dtos.ts';
import { transicionar } from './maquinaEstadosService.ts';
import { cerrarTrayecto } from './trayectoService.ts';
import {
  encolarNotificacion,
  despacharNotificacionesPendientes,
  ErrorNotificacionDuplicadaRN13
} from './notificacionService.ts';
import { crearInspeccion } from './agendaService.ts';

export class ErrorAusenciaSinEvidenciaRN10 extends Error {
  constructor(detalle: string) {
    super(
      `No se puede registrar CLIENTE_AUSENTE sin foto de la fachada y nota obligatoria (${detalle}). Violación de regla RN-10.`
    );
    this.name = 'ErrorAusenciaSinEvidenciaRN10';
  }
}

export class ErrorEvidenciaRequeridaRN11 extends Error {
  constructor(idInspeccion: number) {
    super(
      `La inspección #${idInspeccion} requiere al menos una fotografía de evidencia del techo antes de guardar el resultado y marcarla como COMPLETADA. Violación de regla RN-11.`
    );
    this.name = 'ErrorEvidenciaRequeridaRN11';
  }
}

/**
 * E11 — Confirmación de presencia del cliente ("Ya estoy en mi casa").
 * POST /api/inspecciones/:id/presencia y POST /api/inspecciones/:id/estoy-en-casa
 */
export function confirmarPresenciaCliente(
  idInspeccion: number,
  dto: ConfirmarPresenciaDTO = {}
) {
  const cita = db
    .prepare('SELECT * FROM inspeccion WHERE id_inspeccion = ?')
    .get(idInspeccion) as any;

  if (!cita) {
    throw new Error(`La inspección #${idInspeccion} no existe.`);
  }

  const ahoraISO = new Date().toISOString();
  const timestampFinal = cita.presencia_confirmada_en || ahoraISO;

  db.prepare(
    `
    UPDATE inspeccion
    SET presencia_confirmada_en = COALESCE(presencia_confirmada_en, ?),
        actualizado_en = ?
    WHERE id_inspeccion = ?
  `
  ).run(ahoraISO, ahoraISO, idInspeccion);

  db.prepare(
    `
    INSERT INTO inspeccion_historial (
      id_inspeccion, estado_anterior, estado_nuevo, id_usuario, origen, nota, ocurrido_en
    ) VALUES (?, ?, ?, ?, 'APP_CLI', ?, ?)
  `
  ).run(
    idInspeccion,
    cita.estado,
    cita.estado,
    dto.idUsuario || 'u-cli-001',
    dto.nota || 'Cliente confirmó "Ya estoy en mi casa" desde la aplicación móvil',
    ahoraISO
  );

  return {
    idInspeccion,
    folio: cita.folio,
    presenciaConfirmadaEn: timestampFinal,
    avisoInspector: 'El cliente confirmó que ya se encuentra en su domicilio esperándolo.'
  };
}

/**
 * E11 — Registro de llegada del inspector al domicilio (`EN_SITIO`).
 * Cierra el trayecto activo (deteniendo el envío de puntos GPS) y notifica al cliente (`LLEGADA`).
 * Soporta idempotencia por `idLocal` para el modo sin señal (RN-12).
 */
export function registrarLlegadaInspector(
  idInspeccion: number,
  dto: RegistrarLlegadaDTO = {}
) {
  if (dto.idLocal) {
    const syncPrevia = db
      .prepare('SELECT * FROM operacion_sincronizada WHERE id_local = ?')
      .get(dto.idLocal) as any;
    if (syncPrevia) {
      return {
        ...JSON.parse(syncPrevia.respuesta_json),
        yaExistiaPorIdLocal: true
      };
    }
  }

  const cita = db
    .prepare('SELECT * FROM inspeccion WHERE id_inspeccion = ?')
    .get(idInspeccion) as any;

  if (!cita) {
    throw new Error(`La inspección #${idInspeccion} no existe.`);
  }

  const ocurridoEn = dto.ocurridoEn || new Date().toISOString();

  // Si la cita ya estaba EN_SITIO o COMPLETADA, devolver de forma idempotente
  if (cita.estado !== EstadoInspeccion.EN_SITIO && cita.estado !== EstadoInspeccion.COMPLETADA) {
    // Si venía de CONFIRMADA/NOTIFICADA/SIN_CONFIRMAR porque operó sin señal todo el camino, pasar primero a EN_CAMINO
    if (
      cita.estado === EstadoInspeccion.CONFIRMADA ||
      cita.estado === EstadoInspeccion.NOTIFICADA ||
      cita.estado === EstadoInspeccion.SIN_CONFIRMAR
    ) {
      transicionar(
        idInspeccion,
        EstadoInspeccion.EN_CAMINO,
        dto.idUsuario || 'u-insp-001',
        OrigenTransicion.APP_INSP,
        'Inicio de trayecto registrado en cola local'
      );
    }

    transicionar(
      idInspeccion,
      EstadoInspeccion.EN_SITIO,
      dto.idUsuario || 'u-insp-001',
      OrigenTransicion.APP_INSP,
      dto.nota ||
        (dto.registradoSinSenal
          ? `Llegada registrada en modo sin señal a las ${ocurridoEn}`
          : 'Inspector registró llegada al domicilio ("Llegué")')
    );
  }

  // Cerrar el trayecto activo para cortar inmediatamente la publicación de GPS (RN-08)
  const trayectoActivo = db
    .prepare(`SELECT * FROM trayecto WHERE id_inspeccion = ? AND estado = 'ACTIVO'`)
    .get(idInspeccion) as any;

  let trayectoCerrado = null;
  if (trayectoActivo) {
    trayectoCerrado = cerrarTrayecto(trayectoActivo.id_trayecto, 'LLEGADA', ocurridoEn);
  }

  // Encolar y despachar notificación LLEGADA al cliente
  try {
    encolarNotificacion({
      idInspeccion,
      tipo: TipoNotificacion.LLEGADA,
      programadaPara: ocurridoEn
    });
    despacharNotificacionesPendientes(ocurridoEn);
  } catch (err) {
    if (!(err instanceof ErrorNotificacionDuplicadaRN13)) {
      throw err;
    }
  }

  const respuesta = {
    idInspeccion,
    folio: cita.folio,
    estado: EstadoInspeccion.EN_SITIO,
    ocurridoEn,
    registradoSinSenal: Boolean(dto.registradoSinSenal),
    idLocal: dto.idLocal || null,
    seguimientoGpsDetenido: true,
    trayectoCerrado
  };

  if (dto.idLocal) {
    db.prepare(
      `
      INSERT OR IGNORE INTO operacion_sincronizada (id_local, tipo_operacion, id_inspeccion, ocurrido_en, respuesta_json)
      VALUES (?, 'LLEGADA', ?, ?, ?)
    `
    ).run(dto.idLocal, idInspeccion, ocurridoEn, JSON.stringify(respuesta));
  }

  return {
    ...respuesta,
    yaExistiaPorIdLocal: false
  };
}

/**
 * E11 — Subida y registro de evidencia fotográfica con idempotencia por `idLocal` (RN-12).
 * POST /api/inspecciones/:id/evidencias
 */
export function registrarEvidencia(idInspeccion: number, dto: RegistrarEvidenciaDTO) {
  if (dto.idLocal) {
    const existente = db
      .prepare('SELECT * FROM evidencia WHERE id_local = ?')
      .get(dto.idLocal) as any;
    if (existente) {
      return {
        evidencia: existente,
        yaExistiaPorIdLocal: true
      };
    }
  }

  if (!dto.rutaArchivo || !dto.rutaArchivo.trim()) {
    throw new Error('La ruta o URL del archivo de evidencia fotográfica es obligatoria.');
  }

  const tipo = dto.tipo || TipoEvidencia.FOTO_TECHO;
  const capturadaEn = dto.capturadaEn || new Date().toISOString();
  const subidaEn = new Date().toISOString();

  const res = db
    .prepare(
      `
      INSERT INTO evidencia (
        id_inspeccion, tipo, ruta_archivo, descripcion, id_local,
        registrado_sin_senal, capturada_en, subida_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      idInspeccion,
      tipo,
      dto.rutaArchivo.trim(),
      dto.descripcion || 'Evidencia fotográfica capturada en sitio',
      dto.idLocal || null,
      dto.registradoSinSenal ? 1 : 0,
      capturadaEn,
      subidaEn
    );

  const evidencia = db
    .prepare('SELECT * FROM evidencia WHERE id_evidencia = ?')
    .get(Number(res.lastInsertRowid)) as any;

  if (dto.idLocal) {
    db.prepare(
      `
      INSERT OR IGNORE INTO operacion_sincronizada (id_local, tipo_operacion, id_inspeccion, ocurrido_en, respuesta_json)
      VALUES (?, 'EVIDENCIA', ?, ?, ?)
    `
    ).run(dto.idLocal, idInspeccion, capturadaEn, JSON.stringify({ evidencia }));
  }

  return {
    evidencia,
    yaExistiaPorIdLocal: false
  };
}

/**
 * E11 — Captura del resultado técnico de la inspección (RN-11 y RN-12).
 * - Exige al menos 1 fotografía (RN-11) antes de permitir guardar.
 * - Garantiza idempotencia por `idLocal` (RN-12).
 * - Pasa la cita a `COMPLETADA`, genera la ruta del reporte PDF y notifica al cliente (`RESULTADO`).
 */
export function registrarResultadoInspeccion(
  idInspeccion: number,
  dto: RegistrarResultadoDTO
) {
  // 1. Verificar idempotencia por idLocal (RN-12)
  if (dto.idLocal) {
    const existentePorIdLocal = db
      .prepare('SELECT * FROM resultado_inspeccion WHERE id_local = ?')
      .get(dto.idLocal) as any;
    if (existentePorIdLocal) {
      const evidenciasActuales = db
        .prepare('SELECT * FROM evidencia WHERE id_inspeccion = ? ORDER BY id_evidencia ASC')
        .all(idInspeccion);
      return {
        resultado: existentePorIdLocal,
        evidencias: evidenciasActuales,
        yaExistiaPorIdLocal: true
      };
    }
  }

  const cita = db
    .prepare('SELECT * FROM inspeccion WHERE id_inspeccion = ?')
    .get(idInspeccion) as any;

  if (!cita) {
    throw new Error(`La inspección #${idInspeccion} no existe.`);
  }

  // Normalizar campos si vienen desde el cliente simplificado de Flutter
  const estadoTecho = (dto.estadoTecho || dto.resultado || EstadoTecho.BUENO).toUpperCase() as EstadoTecho;
  const hallazgos =
    dto.hallazgos || dto.notas || 'Revisión completa de cubierta, cumbrera y tapajuntas.';

  // 2. Procesar fotos adjuntas en el payload si vienen incluidas
  const nuevasEvidencias: RegistrarEvidenciaDTO[] = [];
  if (Array.isArray(dto.evidencias)) {
    nuevasEvidencias.push(...dto.evidencias);
  }
  if (Array.isArray(dto.fotos)) {
    dto.fotos.forEach((url, idx) => {
      if (url && url.trim()) {
        nuevasEvidencias.push({
          tipo: TipoEvidencia.FOTO_TECHO,
          rutaArchivo: url.trim(),
          descripcion: `Fotografía de techo #${idx + 1}`,
          idLocal: dto.idLocal ? `${dto.idLocal}-foto-${idx + 1}` : undefined,
          registradoSinSenal: dto.registradoSinSenal,
          capturadaEn: dto.registradoEn
        });
      }
    });
  }

  // Contar fotos ya registradas en la base + nuevas del payload
  const conteoExistentes = db
    .prepare(
      `SELECT COUNT(*) AS total FROM evidencia WHERE id_inspeccion = ? AND tipo IN ('FOTO_TECHO', 'FOTO_FACHADA')`
    )
    .get(idInspeccion) as { total: number };

  if ((conteoExistentes?.total || 0) + nuevasEvidencias.length === 0) {
    throw new ErrorEvidenciaRequeridaRN11(idInspeccion);
  }

  // Guardar las nuevas evidencias fotográficas
  for (const ev of nuevasEvidencias) {
    registrarEvidencia(idInspeccion, ev);
  }

  const registradoEn = dto.registradoEn || new Date().toISOString();
  const sincronizadoEn = dto.registradoSinSenal ? new Date().toISOString() : registradoEn;
  const urlReportePdf = `/api/inspecciones/${idInspeccion}/reporte-html`;

  // Verificar si ya había resultado para esta inspección
  const resultadoPrevio = db
    .prepare('SELECT * FROM resultado_inspeccion WHERE id_inspeccion = ?')
    .get(idInspeccion) as any;

  if (resultadoPrevio) {
    db.prepare(
      `
      UPDATE resultado_inspeccion
      SET estado_techo = ?,
          hallazgos = ?,
          requiere_reparacion = ?,
          urgencia = ?,
          recomendaciones = ?,
          url_reporte_pdf = ?,
          id_local = COALESCE(id_local, ?),
          sincronizado_en = ?
      WHERE id_inspeccion = ?
    `
    ).run(
      estadoTecho,
      hallazgos,
      dto.requiereReparacion ? 1 : 0,
      dto.urgencia || (dto.requiereReparacion ? 'MEDIA' : null),
      dto.recomendaciones || 'Mantener limpieza de canaletas y revisión anual.',
      urlReportePdf,
      dto.idLocal || null,
      sincronizadoEn,
      idInspeccion
    );
  } else {
    db.prepare(
      `
      INSERT INTO resultado_inspeccion (
        id_inspeccion, estado_techo, hallazgos, requiere_reparacion,
        urgencia, recomendaciones, url_reporte_pdf, id_local,
        registrado_sin_senal, registrado_en, sincronizado_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      idInspeccion,
      estadoTecho,
      hallazgos,
      dto.requiereReparacion ? 1 : 0,
      dto.urgencia || (dto.requiereReparacion ? 'MEDIA' : null),
      dto.recomendaciones || 'Mantener limpieza de canaletas y revisión anual.',
      urlReportePdf,
      dto.idLocal || null,
      dto.registradoSinSenal ? 1 : 0,
      registradoEn,
      sincronizadoEn
    );
  }

  // Asegurar que el trayecto esté cerrado y la cita pase a COMPLETADA
  const trayectoActivo = db
    .prepare(`SELECT * FROM trayecto WHERE id_inspeccion = ? AND estado = 'ACTIVO'`)
    .get(idInspeccion) as any;
  if (trayectoActivo) {
    cerrarTrayecto(trayectoActivo.id_trayecto, 'LLEGADA', registradoEn);
  }

  const citaActual = db
    .prepare('SELECT estado FROM inspeccion WHERE id_inspeccion = ?')
    .get(idInspeccion) as { estado: string };

  if (citaActual.estado !== EstadoInspeccion.COMPLETADA) {
    if (citaActual.estado !== EstadoInspeccion.EN_SITIO) {
      if (citaActual.estado !== EstadoInspeccion.EN_CAMINO) {
        transicionar(
          idInspeccion,
          EstadoInspeccion.EN_CAMINO,
          'u-insp-001',
          OrigenTransicion.APP_INSP,
          'Trayecto previo a captura de resultado'
        );
      }
      transicionar(
        idInspeccion,
        EstadoInspeccion.EN_SITIO,
        'u-insp-001',
        OrigenTransicion.APP_INSP,
        'Llegada previa a captura de resultado'
      );
    }

    transicionar(
      idInspeccion,
      EstadoInspeccion.COMPLETADA,
      'u-insp-001',
      OrigenTransicion.APP_INSP,
      `Inspección completada (${estadoTecho}) con reporte PDF disponible`
    );
  }

  // Encolar y despachar notificación RESULTADO ("Ya está disponible su reporte")
  try {
    encolarNotificacion({
      idInspeccion,
      tipo: TipoNotificacion.RESULTADO,
      programadaPara: sincronizadoEn
    });
    despacharNotificacionesPendientes(sincronizadoEn);
  } catch (err) {
    if (!(err instanceof ErrorNotificacionDuplicadaRN13)) {
      throw err;
    }
  }

  const resultadoGuardado = db
    .prepare('SELECT * FROM resultado_inspeccion WHERE id_inspeccion = ?')
    .get(idInspeccion) as any;
  const evidenciasGuardadas = db
    .prepare('SELECT * FROM evidencia WHERE id_inspeccion = ? ORDER BY id_evidencia ASC')
    .all(idInspeccion) as any[];

  if (dto.idLocal) {
    db.prepare(
      `
      INSERT OR IGNORE INTO operacion_sincronizada (id_local, tipo_operacion, id_inspeccion, ocurrido_en, respuesta_json)
      VALUES (?, 'RESULTADO', ?, ?, ?)
    `
    ).run(
      dto.idLocal,
      idInspeccion,
      registradoEn,
      JSON.stringify({ resultado: resultadoGuardado, evidencias: evidenciasGuardadas })
    );
  }

  return {
    resultado: resultadoGuardado,
    evidencias: evidenciasGuardadas,
    yaExistiaPorIdLocal: false
  };
}

/**
 * E11 — Registrar cliente ausente con foto de fachada y nota obligatoria (RN-10 y RN-12).
 * POST /api/inspecciones/:id/ausente
 */
export function registrarClienteAusente(
  idInspeccion: number,
  dto: RegistrarClienteAusenteDTO
) {
  if (dto.idLocal) {
    const syncPrevia = db
      .prepare('SELECT * FROM operacion_sincronizada WHERE id_local = ?')
      .get(dto.idLocal) as any;
    if (syncPrevia) {
      return {
        ...JSON.parse(syncPrevia.respuesta_json),
        yaExistiaPorIdLocal: true
      };
    }
  }

  const nota = (dto.nota || dto.motivo || '').trim();
  const rutaFoto = (dto.rutaFotoEvidencia || dto.fotoEvidencia || '').trim();

  if (!rutaFoto) {
    throw new ErrorAusenciaSinEvidenciaRN10('falta la fotografía de la fachada / puerta');
  }
  if (!nota) {
    throw new ErrorAusenciaSinEvidenciaRN10('falta la nota obligatoria del inspector');
  }

  const cita = db
    .prepare('SELECT * FROM inspeccion WHERE id_inspeccion = ?')
    .get(idInspeccion) as any;

  if (!cita) {
    throw new Error(`La inspección #${idInspeccion} no existe.`);
  }

  const ocurridoEn = dto.ocurridoEn || new Date().toISOString();

  // 1. Registrar la evidencia fotográfica de ausencia (FOTO_AUSENCIA)
  const { evidencia } = registrarEvidencia(idInspeccion, {
    tipo: TipoEvidencia.FOTO_AUSENCIA,
    rutaArchivo: rutaFoto,
    descripcion: dto.descripcionFoto || `Evidencia de cliente ausente: ${nota}`,
    idLocal: dto.idLocal ? `${dto.idLocal}-foto-ausencia` : undefined,
    registradoSinSenal: dto.registradoSinSenal,
    capturadaEn: ocurridoEn
  });

  // 2. Cerrar trayecto activo si lo había
  const trayectoActivo = db
    .prepare(`SELECT * FROM trayecto WHERE id_inspeccion = ? AND estado = 'ACTIVO'`)
    .get(idInspeccion) as any;
  if (trayectoActivo) {
    cerrarTrayecto(trayectoActivo.id_trayecto, 'CLIENTE_AUSENTE', ocurridoEn);
  }

  // 3. Transicionar a CLIENTE_AUSENTE
  if (cita.estado !== EstadoInspeccion.CLIENTE_AUSENTE) {
    if (
      cita.estado !== EstadoInspeccion.EN_CAMINO &&
      cita.estado !== EstadoInspeccion.EN_SITIO
    ) {
      transicionar(
        idInspeccion,
        EstadoInspeccion.EN_CAMINO,
        'u-insp-001',
        OrigenTransicion.APP_INSP,
        'Trayecto hacia domicilio previo a reporte de ausencia'
      );
    }

    transicionar(
      idInspeccion,
      EstadoInspeccion.CLIENTE_AUSENTE,
      'u-insp-001',
      OrigenTransicion.APP_INSP,
      `Cliente ausente (RN-10): ${nota}`
    );
  }

  // 4. Opcional: Crear cita de reintento ligada por id_inspeccion_origen
  let citaReintento = null;
  if (dto.crearCitaReintento && dto.fechaReintento) {
    citaReintento = crearInspeccion({
      idCliente: cita.id_cliente,
      idDomicilio: cita.id_domicilio,
      idInspector: cita.id_inspector,
      fechaProgramada: dto.fechaReintento,
      ventanaInicio: dto.ventanaInicioReintento || cita.ventana_inicio,
      ventanaFin: dto.ventanaFinReintento || cita.ventana_fin,
      motivoVisita: `Reintento de ${cita.folio}: ${cita.motivo_visita || 'Inspección de techo'}`,
      notas: `Segunda visita originada por ausencia en ${cita.folio}`
    });
    db.prepare('UPDATE inspeccion SET id_inspeccion_origen = ? WHERE id_inspeccion = ?').run(
      idInspeccion,
      citaReintento.id_inspeccion
    );
  }

  const respuesta = {
    idInspeccion,
    folio: cita.folio,
    estado: EstadoInspeccion.CLIENTE_AUSENTE,
    nota,
    evidenciaAusencia: evidencia,
    citaReintento,
    ocurridoEn
  };

  if (dto.idLocal) {
    db.prepare(
      `
      INSERT OR IGNORE INTO operacion_sincronizada (id_local, tipo_operacion, id_inspeccion, ocurrido_en, respuesta_json)
      VALUES (?, 'CLIENTE_AUSENTE', ?, ?, ?)
    `
    ).run(dto.idLocal, idInspeccion, ocurridoEn, JSON.stringify(respuesta));
  }

  return {
    ...respuesta,
    yaExistiaPorIdLocal: false
  };
}

/**
 * E11 — Endpoint `POST /api/sincronizar` con idempotencia estricta por `id_local` (RN-12).
 * Procesa en orden el lote de operaciones encoladas en SQLite en el teléfono del inspector (Anuar)
 * cuando recupera la conexión tras estar en modo avión o zona sin cobertura.
 */
export function sincronizarLoteOffline(dto: LoteSincronizacionDTO) {
  if (!Array.isArray(dto.operaciones)) {
    throw new Error('El lote de sincronización debe incluir un arreglo "operaciones".');
  }

  let aplicadasNuevas = 0;
  let ignoradasPorIdempotencia = 0;
  const resultados: any[] = [];

  for (const op of dto.operaciones) {
    if (!op.idLocal || !op.tipoOperacion || !op.idInspeccion) {
      throw new Error('Cada operación del lote requiere idLocal, tipoOperacion e idInspeccion.');
    }

    // Verificar si esta operación ya fue sincronizada antes (RN-12)
    const yaSincronizada = db
      .prepare('SELECT * FROM operacion_sincronizada WHERE id_local = ?')
      .get(op.idLocal) as any;

    if (yaSincronizada) {
      ignoradasPorIdempotencia++;
      resultados.push({
        idLocal: op.idLocal,
        tipoOperacion: op.tipoOperacion,
        idInspeccion: op.idInspeccion,
        sincronizada: true,
        yaExistiaPorIdLocal: true,
        detalle: JSON.parse(yaSincronizada.respuesta_json)
      });
      continue;
    }

    let resOp: any;
    switch (op.tipoOperacion) {
      case 'LLEGADA':
        resOp = registrarLlegadaInspector(op.idInspeccion, {
          ...op.datos,
          idLocal: op.idLocal,
          registradoSinSenal: true,
          ocurridoEn: op.ocurridoEn
        });
        break;

      case 'EVIDENCIA':
        resOp = registrarEvidencia(op.idInspeccion, {
          tipo: op.datos.tipo || TipoEvidencia.FOTO_TECHO,
          rutaArchivo: op.datos.rutaArchivo || op.datos.urlFoto,
          descripcion: op.datos.descripcion,
          idLocal: op.idLocal,
          registradoSinSenal: true,
          capturadaEn: op.ocurridoEn
        });
        break;

      case 'RESULTADO':
        resOp = registrarResultadoInspeccion(op.idInspeccion, {
          estadoTecho: op.datos.estadoTecho || EstadoTecho.BUENO,
          hallazgos: op.datos.hallazgos,
          requiereReparacion: Boolean(op.datos.requiereReparacion),
          urgencia: op.datos.urgencia,
          recomendaciones: op.datos.recomendaciones,
          evidencias: op.datos.evidencias,
          fotos: op.datos.fotos,
          idLocal: op.idLocal,
          registradoSinSenal: true,
          registradoEn: op.ocurridoEn
        });
        break;

      case 'CLIENTE_AUSENTE':
        resOp = registrarClienteAusente(op.idInspeccion, {
          nota: op.datos.nota || op.datos.motivo,
          rutaFotoEvidencia: op.datos.rutaFotoEvidencia || op.datos.fotoEvidencia,
          descripcionFoto: op.datos.descripcionFoto,
          idLocal: op.idLocal,
          registradoSinSenal: true,
          ocurridoEn: op.ocurridoEn
        });
        break;

      default:
        throw new Error(`Tipo de operación no soportado en sincronización: ${op.tipoOperacion}`);
    }

    if (resOp.yaExistiaPorIdLocal) {
      ignoradasPorIdempotencia++;
    } else {
      aplicadasNuevas++;
    }

    resultados.push({
      idLocal: op.idLocal,
      tipoOperacion: op.tipoOperacion,
      idInspeccion: op.idInspeccion,
      sincronizada: true,
      yaExistiaPorIdLocal: Boolean(resOp.yaExistiaPorIdLocal),
      detalle: resOp
    });
  }

  return {
    ok: true,
    totalRecibidas: dto.operaciones.length,
    aplicadasNuevas,
    ignoradasPorIdempotencia,
    sincronizadoEn: new Date().toISOString(),
    resultados
  };
}

/**
 * E11 — Consulta del reporte completo de inspección y sus fotografías (`GET /api/inspecciones/:id/reporte`).
 */
export function obtenerReporteInspeccion(idInspeccion: number) {
  const cita = db
    .prepare(
      `
      SELECT i.*,
             c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.correo AS cliente_correo,
             d.calle, d.numero, d.colonia, d.ciudad, d.estado AS dom_estado, d.codigo_postal,
             ins.nombre AS inspector_nombre, ins.telefono AS inspector_telefono, ins.placa_vehiculo
      FROM inspeccion i
      JOIN cliente c ON i.id_cliente = c.id_cliente
      JOIN domicilio d ON i.id_domicilio = d.id_domicilio
      LEFT JOIN inspector ins ON i.id_inspector = ins.id_inspector
      WHERE i.id_inspeccion = ?
    `
    )
    .get(idInspeccion) as any;

  if (!cita) {
    throw new Error(`La inspección #${idInspeccion} no existe.`);
  }

  const resultado = db
    .prepare('SELECT * FROM resultado_inspeccion WHERE id_inspeccion = ?')
    .get(idInspeccion) as any;

  const evidencias = db
    .prepare('SELECT * FROM evidencia WHERE id_inspeccion = ? ORDER BY id_evidencia ASC')
    .all(idInspeccion) as any[];

  return {
    idInspeccion: cita.id_inspeccion,
    folio: cita.folio,
    fechaProgramada: cita.fecha_programada,
    ventana: `${cita.ventana_inicio} - ${cita.ventana_fin}`,
    estadoInspeccion: cita.estado,
    cliente: {
      nombre: cita.cliente_nombre,
      telefono: cita.cliente_telefono,
      correo: cita.cliente_correo
    },
    domicilio: {
      direccionCompleta: `${cita.numero} ${cita.calle}, ${cita.colonia}, ${cita.ciudad}, ${cita.dom_estado} ${cita.codigo_postal}`
    },
    inspector: {
      nombre: cita.inspector_nombre || 'Inspector Agave Roofing',
      telefono: cita.inspector_telefono || '+1-210-555-0100',
      placaVehiculo: cita.placa_vehiculo || 'TX-ROOF-01'
    },
    resultado: resultado
      ? {
          idResultado: resultado.id_resultado,
          estadoTecho: resultado.estado_techo,
          hallazgos: resultado.hallazgos,
          requiereReparacion: Boolean(resultado.requiere_reparacion),
          urgencia: resultado.urgencia,
          recomendaciones: resultado.recomendaciones,
          urlReportePdf: resultado.url_reporte_pdf || `/api/inspecciones/${idInspeccion}/reporte-html`,
          registradoSinSenal: Boolean(resultado.registrado_sin_senal),
          registradoEn: resultado.registrado_en,
          sincronizadoEn: resultado.sincronizado_en
        }
      : null,
    evidencias: evidencias.map((e) => ({
      idEvidencia: e.id_evidencia,
      tipo: e.tipo,
      rutaArchivo: e.ruta_archivo,
      descripcion: e.descripcion,
      capturadaEn: e.capturada_en
    }))
  };
}

/**
 * E11 — Genera una vista HTML imprimible como PDF del Reporte Técnico de Inspección de Techo.
 */
export function generarReporteHtml(idInspeccion: number): string {
  const rep = obtenerReporteInspeccion(idInspeccion);
  const res = rep.resultado;
  const colorEstado =
    res?.estadoTecho === 'BUENO'
      ? '#059669'
      : res?.estadoTecho === 'REGULAR'
        ? '#d97706'
        : '#dc2626';

  const fotosHtml = rep.evidencias
    .map(
      (ev) => `
      <div style="border:1px solid #cbd5e1; border-radius:10px; padding:10px; background:#f8fafc;">
        <img src="${ev.rutaArchivo}" alt="${ev.descripcion || 'Evidencia'}" style="width:100%; height:170px; object-fit:cover; border-radius:8px;" />
        <div style="font-size:12px; font-weight:bold; margin-top:6px; color:#0f172a;">${ev.tipo}</div>
        <div style="font-size:11px; color:#475569;">${ev.descripcion || ''}</div>
        <div style="font-size:10px; color:#64748b; margin-top:2px;">Capturada: ${ev.capturadaEn}</div>
      </div>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Inspección ${rep.folio} — Agave Roofing</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; max-width: 820px; margin: 24px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 999px; color: white; font-weight: bold; background: ${colorEstado}; font-size: 13px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
    .box { background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 13px; }
    .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px; }
    @media print { .no-print { display: none; } body { border: none; margin: 0; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px; text-align:right;">
    <button onclick="window.print()" style="background:#059669; color:white; border:none; padding:10px 18px; border-radius:8px; font-weight:bold; cursor:pointer;">
      🖨️ Imprimir / Guardar como PDF
    </button>
  </div>
  <div class="header">
    <div>
      <h1 style="margin:0; font-size:22px; color:#0f172a;">🌵 Agave Roofing — San Antonio, TX</h1>
      <p style="margin:4px 0 0; font-size:13px; color:#475569;">Reporte Técnico Oficial de Inspección de Techo · Folio <strong>${rep.folio}</strong></p>
    </div>
    <div style="text-align:right;">
      <span class="badge">Estado del Techo: ${res?.estadoTecho || 'EN PROCESO'}</span>
      <div style="font-size:11px; color:#64748b; margin-top:6px;">Fecha: ${rep.fechaProgramada} (${rep.ventana})</div>
    </div>
  </div>

  <div class="grid">
    <div class="box">
      <strong>Propietario / Cliente:</strong><br/>
      ${rep.cliente.nombre}<br/>
      Tel: ${rep.cliente.telefono}<br/>
      Domicilio: ${rep.domicilio.direccionCompleta}
    </div>
    <div class="box">
      <strong>Inspector Certificado:</strong><br/>
      ${rep.inspector.nombre}<br/>
      Unidad: ${rep.inspector.placaVehiculo}<br/>
      Tel: ${rep.inspector.telefono}
    </div>
  </div>

  <div class="box" style="margin-bottom:16px;">
    <h3 style="margin-top:0; font-size:15px;">1. Hallazgos Técnicos en Cubierta</h3>
    <p style="margin:0; line-height:1.5;">${res?.hallazgos || 'Sin hallazgos registrados aún.'}</p>
    <p style="margin:10px 0 0;">
      <strong>¿Requiere reparación?:</strong> ${res?.requiereReparacion ? `SÍ (Urgencia: ${res.urgencia || 'MEDIA'})` : 'NO — Mantenimiento preventivo'}
    </p>
  </div>

  <div class="box" style="margin-bottom:20px;">
    <h3 style="margin-top:0; font-size:15px;">2. Recomendaciones para el Propietario</h3>
    <p style="margin:0; line-height:1.5;">${res?.recomendaciones || 'N/A'}</p>
  </div>

  <h3 style="font-size:15px; margin-bottom:8px;">3. Evidencia Fotográfica (${rep.evidencias.length} fotos)</h3>
  <div class="photos">
    ${fotosHtml || '<p style="font-size:13px; color:#64748b;">Sin fotografías adjuntas.</p>'}
  </div>
</body>
</html>`;
}

/**
 * E11 — Mensajería directa Inspector <-> Cliente ligada a la inspección.
 */
export function listarMensajesInspeccion(idInspeccion: number) {
  const rows = db
    .prepare(
      `
      SELECT m.*, u.nombre_completo AS remitente_nombre
      FROM mensaje m
      LEFT JOIN usuario u ON m.de_usuario = u.id_usuario
      WHERE m.id_inspeccion = ?
      ORDER BY m.enviado_en ASC, m.id_mensaje ASC
    `
    )
    .all(idInspeccion) as any[];

  return rows.map((r) => ({
    idMensaje: r.id_mensaje,
    idInspeccion: r.id_inspeccion,
    deUsuario: r.de_usuario,
    paraUsuario: r.para_usuario,
    remitenteRol: r.remitente_rol,
    remitenteNombre:
      r.remitente_nombre || (r.remitente_rol === 'INSPECTOR' ? 'Inspector Agave' : 'Cliente'),
    texto: r.texto,
    enviadoEn: r.enviado_en,
    leidoEn: r.leido_en
  }));
}

export function enviarMensajeInspeccion(idInspeccion: number, dto: EnviarMensajeDTO) {
  if (!dto.texto || !dto.texto.trim()) {
    throw new Error('El texto del mensaje no puede estar vacío.');
  }

  const cita = db
    .prepare(
      `
      SELECT i.*, c.id_usuario AS cliente_usuario_id, ins.id_usuario AS inspector_usuario_id
      FROM inspeccion i
      JOIN cliente c ON i.id_cliente = c.id_cliente
      LEFT JOIN inspector ins ON i.id_inspector = ins.id_inspector
      WHERE i.id_inspeccion = ?
    `
    )
    .get(idInspeccion) as any;

  if (!cita) {
    throw new Error(`La inspección #${idInspeccion} no existe.`);
  }

  const remitenteRol = dto.remitenteRol || 'INSPECTOR';
  const deUsuario =
    dto.deUsuario ||
    (remitenteRol === 'INSPECTOR'
      ? cita.inspector_usuario_id || 'u-insp-001'
      : cita.cliente_usuario_id || 'u-cli-001');
  const paraUsuario =
    dto.paraUsuario ||
    (remitenteRol === 'INSPECTOR'
      ? cita.cliente_usuario_id || 'u-cli-001'
      : cita.inspector_usuario_id || 'u-insp-001');

  const enviadoEn = new Date().toISOString();

  const res = db
    .prepare(
      `
      INSERT INTO mensaje (id_inspeccion, de_usuario, para_usuario, remitente_rol, texto, enviado_en)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .run(idInspeccion, deUsuario, paraUsuario, remitenteRol, dto.texto.trim(), enviadoEn);

  // Si el inspector le escribe al cliente, encolar notificación urgente MENSAJE
  if (remitenteRol === 'INSPECTOR') {
    try {
      encolarNotificacion({
        idInspeccion,
        tipo: TipoNotificacion.MENSAJE,
        programadaPara: enviadoEn,
        reenvioManual: true, // Permite varios mensajes por cita
        variablesExtras: {
          texto: dto.texto.trim()
        }
      });
      despacharNotificacionesPendientes(enviadoEn);
    } catch {
      // No bloquear el chat si falla el push secundario
    }
  }

  const creado = db
    .prepare(
      `
      SELECT m.*, u.nombre_completo AS remitente_nombre
      FROM mensaje m
      LEFT JOIN usuario u ON m.de_usuario = u.id_usuario
      WHERE m.id_mensaje = ?
    `
    )
    .get(Number(res.lastInsertRowid)) as any;

  return {
    idMensaje: creado.id_mensaje,
    idInspeccion: creado.id_inspeccion,
    deUsuario: creado.de_usuario,
    paraUsuario: creado.para_usuario,
    remitenteRol: creado.remitente_rol,
    remitenteNombre: creado.remitente_nombre,
    texto: creado.texto,
    enviadoEn: creado.enviado_en
  };
}

/**
 * E11 — Purga de puntos GPS con más de 30 días (RN-17 y Riesgo R7 de privacidad).
 * Conserva intactos `distancia_m` y `duracion_s` en la tabla `trayecto`.
 */
export function purgarPuntosGpsAntiguos(diasRetencion?: number, ahoraISO?: string) {
  const rowDias = db
    .prepare("SELECT valor FROM configuracion WHERE clave = 'retencion_puntos_dias'")
    .get() as { valor: string } | undefined;
  const dias = diasRetencion ?? (rowDias ? parseInt(rowDias.valor, 10) : 30);

  const refMs = ahoraISO ? new Date(ahoraISO).getTime() : Date.now();
  const limiteISO = new Date(refMs - dias * 24 * 3600 * 1000).toISOString();

  const res = db
    .prepare('DELETE FROM punto_ubicacion WHERE capturado_en < ?')
    .run(limiteISO);

  return {
    diasRetencion: dias,
    fechaCorteISO: limiteISO,
    puntosEliminados: Number(res.changes)
  };
}
