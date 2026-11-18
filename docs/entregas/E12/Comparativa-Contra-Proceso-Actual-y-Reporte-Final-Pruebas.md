# Comparativa Contra el Proceso Actual y Reporte Consolidado de Pruebas (Entrega E12)

**Proyecto:** AgaveAlerta — Agave Roofing (San Antonio, TX)  
**Autores:** Mario (AN), Jesús (CL) y Anuar (IN)  
**Última actualización:** 17 de noviembre de 2026 (las secciones 3 y 4 se completan después de la sesión del 19 de noviembre)  

---

## 1. Comparativa operativa: proceso por correo vs. AgaveAlerta

**Proceso actual.** Agave Roofing avisa las citas de inspección únicamente por correo electrónico, sin mecanismo de confirmación ni aviso del traslado. Según el levantamiento inicial con la empresa, esto provoca alrededor de **18 % de visitas fallidas** con un costo aproximado de **$65 USD por vuelta perdida** (combustible y horas-hombre).

> ⚠️ **Pendiente:** confirmar la fuente de estas dos cifras (entrevista, registro de la empresa o estimación del equipo) y citarla aquí. El panel muestra hoy "32 %" como línea base; debe corregirse para que coincida.

**Cambios que introduce AgaveAlerta** (beneficios esperados, demostrados con datos de prueba):

| Momento | Proceso por correo | AgaveAlerta |
| :--- | :--- | :--- |
| Aviso de la cita | Correo que el cliente puede no leer | Notificación con acciones *Confirmar* / *Reprogramar*, recordatorio previo y respaldo por SMS si el aviso falla (envío simulado en esta versión) |
| Cliente que no puede asistir | Se entera la empresa cuando el inspector ya llegó | El cliente elige otro horario disponible antes de la visita (RN-05, RN-06); las citas sin respuesta pasan a `SIN_CONFIRMAR` para que la oficina llame (RN-07) |
| Día de la visita | El cliente no sabe a qué hora llega el inspector | Aviso "va en camino", seguimiento con ETA, aviso "está por llegar" y botón "Ya estoy en casa" |
| Cita que se queda sin atender | Nadie se entera; la cita sigue "programada" para siempre | Al pasar la fecha, la cita se cierra sola como **no realizada** o **sin cerrar** y aparece en la bandeja de la oficina para darle nueva fecha (RN-18); el cliente puede pedir otra visita desde su historial |
| Medición | No existe | Tablero con tasa de confirmación, visitas fallidas, visitas no realizadas, puntualidad y efectividad de avisos, exportable a CSV |

El efecto real sobre las visitas fallidas **solo se puede afirmar después de un piloto con clientes reales**; con los datos de prueba hay una sola visita realizada, por lo que no es representativo.

---

## 2. Reporte consolidado de pruebas

### 2.1 Pruebas automatizadas de la API

Ejecutadas con `npm test` el **17 de noviembre de 2026** (rama `feat/mapa-gps-camara`). Desde esta versión `npm test` siembra su propia base `data/prueba.db` (variable `AGAVE_DB_PATH`) y **no toca** la base de la demostración; las suites E07–E11 corren con `FECHA_HOY=2026-10-15`, la fecha de sus datos de prueba, para no depender del reloj.

| Suite | Archivo | Escenarios | Aprobados | Fallidos |
| :--- | :--- | :---: | :---: | :---: |
| Agenda y máquina de estados (E07) | `api/test/agenda.test.ts` | 7 | 7 | 0 |
| Notificaciones (E08) | `api/test/e08_e09.test.ts` | 5 | 5 | 0 |
| Confirmación y reprogramación (E09) | `api/test/e08_e09.test.ts` | 6 | 6 | 0 |
| Trayecto y seguimiento en vivo (E10) | `api/test/e10_e11.test.ts` | 5 | 5 | 0 |
| Llegada, resultado, modo sin señal y tablero (E11) | `api/test/e10_e11.test.ts` | 5 | 5 | 0 |
| Citas pasadas (RN-18, RN-19) | `api/test/citas_pasadas.test.ts` | 14 | 14 | 0 |
| Fecha de referencia (RN-19) | `api/test/fecha_referencia.test.ts` | 4 | 4 | 0 |
| **Total automatizado** | | **46** | **46** | **0** |

**Qué cubre la suite de citas pasadas:** corte por fecha (lo anterior pasa a `NO_REALIZADA` o `PENDIENTE_CIERRE` y lo demás no cambia); registro en el historial con origen `SISTEMA`; ejecutarlo dos veces no cambia nada; las visitas en curso dejan de enviar GPS; resultado, llegada y ausencia que llegan tarde (modo sin señal) cierran la cita sin avisar la llegada al cliente; `REPROG_SOLICITADA` no vence sola; una cita vencida se reprograma conservando el folio (por el cliente o por la oficina); los horarios y las fechas nuevas nunca son pasadas; una visita sin cerrar no se puede mover; ningún cliente ve una cita pasada como "próxima"; y el tablero cuenta las visitas no realizadas.

