import React, { useState, useEffect } from 'react';
import type { RutaParadaDTO } from '../../../shared/src/types/dtos.ts';
import { guardarRutaEnCache, obtenerRutaDeCache } from '../services/cacheLocal.ts';

interface RutaDelDiaProps {
  idInspector?: number;
  onSelectParada?: (parada: RutaParadaDTO) => void;
}

export const RutaDelDiaScreen: React.FC<RutaDelDiaProps> = ({
  idInspector = 1,
  onSelectParada
}) => {
  const [fecha, setFecha] = useState<string>('2026-10-15');
  const [paradas, setParadas] = useState<RutaParadaDTO[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [modoSinConexion, setModoSinConexion] = useState<boolean>(false);

  const cargarRuta = async (forzarRefresco = false) => {
    setCargando(true);
    setModoSinConexion(false);

    try {
      const res = await fetch(`http://localhost:3001/api/inspecciones/mi-ruta?idInspector=${idInspector}&fecha=${fecha}`);
      if (res.ok) {
        const data = await res.json();
        const listaParadas = data.paradas || [];
        setParadas(listaParadas);
        await guardarRutaEnCache(fecha, listaParadas);
      } else {
        throw new Error('Respuesta no exitosa de la API');
      }
    } catch (err) {
      console.warn('Fallo de conexión. Intentando recuperar ruta desde caché SQLite/Local:', err);
      const enCache = await obtenerRutaDeCache(fecha);
      if (enCache) {
        setParadas(enCache);
        setModoSinConexion(true);
      } else {
        setParadas([]);
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRuta();
  }, [fecha, idInspector]);

  const cambiarDia = (diasDelta: number) => {
    const d = new Date(fecha);
    d.setDate(d.getDate() + diasDelta);
    setFecha(d.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 min-h-screen text-white flex flex-col font-sans">
      {/* Header móvil */}
      <div className="p-4 bg-slate-800/90 backdrop-blur border-b border-slate-700 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌵</span>
            <h1 className="font-bold text-sm tracking-wide">AgaveAlerta — Inspector</h1>
          </div>
          {modoSinConexion && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              ● Modo sin señal (Caché)
            </span>
          )}
        </div>

        {/* Selector de fecha */}
        <div className="flex items-center justify-between bg-slate-900/80 rounded-xl p-1.5 border border-slate-700">
          <button
            onClick={() => cambiarDia(-1)}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition"
          >
            ◀
          </button>
          <div className="text-center">
            <span className="text-xs font-bold block">{fecha}</span>
            <span className="text-[10px] text-slate-400">Ruta de trabajo</span>
          </div>
          <button
            onClick={() => cambiarDia(1)}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Lista de paradas */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <div className="flex justify-between items-center text-xs text-slate-400 pb-1">
          <span>{paradas.length} paradas asignadas</span>
          <button
            onClick={() => cargarRuta(true)}
            disabled={cargando}
            className="text-emerald-400 hover:text-emerald-300 text-[11px] font-medium"
          >
            {cargando ? 'Actualizando...' : '↻ Actualizar ruta'}
          </button>
        </div>

        {paradas.length === 0 && !cargando && (
          <div className="text-center py-16 text-slate-500 text-xs">
            No tienes inspecciones programadas para este día en San Antonio, TX.
          </div>
        )}

        {paradas.map((parada, index) => {
          const badgeColors: Record<string, string> = {
            CONFIRMADA: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            NOTIFICADA: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            PROGRAMADA: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
            EN_CAMINO: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
          };

          return (
            <div
              key={parada.idInspeccion}
              onClick={() => onSelectParada && onSelectParada(parada)}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-4 cursor-pointer transition active:scale-[0.99] space-y-2 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-bold text-[11px] flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-200">{parada.folio}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColors[parada.estado] || 'bg-slate-700 text-slate-300'}`}>
                  {parada.estado}
                </span>
              </div>

              <div>
                <div className="font-bold text-sm text-white">{parada.cliente.nombre}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  📍 {parada.domicilio.direccionCompleta}, {parada.domicilio.colonia}
                </div>
                <div className="text-[11px] text-slate-500">
                  {parada.domicilio.ciudad}, {parada.domicilio.estado} {parada.domicilio.codigoPostal}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center text-xs">
                <span className="text-emerald-400 font-semibold">
                  ⏰ {parada.ventanaInicio} - {parada.ventanaFin}
                </span>
                <span className="text-slate-400 text-[11px]">Ver detalles ➔</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
