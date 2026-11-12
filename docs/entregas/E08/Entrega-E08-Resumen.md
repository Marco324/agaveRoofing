# Documento Ejecutivo de Entrega de Avance — E08
## Sistema de Alerta y Seguimiento de Inspecciones de Techo — Agave Roofing (San Antonio, TX)
### AgaveAlerta

---

**Universidad Autónoma de Nuevo León — Facultad de Ingeniería Mecánica y Eléctrica (FIME)**  
**Unidad de Aprendizaje:** Proyecto Integrador I  
**Catedrática:** Raquel Martínez Martínez  
**Equipo:** Equipo 01  
**Hito de la Entrega:** Motor de notificaciones push · Registro de dispositivos · Horario de silencio (RN-14) · Respaldo por SMS  
**Sprint:** Sprint 4 (Semana 7)  
**Fecha de Entrega:** Jueves 22 de octubre de 2026  
**Etiqueta de Git:** `entrega-08`  

---

## 1. Resumen Ejecutivo del Incremento E08

En la entrega **E08** se construyó el **Motor de Notificaciones Push con Respaldo por SMS**, que constituye la razón de ser del proyecto frente al proceso anterior por correo electrónico. El incremento incluye:

1. **Tablas y Plantillas (`dispositivo`, `plantilla_notificacion`, `notificacion`, `configuracion`):**
   * Renderizado dinámico de marcadores (`{{cliente}}`, `{{fecha}}`, `{{ventana}}`, `{{inspector}}`, `{{eta}}`, `{{enlace}}`).
2. **Despachador con Reintentos y Respaldo SMS (Twilio):**
   * Hasta 3 intentos con espera creciente. Si el token Push está vencido (`DeviceNotRegistered`) o el cliente no otorgó permiso, se apaga el dispositivo inválido y se envía automáticamente un **SMS de respaldo** con enlace de confirmación.
3. **Cumplimiento estricto de RN-13 (No duplicidad) y RN-14 (Horario de silencio 21:00 a 07:00):**
   * Índice único parcial `ux_notificacion_unica` sobre `(id_inspeccion, tipo) WHERE reenvio_manual = 0`.
   * Los avisos no urgentes programados entre 21:00 y 07:00 se posponen a las 07:00 AM; los urgentes (`EN_CAMINO`, `POR_LLEGAR`) salen siempre de inmediato.

---

## 2. Entregables por Integrante en E08

* **Marco Antonio Méndez Sánchez (LP):**
  * Vista de notificaciones en el panel ([panel/index.html](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/panel/index.html) y [NotificacionesYReprogramaciones.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/panel/src/pages/NotificacionesYReprogramaciones.tsx)) con botón **Reenviar** (`reenvio_manual = true`) y alerta de **"Cliente no alcanzado"**.
  * Bitácora de entregabilidad del riesgo R4 con 22 envíos medidos ([Marco-Bitacora-Entregabilidad-R4.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/entregas/E08/Marco-Bitacora-Entregabilidad-R4.md)).
* **Jorge Alberto Barbosa García (BD):**
  * Motor de notificaciones completo en [notificacionService.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/src/services/notificacionService.ts) y endpoints REST en [server.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/src/server.ts).
* **Anuar Guadalupe Hernández Hernández (IN):**
  * Recepción y ruteo de notificaciones del inspector (cita asignada, reprogramada y cliente en casa) en los 3 estados de la app ([notificacionesInspector.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-inspector/src/services/notificacionesInspector.ts)).
* **Jesús Mario Bazaldúa Bustos (CL):**
  * Recepción de aviso de 24 h y recordatorio de 3 h con botones de acción (`"Sí estaré"` y `"Mover cita"`), navegación directa al detalle y tarjeta de estado de envíos ([notificacionesCliente.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-cliente/src/services/notificacionesCliente.ts)).
* **Mario Martínez González (AN):**
  * Manual Capítulo 5 ([Manual-Capitulo-5-Notificaciones-y-Confirmacion.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/manual/Manual-Capitulo-5-Notificaciones-y-Confirmacion.md)), revisión de plantillas y casos de prueba de notificaciones ([Casos-de-Prueba-Notificaciones-y-Confirmacion-E08-E09.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/pruebas/Casos-de-Prueba-Notificaciones-y-Confirmacion-E08-E09.md)).
