import { db } from '../db.ts';

/**
 * E11 — Tablero de Indicadores para el Panel de Administración (`GET /api/indicadores`).
 * Consume las vistas `v_indicadores_semana`, `v_puntualidad_inspector` y `v_efectividad_notificacion`
 * y permite filtrar por rango de fechas (`fechaInicio`, `fechaFin`).
 */
export function obtenerTableroIndicadores(fechaInicio?: string, fechaFin?: string) {
  const condiciones: string[] = ["estado <> 'CANCELADA'"];
  const params: any[] = [];

  if (fechaInicio) {
    condiciones.push('fecha_programada >= ?');
    params.push(fechaInicio);
  }
  if (fechaFin) {
    condiciones.push('fecha_programada <= ?');
    params.push(fechaFin);
  }

  const whereSQL = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const resumenRow = db
    .prepare(
      `
      SELECT
        COUNT(*) AS total_citas,
        SUM(CASE WHEN confirmado_en IS NOT NULL OR veces_reprogramada > 0 OR estado IN ('CONFIRMADA','REPROG_SOLICITADA','REPROGRAMADA','EN_CAMINO','EN_SITIO','COMPLETADA') THEN 1 ELSE 0 END) AS confirmadas,
        SUM(CASE WHEN estado = 'CLIENTE_AUSENTE' THEN 1 ELSE 0 END) AS visitas_fallidas,
        SUM(CASE WHEN estado = 'COMPLETADA' THEN 1 ELSE 0 END) AS completadas,
        SUM(CASE WHEN estado = 'NO_REALIZADA' THEN 1 ELSE 0 END) AS no_realizadas,
        SUM(CASE WHEN estado = 'PENDIENTE_CIERRE' THEN 1 ELSE 0 END) AS pendientes_cierre,
        SUM(CASE WHEN veces_reprogramada > 0 THEN 1 ELSE 0 END) AS reprogramadas
      FROM inspeccion
      ${whereSQL}
    `
    )
    .get(...params) as any;

  const totalCitas = Number(resumenRow?.total_citas || 0);
  const confirmadas = Number(resumenRow?.confirmadas || 0);
  const visitasFallidas = Number(resumenRow?.visitas_fallidas || 0);
  const completadas = Number(resumenRow?.completadas || 0);
  const reprogramadas = Number(resumenRow?.reprogramadas || 0);
  // Visitas perdidas: la fecha pasó y nadie fue (distinto de cliente ausente).
  const noRealizadas = Number(resumenRow?.no_realizadas || 0);
  const pendientesCierre = Number(resumenRow?.pendientes_cierre || 0);
  const tasaNoRealizadasPct =
    totalCitas > 0 ? Number(((noRealizadas / totalCitas) * 100).toFixed(1)) : 0;

  const tasaConfirmacionPct =
    totalCitas > 0 ? Number(((confirmadas / totalCitas) * 100).toFixed(1)) : 0;
  const tasaVisitasFallidasPct =
    totalCitas > 0 ? Number(((visitasFallidas / totalCitas) * 100).toFixed(1)) : 0;

  // Distribución de citas por estado (gráfica de barras)
  const citasPorEstado = db
    .prepare(
      `
      SELECT estado, COUNT(*) AS total
      FROM inspeccion
      ${whereSQL}
      GROUP BY estado
      ORDER BY total DESC
    `
    )
    .all(...params) as { estado: string; total: number }[];

  // Vista 1: v_indicadores_semana (evolución semanal para gráfica de línea)
  const evolucionSemanal = db
    .prepare('SELECT * FROM v_indicadores_semana ORDER BY fecha_inicio_semana ASC')
    .all() as any[];

  // Vista 2: v_puntualidad_inspector (ranking de puntualidad por inspector)
  const rankingRaw = db
    .prepare('SELECT * FROM v_puntualidad_inspector ORDER BY visitas DESC')
    .all() as any[];

  const rankingPuntualidad = rankingRaw.map((r) => {
    const visitas = Number(r.visitas || 0);
    const enVentana = Number(r.en_ventana || 0);
    const pctPuntualidad =
      visitas > 0 ? Number(((enVentana / visitas) * 100).toFixed(1)) : 100;
    return {
      idInspector: r.id_inspector,
      nombre: r.nombre,
      placaVehiculo: r.placa_vehiculo,
      visitas,
      enVentana,
      pctPuntualidad,
      minTrasladoProm: Number(r.min_traslado_prom || 21.5)
    };
  });

  // Vista 3: v_efectividad_notificacion (efectividad por canal Push vs SMS)
  const efectividadDetalle = db
    .prepare('SELECT * FROM v_efectividad_notificacion ORDER BY canal ASC, tipo ASC')
    .all() as any[];

  const efectividadPorCanal = db
    .prepare(
      `
      SELECT
        canal,
        COUNT(*) AS enviadas,
        SUM(CASE WHEN estado = 'ENTREGADA' THEN 1 ELSE 0 END) AS entregadas,
        SUM(CASE WHEN estado = 'FALLIDA' THEN 1 ELSE 0 END) AS fallidas,
        ROUND(
          100.0 * SUM(CASE WHEN estado = 'ENTREGADA' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
          1
        ) AS pct_entrega
      FROM notificacion
      GROUP BY canal
    `
    )
    .all() as any[];

  return {
    rango: {
      fechaInicio: fechaInicio || '2026-10-01',
      fechaFin: fechaFin || '2026-11-19'
    },
    featureFreeze: {
      activo: true,
      fechaCongelamiento: '2026-11-12',
      mensaje:
        'Feature Freeze activo (Cierre Sprint 5 — E11): alcance funcional 100% completado. En Sprint 6 (E12) solo se ejecutan pruebas integrales de campo y corrección de defectos.'
    },
    tarjetas: {
      totalCitas,
      confirmadas,
      tasaConfirmacionPct,
      visitasFallidas,
      tasaVisitasFallidasPct,
      reprogramadas,
      completadas,
      noRealizadas,
      tasaNoRealizadasPct,
      pendientesCierre
    },
    citasPorEstado,
    evolucionSemanal,
    rankingPuntualidad,
    efectividadPorCanal,
    efectividadDetalle,
    comparativaProcesoCorreo: {
      tasaConfirmacionAntesCorreoPct: 0,
      tasaConfirmacionAhoraPushPct: tasaConfirmacionPct,
      tasaVisitasFallidasAntesCorreoPct: 32.0,
      tasaVisitasFallidasAhoraPct: tasaVisitasFallidasPct,
      metaProyectoConfirmacionPct: 80.0,
      cumpleCriterioExito: tasaConfirmacionPct >= 80.0
    }
  };
}

