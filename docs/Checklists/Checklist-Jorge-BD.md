---
integrante: Jorge Alberto Barbosa García
matricula: "2071973"
clave: BD
rol: Arquitecto / Backend + Base de datos + DevOps
aliases: [Checklist Jorge, Checklist BD]
tags: [agavealerta, checklist, rol/backend]
---

# ✅ Checklist — Jorge (BD) · Backend, base de datos y despliegue

> [!info] Cómo leer esta lista
> Cada `- [ ]` es una tarea. La flecha **→** explica qué hacer y cuándo se considera terminada. ⛔ **Requiere** = bloqueo duro. 🔸 **Mejor después de** = puedes avanzar pero se completa con eso. El 📦 es lo que se entrega ese jueves. Ver [[README - Checklists del equipo]].
>
> **Tu rol:** eres el **cerebro del sistema**. Construyes la API que usan los tres clientes, la base de datos central, la **máquina de estados de la cita**, el **motor de notificaciones** y el **canal de seguimiento en vivo**. Casi todo el equipo depende de ti: cada endpoint que liberas desbloquea una pantalla de alguien más. Tu referencia es [[03_Diseno_Base_de_Datos]] completo.
>
> **Regla de oro:** libera cada endpoint **el lunes o martes** del sprint, no el jueves. Si un endpoint llega tarde, tres personas se quedan paradas.

---

## E01 — Arranque y planeación
`#agave/E01` · jue 03 sep · Sprint 0

- [ ] **ADR-001 — Decisión de stack**
  → Documento corto que justifica: React Native + Expo para las dos apps, React + Vite para el panel, Node + Express + Prisma para la API, PostgreSQL en Supabase, Expo Push sobre FCM/APNs, Supabase Realtime para el seguimiento y Google Directions para el ETA. Incluir las alternativas descartadas y por qué.
- [ ] **Crear el monorepo `agave-alerta`**
  → Carpetas `api/`, `panel/`, `app-inspector/`, `app-cliente/`, `shared/`, `docs/`. Workspace de pnpm, `tsconfig.base.json`, ESLint y Prettier. Terminado cuando `pnpm install` corre sin errores.
- [ ] **Proyecto en Supabase**
  → Crear el proyecto, guardar la cadena de conexión y las llaves en `.env.example` (sin valores reales). Anotar las credenciales en el gestor que use el equipo.
- [ ] **Proyecto en Vercel**
  → Conectar el repositorio; dejar listos los proyectos para `panel/` y `api/`.
- [ ] **Cuenta de Expo (EAS)**
  → Cuenta de organización del equipo para compilar y distribuir las dos apps.
- [ ] **Google Cloud con Maps SDK y Directions API**
  → Habilitar las APIs, generar la llave restringida y verificar el crédito gratuito disponible. Anotar el costo por cada 1000 peticiones (riesgo R6).
- [ ] **Rama `main` protegida y convención de ramas**
  → `main` solo por Pull Request con una aprobación. Ramas `feat/`, `fix/`, `docs/`. Documentarlo en el README del repo.
- [ ] 📦 **Entregable:** ADR-001 + monorepo + cuentas de Supabase, Vercel, Expo y Google Cloud.

## E02 — Análisis
`#agave/E02` · jue 10 sep · Sprint 1

- [ ] **Modelo conceptual**
  → Identificar las entidades y sus relaciones: la inspección en el centro, el cliente y su domicilio, el inspector y su zona, la notificación, el trayecto y el resultado.
- [ ] **MER versión 1**
  → Diagrama entidad-relación con las ~20 tablas y sus llaves. Terminado cuando puedes explicarle a Mario de dónde sale cada dato del SRS.
- [ ] **Máquina de estados de la cita**
  → Definir los 11 estados y **qué transiciones son válidas**. Es la decisión de diseño más importante del proyecto: de ahí salen los indicadores y las validaciones.
- [ ] **Estrategia de idempotencia para el modo sin señal**
  → Definir cómo se evita duplicar una operación que se sincroniza dos veces: `id_local` (UUID generado en el teléfono) con restricción `UNIQUE`. Escribirlo como nota en `api/prisma/`.
- [ ] 📦 **Entregable:** MER v1 + máquina de estados + nota de idempotencia.

## E03 — Requerimientos cerrados + diseño de interfaz + diseño de base de datos
`#agave/E03` · jue 17 sep · Sprint 1 (cierre)

