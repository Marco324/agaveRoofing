---
integrante: Jesús Mario Bazaldúa Bustos
matricula: "2014834"
clave: CL
rol: Desarrollador Móvil — App del Cliente + Pruebas
aliases: [Checklist Jesús, Checklist CL]
tags: [agavealerta, checklist, rol/app-cliente, rol/pruebas]
---

# ✅ Checklist — Jesús (CL) · App móvil del Cliente + Pruebas

> [!info] Cómo leer esta lista
> Cada `- [ ]` es una tarea. La flecha **→** explica qué hacer y cuándo se considera terminada. ⛔ **Requiere** = bloqueo duro (no empieces sin eso). 🔸 **Mejor después de** = puedes avanzar pero se completa con eso. El 📦 es lo que se entrega ese jueves. Ver [[README - Checklists del equipo]].
>
> **Tu rol:** construyes la **app móvil del cliente** (React Native + Expo) y además **ejecutas los casos de prueba** que diseña Mario. Tu app es la que resuelve el problema del proyecto: el cliente no revisa su correo, pero sí ve una notificación en su teléfono. Tu referencia son los módulos 4, 5, 6 y 7 de [[02_SRS_Requerimientos]] y los diagramas §3.1, §3.2 y §3.3 de [[04_Diagramas_UML]].
>
> **El criterio que manda:** el usuario de tu app puede ser una persona mayor que nunca usó una app parecida. **Confirmar la cita debe costarle 3 toques o menos**, y de preferencia ninguno más allá de la propia notificación.

---

## E01 — Arranque y planeación
`#agave/E01` · jue 03 sep · Sprint 0

- [ ] **Spike: notificaciones push con Expo**
  → App mínima que obtiene el token, se lo manda a un servidor de prueba y **recibe una notificación con botones de acción** ("Confirmar" / "Reprogramar"). Terminada cuando puedes responder desde la notificación sin abrir la app.
- [ ] **Probar con la app cerrada y en segundo plano**
  → Verificar los tres casos: app abierta, en segundo plano y completamente cerrada. Anotar cuál se comporta distinto.
- [ ] **Probar con el permiso denegado**
  → Ver qué pasa cuando el usuario dice que no a las notificaciones: documentar el mensaje que habrá que mostrarle y cómo se le pide de nuevo. Es la mitad del riesgo R4.
- [ ] **Explorar `react-native-maps`**
  → Mostrar un mapa con un marcador y moverlo. Confirmar que la llave de Google Maps funciona en Android.
- [ ] 📦 **Entregable:** Spike de notificaciones push + notas de permisos y estados de la app.

## E02 — Análisis
`#agave/E02` · jue 10 sep · Sprint 1

- [ ] **Casos de uso del cliente (con Mario)**
  → Ayudar a redactar: registrar dispositivo (CU-08), confirmar disponibilidad (CU-10), solicitar reprogramación (CU-11), seguir la llegada en el mapa (CU-17), confirmar presencia (CU-18), consultar reporte (CU-24).
- [ ] **Bocetos de la app del cliente**
  → Dibujos de: la notificación con sus botones, mis citas, detalle de la cita, reprogramar, mapa de seguimiento, reporte.
- [ ] **Prueba con un usuario real**
  → Enseñarle los bocetos a una persona mayor de tu familia y preguntarle qué entiende. Lo que no entienda, se rediseña. Anotar sus palabras textuales.
- [ ] 📦 **Entregable:** Casos de uso del cliente + bocetos + notas de la prueba con usuario.

## E03 — Requerimientos cerrados + diseño de interfaz
`#agave/E03` · jue 17 sep · Sprint 1 (cierre)

- [x] **Mockup final — la notificación**
  → Cómo se ve el aviso del día programado en la pantalla bloqueada, con los botones **"Sí estaré"** y **"Mover cita"**. Es la pantalla más importante del proyecto.
- [x] **Mockup final — mis citas**
  → La próxima cita en grande (fecha, horario, inspector) con el botón de acción que toque según el estado, y abajo el historial.
- [x] **Mockup final — detalle de la cita**
  → Fecha, ventana de atención, domicilio, datos del inspector con su foto y placa, y el estado con lenguaje humano ("El inspector va en camino").
- [x] **Mockup final — reprogramar**
  → Lista de horarios disponibles como tarjetas grandes, campo de motivo opcional y confirmación.
- [x] **Mockup final — mapa de seguimiento**
  → Mapa con el inspector, tu casa y arriba el tiempo estimado en letra grande ("Llega en 12 minutos"), más el botón **"Ya estoy en mi casa"**.
- [x] **Mockup final — reporte de inspección**
  → Estado del techo, hallazgos, fotos y si requiere reparación. Con opción de descargar el PDF.
