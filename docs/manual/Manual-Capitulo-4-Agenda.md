# Manual de Usuario del Sistema AgaveAlerta
## Capítulo 4: Programación y Gestión de Citas en la Agenda (Panel de Administración)

**Empresa:** Agave Roofing (San Antonio, Texas)  
**Autor:** Mario Martínez González (Analista / Documentación / QA)  
**Versión:** 1.0 — Entrega E07 (Sprint 3)  
**Módulo:** M-03 Agenda e Inspecciones  

---

### 1. Introducción al Módulo de Agenda

El módulo de Agenda permite al Administrador y al personal de operaciones de Agave Roofing planificar, asignar y monitorear todas las visitas técnicas de inspección de techos en las zonas residenciales y comerciales de San Antonio, Texas (Stone Oak, Alamo Heights, Southtown, Medical Center, etc.).

El objetivo prioritario es optimizar las rutas de los inspectores técnicos y prevenir cancelaciones o visitas fallidas garantizando que:
1. No existan traslapes horarios para un mismo inspector (**Regla de Negocio RN-02**).
2. Cada cita posea un folio consecutivo e inmutable (**Regla de Negocio RN-06**).
3. Todo movimiento o cambio de estado quede estrictamente registrado en la auditoría del sistema (**Regla de Negocio RN-01**).

---

### 2. Estados de una Inspección y su Significado

Cada cita en el sistema evoluciona mediante una máquina de estados estricta. En el calendario y en el detalle de la cita, cada estado se identifica con su respectivo indicador visual:

| Estado | Color en Panel | Significado Operativo | Acción Siguiente |
|---|---|---|---|
| **PROGRAMADA** | Azul marino | Cita creada por administración; asignada a un inspector. | El sistema despachará el aviso previo al cliente. |
| **NOTIFICADA** | Amarillo / Ámbar | Notificación push o SMS enviada al teléfono del cliente. | Esperando acuse o confirmación del cliente. |
| **CONFIRMADA** | Verde esmeralda | El cliente confirmó disponibilidad para la ventana fijada. | El inspector la tiene lista en su ruta del día. |
| **SIN_CONFIRMAR** | Naranja | El plazo de confirmación venció sin respuesta del cliente. | El administrador decide si mantener o contactar vía telefónica. |
| **REPROG_SOLICITADA** | Púrpura | El cliente solicitó mover fecha u hora desde su aplicación. | El administrador aprueba o rechaza el nuevo horario. |
| **REPROGRAMADA** | Índigo | Reprogramación aprobada; la cita conserva su folio original. | Se reprograma la ventana y se notifica al inspector. |
| **EN_CAMINO** | Azul cielo | El inspector presionó *"Voy en camino"* y comparte GPS. | El cliente puede ver el mapa en vivo con ETA. |
| **EN_SITIO** | Verde menta | El inspector arribó al domicilio del cliente. | Se ejecuta la inspección física del techo. |
| **COMPLETADA** | Gris oscuro | Inspección finalizada con reporte y fotos registradas. | Proceso concluido exitosamente. |
| **CLIENTE_AUSENTE** | Rojo carmesí | Inspector llegó pero nadie atendió tras el tiempo de espera. | Se registra evidencia para cobro de visita fallida. |
| **CANCELADA** | Gris neutro | Cita cancelada con motivo justificado en el historial. | Proceso anulado. |

---

### 3. Procedimiento Paso a Paso para Programar una Cita

1. **Acceder a la Agenda:**
   * Ingrese al panel web con credenciales de Administrador.
   * Haga clic en la pestaña **Agenda** en el menú de navegación principal.
2. **Abrir el Formulario de Programación:**
   * Haga clic en el botón superior **"+ Nueva Inspección"**.
3. **Completar los Datos Obligatorios:**
   * **Cliente:** Seleccione el cliente registrado en San Antonio (ej. *Robert B. Martinez*).
   * **Domicilio:** Seleccione la propiedad correspondiente (ej. *19202 Stone Oak Pkwy, San Antonio, TX 78258*). El sistema cargará automáticamente la zona y las coordenadas.
   * **Fecha:** Seleccione la fecha deseada en el calendario.
   * **Ventana de Atención:** Ingrese la hora de inicio y de fin (ej. `09:00` a `11:00`). Debe ser dentro del horario operativo de 07:00 a 19:00 hrs.
   * **Inspector Asignado:** Seleccione el inspector técnico que cubre la zona (ej. *Carlos Garza*).
   * **Motivo y Notas:** Detalle el tipo de revisión (ej. *Revisión de teja asfáltica por granizo* y referencias de acceso).
4. **Confirmar la Creación:**
   * Presione **"Guardar Inspección"**.
   * El sistema generará el folio oficial con formato `INS-2026-XXXXXX` y colocará la cita en estado `PROGRAMADA`.

---

### 4. ¿Qué hacer ante un Aviso de Traslape de Horario (RN-02)?

Si al intentar programar o reasignar una cita aparece la alerta:
> ⚠️ **Error de Traslape Horario (RN-02):**  
> *"El inspector seleccionado ya cuenta con la cita [INS-2026-000001] en horario traslapado para el día 2026-10-15 (09:00 - 11:00)."*

**Protocolo de Resolución:**
1. **Verificar disponibilidad del inspector:** Ningún inspector puede atender dos techos simultáneamente.
2. **Opción A (Ajustar Ventana):** Seleccione un bloque horario anterior o posterior que no interfiera (por ejemplo, `11:30` a `13:30`).
3. **Opción B (Asignar otro Inspector):** Seleccione a otro inspector con cobertura en esa zona de San Antonio (ej. *David Vance*).
4. **Opción C (Reorganizar Agenda):** Ingrese a la cita en conflicto desde el calendario, reasígnela o muévala, y proceda con el nuevo registro.

---

### 5. Reasignar, Mover y Cancelar Citas

* **Para Mover de Fecha/Hora:**
  * Abra el detalle de la cita y presione **"Mover Cita"**.
  * Elija la nueva fecha y ventana. El sistema validará que el contador no supere **3 reprogramaciones** (RN-06).
  * El folio **permanece idéntico** para mantener la trazabilidad con el cliente.
* **Para Reasignar Inspector:**
  * Presione **"Reasignar"**, elija el nuevo inspector y escriba el motivo (ej. *Rebalanceo de carga de trabajo en Stone Oak*).
* **Para Cancelar:**
  * Presione **"Cancelar Cita"**. Es obligatorio escribir el motivo de la cancelación.
  * La cita pasará a estado `CANCELADA` y quedará registrada en el historial inmutable.
