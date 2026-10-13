import React, { useState, useEffect } from 'react';
import type { Inspeccion, Inspector, Zona } from '../../../shared/src/types/modelos.ts';
import type { CrearInspeccionDTO, FiltroAgendaDTO } from '../../../shared/src/types/dtos.ts';
import { EstadoInspeccion } from '../../../shared/src/types/estados.ts';

export const AgendaPage: React.FC = () => {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('2026-10-15');
  const [filtroInspector, setFiltroInspector] = useState<number | undefined>();
  const [filtroZona, setFiltroZona] = useState<number | undefined>();
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [errorTraslape, setErrorTraslape] = useState<string | null>(null);

  // Formulario nueva cita
  const [formulario, setFormulario] = useState<CrearInspeccionDTO>({
    idCliente: 1,
    idDomicilio: 1,
    idInspector: 1,
    fechaProgramada: '2026-10-15',
    ventanaInicio: '14:00',
    ventanaFin: '16:00',
    motivoVisita: 'Inspección de techo tras tormenta'
  });

  const cargarAgenda = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/inspecciones?fecha=${fechaSeleccionada}`);
      if (res.ok) {
        const data = await res.json();
        setInspecciones(data.inspecciones || []);
      }
    } catch (err) {
      console.error('Error al cargar agenda:', err);
    }
  };

  useEffect(() => {
    cargarAgenda();
  }, [fechaSeleccionada, filtroInspector, filtroZona]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorTraslape(null);

    try {
      const res = await fetch('http://localhost:3001/api/inspecciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.codigo === 'TRASLAPE_INSPECTOR_RN02') {
          setErrorTraslape(data.error);
        } else {
          alert(`Error: ${data.error}`);
        }
        return;
      }

      setModalAbierto(false);
      cargarAgenda();
      alert(`Inspección programada con éxito: ${data.inspeccion.folio}`);
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agenda de Inspecciones — Agave Roofing</h1>
          <p className="text-xs text-slate-500">San Antonio, Texas · Cobertura y programación diaria</p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="border text-xs rounded-lg p-2"
          />
          <button
            onClick={() => setModalAbierto(true)}
            className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
          >
            + Nueva Inspección
          </button>
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Carlos Garza (Zonas Norte y Este)</h2>
          <div className="space-y-3">
            {inspecciones
              .filter((i) => i.idInspector === 1)
              .map((cita) => (
                <div key={cita.idInspeccion} className="p-3 bg-slate-50 border rounded-lg">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{cita.folio}</span>
                    <span className="text-emerald-700">{cita.estado}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{cita.ventanaInicio} - {cita.ventanaFin}</div>
                  <div className="text-xs text-slate-800 font-semibold">{cita.motivoVisita}</div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-800 mb-3">David Vance (Zonas Centro y Noroeste)</h2>
          <div className="space-y-3">
            {inspecciones
              .filter((i) => i.idInspector === 2)
              .map((cita) => (
                <div key={cita.idInspeccion} className="p-3 bg-slate-50 border rounded-lg">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{cita.folio}</span>
                    <span className="text-emerald-700">{cita.estado}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{cita.ventanaInicio} - {cita.ventanaFin}</div>
                  <div className="text-xs text-slate-800 font-semibold">{cita.motivoVisita}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