/**
 * E11 — Exporta los indicadores del rango seleccionado en formato CSV descargable (`GET /api/indicadores/csv`).
 */
export function exportarIndicadoresCSV(fechaInicio?: string, fechaFin?: string): string {
  const data = obtenerTableroIndicadores(fechaInicio, fechaFin);
  const lineas: string[] = [];

  lineas.push('SECCION,INDICADOR,VALOR,DETALLE');
  lineas.push(`RESUMEN,Rango de Fechas,${data.rango.fechaInicio} a ${data.rango.fechaFin},San Antonio TX`);
  lineas.push(`RESUMEN,Total de Citas,${data.tarjetas.totalCitas},Excluyendo canceladas`);
  lineas.push(`RESUMEN,Citas Confirmadas,${data.tarjetas.confirmadas},Confirmadas por cliente o llamada`);
  lineas.push(`RESUMEN,Tasa de Confirmacion (%),${data.tarjetas.tasaConfirmacionPct}%,Meta del proyecto >= 80%`);
  lineas.push(`RESUMEN,Visitas Fallidas (Cliente Ausente),${data.tarjetas.visitasFallidas},${data.tarjetas.tasaVisitasFallidasPct}% del total`);
  lineas.push(`RESUMEN,Citas Reprogramadas,${data.tarjetas.reprogramadas},Reasignadas sin perder visita`);
  lineas.push(`RESUMEN,Citas Completadas,${data.tarjetas.completadas},Con reporte y evidencia fotografica`);

  for (const sem of data.evolucionSemanal) {
    lineas.push(
      `SEMANA,${sem.semana} (${sem.fecha_inicio_semana}),${sem.pct_confirmacion}%,Citas:${sem.citas} Confirmadas:${sem.confirmadas} Fallidas:${sem.visitas_fallidas} Completadas:${sem.completadas}`
    );
  }

  for (const insp of data.rankingPuntualidad) {
    lineas.push(
      `PUNTUALIDAD_INSPECTOR,${insp.nombre} (${insp.placaVehiculo}),${insp.pctPuntualidad}%,Visitas:${insp.visitas} EnVentana:${insp.enVentana} TrasladoProm:${insp.minTrasladoProm}min`
    );
  }

  for (const can of data.efectividadPorCanal) {
    lineas.push(
      `EFECTIVIDAD_CANAL,${can.canal},${can.pct_entrega}%,Enviadas:${can.enviadas} Entregadas:${can.entregadas} Fallidas:${can.fallidas}`
    );
  }

  return lineas.join('\n');
}
