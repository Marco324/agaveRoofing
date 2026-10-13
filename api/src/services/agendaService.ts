import { db } from '../db.ts';
import { EstadoInspeccion, OrigenTransicion } from '../../../shared/src/types/estados.ts';
import type {
  CrearInspeccionDTO,
  MoverInspeccionDTO,
  ReasignarInspeccionDTO,
  CancelarInspeccionDTO,
  FiltroAgendaDTO
} from '../../../shared/src/types/dtos.ts';
import { generarFolio } from './folioService.ts';
import { transicionar } from './maquinaEstadosService.ts';

export class ErrorTraslapeInspector extends Error {
  idInspector: number;
  fecha: string;
  ventanaInicio: string;
  ventanaFin: string;
  folioConflicto: string;

  constructor(
    idInspector: number,
    fecha: string,
    ventanaInicio: string,
    ventanaFin: string,
    folioConflicto: string
  ) {
    super(
      `El inspector #${idInspector} ya cuenta con la cita [${folioConflicto}] en horario traslapado para el día ${fecha} (${ventanaInicio} - ${ventanaFin}). Violación de regla RN-02.`
    );
    this.name = 'ErrorTraslapeInspector';
    this.idInspector = idInspector;
    this.fecha = fecha;
    this.ventanaInicio = ventanaInicio;
    this.ventanaFin = ventanaFin;
    this.folioConflicto = folioConflicto;
  }
}

export class ErrorHorarioInvalido extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorHorarioInvalido';
  }
}

/**
 * Valida si un inspector tiene otra cita en la misma fecha cuya ventana de atención se traslape (RN-02).
 */
export function validarTraslapeInspector(
  idInspector: number,
  fecha: string,
  ventanaInicio: string,
  ventanaFin: string,
  excluirIdInspeccion?: number
): void {
  let sql = `
    SELECT id_inspeccion, folio, ventana_inicio, ventana_fin
    FROM inspeccion
    WHERE id_inspector = ?
      AND fecha_programada = ?
      AND estado NOT IN ('CANCELADA', 'COMPLETADA', 'CLIENTE_AUSENTE')
      AND (ventana_inicio < ? AND ventana_fin > ?)
  `;

  const params: any[] = [idInspector, fecha, ventanaFin, ventanaInicio];

  if (excluirIdInspeccion) {
    sql += ` AND id_inspeccion != ?`;
    params.push(excluirIdInspeccion);
  }

  const conflicto = db.prepare(sql).get(...params) as {
    id_inspeccion: number;
    folio: string;
    ventana_inicio: string;
    ventana_fin: string;
  } | undefined;

  if (conflicto) {
    throw new ErrorTraslapeInspector(
      idInspector,
      fecha,
      conflicto.ventana_inicio,
      conflicto.ventana_fin,
      conflicto.folio
    );
  }
}

/**
 * Valida que la ventana de atención cumpla con el horario de operación (RN-02 / RF-17).
 */
export function validarVentanaOperacion(inicio: string, fin: string): void {
  if (inicio >= fin) {
    throw new ErrorHorarioInvalido(`La hora de inicio (${inicio}) debe ser menor a la hora de fin (${fin}).`);
  }
  if (inicio < '07:00' || fin > '19:00') {
    throw new ErrorHorarioInvalido(`La cita (${inicio} - ${fin}) debe estar dentro del horario de operación (07:00 a 19:00).`);
  }
}

/**
 * Programar una nueva inspección con folio consecutivo y validación de traslapes.
 */
export function crearInspeccion(dto: CrearInspeccionDTO) {
  validarVentanaOperacion(dto.ventanaInicio, dto.ventanaFin);

  if (dto.idInspector) {
    validarTraslapeInspector(dto.idInspector, dto.fechaProgramada, dto.ventanaInicio, dto.ventanaFin);
  }

  const folio = generarFolio();

  const insertStmt = db.prepare(`
    INSERT INTO inspeccion (
      folio, id_cliente, id_domicilio, id_inspector,
      fecha_programada, ventana_inicio, ventana_fin, estado,
      motivo_visita, notas, veces_reprogramada, creada_por
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PROGRAMADA', ?, ?, 0, ?)
  `);

  const result = insertStmt.run(
    folio,
    dto.idCliente,
    dto.idDomicilio,
    dto.idInspector || null,
    dto.fechaProgramada,
    dto.ventanaInicio,
    dto.ventanaFin,
    dto.motivoVisita || 'Inspección de techo',
    dto.notas || null,
    dto.creadaPor || null
  );

  const idInspeccion = Number(result.lastInsertRowid);

  // Registro inicial en el historial
  db.prepare(`
    INSERT INTO inspeccion_historial (
      id_inspeccion, estado_anterior, estado_nuevo, id_usuario, origen, nota
    ) VALUES (?, null, 'PROGRAMADA', ?, 'PANEL', 'Cita agendada inicialmente en panel de administración')
  `).run(idInspeccion, dto.creadaPor || null);

  return obtenerInspeccionPorId(idInspeccion);
}