> [!warning] Se entrega **mañana jueves 17 de septiembre**
> El **diseño de la base de datos** va en esta entrega: ERD, diccionario de datos y borrador de `schema.prisma`. Documentos: [[03_Diseno_Base_de_Datos]] (normativo) y [[03b_Modelo_Datos_Resumen_E03]] (vista resumida de 5 entidades para exponer). Súbelo a la carpeta de documentación antes de que Marco consolide.

- [x] **ERD y vista resumida del modelo de datos**
  → Diagrama entidad-relación de las cinco entidades centrales (usuarios, perfiles de cliente, citas, notificaciones y ubicaciones en tiempo real) con el flujo de datos de punta a punta. Ya está en [[03b_Modelo_Datos_Resumen_E03]]; terminado cuando lo puedes exponer en 5 minutos y la tabla de equivalencia contra el modelo completo (§5) cuadra con lo que vas a migrar en E04.
- [x] **Diccionario de datos**
  → Cada tabla con sus columnas: tipo, nulidad, restricción y descripción en español. Es lo que Mario necesita para el diagrama de clases.
- [x] **Normalización documentada**
  → Justificar que el modelo está en 3FN y **documentar las desnormalizaciones deliberadas** (`veces_reprogramada`, `confirmado_en`, `distancia_m`, `destinatario`) con su razón.
- [x] **Borrador del `schema.prisma`**
  → Los modelos principales escritos, aunque todavía no se migren. Con los enums `EstadoInspeccion` y `TipoNotificacion`.
- [x] **Diseño del motor de notificaciones**
  → Decidir en papel: tabla `notificacion` con estados, tabla `plantilla_notificacion`, despachador que corre cada minuto, política de reintentos y cuándo se cae al respaldo por SMS. Terminado cuando puedes dibujarlo en el pizarrón.
- [x] **Índices y decisión de retención**
  → Definir los índices de las consultas calientes y el índice único parcial del trayecto activo. Decidir la retención de `punto_ubicacion` (30 días) y dejarlo escrito.
- [x] 📦 **Entregable:** **Diseño de la base de datos** ([[03_Diseno_Base_de_Datos]] + [[03b_Modelo_Datos_Resumen_E03]]) + diccionario de datos + Prisma borrador + diseño del motor de notificaciones.

## E04 — Diseño técnico + infraestructura
`#agave/E04` · jue 24 sep · Sprint 2

> [!info] Esta es **la entrega que desbloquea a todo el equipo**. Si la BD y el esqueleto de la API no están el martes, Marco, Anuar y Jesús no pueden avanzar en E04.

- [ ] **Migrar el esquema a Supabase**
  → `prisma migrate` contra el proyecto de Supabase. Terminado cuando las tablas existen y `prisma studio` las muestra.
- [ ] **Datos semilla**
  → Insertar los 3 roles, los 13 parámetros de `configuracion` y las 10 plantillas de notificación. Más un juego de datos ficticios: 2 zonas, 2 inspectores, 5 clientes con domicilio y 10 citas repartidas en la semana. **Todo el equipo prueba contra estos datos.**
- [ ] **Esqueleto de la API**
  → Express + TypeScript con las rutas declaradas (aunque devuelvan datos falsos), manejo de errores centralizado y `GET /salud`. Terminado cuando responde desplegado, no solo en local.
- [ ] **`shared/types` y `shared/api-client`**
  → Los tipos del dominio (estados, tipos de notificación, DTOs) y el cliente HTTP con el JWT adjunto. Es el contrato con las tres aplicaciones: acordarlo con Marco, Anuar y Jesús **antes** de escribirlo.
- [ ] **Integración continua**
  → GitHub Actions: lint + build + pruebas en cada Pull Request. Terminado cuando un PR con un error de tipos se pone en rojo.
- [ ] **Primer despliegue**
  → API y panel en Vercel, apuntando a Supabase. Terminado cuando Jesús puede llamar `GET /salud` desde su teléfono.
- [ ] 📦 **Entregable:** BD migrada con semilla + API desplegada + tipos compartidos + CI en verde.

## E05 — Autenticación y roles
`#agave/E05` · jue 01 oct · Sprint 2 (cierre)

- [ ] **Middleware de verificación de JWT**
  → Valida el token de Supabase Auth en cada petición y resuelve el `usuario` a partir del `auth_uid`. Devuelve 401 claro si el token falta o venció.
