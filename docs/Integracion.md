# Integración y mapeo — cómo las tareas de los checklists se vuelven un solo sistema

**Proyecto:** AgaveAlerta — Alerta y seguimiento de inspecciones de techo (Agave Roofing) — Equipo 01
**Para:** entender dónde converge el trabajo de los 5 integrantes y cómo se mide el avance unificado.

---

## 1. Modelo mental

- **Checklists (Obsidian)** = el *plan*: quién hace qué y en qué entrega.
- **Repositorio `agave-alerta` (lo que se abre en VS Code)** = el *sistema real*: ahí converge todo el código de los tres servicios.
- Los checklists **no se juntan**. Lo que se junta es el **código en la rama `main`**, semana a semana.

Cada tarea `- [ ]` de un checklist recorre este camino:

```
- [ ] tarea del checklist
   └─► Issue en GitHub (#N)  ─►  rama feat/...  ─►  commits
        └─► Pull Request  ─►  revisión de un compañero  ─►  CI en verde
             └─► merge a `main`   ◄── AQUÍ se integra con lo de todos
                  └─► se marca  - [x]  en Obsidian   (regla de oro)
```

Cada jueves Marco pone el tag **`entrega-0X`** sobre `main`: esa es la foto del avance unificado de la semana. Al llegar a E12, `main` ya contiene todo. No hay "armado final".

**La diferencia con un proyecto de un solo cliente:** aquí hay **tres aplicaciones** que hablan con **una sola API**. La integración no se prueba abriendo una pantalla, se prueba **siguiendo una cita**: se programa en el panel, le llega la notificación al cliente, el inspector inicia el trayecto y el cliente lo ve en el mapa. Si ese recorrido funciona de punta a punta, el sistema está integrado.

---

## 2. Mapa de carpetas del repo

```
agave-alerta/                     UN repositorio = el sistema completo
├─ api/            → Jorge (BD)   API REST (Express) + base de datos (Prisma/PostgreSQL).
│                                 El "cerebro": estados de la cita, notificaciones, ETA.
├─ panel/          → Marco (LP)   Panel web de administración (React + Vite).
│                                 Agenda, catálogos, reprogramaciones y tablero.
├─ app-inspector/  → Anuar (IN)   App móvil del inspector (React Native + Expo).
│                                 Ruta del día, trayecto, GPS en segundo plano, modo sin señal.
├─ app-cliente/    → Jesús (CL)   App móvil del cliente (React Native + Expo).
│                                 Notificaciones, confirmación, mapa con ETA, reporte.
├─ shared/         → común        ApiClient + tipos del dominio que usan los tres clientes.
│  ├─ api-client/                 Cliente HTTP con el JWT ya adjunto.
│  └─ types/                      Estados de la cita, tipos de notificación, DTOs.
├─ docs/           → Mario (AN)   SRS, UML, manual, casos de prueba, ADR, entregas.
│  ├─ adr/                        Decisiones de arquitectura (ADR-001 = stack).
│  └─ entregas/E01…E12/           Entregables no-código de cada jueves.
└─ .github/workflows/ci.yml       Integración continua: lint + build + pruebas en cada PR.
```

**Por qué se unifica:** `panel/`, `app-inspector/` y `app-cliente/` **le hablan a la misma `api/`**, y `api/` a la **misma base de datos**. Cuando Jorge publica un endpoint, los tres clientes lo consumen. Los tipos de `shared/types` son el contrato: si Jorge cambia un estado de la cita, el compilador de TypeScript rompe en las tres apps y nadie se entera tarde.

---

## 3. Mapeo entrega × integrante → qué cae en el repo → Milestone

> Milestones de GitHub: `E01` … `E12` (uno por entrega). Cada Issue se asigna a su Milestone; el % lo calcula GitHub.

### E01 — Arranque y planeación · Milestone `E01`