**Ajuste a una prueba existente:** `agenda.test.ts` (prueba 7) esperaba que el cliente 1 tuviera "próxima cita" aunque todas sus citas fueran pasadas, porque la API mostraba una cita pasada cuando no había futuras. Ese era un defecto (ver PEND-06); la prueba ahora fija "hoy" en la fecha de sus datos y verifica además que la próxima cita no sea pasada.

### 2.2 Pruebas manuales

| Suite | Evidencia | Casos | Estado |
| :--- | :--- | :---: | :--- |
| Seguridad y catálogos (E05–E06) | `docs/pruebas/Casos-de-Prueba-Seguridad-y-Catalogos-E05-E06.md` | 9 | Documentados como aprobados (ver observaciones) |
| Agenda, notificaciones, trayecto y ejecución (E07–E11) | `docs/pruebas/resultados/` | — | Bitácoras de ejecución de Jesús (CL) |

**Observaciones sobre la suite E05–E06:**

- **CP-E05-03 (OTP del cliente):** la API de demostración no envía ni valida un código OTP; el caso valida el flujo simulado, no la autenticación real.
- **CP-E05-04 (aislamiento entre clientes):** el aislamiento depende del `idCliente` que envía la app. Si se cambia ese parámetro se pueden consultar citas de otro cliente, porque la API no valida un token. Debe reportarse como **pendiente** (RF-07, RN-16).

### 2.3 Análisis estático de Flutter

| App | Comando | Resultado |
| :--- | :--- | :--- |
| `app-inspector` | `flutter analyze` | **Sin avisos** ("No issues found!") — 17 nov 2026, rama `feat/mapa-gps-camara`, Flutter 3.35.1 |
| `app-cliente` | `flutter analyze` | **Sin avisos** ("No issues found!") — 17 nov 2026, rama `feat/mapa-gps-camara`, Flutter 3.35.1 |
| `app-inspector` | `flutter test test/selector_dias_test.dart test/parada_card_test.dart` | **7 de 7** — 17 nov 2026. Selector semanal y calendario sin desbordes a 320, 375 y 430 px con texto al 130 % e insignia de visitas sin cerrar; tarjeta de parada sin cerrar, no realizada y "Voy en camino" solo el día de la visita |

Además, el 15 nov 2026 `npm test` siguió en **28 de 28** tras los cambios de mapa, GPS y cámara, y ambas apps compilan para el simulador de iOS (`flutter build ios --simulator --debug`).

> `flutter test` sin argumentos sigue fallando en las dos apps porque `test/widget_test.dart` es la plantilla del contador de Flutter (busca un botón "+" que no existe). En la app del inspector es la única que falla (7 aprobadas, 1 fallida); ver PEND-TEST-01 en §4.

### 2.4 Pruebas en teléfono real y de campo

El calendario (§1) pide pruebas en teléfono real y al menos una prueba de campo por entrega desde E10. Registrar aquí cuáles se hicieron:

