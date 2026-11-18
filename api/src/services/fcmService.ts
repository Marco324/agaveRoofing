import { createSign } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';

/**
 * E08 — Cliente mínimo de Firebase Cloud Messaging (API HTTP v1) sin dependencias externas.
 *
 * Se activa cuando existe una cuenta de servicio de Firebase:
 *   - FIREBASE_SERVICE_ACCOUNT=/ruta/a/cuenta-servicio.json   (recomendado), o
 *   - FIREBASE_SERVICE_ACCOUNT_JSON='{"project_id": ...}'      (contenido en línea).
 * Si no hay credenciales, el motor de notificaciones sigue en modo simulado (pruebas y demo local).
 *
 * Flujo: se firma un JWT RS256 con la llave privada de la cuenta de servicio, se cambia por un
 * access token OAuth2 (válido 1 h, se reutiliza) y se envía el mensaje a
 * POST https://fcm.googleapis.com/v1/projects/{project_id}/messages:send
 */

interface CuentaServicio {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export type ResultadoEnvioFcm =
  | { ok: true; idMensaje: string }
  | {
      ok: false;
      /** TOKEN_INVALIDO: app desinstalada o token vencido. TRANSITORIO: reintentar. PERMANENTE: no reintentar. */
      tipoError: 'TOKEN_INVALIDO' | 'TRANSITORIO' | 'PERMANENTE';
      error: string;
    };

export interface MensajePush {
  token: string;
  titulo: string | null;
  cuerpo: string;
  /** Pares clave/valor que recibe la app (FCM exige que todos sean texto). */
  datos?: Record<string, string>;
  /** Las urgentes (EN_CAMINO, POR_LLEGAR, LLEGADA, MENSAJE) se mandan con prioridad alta. */
  urgente?: boolean;
}

const ALCANCE_FCM = 'https://www.googleapis.com/auth/firebase.messaging';
/** Canal de Android que crea la app del cliente (ver app-cliente/lib/services/push_service.dart). */
export const CANAL_ANDROID = 'agave_citas';

let cuentaCache: CuentaServicio | null | undefined;
let tokenCache: { valor: string; expiraEn: number } | null = null;

function cargarCuentaServicio(): CuentaServicio | null {
  if (cuentaCache !== undefined) return cuentaCache;

  let crudo: string | null = null;
  const enLinea = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const ruta = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (enLinea && enLinea.trim()) {
    crudo = enLinea;
  } else if (ruta && ruta.trim()) {
    if (!existsSync(ruta)) {
      console.warn(`⚠️  FIREBASE_SERVICE_ACCOUNT apunta a un archivo que no existe: ${ruta}. Push queda simulado.`);
      cuentaCache = null;
      return null;
    }
    crudo = readFileSync(ruta, 'utf8');
  }

  if (!crudo) {
    cuentaCache = null;
    return null;
  }

  try {
    const cuenta = JSON.parse(crudo) as CuentaServicio;
    if (!cuenta.project_id || !cuenta.client_email || !cuenta.private_key) {
      throw new Error('faltan project_id, client_email o private_key');
    }
    cuentaCache = cuenta;
  } catch (err: any) {
    console.warn(`⚠️  Cuenta de servicio de Firebase inválida (${err.message}). Push queda simulado.`);
    cuentaCache = null;
  }
  return cuentaCache;
}

/** true cuando hay credenciales de Firebase y los PUSH se envían de verdad. */
export function fcmHabilitado(): boolean {
  if (process.env.FCM_DESHABILITADO === '1') return false;
  return cargarCuentaServicio() !== null;
}

export function proyectoFirebase(): string | null {
  return cargarCuentaServicio()?.project_id ?? null;
}

function base64url(entrada: string | Buffer): string {
  return Buffer.from(entrada).toString('base64url');
}

async function obtenerAccessToken(cuenta: CuentaServicio): Promise<string> {
  const ahora = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiraEn - 60 > ahora) {
    return tokenCache.valor;
  }

  const tokenUri = cuenta.token_uri || 'https://oauth2.googleapis.com/token';
  const encabezado = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const reclamos = base64url(
    JSON.stringify({
      iss: cuenta.client_email,
      scope: ALCANCE_FCM,
      aud: tokenUri,
      iat: ahora,
      exp: ahora + 3600
    })
  );
  const firmador = createSign('RSA-SHA256');
  firmador.update(`${encabezado}.${reclamos}`);
  const firma = firmador.sign(cuenta.private_key).toString('base64url');
  const jwt = `${encabezado}.${reclamos}.${firma}`;

