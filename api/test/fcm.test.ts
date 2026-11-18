import assert from 'node:assert';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { runSeed } from '../src/seed.ts';
import { db } from '../src/db.ts';
import {
  registrarDispositivo,
  encolarNotificacion,
  despacharNotificacionesPendientes,
  registrarAcuseNotificacion,
  listarNotificacionesPanel
} from '../src/services/notificacionService.ts';
import { fcmHabilitado, clasificarErrorFcm, reiniciarCacheFcm } from '../src/services/fcmService.ts';
import { TipoNotificacion } from '../../shared/src/types/estados.ts';

console.log('🧪 Iniciando pruebas del envío real de notificaciones con Firebase Cloud Messaging (FCM)...\n');

runSeed();

// ----------------------------------------------------------------------------
// Cuenta de servicio falsa con una llave RSA generada aquí y `fetch` simulado:
// no se habla con Google, pero se valida la firma del JWT y el cuerpo que se manda a FCM.
// ----------------------------------------------------------------------------
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const cuentaServicio = {
  project_id: 'agave-alerta-prueba',
  client_email: 'fcm@agave-alerta-prueba.iam.gserviceaccount.com',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  token_uri: 'https://oauth2.googleapis.com/token'
};

const fetchOriginal = globalThis.fetch;
const peticionesFcm: any[] = [];
let peticionesOAuth = 0;
/** Respuestas que dará FCM por token, en orden. Sin entrada → 200 OK. */
const guionFcm: Record<string, Array<{ status: number; body: any }>> = {};

globalThis.fetch = (async (url: any, init: any) => {
  const destino = String(url);

  if (destino === cuentaServicio.token_uri) {
    peticionesOAuth++;
    const assertion = new URLSearchParams(init.body).get('assertion')!;
    const [enc, reclamos, firma] = assertion.split('.');
    const verificador = createVerify('RSA-SHA256');
    verificador.update(`${enc}.${reclamos}`);
    assert.ok(verificador.verify(publicKey, Buffer.from(firma, 'base64url')), 'El JWT debe ir firmado con la llave de la cuenta de servicio');
    const datos = JSON.parse(Buffer.from(reclamos, 'base64url').toString());
    assert.strictEqual(datos.iss, cuentaServicio.client_email);
    assert.strictEqual(datos.scope, 'https://www.googleapis.com/auth/firebase.messaging');
    return new Response(JSON.stringify({ access_token: 'ya29.token-prueba', expires_in: 3600 }), { status: 200 });
  }

  if (destino === `https://fcm.googleapis.com/v1/projects/${cuentaServicio.project_id}/messages:send`) {
    assert.strictEqual(init.headers.Authorization, 'Bearer ya29.token-prueba');
    const cuerpo = JSON.parse(init.body);
    peticionesFcm.push(cuerpo);
    const siguiente = guionFcm[cuerpo.message.token]?.shift();
    if (siguiente) {
      return new Response(JSON.stringify(siguiente.body), { status: siguiente.status });
    }
    return new Response(JSON.stringify({ name: `projects/${cuentaServicio.project_id}/messages/0:1` }), { status: 200 });
  }

  throw new Error(`fetch inesperado en la prueba: ${destino}`);
}) as typeof fetch;

async function esperarEstado(idNotificacion: number, estados: string[], limiteMs = 2000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    const fila = db.prepare('SELECT * FROM notificacion WHERE id_notificacion = ?').get(idNotificacion) as any;
    if (estados.includes(fila.estado)) return fila;
    await new Promise((r) => setTimeout(r, 10));
  }
  const fila = db.prepare('SELECT * FROM notificacion WHERE id_notificacion = ?').get(idNotificacion) as any;
  assert.fail(`La notificación #${idNotificacion} quedó en ${fila.estado}, se esperaba ${estados.join(' o ')}`);
}

const citaRobert = db.prepare(`
  SELECT i.id_inspeccion FROM inspeccion i JOIN cliente c ON c.id_cliente = i.id_cliente
  WHERE c.id_cliente = 1 ORDER BY i.id_inspeccion LIMIT 1
`).get() as any;
assert.ok(citaRobert, 'La semilla debe tener al menos una cita del cliente #1');

function encolarPush(tipo: string = TipoNotificacion.EN_CAMINO) {
  const n = encolarNotificacion({
    idInspeccion: citaRobert.id_inspeccion,
    tipo: tipo as any,
    reenvioManual: true,
    programadaPara: '2026-10-15T12:00:00Z'
  });
  assert.strictEqual(n.canal, 'PUSH', 'El cliente #1 tiene dispositivo activo y prefiere PUSH');
  return n;
}

