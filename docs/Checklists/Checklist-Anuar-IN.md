---
integrante: Anuar Guadalupe Hernández Hernández
matricula: "1905467"
clave: IN
rol: Desarrollador Móvil — App del Inspector
aliases: [Checklist Anuar, Checklist IN]
tags: [agavealerta, checklist, rol/app-inspector]
---

# ✅ Checklist — Anuar (IN) · App móvil del Inspector

> [!info] Cómo leer esta lista
> Cada `- [ ]` es una tarea. La flecha **→** explica qué hacer y cuándo se considera terminada. ⛔ **Requiere** = bloqueo duro (no empieces sin eso). 🔸 **Mejor después de** = puedes avanzar pero se completa con eso. El 📦 es lo que se entrega ese jueves. Ver [[README - Checklists del equipo]].
>
> **Tu rol:** construyes la **app móvil del inspector** (React Native + Expo). Es la app que se usa **de pie, en la calle, con sol en la pantalla y a veces sin señal**: tiene que ser de botones grandes, pocos pasos y tolerante a la falta de red. Tu referencia son los módulos 3, 6, 7 y 8 de [[02_SRS_Requerimientos]] y los diagramas §3.2, §3.4 y §3.5 de [[04_Diagramas_UML]].
>
> **Prueba siempre en teléfono real.** El emulador no tiene GPS de verdad, ni batería, ni pierde señal.

---

## E01 — Arranque y planeación
`#agave/E01` · jue 03 sep · Sprint 0

- [ ] **Spike: ubicación en segundo plano con Expo**
  → App mínima que, usando `expo-location`, registra la posición cada 15 segundos **con la pantalla apagada**. Terminada cuando caminas 10 minutos con el teléfono en el bolsillo y tienes ~40 puntos guardados.
- [ ] **Medición de consumo de batería**
  → Correr el spike 30 minutos y anotar cuánta batería gastó. Es el dato que sustenta el riesgo R5 y la decisión de apagar el seguimiento a los 90 minutos.
- [ ] **Probar los permisos de Android**
  → Verificar qué pasa si el usuario da permiso "solo mientras uso la app" en vez de "siempre": documentar el mensaje que habrá que mostrarle.
- [ ] **Explorar `expo-camera` y compresión de fotos**
  → Tomar una foto y reducirla a un tamaño razonable (menos de 500 KB). El inspector tomará muchas fotos y a veces las subirá con datos móviles.
- [ ] 📦 **Entregable:** Spike de GPS en segundo plano + notas de batería y permisos.

## E02 — Análisis
`#agave/E02` · jue 10 sep · Sprint 1

- [ ] **Casos de uso del inspector (con Mario)**
  → Ayudar a redactar: consultar ruta del día (CU-15), iniciar trayecto (CU-16), registrar llegada (CU-19), registrar resultado (CU-20), cliente ausente (CU-21), sincronizar sin señal (CU-22), comunicarse con el cliente (CU-23).
- [ ] **Bocetos de la app del inspector**
  → Dibujos a mano o en Figma de: ruta del día, detalle de la parada, pantalla de trayecto, captura del resultado, cliente ausente.
- [ ] **Entrevista corta a un inspector real**
  → Preguntarle cómo trabaja hoy: cuántas casas visita al día, si trae guantes, si puede usar las dos manos, dónde hay mala señal. Lo que salga de aquí define el tamaño de los botones.
- [ ] 📦 **Entregable:** Casos de uso del inspector + bocetos + notas de la entrevista.

## E03 — Requerimientos cerrados + diseño de interfaz
`#agave/E03` · jue 17 sep · Sprint 1 (cierre)

- [ ] **Mockup final — ruta del día**
  → Lista de paradas ordenadas por ventana, cada una con cliente, colonia, hora comprometida y su estado con color. Arriba: cuántas faltan.
- [ ] **Mockup final — detalle de la parada**
  → Datos del cliente, dirección con referencias, botón grande **"Voy en camino"**, botón de llamar y botón de mensaje.
- [ ] **Mockup final — trayecto activo**
  → Mapa con la ruta, tiempo estimado, y dos botones: **"Llegué"** y **"Cliente ausente"**. Indicador visible de que se está compartiendo la ubicación.
