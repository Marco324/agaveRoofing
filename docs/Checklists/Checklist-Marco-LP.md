---
integrante: Marco Antonio Méndez Sánchez
matricula: "2177912"
clave: LP
rol: Product Owner / Scrum Master + Panel de administración
aliases: [Checklist Marco, Checklist LP]
tags: [agavealerta, checklist, rol/lider, rol/panel]
---

# ✅ Checklist — Marco (LP) · Liderazgo del proyecto + Panel de administración

> [!info] Cómo leer esta lista
> Cada `- [ ]` es una tarea. La flecha **→** explica qué hacer y cuándo se considera terminada. ⛔ **Requiere** = bloqueo duro (no empieces sin eso). 🔸 **Mejor después de** = puedes avanzar pero se completa con eso. El 📦 es lo que se entrega ese jueves. Ver [[README - Checklists del equipo]].
>
> **Tu rol:** eres **Product Owner y Scrum Master** (interlocutor con Agave Roofing, backlog, ceremonias, riesgos y entrega) y además construyes el **panel web de administración**, que es el servicio más ligero: altas, agenda y tablero sobre endpoints que Jorge ya expone. Guíate por [[02_SRS_Requerimientos]] (módulos 2, 3, 9 y 10) y por las vistas SQL de [[03_Diseno_Base_de_Datos]] §8.

---

## E01 — Arranque y planeación
`#agave/E01` · jue 03 sep · Sprint 0

- [ ] **Acta de constitución del equipo**
  → Documento con: integrantes y matrículas, rol de cada quien, horario de trabajo, canal de comunicación y acuerdos de convivencia. Terminada cuando los cinco la firman.
- [ ] **Product Backlog inicial**
  → Convertir la propuesta de Agave Roofing en épicas e historias de usuario ("Como cliente quiero confirmar mi cita desde la notificación para no tener que abrir la app"). Mínimo las épicas de los 10 módulos del SRS.
- [ ] **Tablero en GitHub Projects**
  → Columnas: Backlog → Por hacer → En curso → En revisión → Hecho. Crear los Milestones `E01` a `E12`.
- [ ] **Definición de Terminado (DoD)**
  → Escribir qué significa "terminado" en este proyecto: criterios cumplidos, PR revisado y fusionado, **probado en teléfono real**, sin errores de severidad alta, documentación y tablero actualizados.
- [ ] **Agendar las ceremonias Scrum**
  → Fijar día y hora de Planning, Daily (lun-mié-vie, 10 min), Review y Retro para los 6 sprints. Terminado cuando está en el calendario compartido de los cinco.
- [ ] **Primer contacto con Agave Roofing**
  → Confirmar quién será el interlocutor (responsable de operaciones) y agendar la entrevista de E02 con Mario.
- [ ] 📦 **Entregable:** Acta + Product Backlog + tablero + DoD + calendario de ceremonias.

## E02 — Análisis
`#agave/E02` · jue 10 sep · Sprint 1

- [ ] **Sprint Planning 1**
  → Elegir del backlog lo que entra al Sprint 1 y desglosarlo en tareas. Terminado cuando el Sprint Backlog está en el tablero con responsable.
- [ ] **Estimación del backlog en puntos**
  → Con todo el equipo, estimar las historias en escala Fibonacci (1, 2, 3, 5, 8, 13). Terminado cuando todas las historias del Sprint 1 y 2 tienen puntos.
- [ ] **Reunión con el responsable de operaciones (con Mario)**
  → Acompañar la entrevista. Lo que necesitas sacar tú: **cuántas visitas fallidas hay al mes y cuánto cuesta cada una**; ese número es la justificación del proyecto.
- [ ] **Minuta de la reunión**
  → Acuerdos, decisiones y pendientes con responsable y fecha.
- [ ] **Riesgos v2**
  → Actualizar la tabla de riesgos del [[01_Plan_de_Proyecto]] §9 con lo que salió de la entrevista. Poner especial atención a R4 (la push no se entrega) y R11 (clientes que no instalan la app).
- [ ] 📦 **Entregable:** Sprint Backlog 1 + minuta + riesgos v2.

## E03 — Requerimientos cerrados + diseño de interfaz
`#agave/E03` · jue 17 sep · Sprint 1 (cierre)

> [!warning] Depende de
> Mario · SRS completo (AN E03) para poder validarlo con el cliente.

- [ ] **Validar el SRS con Agave Roofing**
  → Sesión con el responsable de operaciones repasando requerimiento por requerimiento los de prioridad Alta. Terminada cuando dice "sí, eso es lo que necesito" y firma.
  ⛔ **Requiere:** Mario · SRS completo (AN E03).
