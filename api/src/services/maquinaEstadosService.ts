import { db } from '../db.ts';
import { EstadoInspeccion, OrigenTransicion, esTransicionValida } from '../../../shared/src/types/estados.ts';

export class ErrorTransicionInvalida extends Error {
  estadoActual: EstadoInspeccion;
  estadoNuevo: EstadoInspeccion;

  constructor(estadoActual: EstadoInspeccion, estadoNuevo: EstadoInspeccion) {
    super(`Transición inválida de [${estadoActual}] hacia [${estadoNuevo}] (Violación de RN-01)`);
    this.name = 'ErrorTransicionInvalida';
    this.estadoActual = estadoActual;
    this.estadoNuevo = estadoNuevo;
  }
}

/**
 * Servicio centralizado de la Máquina de Estados (RN-01 / E07 Jorge BD).
 * Ningún código en el sistema debe modificar el campo 'estado' de una inspección
 * sin pasar por esta función, garantizando consistencia e historial inmutable.
 */
export function transicionar(
  idInspeccion: number,
  nuevoEstado: EstadoInspeccion,
  idUsuario?: string,
  origen: OrigenTransicion = 'SISTEMA',
  nota?: string
): { idInspeccion: number; estadoAnterior: EstadoInspeccion; estadoNuevo: EstadoInspeccion } {
  const row = db.prepare('SELECT id_inspeccion, estado FROM inspeccion WHERE id_inspeccion = ?').get(idInspeccion) as {
    id_inspeccion: number;
    estado: string;
  } | undefined;

  if (!row) {
    throw new Error(`Inspección con id ${idInspeccion} no encontrada`);
  }

  const estadoActual = row.estado as EstadoInspeccion;

  // Si ya se encuentra en ese estado, no hacemos nada
  if (estadoActual === nuevoEstado) {
    return { idInspeccion, estadoAnterior: estadoActual, estadoNuevo };
  }

  // Validar si la transición está permitida por la máquina de estados oficial
  if (!esTransicionValida(estadoActual, nuevoEstado)) {
    throw new ErrorTransicionInvalida(estadoActual, nuevoEstado);
  }

  // Ejecutar actualización e inserción de historial de manera atómica
  const updateStmt = db.prepare(`
    UPDATE inspeccion
    SET estado = ?, actualizado_en = datetime('now')
    WHERE id_inspeccion = ?
  `);

  const insertHistorialStmt = db.prepare(`
    INSERT INTO inspeccion_historial (
      id_inspeccion, estado_anterior, estado_nuevo, id_usuario, origen, nota, ocurrido_en
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  updateStmt.run(nuevoEstado, idInspeccion);
  insertHistorialStmt.run(idInspeccion, estadoActual, nuevoEstado, idUsuario || null, origen, nota || null);

  return {
    idInspeccion,
    estadoAnterior: estadoActual,
    estadoNuevo: nuevoEstado
  };
}

/**
 * Obtener la línea de tiempo e historial de una inspección
 */
export function obtenerHistorial(idInspeccion: number) {
  return db.prepare(`
    SELECT h.id_historial, h.estado_anterior, h.estado_nuevo, h.origen, h.nota, h.ocurrido_en,
           u.nombre_completo AS usuario_nombre
    FROM inspeccion_historial h
    LEFT JOIN usuario u ON h.id_usuario = u.id_usuario
    WHERE h.id_inspeccion = ?
    ORDER BY h.id_historial ASC
  `).all(idInspeccion);
}