| Integrante | Tarea (checklist) | Dónde cae en el repo |
|-----------|-------------------|----------------------|
| Marco (LP) | Acta, Product Backlog, DoD, tablero, ceremonias | `docs/entregas/E01/` + GitHub Projects + Milestones |
| Mario (AN) | Guion de entrevista, proceso actual por correo y su costo, glosario | `docs/entregas/E01/Mario-Levantamiento-Inicial.md` |
| Jorge (BD) | ADR-001, monorepo, Supabase, Vercel, Expo, Google Cloud, `main` protegida | Raíz del repo + `docs/adr/ADR-001-stack.md` + `.github/` |
| Anuar (IN) | Spike de ubicación en segundo plano y consumo de batería | `app-inspector/` (spike) + `docs/entregas/E01/Anuar-Spike-GPS.md` |
| Jesús (CL) | Spike de notificaciones push con acciones y permiso denegado | `app-cliente/` (spike) + `docs/entregas/E01/Jesus-Spike-Push.md` |

### E02 — Análisis · Milestone `E02`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | Sprint Planning 1, reunión con el cliente, minuta, estimación, riesgos v2 | `docs/entregas/E02/` |
| Mario | SRS secciones 1–3, RF de los módulos 1–5 | `docs/` (SRS) |
| Jorge | Modelo conceptual, MER v1, máquina de estados de la cita, idempotencia | `docs/` (MER) + nota en `api/prisma/` |
| Anuar | Casos de uso del inspector (con Mario), bocetos de ruta y captura | `docs/` |
| Jesús | Casos de uso del cliente (con Mario), bocetos de notificación y mapa | `docs/` |

### E03 — Requerimientos cerrados + diseño de interfaz · Milestone `E03`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | SRS validado con Agave Roofing, acta de congelación, mockups del panel | `docs/entregas/E03/` |
| Mario | SRS completo (RF 6–10, RNF, reglas de negocio, trazabilidad) | `docs/` (SRS v1.0) |
| Jorge | Diccionario de datos, Prisma borrador, diseño del motor de notificaciones | `docs/` + `api/prisma/schema.prisma` |
| Anuar | Mockups de la app del inspector | `docs/entregas/E03/` |
| Jesús | Mockups de la app del cliente | `docs/entregas/E03/` |

### E04 — Diseño técnico + infraestructura · Milestone `E04`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | Plan de pruebas; esqueleto del panel con layout y rutas | `docs/` + `panel/src/` |
| Mario | UML: casos de uso, clases y actividades | `docs/` (UML) |
| Jorge | Migración Prisma en Supabase, esqueleto de la API, CI, primer despliegue | `api/` + `.github/workflows/ci.yml` |
| Anuar | Esqueleto Expo + navegación + SQLite local | `app-inspector/` + `shared/api-client/` |
| Jesús | Esqueleto Expo + navegación; diagramas de secuencia | `app-cliente/` + `docs/` |

### E05 — Autenticación y roles · Milestone `E05`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | Login del panel y guardas de ruta del rol Administrador | `panel/src/pages/Login.tsx`, `panel/src/routes/` |
| Mario | Manual capítulos 1–2 | `docs/manual/` |
| Jorge | Middleware JWT, autorización por rol, tabla `usuario`, RLS inicial | `api/src/middleware/auth.ts` |
| Anuar | Login del inspector (correo y contraseña) + almacenamiento seguro | `app-inspector/src/screens/Login.tsx` |
| Jesús | Login del cliente por teléfono con OTP y reenvío del código | `app-cliente/src/screens/LoginOtp.tsx` |

### E06 — Clientes, domicilios, inspectores y zonas · Milestone `E06`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | Pantallas de catálogos con mapa para mover el pin | `panel/src/pages/Clientes.tsx`, `Domicilios.tsx`, `Zonas.tsx` |
| Mario | Manual capítulo 3 + casos de prueba de módulos 1–2 | `docs/manual/`, `docs/pruebas/` |
| Jorge | Endpoints de catálogos, geocodificación, baja lógica | `api/src/routes/clientes.ts`, `zonas.ts` |
| Anuar | Perfil del inspector, zonas asignadas, registro de dispositivo | `app-inspector/src/screens/Perfil.tsx` |
| Jesús | Perfil del cliente, domicilios, canal preferido, permiso de notificaciones | `app-cliente/src/screens/Perfil.tsx` |