  const resp = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!resp.ok) {
    const texto = await resp.text();
    throw new Error(`OAuth2 de Google respondió ${resp.status}: ${texto.slice(0, 200)}`);
  }

  const datos = (await resp.json()) as { access_token: string; expires_in: number };
  tokenCache = { valor: datos.access_token, expiraEn: ahora + (datos.expires_in || 3600) };
  return datos.access_token;
}

/**
 * Clasifica la respuesta de error de FCM v1.
 * https://firebase.google.com/docs/reference/fcm/rest/v1/ErrorCode
 */
export function clasificarErrorFcm(status: number, cuerpo: any): 'TOKEN_INVALIDO' | 'TRANSITORIO' | 'PERMANENTE' {
  const error = cuerpo?.error ?? {};
  const detalles: any[] = Array.isArray(error.details) ? error.details : [];
  const codigoFcm: string | undefined = detalles.find((d) => d?.errorCode)?.errorCode;
  const mensaje: string = String(error.message || '');

  if (codigoFcm === 'UNREGISTERED' || status === 404) return 'TOKEN_INVALIDO';
  if (codigoFcm === 'INVALID_ARGUMENT' || status === 400) {
    // FCM responde INVALID_ARGUMENT tanto por token mal formado como por payload inválido.
    return /registration token/i.test(mensaje) ? 'TOKEN_INVALIDO' : 'PERMANENTE';
  }
  if (codigoFcm === 'QUOTA_EXCEEDED' || codigoFcm === 'UNAVAILABLE' || codigoFcm === 'INTERNAL') return 'TRANSITORIO';
  if (status === 429 || status >= 500) return 'TRANSITORIO';
  // SENDER_ID_MISMATCH, THIRD_PARTY_AUTH_ERROR, 401/403: problema de configuración, no se arregla reintentando.
  return 'PERMANENTE';
}

/** Envía un mensaje a un token de FCM. Nunca lanza excepción: devuelve el resultado clasificado. */
export async function enviarPushFcm(mensaje: MensajePush): Promise<ResultadoEnvioFcm> {
  const cuenta = cargarCuentaServicio();
  if (!cuenta) {
    return { ok: false, tipoError: 'PERMANENTE', error: 'FCM no está configurado (falta FIREBASE_SERVICE_ACCOUNT)' };
  }

  let accessToken: string;
  try {
    accessToken = await obtenerAccessToken(cuenta);
  } catch (err: any) {
    // Sin red o reloj desfasado: se reintenta; credenciales revocadas también caen aquí y agotan los 3 intentos.
    return { ok: false, tipoError: 'TRANSITORIO', error: `No se obtuvo access token: ${err.message}` };
  }

  const cuerpoPeticion = {
    message: {
      token: mensaje.token,
      notification: {
        ...(mensaje.titulo ? { title: mensaje.titulo } : {}),
        body: mensaje.cuerpo
      },
      data: mensaje.datos ?? {},
      android: {
        priority: mensaje.urgente ? 'HIGH' : 'NORMAL',
        notification: { channel_id: CANAL_ANDROID }
      },
      apns: {
        headers: { 'apns-priority': mensaje.urgente ? '10' : '5' },
        payload: { aps: { sound: 'default' } }
      }
    }
  };

  try {
    const resp = await fetch(`https://fcm.googleapis.com/v1/projects/${cuenta.project_id}/messages:send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cuerpoPeticion)
    });

    const texto = await resp.text();
    let json: any = null;
    try {
      json = texto ? JSON.parse(texto) : null;
    } catch {
      json = null;
    }

    if (resp.ok) {
      return { ok: true, idMensaje: json?.name ?? '' };
    }

    if (resp.status === 401) {
      tokenCache = null; // access token vencido o revocado: se pide otro en el siguiente intento
    }

    const tipoError = clasificarErrorFcm(resp.status, json);
    const detalle = json?.error?.message || texto.slice(0, 200) || `HTTP ${resp.status}`;
    return { ok: false, tipoError, error: `FCM ${resp.status}: ${detalle}` };
  } catch (err: any) {
    return { ok: false, tipoError: 'TRANSITORIO', error: `Error de red con FCM: ${err.message}` };
  }
}

/** Solo para pruebas: olvida credenciales y token en caché. */
export function reiniciarCacheFcm() {
  cuentaCache = undefined;
  tokenCache = null;
}
