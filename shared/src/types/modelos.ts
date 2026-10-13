import { EstadoInspeccion, OrigenTransicion } from './estados.ts';

export type RolNombre = 'ADMINISTRADOR' | 'INSPECTOR' | 'CLIENTE';

export interface Rol {
  idRol: number;
  nombre: RolNombre;
  descripcion?: string;
}

export interface Usuario {
  idUsuario: string;
  authUid: string;
  idRol: number;
  nombreCompleto: string;
  correo?: string;
  telefono?: string;
  activo: boolean;
  creadoEn: string;
}

export interface Cliente {
  idCliente: number;
  idUsuario?: string;
  nombre: string;
  telefono: string;
  correo?: string;
  canalPreferido: 'PUSH' | 'SMS' | 'CORREO';
  notas?: string;
  activo: boolean;
  creadoEn: string;
}

export interface Zona {
  idZona: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Domicilio {
  idDomicilio: number;
  idCliente: number;
  idZona?: number;
  alias?: string;
  calle: string;
  numero: string;
  colonia: string;
  ciudad: string;
  estado: string; // 'Texas'
  codigoPostal: string; // e.g. '78258'
  referencias?: string;
  latitud?: number;
  longitud?: number;
  geocodificado: boolean;
  activo: boolean;
}

export interface Inspector {
  idInspector: number;
  idUsuario: string;
  nombre: string;
  telefono: string;
  placaVehiculo?: string;
  urlFoto?: string;
  activo: boolean;
  zonas?: Zona[];
}

export interface Inspeccion {
  idInspeccion: number;
  folio: string; // Formato INS-2026-000124
  idCliente: number;
  idDomicilio: number;
  idInspector?: number;
  fechaProgramada: string; // YYYY-MM-DD
  ventanaInicio: string;   // HH:MM:SS
  ventanaFin: string;      // HH:MM:SS
  estado: EstadoInspeccion;
  motivoVisita?: string;
  notas?: string;
  idInspeccionOrigen?: number;
  vecesReprogramada: number;
  confirmadoEn?: string;
  presenciaConfirmadaEn?: string;
  creadaPor?: string;
  creadoEn: string;
  actualizadoEn: string;

  // Relaciones cargadas opcionales
  cliente?: Cliente;
  domicilio?: Domicilio;
  inspector?: Inspector;
  historial?: InspeccionHistorial[];
}

export interface InspeccionHistorial {
  idHistorial: number;
  idInspeccion: number;
  estadoAnterior?: EstadoInspeccion;
  estadoNuevo: EstadoInspeccion;
  idUsuario?: string;
  origen: OrigenTransicion;
  nota?: string;
  ocurridoEn: string;
}

export interface Reprogramacion {
  idReprogramacion: number;
  idInspeccion: number;
  fechaAnterior: string;
  ventanaInicioAnterior: string;
  fechaSolicitada: string;
  ventanaInicioSolicitada: string;
  motivo?: string;
  solicitadaPor: 'CLIENTE' | 'ADMINISTRADOR';
  estado: 'SOLICITADA' | 'APROBADA' | 'RECHAZADA';
  resueltaPor?: string;
  resueltaEn?: string;
  creadoEn: string;
}
