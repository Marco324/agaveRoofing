/**
 * Estados de la inspección según la máquina de estados oficial de AgaveAlerta (RN-01).
 * Documentación de referencia: docs/03_Diseno_Base_de_Datos.md y docs/02_SRS_Requerimientos.md
 */
export const EstadoInspeccion = {
  PROGRAMADA: 'PROGRAMADA',
  NOTIFICADA: 'NOTIFICADA',
  CONFIRMADA: 'CONFIRMADA',
  SIN_CONFIRMAR: 'SIN_CONFIRMAR',
  REPROG_SOLICITADA: 'REPROG_SOLICITADA',
  REPROGRAMADA: 'REPROGRAMADA',
  EN_CAMINO: 'EN_CAMINO',
  EN_SITIO: 'EN_SITIO',
  COMPLETADA: 'COMPLETADA',
  CLIENTE_AUSENTE: 'CLIENTE_AUSENTE',
  CANCELADA: 'CANCELADA'
} as const;

export type EstadoInspeccion = (typeof EstadoInspeccion)[keyof typeof EstadoInspeccion];

export const OrigenTransicion = {
  PANEL: 'PANEL',
  APP_INSP: 'APP_INSP',
  APP_CLI: 'APP_CLI',
  SISTEMA: 'SISTEMA'
} as const;

export type OrigenTransicion = (typeof OrigenTransicion)[keyof typeof OrigenTransicion];

export const TipoNotificacion = {
  DIA_PROGRAMADO: 'DIA_PROGRAMADO',
  RECORDATORIO: 'RECORDATORIO',
  EN_CAMINO: 'EN_CAMINO',
  POR_LLEGAR: 'POR_LLEGAR',
  LLEGADA: 'LLEGADA',
  RESULTADO: 'RESULTADO',
  REPROGRAMADA: 'REPROGRAMADA',
  MENSAJE: 'MENSAJE'
} as const;

export type TipoNotificacion = (typeof TipoNotificacion)[keyof typeof TipoNotificacion];

export const CanalNotificacion = {
  PUSH: 'PUSH',
  SMS: 'SMS',
  CORREO: 'CORREO'
} as const;

export type CanalNotificacion = (typeof CanalNotificacion)[keyof typeof CanalNotificacion];

export const EstadoNotificacion = {
  PENDIENTE: 'PENDIENTE',
  ENVIADA: 'ENVIADA',
  ENTREGADA: 'ENTREGADA',
  FALLIDA: 'FALLIDA',
  CANCELADA: 'CANCELADA'
} as const;

export type EstadoNotificacion = (typeof EstadoNotificacion)[keyof typeof EstadoNotificacion];

export const PlataformaDispositivo = {
  ANDROID: 'ANDROID',
  IOS: 'IOS'
} as const;

export type PlataformaDispositivo = (typeof PlataformaDispositivo)[keyof typeof PlataformaDispositivo];

export const EstadoTrayecto = {
  ACTIVO: 'ACTIVO',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO'
} as const;

export type EstadoTrayecto = (typeof EstadoTrayecto)[keyof typeof EstadoTrayecto];

export const EstadoTecho = {
  BUENO: 'BUENO',
  REGULAR: 'REGULAR',
  MALO: 'MALO',
  CRITICO: 'CRITICO'
} as const;

export type EstadoTecho = (typeof EstadoTecho)[keyof typeof EstadoTecho];

export const UrgenciaReparacion = {
  BAJA: 'BAJA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA'
} as const;

export type UrgenciaReparacion = (typeof UrgenciaReparacion)[keyof typeof UrgenciaReparacion];

export const TipoEvidencia = {
  FOTO_TECHO: 'FOTO_TECHO',
  FOTO_FACHADA: 'FOTO_FACHADA',
  FOTO_AUSENCIA: 'FOTO_AUSENCIA',
  FIRMA: 'FIRMA'
} as const;

export type TipoEvidencia = (typeof TipoEvidencia)[keyof typeof TipoEvidencia];

/**
 * Tabla de transiciones permitidas (RN-01).
 * Cualquier transición no listada aquí debe ser rechazada de forma estricta.
 */
export const TRANSICIONES_PERMITIDAS: Record<EstadoInspeccion, readonly EstadoInspeccion[]> = {
  [EstadoInspeccion.PROGRAMADA]: [
    EstadoInspeccion.NOTIFICADA,
    EstadoInspeccion.CANCELADA
  ],
  [EstadoInspeccion.NOTIFICADA]: [
    EstadoInspeccion.CONFIRMADA,
    EstadoInspeccion.REPROG_SOLICITADA,
    EstadoInspeccion.SIN_CONFIRMAR,
    EstadoInspeccion.EN_CAMINO,
    EstadoInspeccion.CANCELADA
  ],
  [EstadoInspeccion.CONFIRMADA]: [
    EstadoInspeccion.EN_CAMINO,
    EstadoInspeccion.REPROG_SOLICITADA,
    EstadoInspeccion.CANCELADA
  ],
  [EstadoInspeccion.SIN_CONFIRMAR]: [
    EstadoInspeccion.CONFIRMADA,
    EstadoInspeccion.REPROG_SOLICITADA,
    EstadoInspeccion.EN_CAMINO,
    EstadoInspeccion.CANCELADA
  ],
  [EstadoInspeccion.REPROG_SOLICITADA]: [
    EstadoInspeccion.REPROGRAMADA,
    EstadoInspeccion.NOTIFICADA, // Si el admin rechaza la reprogramación
    EstadoInspeccion.CANCELADA
  ],
  [EstadoInspeccion.REPROGRAMADA]: [
    EstadoInspeccion.NOTIFICADA,
    EstadoInspeccion.CONFIRMADA,
    EstadoInspeccion.EN_CAMINO,
    EstadoInspeccion.CANCELADA
  ],
  [EstadoInspeccion.EN_CAMINO]: [
    EstadoInspeccion.EN_SITIO,
    EstadoInspeccion.CLIENTE_AUSENTE
  ],
  [EstadoInspeccion.EN_SITIO]: [
    EstadoInspeccion.COMPLETADA,
    EstadoInspeccion.CLIENTE_AUSENTE
  ],
  [EstadoInspeccion.CLIENTE_AUSENTE]: [],
  [EstadoInspeccion.COMPLETADA]: [],
  [EstadoInspeccion.CANCELADA]: []
};

/**
 * Verifica si una transición entre estados es válida de acuerdo a RN-01.
 */
export function esTransicionValida(actual: EstadoInspeccion, nuevo: EstadoInspeccion): boolean {
  const permitidos = TRANSICIONES_PERMITIDAS[actual] || [];
  return (permitidos as readonly string[]).includes(nuevo);
}
