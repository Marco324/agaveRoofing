import { EstadoInspeccion, OrigenTransicion } from './estados.ts';
import type { Inspeccion, Domicilio, Cliente, Inspector } from './modelos.ts';

export interface CrearInspeccionDTO {
  idCliente: number;
  idDomicilio: number;
  idInspector?: number;
  fechaProgramada: string; // YYYY-MM-DD
  ventanaInicio: string;   // HH:MM o HH:MM:SS
  ventanaFin: string;      // HH:MM o HH:MM:SS
  motivoVisita?: string;
  notas?: string;
  creadaPor?: string;
}

export interface ReasignarInspeccionDTO {
  idInspector: number;
  idUsuario?: string;
  motivo?: string;
}

export interface MoverInspeccionDTO {
  nuevaFecha: string;       // YYYY-MM-DD
  nuevaVentanaInicio: string; // HH:MM
  nuevaVentanaFin: string;    // HH:MM
  idUsuario?: string;
  motivo?: string;
}

export interface CancelarInspeccionDTO {
  motivo: string;
  idUsuario?: string;
  origen: OrigenTransicion;
}

export interface CambiarEstadoDTO {
  nuevoEstado: EstadoInspeccion;
  idUsuario?: string;
  origen: OrigenTransicion;
  nota?: string;
}

export interface FiltroAgendaDTO {
  fecha?: string;           // YYYY-MM-DD
  fechaInicio?: string;
  fechaFin?: string;
  idInspector?: number;
  idZona?: number;
  estado?: EstadoInspeccion;
}

/**
 * DTO para la parada en la ruta del inspector (App del Inspector - E07 Anuar)
 */
export interface RutaParadaDTO {
  idInspeccion: number;
  folio: string;
  fechaProgramada: string;
  ventanaInicio: string;
  ventanaFin: string;
  estado: EstadoInspeccion;
  cliente: {
    idCliente: number;
    nombre: string;
    telefono: string;
  };
  domicilio: {
    idDomicilio: number;
    direccionCompleta: string;
    colonia: string;
    ciudad: string;
    estado: string;
    codigoPostal: string;
    referencias?: string;
    latitud?: number;
    longitud?: number;
  };
  motivoVisita?: string;
  notas?: string;
}

/**
 * DTO para la app del cliente (Mis Citas - E07 Jesús)
 */
export interface CitaClienteDTO {
  idInspeccion: number;
  folio: string;
  fechaProgramada: string;
  ventanaInicio: string;
  ventanaFin: string;
  estado: EstadoInspeccion;
  motivoVisita?: string;
  domicilio: {
    direccionCompleta: string;
    colonia: string;
    ciudad: string;
    codigoPostal: string;
  };
  inspector?: {
    idInspector: number;
    nombre: string;
    telefono: string;
    placaVehiculo?: string;
    urlFoto?: string;
  };
  lineaDeTiempo: {
    estado: EstadoInspeccion;
    fechaHora: string;
    descripcion: string;
  }[];
}
