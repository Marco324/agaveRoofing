# Matriz y Casos de Prueba — Agenda de Inspecciones y Asignación (E07)
## Sistema de Alerta y Seguimiento de Inspecciones — Agave Roofing (San Antonio, TX)

**Responsable de Diseño y QA:** Mario Martínez González (AN)  
**Ejecutor de Pruebas:** Jesús Mario Bazaldúa Bustos (CL / QA)  
**Fecha:** Octubre 2026 — Entrega E07 (Sprint 3)  

---

### 1. Casos de Prueba Formales del Módulo de Agenda

| ID Caso | Nombre | Precondición | Pasos de Ejecución | Resultado Esperado | Estado / Resultado |
|---|---|---|---|---|---|
| **CP-AG-01** | Creación válida de inspección | Inspector y cliente dados de alta en San Antonio, TX. | 1. Seleccionar cliente y domicilio.<br>2. Definir fecha 2026-10-15 y ventana 09:00–11:00.<br>3. Asignar inspector Carlos Garza.<br>4. Guardar. | Genera folio `INS-2026-XXXXXX`, estado `PROGRAMADA`, 1 registro en historial. | **EXITOSO (PASS)** |
| **CP-AG-02** | Detección estricta de traslape (RN-02) | Cita existente asignada a Carlos Garza (09:00–11:00). | 1. Intentar programar cita el mismo día de 09:30 a 10:30 para Carlos Garza. | La API rechaza la petición con código 409 y mensaje `TRASLAPE_INSPECTOR_RN02`. | **EXITOSO (PASS)** |
| **CP-AG-03** | Traslape parcial en ventana límite | Cita existente de 09:00 a 11:00. | 1. Intentar crear cita de 10:45 a 12:45 para el mismo inspector. | La API rechaza por traslape con los 15 minutos en conflicto (10:45–11:00). | **EXITOSO (PASS)** |
| **CP-AG-04** | Ventana fuera de horario operativo | Ninguna. | 1. Intentar programar cita de 05:00 a 07:00 (antes de apertura). | Rechazo con código 400 y mensaje `HORARIO_INVALIDO`. | **EXITOSO (PASS)** |
| **CP-AG-05** | Reasignación de inspector con auditoría | Inspección en estado `PROGRAMADA`. | 1. Reasignar cita a David Vance.<br>2. Indicar motivo de redistribución. | Se actualiza `id_inspector` y se añade renglón con motivo en `inspeccion_historial`. | **EXITOSO (PASS)** |
| **CP-AG-06** | Reprogramación y estabilidad de folio (RN-06) | Cita con folio `INS-2026-000001`. | 1. Mover fecha al día siguiente.<br>2. Verificar folio resultante. | El folio permanece idéntico (`INS-2026-000001`), `veces_reprogramada` incrementa a 1. | **EXITOSO (PASS)** |
| **CP-AG-07** | Cancelación con motivo justificado | Inspección en estado `NOTIFICADA`. | 1. Ejecutar cancelación con motivo *"Cliente canceló por reparación externa"*. | Estado cambia a `CANCELADA`, guardado en historial. No admite nuevas transiciones. | **EXITOSO (PASS)** |

---

### 2. Verificación de la Máquina de Estados (UML vs API)

Auditoría técnica entre el diagrama de estados formal del documento [[03_Diseno_Base_de_Datos]] y la implementación en `api/src/services/maquinaEstadosService.ts`:

```
Diagrama UML:
  PROGRAMADA --------> NOTIFICADA --------> CONFIRMADA --------> EN_CAMINO --------> EN_SITIO --------> COMPLETADA
     │                     │                     │                   │
     │ (cancelación)       │ (reprog/sin_conf)   │ (cancelación)     │ (cliente ausente)
     ▼                     ▼                     ▼                   ▼
  CANCELADA             REPROG_SOLICITADA     CANCELADA           CLIENTE_AUSENTE
```

#### Tabla de Verificación de Transiciones:

| Transición Probada | Permitida en UML | Respuesta en API | ¿Cumple RN-01? |
|---|---|---|---|
| `PROGRAMADA` ➔ `NOTIFICADA` | Sí | Código 200 OK — Transición registrada | **SÍ (PASS)** |
| `PROGRAMADA` ➔ `CANCELADA` | Sí | Código 200 OK — Transición registrada | **SÍ (PASS)** |
| `PROGRAMADA` ➔ `COMPLETADA` (Salto ilegal) | No | Código 400 — ErrorTransicionInvalida | **SÍ (BLOQUEADO)** |
| `NOTIFICADA` ➔ `CONFIRMADA` | Sí | Código 200 OK — Transición registrada | **SÍ (PASS)** |
| `NOTIFICADA` ➔ `REPROG_SOLICITADA` | Sí | Código 200 OK — Transición registrada | **SÍ (PASS)** |
| `NOTIFICADA` ➔ `SIN_CONFIRMAR` | Sí | Código 200 OK — Transición registrada | **SÍ (PASS)** |
| `CONFIRMADA` ➔ `EN_CAMINO` | Sí | Código 200 OK — Transición registrada | **SÍ (PASS)** |
| `CONFIRMADA` ➔ `COMPLETADA` (Salto directo) | No | Código 400 — ErrorTransicionInvalida | **SÍ (BLOQUEADO)** |
| `EN_CAMINO` ➔ `EN_SITIO` | Sí | Código 200 OK — Transición registrada | **SÍ (PASS)** |
| `EN_CAMINO` ➔ `CLIENTE_AUSENTE` | Sí | Código 200 OK — Transición registrada | **SÍ (PASS)** |
| `EN_SITIO` ➔ `COMPLETADA` | Sí | Código 200 OK — Transición registrada | **SÍ (PASS)** |
| `COMPLETADA` ➔ `PROGRAMADA` (Reapertura ilegal) | No | Código 400 — ErrorTransicionInvalida (Terminal) | **SÍ (BLOQUEADO)** |

**Conclusión de QA:**  
La implementación en código es 100% fiel al diagrama UML y a las reglas de negocio RN-01 a RN-07. No existen brechas ni transiciones no autorizadas permitidas por el backend.
