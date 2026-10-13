# Reporte de Ejecución de Pruebas — Módulo de Agenda (E07)
## Sistema AgaveAlerta — Agave Roofing (San Antonio, Texas)

**Responsable de Ejecución:** Jesús Mario Bazaldúa Bustos (CL / Pruebas)  
**Casos Diseñados por:** Mario Martínez González (AN / QA)  
**Fecha de Ejecución:** 14 y 15 de Octubre de 2026  
**Ambiente de Prueba:** API Express / SQLite + Monorepo AgaveAlerta (San Antonio, TX)  

---

### 1. Resumen Ejecutivo de la Ejecución

Se ejecutaron formalmente los **7 casos de prueba de la agenda** especificados por Mario en [[Casos-de-Prueba-Agenda-E07]]. Las pruebas cubrieron tanto la interfaz de programación del administrador como el consumo desde las aplicaciones móviles de Inspector y Cliente.

* **Total de Casos:** 7
* **Exitosos (Pass):** 7 (100%)
* **Fallidos (Fail):** 0
* **Bloqueados:** 0

---

### 2. Matriz de Resultados Detallada

| ID Caso | Descripción del Caso | Inspector / Datos de Entrada (San Antonio) | Resultado Obtenido | Estatus |
|---|---|---|---|---|
| **CP-AG-01** | Creación válida de inspección | Carlos Garza · 2026-10-15 (09:00–11:00) en Stone Oak Pkwy. | Cita creada exitosamente con folio `INS-2026-000001`, estado `PROGRAMADA` y primer renglón en historial. | **PASS** |
| **CP-AG-02** | Detección estricta de traslape (RN-02) | Carlos Garza · 2026-10-15 (09:30–10:30) [conflicto total]. | La API rechazó la creación con código HTTP 409 y mensaje `TRASLAPE_INSPECTOR_RN02`, indicando el folio en conflicto. | **PASS** |
| **CP-AG-03** | Traslape parcial en límite horario | Carlos Garza · 2026-10-15 (10:45–12:45) [conflicto de 15 min]. | El sistema bloqueó la cita correctamente. No permitió empalmes en la ventana previa. | **PASS** |
| **CP-AG-04** | Ventana fuera de horario operativo | 2026-10-15 (05:00–07:00). | Rechazado con código 400 `HORARIO_INVALIDO`. Horario operativo validado (07:00 a 19:00). | **PASS** |
| **CP-AG-05** | Reasignación de inspector con auditoría | Reasignación a David Vance por redistribución. | `id_inspector` actualizado y evento registrado en `inspeccion_historial` con usuario y motivo. | **PASS** |
| **CP-AG-06** | Reprogramación y estabilidad de folio (RN-06) | Cita `INS-2026-000001` movida a nueva fecha. | Fecha actualizada, contador de reprogramaciones en 1 y el folio se mantuvo exactamente igual. | **PASS** |
| **CP-AG-07** | Cancelación justificada | Cita en estado `NOTIFICADA` cancelada por motivo externo. | Transición exitosa a `CANCELADA`. Se intentó transicionar posteriormente y la API la bloqueó por ser estado terminal. | **PASS** |

---

### 3. Pruebas de Consumo Móvil (Endpoints de E07)

1. **Endpoint `GET /api/inspecciones/mi-ruta` (Inspector):**
   * Se probó con el `idInspector = 1` para la fecha `2026-10-15`.
   * **Resultado:** Devolvió las paradas de San Antonio ordenadas cronológicamente por `ventana_inicio`. Los datos de geolocalización permitieron abrir el destino en Google Maps sin problema.
2. **Endpoint `GET /api/inspecciones/mias` (Cliente):**
   * Se probó con el `idCliente = 1`.
   * **Resultado:** Detectó la cita activa como `proximaCita` con su línea de tiempo completa y dejó el resto en `historial`.

---

**Dictamen Final de Pruebas:**  
El incremento de la entrega E07 cumple con todos los criterios de aceptación y las reglas de negocio RN-01, RN-02, RN-05 y RN-06. Listo para la entrega oficial.
