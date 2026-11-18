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
import type { Inspeccion, Domicilio, Cliente, Inspector, Trayecto, PuntoUbicacion, ResultadoInspeccion, Evidencia, Mensaje } from './modelos.ts';

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
  confirmadoEn?: string;
  presenciaConfirmadaEn?: string;
  vecesReprogramada?: number;
  reprogramacionPendiente?: boolean;
  trayectoActivo?: {
    idTrayecto: number;
    etaMinutos: number;
    etaAproximado: boolean;
    distanciaRestanteM: number;
    ultimoPunto?: {
      latitud: number;
      longitud: number;
      capturadoEn: string;
    };
  };
  resultado?: {
    estadoTecho: EstadoTecho;
    hallazgos: string;
    requiereReparacion: boolean;
    urgencia?: UrgenciaReparacion;
    urlReportePdf?: string;
  };
  totalFotos?: number;
  totalMensajes?: number;
}

/**
 * DTO para la app del cliente (Mis Citas - E07 / E08 / E09 Jesús)
 */
export interface CitaClienteDTO {
  idInspeccion: number;
  folio: string;
  fechaProgramada: string;
  ventanaInicio: string;
  ventanaFin: string;
  estado: EstadoInspeccion;
  motivoVisita?: string;
  vecesReprogramada?: number;
  confirmadoEn?: string;
  canalPreferidoCliente?: CanalNotificacion;
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
  notificaciones?: {
    idNotificacion: number;
    tipo: TipoNotificacion;
    canal: CanalNotificacion;
    estado: EstadoNotificacion;
    titulo?: string;
    cuerpo?: string;
    enviadaEn?: string;
    entregadaEn?: string;
  }[];
  ultimaReprogramacion?: {
    idReprogramacion: number;
    fechaSolicitada: string;
    ventanaInicioSolicitada: string;
    ventanaFinSolicitada?: string;
    estado: 'SOLICITADA' | 'APROBADA' | 'RECHAZADA';
    motivo?: string;
    motivoRechazo?: string;
  };
  presenciaConfirmadaEn?: string;
  seguimientoVivo?: EstadoSeguimientoVivoDTO;
  resultado?: {
    idResultado: number;
    estadoTecho: EstadoTecho;
    hallazgos: string;
    requiereReparacion: boolean;
    urgencia?: UrgenciaReparacion;
    recomendaciones?: string;
    urlReportePdf?: string;
    registradoEn: string;
    evidencias: {
      idEvidencia: number;
      tipo: TipoEvidencia;
      rutaArchivo: string;
      descripcion?: string;
      capturadaEn: string;
    }[];
  };
  mensajes?: Mensaje[];
}

/**
 * E08 — Registro de dispositivo móvil para Expo Push Notifications
 */
export interface RegistrarDispositivoDTO {
  /** Obligatorio salvo que se mande idCliente (la API resuelve su usuario). */
  idUsuario?: string;
  idCliente?: number;
  tokenPush: string;
  plataforma: PlataformaDispositivo;
  versionApp?: string;
}

/**
 * E08 — Encolado de notificación en el motor
 */
export interface EncolarNotificacionDTO {
  idInspeccion: number;
  tipo: TipoNotificacion;
  programadaPara?: string; // ISO
  reenvioManual?: boolean;
  variablesExtras?: {
    eta?: string;
    texto?: string;
    enlace?: string;
  };
}

/**
 * E09 — Confirmar disponibilidad de cita (RN-04)
 */
export interface ConfirmarInspeccionDTO {
  idUsuario?: string;
  origen?: OrigenTransicion;
  nota?: string;
  confirmadaPorLlamada?: boolean;
}

/**
 * E09 — Horario disponible en la zona del domicilio
 */
export interface HorarioDisponibleDTO {
  fecha: string;
  ventanaInicio: string;
  ventanaFin: string;
  idInspector: number;
  inspectorNombre: string;
  idZona?: number;
  zonaNombre?: string;
}

/**
 * E09 — Solicitud de reprogramación del cliente (RN-05, RN-06)
 */
export interface SolicitarReprogramacionDTO {
  fechaSolicitada: string;
  ventanaInicioSolicitada: string;
  ventanaFinSolicitada?: string;
  motivo?: string;
  solicitadaPor?: 'CLIENTE' | 'ADMINISTRADOR';
  idUsuario?: string;
}

/**
 * E09 — Aprobar o rechazar solicitud de reprogramación en el panel
 */
export interface ResolverReprogramacionDTO {
  aprobada: boolean;
  motivoRechazo?: string;
  idInspectorNuevo?: number;
  resueltaPor?: string;
}

/**
 * E10 — Iniciar trayecto en vivo ("Voy en camino") (RN-03, RN-09)
 */
export interface IniciarTrayectoDTO {
  idInspector?: number;
  idUsuario?: string;
  latitudInicial?: number;
  longitudInicial?: number;
  etaSegundos?: number;
  simularFalloDirections?: boolean;
}

