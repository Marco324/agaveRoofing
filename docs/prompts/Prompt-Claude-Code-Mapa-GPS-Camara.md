# Prompt para Claude Code — Mapa real, GPS y cámara (puntos 3 y 4)

> Cómo usarlo: abre Claude Code en la raíz del repositorio `agaveRoofing` y escribe:
> `Lee docs/prompts/Prompt-Claude-Code-Mapa-GPS-Camara.md y ejecútalo.`

---

## Contexto

Proyecto AgaveAlerta (Proyecto Integrador I, UANL) para Agave Roofing, San Antonio, TX. Monorepo:

- `api/`: Node 22 + TypeScript nativo con SQLite. Se levanta con `npm run seed && npm run api` en el puerto **4000**. **No usa Express**: las rutas están en `api/src/server.ts`.
- `panel/index.html`: panel web en una sola página (HTML + JS + Tailwind CDN). Se abre como archivo en el navegador.
- `app-inspector/` y `app-cliente/`: apps Flutter con patrón **MVP** (`models/`, `presenters/` con `contracts/`, `services/`, `views/`). Hoy solo dependen de `http`, `intl` y `url_launcher` (la del cliente ni eso).
- Documentación: las diferencias entre el SRS y lo construido están en `docs/02_SRS_Requerimientos.md` §5. **Actualízala al terminar** (pasa a "Completo" o "Parcial" lo que implementes).

**Fecha límite: jueves 19 de noviembre de 2026.** Prioriza que todo funcione en la demo sobre agregar alcance.

## Reglas

1. Antes de cambiar nada, lee los archivos que vas a tocar y corre `npm test` (deben pasar 28 de 28) y `flutter analyze` en las dos apps para tener la línea base.
2. Trabaja en una rama `feat/mapa-gps-camara` con un commit por bloque (A, B, C, D).
3. Respeta el patrón MVP: la vista no llama a la API directamente; la lógica nueva va en el presenter o en un servicio.
4. Textos de interfaz en español, sin códigos internos (nada de "RN-08", "E10", "EN_SITIO" a la vista del usuario final; usa frases como "En camino", "Llegó").
5. **Nada de datos inventados como respaldo**: si falta un dato, muestra "—" o un estado vacío, nunca valores fijos como `?? 1200`, `?? 8` o `?? "REGULAR"`.
6. Al final, `npm test` debe seguir en 28 de 28 y `flutter analyze` sin errores en las dos apps.

## Bloque A — URL de la API configurable (ambas apps)

- Hoy `baseUrl` es `http://localhost:4000/api`, fijo en `lib/services/*_api_service.dart`; en emulador Android o en teléfono real no funciona.
- Léelo de `const String.fromEnvironment('API_URL')`. Si viene vacío, usa `http://10.0.2.2:4000/api` en Android y `http://localhost:4000/api` en el resto.
- Documenta en `README.md` cómo correr con `flutter run --dart-define=API_URL=http://<IP>:4000/api`.
- Android: agrega `INTERNET` en el manifiesto y permite tráfico HTTP claro solo para desarrollo (`usesCleartextTraffic` o `network_security_config`). iOS: excepción ATS para desarrollo.

## Bloque B — App del cliente: mapa real con actualización automática

- Agrega `flutter_map` y `latlong2` (mapas de OpenStreetMap, sin llave de API).
- Cuando la próxima cita esté en `EN_CAMINO`, consulta `GET /api/inspecciones/:id/seguimiento`. La respuesta trae `trayecto.ultimoPunto`, `trayecto.rastroReciente`, `trayecto.etaMinutos`, `trayecto.distanciaRestanteM`, `trayecto.senalPerdida`, `trayecto.minutosDesdeUltimoPunto` y `domicilioDestino`. Revisa `obtenerSeguimientoVivo` en `api/src/services/trayectoService.ts` para los campos exactos.
- Muestra un mapa con un pin del domicilio, un pin del inspector y la línea del rastro. Debajo: ETA, distancia y "Actualizado hace X min". Si `senalPerdida` es verdadero, muestra "Última ubicación conocida hace X min" (RF-48).
- Refresca con `Timer.periodic` cada 15 s **solo** mientras la cita esté `EN_CAMINO` y la pantalla esté visible. Cancela el timer en `dispose` y cuando cambie el estado.
- Quita los valores de respaldo inventados en `proxima_cita_widget.dart` y `mis_citas_screen.dart` (`?? 1200`, `?? 8`, `?? "REGULAR"`, etc.).
- Accesibilidad (RNF-02): texto de contenido de al menos 16 y botones principales de al menos 48 dp de alto. "Ya estoy en casa" debe ser el botón principal cuando la cita esté `EN_CAMINO`.