- [ ] **Acta de congelación de alcance**
  → Documento corto: qué entra, qué no entra y cómo se tramita un cambio (entra al backlog, lo prioriza el PO). Firmado por el cliente y por la catedrática.
- [ ] **Mockup final — agenda del panel**
  → Calendario semanal con las citas por inspector, colores por estado y un panel lateral para programar una cita nueva.
- [ ] **Mockup final — tablero de indicadores**
  → Tarjetas (citas del mes, tasa de confirmación, visitas fallidas, reprogramaciones) + gráfica de citas por estado + ranking de puntualidad por inspector.
- [ ] **Sprint Review 1 + Retrospectiva + Planning 2**
  → Demostrar lo del sprint, anotar qué mejorar y planear el Sprint 2.
- [ ] **Consolidar el diseño de la base de datos en la entrega**
  → Jorge entrega esta semana el **diseño de la BD**: [[03_Diseno_Base_de_Datos]] (normativo) y [[03b_Modelo_Datos_Resumen_E03]] (ERD de 5 entidades + flujo de datos, para exponer). Terminado cuando ambos van en el paquete de E03 junto al SRS y los mockups.
  🔸 **Mejor después de:** Jorge · diccionario de datos y ERD (BD E03).
- [ ] 📦 **Entregable:** SRS validado y firmado + acta de congelación + mockups del panel + **diseño de la base de datos consolidado** en la entrega.

## E04 — Diseño técnico + infraestructura
`#agave/E04` · jue 24 sep · Sprint 2

- [ ] **Plan de pruebas**
  → Documento con: qué se prueba, quién, con qué datos y cuál es el criterio de aceptación de cada historia. Incluir que las apps se prueban **en teléfono real** y que desde E10 hay pruebas de campo.
- [ ] **Estructura del proyecto `panel/`**
  → Crear la carpeta con React + Vite + TypeScript, compilando. Carpetas `pages/`, `components/`, `services/`.
- [ ] **Layout y rutas + `ApiClient` compartido**
  → Menú lateral, encabezado y páginas vacías. Usar el mismo `ApiClient` de `shared/api-client` que usan las dos apps móviles.
  ⛔ **Requiere:** Jorge · BD migrada en Supabase + esqueleto de la API (BD E04). *Coordina con Anuar y Jesús para que el `ApiClient` sea uno solo.*
- [ ] 📦 **Entregable:** Plan de pruebas + panel base compilando.

## E05 — Autenticación y roles
`#agave/E05` · jue 01 oct · Sprint 2 (cierre)

- [ ] **Login del panel**
  → Formulario correo + contraseña con Supabase Auth; guardar el token para las llamadas a la API.
  ⛔ **Requiere:** tu layout + `ApiClient` (E04) + Jorge · middleware de auth (BD E05).
- [ ] **Guardas de ruta (solo ADMINISTRADOR)**
  → El panel es exclusivo del rol Administrador. Si entra un inspector o un cliente, mostrar "sin permiso" y no dejar pasar.
  ⛔ **Requiere:** Jorge · autorización por rol (BD E05).
- [ ] **Layout autenticado**
  → Una vez dentro: nombre del usuario, botón de cerrar sesión y el menú completo del panel.
- [ ] **Sprint Review 2 + Retrospectiva + Planning 3**
  → Demostrar el incremento del Sprint 2 y planear el 3.
- [ ] 📦 **Entregable:** Módulo de seguridad del panel + minuta del Review.

## E06 — Clientes, domicilios, inspectores y zonas
`#agave/E06` · jue 08 oct · Sprint 3

> [!warning] Toda esta entrega ⛔ **Requiere:** Jorge · endpoints de clientes, domicilios, inspectores y zonas (BD E06), y tu módulo de seguridad del panel (E05).

- [ ] **Pantalla de clientes**
  → Tabla con búsqueda, alta, edición y baja lógica. Campos: nombre, teléfono, correo y **canal preferido** (push / SMS / correo).
- [ ] **Pantalla de domicilios con mapa**
  → Alta del domicilio de un cliente con su dirección completa y referencias. Al guardar, la API lo geocodifica y tú **muestras el pin en un mapa para poder moverlo a mano** si quedó mal (campo `geocodificado`).
- [ ] **Pantalla de zonas de servicio**
  → Alta y edición de zonas, con la lista de colonias o municipios que cubre cada una.
- [ ] **Pantalla de inspectores**
  → Alta con nombre, teléfono, placa del vehículo y foto (el cliente ve estos datos para identificarlo). Asignación de **una o varias zonas** por inspector.
