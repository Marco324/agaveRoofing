# Comparativa Contra el Proceso Actual y Reporte Consolidado de Pruebas (Entrega E12)

**Proyecto:** AgaveAlerta — Agave Roofing (San Antonio, TX)  
**Autores:** Mario (AN), Jesús (CL) y Anuar (IN)  
**Última actualización:** 13 de noviembre de 2026 (las secciones 3 y 4 se completan después de la sesión del 19 de noviembre)  

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
| Medición | No existe | Tablero con tasa de confirmación, visitas fallidas, puntualidad y efectividad de avisos, exportable a CSV |

El efecto real sobre las visitas fallidas **solo se puede afirmar después de un piloto con clientes reales**; con los datos de prueba hay una sola visita realizada, por lo que no es representativo.

---

## 2. Reporte consolidado de pruebas

### 2.1 Pruebas automatizadas de la API

Ejecutadas con `npm test` el **13 de noviembre de 2026** sobre una base recién sembrada (`npm run seed`).

| Suite | Archivo | Escenarios | Aprobados | Fallidos |
| :--- | :--- | :---: | :---: | :---: |
| Agenda y máquina de estados (E07) | `api/test/agenda.test.ts` | 7 | 7 | 0 |
| Notificaciones (E08) | `api/test/e08_e09.test.ts` | 5 | 5 | 0 |
| Confirmación y reprogramación (E09) | `api/test/e08_e09.test.ts` | 6 | 6 | 0 |
| Trayecto y seguimiento en vivo (E10) | `api/test/e10_e11.test.ts` | 5 | 5 | 0 |
| Llegada, resultado, modo sin señal y tablero (E11) | `api/test/e10_e11.test.ts` | 5 | 5 | 0 |
| **Total automatizado** | | **28** | **28** | **0** |

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
| `app-inspector` | `flutter analyze` | _Por ejecutar y registrar (fecha y número de avisos)_ |
| `app-cliente` | `flutter analyze` | _Por ejecutar y registrar (fecha y número de avisos)_ |

### 2.4 Pruebas en teléfono real y de campo

El calendario (§1) pide pruebas en teléfono real y al menos una prueba de campo por entrega desde E10. Registrar aquí cuáles se hicieron:

| Fecha | Dispositivo | Escenario | Resultado |
| :--- | :--- | :--- | :--- |
| | | | |

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
| PEND-02 | Push, SMS y ETA con Google Directions simulados | Media | Trabajo futuro |
| PEND-03 | Apps Flutter sin GPS real, cámara ni cola sin conexión (sí están en el simulador web) | Alta | Trabajo futuro |
| PEND-04 | Panel: botones Reasignar / Mover / Cancelar del detalle de cita sin acción; catálogos y fechas fijas en el código | Media | Corregido (13 nov 2026) |
| PEND-05 | Reporte generado en HTML, no en PDF | Baja | Trabajo futuro |