/**
 * Reasignar inspector a una cita existente con validación de traslape.
 */
export function reasignarInspector(idInspeccion: number, dto: ReasignarInspeccionDTO) {
  const cita = db.prepare('SELECT * FROM inspeccion WHERE id_inspeccion = ?').get(idInspeccion) as any;
  if (!cita) throw new Error(`Inspección #${idInspeccion} no existe.`);

  if (['EN_CAMINO', 'EN_SITIO', 'COMPLETADA', 'CLIENTE_AUSENTE', 'CANCELADA'].includes(cita.estado)) {
    throw new Error(`No se puede reasignar una inspección en estado ${cita.estado}.`);
  }

  // Validar si el nuevo inspector tiene traslape
  validarTraslapeInspector(dto.idInspector, cita.fecha_programada, cita.ventana_inicio, cita.ventana_fin, idInspeccion);

  db.prepare(`
    UPDATE inspeccion
    SET id_inspector = ?, actualizado_en = datetime('now')
    WHERE id_inspeccion = ?
  `).run(dto.idInspector, idInspeccion);

  const inspector = db.prepare('SELECT nombre FROM inspector WHERE id_inspector = ?').get(dto.idInspector) as any;

  db.prepare(`
    INSERT INTO inspeccion_historial (
      id_inspeccion, estado_anterior, estado_nuevo, id_usuario, origen, nota
    ) VALUES (?, ?, ?, ?, 'PANEL', ?)
  `).run(
    idInspeccion,
    cita.estado,
    cita.estado,
    dto.idUsuario || null,
    `Inspector reasignado a ${inspector?.nombre || dto.idInspector}. Motivo: ${dto.motivo || 'Reorganización de ruta'}`
  );

  return obtenerInspeccionPorId(idInspeccion);
}

/**
 * Mover o reprogramar fecha/hora de la cita (RN-05, RN-06).
 */
export function moverInspeccion(idInspeccion: number, dto: MoverInspeccionDTO) {
  const cita = db.prepare('SELECT * FROM inspeccion WHERE id_inspeccion = ?').get(idInspeccion) as any;
  if (!cita) throw new Error(`Inspección #${idInspeccion} no existe.`);

  // RN-05: El cliente o admin no puede mover citas activas en camino o completadas
  if (['EN_CAMINO', 'EN_SITIO', 'COMPLETADA', 'CLIENTE_AUSENTE', 'CANCELADA'].includes(cita.estado)) {
    throw new Error(`No se puede mover una inspección en estado ${cita.estado} (Violación RN-05).`);
  }

  // RN-06: Máximo 3 reprogramaciones
  if (cita.veces_reprogramada >= 3) {
    throw new Error(`Esta inspección ya ha alcanzado el límite de 3 reprogramaciones permitidas (Violación RN-06). Se requiere autorización especial.`);
  }

  validarVentanaOperacion(dto.nuevaVentanaInicio, dto.nuevaVentanaFin);

  if (cita.id_inspector) {
    validarTraslapeInspector(
      cita.id_inspector,
      dto.nuevaFecha,
      dto.nuevaVentanaInicio,
      dto.nuevaVentanaFin,
      idInspeccion
    );
  }

  // Registrar solicitud en tabla reprogramacion
  db.prepare(`
    INSERT INTO reprogramacion (
      id_inspeccion, fecha_anterior, ventana_inicio_anterior,
      fecha_solicitada, ventana_inicio_solicitada, motivo,
      solicitada_por, estado, resuelta_por, resuelta_en
    ) VALUES (?, ?, ?, ?, ?, ?, 'ADMINISTRADOR', 'APROBADA', ?, datetime('now'))
  `).run(
    idInspeccion,
    cita.fecha_programada,
    cita.ventana_inicio,
    dto.nuevaFecha,
    dto.nuevaVentanaInicio,
    dto.motivo || 'Reprogramación solicitada desde panel',
    dto.idUsuario || null
  );

  // Actualizar cita incrementando contador y conservando el folio
  db.prepare(`
    UPDATE inspeccion
    SET fecha_programada = ?,
        ventana_inicio = ?,
        ventana_fin = ?,
        veces_reprogramada = veces_reprogramada + 1,
        actualizado_en = datetime('now')
    WHERE id_inspeccion = ?
  `).run(dto.nuevaFecha, dto.nuevaVentanaInicio, dto.nuevaVentanaFin, idInspeccion);

  db.prepare(`
    INSERT INTO inspeccion_historial (
      id_inspeccion, estado_anterior, estado_nuevo, id_usuario, origen, nota
    ) VALUES (?, ?, ?, ?, 'PANEL', ?)
  `).run(
    idInspeccion,
    cita.estado,
    cita.estado,
    dto.idUsuario || null,
    `Cita reprogramada a ${dto.nuevaFecha} (${dto.nuevaVentanaInicio} - ${dto.nuevaVentanaFin}). Motivo: ${dto.motivo || 'Ajuste de agenda'}`
  );

  return obtenerInspeccionPorId(idInspeccion);
}

