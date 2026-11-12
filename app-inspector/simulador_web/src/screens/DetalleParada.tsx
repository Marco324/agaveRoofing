import React, { useState } from 'react';
import type { RutaParadaDTO } from '../../../shared/src/types/dtos.ts';
import { encolarOperacionOffline } from '../services/cacheLocal.ts';

interface DetalleParadaProps {
  parada: RutaParadaDTO;
  idInspector?: number;
  modoSinSenal?: boolean;
  onVolver: () => void;
  onActualizado?: () => void;
}

export const DetalleParadaScreen: React.FC<DetalleParadaProps> = ({
  parada,
  idInspector = 1,
  modoSinSenal = false,
  onVolver,
  onActualizado
}) => {
  const [estadoTecho, setEstadoTecho] = useState<'BUENO' | 'REGULAR' | 'MALO' | 'CRITICO'>('REGULAR');
  const [urgencia, setUrgencia] = useState<'BAJA' | 'MEDIA' | 'ALTA' | 'INMEDIATA'>('MEDIA');
  const [hallazgos, setHallazgos] = useState('Desprendimiento de tejas asfálticas en vertiente norte.');
  const [recomendaciones, setRecomendaciones] = useState('Reemplazo de tejas dañadas y resellado elastomérico.');
  const [fotoUrl, setFotoUrl] = useState('https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=800&q=80');

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

  const handleIniciarTrayecto = async () => {
    const res = await fetch(`http://localhost:4000/api/inspecciones/${parada.idInspeccion}/trayecto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idInspector })
    });
    if (res.ok && onActualizado) onActualizado();
  };

  const handleRegistrarLlegada = async () => {
    const idLocal = `loc-llegada-${parada.idInspeccion}-${Date.now()}`;
    if (modoSinSenal) {
      await encolarOperacionOffline({
        idLocal,
        tipoOperacion: 'LLEGADA',
        idInspeccion: parada.idInspeccion,
        ocurridoEn: new Date().toISOString(),
        datos: { latitud: parada.domicilio.latitud, longitud: parada.domicilio.longitud }
      });
      return;
    }
    const res = await fetch(`http://localhost:4000/api/inspecciones/${parada.idInspeccion}/llegada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idInspector, idLocal })
    });
    if (res.ok && onActualizado) onActualizado();
  };

  const handleGuardarResultado = async () => {
    const idLocal = `loc-res-${parada.idInspeccion}-${Date.now()}`;
    if (modoSinSenal) {
      await encolarOperacionOffline({
        idLocal: `loc-ev-${parada.idInspeccion}-${Date.now()}`,
        tipoOperacion: 'EVIDENCIA',
        idInspeccion: parada.idInspeccion,
        ocurridoEn: new Date().toISOString(),
        datos: { tipo: 'TECHO', rutaArchivo: fotoUrl, descripcion: 'Evidencia de techo' }
      });
      await encolarOperacionOffline({
        idLocal,
        tipoOperacion: 'RESULTADO',
        idInspeccion: parada.idInspeccion,
        ocurridoEn: new Date().toISOString(),
        datos: {
          estadoTecho,
          hallazgos,
          requiereReparacion: estadoTecho !== 'BUENO',
          urgencia,
          recomendaciones
        }
      });
      return;
    }
    const res = await fetch(`http://localhost:4000/api/inspecciones/${parada.idInspeccion}/resultado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idInspector,
        estadoTecho,
        hallazgos,
        requiereReparacion: estadoTecho !== 'BUENO',
        urgencia,
        recomendaciones,
        idLocal,
        evidencias: [{ tipo: 'TECHO', rutaArchivo: fotoUrl, descripcion: 'Evidencia de techo' }]
      })
    });
    if (res.ok && onActualizado) onActualizado();
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 min-h-screen text-white flex flex-col font-sans">
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
        {parada.clienteEnCasa && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-xs text-emerald-200 font-bold">
            🏠 ¡El cliente confirmó que ya está en su casa esperándote!
          </div>
        )}

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
            <button
              onClick={abrirEnGoogleMaps}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold transition"
            >
              🗺️ Google Maps
            </button>
          </div>
        </div>

        {/* Acciones Operativas E10 y E11 */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
          <div className="text-xs font-bold text-emerald-400 uppercase">Flujo en Campo (E10 · E11)</div>
          {['CONFIRMADA', 'NOTIFICADA', 'PROGRAMADA', 'REPROGRAMADA'].includes(parada.estado) && (
            <button
              onClick={handleIniciarTrayecto}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl"
            >
              🛻 Voy en camino (Activar GPS 15s + Push al Cliente)
            </button>
          )}
          {parada.estado === 'EN_CAMINO' && (
            <button
              onClick={handleRegistrarLlegada}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl"
            >
              📍 Llegué al Domicilio (EN_SITIO + Cortar GPS)
            </button>
          )}
          {parada.estado === 'EN_SITIO' && (
            <div className="space-y-2 text-xs">
              <select
                value={estadoTecho}
                onChange={(e) => setEstadoTecho(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2"
              >
                <option value="BUENO">BUENO</option>
                <option value="REGULAR">REGULAR</option>
                <option value="MALO">MALO</option>
                <option value="CRITICO">CRITICO</option>
              </select>
              <select
                value={urgencia}
                onChange={(e) => setUrgencia(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2"
              >
                <option value="BAJA">BAJA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="ALTA">ALTA</option>
                <option value="INMEDIATA">INMEDIATA</option>
              </select>
              <textarea
                value={hallazgos}
                onChange={(e) => setHallazgos(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2"
              />
              <input
                value={recomendaciones}
                onChange={(e) => setRecomendaciones(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2"
              />
              <input
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2"
              />
              <button
                onClick={handleGuardarResultado}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl"
              >
                ✅ Finalizar Inspección (RN-11)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