- [ ] **Autorización por rol**
  → Función `exigirRol('ADMINISTRADOR')` y equivalentes. Un cliente **no** puede llamar endpoints del panel; un inspector solo ve sus citas asignadas.
- [ ] **Alta de los tres tipos de usuario**
  → Administrador e inspector con correo y contraseña; cliente con teléfono y código OTP. Terminado cuando los tres tipos entran y reciben un token válido.
- [ ] **Políticas RLS iniciales**
  → Activar Row Level Security en `inspeccion` y `punto_ubicacion` con las políticas de [[03_Diseno_Base_de_Datos]] §10. Probar que con la llave pública un cliente no puede leer las citas de otro.
- [ ] **Bitácora**
  → Registrar en `bitacora` los inicios de sesión y las operaciones sensibles (cancelar cita, aprobar reprogramación).
- [ ] 📦 **Entregable:** Módulo de seguridad de la API (JWT + roles + RLS + bitácora).

## E06 — Clientes, domicilios, inspectores y zonas
`#agave/E06` · jue 08 oct · Sprint 3

- [ ] **Endpoints de clientes**
  → Listar con búsqueda y paginación, ver, crear, editar y **baja lógica** (nunca borrado físico, RN-15).
- [ ] **Endpoints de domicilios + geocodificación**
  → Al crear o editar un domicilio, llamar al servicio de geocodificación de Google para obtener latitud y longitud, y marcar `geocodificado`. Si falla, guardar sin coordenadas para que el administrador ponga el pin a mano.
- [ ] **Endpoints de zonas e inspectores**
  → Altas, edición, baja lógica y la relación N:M `inspector_zona`.
- [ ] **Endpoint de registro de dispositivo**
  → `POST /dispositivos` recibe el token push, la plataforma y la versión de la app. Si el token ya existe, actualiza `ultimo_uso`. Lo usan las dos apps.
- [ ] 📦 **Entregable:** Endpoints de catálogos + geocodificación + registro de dispositivos.

## E07 — Agenda de inspecciones y asignación
`#agave/E07` · jue 15 oct · Sprint 3 (cierre)

- [x] **Generación de folio**
  → Folio consecutivo por año con formato `INS-2026-000124`, único y **estable al reprogramar**.
- [x] **Crear inspección con validación de traslape**
  → `POST /inspecciones` valida que el inspector no tenga otra cita con ventana traslapada ese día (RN-02) y que la ventana caiga en el horario de operación. Devuelve error claro si no.
- [x] **Máquina de estados implementada**
  → Servicio `transicionar(cita, nuevoEstado, actor, origen)` que **rechaza cualquier transición inválida** y escribe siempre en `inspeccion_historial`. Ningún otro código debe cambiar `estado` directamente.
- [x] **Endpoints de agenda**
  → Listar por día / inspector / zona / estado; detalle con su línea de tiempo; reasignar; mover; cancelar con motivo.
- [x] **Endpoint de la ruta del día del inspector**
  → `GET /inspecciones/mi-ruta?fecha=` devuelve las citas del inspector autenticado, **ordenadas por ventana**, con cliente, dirección, coordenadas y estado. Lo consume Anuar.
- [x] **Endpoint de mis citas del cliente**
  → `GET /inspecciones/mias` con la próxima cita y el historial. Lo consume Jesús.
- [x] 📦 **Entregable:** API de agenda + máquina de estados + endpoints de ruta y mis citas.

## E08 — Motor de notificaciones push
`#agave/E08` · jue 22 oct · Sprint 4

> [!info] Esta semana construyes **la razón de ser del proyecto**. El riesgo R4 dice que la push puede no llegar: por eso todo envío se registra, se reintenta y tiene respaldo.

- [ ] **Tablas y plantillas operando**
  → `dispositivo`, `plantilla_notificacion` y `notificacion` con datos reales. Función que renderiza una plantilla sustituyendo `{{cliente}}`, `{{fecha}}`, `{{ventana}}`, `{{eta}}`, `{{inspector}}`.
- [ ] **Despachador de notificaciones**
  → Tarea que corre cada minuto: toma las `PENDIENTE` cuya `programada_para` ya pasó, las envía por Expo Push y actualiza su estado con el acuse. Con **reintentos** (3 intentos con espera creciente).
- [ ] **Temporizador del aviso del día programado**
  → Corre cada hora: busca citas `PROGRAMADA` cuya fecha esté a 24 h, encola la notificación y pasa la cita a `NOTIFICADA`. Respeta el índice único que impide enviar dos veces el mismo tipo (RN-13).
