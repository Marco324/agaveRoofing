import { db } from '../db.ts';
import type { RutaParadaDTO } from '../../../shared/src/types/dtos.ts';
import { EstadoInspeccion } from '../../../shared/src/types/estados.ts';

/**
 * Servicio para la Ruta del Día del Inspector (E07 Anuar IN / Jorge BD).
 * GET /inspecciones/mi-ruta?fecha=YYYY-MM-DD
 * Retorna las paradas ordenadas cronológicamente por ventana de atención.
 */
export function obtenerRutaDelDia(idInspector: number, fecha: string): RutaParadaDTO[] {
  const rows = db.prepare(`
    SELECT 
      i.id_inspeccion, i.folio, i.fecha_programada, i.ventana_inicio, i.ventana_fin,
      i.estado, i.motivo_visita, i.notas,
      c.id_cliente, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
      d.id_domicilio, d.calle, d.numero, d.colonia, d.ciudad, d.estado AS domicilio_estado,
      d.codigo_postal, d.referencias, d.latitud, d.longitud
    FROM inspeccion i
    JOIN cliente c ON i.id_cliente = c.id_cliente
    JOIN domicilio d ON i.id_domicilio = d.id_domicilio
    WHERE i.id_inspector = ?
      AND i.fecha_programada = ?
      AND i.estado NOT IN ('CANCELADA')
    ORDER BY i.ventana_inicio ASC
  `).all(idInspector, fecha) as any[];

  return rows.map((r) => ({
    idInspeccion: r.id_inspeccion,
    folio: r.folio,
    fechaProgramada: r.fecha_programada,
    ventanaInicio: r.ventana_inicio,
    ventanaFin: r.ventana_fin,
    estado: r.estado as EstadoInspeccion,
    motivoVisita: r.motivo_visita || undefined,
    notas: r.notas || undefined,
    cliente: {
      idCliente: r.id_cliente,
      nombre: r.cliente_nombre,
      telefono: r.cliente_telefono
    },
    domicilio: {
      idDomicilio: r.id_domicilio,
      direccionCompleta: `${r.calle} #${r.numero}`,
      colonia: r.colonia,
      ciudad: r.ciudad,
      estado: r.domicilio_estado,
      codigoPostal: r.codigo_postal,
      referencias: r.referencias || undefined,
      latitud: r.latitud ? Number(r.latitud) : undefined,
      longitud: r.longitud ? Number(r.longitud) : undefined
    }
  }));
}