### E07 — Agenda de inspecciones y asignación · Milestone `E07`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | Calendario, programar, reasignar, cancelar; demo intermedia | `panel/src/pages/Agenda.tsx` |
| Mario | Manual capítulo 4 + casos de prueba de la agenda | `docs/manual/`, `docs/pruebas/` |
| Jorge | API de inspección: folio, traslape, asignación, máquina de estados, historial | `api/src/services/agenda.ts`, `estados.ts` |
| Anuar | Ruta del día y detalle de la parada | `app-inspector/src/screens/RutaDelDia.tsx` |
| Jesús | Mis citas e historial, detalle de la cita | `app-cliente/src/screens/MisCitas.tsx` |

### E08 — Motor de notificaciones push · Milestone `E08`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | Vista de estado de las notificaciones, bitácora de entregabilidad (R4) | `panel/src/pages/Notificaciones.tsx` |
| Mario | Manual capítulo 5 borrador + casos de prueba de notificaciones | `docs/manual/`, `docs/pruebas/` |
| Jorge | Tablas y despachador, temporizadores, reintentos, respaldo SMS | `api/src/services/notificaciones.ts`, `api/src/cron/` |
| Anuar | Notificaciones al inspector (asignación, reprogramación, "cliente en casa") | `app-inspector/src/services/notificaciones.ts` |
| Jesús | Recepción del aviso del día y del recordatorio, con acciones en la notificación | `app-cliente/src/services/notificaciones.ts` |

### E09 — Confirmación y reprogramación · Milestone `E09`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | Bandeja de reprogramaciones, alerta de `SIN_CONFIRMAR` | `panel/src/pages/Reprogramaciones.tsx` |
| Mario | Manual capítulo 5 final + casos de prueba (incluido el límite de 3) | `docs/manual/`, `docs/pruebas/` |
| Jorge | Endpoints de confirmación, horarios disponibles, resolución; temporizador | `api/src/routes/inspecciones.ts` |
| Anuar | Estado de confirmación en cada parada; aviso de cita movida | `app-inspector/src/screens/RutaDelDia.tsx` |
| Jesús | Confirmar (notificación y app) y solicitar nuevo horario | `app-cliente/src/screens/Reprogramar.tsx` |

### E10 — Trayecto y seguimiento en vivo · Milestone `E10`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | Monitor en vivo del panel; capacitación a inspectores piloto | `panel/src/pages/Monitor.tsx` |
| Mario | Manual capítulo 6 + pruebas de campo del ETA | `docs/manual/`, `docs/pruebas/` |
| Jorge | `iniciar_trayecto`, recepción de puntos, Realtime, ETA, cierre automático | `api/src/services/trayecto.ts`, `eta.ts` |
| Anuar | "Voy en camino", GPS en segundo plano, pantalla de navegación | `app-inspector/src/services/ubicacion.ts` |
| Jesús | Mapa de seguimiento con ETA y último punto conocido | `app-cliente/src/screens/Seguimiento.tsx` |

### E11 — Llegada, resultado, tablero y modo sin señal · Milestone `E11`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | Tablero de indicadores; feature freeze | `panel/src/pages/Tablero.tsx` |
| Mario | Manuales terminados, matriz de pruebas, guion de la prueba de campo | `docs/manual/`, `docs/pruebas/` |
| Jorge | Llegada, resultado, evidencia, ausente, `/sincronizar`, PDF, vistas, purga | `api/src/routes/ejecucion.ts`, `sincronizar.ts` |
| Anuar | Llegada, captura con fotos, ausente, cola SQLite, mensajería | `app-inspector/src/services/cola.ts` |
| Jesús | "Estoy en casa", reporte de inspección, mensaje y llamada; ejecución de pruebas | `app-cliente/src/screens/Reporte.tsx` + `docs/pruebas/resultados/` |

### E12 — Pruebas integrales, implantación y entrega final · Milestone `E12`

| Integrante | Tarea | Dónde cae |
|-----------|-------|-----------|
| Marco | Aceptación con el cliente, acta, presentación final | `docs/entregas/E12/` |
| Mario | Reporte de pruebas, documentación consolidada, manual de instalación | `docs/` |
| Jorge | Despliegue productivo, respaldos, builds EAS de producción, monitoreo | `api/`, `panel/`, configuración EAS |
| Anuar | Prueba de campo completa (con tramo sin señal) e instalación | `docs/entregas/E12/Anuar-Prueba-Campo.md` |
| Jesús | Pruebas integrales del recorrido del cliente, matriz de resultados | `docs/entregas/E12/Jesus-Matriz-Resultados.md` |

