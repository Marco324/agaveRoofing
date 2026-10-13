import React from 'react';
import type { CitaClienteDTO } from '../../../shared/src/types/dtos.ts';

interface DetalleCitaProps {
  cita: CitaClienteDTO;
  onVolver: () => void;
}

export const DetalleCitaScreen: React.FC<DetalleCitaProps> = ({
  cita,
  onVolver
}) => {
  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans">
      {/* Top Bar */}
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
        {/* Tarjeta de Resumen */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
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
        </div>

        {/* Datos del Inspector Asignado */}
        {cita.inspector ? (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Inspector Asignado
            </h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow">
                {cita.inspector.nombre.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">{cita.inspector.nombre}</div>
                <div className="text-xs text-slate-500">Técnico Certificado en Techos</div>
                {cita.inspector.placaVehiculo && (
                  <div className="text-[11px] font-mono text-slate-600 font-semibold mt-0.5">
                    🚗 Vehículo oficial: {cita.inspector.placaVehiculo}
                  </div>
                )}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <a
                href={`tel:${cita.inspector.telefono}`}
                className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl transition"
              >
                📞 Llamar al inspector
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 text-xs text-slate-500 italic">
            El inspector asignado se confirmará en cuanto comience la jornada.
          </div>
        )}

        {/* Domicilio del Inmueble */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Lugar de Inspección
          </h3>
          <div className="text-xs font-semibold text-slate-800">
            {cita.domicilio.direccionCompleta}
          </div>
          <div className="text-xs text-slate-500">
            {cita.domicilio.colonia}, {cita.domicilio.ciudad}, Texas {cita.domicilio.codigoPostal}
          </div>
        </div>

        {/* Línea de Tiempo de la Cita */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Historial y Línea de Tiempo
          </h3>
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-200 pl-5">
            {cita.lineaDeTiempo.map((evento, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white"></div>
                <div className="text-xs font-bold text-slate-800">{evento.estado}</div>
                <div className="text-[11px] text-slate-600">{evento.descripcion}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{evento.fechaHora}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