- [ ] **Mockup final — captura del resultado**
  → Estado del techo (4 opciones grandes), hallazgos, si requiere reparación y su urgencia, y la galería de fotos tomadas. Con el indicador de "se guardará y se enviará cuando haya señal".
- [ ] **Mockup final — cliente ausente**
  → Pantalla que **obliga** a tomar foto de la fachada y escribir una nota antes de dejar continuar.
- [ ] 📦 **Entregable:** Mockups de la app del inspector.

## E04 — Diseño técnico + infraestructura
`#agave/E04` · jue 24 sep · Sprint 2

- [ ] **Estructura del proyecto `app-inspector/`**
  → Crear la app con Expo + TypeScript, corriendo en un teléfono real vía Expo Go. Carpetas `screens/`, `components/`, `services/`, `db/`.
- [ ] **Navegación y pantallas vacías**
  → React Navigation con las pantallas del mockup, todavía sin datos.
- [ ] **`ApiClient` compartido**
  → Usar el de `shared/api-client` (el mismo que Marco y Jesús). Acordar el contrato con Jorge antes de escribirlo.
  ⛔ **Requiere:** Jorge · esqueleto de la API + `shared/types` (BD E04).
- [ ] **Base de datos local SQLite**
  → Con `expo-sqlite`, crear las tablas de la cola: `operacion_pendiente` (tipo, carga útil en JSON, `id_local`, fecha de creación, intentos) y `foto_pendiente`. Terminado cuando puedes insertar y leer un registro.
- [ ] 📦 **Entregable:** App del inspector base + navegación + SQLite local.

## E05 — Autenticación y roles
`#agave/E05` · jue 01 oct · Sprint 2 (cierre)

- [ ] **Login del inspector**
  → Correo y contraseña con Supabase Auth. Guardar el token con `expo-secure-store`, no en almacenamiento simple.
  ⛔ **Requiere:** Jorge · middleware de auth (BD E05).
- [ ] **Sesión persistente**
  → El inspector no debe volver a escribir su contraseña cada mañana: la sesión se mantiene y se renueva sola. Terminado cuando cierras la app, la vuelves a abrir al día siguiente y sigues dentro.
- [ ] **Bloqueo por rol**
  → Si entra alguien que no es inspector, mostrar "esta aplicación es solo para inspectores" y cerrar la sesión.
- [ ] 📦 **Entregable:** Login del inspector con sesión persistente.

## E06 — Clientes, domicilios, inspectores y zonas
`#agave/E06` · jue 08 oct · Sprint 3

- [ ] **Pantalla de perfil**
  → Nombre, teléfono, placa del vehículo, foto y **las zonas que tiene asignadas**. Botón de cerrar sesión.
  ⛔ **Requiere:** Jorge · endpoints de inspectores y zonas (BD E06).
- [ ] **Registro del dispositivo para notificaciones**
  → Al iniciar sesión, obtener el token de Expo Push y enviarlo a `POST /dispositivos`. Si el permiso está denegado, explicar por qué se necesita y ofrecer abrir los ajustes del teléfono.
- [ ] **Manejo del permiso de ubicación**
  → Pedir el permiso "siempre" **con una explicación previa** ("lo usamos solo mientras vas en camino a una cita, nunca fuera de tu jornada"). Terminado cuando el flujo funciona también si el usuario lo rechaza primero.
- [ ] 📦 **Entregable:** Perfil + registro de dispositivo + solicitud de permisos explicada.

## E07 — Agenda de inspecciones y asignación
`#agave/E07` · jue 15 oct · Sprint 3 (cierre)

> [!warning] Esta entrega ⛔ **Requiere:** Jorge · `GET /inspecciones/mi-ruta` (BD E07).

- [ ] **Ruta del día**
  → Lista de las citas de hoy ordenadas por ventana de atención, con nombre del cliente, colonia, horario comprometido y el estado con color. Con "jalar para actualizar".
- [ ] **Selector de fecha**
  → Poder ver la ruta de mañana o la de días pasados.
- [ ] **Detalle de la parada**
  → Cliente, teléfono, dirección completa con referencias, motivo de la visita, notas del administrador, y el estado de confirmación del cliente.
- [ ] **Abrir en el mapa**
  → Botón que abre Google Maps con las coordenadas del domicilio para navegar hasta allá.