| Fecha | Dispositivo | Escenario | Resultado |
| :--- | :--- | :--- | :--- |
| 15/nov/2026 | Simulador iPhone 16 Pro (iOS 18.5) | App del cliente: con la cita en camino se ve el mapa (OpenStreetMap) con domicilio, inspector y rastro; al llegar un punto nuevo, el mapa, la distancia y el ETA se actualizan solos en el siguiente ciclo de 15 s (4.5 km → 1.7 km sin tocar la app) | Aprobado |
| 15/nov/2026 | Simulador iPhone 16 Pro (iOS 18.5) | App del cliente: sin puntos nuevos por más de 45 s muestra "Última ubicación conocida hace X min" (RF-48) | Aprobado |
| 15/nov/2026 | Simulador iPhone 16 Pro (iOS 18.5) | App del cliente: al registrar la llegada el mapa se apaga y la cita pasa a "Llegó" | Aprobado |
| 15/nov/2026 | API (curl) | Trayecto con coordenadas reales, punto GPS, llegada y resultado con 2 fotos en base64; reintento con el mismo `idLocal` no duplica; el reporte HTML muestra las 2 fotos; cuerpo > 15 MB → 413 | Aprobado |
| 15/nov/2026 | Navegador (panel) | Monitor con Leaflet: marcadores de inspector y domicilio con línea; el refresco mueve el mismo marcador sin recrear el mapa; sin Leaflet aparece el aviso y la lista sigue | Aprobado |
| 17/nov/2026 | API (curl), base aparte y `FECHA_HOY=2026-11-12` | Al arrancar se cierran 7 citas pasadas como `NO_REALIZADA`; `GET /sistema/fecha` informa la fecha de demo; la próxima cita del cliente 1 es la del día y su historial muestra las no realizadas | Aprobado |
| 17/nov/2026 | Navegador (panel), API con `FECHA_HOY=2026-11-13` | La agenda abre en el 13 de noviembre con "Fecha de demo"; la bandeja *Visitas que requieren atención* muestra 2 sin cerrar y 8 no realizadas; *Marcar como no realizada* y *Dar nueva fecha* (INS-2026-000012 → 19 nov, `REPROGRAMADA`) funcionan y la cita sale de la bandeja; el indicador muestra "8 (66.7 %) · 1 más sin cerrar"; sin errores en la consola | Aprobado |
| _Pendiente_ | Simulador o teléfono | Apps Flutter con citas pasadas: tarjeta "Sin cerrar" del inspector (cerrar con resultado), insignia roja en la tira semanal y botón "Agendar nueva visita" del cliente. Cubierto por pruebas de widget en el inspector; falta verlo en la app real | Por ejecutar |
| _Pendiente_ | Teléfono real o emulador con GPS | App del inspector: "Voy en camino" con GPS real, envío cada 15 s, captura con 2 fotos de la cámara (el simulador de iOS no tiene cámara) | Por ejecutar |

---

## 3. Encuesta a clientes piloto (llenar después de aplicarla)

Preguntas: (1) ¿Entendiste la notificación? (2) ¿Fue fácil confirmar? (3) ¿Te sirvió ver el mapa con el ETA y el reporte?

| Cliente piloto | Zona | P1 | P2 | P3 | Comentario textual |
| :--- | :--- | :---: | :---: | :---: | :--- |
| | | | | | |
| | | | | | |
| | | | | | |

Si no se logra aplicar con clientes reales, indicar aquí que la encuesta queda **pendiente** y no usar respuestas de ejemplo.

---

## 4. Defectos y pendientes conocidos al cierre

| ID | Descripción | Severidad | Estado |
| :--- | :--- | :--- | :--- |
| PEND-01 | La API no valida token ni rol; las rutas aceptan `idCliente` / `idInspector` por parámetro | Alta | Trabajo futuro |
| PEND-GPS-01 | La app del inspector envía la ubicación solo en primer plano; falta el envío en segundo plano y el disparo cada 50 m (RF-45) | Media | Trabajo futuro |
| PEND-TEST-01 | `test/widget_test.dart` de ambas apps es la plantilla del contador y falla; hay que reemplazarlo por pruebas reales | Baja | Abierto. La app del inspector ya tiene 7 pruebas de widget reales (17 nov 2026); falta quitar la plantilla y agregar pruebas a la app del cliente |
| PEND-02 | Push, SMS y ETA con Google Directions simulados | Media | Trabajo futuro |
| PEND-03 | Apps Flutter sin GPS real, cámara ni cola sin conexión (sí están en el simulador web) | Alta | GPS real (primer plano), cámara, mapa e `idLocal` estable: corregido (15 nov 2026). Cola sin conexión: trabajo futuro |
| PEND-04 | Panel: botones Reasignar / Mover / Cancelar del detalle de cita sin acción; catálogos y fechas fijas en el código | Media | Corregido (13 nov 2026) |
| PEND-05 | Reporte generado en HTML, no en PDF | Baja | Trabajo futuro |
| PEND-06 | Las citas pasadas sin atender se quedaban en su estado original para siempre (p. ej. "Programada" en octubre), y si el cliente no tenía citas futuras la app le mostraba una cita pasada como "próxima inspección". El "hoy" se calculaba en UTC (después de las 6 pm de San Antonio ya era el día siguiente) | Media | Corregido (17 nov 2026): RN-18 y RN-19 |
| PEND-07 | El cierre de citas pasadas es permanente en la base: si la API se arranca con la fecha real (`npm run api`), las citas de demostración del 12 de noviembre se cierran. Para la demo usar `npm run api:demo`; si ya ocurrió, volver a sembrar con `npm run seed` | Baja | Documentado (README y guion de la presentación) |
| PEND-08 | Los simuladores web (`app-inspector/simulador_web` y `app-cliente/simulador_web`) no tienen textos ni acciones para `NO_REALIZADA` / `PENDIENTE_CIERRE`, y el del inspector conserva sus botones de fechas fijas. Las apps Flutter y el panel sí los manejan | Baja | Trabajo futuro |