/**
 * E10 — Publicación de coordenada GPS cada 15 segundos (RN-08)
 */
export interface RegistrarPuntoUbicacionDTO {
  latitud: number;
  longitud: number;
  precisionM?: number;
  velocidadMs?: number;
  capturadoEn?: string;
  forzarCalculoEta?: boolean;
  simularFalloDirections?: boolean;
}

/**
 * E10 — Estado del seguimiento en vivo para el mapa del cliente (RN-08, RN-09, R7)
 */
export interface EstadoSeguimientoVivoDTO {
  idInspeccion: number;
  folio: string;
  estadoInspeccion: EstadoInspeccion;
  ubicacionVisible: boolean; // Solo true mientras el trayecto está ACTIVO (RN-08 / R7)
  motivoPrivacidad?: string;
  presenciaConfirmadaEn?: string;
  trayecto?: {
    idTrayecto: number;
    estado: EstadoTrayecto;
    iniciadoEn: string;
    etaActualS: number;
    etaMinutos: number;
    etaAproximado: boolean;
    etaTexto: string;
    distanciaRestanteM: number;
    porLlegarNotificado: boolean;
    senalPerdida: boolean;
    minutosDesdeUltimoPunto: number;
    ultimoPunto?: {
      latitud: number;
      longitud: number;
      precisionM?: number;
      velocidadMs?: number;
      capturadoEn: string;
    };
    rastroReciente?: {
      latitud: number;
      longitud: number;
      capturadoEn: string;
    }[];
  };
  domicilioDestino: {
    direccionCompleta: string;
    latitud: number;
    longitud: number;
  };
  inspector?: {
    idInspector: number;
    nombre: string;
    telefono: string;
    placaVehiculo?: string;
  };
}

/**
 * E11 — Confirmación de presencia del cliente ("Ya estoy en mi casa")
 */
export interface ConfirmarPresenciaDTO {
  idUsuario?: string;
  nota?: string;
}

/**
 * E11 — Registro de llegada del inspector al domicilio (`EN_SITIO`)
 */
export interface RegistrarLlegadaDTO {
  idUsuario?: string;
  idLocal?: string;
  registradoSinSenal?: boolean;
  ocurridoEn?: string;
  latitud?: number;
  longitud?: number;
  nota?: string;
}

/**
 * E11 — Evidencia fotográfica individual
 */
export interface RegistrarEvidenciaDTO {
  tipo: TipoEvidencia;
  rutaArchivo: string;
  descripcion?: string;
  idLocal?: string;
  registradoSinSenal?: boolean;
  capturadaEn?: string;
}

/**
 * E11 — Captura del resultado técnico de la inspección (RN-11, RN-12)
 */
export interface RegistrarResultadoDTO {
  estadoTecho: EstadoTecho;
  hallazgos: string;
  requiereReparacion: boolean;
  urgencia?: UrgenciaReparacion;
  recomendaciones?: string;
  idLocal?: string;
  registradoSinSenal?: boolean;
  registradoEn?: string;
  evidencias?: RegistrarEvidenciaDTO[];
  fotos?: string[]; // Compatibilidad con payloads simplificados de Flutter
  notas?: string;
  resultado?: string;
}

/**
 * E11 — Registro de cliente ausente con evidencia obligatoria (RN-10, RN-12)
 */
export interface RegistrarClienteAusenteDTO {
  nota?: string;
  motivo?: string; // Alias de nota
  rutaFotoEvidencia?: string;
  fotoEvidencia?: string; // Alias
  descripcionFoto?: string;
  idLocal?: string;
  registradoSinSenal?: boolean;
  ocurridoEn?: string;
  crearCitaReintento?: boolean;
  fechaReintento?: string;
  ventanaInicioReintento?: string;
  ventanaFinReintento?: string;
}

/**
 * E11 — Operación individual dentro del lote de sincronización offline (`POST /sincronizar`) (RN-12)
 */
export interface OperacionSincronizacionDTO {
  idLocal: string;
  tipoOperacion: 'LLEGADA' | 'EVIDENCIA' | 'RESULTADO' | 'CLIENTE_AUSENTE';
  idInspeccion: number;
  ocurridoEn: string;
  datos: Record<string, any>;
}

/**
 * E11 — Lote de sincronización offline enviado al recuperar señal
 */
export interface LoteSincronizacionDTO {
  idInspector?: number;
  idDispositivo?: string;
  operaciones: OperacionSincronizacionDTO[];
}

/**
 * E11 — Envío de mensaje directo Inspector <-> Cliente
 */
export interface EnviarMensajeDTO {
  deUsuario?: string;
  paraUsuario?: string;
  remitenteRol: 'INSPECTOR' | 'CLIENTE' | 'ADMINISTRADOR';
  texto: string;
}
