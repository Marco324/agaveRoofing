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
  CANCELADA: 'CANCELADA',
  /** La fecha pasó y nadie fue: cierre automático (se puede reprogramar). */
  NO_REALIZADA: 'NO_REALIZADA',
  /** La fecha pasó con el inspector en camino o en sitio sin cerrar la visita. */
  PENDIENTE_CIERRE: 'PENDIENTE_CIERRE'
} as const;

/** Estados en los que todavía nadie ha ido al domicilio. */
export const ESTADOS_ANTES_DE_LA_VISITA: readonly EstadoInspeccion[] = [
  'PROGRAMADA',
  'NOTIFICADA',
  'CONFIRMADA',
  'SIN_CONFIRMAR',
  'REPROG_SOLICITADA',
  'REPROGRAMADA'
];

/**
 * Estados que el cierre automático pasa a NO_REALIZADA cuando su fecha queda
 * atrás. REPROG_SOLICITADA no: espera la respuesta de la oficina.
 */
export const ESTADOS_QUE_VENCEN_SIN_VISITA: readonly EstadoInspeccion[] = ESTADOS_ANTES_DE_LA_VISITA.filter(
  (e) => e !== 'REPROG_SOLICITADA'
);

/** Estados con la visita en curso (el inspector salió o llegó). */
export const ESTADOS_VISITA_EN_CURSO: readonly EstadoInspeccion[] = ['EN_CAMINO', 'EN_SITIO'];

/** Estados en los que la cita ya no va a ocurrir en su fecha (no es "próxima"). */
export const ESTADOS_FINALIZADOS_O_VENCIDOS: readonly EstadoInspeccion[] = [
  'COMPLETADA',
  'CLIENTE_AUSENTE',
  'CANCELADA',
  'NO_REALIZADA',
  'PENDIENTE_CIERRE'
];

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
    EstadoInspeccion.CANCELADA,
    EstadoInspeccion.NO_REALIZADA // La fecha pasó sin visita
  ],
  [EstadoInspeccion.NOTIFICADA]: [
    EstadoInspeccion.CONFIRMADA,
    EstadoInspeccion.REPROG_SOLICITADA,
    EstadoInspeccion.SIN_CONFIRMAR,
    EstadoInspeccion.EN_CAMINO,
    EstadoInspeccion.CANCELADA,
    EstadoInspeccion.NO_REALIZADA // La fecha pasó sin visita
  ],
  [EstadoInspeccion.CONFIRMADA]: [
    EstadoInspeccion.EN_CAMINO,
    EstadoInspeccion.REPROG_SOLICITADA,
    EstadoInspeccion.CANCELADA,
    EstadoInspeccion.NO_REALIZADA // La fecha pasó sin visita
  ],
  [EstadoInspeccion.SIN_CONFIRMAR]: [
    EstadoInspeccion.CONFIRMADA,
    EstadoInspeccion.REPROG_SOLICITADA,
    EstadoInspeccion.EN_CAMINO,
    EstadoInspeccion.CANCELADA,
    EstadoInspeccion.NO_REALIZADA // La fecha pasó sin visita
  ],
  [EstadoInspeccion.REPROG_SOLICITADA]: [
    EstadoInspeccion.REPROGRAMADA,
    EstadoInspeccion.NOTIFICADA, // Si el admin rechaza la reprogramación
    EstadoInspeccion.CANCELADA
    // No vence sola: la oficina debe responder la solicitud aunque la fecha pase.
  ],
  [EstadoInspeccion.REPROGRAMADA]: [
    EstadoInspeccion.NOTIFICADA,
    EstadoInspeccion.CONFIRMADA,
    EstadoInspeccion.EN_CAMINO,
    EstadoInspeccion.CANCELADA,
    EstadoInspeccion.NO_REALIZADA // La fecha pasó sin visita
  ],
  [EstadoInspeccion.EN_CAMINO]: [
    EstadoInspeccion.EN_SITIO,
    EstadoInspeccion.CLIENTE_AUSENTE,
    EstadoInspeccion.PENDIENTE_CIERRE // La fecha pasó sin cerrar la visita
  ],
  [EstadoInspeccion.EN_SITIO]: [
    EstadoInspeccion.COMPLETADA,
    EstadoInspeccion.CLIENTE_AUSENTE,
    EstadoInspeccion.PENDIENTE_CIERRE // La fecha pasó sin cerrar la visita
  ],
  // El inspector (o una sincronización tardía) cierra la visita, o la oficina
  // confirma que no se hizo.
  [EstadoInspeccion.PENDIENTE_CIERRE]: [
    EstadoInspeccion.COMPLETADA,
    EstadoInspeccion.CLIENTE_AUSENTE,
    EstadoInspeccion.NO_REALIZADA
  ],
  [EstadoInspeccion.NO_REALIZADA]: [
    EstadoInspeccion.PENDIENTE_CIERRE, // Llegó evidencia sincronizada tarde (modo sin señal)
    EstadoInspeccion.REPROG_SOLICITADA, // El cliente pide una nueva fecha
    EstadoInspeccion.REPROGRAMADA, // La oficina le da una nueva fecha
    EstadoInspeccion.CANCELADA
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
