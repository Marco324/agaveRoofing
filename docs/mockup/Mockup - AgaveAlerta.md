---
titulo: Mockup — AgaveAlerta (Agave Roofing)
proyecto: Proyecto Integrador I — UANL FIME — Equipo 01
tipo: mockup / diseño de interfaz — material de presentación
sprint: E03 (diseño de interfaz)
fecha: 2026-09-16
tags: [agavealerta, mockup, diseño, ui, presentacion, E03]
---

# Mockup — AgaveAlerta

Propuesta de interfaz de los **tres servicios** del sistema, para presentar **cómo se va a ver y a usar** antes de programar.

> [!info] Estado de este documento
> Aquí están definidas las **pantallas, su contenido y su razón de ser**, con esquemas de bloques. Los mockups gráficos definitivos (Figma o imagen) se producen en **E03**: Marco los del panel, Anuar los del inspector y Jesús los del cliente. Cuando existan, se agregan a esta carpeta y se enlazan en cada apartado.

---

## 1. Qué estamos mostrando

El sistema tiene **tres aplicaciones** con públicos y contextos de uso muy distintos, y el diseño lo refleja:

| | **App del Cliente** | **App del Inspector** | **Panel del Administrador** |
|---|---|---|---|
| Quién la usa | El propietario de la casa; edad y alfabetización digital muy variadas | Personal de campo de Agave Roofing | Coordinador de operaciones |
| Dónde corre | Teléfono, en cualquier lado | Teléfono, de pie en la calle, con sol y a veces sin señal | Navegador, en una oficina |
| Objetivo | Enterarse, confirmar con un toque y saber cuánto falta | Hacer su ruta y registrar lo que pasó, rápido y sin depender de la red | Programar, vigilar y medir |
| Tono visual | Muy poco texto, botones enormes, lenguaje humano | Alto contraste, botones grandes para usar con una mano | Claro, tabular, denso en información |

**La idea de la demostración:** seguir **una sola cita de principio a fin** saltando entre las tres pantallas — se programa en el panel, llega la notificación al cliente, el inspector sale y el cliente lo ve acercarse en el mapa.

---

## 2. Lenguaje visual y de diseño

**Una sola identidad, tres densidades.** Las tres aplicaciones comparten tipografía, iconografía, la forma de los botones y, sobre todo, **el mismo vocabulario de estados**: una cita se llama igual y se ve del mismo color en las tres. Cambia la densidad: enorme en el cliente, grande en el inspector, compacta en el panel.

**El dato más importante siempre es lo más grande.** En la app del cliente eso es **cuándo llega el inspector**; en la del inspector, **cuál es la siguiente parada**; en el panel, **cuántas citas están sin confirmar**.

**El color comunica estado, no decora.**

| Color | Significa | Estados de la cita |
|---|---|---|
| Gris | Programada, aún sin avisar | `PROGRAMADA` |
| Azul | Ya se avisó, esperando respuesta | `NOTIFICADA` |
| Verde | Todo en orden | `CONFIRMADA`, `COMPLETADA` |
| Ámbar | Requiere atención | `SIN_CONFIRMAR`, `REPROG_SOLICITADA` |
| Morado | En movimiento, ahora mismo | `EN_CAMINO`, `EN_SITIO` |
| Rojo | Se perdió el viaje | `CLIENTE_AUSENTE` |
| Gris tachado | Ya no aplica | `CANCELADA` |

**Principios de interacción**

- **El cliente confirma en 3 toques o menos**, y de preferencia en cero: desde los botones de la propia notificación, sin abrir la app.
- **Nada de jerga.** El cliente nunca lee "estado: EN_CAMINO", lee "El inspector va en camino, llega en 12 minutos".
- **La app del inspector siempre dice si algo está pendiente de enviar.** Un contador visible de operaciones en cola: el inspector nunca debe dudar de si su trabajo se guardó.
- **La ubicación se muestra solo cuando corresponde.** El mapa del cliente existe únicamente mientras el trayecto está activo; antes y después, en su lugar va el estado de la cita. Es un compromiso de privacidad, no una decisión estética.
- **Nada se borra.** Clientes, domicilios, inspectores y zonas se dan de baja lógica; las citas se cancelan conservando su historial.

---

## 3. App del Cliente — recorrido funcional

### 3.1 · La notificación (la pantalla más importante del proyecto)