- [ ] 📦 **Entregable:** Módulo de catálogos del panel.

## E07 — Agenda de inspecciones y asignación
`#agave/E07` · jue 15 oct · Sprint 3 (cierre)

> [!warning] Toda esta entrega ⛔ **Requiere:** Jorge · API de agenda con folio, validación de traslape y máquina de estados (BD E07).

- [ ] **Calendario de citas**
  → Vista semanal y diaria, con filtro por inspector y por zona. Cada cita se pinta con el color de su estado (programada, notificada, confirmada, sin confirmar, en camino, completada, ausente).
- [ ] **Programar una inspección**
  → Formulario: cliente → domicilio → fecha → ventana de atención (ej. 10:00–12:00) → inspector → motivo de la visita. Si el inspector ya tiene una cita traslapada, la API lo rechaza y tú muestras el mensaje claro.
- [ ] **Reasignar, mover o cancelar**
  → Cambiar de inspector, mover la fecha u hora, o cancelar con motivo. Cada acción queda en el historial de la cita.
- [ ] **Detalle de la cita con su línea de tiempo**
  → Pantalla que muestra todos los cambios de estado de esa cita con fecha, hora y quién lo hizo (viene de `inspeccion_historial`). Es lo que se consulta cuando un cliente se queja.
- [ ] **Demo intermedia al cliente**
  → Enseñarle a Agave Roofing lo que ya corre: catálogos y agenda. Recoger comentarios y meterlos al backlog.
- [ ] **Sprint Review 3 + Retrospectiva + Planning 4**
- [ ] 📦 **Entregable:** Agenda del panel + demo + minuta.

## E08 — Motor de notificaciones push
`#agave/E08` · jue 22 oct · Sprint 4

> [!info] Esta semana tu papel de PO pesa más que el de desarrollador: el riesgo R4 (la notificación no se entrega) es el riesgo más grande del proyecto y te toca medirlo.

- [ ] **Vista de notificaciones en el panel**
  → Tabla con todas las notificaciones de las citas próximas: tipo, canal, estado (pendiente / enviada / entregada / fallida), intentos y error. Botón **Reenviar** manual.
  ⛔ **Requiere:** Jorge · tablas y despachador de notificaciones (BD E08).
- [ ] **Alerta de "cliente no alcanzado"**
  → Si todas las notificaciones de una cita fallaron, resaltarla en la agenda para que la oficina llame por teléfono.
- [ ] **Bitácora de entregabilidad (riesgo R4)**
  → Tabla de resultados: con qué teléfonos se probó, cuántas push llegaron, cuántas requirieron SMS, en cuánto tiempo. Terminada cuando hay al menos **20 envíos medidos** en teléfonos distintos.
- [ ] **Sprint Planning 4**
- [ ] 📦 **Entregable:** Vista de notificaciones + bitácora de entregabilidad.

## E09 — Confirmación y reprogramación
`#agave/E09` · jue 29 oct · Sprint 4 (cierre)

> [!warning] Toda esta entrega ⛔ **Requiere:** Jorge · endpoints de reprogramación y temporizador de `SIN_CONFIRMAR` (BD E09).

- [ ] **Bandeja de reprogramaciones**
  → Lista de las solicitudes del cliente (`SOLICITADA`) con la fecha actual, la fecha pedida y el motivo. Botones **Aprobar** y **Rechazar** (el rechazo pide motivo). Al aprobar, la cita se mueve conservando el folio.
- [ ] **Alerta de citas sin confirmar**
  → Panel con las citas de mañana que pasaron a `SIN_CONFIRMAR` (nadie respondió en el plazo). Desde ahí, el administrador puede **registrar una confirmación por llamada** o cancelar la cita.
- [ ] **Reprogramación iniciada por la oficina**
  → El administrador también puede mover una cita él mismo (cuando el inspector se enferma, por ejemplo) y el cliente recibe la notificación del cambio.
- [ ] **Sprint Review 4 + Retrospectiva + Planning 5**
- [ ] 📦 **Entregable:** Bandeja de reprogramaciones + alerta de sin confirmar + minuta.

## E10 — Trayecto y seguimiento en vivo
`#agave/E10` · jue 05 nov · Sprint 5

- [ ] **Monitor en vivo**
  → Mapa del panel con **todos los inspectores que van en camino** ahora mismo, su cita destino y su ETA. Es la vista que la oficina deja abierta todo el día.
  ⛔ **Requiere:** Jorge · canal Realtime y ETA (BD E10) + Anuar · publicación de ubicación (IN E10).
