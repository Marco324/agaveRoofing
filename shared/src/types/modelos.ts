import {
  EstadoInspeccion,
  OrigenTransicion,
  TipoNotificacion,
  CanalNotificacion,
  EstadoNotificacion,
  PlataformaDispositivo,
  EstadoTrayecto,
  EstadoTecho,
  UrgenciaReparacion,
  TipoEvidencia
} from './estados.ts';

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
  ventanaFinAnterior?: string;
  fechaSolicitada: string;
  ventanaInicioSolicitada: string;
  ventanaFinSolicitada?: string;
  motivo?: string;
  motivoRechazo?: string;
  solicitadaPor: 'CLIENTE' | 'ADMINISTRADOR';
  estado: 'SOLICITADA' | 'APROBADA' | 'RECHAZADA';
  resueltaPor?: string;
  resueltaEn?: string;
  creadoEn: string;
}

export interface Dispositivo {
  idDispositivo: number;
  idUsuario: string;
  tokenPush: string;
  plataforma: PlataformaDispositivo;
  versionApp?: string;
  activo: boolean;
  ultimoUso?: string;
  creadoEn: string;
}

export interface PlantillaNotificacion {
  idPlantilla: number;
  tipo: TipoNotificacion;
  canal: CanalNotificacion;
  titulo?: string;
  cuerpo: string;
  urgente: boolean;
  activo: boolean;
}

export interface Notificacion {
  idNotificacion: number;
  idInspeccion: number;
  idPlantilla?: number;
  idDispositivo?: number;
  tipo: TipoNotificacion;
  canal: CanalNotificacion;
  destinatario: string;
  tituloRenderizado?: string;
  cuerpoRenderizado?: string;
  estado: EstadoNotificacion;
  intentos: number;
  reenvioManual: boolean;
  programadaPara: string;
  enviadaEn?: string;
  entregadaEn?: string;
  error?: string;
}

export interface ConfiguracionParametro {
  clave: string;
  valor: string;
  tipo: 'INT' | 'TEXTO' | 'BOOL' | 'HORA';
  descripcion?: string;
}

/**
 * E10 — Trayecto en vivo del inspector (RN-03, RN-08, RN-09)
 */
export interface Trayecto {
  idTrayecto: number;
  idInspeccion: number;
  idInspector: number;
  estado: EstadoTrayecto;
  iniciadoEn: string;
  finalizadoEn?: string;
  etaInicialS?: number;
  etaActualS?: number;
  etaActualizadoEn?: string;
  etaAproximado: boolean;
  distanciaM?: number;
  duracionS?: number;
}

/**
 * E10 — Punto de ubicación GPS publicado cada 15s (RN-08, RN-17)
 */
export interface PuntoUbicacion {
  idPunto: number;
  idTrayecto: number;
  latitud: number;
  longitud: number;
  precisionM?: number;
  velocidadMs?: number;
  capturadoEn: string;
}

/**
 * E11 — Resultado de la inspección técnica del techo (RN-11, RN-12)
 */
export interface ResultadoInspeccion {
  idResultado: number;
  idInspeccion: number;
  estadoTecho: EstadoTecho;
  hallazgos: string;
  requiereReparacion: boolean;
  urgencia?: UrgenciaReparacion;
  recomendaciones?: string;
  urlReportePdf?: string;
  idLocal?: string;
  registradoSinSenal: boolean;
  registradoEn: string;
  sincronizadoEn?: string;
}

/**
 * E11 — Evidencia fotográfica (RN-10, RN-11, RN-12)
 */
export interface Evidencia {
  idEvidencia: number;
  idInspeccion: number;
  tipo: TipoEvidencia;
  rutaArchivo: string;
  descripcion?: string;
  idLocal?: string;
  capturadaEn: string;
  subidaEn?: string;
}

/**
 * E11 — Mensajería directa Inspector <-> Cliente ligada a la cita
 */
export interface Mensaje {
  idMensaje: number;
  idInspeccion: number;
  deUsuario: string;
  paraUsuario?: string;
  remitenteRol: 'INSPECTOR' | 'CLIENTE' | 'ADMINISTRADOR';
  remitenteNombre?: string;
  texto: string;
  enviadoEn: string;
  leidoEn?: string;
}