```
┌──────────────────────────────────────────┐
│  Pantalla bloqueada                      │
│  ┌────────────────────────────────────┐  │
│  │ 🏠  Agave Roofing          ahora   │  │
│  │ Inspección programada              │  │
│  │ Su inspección de techo es el       │  │
│  │ jueves 10 entre 10:00 y 12:00.     │  │
│  │ ┌──────────────┐ ┌──────────────┐  │  │
│  │ │  Sí estaré   │ │  Mover cita  │  │  │
│  │ └──────────────┘ └──────────────┘  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**Para qué sirve:** sustituir el correo que nadie lee. Es el punto donde el proyecto gana o pierde.
**Funcionalidad:** llega 24 horas antes. Los dos botones responden **sin abrir la app**; al tocar el cuerpo se abre el detalle de la cita. Si la push no se entrega, el mismo mensaje llega por SMS con un enlace corto.
**Diseño:** una frase, una fecha, dos botones. Nada más.

### 3.2 · Mis citas

```
┌────────────────────────────────┐
│  Mis inspecciones              │
│  ┌──────────────────────────┐  │
│  │ PRÓXIMA                  │  │
│  │ Jueves 10 de septiembre  │  │
│  │ Entre 10:00 y 12:00      │  │
│  │ ● Confirmada             │  │
│  │ Inspector: Luis Ramírez  │  │
│  │ ┌──────────────────────┐ │  │
│  │ │  Ver detalle         │ │  │
│  │ └──────────────────────┘ │  │
│  └──────────────────────────┘  │
│                                │
│  Anteriores                    │
│  • 12 jun 2026 · Completada    │
│  • 03 mar 2026 · Completada    │
└────────────────────────────────┘
```

**Para qué sirve:** que el cliente sepa, en dos segundos, cuándo es su próxima inspección.
**Funcionalidad:** la próxima cita ocupa la pantalla; el botón de abajo cambia según el estado (Confirmar, Ver mapa, Ver reporte). Debajo, el historial.

### 3.3 · Detalle de la cita

**Para qué sirve:** toda la información de una visita en un solo lugar.
**Funcionalidad:** fecha y ventana de atención, domicilio, motivo de la visita, **ficha del inspector** (nombre, foto y placa del vehículo, para que el cliente sepa a quién le abre la puerta) y la línea de tiempo de la cita en lenguaje humano. Botones de confirmar, mover cita, mensaje y llamada.

### 3.4 · Mover la cita

```
┌────────────────────────────────┐
│  ← Elegir otro horario         │
│  Tu cita: jue 10, 10:00–12:00  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Viernes 11               │  │
│  │ 10:00 – 12:00            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Viernes 11               │  │
│  │ 14:00 – 16:00            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Lunes 14                 │  │
│  │ 08:00 – 10:00            │  │
│  └──────────────────────────┘  │
│                                │
│  Motivo (opcional)             │
│  ┌──────────────────────────┐  │
│  │                          │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

**Para qué sirve:** que el cliente mueva su cita **sin llamar a la oficina**.
**Funcionalidad:** muestra horarios **realmente disponibles** en su zona. Al enviar, queda "en revisión" hasta que el administrador aprueba. Si la cita ya va en camino o ya se movió tres veces, el botón no aparece y se explica por qué.

### 3.5 · Seguimiento en el mapa

```
┌────────────────────────────────┐
│ ┌────────────────────────────┐ │
│ │      Llega en 12 min       │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │        🚚                  │ │
│ │              ╲             │ │
│ │               ╲            │ │
│ │                🏠          │ │
│ │                            │ │
│ └────────────────────────────┘ │
│  Luis Ramírez · ABC-123        │
│  ┌──────────────────────────┐  │
│  │  Ya estoy en mi casa     │  │
│  └──────────────────────────┘  │
│  ┌───────────┐ ┌────────────┐  │
│  │  Mensaje  │ │   Llamar   │  │
│  └───────────┘ └────────────┘  │
└────────────────────────────────┘
```

**Para qué sirve:** eliminar la espera indefinida. Es lo que convence al cliente de quedarse en casa.
**Funcionalidad:** el marcador del inspector se mueve cada 15 segundos y el tiempo estimado se recalcula cada minuto. Si se pierde la señal, se muestra el último punto conocido **con su hora** ("última ubicación hace 3 minutos"), nunca un mapa congelado sin explicación.
**Diseño:** el tiempo estimado va arriba, en la letra más grande de toda la app. El botón "Ya estoy en mi casa" es lo único que compite con él.