- [x] **Revisar el diseño de la base de datos contra tus pantallas**
  → Jorge entrega el modelo de datos esta semana ([[03_Diseno_Base_de_Datos]] y la vista resumida [[03b_Modelo_Datos_Resumen_E03]]). Recorre tus seis mockups y confirma que cada dato que muestras existe en el modelo: inspector asignado con foto, ventana de atención, estado en lenguaje humano, ETA, motivo de reprogramación, hallazgos y fotos del reporte. Terminado cuando le pasas a Jorge la lista de campos faltantes **antes** de que migre el esquema en E04.
- [x] 📦 **Entregable:** Mockups de la app del cliente + revisión del modelo de datos desde la app del cliente.

## E04 — Diseño técnico + infraestructura
`#agave/E04` · jue 24 sep · Sprint 2

- [ ] **Estructura del proyecto `app-cliente/`**
  → Crear la app con Expo + TypeScript, corriendo en un teléfono real vía Expo Go. Carpetas `screens/`, `components/`, `services/`.
- [ ] **Navegación y pantallas vacías**
  → React Navigation con las pantallas del mockup, todavía sin datos.
- [ ] **`ApiClient` compartido**
  → Usar el de `shared/api-client` (el mismo que Marco y Anuar). Acordar el contrato con Jorge antes de escribirlo.
  ⛔ **Requiere:** Jorge · esqueleto de la API + `shared/types` (BD E04).
- [ ] **Diagramas de secuencia (apoyando a Mario)**
  → Dibujar en Mermaid: aviso del día y confirmación, iniciar trayecto y seguimiento, solicitar reprogramación. Muestran quién llama a quién.
- [ ] 📦 **Entregable:** App del cliente base + diagramas de secuencia.

## E05 — Autenticación y roles
`#agave/E05` · jue 01 oct · Sprint 2 (cierre)

- [ ] **Login por teléfono con código OTP**
  → El cliente escribe su número, recibe un código por SMS y entra. Sin contraseñas: es lo que menos fricción le genera.
  ⛔ **Requiere:** Jorge · autenticación por OTP (BD E05).
- [ ] **Reenvío del código y errores claros**
  → Botón de reenviar (con cuenta regresiva), y mensajes entendibles para: código equivocado, código vencido y **número no registrado** ("comunícate con Agave Roofing para darte de alta").
- [ ] **Sesión persistente**
  → El cliente entra una vez y no se le vuelve a pedir el código. Token guardado con `expo-secure-store`.
- [ ] **Casos de prueba de seguridad — ejecución**
  → Ejecutar la tabla de casos que preparó Mario y llenar la columna de resultados.
  ⛔ **Requiere:** Mario · casos de prueba de seguridad (AN E05).
- [ ] 📦 **Entregable:** Login por OTP + primera tanda de resultados de pruebas.

## E06 — Clientes, domicilios, inspectores y zonas
`#agave/E06` · jue 08 oct · Sprint 3

- [ ] **Pantalla de perfil**
  → Nombre, teléfono, correo y sus domicilios registrados. Solo lectura de los domicilios (los da de alta la oficina), pero puede **editar su canal preferido** y sus datos de contacto.
  ⛔ **Requiere:** Jorge · endpoints de clientes y domicilios (BD E06).
- [ ] **Registro del dispositivo para notificaciones**
  → Al entrar, obtener el token de Expo Push y enviarlo a `POST /dispositivos`.
- [ ] **Solicitud del permiso de notificaciones explicada**
  → Antes de que el sistema pregunte, una pantalla que diga **por qué** se necesita ("para avisarte el día de tu inspección y cuando el inspector vaya en camino"). Si el usuario lo niega, ofrecer abrir los ajustes y avisarle que recibirá SMS en su lugar.
- [ ] **Ejecutar casos de prueba de catálogos**
  → Llenar resultados de la tabla de Mario.
- [ ] 📦 **Entregable:** Perfil + registro de dispositivo + permiso explicado + resultados de pruebas.

## E07 — Agenda de inspecciones y asignación
`#agave/E07` · jue 15 oct · Sprint 3 (cierre)

> [!warning] Esta entrega ⛔ **Requiere:** Jorge · `GET /inspecciones/mias` (BD E07).

- [x] **Pantalla "Mis citas"**
  → La **próxima cita destacada** con fecha, ventana de atención y estado en lenguaje humano. Abajo, el historial de inspecciones pasadas.
- [x] **Detalle de la cita**
  → Domicilio, motivo de la visita, datos del inspector asignado (nombre, foto, placa del vehículo) y la línea de tiempo de la cita.