---

## 4. Cadena crítica (quién bloquea a quién)

Casi todo depende de **Jorge (API + BD)**. El orden real de integración:

```
Jorge E04 (BD migrada + esqueleto API)
   ├─► Marco E04 (layout panel)     ─► E05 login ─► E06 catálogos ─► E07 agenda ─► E09 bandeja ─► E10 monitor ─► E11 tablero
   ├─► Anuar E04 (esqueleto + SQLite) ─► E05 login ─► E06 dispositivo ─► E07 ruta ─► E10 trayecto ─► E11 resultado + sin señal
   └─► Jesús E04 (esqueleto)        ─► E05 login OTP ─► E06 dispositivo ─► E07 mis citas ─► E08 avisos ─► E09 confirmar ─► E10 mapa ─► E11 reporte

Jorge E08 (motor de notificaciones) ─► Jesús E08 (recepción) ─► Jesús E09 (confirmar)
Jorge E10 (Realtime + ETA) + Anuar E10 (publicación GPS) ─► Jesús E10 (mapa)
Jorge E11 (/sincronizar) ─► Anuar E11 (cola sin señal)
Mario E03 (SRS) ─► Jorge E03 (MER) ─► Mario E04 (clases)
Anuar E12 (prueba de campo) + Jesús E12 (pruebas integrales) ─► Mario E12 (reporte de pruebas)
```

**La dependencia cruzada más delicada del proyecto:** el mapa de Jesús (E10) no funciona si Anuar no está publicando puntos (E10) y si Jorge no tiene el canal Realtime abierto (E10). Las tres tareas caen en la **misma entrega**, así que esa semana los tres trabajan contra un **punto de prueba simulado** que Jorge publica desde el primer día del sprint, y la integración real se prueba el miércoles.

Regla práctica: **nadie empieza una pantalla sin el endpoint que consume**. Si el endpoint no está, se trabaja contra datos de prueba (mock) definidos en `shared/types` y se conecta después.

---

## 5. La prueba que demuestra que todo está integrado

No basta con que cada servicio funcione por separado. El equipo considera el sistema integrado cuando este recorrido se completa **sin tocar la base de datos a mano**:

| Paso | Quién lo hace | Dónde se ve | Entrega en que queda listo |
|------|---------------|-------------|---------------------------|
| 1. Se programa una inspección para mañana | Administrador (panel) | `panel/` → agenda | E07 |
| 2. Llega la notificación al teléfono del cliente | Sistema (temporizador) | `app-cliente/` → notificación | E08 |
| 3. El cliente confirma desde la notificación | Cliente | Cita en `CONFIRMADA` | E09 |
| 4. Aparece en la ruta del día del inspector | Inspector | `app-inspector/` → ruta | E07 |
| 5. El inspector pulsa "Voy en camino" | Inspector | Cita en `EN_CAMINO` + push | E10 |
| 6. El cliente ve el mapa y el ETA que baja | Cliente | `app-cliente/` → mapa | E10 |
| 7. El cliente confirma "estoy en mi casa" | Cliente | Aviso en la app del inspector | E11 |
| 8. El inspector registra llegada y resultado **sin señal** | Inspector | Cola SQLite | E11 |
| 9. Al recuperar señal, se sincroniza sin duplicar | Sistema | Cita en `COMPLETADA` | E11 |
| 10. El cliente recibe y abre su reporte | Cliente | `app-cliente/` → reporte | E11 |
| 11. El tablero muestra la cita confirmada y la puntualidad | Administrador | `panel/` → tablero | E11 |

Ese recorrido completo es exactamente el guion de la **prueba de campo de E12**.

---

## 6. E01 — mapeo detallado (lo que se entrega ahora)