## Bloque C — App del inspector: GPS real y cámara

**GPS**
- Agrega `geolocator` y pide el permiso explicando para qué se usa (RF-08). Si lo niegan, muestra un mensaje claro y no permitas iniciar el trayecto.
- "Voy en camino" envía la posición real en `latitudInicial` / `longitudInicial` (hoy está fija en 29.555, -98.485) y guarda el `trayecto.id_trayecto` de la respuesta.
- Mientras el trayecto esté activo, envía la posición cada 15 s a `POST /api/trayectos/:idTrayecto/punto` con `{ latitud, longitud, precisionM, velocidadMs, capturadoEn }`. Detén el envío al registrar llegada o cliente ausente.
- Con la app en primer plano es suficiente; el segundo plano real queda documentado como trabajo futuro.
- Muestra un indicador visible de "Compartiendo ubicación con el cliente".
- Conserva el botón de avance simulado solo detrás de un modo demo (por ejemplo, un interruptor en el perfil), no a la vista por defecto.

**Cámara**
- Agrega `image_picker`.
- En "Capturar resultado", el inspector toma o elige de 1 a 5 fotos, con miniaturas y opción de quitar. No se puede enviar sin al menos una (RN-11).
- En "Cliente ausente", la foto de fachada y la nota son obligatorias (RN-10).
- Quita las URLs de Unsplash fijas y el texto de hallazgos prellenado.
- La API no tiene subida de archivos. La opción más simple: reducir la foto a máximo 1280 px y calidad 70, convertirla a `data:image/jpeg;base64,...` y enviarla en `rutaArchivo` (el reporte HTML la muestra con `<img src>`).
- Verifica que `parseBody` en `server.ts` acepte el tamaño. Si agregas un límite, que sea de unos 15 MB con un error 413 claro.
- Convierte la captura de resultado en una pantalla completa con pasos (estado del techo → hallazgos → fotos → enviar), en lugar del `AlertDialog` actual.

**Idempotencia (RN-12)**
- Hoy `idLocal` se genera con la hora en cada envío, así que un reintento crea un id distinto.
- Genera el `idLocal` **una sola vez** al capturar la operación (UUID) y reúsalo en cada reintento de esa misma operación.

**Permisos**
- `AndroidManifest.xml`: ubicación fina y gruesa, cámara.
- `Info.plist`: `NSLocationWhenInUseUsageDescription`, `NSCameraUsageDescription` y `NSPhotoLibraryUsageDescription`, con textos en español.

## Bloque D — Panel: mapa real en el monitor en vivo

- En `panel/index.html`, pestaña Monitor, sustituye el mapa esquemático (`#mapaSanAntonioCanvas` / `#contenedorPinesMapa`) por Leaflet con tiles de OpenStreetMap.
- Dibuja un marcador por inspector en camino con `posicionActual`, un marcador del destino y una línea entre ambos. Los datos vienen de `GET /api/monitor-vivo?fecha=...` (función `cargarMonitorVivo`).
- El monitor ya se refresca cada 15 s (`monitorTimer`). Actualiza los marcadores sin recrear el mapa.
- Si Leaflet no carga (sin internet), muestra un aviso y deja la lista de tarjetas funcionando.

## Verificación final

1. `npm test` → 28 de 28.
2. `flutter analyze` en `app-inspector/` y `app-cliente/` → sin errores. Anota el resultado en `docs/entregas/E12/Comparativa-Contra-Proceso-Actual-y-Reporte-Final-Pruebas.md` §2.3.
3. Prueba manual en emulador o teléfono:
   1. El inspector pulsa "Voy en camino" con GPS real.
   2. En la app del cliente, el mapa se mueve solo cada 15 s.
   3. El panel muestra el pin moviéndose.
   4. El inspector registra la llegada; el mapa del cliente se apaga.
   5. El inspector captura el resultado con 2 fotos de la cámara y el reporte las muestra.
4. Actualiza `docs/02_SRS_Requerimientos.md` §5.3 (RF-08, RF-45, RF-46, RF-47, RF-54) y el README.
5. Resume qué quedó, qué no y por qué.