- [ ] **Temporizador del recordatorio previo**
  → 3 horas antes de la ventana, encola el recordatorio.
- [ ] **Horario de silencio**
  → Las notificaciones no urgentes no salen entre 21:00 y 07:00: se reprograman al siguiente horario hábil. Las urgentes (va en camino, está por llegar) **sí** salen siempre (RN-14).
- [ ] **Respaldo por SMS (Twilio)**
  → Si la push falla o el cliente no tiene dispositivo activo, enviar SMS con un enlace corto de confirmación. Registrarlo como una notificación más, con canal `SMS`.
- [ ] **Endpoint de reenvío manual**
  → Para el botón de Marco en el panel. Marca `reenvio_manual = true` para que no choque con el índice único.
- [ ] 📦 **Entregable:** Motor de notificaciones completo (envío, reintentos, temporizadores, silencio y respaldo).

## E09 — Confirmación y reprogramación
`#agave/E09` · jue 29 oct · Sprint 4 (cierre)

- [ ] **Endpoint de confirmación**
  → `POST /inspecciones/:id/confirmar` escribe `confirmado_en`, pasa la cita a `CONFIRMADA` y lo registra en el historial. **No se puede deshacer** (RN-04).
- [ ] **Endpoint de horarios disponibles**
  → `GET /inspecciones/:id/horarios-disponibles` devuelve los huecos reales de los próximos días en la zona del domicilio, considerando la agenda de los inspectores y el horario de operación.
- [ ] **Solicitud de reprogramación**
  → `POST /inspecciones/:id/reprogramacion` valida el límite de 3 (RN-06) y que la cita no esté `EN_CAMINO` o posterior (RN-05). Crea el registro y pasa la cita a `REPROG_SOLICITADA`.
- [ ] **Aprobar / rechazar reprogramación**
  → Al aprobar: valida traslape del nuevo horario, mueve la cita **conservando el folio**, incrementa `veces_reprogramada`, deja el historial y **encola la notificación del cambio**. Al rechazar: vuelve al estado anterior con el motivo.
- [ ] **Temporizador de citas sin confirmar**
  → Cada hora: las citas `NOTIFICADA` sin respuesta al cumplirse el plazo configurado pasan a `SIN_CONFIRMAR` y generan alerta para el panel. **No se cancelan solas** (RN-07).
- [ ] 📦 **Entregable:** API de confirmación y reprogramación + temporizador de sin confirmar.

## E10 — Trayecto y seguimiento en vivo
`#agave/E10` · jue 05 nov · Sprint 5

> [!warning] Semana de integración cruzada
> Tu canal en vivo, el GPS de Anuar y el mapa de Jesús caen en esta misma entrega. **Publica el lunes un punto simulado** en el canal (un script que mueva una coordenada cada 15 s) para que Jesús pueda construir el mapa sin esperar a que Anuar termine.

- [ ] **Punto simulado para desbloquear al equipo**
  → Script que publica coordenadas falsas en el canal `inspeccion:{id}` cada 15 segundos. Terminado el **lunes** del sprint, no el jueves.
- [ ] **Función `iniciar_trayecto` transaccional**
  → Una sola transacción: valida la transición, pasa la cita a `EN_CAMINO`, escribe el historial, abre el trayecto y encola la notificación "va en camino". El índice único parcial impide dos trayectos activos (RN-03).
- [ ] **Recepción de puntos de ubicación**
  → `POST /trayectos/:id/punto` guarda el punto y lo **publica en Supabase Realtime** en el canal de esa inspección. Rechaza puntos si el trayecto no está `ACTIVO` (RN-08).
- [ ] **Cálculo de ETA**
  → Llamar a Google Directions desde el último punto conocido hasta el domicilio, **a intervalos** (cada 60 s, no en cada punto, por el riesgo R6). Si el servicio falla, estimar con distancia en línea recta y velocidad promedio, marcando `eta_aproximado` (RN-09).
- [ ] **Aviso "está por llegar"**
  → Cuando la distancia al domicilio baja de 1000 m, encolar la notificación urgente. Solo una vez por cita.
- [ ] **Cierre de trayecto y apagado automático**
  → `cerrar_trayecto` calcula distancia y duración antes de que se purguen los puntos. Tarea cada 10 minutos que cancela los trayectos activos con más de 90 minutos (riesgo R5).
- [ ] 📦 **Entregable:** API de trayecto + ETA + canal Realtime + apagado automático.

