# Acta de Aceptación Final del Sistema AgaveAlerta (Entrega E12)

> **Estado del documento: BORRADOR — pendiente de la sesión de cierre con el cliente.**
> Las secciones 3 y 4 se llenan **durante o después** de la sesión del jueves 19 de noviembre de 2026. Hasta entonces no deben contener resultados ni firmas.

**Fecha de la sesión de cierre:** jueves 19 de noviembre de 2026  
**Lugar / modalidad:** _______________________ (presencial / videollamada)  
**Proyecto:** AgaveAlerta — Sistema de Gestión de Inspecciones de Techos, Seguimiento en Tiempo Real y Alertas de Ruta  
**Empresa cliente:** Agave Roofing (San Antonio, Texas)  

---

## 1. Alcance entregado (Release 1.0 — versión académica de demostración)

El equipo entrega una plataforma compuesta por una **API central** y **tres servicios** (panel web, app del inspector y app del cliente). La versión entregada corre en un **entorno local de demostración** (API Node.js + SQLite con datos de prueba generados por `npm run seed`). Las integraciones externas (push, SMS y cálculo de rutas) están **simuladas** dentro de la API. El detalle de las diferencias contra el SRS v1.0 está en la sección 5 de [02_SRS_Requerimientos.md](../../02_SRS_Requerimientos.md).

### 1.1 API central (`api/`)

- Máquina de estados de la inspección con 13 estados y transiciones validadas (RN-01), incluido el cierre automático de citas pasadas (RN-18).
- Agenda con folio único `INS-YYYY-NNNNNN`, bloqueo de traslapes (RN-02), reasignación, cambio de fecha y cancelación con motivo.
- Motor de notificaciones con registro de estados, reintentos (máx. 3) y respaldo por SMS, **con envío simulado** (no se conecta a FCM ni a Twilio).
- Confirmación, horarios disponibles y solicitudes de reprogramación con límite de 3 (RN-04 a RN-06), y barrido de citas `SIN_CONFIRMAR` (RN-07).
- Trayecto con un solo trayecto activo por inspector (RN-03), puntos GPS, ETA **estimado** (no usa Google Directions), aviso `POR_LLEGAR` y privacidad de ubicación (RN-08, RN-09).
- Llegada, resultado con al menos una foto (RN-11), cliente ausente con foto y nota (RN-10), sincronización en lote idempotente por `id_local` (RN-12), mensajería, reporte en HTML, indicadores con exportación CSV y purga de puntos GPS (RN-17).
- Los temporizadores (despachador, sin confirmar, cierre de trayectos de más de 90 min) se ejecutan **bajo demanda** desde el panel; no hay un programador automático.

### 1.2 Panel web de administración (`panel/index.html`)

- Agenda por día, alta de inspecciones, detalle de cita, bitácora de notificaciones con reenvío manual, bandeja de reprogramaciones y citas sin confirmar, monitor del día (mapa esquemático) y tablero de indicadores con CSV.
- Catálogo de clientes (alta y baja lógica), domicilios, bitácora y encuestas.

### 1.3 App del inspector (Flutter `app-inspector/` + simulador web)

- **Flutter:** ruta del día, "Voy en camino", avance GPS **simulado**, registro de llegada, captura de resultado y cliente ausente (con fotos de ejemplo, sin cámara), y apertura de la dirección en Google Maps, Apple Maps o Waze.
- **Simulador web:** además de lo anterior, mensajería con el cliente y cola sin conexión con sincronización idempotente.

### 1.4 App del cliente (Flutter `app-cliente/` + simulador web)

- **Flutter:** próxima cita e historial, confirmación de asistencia, reprogramación con horarios disponibles, aviso "Ya estoy en casa", tarjeta de seguimiento con distancia y ETA (actualización manual), consulta del reporte y encuesta piloto.
- **Simulador web:** además de lo anterior, notificaciones simuladas, mapa de seguimiento y mensajería con el inspector.

### 1.5 Fuera de esta versión (trabajo futuro)

Inicio de sesión real con Supabase Auth y OTP por SMS, autorización por token en la API, notificaciones push reales (FCM/APNs) y SMS reales (Twilio), mapa con cartografía real y ETA con Google Directions, GPS en segundo plano y cámara en las apps Flutter, cola sin conexión en SQLite dentro de la app Flutter del inspector, generación de PDF, migración a PostgreSQL/Supabase y despliegue en la nube.

---

## 2. Evidencia técnica verificable

| Evidencia | Cómo verificarla | Resultado (13 nov 2026) |
| :--- | :--- | :--- |
| Pruebas automatizadas de la API (E07 a E11) | `npm test` en la raíz | **28 de 28 escenarios aprobados** |
| Casos de prueba manuales de Seguridad y Catálogos (E05–E06) | `docs/pruebas/Casos-de-Prueba-Seguridad-y-Catalogos-E05-E06.md` | 9 casos documentados (ver observaciones en el reporte final) |
| Análisis estático Flutter | `flutter analyze` en `app-inspector/` y `app-cliente/` | _Por ejecutar y registrar antes de la entrega_ |

---

## 3. Criterios de éxito (§11 del Plan de Proyecto)

Los valores de la columna "Demostración" provienen del tablero de indicadores calculado sobre los **datos de prueba** (`npm run seed`, 12 citas del 1 de octubre al 19 de noviembre de 2026). **No son resultados de un piloto con clientes reales** y no deben presentarse como tales.

| Criterio | Meta (Plan §11) | Demostración (datos de prueba) | Piloto real (llenar el 19 nov) |
| :--- | :---: | :---: | :---: |
| Citas confirmadas o reprogramadas antes de la visita | ≥ 80 % | 66.7 % confirmadas (8 de 12) + 1 reprogramada | ________ |
| Visitas fallidas (`CLIENTE_AUSENTE`) | Reducción frente al proceso por correo | 0 (con solo 1 visita realizada; no es representativo) | ________ |
| Entregabilidad de avisos (push + respaldo SMS) | — | No medible: envíos simulados | ________ |
| Confirmación en menos de 3 toques desde la notificación | Sí | Demostrable solo en el simulador web | ________ |
| Satisfacción de clientes piloto (encuesta de 3 preguntas) | — | Sin encuestas aplicadas | ________ |

---

## 4. Observaciones y conformidad del cliente

**Observaciones del cliente durante la sesión:**

_____________________________________________________________________________

_____________________________________________________________________________

**Decisión del cliente** (marcar una):

- [ ] Se acepta la versión de demostración tal como se presentó.
- [ ] Se acepta con las observaciones anotadas arriba.
- [ ] No se acepta; se acuerdan los siguientes pasos: ____________________________

---

## 5. Firmas

| Rol | Nombre | Firma | Fecha |
| :--- | :--- | :--- | :--- |
| Responsable de Operaciones — Agave Roofing | | | |
| Líder de Proyecto (LP) | Marco Antonio Méndez Sánchez (2177912) | | |
| Arquitectura, Base de Datos y API (BD) | Jorge Alberto Barbosa García (2071973) | | |
| App del Inspector (IN) | Anuar Guadalupe Hernández Hernández (1905467) | | |
| App del Cliente y QA (CL) | Jesús Mario Bazaldúa Bustos (2014834) | | |
| Análisis y Documentación (AN) | Mario Martínez González (2056182) | | |