/**
 * Cancelar inspección con registro de motivo en el historial.
 */
export function cancelarInspeccion(idInspeccion: number, dto: CancelarInspeccionDTO) {
  return transicionar(
    idInspeccion,
    EstadoInspeccion.CANCELADA,
    dto.idUsuario,
    dto.origen,
    `Cancelada por: ${dto.motivo}`
  );
}

/**
 * Consultar agenda con filtros para el Panel del Administrador (Marco E07).
 */
export function listarAgenda(filtros: FiltroAgendaDTO = {}) {
  let sql = `
    SELECT 
      i.id_inspeccion, i.folio, i.fecha_programada, i.ventana_inicio, i.ventana_fin,
      i.estado, i.motivo_visita, i.notas, i.veces_reprogramada, i.creado_en,
      c.id_cliente, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
      d.id_domicilio, d.calle, d.numero, d.colonia, d.ciudad, d.estado AS domicilio_estado,
      d.codigo_postal, d.referencias, d.latitud, d.longitud,
      z.id_zona, z.nombre AS zona_nombre,
      insp.id_inspector, insp.nombre AS inspector_nombre, insp.placa_vehiculo, insp.url_foto
    FROM inspeccion i
    JOIN cliente c ON i.id_cliente = c.id_cliente
    JOIN domicilio d ON i.id_domicilio = d.id_domicilio
    LEFT JOIN zona z ON d.id_zona = z.id_zona
    LEFT JOIN inspector insp ON i.id_inspector = insp.id_inspector
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filtros.fecha) {
    sql += ` AND i.fecha_programada = ?`;
    params.push(filtros.fecha);
  } else if (filtros.fechaInicio && filtros.fechaFin) {
    sql += ` AND i.fecha_programada BETWEEN ? AND ?`;
    params.push(filtros.fechaInicio, filtros.fechaFin);
  }

  if (filtros.idInspector) {
    sql += ` AND i.id_inspector = ?`;
    params.push(filtros.idInspector);
  }

  if (filtros.idZona) {
    sql += ` AND d.id_zona = ?`;
    params.push(filtros.idZona);
  }

  if (filtros.estado) {
    sql += ` AND i.estado = ?`;
    params.push(filtros.estado);
  }

  sql += ` ORDER BY i.fecha_programada ASC, i.ventana_inicio ASC`;

  return db.prepare(sql).all(...params);
}

/**
 * Obtener detalle completo de una inspección incluyendo su línea de tiempo.
 */
export function obtenerInspeccionPorId(idInspeccion: number) {
  const cita = db.prepare(`
    SELECT 
      i.*,
      c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.correo AS cliente_correo,
      d.calle, d.numero, d.colonia, d.ciudad, d.estado AS domicilio_estado,
      d.codigo_postal, d.referencias, d.latitud, d.longitud,
      z.id_zona, z.nombre AS zona_nombre,
      insp.nombre AS inspector_nombre, insp.telefono AS inspector_telefono,
      insp.placa_vehiculo, insp.url_foto
    FROM inspeccion i
    JOIN cliente c ON i.id_cliente = c.id_cliente
    JOIN domicilio d ON i.id_domicilio = d.id_domicilio
    LEFT JOIN zona z ON d.id_zona = z.id_zona
    LEFT JOIN inspector insp ON i.id_inspector = insp.id_inspector
    WHERE i.id_inspeccion = ?
  `).get(idInspeccion) as any;

  if (!cita) return null;

  const historial = db.prepare(`
    SELECT h.*, u.nombre_completo AS usuario_nombre
    FROM inspeccion_historial h
    LEFT JOIN usuario u ON h.id_usuario = u.id_usuario
    WHERE h.id_inspeccion = ?
    ORDER BY h.id_historial ASC
  `).all(idInspeccion);

  return {
    ...cita,
    historial
  };
}
