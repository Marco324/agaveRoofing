# Manual de Usuario — Capítulo 5: Notificaciones Push, Confirmación y Reprogramación
## Sistema AgaveAlerta — Agave Roofing (San Antonio, Texas)

**Responsable:** Mario Martínez González (AN — Analista / Documentación)  
**Versión:** 2.0 Final (Integra borrador E08 y cierre E09)  
**Fecha:** Jueves 29 de octubre de 2026  

---

## 1. Los Avisos Automáticos que Recibe el Cliente (E08)

El sistema **AgaveAlerta** reemplaza los correos electrónicos tradicionales por notificaciones *Push* interactivas con respaldo automático por mensaje de texto (**SMS vía Twilio**). El cliente recibe avisos en tres momentos clave:

| Momento | Cuándo se envía | Tipo de Plantilla | ¿Respeta Horario de Silencio (21:00–07:00)? | Botones de Acción Rápida |
| :--- | :--- | :--- | :--- | :--- |
| **1. Aviso del día programado** | **24 horas antes** de la ventana de atención | `DIA_PROGRAMADO` | Sí (RN-14: se pospone a las 07:00 AM) | **✓ Sí estaré** · **📅 Mover cita** |
| **2. Recordatorio del día** | **3 horas antes** de iniciar la ventana | `RECORDATORIO` | Sí (RN-14) | Abrir detalle de la cita |
| **3. Inspector en camino** | Al pulsar *"Voy en camino"* | `EN_CAMINO` | **No** (Es urgente, sale de inmediato) | Seguir en el mapa en vivo |

### 1.1 Redacción Clara y Humana de las Plantillas (Revisadas en E08)
Pensando en propietarios de cualquier edad en San Antonio, TX, los textos evitan tecnicismos:
* **Aviso 24 h antes (`PUSH`):**
  > *"Hola {{cliente}}: su inspección de Agave Roofing es el {{fecha}} entre {{ventana}} con {{inspector}}. Toque 'Sí estaré' para confirmar o 'Mover cita' si necesita otro horario."*
* **Respaldo automático (`SMS`):**
  > *"Agave Roofing (San Antonio): Hola {{cliente}}, su inspeccion de techo es el {{fecha}} ({{ventana}}) con {{inspector}}. Confirme sin costo en: {{enlace}}"*

---

## 2. Cómo Confirmar la Cita (Cliente — E09)

El cliente dispone de dos formas sencillas para confirmar que estará en su domicilio:

### Opción A: Sin abrir la aplicación (Desde la propia notificación)
1. Cuando llega la notificación 24 horas antes, mantenga presionada o despliegue la alerta en la pantalla de bloqueo de su teléfono.
2. Pulse el botón **"✓ Sí estaré"**.
3. El sistema registra su confirmación en segundo plano (`CONFIRMADA`), guarda la fecha y hora exacta (`confirmado_en`) y avisa al inspector asignado.
4. **Regla RN-04:** Una vez confirmada, la confirmación no puede deshacerse; si surge un imprevisto, deberá usar la opción *"Solicitar mover la cita"*.

### Opción B: Dentro de la App del Cliente
1. Abra la aplicación **Agave Roofing** y toque su tarjeta de **Próxima Cita**.
2. En la parte superior verá el botón verde grande: **"✓ Sí estaré en mi domicilio (Confirmar Cita)"**.
3. Al pulsarlo, aparecerá el mensaje de confirmación visual: *"¡Listo! Lo esperamos el [fecha] entre [ventana]"*.

---

## 3. Cómo Solicitar Mover la Cita (Reprogramación del Cliente — E09)

Si el cliente no puede recibir al inspector en la fecha programada:

1. Pulse el botón **"📅 Mover cita"** desde la notificación o **"📅 No puedo ese día — Solicitar mover la cita"** en el detalle de la cita.
2. La aplicación consulta en tiempo real los **horarios disponibles reales** en su zona de San Antonio (`Stone Oak`, `Alamo Heights`, `Southtown` o `Medical Center`), mostrando únicamente bloques donde los inspectores no tienen traslapes (**RN-02**).
3. Seleccione una de las tarjetas grandes de horario disponible y escriba opcionalmente el motivo (por ejemplo, *"Cita médica a mediodía"*).
4. Pulse **"Enviar Solicitud de Reprogramación"**.
5. La cita pasará al estado `REPROG_SOLICITADA` y mostrará el aviso: *"Tu solicitud está en revisión"*.

### Casos en los que el sistema impide reprogramar:
* **Inspector ya en camino (RN-05):** Si el inspector ya inició su traslado (`EN_CAMINO`) o ya se encuentra en el domicilio (`EN_SITIO`), la app mostrará un mensaje claro indicando que por seguridad de la ruta ya no es posible mover la cita desde la app.
* **Límite de 3 reprogramaciones (RN-06):** Cada cita permite un máximo de **3 cambios de horario**. Al intentar un cuarto cambio, la app informa al cliente que debe comunicarse por teléfono con la oficina al `(210) 555-0100`.

---

## 4. Guía para el Administrador: Bandeja de Reprogramaciones y Citas Sin Confirmar (Panel Web — E09)

En el **Panel de Administración** (`panel/index.html`), el Administrador dispone de dos pestañas nuevas:

### 4.1 Pestaña "Notificaciones Push (E08)"
* Muestra la tabla en vivo de todas las notificaciones enviadas, el canal utilizado (`PUSH` o respaldo `SMS`), el número de intentos (`1/3` a `3/3`) y el acuse de entrega.
* **Botón Reenviar:** Permite reenviar manualmente cualquier aviso marcando `reenvio_manual = true` para no chocar con la regla de no duplicidad (**RN-13**).
* **Alerta de "Cliente no alcanzado":** Si los 3 intentos de una cita fallan, aparece un cintillo rojo en la parte superior del panel con el nombre y teléfono del cliente para llamarle de inmediato.

### 4.2 Pestaña "Reprogramaciones y Sin Confirmar (E09)"
1. **Bandeja de Solicitudes (`SOLICITADA`):**
   * Muestra el folio, el cliente, la fecha actual, la nueva fecha solicitada, cuántas reprogramaciones lleva (`X/3`) y el motivo del cliente.
   * **Botón Aprobar:** Valida que no exista traslape con el inspector, actualiza la fecha y ventana **conservando el mismo folio (`RN-06`)**, incrementa el contador `veces_reprogramada` y envía automáticamente la notificación `REPROGRAMADA` al cliente y al inspector.
   * **Botón Rechazar con Motivo:** Solicita el motivo del rechazo, regresa la cita a estado `NOTIFICADA` y muestra la explicación en la app del cliente.
2. **Alerta de Citas `SIN_CONFIRMAR` (RN-07):**
   * Cuando vence el plazo de 12 horas sin que el cliente responda, el temporizador marca la cita como `SIN_CONFIRMAR` (**nunca la cancela sola**).
   * El administrador llama al cliente y pulsa **"📞 Confirmar por Llamada"** (pasa a `CONFIRMADA`) o **"Cancelar"** si el cliente solicita anular la visita.