## E11 — Llegada, resultado, tablero y modo sin señal
`#agave/E11` · jue 12 nov · Sprint 5 (cierre)

- [ ] **Endpoints de llegada y presencia**
  → `POST /inspecciones/:id/llegada` (inspector, pasa a `EN_SITIO` y cierra el trayecto) y `POST /inspecciones/:id/presencia` (cliente, "ya estoy en mi casa", visible para el inspector).
- [ ] **Endpoint de resultado de la inspección**
  → Recibe estado del techo, hallazgos, si requiere reparación, urgencia y recomendaciones. Exige **al menos una fotografía** (RN-11) y pasa la cita a `COMPLETADA`.
- [ ] **Endpoint de evidencia**
  → Subida de fotos a Supabase Storage y registro en `evidencia` con su `id_local`.
- [ ] **Endpoint de cliente ausente**
  → Exige foto y nota (RN-10), pasa la cita a `CLIENTE_AUSENTE`, cierra el trayecto y permite crear la cita de reintento ligada por `id_inspeccion_origen`.
- [ ] **`POST /sincronizar` con idempotencia**
  → Recibe el lote de operaciones encoladas en el teléfono de Anuar. Para cada una, busca su `id_local`: si ya existe, devuelve el registro sin duplicar (RN-12); si no, la aplica **conservando la hora real** del dispositivo.
  ⛔ **Coordina con:** Anuar · formato del lote (IN E11).
- [ ] **Generación del reporte PDF**
  → Al completar una inspección, generar el PDF con hallazgos y fotos, guardarlo en Storage y encolar la notificación "ya está disponible su reporte".
- [ ] **Vistas de indicadores**
  → Crear `v_indicadores_semana`, `v_puntualidad_inspector` y `v_efectividad_notificacion`, más el endpoint `GET /indicadores` que consume Marco.
- [ ] **Purga de puntos GPS**
  → Tarea diaria que borra los puntos con más de 30 días, conservando el resumen del trayecto (RN-17, riesgo R7).
- [ ] 📦 **Entregable:** API de ejecución + sincronización idempotente + PDF + indicadores + purga.

## E12 — Pruebas integrales, implantación y entrega final
`#agave/E12` · jue 19 nov · Sprint 6

- [ ] **Despliegue productivo**
  → API y panel en su ambiente definitivo, con las variables de entorno de producción y las llaves restringidas por dominio.
- [ ] **Builds de producción con EAS**
  → Compilar las dos apps y generar los APK / enlaces de instalación. Entregárselos a Anuar y Jesús para instalar en los teléfonos piloto.
- [ ] **Respaldo de la base**
  → `pg_dump` de la base de producción guardado en la carpeta de entregas, más la verificación de que el respaldo automático de Supabase está activo.
- [ ] **Monitoreo y bitácora**
  → Revisar los registros de la API durante la prueba de campo: ningún error 500 sin explicación. Documentar los errores que sí aparecieron y qué se hizo.
- [ ] **Documento de arquitectura final**
  → Actualizar el ADR y el diagrama de despliegue con lo que realmente quedó (si algo cambió respecto al diseño, decir por qué).
- [ ] 📦 **Entregable:** Ambiente productivo + builds EAS + respaldos + documento de arquitectura final.

---

## 📊 Lo que desbloqueas cada semana

| Tu entrega | Desbloquea a |
|------------|--------------|
| E04 BD migrada + API + tipos | **Los tres**: Marco, Anuar y Jesús no pueden empezar sin esto |
| E05 Auth y roles | Los tres logins (E05) |
| E06 Endpoints de catálogos | Catálogos de Marco (E06) y registro de dispositivo de Anuar y Jesús |
| E07 API de agenda | Agenda de Marco, ruta de Anuar, mis citas de Jesús (E07) |
| E08 Motor de notificaciones | Recepción de avisos de Jesús (E08) |
| E09 Confirmación y horarios | Confirmar y reprogramar de Jesús (E09), bandeja de Marco |
| E10 Realtime + ETA | Mapa de Jesús y monitor de Marco (E10) |
| E11 `/sincronizar` e indicadores | Modo sin señal de Anuar y tablero de Marco (E11) |

**Documentos de referencia:** [[03_Diseno_Base_de_Datos]] · [[02_SRS_Requerimientos]] · [[04_Diagramas_UML]] · [[05_Calendario_Entregas]] · [[Integracion]]