try {
  console.log('▶ [Prueba FCM-1] Sin credenciales el envío sigue simulado');
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  reiniciarCacheFcm();
  assert.strictEqual(fcmHabilitado(), false);
  const simulada = encolarPush();
  const resSim = despacharNotificacionesPendientes('2026-10-15T12:00:00Z');
  assert.strictEqual(resSim.modo, 'SIMULADO');
  assert.strictEqual((db.prepare('SELECT estado FROM notificacion WHERE id_notificacion = ?').get(simulada.id_notificacion) as any).estado, 'ENTREGADA');
  assert.strictEqual(peticionesFcm.length, 0);
  console.log('  ✔ Sin FIREBASE_SERVICE_ACCOUNT no se llama a Google y el PUSH se da por entregado.');

  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify(cuentaServicio);
  process.env.FCM_REINTENTO_BASE_MS = '5';
  reiniciarCacheFcm();
  assert.strictEqual(fcmHabilitado(), true);

  console.log('\n▶ [Prueba FCM-2] La app registra su token con idCliente (sin idUsuario)');
  const tokenReal = 'fcm-token-robert-pixel-8:APA91bPrueba';
  const disp = registrarDispositivo({ idCliente: 1, tokenPush: tokenReal, plataforma: 'ANDROID', versionApp: '1.0.0' } as any);
  assert.strictEqual(disp.id_usuario, 'u-cli-001');
  assert.throws(() => registrarDispositivo({ idCliente: 9999, tokenPush: 'x', plataforma: 'ANDROID' } as any), /no existe/);
  console.log('  ✔ El token queda ligado al usuario del cliente y es el dispositivo más reciente.');

  console.log('\n▶ [Prueba FCM-3] FCM acepta el mensaje → ENVIADA; el acuse de la app → ENTREGADA');
  const n1 = encolarPush(TipoNotificacion.EN_CAMINO);
  assert.strictEqual(n1.destinatario, tokenReal);
  const res1 = despacharNotificacionesPendientes('2026-10-15T12:00:00Z');
  assert.strictEqual(res1.modo, 'FCM');
  assert.strictEqual(res1.resultados.find((r: any) => r.idNotificacion === n1.id_notificacion)?.estado, 'ENVIANDO');
  // Un segundo despacho mientras FCM no contesta no debe duplicar el envío.
  despacharNotificacionesPendientes('2026-10-15T12:00:00Z');
  const enviada = await esperarEstado(n1.id_notificacion, ['ENVIADA']);
  assert.ok(enviada.enviada_en);
  assert.strictEqual(peticionesFcm.filter((p) => p.message.data.idNotificacion === String(n1.id_notificacion)).length, 1, 'Debe enviarse una sola vez');
  const mensaje = peticionesFcm.at(-1).message;
  assert.strictEqual(mensaje.token, tokenReal);
  assert.strictEqual(mensaje.notification.body, n1.cuerpo_renderizado);
  assert.strictEqual(mensaje.data.idInspeccion, String(citaRobert.id_inspeccion));
  assert.strictEqual(mensaje.data.tipo, 'EN_CAMINO');
  assert.strictEqual(mensaje.android.priority, 'HIGH', 'EN_CAMINO es urgente');
  assert.strictEqual(mensaje.android.notification.channel_id, 'agave_citas');
  assert.strictEqual(peticionesOAuth, 1);
  const acusada = registrarAcuseNotificacion(n1.id_notificacion);
  assert.strictEqual(acusada.estado, 'ENTREGADA');
  assert.ok(acusada.entregada_en);
  console.log('  ✔ Mensaje firmado, enviado una sola vez, con datos para la app y acuse de entrega.');

  console.log('\n▶ [Prueba FCM-4] Error transitorio (503) → reintento con espera y éxito');
  guionFcm[tokenReal] = [{ status: 503, body: { error: { code: 503, status: 'UNAVAILABLE', message: 'Servicio no disponible' } } }];
  const n2 = encolarPush(TipoNotificacion.RECORDATORIO);
  despacharNotificacionesPendientes('2026-10-15T12:00:00Z');
  const reintentada = await esperarEstado(n2.id_notificacion, ['ENVIADA']);
  assert.strictEqual(reintentada.intentos, 2);
  assert.strictEqual(peticionesOAuth, 1, 'El access token se reutiliza');
  console.log('  ✔ Se reintentó automáticamente y quedó ENVIADA en el intento 2.');

  console.log('\n▶ [Prueba FCM-5] 3 errores transitorios → FALLIDA con respaldo SMS');
  const errorRed = { status: 500, body: { error: { code: 500, status: 'INTERNAL', message: 'Error interno' } } };
  guionFcm[tokenReal] = [errorRed, errorRed, errorRed];
  const n3 = encolarPush(TipoNotificacion.POR_LLEGAR);
  despacharNotificacionesPendientes('2026-10-15T12:00:00Z');
  const agotada = await esperarEstado(n3.id_notificacion, ['FALLIDA']);
  assert.strictEqual(agotada.intentos, 3);
  const sms3 = db.prepare(`SELECT * FROM notificacion WHERE id_inspeccion = ? AND tipo = 'POR_LLEGAR' AND canal = 'SMS'`).get(citaRobert.id_inspeccion) as any;
  assert.ok(sms3, 'Debe existir el SMS de respaldo');
  assert.strictEqual(sms3.estado, 'ENTREGADA');
  assert.strictEqual((db.prepare('SELECT activo FROM dispositivo WHERE id_dispositivo = ?').get(disp.id_dispositivo) as any).activo, 1, 'Un error de red no apaga el dispositivo');
  console.log('  ✔ Tras 3 intentos se marcó FALLIDA y salió el SMS de respaldo.');

  console.log('\n▶ [Prueba FCM-6] Token no registrado (UNREGISTERED) → se apaga el dispositivo y sale SMS');
  guionFcm[tokenReal] = [{
    status: 404,
    body: { error: { code: 404, status: 'NOT_FOUND', message: 'Requested entity was not found.', details: [{ '@type': 'type.googleapis.com/google.firebase.fcm.v1.FcmError', errorCode: 'UNREGISTERED' }] } }
  }];
  const n4 = encolarPush(TipoNotificacion.LLEGADA);
  despacharNotificacionesPendientes('2026-10-15T12:00:00Z');
  const fallida = await esperarEstado(n4.id_notificacion, ['FALLIDA']);
  assert.strictEqual(fallida.intentos, 1, 'Un token inválido no se reintenta');
  assert.match(fallida.error, /UNREGISTERED|not found/i);
  assert.strictEqual((db.prepare('SELECT activo FROM dispositivo WHERE id_dispositivo = ?').get(disp.id_dispositivo) as any).activo, 0);
  const sms4 = db.prepare(`SELECT * FROM notificacion WHERE id_inspeccion = ? AND tipo = 'LLEGADA' AND canal = 'SMS'`).get(citaRobert.id_inspeccion) as any;
  assert.ok(sms4);
  console.log('  ✔ Dispositivo desactivado, notificación FALLIDA y respaldo SMS creado.');

  console.log('\n▶ [Prueba FCM-7] Clasificación de errores de FCM v1');
  assert.strictEqual(clasificarErrorFcm(400, { error: { message: 'The registration token is not a valid FCM registration token' } }), 'TOKEN_INVALIDO');
  assert.strictEqual(clasificarErrorFcm(400, { error: { message: 'Invalid JSON payload received.' } }), 'PERMANENTE');
  assert.strictEqual(clasificarErrorFcm(403, { error: { details: [{ errorCode: 'SENDER_ID_MISMATCH' }] } }), 'PERMANENTE');
  assert.strictEqual(clasificarErrorFcm(429, { error: { details: [{ errorCode: 'QUOTA_EXCEEDED' }] } }), 'TRANSITORIO');
  assert.strictEqual(clasificarErrorFcm(503, null), 'TRANSITORIO');
  console.log('  ✔ Token inválido, errores permanentes y transitorios se distinguen correctamente.');

  console.log('\n▶ [Prueba FCM-8] El panel cuenta ENVIADA como PUSH exitosa');
  const panel = listarNotificacionesPanel();
  const pushOk = panel.notificaciones.filter((n: any) => n.canal === 'PUSH' && ['ENVIADA', 'ENTREGADA'].includes(n.estado)).length;
  assert.strictEqual(panel.resumen.entregadasPush, pushOk);
  console.log('  ✔ Resumen del panel consistente con los estados ENVIADA y ENTREGADA.');
} finally {
  globalThis.fetch = fetchOriginal;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  reiniciarCacheFcm();
  runSeed();
}

console.log('\n=========================================================================');
console.log('🎉 TODAS LAS PRUEBAS DE FCM PASARON EXITOSAMENTE (100% OK)');
console.log('=========================================================================\n');