- [ ] **Caché local de la ruta**
  → Guardar la ruta del día en SQLite al cargarla, para que el inspector pueda consultarla aunque se quede sin señal a media jornada.
- [ ] 📦 **Entregable:** Ruta del día del inspector con caché local.

## E08 — Motor de notificaciones push
`#agave/E08` · jue 22 oct · Sprint 4

- [ ] **Recibir notificación de cita asignada**
  → Cuando el administrador le asigna una cita nueva, el inspector recibe la notificación y al tocarla se abre el detalle de esa parada.
  ⛔ **Requiere:** Jorge · motor de notificaciones (BD E08).
- [ ] **Recibir aviso de cita reprogramada o cancelada**
  → Notificación + actualización automática de la ruta del día.
- [ ] **Recibir aviso de "el cliente ya está en su casa"**
  → Notificación urgente mientras va en camino, y marca visible en la pantalla del trayecto.
- [ ] **Manejo de la app cerrada y en segundo plano**
  → Probar los tres casos: app abierta, app en segundo plano y app cerrada. La notificación debe llevar a la pantalla correcta en los tres.
- [ ] 📦 **Entregable:** Notificaciones del inspector funcionando en los tres estados de la app.

## E09 — Confirmación y reprogramación
`#agave/E09` · jue 29 oct · Sprint 4 (cierre)

- [ ] **Estado de confirmación visible en la ruta**
  → Cada parada muestra si el cliente **confirmó**, **no ha respondido** o **pidió mover la cita**. Es lo que le dice al inspector si vale la pena ir.
  ⛔ **Requiere:** Jorge · endpoints de confirmación (BD E09).
- [ ] **Aviso cuando una cita se mueve**
  → Si el administrador aprueba una reprogramación, la cita desaparece de la ruta de hoy y el inspector recibe el aviso.
- [ ] **Resaltar las citas sin confirmar**
  → Las citas en `SIN_CONFIRMAR` se marcan con advertencia: "el cliente no ha respondido, confirma con la oficina antes de ir".
- [ ] 📦 **Entregable:** Estados de confirmación en la ruta del inspector.

## E10 — Trayecto y seguimiento en vivo
`#agave/E10` · jue 05 nov · Sprint 5

> [!warning] Semana de integración cruzada
> Lo que tú publiques es lo que Jesús pinta en el mapa del cliente. Coordínense a diario. Jorge deja un punto simulado desde el lunes, pero **el punto real es el tuyo**.

- [ ] **Botón "Voy en camino"**
  → En el detalle de la parada. Al pulsarlo llama a `POST /inspecciones/:id/trayecto`, la cita pasa a `EN_CAMINO` y el cliente recibe su notificación.
  ⛔ **Requiere:** Jorge · `iniciar_trayecto` (BD E10).
- [ ] **Publicación de la ubicación en segundo plano**
  → Con `expo-location` en modo background, enviar un punto cada 15 segundos **mientras el trayecto esté activo**. Terminado cuando el punto sigue llegando con la pantalla apagada y la app en segundo plano.
- [ ] **Pantalla de trayecto activo**
  → Mapa con la posición propia y el destino, tiempo estimado, y un indicador claro de **"compartiendo ubicación"** (el inspector debe saber siempre que lo están viendo).
- [ ] **Cortar el seguimiento**
  → La publicación se detiene al registrar llegada, al marcar ausente o al cancelar el trayecto. **Nunca debe quedarse encendida** después de eso: verificarlo con el teléfono en la mano.
- [ ] **Comportamiento sin señal durante el trayecto**
  → Si se pierde la red, los puntos se acumulan en local y se envían al reconectar; la app no debe congelarse ni mostrar error.
- [ ] **Prueba de campo del trayecto**
  → Recorrer una ruta real de al menos 15 minutos verificando con Jesús que el marcador se mueve en la app del cliente y que el ETA baja.
- [ ] 📦 **Entregable:** Trayecto del inspector con publicación en segundo plano + evidencia de la prueba de campo.

## E11 — Llegada, resultado y modo sin señal
`#agave/E11` · jue 12 nov · Sprint 5 (cierre)

> [!warning] Esta entrega ⛔ **Requiere:** Jorge · endpoints de llegada, resultado, evidencia, ausente y `/sincronizar` (BD E11). **Acuerda con él el formato del lote de sincronización al inicio del sprint.**

