# Guía: notificaciones push reales con Firebase Cloud Messaging (E08)

Sin configuración, la API y la app del cliente funcionan igual que antes: el envío **PUSH se simula** y las pruebas no dependen de internet. Con los tres pasos de esta guía, los avisos (día programado, recordatorio, en camino, por llegar, llegada, reporte) llegan al teléfono del cliente.

> **Alcance actual: solo Android.** El equipo no tiene cuenta de Apple Developer, que es obligatoria para recibir push en iOS. En iPhone la app funciona igual pero sin push: Firebase no arranca (no hay `GoogleService-Info.plist`) y la API usa el **SMS de respaldo** para esos clientes. El código de iOS ya está preparado; los pasos para activarlo están en la sección de trabajo futuro al final.

## Cómo funciona

```
App cliente ──(1) token FCM──▶ POST /api/dispositivos { idCliente, tokenPush, plataforma }
API ──(2) JWT firmado──▶ oauth2.googleapis.com ──▶ access token (1 h, se reutiliza)
API ──(3) mensaje──▶ fcm.googleapis.com/v1/projects/{id}/messages:send ──▶ teléfono
App cliente ──(4) acuse──▶ POST /api/notificaciones/{id}/acuse
```

| Resultado de FCM | Estado en `notificacion` | Qué más pasa |
|---|---|---|
| Mensaje aceptado | `ENVIADA` | Pasa a `ENTREGADA` cuando la app manda el acuse |
| `UNREGISTERED` o token inválido | `FALLIDA` | Se apaga el dispositivo (`activo = 0`) y sale el **SMS de respaldo** |
| 429 / 5xx / sin red | sigue `PENDIENTE` | Reintento con espera exponencial (2 s, 4 s); al 3.er intento → `FALLIDA` + SMS |
| Error de configuración (403, `SENDER_ID_MISMATCH`, payload inválido) | `FALLIDA` | SMS de respaldo, sin reintentar |

El despachador no espera a FCM (los servicios que lo llaman son síncronos): devuelve `estado: 'ENVIANDO'` y la fila se actualiza unos milisegundos después. El panel y los indicadores cuentan `ENVIADA` como push exitoso, porque iOS no deja mandar el acuse si la app está cerrada.

Código: `api/src/services/fcmService.ts` (cliente HTTP v1 sin dependencias), `api/src/services/notificacionService.ts` (despachador) y `app-cliente/lib/services/push_service.dart`.

## 1. Crear el proyecto en Firebase (una sola vez)

1. En <https://console.firebase.google.com> crear el proyecto (por ejemplo `agave-alerta`).
2. **Agregar app Android** con el paquete `com.agaveroofing.agave_app_cliente`. Descargar `google-services.json` y copiarlo a `app-cliente/android/app/google-services.json`.
3. El archivo está en `.gitignore`: cada integrante lo descarga de la consola.

## 2. Credenciales de la API

1. Consola de Firebase → ⚙️ *Configuración del proyecto* → **Cuentas de servicio** → *Generar nueva clave privada*.
2. Guardar el JSON **fuera del repositorio** o con el nombre `firebase-service-account.json` (ignorado por git). **Nunca subirlo**: da acceso para enviar mensajes a nombre del proyecto.
3. Arrancar la API con la ruta:

```bash
FIREBASE_SERVICE_ACCOUNT=/ruta/a/firebase-service-account.json npm run api
```

Al arrancar debe aparecer `🔔 Notificaciones push REALES con Firebase (proyecto agave-alerta)`. También se puede pasar el contenido en `FIREBASE_SERVICE_ACCOUNT_JSON` (útil en un servidor). `FCM_DESHABILITADO=1` fuerza el modo simulado.

## 3. App del cliente

**Android:** con `google-services.json` en su lugar, `flutter run` ya registra el token. En Android 13+ la app pide permiso de notificaciones al abrir. Para un teléfono físico, indicar la IP de la computadora:

```bash
flutter run --dart-define=API_URL=http://IP_DE_TU_COMPUTADORA:4000/api
```

## Probar

1. Abrir la app del cliente: en la consola de la API se ve `POST /api/dispositivos` y la tabla `dispositivo` tiene el token nuevo del cliente.
2. Desde el panel, **reenviar** una notificación de una cita de ese cliente (o `POST /api/notificaciones/despachar`). Debe llegar al teléfono.
3. Con la app abierta aparece un aviso verde y se recargan las citas; al tocar la notificación con la app cerrada, la app abre y recarga.
4. En la bitácora del panel la notificación queda `ENVIADA` (azul) o `ENTREGADA` (verde) si llegó el acuse.

**En emulador:** usar una imagen con Google Play (por ejemplo `google_apis_playstore`) y al menos ~1 GB libre. Si FCM acepta el mensaje (queda `ENVIADA`) pero no llega, Google Play Services del emulador puede estar desconectado tras arrancar; se fuerza la reconexión con:

```bash
adb shell am broadcast -a com.google.android.intent.action.MCS_HEARTBEAT
```

Los tokens de la semilla (`ExponentPushToken[...]`) son falsos: con FCM activo fallarán como `UNREGISTERED`, se apagará ese dispositivo y saldrá el SMS de respaldo. Es el comportamiento esperado hasta que el cliente abra la app real.

## Pendiente (fuera de este cambio)

- **Push en iOS** (ver abajo).

- Botones **Confirmar / Reprogramar** dentro de la notificación (requiere `flutter_local_notifications` con categorías de iOS y acciones de Android).
- SMS real por Twilio (el respaldo sigue simulado).
- App del inspector: no recibe push en esta versión.

### iOS (trabajo futuro)

Requiere cuenta de Apple Developer de pago (99 USD/año) y un iPhone físico; el simulador no recibe push de FCM.

0. En Firebase, **agregar app iOS** con el *bundle id* del proyecto (`PRODUCT_BUNDLE_IDENTIFIER` en `ios/Runner.xcodeproj`) y descargar `GoogleService-Info.plist` (ya está en `.gitignore`).

1. En Xcode, arrastrar `GoogleService-Info.plist` a `Runner/` marcando el target *Runner*.
2. *Signing & Capabilities* → **+ Capability** → *Push Notifications* (`Background Modes → Remote notifications` ya está en `Info.plist`).
3. En <https://developer.apple.com> crear una **llave APNs** (.p8) y subirla en Firebase → *Configuración* → *Cloud Messaging* → *Configuración de la app de Apple*.