### 3.6 · Reporte de la inspección

**Para qué sirve:** cerrar el ciclo — el cliente recibe algo a cambio de haber esperado.
**Funcionalidad:** estado del techo con su color, hallazgos, si requiere reparación y con qué urgencia, recomendaciones y la galería de fotos que tomó el inspector. Botón para descargar el PDF.

---

## 4. App del Inspector — recorrido funcional

### 4.1 · Ruta del día

```
┌────────────────────────────────┐
│  Hoy, jueves 10        3 de 6  │
│  ┌──────────────────────────┐  │
│  │ 10:00–12:00   ● Confirm. │  │
│  │ Ana López                │  │
│  │ Col. Cumbres             │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 12:00–14:00   ⚠ Sin conf.│  │
│  │ Pedro Sánchez            │  │
│  │ Col. Del Valle           │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 14:00–16:00   ● Confirm. │  │
│  │ María Torres             │  │
│  │ Col. Anáhuac             │  │
│  └──────────────────────────┘  │
│                                │
│  ⬆ 2 registros por enviar      │
└────────────────────────────────┘
```

**Para qué sirve:** que el inspector sepa a dónde va sin preguntarle a nadie.
**Funcionalidad:** las citas del día ordenadas por ventana, con el **estado de confirmación del cliente** visible — es lo que le dice si vale la pena el viaje. Se guarda en el teléfono para consultarla sin señal. Abajo, siempre, el contador de operaciones pendientes de enviar.

### 4.2 · Detalle de la parada

**Para qué sirve:** todo lo que necesita antes de tocar la puerta.
**Funcionalidad:** cliente, teléfono, dirección completa **con referencias** ("casa blanca con portón negro"), motivo de la visita y notas del administrador. Tres botones grandes: **Voy en camino**, Llamar y Abrir en el mapa.

### 4.3 · Trayecto activo

