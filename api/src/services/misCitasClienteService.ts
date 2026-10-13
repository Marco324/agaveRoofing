import { db } from '../db.ts';
import type { CitaClienteDTO } from '../../../shared/src/types/dtos.ts';
import { EstadoInspeccion } from '../../../shared/src/types/estados.ts';

export interface MisCitasResponse {
  proximaCita: CitaClienteDTO | null;
  historial: CitaClienteDTO[];
}

/**
 * Servicio para Mis Citas del Cliente (E07 Jesús CL / Jorge BD).
 * GET /inspecciones/mias
 * Retorna la próxima cita destacada y el listado histórico de inspecciones pasadas.
 */
export function obtenerMisCitas(idCliente: number): MisCitasResponse {
  const rows = db.prepare(`
    SELECT 
      i.id_inspeccion, i.folio, i.fecha_programada, i.ventana_inicio, i.ventana_fin,
      i.estado, i.motivo_visita,
      d.calle, d.numero, d.colonia, d.ciudad, d.codigo_postal,
      insp.id_inspector, insp.nombre AS inspector_nombre, insp.telefono AS inspector_telefono,
      insp.placa_vehiculo, insp.url_foto
    FROM inspeccion i
    JOIN domicilio d ON i.id_domicilio = d.id_domicilio
    LEFT JOIN inspector insp ON i.id_inspector = insp.id_inspector
    WHERE i.id_cliente = ?
    ORDER BY i.fecha_programada DESC, i.ventana_inicio DESC
  `).all(idCliente) as any[];

  const citas: CitaClienteDTO[] = rows.map((r) => {
    // Cargar línea de tiempo para cada cita
    const historialRows = db.prepare(`
      SELECT estado_nuevo, ocurrido_en, nota
      FROM inspeccion_historial
      WHERE id_inspeccion = ?
      ORDER BY id_historial ASC
    `).all(r.id_inspeccion) as any[];

    const lineaDeTiempo = historialRows.map((h) => ({
      estado: h.estado_nuevo as EstadoInspeccion,
      fechaHora: h.ocurrido_en,
      descripcion: h.nota || `Estado actualizado a ${h.estado_nuevo}`
    }));

    return {
      idInspeccion: r.id_inspeccion,
      folio: r.folio,
      fechaProgramada: r.fecha_programada,
      ventanaInicio: r.ventana_inicio,
      ventanaFin: r.ventana_fin,
      estado: r.estado as EstadoInspeccion,
      motivoVisita: r.motivo_visita || undefined,
      domicilio: {
        direccionCompleta: `${r.calle} #${r.numero}`,
        colonia: r.colonia,
        ciudad: r.ciudad,
        codigoPostal: r.codigo_postal
      },
      inspector: r.id_inspector ? {
        idInspector: r.id_inspector,
        nombre: r.inspector_nombre,
        telefono: r.inspector_telefono,
        placaVehiculo: r.placa_vehiculo || undefined,
        urlFoto: r.url_foto || undefined
      } : undefined,
      lineaDeTiempo
    };
  });

  // Próxima cita: la cita activa más próxima en fecha presente/futura
  const hoy = new Date().toISOString().split('T')[0];
  const proximaCita = citas.find(
    (c) => c.fechaProgramada >= hoy && !['COMPLETADA', 'CANCELADA', 'CLIENTE_AUSENTE'].includes(c.estado)
  ) || null;

  // Historial: citas pasadas o terminadas
  const historial = citas.filter((c) => c.idInspeccion !== proximaCita?.idInspeccion);

  return {
    proximaCita,
    historial
  };
}