- [ ] **Registrar llegada**
  → Botón "Llegué": la cita pasa a `EN_SITIO`, se cierra el trayecto y se deja de compartir la ubicación.
- [ ] **Captura del resultado**
  → Formulario: estado del techo (bueno / regular / malo / crítico), hallazgos, si requiere reparación, urgencia y recomendaciones. **Exige al menos una foto** antes de permitir guardar (RN-11).
- [ ] **Cámara y galería de evidencia**
  → Tomar varias fotos, verlas en miniatura, poder borrar una y agregar descripción. Comprimir antes de guardar.
- [ ] **Registrar cliente ausente**
  → Pantalla que obliga a **foto de la fachada + nota** antes de continuar (RN-10). Al guardar, la cita pasa a `CLIENTE_AUSENTE`.
- [ ] **Cola de sincronización**
  → Toda operación (llegada, resultado, evidencia, ausente) se escribe **primero en SQLite** con un `id_local` (UUID) y su hora real, y después se intenta enviar. Si no hay red, se queda encolada.
- [ ] **Sincronización al reconectar**
  → Al recuperar la conexión, enviar el lote a `POST /sincronizar`, subir las fotos a Storage y **vaciar solo lo que el servidor confirmó**. Si una operación falla, se reintenta sin duplicar.
- [ ] **Indicador de pendientes**
  → Marca visible en la pantalla principal: "3 registros por enviar". El inspector nunca debe dudar de si su trabajo se guardó.
- [ ] **Mensajería con el cliente**
  → Enviar un mensaje corto ("voy retrasado 20 minutos") y llamarlo desde la app. Ver los mensajes del cliente.
- [ ] **Prueba en modo avión**
  → Registrar una inspección completa con el teléfono en modo avión, reactivar la red y verificar que todo llegó **una sola vez**.
- [ ] 📦 **Entregable:** Ejecución de la inspección + modo sin señal probado en modo avión.

## E12 — Pruebas integrales, implantación y entrega final
`#agave/E12` · jue 19 nov · Sprint 6

- [ ] **Prueba de campo completa**
  → Una inspección real de principio a fin siguiendo el guion de Mario: ruta del día → voy en camino → seguimiento → llegada → resultado con fotos → sincronización. **Con un tramo del recorrido sin señal a propósito.**
  ⛔ **Requiere:** Mario · guion de la prueba de campo (AN E11).
- [ ] **Evidencia de la prueba**
  → Capturas de pantalla, tiempos reales y anotaciones de todo lo que falló. Los fallos también son resultado: se reportan.
- [ ] **Corrección de los errores detectados**
  → Arreglar lo que salió mal en la prueba de campo, priorizando lo que impide completar el recorrido.
- [ ] **Instalación en los teléfonos de los inspectores**
  → Instalar el build de EAS en los teléfonos piloto, configurar permisos y verificar que cada inspector puede entrar y ver su ruta.
  ⛔ **Requiere:** Jorge · builds de producción (BD E12).
- [ ] **Capacitación práctica**
  → Acompañar a cada inspector en su primera cita real con la app. Terminada cuando la completa sin ayuda.
- [ ] 📦 **Entregable:** Evidencia de la prueba de campo + app instalada y en uso.

---

## 📊 Resumen de tu ruta

| Entrega | Lo que construyes |
|---------|-------------------|
| E01 | Spike de GPS en segundo plano + batería |
| E02 | Casos de uso y bocetos |
| E03 | Mockups finales |
| E04 | Esqueleto Expo + navegación + SQLite |
| E05 | Login con sesión persistente |
| E06 | Perfil + dispositivo + permisos |
| E07 | Ruta del día con caché |
| E08 | Notificaciones del inspector |
| E09 | Estados de confirmación en la ruta |
| E10 | "Voy en camino" + GPS en segundo plano |
| E11 | Llegada, resultado, ausente y modo sin señal |
| E12 | Prueba de campo + instalación |

**Documentos de referencia:** [[02_SRS_Requerimientos]] · [[04_Diagramas_UML]] · [[03_Diseno_Base_de_Datos]] · [[05_Calendario_Entregas]] · [[Integracion]]
