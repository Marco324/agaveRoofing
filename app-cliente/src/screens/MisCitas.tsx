import React, { useState, useEffect } from 'react';
import type { CitaClienteDTO } from '../../../shared/src/types/dtos.ts';

interface MisCitasProps {
  idCliente?: number;
  onSelectCita?: (cita: CitaClienteDTO) => void;
}

export const MisCitasScreen: React.FC<MisCitasProps> = ({
  idCliente = 1,
  onSelectCita
}) => {
  const [proximaCita, setProximaCita] = useState<CitaClienteDTO | null>(null);
  const [historial, setHistorial] = useState<CitaClienteDTO[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarCitas = async () => {
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:3001/api/inspecciones/mias?idCliente=${idCliente}`);
      if (res.ok) {
        const data = await res.json();
        setProximaCita(data.proximaCita || null);
        setHistorial(data.historial || []);
      }
    } catch (err) {
      console.warn('Error al cargar citas de la API:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, [idCliente]);

  const traducirEstadoHumano = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADA': return 'Confirmada — Te esperamos en tu domicilio';
      case 'NOTIFICADA': return 'Acción requerida: Confirma tu disponibilidad';
      case 'PROGRAMADA': return 'Programada por Agave Roofing';
      case 'EN_CAMINO': return '¡Tu inspector va en camino!';
      case 'EN_SITIO': return 'Inspector presente en tu domicilio';
      case 'COMPLETADA': return 'Inspección completada con éxito';
      case 'CLIENTE_AUSENTE': return 'Visita no completada (Cliente no localizado)';
      case 'CANCELADA': return 'Inspección cancelada';
      default: return estado;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans">
      {/* Header móvil */}
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌵</span>
          <div>
            <h1 className="font-bold text-sm text-slate-900">Agave Roofing</h1>
            <p className="text-[10px] text-slate-500">San Antonio, Texas</p>
          </div>
        </div>
        <button
          onClick={cargarCitas}
          className="text-xs text-emerald-600 font-semibold hover:text-emerald-700"
        >
          ↻ Actualizar
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Sección: Próxima Cita Destacada */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Tu Próxima Cita
          </h2>

          {proximaCita ? (
            <div
              onClick={() => onSelectCita && onSelectCita(proximaCita)}
              className="bg-white rounded-2xl p-5 border-2 border-emerald-500 shadow-md cursor-pointer transition hover:shadow-lg space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {proximaCita.folio}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  ● {proximaCita.estado}
                </span>
              </div>

              <div>
                <div className="text-lg font-bold text-slate-900">
                  {proximaCita.fechaProgramada}
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">
                  Ventana de atención: {proximaCita.ventanaInicio} - {proximaCita.ventanaFin}
                </div>
                <p className="text-xs text-emerald-700 font-medium mt-1 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                  {traducirEstadoHumano(proximaCita.estado)}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  📍 {proximaCita.domicilio.direccionCompleta}, {proximaCita.domicilio.colonia}
                </div>
                <span className="text-xs font-bold text-emerald-600">Ver cita ➔</span>
              </div>
            </div>
          ) : (
            /* Estado Sin Citas (Empty State) */
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
                📅
              </div>
              <h3 className="text-sm font-bold text-slate-800">No tienes citas activas</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No tienes ninguna inspección de techo programada para los próximos días en San Antonio, TX.
              </p>
              <button className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition">
                Solicitar Inspección
              </button>
            </div>
          )}
        </div>

        {/* Sección: Historial de Inspecciones */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Historial de Inspecciones
          </h2>

          {historial.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              No hay inspecciones anteriores registradas.
            </div>
          ) : (
            <div className="space-y-2">
              {historial.map((cita) => (
                <div
                  key={cita.idInspeccion}
                  onClick={() => onSelectCita && onSelectCita(cita)}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{cita.fechaProgramada}</div>
                    <div className="text-[11px] text-slate-500">{cita.motivoVisita || 'Inspección de techo'}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{cita.folio}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {cita.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