- [x] **Estado sin citas**
  → Qué ve un cliente que todavía no tiene ninguna inspección programada: un mensaje claro, no una pantalla en blanco.
- [x] **Ejecutar casos de prueba de la agenda**
  → Llenar resultados de la tabla de Mario.
- [x] 📦 **Entregable:** Mis citas + detalle + resultados de pruebas.

## E08 — Motor de notificaciones push
`#agave/E08` · jue 22 oct · Sprint 4

> [!info] Esta es **tu semana más importante**: aquí se demuestra que la notificación push resuelve lo que el correo no resolvía.

- [ ] **Recibir el aviso del día programado**
  → Notificación 24 horas antes con el texto claro y los botones **"Sí estaré"** y **"Mover cita"**.
  ⛔ **Requiere:** Jorge · motor de notificaciones (BD E08).
- [ ] **Recibir el recordatorio previo**
  → Notificación 3 horas antes de la ventana de atención.
- [ ] **Manejo en los tres estados de la app**
  → La notificación debe llevar al detalle de la cita correcta con la app abierta, en segundo plano y cerrada. Probar los tres en teléfono real.
- [ ] **Navegación desde la notificación**
  → Al tocar el cuerpo de la notificación se abre el detalle de esa cita, no la pantalla principal.
- [ ] **Pantalla de "no recibí nada"**
  → En el detalle de la cita, mostrar si el aviso se envió y por qué canal. Si el cliente desactivó las notificaciones, avisarle que está recibiendo SMS.
- [ ] **Ejecutar casos de prueba de notificaciones**
  → Los difíciles de Mario: permiso denegado, teléfono apagado, token vencido, horario de silencio, aviso duplicado.
- [ ] 📦 **Entregable:** Recepción de avisos en los tres estados + resultados de pruebas de notificaciones.

## E09 — Confirmación y reprogramación
`#agave/E09` · jue 29 oct · Sprint 4 (cierre)

> [!warning] Esta entrega ⛔ **Requiere:** Jorge · endpoints de confirmación, horarios disponibles y reprogramación (BD E09).

- [ ] **Confirmar desde la propia notificación**
  → El botón "Sí estaré" de la notificación confirma la cita **sin abrir la app**. Terminado cuando lo logras con el teléfono bloqueado.
- [ ] **Confirmar desde la app**
  → Botón grande en el detalle de la cita, con confirmación visual clara ("Listo, lo esperamos el jueves entre 10 y 12").
- [ ] **Solicitar mover la cita**
  → Pantalla con los **horarios disponibles reales** que devuelve la API, en tarjetas grandes. Campo de motivo opcional. Al enviar, mensaje de "tu solicitud está en revisión".
- [ ] **Ver el resultado de la solicitud**
  → Si el administrador aprueba, llega la notificación del cambio y la cita se actualiza sola. Si rechaza, se muestra el motivo.
- [ ] **Los casos que se deben impedir**
  → No dejar pedir reprogramación cuando la cita ya va en camino (RN-05) ni una cuarta vez (RN-06): mostrar un mensaje entendible, no un error técnico.
- [ ] **Ejecutar casos de prueba de confirmación y reprogramación**
- [ ] 📦 **Entregable:** Confirmación y reprogramación del cliente + resultados de pruebas.

## E10 — Trayecto y seguimiento en vivo
`#agave/E10` · jue 05 nov · Sprint 5

> [!warning] Semana de integración cruzada
> Tu mapa necesita **el canal de Jorge (BD E10)** y **los puntos que publica Anuar (IN E10)**, y las tres tareas caen esta misma semana. Jorge deja un **punto simulado el lunes** para que arranques sin esperarlos; la prueba con el punto real se hace el miércoles con Anuar en la calle.

- [ ] **Recibir el aviso "el inspector va en camino"**
  → Notificación urgente con el tiempo estimado. Al tocarla, se abre directo el mapa.
- [ ] **Mapa de seguimiento**
  → Marcador del inspector que se mueve, marcador del domicilio, y arriba el **tiempo estimado en letra grande**. Suscripción al canal de Supabase Realtime de esa inspección.
  ⛔ **Requiere:** Jorge · canal Realtime y ETA (BD E10).
- [ ] **ETA que se actualiza**
  → El tiempo estimado baja conforme el inspector se acerca, al menos cada minuto. Si viene marcado como aproximado, decirlo ("aproximadamente 15 minutos").
- [ ] **Comportamiento cuando se pierde la señal**
  → Si dejan de llegar puntos, mostrar **el último punto conocido con su hora** ("última ubicación hace 3 minutos"), nunca un mapa congelado sin explicación.
