# Especificación de Casos de Prueba — Notificaciones Push (E08) y Confirmación / Reprogramación (E09)
## Sistema AgaveAlerta — Agave Roofing (San Antonio, Texas)

**Diseñado por:** Mario Martínez González (AN — Analista / QA)  
**Ejecutado por:** Jesús Mario Bazaldúa Bustos (CL — Desarrollador Móvil / Pruebas)  
**Sprints cubiertos:** Sprint 4 (Entregas E08 del 22/oct/2026 y E09 del 29/oct/2026)  

---

## 1. Matriz de Casos de Prueba — Módulo 4: Notificaciones Push y Respaldo SMS (E08)

| ID Caso | Escenario / Condición de Prueba | Regla / RF | Entrada / Precondición | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **CP-NOT-01** | Registro e idempotencia de token de dispositivo móvil | RF-26 | `POST /api/dispositivos` con token Push (FCM) repetido y nueva versión de app | Actualiza `ultimo_uso` y `version_app` sin duplicar renglón en tabla `dispositivo`. |
| **CP-NOT-02** | Envío de aviso del día programado (24 h antes) y transición a `NOTIFICADA` | RF-27, RN-01 | Cita en estado `PROGRAMADA` a 24 h de su ventana | Se renderiza plantilla `DIA_PROGRAMADO`, se entrega vía `PUSH` y la cita pasa a `NOTIFICADA`. |
| **CP-NOT-03** | Bloqueo de notificación automática duplicada | **RN-13** | Intentar encolar por segunda vez `DIA_PROGRAMADO` automático (`reenvio_manual = false`) | Se rechaza con error `409 Conflict` (`NOTIFICACION_DUPLICADA_RN13`) por índice único parcial. |
| **CP-NOT-04** | Reenvío manual desde el panel del administrador | **RN-13**, RF-32 | `POST /api/notificaciones/:id/reenviar` desde el panel web | Se crea nuevo registro con `reenvio_manual = true` y se entrega sin bloqueo de índice único. |
| **CP-NOT-05** | Respeto del horario de silencio nocturno (21:00 a 07:00) | **RN-14** | Encolar aviso no urgente (`DIA_PROGRAMADO` o `RECORDATORIO`) a las `22:45` | `programada_para` se ajusta automáticamente a las `07:00:00` de la mañana siguiente. |
| **CP-NOT-06** | Excepción de horario de silencio para avisos urgentes | **RN-14** | Encolar aviso urgente (`EN_CAMINO` o `POR_LLEGAR`) a las `22:45` | Sale de inmediato sin posponerse, conservando su timestamp original. |
| **CP-NOT-07** | Token Push vencido / permiso denegado y respaldo automático por SMS (Twilio) | RF-30, Riesgo R4 | Dispositivo con token inválido (`DeviceNotRegistered`) o cliente sin permiso push | El dispositivo se marca `activo = 0`, la push queda `FALLIDA` y se dispara y entrega automáticamente un **SMS de respaldo** al teléfono del cliente. |
| **CP-NOT-08** | Navegación desde notificación en los 3 estados de la app (abierta, segundo plano y cerrada) | RF-29 | Tocar notificación en `FOREGROUND`, `BACKGROUND` y `KILLED` en teléfono real | En los tres estados abre directamente el detalle de la cita correspondiente (`DetalleCita` / `DetalleParada`). |

---

## 2. Matriz de Casos de Prueba — Módulo 5: Confirmación y Reprogramación (E09)

| ID Caso | Escenario / Condición de Prueba | Regla / RF | Entrada / Precondición | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **CP-CNF-01** | Confirmar asistencia desde botón de acción de la notificación sin abrir la app | RF-35, **RN-04** | Pulsar botón `"Sí estaré"` con el teléfono bloqueado / app en segundo plano | `POST /api/inspecciones/:id/confirmar` pasa la cita a `CONFIRMADA`, guarda `confirmado_en` y registra auditoría en `inspeccion_historial`. |
| **CP-CNF-02** | Confirmar asistencia desde el detalle de la cita en la app | RF-35, **RN-04** | Pulsar botón `"Sí estaré en mi domicilio"` en `DetalleCitaScreen` | La cita pasa a `CONFIRMADA` y muestra confirmación visual clara al cliente y en la ruta del inspector. |
| **CP-CNF-03** | Consulta de horarios disponibles reales en la zona del domicilio | RF-38, **RN-02** | `GET /api/inspecciones/:id/horarios-disponibles` para cita en Alamo Heights | Devuelve bloques dentro del horario de operación excluyendo ventanas donde el inspector de la zona ya tiene cita asignada. |
| **CP-CNF-04** | Solicitud de reprogramación del cliente y aprobación en bandeja del admin conservando folio | RF-39, RF-40, **RN-06** | Cliente solicita nuevo horario (`REPROG_SOLICITADA`) y Admin aprueba en bandeja | La cita cambia a la nueva fecha/ventana, **conserva su mismo folio `INS-2026-XXXXXX`**, incrementa `veces_reprogramada` y envía notificación `REPROGRAMADA`. |
| **CP-CNF-05** | Rechazo de solicitud de reprogramación con motivo | RF-41 | Admin rechaza solicitud en bandeja indicando motivo | Solicitud queda `RECHAZADA`, cita regresa a `NOTIFICADA` y la app del cliente muestra el motivo del rechazo. |
| **CP-CNF-06** | Bloqueo de reprogramación cuando el inspector ya va en camino | **RN-05** | Intentar solicitar reprogramación de una cita en estado `EN_CAMINO` | La API rechaza con `400 Bad Request` (`REPROGRAMACION_EN_CAMINO_RN05`) y la app muestra mensaje humano claro. |
| **CP-CNF-07** | Bloqueo al intentar una cuarta reprogramación | **RN-06** | Intentar reprogramar una cita con `veces_reprogramada = 3` | La API rechaza con `400 Bad Request` (`LIMITE_REPROGRAMACIONES_RN06`) e indica llamar a la oficina. |
| **CP-CNF-08** | Vencimiento del plazo sin respuesta (`SIN_CONFIRMAR`) y confirmación por llamada | **RN-07**, RF-43 | Ejecutar temporizador sobre cita `NOTIFICADA` sin respuesta y luego confirmar desde el panel | La cita pasa a `SIN_CONFIRMAR` (**no se cancela sola**), aparece alerta en el panel y la app del inspector, y permite confirmar por llamada telefónica. |
