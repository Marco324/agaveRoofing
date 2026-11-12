import React, { useState, useEffect } from 'react';

export const NotificacionesYReprogramacionesPage: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [clientesNoAlcanzados, setClientesNoAlcanzados] = useState<any[]>([]);
  const [solicitudesReprog, setSolicitudesReprog] = useState<any[]>([]);
  const [citasSinConfirmar, setCitasSinConfirmar] = useState<any[]>([]);
  const [resumenNotif, setResumenNotif] = useState<any>({
    total: 0,
    entregadasPush: 0,
    entregadasSms: 0,
    fallidas: 0,
    tasaExitoGlobal: 100
  });

  const cargarDatos = async () => {
    try {
      const [resNotif, resReprog, resSinConf] = await Promise.all([
        fetch('http://localhost:4000/api/notificaciones'),
        fetch('http://localhost:4000/api/reprogramaciones'),
        fetch('http://localhost:4000/api/inspecciones/sin-confirmar')
      ]);

      if (resNotif.ok) {
        const dNotif = await resNotif.json();
        setNotificaciones(dNotif.notificaciones || []);
        setClientesNoAlcanzados(dNotif.clientesNoAlcanzados || []);
        if (dNotif.resumen) setResumenNotif(dNotif.resumen);
      }
      if (resReprog.ok) {
        const dReprog = await resReprog.json();
        setSolicitudesReprog(dReprog.solicitudes || []);
      }
      if (resSinConf.ok) {
        const dSinConf = await resSinConf.json();
        setCitasSinConfirmar(dSinConf.citas || []);
      }
    } catch (err) {
      console.error('Error al cargar bandejas E08/E09:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleReenviarNotificacion = async (idNotificacion: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/notificaciones/${idNotificacion}/reenviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idUsuario: 'u-admin-001' })
      });
      if (res.ok) {
        await cargarDatos();
        alert('Notificación reenviada manualmente con éxito (reenvio_manual = true).');
      }
    } catch (err: any) {
      alert(`Error al reenviar: ${err.message}`);
    }
  };

  const handleResolverReprogramacion = async (idReprogramacion: number, aprobada: boolean) => {
    let motivoRechazo = '';
    if (!aprobada) {
      motivoRechazo = window.prompt('Indica el motivo del rechazo para el cliente:') || '';
      if (!motivoRechazo.trim()) return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/reprogramaciones/${idReprogramacion}/resolver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprobada,
          motivoRechazo,
          resueltaPor: 'u-admin-001'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error}`);
        return;
      }
      await cargarDatos();
      alert(
        aprobada
          ? `Solicitud aprobada. Cita movida conservando el folio ${data.inspeccion?.folio}.`
          : 'Solicitud rechazada y cliente notificado.'
      );
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    }
  };

  const handleConfirmarPorLlamada = async (idInspeccion: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/inspecciones/${idInspeccion}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idUsuario: 'u-admin-001',
          confirmadaPorLlamada: true
        })
      });
      if (res.ok) {
        await cargarDatos();
        alert('Confirmación telefónica registrada exitosamente.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Alerta de Cliente No Alcanzado (E08) */}
      {clientesNoAlcanzados.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 space-y-2">
          <div className="text-sm font-bold text-rose-900">
            🚨 Alerta de Cliente No Alcanzado — Todas las notificaciones fallaron
          </div>
          {clientesNoAlcanzados.map((c) => (
            <div key={c.id_inspeccion} className="flex justify-between items-center bg-white p-3 rounded-lg border border-rose-200 text-xs">
              <div>
                <span className="font-mono font-bold text-rose-700">{c.folio}</span> ·{' '}
                <strong>{c.cliente_nombre}</strong> ({c.cliente_telefono}) — Cita: {c.fecha_programada} ({c.ventana_inicio} - {c.ventana_fin})
              </div>
              <span className="text-rose-700 font-bold">Llamar de inmediato desde oficina</span>
            </div>
          ))}
        </div>
      )}

      {/* E09 — Bandeja de Reprogramaciones */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Bandeja de Solicitudes de Reprogramación (E09)
        </h2>
        <div className="space-y-3">
          {solicitudesReprog.map((sol) => (
            <div key={sol.id_reprogramacion} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900">
                  {sol.folio} — {sol.cliente_nombre} ({sol.estado})
                </div>
                <div className="text-slate-600">
                  Horario actual: {sol.fecha_anterior} ({sol.ventana_inicio_anterior}) ➔{' '}
                  <strong className="text-emerald-700">
                    Horario solicitado: {sol.fecha_solicitada} ({sol.ventana_inicio_solicitada} - {sol.ventana_fin_solicitada || '11:00'})
                  </strong>
                </div>
                <div className="text-slate-500 italic">Motivo: "{sol.motivo}"</div>
              </div>
              {sol.estado === 'SOLICITADA' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolverReprogramacion(sol.id_reprogramacion, true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleResolverReprogramacion(sol.id_reprogramacion, false)}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg"
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* E09 — Alerta de Citas SIN_CONFIRMAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Alerta de Citas SIN_CONFIRMAR (RN-07)
        </h2>
        <div className="space-y-3">
          {citasSinConfirmar.map((cita) => (
            <div key={cita.id_inspeccion} className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
              <div>
                <div className="font-bold text-slate-900">
                  {cita.folio} — {cita.cliente_nombre} ({cita.cliente_telefono})
                </div>
                <div className="text-slate-600">
                  Fecha: {cita.fecha_programada} ({cita.ventana_inicio} - {cita.ventana_fin}) · Inspector: {cita.inspector_nombre}
                </div>
              </div>
              <button
                onClick={() => handleConfirmarPorLlamada(cita.id_inspeccion)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-lg"
              >
                📞 Registrar Confirmación por Llamada
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* E08 — Vista de Notificaciones y Entregabilidad R4 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">
            Monitor de Notificaciones Push / SMS y Bitácora R4 (E08)
          </h2>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Entregabilidad Global: {resumenNotif.tasaExitoGlobal}%
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2">Folio / Cliente</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Canal</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Intentos</th>
                <th className="py-2">Error / Acuse</th>
                <th className="py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {notificaciones.map((n) => (
                <tr key={n.id_notificacion} className="border-b border-slate-100">
                  <td className="py-2.5 font-medium">
                    {n.folio} · {n.cliente_nombre}
                  </td>
                  <td className="py-2.5">{n.tipo}</td>
                  <td className="py-2.5 font-bold">{n.canal}</td>
                  <td className="py-2.5">{n.estado}</td>
                  <td className="py-2.5">{n.intentos}/3</td>
                  <td className="py-2.5 text-slate-500">{n.error || n.entregada_en || '—'}</td>
                  <td className="py-2.5">
                    <button
                      onClick={() => handleReenviarNotificacion(n.id_notificacion)}
                      className="text-emerald-600 hover:underline font-semibold"
                    >
                      ↻ Reenviar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