- [ ] **Lista de "hoy" con semáforo**
  → Panel lateral con las citas del día ordenadas por ventana, marcando en rojo las que ya se pasaron de su hora comprometida.
- [ ] **Capacitación a los inspectores piloto**
  → Sesión de 1 hora con los inspectores que participarán en la prueba: instalar la app, explicar el permiso de ubicación en segundo plano y por qué se pide. Terminada cuando cada uno completó un trayecto de prueba.
- [ ] **Sprint Planning 5**
- [ ] 📦 **Entregable:** Monitor en vivo + evidencia de la capacitación.

## E11 — Llegada, resultado, tablero y modo sin señal
`#agave/E11` · jue 12 nov · Sprint 5 (cierre)

> [!warning] Esta entrega ⛔ **Requiere:** Jorge · vistas de indicadores `v_indicadores_semana`, `v_puntualidad_inspector` y `v_efectividad_notificacion` (BD E11).

- [ ] **Tablero — tarjetas principales**
  → Citas del periodo, **tasa de confirmación**, **visitas fallidas**, reprogramaciones y completadas. Con selector de rango de fechas.
- [ ] **Tablero — gráficas**
  → Citas por estado (barras), evolución semanal de la tasa de confirmación (línea) y ranking de puntualidad por inspector.
- [ ] **Tablero — efectividad por canal**
  → Cuántas push se entregaron, cuántas necesitaron SMS y cuántas fallaron. Es el dato que demuestra si el sistema resolvió el problema del correo.
- [ ] **Exportar a CSV**
  → Botón para descargar los indicadores del rango seleccionado.
- [ ] **Feature freeze**
  → Anunciar el congelamiento: a partir de aquí solo se corrigen errores, no se agregan funciones. Lo que quede pendiente pasa a "trabajo futuro".
- [ ] **Sprint Review 5 + Retrospectiva + Planning 6**
- [ ] 📦 **Entregable:** Tablero de indicadores + anuncio de feature freeze + minuta.

## E12 — Pruebas integrales, implantación y entrega final
`#agave/E12` · jue 19 nov · Sprint 6

- [ ] **Pruebas de aceptación con Agave Roofing**
  → Acompañar al responsable de operaciones mientras él mismo programa una cita, ve llegar la notificación al teléfono del cliente y sigue al inspector en el mapa. Terminadas cuando firma los criterios de éxito del [[01_Plan_de_Proyecto]] §11.
  ⛔ **Requiere:** Anuar · prueba de campo (IN E12) y Jesús · pruebas integrales (CL E12).
- [ ] **Acta de aceptación**
  → Documento firmado por el cliente: qué se entregó, qué quedó fuera y qué observaciones hay.
- [ ] **Presentación final**
  → Diapositivas: problema (el correo y las visitas fallidas), solución, arquitectura de los tres servicios, demostración en vivo, indicadores obtenidos y trabajo futuro. Ensayar el tiempo.
- [ ] **Demostración en vivo**
  → El recorrido completo delante del grupo: programar → notificar → confirmar → ir en camino → mapa → llegada → reporte. Tener un plan B grabado en video por si falla la red del salón.
- [ ] **Cierre del proyecto**
  → Retrospectiva final, entrega de documentación consolidada y cierre del tablero.
- [ ] 📦 **Entregable:** Acta de aceptación + presentación final + proyecto cerrado.

---

## 📊 Resumen de tu carga por entrega

| Entrega | Foco de liderazgo | Foco de desarrollo |
|---------|-------------------|--------------------|
| E01 | Acta, backlog, tablero, DoD | — |
| E02 | Planning 1, estimación, cliente | — |
| E03 | Validar SRS, congelar alcance, Review 1 | Mockups del panel |
| E04 | Plan de pruebas | Panel base |
| E05 | Review 2, Planning 3 | Login y guardas |
| E06 | — | Catálogos |
| E07 | Demo intermedia, Review 3 | Agenda y calendario |
| E08 | Bitácora de entregabilidad (R4), Planning 4 | Vista de notificaciones |
| E09 | Review 4, Planning 5 | Bandeja de reprogramaciones |
| E10 | Capacitación a inspectores | Monitor en vivo |
| E11 | Feature freeze, Review 5 | Tablero de indicadores |
| E12 | Aceptación, presentación, cierre | — |

**Documentos de referencia:** [[01_Plan_de_Proyecto]] · [[02_SRS_Requerimientos]] · [[03_Diseno_Base_de_Datos]] · [[05_Calendario_Entregas]] · [[Integracion]]
