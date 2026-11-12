import { db } from '../db.ts';
import type { CitaClienteDTO } from '../../../shared/src/types/dtos.ts';
import { EstadoInspeccion } from '../../../shared/src/types/estados.ts';
import { obtenerSeguimientoVivo } from './trayectoService.ts';
import { listarMensajesInspeccion } from './ejecucionSincronizacionService.ts';

export interface MisCitasResponse {
  proximaCita: CitaClienteDTO | null;
  historial: CitaClienteDTO[];
}

/**
 * Servicio para Mis Citas del Cliente (E07 / E08 / E09 / E10 / E11 Jesús CL / Jorge BD).
 * GET /inspecciones/mias
 * Retorna la próxima cita destacada y el listado histórico de inspecciones pasadas.
 */
export function obtenerMisCitas(idCliente: number): MisCitasResponse {
  const rows = db.prepare(`
    SELECT 
      i.id_inspeccion, i.folio, i.fecha_programada, i.ventana_inicio, i.ventana_fin,
      i.estado, i.motivo_visita, i.veces_reprogramada, i.confirmado_en, i.presencia_confirmada_en,
      c.canal_preferido,
      d.calle, d.numero, d.colonia, d.ciudad, d.codigo_postal,
      insp.id_inspector, insp.nombre AS inspector_nombre, insp.telefono AS inspector_telefono,
      insp.placa_vehiculo, insp.url_foto
    FROM inspeccion i
    JOIN cliente c ON i.id_cliente = c.id_cliente
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

    // Cargar notificaciones enviadas de esta cita (E08)
    const notifRows = db.prepare(`
      SELECT id_notificacion, tipo, canal, estado, titulo_renderizado, cuerpo_renderizado, enviada_en, entregada_en
      FROM notificacion
      WHERE id_inspeccion = ?
      ORDER BY id_notificacion DESC
    `).all(r.id_inspeccion) as any[];

    const notificaciones = notifRows.map((n) => ({
      idNotificacion: n.id_notificacion,
      tipo: n.tipo,
      canal: n.canal,
      estado: n.estado,
      titulo: n.titulo_renderizado || undefined,
      cuerpo: n.cuerpo_renderizado || undefined,
      enviadaEn: n.enviada_en || undefined,
      entregadaEn: n.entregada_en || undefined
    }));

    // Cargar última solicitud de reprogramación si existe (E09)
    const reprogRow = db.prepare(`
      SELECT id_reprogramacion, fecha_solicitada, ventana_inicio_solicitada, ventana_fin_solicitada,
             estado, motivo, motivo_rechazo
      FROM reprogramacion
      WHERE id_inspeccion = ?
      ORDER BY id_reprogramacion DESC
      LIMIT 1
    `).get(r.id_inspeccion) as any;

    // Cargar resultado de inspección y fotos si existe (E11)
    const resRow = db
      .prepare('SELECT * FROM resultado_inspeccion WHERE id_inspeccion = ?')
      .get(r.id_inspeccion) as any;

    let resultado = undefined;
    if (resRow) {
      const evRows = db
        .prepare('SELECT * FROM evidencia WHERE id_inspeccion = ? ORDER BY id_evidencia ASC')
        .all(r.id_inspeccion) as any[];
      resultado = {
        idResultado: resRow.id_resultado,
        estadoTecho: resRow.estado_techo,
        hallazgos: resRow.hallazgos,
        requiereReparacion: Boolean(resRow.requiere_reparacion),
        urgencia: resRow.urgencia || undefined,
        recomendaciones: resRow.recomendaciones || undefined,
        urlReportePdf: resRow.url_reporte_pdf || `/api/inspecciones/${r.id_inspeccion}/reporte-html`,
        registradoEn: resRow.registrado_en,
        evidencias: evRows.map((ev) => ({
          idEvidencia: ev.id_evidencia,
          tipo: ev.tipo,
          rutaArchivo: ev.ruta_archivo,
          descripcion: ev.descripcion || undefined,
          capturadaEn: ev.capturada_en
        }))
      };
    }

    const seguimientoVivo = obtenerSeguimientoVivo(r.id_inspeccion);
    const mensajes = listarMensajesInspeccion(r.id_inspeccion);

    return {
      idInspeccion: r.id_inspeccion,
      folio: r.folio,
      fechaProgramada: r.fecha_programada,
      ventanaInicio: r.ventana_inicio,
      ventanaFin: r.ventana_fin,
      estado: r.estado as EstadoInspeccion,
      motivoVisita: r.motivo_visita || undefined,
      vecesReprogramada: r.veces_reprogramada ?? 0,
      confirmadoEn: r.confirmado_en || undefined,
      presenciaConfirmadaEn: r.presencia_confirmada_en || undefined,
      canalPreferidoCliente: r.canal_preferido || 'PUSH',
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
      lineaDeTiempo,
      notificaciones,
      ultimaReprogramacion: reprogRow ? {
        idReprogramacion: reprogRow.id_reprogramacion,
        fechaSolicitada: reprogRow.fecha_solicitada,
        ventanaInicioSolicitada: reprogRow.ventana_inicio_solicitada,
        ventanaFinSolicitada: reprogRow.ventana_fin_solicitada || undefined,
        estado: reprogRow.estado,
        motivo: reprogRow.motivo || undefined,
        motivoRechazo: reprogRow.motivo_rechazo || undefined
      } : undefined,
      seguimientoVivo,
      resultado,
      mensajes
    };
  });

  // Próxima cita: la cita activa más próxima en fecha presente/futura, o la activa más reciente
  const hoy = new Date().toISOString().split('T')[0];
  const activas = citas.filter(
    (c) => !['COMPLETADA', 'CANCELADA', 'CLIENTE_AUSENTE'].includes(c.estado)
  );
  const proximaCita =
    activas.find((c) => c.fechaProgramada >= hoy) ||
    activas[0] ||
    null;

  // Historial: citas pasadas o terminadas
  const historial = citas.filter((c) => c.idInspeccion !== proximaCita?.idInspeccion);

  return {
    proximaCita,
    historial
  };
}
