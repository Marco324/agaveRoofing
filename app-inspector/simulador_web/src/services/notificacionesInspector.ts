import type { RutaParadaDTO } from '../../../shared/src/types/dtos.ts';

export type EstadoAppMovil = 'FOREGROUND' | 'BACKGROUND' | 'KILLED';

export type TipoAvisoInspector =
  | 'CITA_ASIGNADA'
  | 'CITA_REPROGRAMADA'
  | 'CITA_CANCELADA'
  | 'CLIENTE_EN_CASA';

export interface AvisoPushInspector {
  idAviso: string;
  tipo: TipoAvisoInspector;
  idInspeccion: number;
  folio: string;
  titulo: string;
  cuerpo: string;
  recibidoEn: string;
  estadoAppAlRecibir: EstadoAppMovil;
  leido: boolean;
}

/**
 * E08 (Anuar IN) — Servicio de recepción y ruteo de notificaciones push del inspector.
 * Soporta los 3 estados de la app (abierta / FOREGROUND, segundo plano / BACKGROUND y cerrada / KILLED)
 * y redirige directamente al detalle de la parada o refresca la ruta del día cuando una cita cambia.
 */
export async function registrarDispositivoInspector(
  idUsuario = 'u-insp-001',
  tokenPush = 'ExponentPushToken[insp-carlos-garza-satx01]',
  plataforma: 'ANDROID' | 'IOS' = 'ANDROID'
) {
  try {
    const res = await fetch('http://localhost:4000/api/dispositivos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idUsuario,
        tokenPush,
        plataforma,
        versionApp: '1.4.0'
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('No se pudo registrar token del inspector en API local:', err);
  }
  return null;
}

/**
 * Procesa el toque de una notificación push en cualquiera de los 3 estados de la app
 * y devuelve la acción de navegación correspondiente.
 */
export function manejarToqueNotificacionInspector(
  aviso: AvisoPushInspector,
  paradasActuales: RutaParadaDTO[]
): {
  accion: 'ABRIR_DETALLE_PARADA' | 'REFRESCAR_RUTA_DEL_DIA';
  paradaDestino?: RutaParadaDTO;
  mensajeBanner: string;
} {
  if (aviso.tipo === 'CITA_REPROGRAMADA' || aviso.tipo === 'CITA_CANCELADA') {
    return {
      accion: 'REFRESCAR_RUTA_DEL_DIA',
      mensajeBanner: `La cita ${aviso.folio} cambió de horario o fue cancelada. La ruta de hoy se actualizó automáticamente.`
    };
  }

  const parada = paradasActuales.find((p) => p.idInspeccion === aviso.idInspeccion);
  return {
    accion: 'ABRIR_DETALLE_PARADA',
    paradaDestino: parada,
    mensajeBanner:
      aviso.tipo === 'CLIENTE_EN_CASA'
        ? `🏠 ¡El cliente de ${aviso.folio} confirmó que ya está en su domicilio!`
        : `📋 Nueva parada asignada: ${aviso.folio}`
  };
}
