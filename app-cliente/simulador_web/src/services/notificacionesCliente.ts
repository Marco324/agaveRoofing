import type { CitaClienteDTO } from '../../../shared/src/types/dtos.ts';

export type EstadoAppCliente = 'FOREGROUND' | 'BACKGROUND' | 'KILLED';

export type AccionBotonNotificacion =
  | 'TOCAR_CUERPO'
  | 'BOTON_SI_ESTARE'
  | 'BOTON_MOVER_CITA';

export interface NotificacionPushCliente {
  idNotificacion: number;
  idInspeccion: number;
  folio: string;
  tipo: 'DIA_PROGRAMADO' | 'RECORDATORIO' | 'REPROGRAMADA';
  titulo: string;
  cuerpo: string;
  botonesAccion: { id: AccionBotonNotificacion; etiqueta: string }[];
}

/**
 * E08 (Jesús CL) — Registro del token de Expo Push del cliente al iniciar la app.
 */
export async function registrarDispositivoCliente(
  idUsuario = 'u-cli-001',
  tokenPush = 'ExponentPushToken[cli-robert-martinez-ios17]',
  plataforma: 'IOS' | 'ANDROID' = 'IOS'
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
    console.warn('No se pudo registrar token del cliente en API local:', err);
  }
  return null;
}

/**
 * E09 (Jesús CL) — Confirmar cita directamente desde el botón de acción "Sí estaré"
 * de la notificación push sin necesidad de abrir la aplicación (con teléfono bloqueado o en segundo plano).
 */
export async function confirmarDesdeNotificacionPush(
  idInspeccion: number,
  idUsuario = 'u-cli-001'
): Promise<{ ok: boolean; mensaje: string }> {
  try {
    const res = await fetch(`http://localhost:4000/api/inspecciones/${idInspeccion}/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idUsuario,
        origen: 'APP_CLI',
        nota: 'Confirmada desde el botón rápido "Sí estaré" de la notificación push (sin abrir la app)'
      })
    });
    const data = await res.json();
    if (res.ok) {
      return {
        ok: true,
        mensaje: `¡Listo! Cita ${data.inspeccion?.folio || idInspeccion} confirmada desde la notificación.`
      };
    }
    return {
      ok: false,
      mensaje: data.error || 'No se pudo confirmar la cita.'
    };
  } catch (err: any) {
    return {
      ok: false,
      mensaje: `Error de red al confirmar desde notificación: ${err.message}`
    };
  }
}

/**
 * E08 (Jesús CL) — Manejo de la notificación en los 3 estados de la app (abierta, segundo plano y cerrada).
 * Al tocar el cuerpo o "Mover cita", navega directo al detalle de esa cita específica, no a la pantalla principal.
 */
export async function procesarInteraccionNotificacion(
  notificacion: NotificacionPushCliente,
  accion: AccionBotonNotificacion,
  estadoApp: EstadoAppCliente,
  citasCliente: CitaClienteDTO[]
): Promise<{
  abrirPantallaDetalle: boolean;
  abrirModalReprogramar: boolean;
  citaObjetivo: CitaClienteDTO | null;
  mensajeResultado: string;
}> {
  const citaObjetivo =
    citasCliente.find((c) => c.idInspeccion === notificacion.idInspeccion) || null;

  if (accion === 'BOTON_SI_ESTARE') {
    const resultado = await confirmarDesdeNotificacionPush(notificacion.idInspeccion);
    return {
      abrirPantallaDetalle: false, // Se ejecuta en background sin abrir la app
      abrirModalReprogramar: false,
      citaObjetivo,
      mensajeResultado: `[Estado App: ${estadoApp}] ${resultado.mensaje}`
    };
  }

  if (accion === 'BOTON_MOVER_CITA') {
    return {
      abrirPantallaDetalle: true,
      abrirModalReprogramar: true,
      citaObjetivo,
      mensajeResultado: `[Estado App: ${estadoApp}] Abriendo selector de horarios disponibles para ${notificacion.folio}.`
    };
  }

  return {
    abrirPantallaDetalle: true,
    abrirModalReprogramar: false,
    citaObjetivo,
    mensajeResultado: `[Estado App: ${estadoApp}] Navegando directo al detalle de la cita ${notificacion.folio}.`
  };
}
