import React from 'react';
import type { RutaParadaDTO } from '../../../shared/src/types/dtos.ts';

interface DetalleParadaProps {
  parada: RutaParadaDTO;
  onVolver: () => void;
}

export const DetalleParadaScreen: React.FC<DetalleParadaProps> = ({
  parada,
  onVolver
}) => {
  const abrirEnGoogleMaps = () => {
    let url = '';
    if (parada.domicilio.latitud && parada.domicilio.longitud) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${parada.domicilio.latitud},${parada.domicilio.longitud}`;
    } else {
      const direccionEscapada = encodeURIComponent(
        `${parada.domicilio.direccionCompleta}, ${parada.domicilio.colonia}, ${parada.domicilio.ciudad}, ${parada.domicilio.estado} ${parada.domicilio.codigoPostal}`
      );
      url = `https://www.google.com/maps/search/?api=1&query=${direccionEscapada}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 min-h-screen text-white flex flex-col font-sans">
      {/* Top bar */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onVolver}
          className="text-xs bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200 hover:text-white"
        >
          ← Volver a ruta
        </button>
        <span className="font-mono text-xs font-bold text-emerald-400">{parada.folio}</span>
      </div>

      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
        {/* Encabezado de la parada */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Horario Comprometido</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {parada.ventanaInicio} - {parada.ventanaFin}
            </span>
          </div>
          <div className="text-lg font-bold text-white">{parada.cliente.nombre}</div>
          <div className="flex items-center gap-2 pt-1">
            <a
              href={`tel:${parada.cliente.telefono}`}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition"
            >
              📞 Llamar ({parada.cliente.telefono})
            </a>
          </div>
        </div>

        {/* Dirección y Mapa */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Ubicación en San Antonio, TX
          </div>
          <div>
            <div className="font-semibold text-sm text-white">
              {parada.domicilio.direccionCompleta}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Colonia {parada.domicilio.colonia}, {parada.domicilio.ciudad}, {parada.domicilio.estado} {parada.domicilio.codigoPostal}
            </div>
            {parada.domicilio.referencias && (
              <div className="text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-lg mt-2 border border-amber-500/20">
                <span className="font-bold block text-[11px]">Referencias de acceso:</span>
                {parada.domicilio.referencias}
              </div>
            )}
          </div>

          <button
            onClick={abrirEnGoogleMaps}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
          >
            🗺️ Abrir en Google Maps y Navegar
          </button>
        </div>

        {/* Motivo y Notas */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Detalles del Servicio
          </div>
          <div className="text-xs text-slate-200">
            <span className="font-semibold text-slate-400 block">Motivo de visita:</span>
            {parada.motivoVisita || 'Inspección de techo'}
          </div>
          {parada.notas && (
            <div className="text-xs text-slate-300 pt-2 border-t border-slate-700">
              <span className="font-semibold text-slate-400 block">Notas de operaciones:</span>
              {parada.notas}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
