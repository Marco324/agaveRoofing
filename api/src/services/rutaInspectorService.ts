import { db } from '../db.ts';
import type { RutaParadaDTO } from '../../../shared/src/types/dtos.ts';
import { EstadoInspeccion } from '../../../shared/src/types/estados.ts';
import { calcularDistanciaMetros } from './trayectoService.ts';

/**
 * Servicio para la Ruta del Día del Inspector (E07 / E09 / E10 / E11 Anuar IN / Jorge BD).
 * GET /inspecciones/mi-ruta?fecha=YYYY-MM-DD
 * Retorna las paradas ordenadas cronológicamente por ventana de atención.
 */
export function obtenerRutaDelDia(idInspector: number, fecha: string): RutaParadaDTO[] {
  const rows = db.prepare(`
    SELECT 
      i.id_inspeccion, i.folio, i.fecha_programada, i.ventana_inicio, i.ventana_fin,
      i.estado, i.motivo_visita, i.notas, i.confirmado_en, i.presencia_confirmada_en, i.veces_reprogramada,
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

  return rows.map((r) => {
    const trayecto = db
      .prepare(`SELECT * FROM trayecto WHERE id_inspeccion = ? AND estado = 'ACTIVO' LIMIT 1`)
      .get(r.id_inspeccion) as any;

    let trayectoActivo = undefined;
    if (trayecto) {
      const ultimoPunto = db
        .prepare(
          `SELECT * FROM punto_ubicacion WHERE id_trayecto = ? ORDER BY capturado_en DESC, id_punto DESC LIMIT 1`
        )
        .get(trayecto.id_trayecto) as any;
      const distRestanteM = ultimoPunto && r.latitud && r.longitud
        ? calcularDistanciaMetros(
            Number(ultimoPunto.latitud),
            Number(ultimoPunto.longitud),
            Number(r.latitud),
            Number(r.longitud)
          )
        : 0;

      trayectoActivo = {
        idTrayecto: trayecto.id_trayecto,
        etaMinutos: Math.max(1, Math.round((trayecto.eta_actual_s || 600) / 60)),
        etaAproximado: Boolean(trayecto.eta_aproximado),
        distanciaRestanteM: distRestanteM,
        ultimoPunto: ultimoPunto
          ? {
              latitud: Number(ultimoPunto.latitud),
              longitud: Number(ultimoPunto.longitud),
              capturadoEn: ultimoPunto.capturado_en
            }
          : undefined
      };
    }

    const resRow = db
      .prepare('SELECT * FROM resultado_inspeccion WHERE id_inspeccion = ?')
      .get(r.id_inspeccion) as any;
    const countFotos = db
      .prepare('SELECT COUNT(*) AS total FROM evidencia WHERE id_inspeccion = ?')
      .get(r.id_inspeccion) as { total: number };
    const countMensajes = db
      .prepare('SELECT COUNT(*) AS total FROM mensaje WHERE id_inspeccion = ?')
      .get(r.id_inspeccion) as { total: number };

    return {
      idInspeccion: r.id_inspeccion,
      folio: r.folio,
      fechaProgramada: r.fecha_programada,
      ventanaInicio: r.ventana_inicio,
      ventanaFin: r.ventana_fin,
      estado: r.estado as EstadoInspeccion,
      motivoVisita: r.motivo_visita || undefined,
      notas: r.notas || undefined,
      confirmadoEn: r.confirmado_en || undefined,
      presenciaConfirmadaEn: r.presencia_confirmada_en || undefined,
      vecesReprogramada: r.veces_reprogramada ?? 0,
      reprogramacionPendiente: r.estado === 'REPROG_SOLICITADA',
      trayectoActivo,
      resultado: resRow
        ? {
            estadoTecho: resRow.estado_techo,
            hallazgos: resRow.hallazgos,
            requiereReparacion: Boolean(resRow.requiere_reparacion),
            urgencia: resRow.urgencia || undefined,
            urlReportePdf: resRow.url_reporte_pdf || undefined
          }
        : undefined,
      totalFotos: countFotos?.total || 0,
      totalMensajes: countMensajes?.total || 0,
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
    };
  });
}
