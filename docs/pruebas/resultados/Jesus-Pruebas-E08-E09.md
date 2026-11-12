# Reporte de Ejecución de Casos de Prueba — Entregas E08 y E09
## Sistema AgaveAlerta — Agave Roofing (San Antonio, Texas)

**Ejecutado por:** Jesús Mario Bazaldúa Bustos (CL — Desarrollador Móvil / Pruebas)  
**Diseñado por:** Mario Martínez González (AN — Analista / Documentación / QA)  
**Fecha de Ejecución:** 22 y 28 de octubre de 2026  
**Comando de Verificación Automatizada:**  
`node --experimental-strip-types --experimental-sqlite api/test/e08_e09.test.ts`

---

## 1. Resultados de Ejecución — E08: Motor de Notificaciones Push y Respaldo SMS

| ID Caso | Descripción | Estado Obtenido | Resultado | Evidencia Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **CP-NOT-01** | Registro e idempotencia de token Push (FCM) | `201 Created` — Actualiza `ultimo_uso` sin duplicar | **APROBADO (PASS)** | `Prueba E08-1` en `e08_e09.test.ts` |
| **CP-NOT-02** | Envío de aviso 24 h antes y transición a `NOTIFICADA` | `200 OK` — Plantilla renderizada y estado `NOTIFICADA` | **APROBADO (PASS)** | `Prueba E08-2` y `E08-4` |
| **CP-NOT-03** | Bloqueo de notificación automática duplicada (**RN-13**) | `409 Conflict` (`ErrorNotificacionDuplicadaRN13`) | **APROBADO (PASS)** | `Prueba E08-4`: índice único parcial `ux_notificacion_unica` |
| **CP-NOT-04** | Reenvío manual desde el panel (`reenvio_manual = 1`) | `200 OK` — Notificación entregada sin bloqueo | **APROBADO (PASS)** | `Prueba E08-4`: botón *Reenviar* en `panel/index.html` |
| **CP-NOT-05** | Horario de silencio nocturno 21:00–07:00 (**RN-14**) | Reprogramada automáticamente a `07:00:00Z` | **APROBADO (PASS)** | `Prueba E08-3`: aviso de `22:45` movido a `07:00` |
| **CP-NOT-06** | Excepción de horario de silencio para avisos urgentes | Sale de inmediato a las `22:45:00Z` | **APROBADO (PASS)** | `Prueba E08-3`: `urgente = true` |
| **CP-NOT-07** | Token vencido / permiso denegado y respaldo SMS Twilio | Dispositivo `activo = 0` + SMS entregado | **APROBADO (PASS)** | `Prueba E08-5`: respaldo automático SMS #29 |
| **CP-NOT-08** | Recepción en los 3 estados de la app (`FOREGROUND`, `BACKGROUND`, `KILLED`) | Navega directo a `DetalleCita` / `DetalleParada` | **APROBADO (PASS)** | Validado en `notificacionesCliente.ts` y `notificacionesInspector.ts` |

---

## 2. Resultados de Ejecución — E09: Confirmación y Reprogramación de Citas

| ID Caso | Descripción | Estado Obtenido | Resultado | Evidencia Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **CP-CNF-01** | Confirmar desde el botón `"Sí estaré"` de la notificación sin abrir la app | `200 OK` — Pasa a `CONFIRMADA` y guarda `confirmado_en` | **APROBADO (PASS)** | `confirmarDesdeNotificacionPush()` + `Prueba E09-1` |
| **CP-CNF-02** | Confirmar desde el botón grande en `DetalleCitaScreen` | `200 OK` — Confirmación visual e inspector avisado | **APROBADO (PASS)** | `DetalleCita.tsx` + `RutaDelDia.tsx` |
| **CP-CNF-03** | Consulta de horarios disponibles reales en la zona | `200 OK` — 8 bloques libres sin traslapes (**RN-02**) | **APROBADO (PASS)** | `Prueba E09-2`: excluye bloque ocupado `09:00-11:00` |
| **CP-CNF-04** | Aprobar reprogramación en bandeja conservando folio (**RN-06**) | `200 OK` — Cita `INS-2026-000006` movida al `2026-10-30` | **APROBADO (PASS)** | `Prueba E09-3`: folio intacto + push `REPROGRAMADA` |
| **CP-CNF-05** | Rechazar reprogramación con motivo | `200 OK` — Regresa a `NOTIFICADA` con motivo visible | **APROBADO (PASS)** | `Prueba E09-4`: motivo mostrado en `DetalleCita.tsx` |
| **CP-CNF-06** | Impedir reprogramación cuando la cita va `EN_CAMINO` (**RN-05**) | `400 Bad Request` (`ErrorReprogramacionEnCaminoRN05`) | **APROBADO (PASS)** | `Prueba E09-5` + validación en `DetalleCita.tsx` |
| **CP-CNF-07** | Impedir cuarta reprogramación (**RN-06**) | `400 Bad Request` (`ErrorLimiteReprogramacionesRN06`) | **APROBADO (PASS)** | `Prueba E09-5`: límite estricto de 3 |
| **CP-CNF-08** | Temporizador `SIN_CONFIRMAR` (**RN-07**) y confirmación por llamada | `200 OK` — Pasa a `SIN_CONFIRMAR` y luego a `CONFIRMADA` | **APROBADO (PASS)** | `Prueba E09-6` + Bandeja en `panel/index.html` |

---

## 3. Resumen de Calidad del Sprint 4
* **Total de casos ejecutados:** 16 (8 de E08 + 8 de E09)
* **Casos aprobados:** 16 (**100% de efectividad**)
* **Defectos críticos pendientes:** 0