```
┌────────────────────────────────┐
│  ● Compartiendo ubicación      │
│ ┌────────────────────────────┐ │
│ │        (mapa con ruta)     │ │
│ └────────────────────────────┘ │
│  Ana López · Col. Cumbres      │
│  Llegada estimada: 10:18       │
│  ✓ El cliente ya está en casa  │
│  ┌──────────────────────────┐  │
│  │        LLEGUÉ            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │    Cliente ausente       │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

**Para qué sirve:** operar con una sola mano mientras maneja o camina.
**Funcionalidad:** dos botones y nada más. El aviso **"compartiendo ubicación"** está siempre visible: el inspector debe saber en todo momento que lo están viendo. Si el cliente confirma que está en casa, aparece la palomita.

### 4.4 · Captura del resultado

**Para qué sirve:** registrar la inspección en menos de dos minutos, con o sin señal.
**Funcionalidad:** estado del techo en cuatro botones grandes (bueno / regular / malo / crítico), hallazgos, si requiere reparación y su urgencia, recomendaciones y la galería de fotos. **Exige al menos una fotografía.** Si no hay señal, se guarda en la cola y se muestra el aviso "se enviará cuando haya señal" — el inspector puede seguir con la siguiente casa.

### 4.5 · Cliente ausente

**Para qué sirve:** documentar la visita fallida para poder cobrarla y medirla.
**Funcionalidad:** pantalla que **no deja continuar** sin foto de la fachada y una nota. Al guardar, la cita queda como visita fallida y el administrador puede crear el reintento.

---

## 5. Panel del Administrador — recorrido funcional

### 5.1 · Agenda

```
┌──────────────────────────────────────────────────────────┐
│ AgaveAlerta   Agenda · Clientes · Inspectores · Tablero   │
├──────────────────────────────────────────────────────────┤
│  Semana del 7 al 12 de septiembre      [+ Programar]      │
│           Lun 7   Mar 8   Mié 9   Jue 10  Vie 11  Sáb 12 │
│  Luis R.  ██■     ██      ██■     ███     ██      ■       │
│  Ana M.   ██      ███     ██      ██■     ███     ██      │
│  Jorge P. ■       ██      ███     ██      ██      ■       │
│                                                           │
│  ⚠ 3 citas de mañana sin confirmar    ⟳ 2 reprogramac.   │
└──────────────────────────────────────────────────────────┘
```

**Para qué sirve:** ver la operación de la semana completa de un vistazo.
**Funcionalidad:** calendario por inspector, cada bloque con el color de su estado. Filtros por zona y estado. Las alertas de abajo son la razón por la que el administrador abre el panel cada mañana.

### 5.2 · Programar una inspección

**Para qué sirve:** crear la cita en menos de un minuto.
**Funcionalidad:** cliente → domicilio → fecha → ventana de atención → inspector → motivo. Si el inspector ya tiene otra cita traslapada, el sistema lo rechaza y lo dice con claridad. Al guardar se genera el folio y quedan programados los tres avisos.

### 5.3 · Domicilio en el mapa

**Para qué sirve:** que el inspector llegue al lugar correcto.
**Funcionalidad:** al guardar una dirección, el sistema la geocodifica y muestra el pin. Si quedó mal ubicado, el administrador **lo arrastra a su lugar**; el sistema recuerda que la coordenada es manual.

### 5.4 · Bandeja de reprogramaciones

**Para qué sirve:** resolver en un clic lo que antes eran tres llamadas.
**Funcionalidad:** cada solicitud muestra la fecha actual, la que pide el cliente y el motivo. Botones Aprobar y Rechazar (con motivo). Al aprobar, la cita se mueve conservando el folio y el cliente recibe la notificación del cambio.

### 5.5 · Monitor en vivo

**Para qué sirve:** la vista que la oficina deja abierta todo el día.
**Funcionalidad:** mapa con **todos los inspectores que van en camino ahora**, su destino y su tiempo estimado. A un lado, las citas de hoy ordenadas por ventana, marcando en rojo las que ya se pasaron de su hora comprometida.

### 5.6 · Tablero de indicadores

```
┌──────────────────────────────────────────────────────────┐
│  Noviembre 2026                          [Exportar CSV]   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │   142    │ │   87 %   │ │    6     │ │    11    │    │
│  │  citas   │ │confirmad.│ │ fallidas │ │reprogram.│    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                           │
│  Confirmación por semana        Puntualidad por inspector │
│   ▁▃▅▆▇▇                        Luis R.  ████████ 92 %   │
│                                 Ana M.   ███████  85 %   │
│                                 Jorge P. ██████   78 %   │
│                                                           │
│  Entrega por canal: push 81 % · SMS 96 % · correo 42 %   │
└──────────────────────────────────────────────────────────┘
```

**Para qué sirve:** demostrar con números que el sistema resolvió el problema.
**Funcionalidad:** tarjetas del periodo, evolución de la tasa de confirmación, puntualidad por inspector y **efectividad por canal** — el dato que compara la notificación push contra el correo que se usaba antes. Exportable a CSV.

---

## 6. Inventario de pantallas

| # | Servicio | Pantalla | Responsable del mockup | Entrega |
|---|----------|----------|------------------------|---------|
| 1 | Cliente | Notificación (día, recordatorio, en camino) | Jesús (CL) | E03 |
| 2 | Cliente | Mis citas | Jesús (CL) | E03 |
| 3 | Cliente | Detalle de la cita | Jesús (CL) | E03 |
| 4 | Cliente | Mover la cita | Jesús (CL) | E03 |
| 5 | Cliente | Seguimiento en el mapa | Jesús (CL) | E03 |
| 6 | Cliente | Reporte de inspección | Jesús (CL) | E03 |
| 7 | Cliente | Ingreso con código | Jesús (CL) | E03 |
| 8 | Inspector | Ruta del día | Anuar (IN) | E03 |
| 9 | Inspector | Detalle de la parada | Anuar (IN) | E03 |
| 10 | Inspector | Trayecto activo | Anuar (IN) | E03 |
| 11 | Inspector | Captura del resultado | Anuar (IN) | E03 |
| 12 | Inspector | Cliente ausente | Anuar (IN) | E03 |
| 13 | Panel | Agenda semanal | Marco (LP) | E03 |
| 14 | Panel | Programar inspección | Marco (LP) | E03 |
| 15 | Panel | Domicilio en el mapa | Marco (LP) | E03 |
| 16 | Panel | Bandeja de reprogramaciones | Marco (LP) | E03 |
| 17 | Panel | Monitor en vivo | Marco (LP) | E03 |
| 18 | Panel | Tablero de indicadores | Marco (LP) | E03 |

---

**Documentos relacionados:** [[02_SRS_Requerimientos]] · [[04_Diagramas_UML]] · [[05_Calendario_Entregas]] · [[README - Checklists del equipo]]