| # | Tarea del checklist | Integrante | Archivo / ubicación en el repo | Estado |
|---|---------------------|-----------|--------------------------------|--------|
| 1 | Acta de constitución del equipo | Marco | `docs/entregas/E01/Marco-Acta-Constitucion.md` | ⏳ |
| 2 | Product Backlog inicial | Marco | `docs/entregas/E01/Marco-Product-Backlog.md` | ⏳ |
| 3 | Tablero en GitHub Projects | Marco | GitHub Projects + Milestones `E01…E12` | ⏳ crear en GitHub |
| 4 | Definición de Terminado (DoD) | Marco | `docs/entregas/E01/Marco-DoD-Tablero-Ceremonias.md` §1 | ⏳ |
| 5 | Agendar ceremonias Scrum | Marco | `docs/entregas/E01/Marco-DoD-Tablero-Ceremonias.md` §3 | ⏳ |
| 6 | Guion de entrevista con operaciones | Mario | `docs/entregas/E01/Mario-Levantamiento-Inicial.md` §2 | ⏳ |
| 7 | Proceso actual por correo y su costo | Mario | `docs/entregas/E01/Mario-Levantamiento-Inicial.md` §3 | ⏳ |
| 8 | Glosario del negocio | Mario | `docs/entregas/E01/Mario-Levantamiento-Inicial.md` §4 | ⏳ |
| 9 | ADR-001 (decisión de stack) | Jorge | `docs/adr/ADR-001-stack.md` | ⏳ |
| 10 | Monorepo con las cuatro carpetas | Jorge | Raíz del repo `agave-alerta` | ⏳ |
| 11 | Proyecto en Supabase | Jorge | `docs/entregas/E01/Jorge-Infraestructura.md` §2 + `*/.env.example` | ⏳ crear cuenta |
| 12 | Proyecto en Vercel | Jorge | `docs/entregas/E01/Jorge-Infraestructura.md` §3 | ⏳ crear cuenta |
| 13 | Cuenta Expo (EAS) | Jorge | `docs/entregas/E01/Jorge-Infraestructura.md` §4 | ⏳ crear cuenta |
| 14 | Google Cloud con Maps + Directions | Jorge | `docs/entregas/E01/Jorge-Infraestructura.md` §5 | ⏳ crear cuenta |
| 15 | `main` protegida + convención de ramas | Jorge | `.github/` | ⏳ al subir a GitHub |
| 16 | Spike: ubicación en segundo plano | Anuar | `app-inspector/` (spike) | ⏳ |
| 17 | Medición de batería en 30 min | Anuar | `docs/entregas/E01/Anuar-Spike-GPS.md` §3 | ⏳ |
| 18 | Spike: push con botones de acción | Jesús | `app-cliente/` (spike) | ⏳ |
| 19 | Prueba con permiso de notificaciones denegado | Jesús | `docs/entregas/E01/Jesus-Spike-Push.md` §3 | ⏳ |

Leyenda: ✅ hecho en el repo · ⏳ pendiente (crear cuentas, escribir el documento o subir el código).

> El repositorio `agave-alerta` aún no existe: crearlo es la tarea 10 de esta misma entrega. La documentación de Obsidian (`Documentacion/` y `Checklists/`) es lo que ya está listo y sirve de insumo para todo lo demás.

---

## 7. Dónde ver el avance unificado (en VS Code y GitHub)

| Herramienta | Qué muestra |
|-------------|-------------|
| `pnpm install && pnpm dev` en la raíz | Levanta API + panel; las apps se abren con `npx expo start` |
| **Expo Go / build EAS** en un teléfono | Las dos apps móviles al día de hoy, en dispositivo real |
| **GitHub Projects** (tablero) | Todas las tarjetas de los 5; filtrar por `Milestone: E0X` |
| **Milestones** `E01…E12` | Barra de % automática (issues cerrados / totales) |
| **GitHub Actions** (CI) | Check verde = todo integra sin romperse |
| **Tags / Releases** `entrega-0X` | Foto del sistema en cada jueves + notas de qué entró |
| **VS Code + extensión "GitHub Pull Requests and Issues"** | Tablero, issues, PRs y milestones dentro del editor |
| **VS Code + GitLens** | Historial, autoría, tags de entrega |
| `docs/entregas/E0X/README.md` | Estado de las tareas de esa entrega marcado |

**Fórmula de "% de avance del sistema"** para reportar:
`issues cerrados del Milestone actual ÷ issues totales del Milestone` — o, si no se usan issues, `tareas [x] del checklist ÷ tareas totales` por entrega.

---

**Documentos relacionados:** [[01_Plan_de_Proyecto]] · [[02_SRS_Requerimientos]] · [[03_Diseno_Base_de_Datos]] · [[04_Diagramas_UML]] · [[05_Calendario_Entregas]] · [[README - Checklists del equipo]]
