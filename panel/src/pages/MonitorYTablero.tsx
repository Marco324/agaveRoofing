import React, { useState, useEffect } from 'react';

/**
 * Pantallas del Panel Web de Administración para el Sprint 5 (E10 y E11):
 * - Monitor en Vivo de Inspectores (E10): Mapa de San Antonio con ubicaciones de los inspectores,
 *   lista semáforo de citas del día (a tiempo, en riesgo, retrasadas) y corte automático de trayectos (>90 min).
 * - Tablero de Indicadores KPI (E11): 6 tarjetas de métricas clave vs línea base de Agave Roofing,
 *   gráficas comparativas por semana, puntualidad por inspector y exportación de métricas en CSV.
 */
export const MonitorYTableroPage: React.FC = () => {
  const [monitor, setMonitor] = useState<any>({
    fecha: '2026-11-12',
    inspectoresEnCampo: [],
    citasSemaforo: [],
    resumenSemaforo: { aTiempo: 0, enRiesgo: 0, retrasadas: 0, completadas: 0 }
  });
  const [indicadores, setIndicadores] = useState<any>({
    tarjetas: {
      tasaConfirmacionPreviaPct: 0,
      tasaVisitasFallidasPct: 0,
      reduccionVisitasFallidasPct: 0,
      citasAtendidasEnVentanaPct: 0,
      tiempoPromedioTrasladoMin: 0,
      tasaReprogramacionPreviaPct: 0,
      efectividadNotificacionesPct: 100
    },
    semanas: [],
    puntualidadPorInspector: [],
    efectividadCanales: []
  });

  const cargarDatos = async () => {
    try {
      const [resMonitor, resInd] = await Promise.all([
        fetch('http://localhost:4000/api/panel/monitor-vivo?fecha=2026-11-12'),
        fetch('http://localhost:4000/api/panel/indicadores')
      ]);

      if (resMonitor.ok) {
        setMonitor(await resMonitor.json());
      }
      if (resInd.ok) {
        setIndicadores(await resInd.json());
      }
    } catch (err) {
      console.error('Error al cargar Monitor en Vivo (E10) y Tablero KPI (E11):', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSimularAvance = async (idInspeccion: number, acercar: boolean) => {
    try {
      const res = await fetch(`http://localhost:4000/api/inspecciones/${idInspeccion}/simular-avance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acercarAlDomicilio: acercar })
      });
      if (res.ok) {
        await cargarDatos();
      }
    } catch (err: any) {
      alert(`Error al simular avance GPS: ${err.message}`);
    }
  };

  const handleCerrarTrayectosOlvidados = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/temporizadores/cerrar-trayectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutosLimite: 90 })
      });
      const data = await res.json();
      if (res.ok) {
        await cargarDatos();
        alert(`Temporizador R5 ejecutado: ${data.cerrados} trayecto(s) con más de 90 min cerrados.`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handlePurgarPuntosGps = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/mantenimiento/purgar-puntos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diasRetencion: 30 })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Retención RN-17 ejecutada: ${data.eliminados} puntos GPS (>30 días) eliminados.`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Banner Congelamiento Funcional (E11) */}
      <div className="bg-emerald-950 text-white rounded-2xl p-5 flex justify-between items-center shadow-lg">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider bg-emerald-800 px-2.5 py-0.5 rounded-full">
            Hito E11 · Congelamiento Funcional (12 Nov 2026)
          </span>
          <h2 className="text-lg font-extrabold mt-1">
            Monitor en Vivo (E10) y Tablero de Indicadores Operativos (E11)
          </h2>
          <p className="text-xs text-emerald-200">
            Vistas SQLite: v_indicadores_semana, v_puntualidad_inspector y v_efectividad_notificacion
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCerrarTrayectosOlvidados}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg"
          >
            ⏱️ Cerrar Trayectos &gt;90m (R5)
          </button>
          <a
            href="http://localhost:4000/api/panel/indicadores/csv"
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-lg"
          >
            📥 Exportar CSV
          </a>
        </div>
      </div>

      {/* E10 — Monitor en Vivo y Lista Semáforo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            🛰️ Inspectores en Campo y Telemetría GPS en Tiempo Real (E10)
          </h3>
          <div className="space-y-3">
            {monitor.inspectoresEnCampo.map((ins: any) => (
              <div key={ins.id_inspector} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900">
                    {ins.nombre} ({ins.placa_vehiculo})
                  </div>
                  <div className="text-slate-600">
                    {ins.folio_activo ? `Rumbo a ${ins.folio_activo} · ${ins.cliente_destino}` : 'En base / Sin trayecto activo'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    GPS: ({ins.latitud.toFixed(4)}, {ins.longitud.toFixed(4)}) · ETA: {ins.eta_minutos ?? 0} min
                  </div>
                </div>
                {ins.id_inspeccion_activa && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleSimularAvance(ins.id_inspeccion_activa, false)}
                      className="bg-indigo-600 text-white font-bold px-2.5 py-1 rounded"
                    >
                      🛰️ +1 Paso GPS
                    </button>
                    <button
                      onClick={() => handleSimularAvance(ins.id_inspeccion_activa, true)}
                      className="bg-amber-600 text-white font-bold px-2.5 py-1 rounded"
                    >
                      📍 &lt; 1 km (RN-02)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            🚦 Lista Semáforo de Citas del Día ({monitor.fecha})
          </h3>
          <div className="space-y-2.5">
            {monitor.citasSemaforo.map((c: any) => (
              <div key={c.id_inspeccion} className="p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900">
                    {c.folio} · {c.cliente_nombre} ({c.estado})
                  </div>
                  <div className="text-slate-600">{c.motivo_semaforo}</div>
                </div>
                <span className="font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                  {c.semaforo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* E11 — 6 Tarjetas de Indicadores Operativos */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Confirmación Previa</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {indicadores.tarjetas.tasaConfirmacionPreviaPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Meta &ge; 80% (Base: 0%)</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Visitas Fallidas</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {indicadores.tarjetas.tasaVisitasFallidasPct}%
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            -{indicadores.tarjetas.reduccionVisitasFallidasPct}% vs base (18%)
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase">En Ventana</div>
          <div className="text-2xl font-black text-sky-600 mt-1">
            {indicadores.tarjetas.citasAtendidasEnVentanaPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Puntualidad en sitio</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Traslado Promedio</div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {indicadores.tarjetas.tiempoPromedioTrasladoMin} min
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Telemetría GPS E10</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Reprogramación</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {indicadores.tarjetas.tasaReprogramacionPreviaPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Anticipada (RN-04)</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Efectividad Avisos</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {indicadores.tarjetas.efectividadNotificacionesPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Push FCM + Respaldo SMS</div>
        </div>
      </div>

      {/* Botón de mantenimiento RN-17 */}
      <div className="flex justify-end">
        <button
          onClick={handlePurgarPuntosGps}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-lg"
        >
          🧹 Ejecutar Purga de Puntos GPS Crudos &gt;30 días (RN-17)
        </button>
      </div>
    </div>
  );
};