- [ ] **El mapa solo durante el trayecto**
  → Antes de que el inspector salga y después de que llegue, el mapa no se muestra: en su lugar va el estado de la cita. Es el compromiso de privacidad del riesgo R7.
- [ ] **Recibir el aviso "está por llegar"**
  → Notificación cuando el inspector está a menos de 1 km, con el botón para confirmar presencia.
- [ ] **Prueba de campo del mapa (con Anuar)**
  → Anuar recorre una ruta real de 15 minutos y tú verificas desde otro teléfono que el marcador se mueve y el ETA baja.
- [ ] 📦 **Entregable:** Mapa de seguimiento con ETA + evidencia de la prueba de campo.

## E11 — Llegada, resultado y reporte
`#agave/E11` · jue 12 nov · Sprint 5 (cierre)

> [!warning] Esta entrega ⛔ **Requiere:** Jorge · endpoints de presencia, resultado y reporte PDF (BD E11).

- [ ] **Botón "Ya estoy en mi casa"**
  → En el mapa y en el detalle de la cita. Al pulsarlo, el inspector lo ve en su app antes de llegar.
- [ ] **Aviso de llegada**
  → Notificación cuando el inspector registra que llegó.
- [ ] **Pantalla del reporte de inspección**
  → Estado del techo con color, hallazgos, si requiere reparación y su urgencia, recomendaciones y la **galería de fotos** que tomó el inspector. Con opción de abrir o descargar el PDF.
- [ ] **Mensaje y llamada al inspector**
  → Conversación corta dentro de la app durante la cita, y botón para llamarlo por teléfono.
- [ ] **Historial completo**
  → Todas las inspecciones pasadas de ese cliente, con su reporte consultable.
- [ ] **Ejecución de los casos de prueba de los módulos 1 a 8**
  → Recorrer la matriz completa de Mario y llenar la columna de resultados. Reportar cada fallo como issue en GitHub con pasos para reproducirlo.
  ⛔ **Requiere:** Mario · matriz completa de casos de prueba (AN E11).
- [ ] 📦 **Entregable:** Cierre de la app del cliente + matriz de pruebas con resultados.

## E12 — Pruebas integrales, implantación y entrega final
`#agave/E12` · jue 19 nov · Sprint 6

- [ ] **Prueba integral del recorrido del cliente**
  → El camino completo en un teléfono real: llega la notificación → confirmo → recibo el recordatorio → me avisan que va en camino → lo sigo en el mapa → digo que estoy en casa → recibo el reporte. Sin tocar la base de datos a mano.
  ⛔ **Requiere:** Mario · guion de la prueba de campo (AN E11) y Anuar · prueba de campo (IN E12).
- [ ] **Matriz de resultados final**
  → Todos los casos con su resultado: pasó / falló / no aplica, con evidencia (captura o video) de los que fallaron.
- [ ] **Corrección de los errores de tu app**
  → Arreglar lo que salió mal, priorizando lo que impide completar el recorrido.
- [ ] **Instalación con los clientes piloto**
  → Instalar la app en los teléfonos de 2 o 3 clientes reales que hayan aceptado participar, y acompañarlos en su primera confirmación.
  ⛔ **Requiere:** Jorge · builds de producción (BD E12).
- [ ] **Recoger la opinión de los clientes piloto**
  → Tres preguntas cortas: ¿entendiste la notificación?, ¿te costó confirmar?, ¿te sirvió ver el mapa? Es el dato que cierra el criterio de éxito del proyecto.
- [ ] 📦 **Entregable:** Matriz de resultados final + app instalada con clientes piloto + opiniones recogidas.

---

## 📊 Resumen de tu ruta

| Entrega | App del cliente | Pruebas |
|---------|-----------------|---------|
| E01 | Spike de push | — |
| E02 | Casos de uso y bocetos | Prueba con usuario real |
| E03 | Mockups finales | — |
| E04 | Esqueleto Expo + secuencias | — |
| E05 | Login por OTP | Casos de seguridad |
| E06 | Perfil + permiso de notificaciones | Casos de catálogos |
| E07 | Mis citas y detalle | Casos de agenda |
| E08 | Recepción de avisos | Casos de notificaciones |
| E09 | Confirmar y reprogramar | Casos de confirmación |
| E10 | Mapa con ETA | Prueba de campo con Anuar |
| E11 | "Estoy en casa" + reporte | Matriz completa módulos 1–8 |
| E12 | Instalación piloto | Matriz de resultados final |

**Documentos de referencia:** [[02_SRS_Requerimientos]] · [[04_Diagramas_UML]] · [[03_Diseno_Base_de_Datos]] · [[05_Calendario_Entregas]] · [[Integracion]]
