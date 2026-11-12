import React, { useState, useEffect } from 'react';
import type { CitaClienteDTO, HorarioDisponibleDTO } from '../../../shared/src/types/dtos.ts';

interface DetalleCitaProps {
  cita: CitaClienteDTO;
  onVolver: () => void;
  onCitaActualizada?: () => void;
}

export const DetalleCitaScreen: React.FC<DetalleCitaProps> = ({
  cita: citaInicial,
  onVolver,
  onCitaActualizada
}) => {
  const [cita, setCita] = useState<CitaClienteDTO>(citaInicial);
  const [confirmacionExitosa, setConfirmacionExitosa] = useState<string | null>(null);
  const [mostrarReprogramar, setMostrarReprogramar] = useState<boolean>(false);
  const [horariosDisponibles, setHorariosDisponibles] = useState<HorarioDisponibleDTO[]>([]);
  const [horarioElegido, setHorarioElegido] = useState<HorarioDisponibleDTO | null>(null);
  const [motivoReprog, setMotivoReprog] = useState<string>('');
  const [mensajeReprog, setMensajeReprog] = useState<string | null>(null);
  const [errorNegocio, setErrorNegocio] = useState<string | null>(null);

  useEffect(() => {
    setCita(citaInicial);
  }, [citaInicial]);

  const handleConfirmarPresenciaEnCasa = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/inspecciones/${cita.idInspeccion}/presencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        setCita({ ...cita, clienteEnCasa: true });
        setConfirmacionExitosa('🏠 ¡Listo! Tu inspector fue notificado de que ya te encuentras en tu domicilio.');
        if (onCitaActualizada) onCitaActualizada();
      }
    } catch (err: any) {
      setErrorNegocio(`Error: ${err.message}`);
    }
  };

  const cargarHorarios = async () => {
    setErrorNegocio(null);

    if (['EN_CAMINO', 'EN_SITIO', 'COMPLETADA', 'CLIENTE_AUSENTE', 'CANCELADA'].includes(cita.estado)) {
      setErrorNegocio(
        'Tu inspector ya va en camino o la visita ha concluido; por seguridad de la ruta ya no es posible mover la cita desde la app (Regla RN-05).'
      );
      return;
    }

    if ((cita.vecesReprogramada || 0) >= 3) {
      setErrorNegocio(
        'Esta cita ya alcanzó el límite máximo de 3 cambios de horario (Regla RN-06). Si necesitas ayuda adicional, llámanos al (210) 555-0100.'
      );
      return;
    }

    setMostrarReprogramar(true);
    try {
      const res = await fetch(`http://localhost:4000/api/inspecciones/${cita.idInspeccion}/horarios-disponibles`);
      if (res.ok) {
        const data = await res.json();
        setHorariosDisponibles(data.horarios || []);
      }
    } catch (err) {
      console.warn('Error al consultar horarios disponibles:', err);
    }
  };

  const handleConfirmarCita = async () => {
    setErrorNegocio(null);
    try {
      const res = await fetch(`http://localhost:4000/api/inspecciones/${cita.idInspeccion}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origen: 'APP_CLI',
          nota: 'Cliente confirmó disponibilidad desde el botón principal de la app'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCita({ ...cita, estado: 'CONFIRMADA' });
        setConfirmacionExitosa(
          `¡Listo! Lo esperamos el ${cita.fechaProgramada} entre ${cita.ventanaInicio} y ${cita.ventanaFin}.`
        );
        if (onCitaActualizada) onCitaActualizada();
      } else {
        setErrorNegocio(data.error || 'No se pudo confirmar la cita.');
      }
    } catch (err: any) {
      setErrorNegocio(`Error de conexión: ${err.message}`);
    }
  };

  const handleEnviarReprogramacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!horarioElegido) {
      setErrorNegocio('Por favor elige uno de los horarios disponibles.');
      return;
    }
    setErrorNegocio(null);

    try {
      const res = await fetch(`http://localhost:4000/api/inspecciones/${cita.idInspeccion}/reprogramacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaSolicitada: horarioElegido.fecha,
          ventanaInicioSolicitada: horarioElegido.ventanaInicio,
          ventanaFinSolicitada: horarioElegido.ventanaFin,
          motivo: motivoReprog || 'No podré estar en el horario original',
          solicitadaPor: 'CLIENTE'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorNegocio(data.error || 'No se pudo enviar la solicitud.');
        return;
      }

      setCita({
        ...cita,
        estado: 'REPROG_SOLICITADA'
      });
      setMostrarReprogramar(false);
      setMensajeReprog(
        `Tu solicitud para mover la cita al ${horarioElegido.fecha} (${horarioElegido.ventanaInicio} - ${horarioElegido.ventanaFin}) está en revisión.`
      );
      if (onCitaActualizada) onCitaActualizada();
    } catch (err: any) {
      setErrorNegocio(`Error de red: ${err.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans">
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <button
          onClick={onVolver}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition"
        >
          ← Volver
        </button>
        <span className="font-mono text-xs font-bold text-slate-700">{cita.folio}</span>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* E10 — Mapa de Seguimiento en Vivo con ETA (Solo visible cuando estado === EN_CAMINO por RN-08 / R7) */}
        {cita.estado === 'EN_CAMINO' && cita.seguimientoVivo?.activo ? (
          <div className="bg-slate-900 text-white rounded-2xl p-4 border-2 border-indigo-500 space-y-2 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase text-indigo-300">
                🛰️ Seguimiento en Vivo (E10)
              </span>
              <span className="text-sm font-black text-emerald-400">
                ETA: {cita.seguimientoVivo.etaMinutos ?? 8} min
              </span>
            </div>
            <div className="text-xs text-slate-300">
              Distancia restante: <strong>{cita.seguimientoVivo.distanciaMetros ?? 1200} m</strong>
              {cita.seguimientoVivo.etaAproximado && ' (Cálculo aproximado en línea recta RN-09)'}
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600">
            🔒 <strong>Privacidad GPS (RN-08 / R7):</strong> El mapa en vivo solo se muestra mientras el inspector se encuentra en camino hacia tu domicilio.
          </div>
        )}

        {/* E11 — Reporte de Inspección con Galería de Fotos y Descarga PDF */}
        {cita.resultado && (
          <div className="bg-white rounded-2xl p-4 border-2 border-teal-500 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-teal-900 uppercase">
                📋 Reporte de Inspección (E11)
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Techo: {cita.resultado.estadoTecho}
              </span>
            </div>
            <p className="text-xs text-slate-700">{cita.resultado.hallazgos}</p>
            {cita.evidencias && cita.evidencias.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {cita.evidencias.map((ev) => (
                  <img
                    key={ev.idEvidencia}
                    src={ev.rutaArchivo}
                    alt={ev.descripcion || ev.tipo}
                    className="w-full h-24 object-cover rounded-lg border border-slate-200"
                  />
                ))}
              </div>
            )}
            <a
              href={`http://localhost:4000/api/inspecciones/${cita.idInspeccion}/reporte-html`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl"
            >
              📄 Abrir / Descargar Reporte PDF Oficial
            </a>
          </div>
        )}

        {/* Tarjeta de Resumen + Acciones E09 y E11 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Estado de la Cita</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {cita.estado}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">{cita.fechaProgramada}</div>
          <div className="text-xs text-slate-600 font-semibold">
            ⏰ Ventana acordada: {cita.ventanaInicio} - {cita.ventanaFin}
          </div>

          {confirmacionExitosa && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              {confirmacionExitosa}
            </div>
          )}

          {mensajeReprog && (
            <div className="p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs font-semibold">
              🔄 {mensajeReprog}
            </div>
          )}

          {errorNegocio && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
              ⚠️ {errorNegocio}
            </div>
          )}

          <div className="pt-2 space-y-2">
            {['CONFIRMADA', 'EN_CAMINO', 'EN_SITIO'].includes(cita.estado) && (
              <button
                onClick={handleConfirmarPresenciaEnCasa}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition"
              >
                🏠 Ya estoy en mi casa (Avisar al Inspector — E11)
              </button>
            )}

            {['NOTIFICADA', 'SIN_CONFIRMAR', 'PROGRAMADA'].includes(cita.estado) && (
              <button
                onClick={handleConfirmarCita}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl shadow-sm transition"
              >
                ✓ Sí estaré en mi domicilio (Confirmar Cita)
              </button>
            )}

            <button
              onClick={cargarHorarios}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2.5 rounded-xl border border-slate-300 transition"
            >
              📅 No puedo ese día — Solicitar mover la cita
            </button>
          </div>
        </div>

        {mostrarReprogramar && (
          <form
            onSubmit={handleEnviarReprogramacion}
            className="bg-white rounded-2xl p-4 border-2 border-emerald-500 shadow-md space-y-3"
          >
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto">
              {horariosDisponibles.map((h, idx) => (
                <div
                  key={idx}
                  onClick={() => setHorarioElegido(h)}
                  className="p-3 rounded-xl border cursor-pointer bg-slate-50 border-slate-200"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                    <span>📅 {h.fecha}</span>
                    <span className="text-emerald-700">⏰ {h.ventanaInicio} - {h.ventanaFin}</span>
                  </div>
                </div>
              ))}
            </div>
            <input
              type="text"
              value={motivoReprog}
              onChange={(e) => setMotivoReprog(e.target.value)}
              placeholder="Motivo del cambio..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2"
            />
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl"
            >
              Enviar Solicitud de Reprogramación
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
