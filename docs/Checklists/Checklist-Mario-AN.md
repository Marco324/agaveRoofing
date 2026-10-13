---
integrante: Mario Martínez González
matricula: "2056182"
clave: AN
rol: Analista / Documentación / QA
aliases: [Checklist Mario, Checklist AN]
tags: [agavealerta, checklist, rol/analista]
---

# ✅ Checklist — Mario (AN) · Análisis, documentación y calidad

> [!info] Cómo leer esta lista
> Cada `- [ ]` es una tarea. La flecha **→** explica qué hacer y cuándo se considera terminada. ⛔ **Requiere** = bloqueo duro (no empieces sin eso). 🔸 **Mejor después de** = puedes avanzar pero se completa con eso. El 📦 es lo que se entrega ese jueves. Ver [[README - Checklists del equipo]].
>
> **Tu rol:** eres la memoria escrita del proyecto. Redactas el **SRS**, los **casos de uso**, los **diagramas UML**, el **manual de usuario** de los tres servicios y los **casos de prueba** que Jesús ejecuta. Tú no programas módulos, pero **nada se considera terminado si no está documentado y probado**.

---

## E01 — Arranque y planeación
`#agave/E01` · jue 03 sep · Sprint 0

- [ ] **Guion de entrevista con el responsable de operaciones**
  → Lista de preguntas para entender el proceso actual: cómo se agenda hoy, cómo se avisa al cliente, cuántas visitas al día hace un inspector, qué pasa cuando el cliente no está, cuánto cuesta volver.
- [ ] **Levantamiento del proceso actual (el del correo)**
  → Dibujar el flujo tal como funciona hoy: se programa → se manda correo → el inspector va → el cliente está o no está. Marcar dónde se pierde el dinero. Es la línea base contra la que se comparará el sistema.
- [ ] **Glosario del negocio**
  → Definir con palabras del cliente: inspección, ventana de atención, visita fallida, reintento, zona, evidencia. Terminado cuando el responsable de operaciones lo lee y corrige.
- [ ] 📦 **Entregable:** Documento de levantamiento inicial (guion + flujo actual + glosario).

## E02 — Análisis
`#agave/E02` · jue 10 sep · Sprint 1

- [ ] **Entrevista con el responsable de operaciones (con Marco)**
  → Aplicar el guion. Grabar o tomar notas. Terminada cuando tienes el número de **visitas fallidas al mes** y su costo.
- [ ] **SRS — secciones 1 y 2**
  → Introducción (propósito, alcance, definiciones, referencias) y descripción general (perspectiva del producto con el diagrama de los tres servicios, características de los usuarios, restricciones, suposiciones).
- [ ] **SRS — requerimientos funcionales de los módulos 1 a 5**
  → Módulo 1 seguridad y acceso; 2 clientes, domicilios, inspectores y zonas; 3 agenda; 4 notificaciones; 5 confirmación y reprogramación. Cada RF con identificador, descripción, prioridad y criterio de verificación.
- [ ] **Historias de usuario con Anuar y Jesús**
  → Redactar las historias de los tres actores en formato "Como… quiero… para…" con criterios de aceptación. Terminadas cuando Marco las puede estimar.
- [ ] 📦 **Entregable:** SRS borrador (secciones 1–3 parciales) + historias de usuario.

## E03 — Requerimientos cerrados + diseño de interfaz
`#agave/E03` · jue 17 sep · Sprint 1 (cierre)

- [x] **SRS — requerimientos funcionales de los módulos 6 a 10**
  → Módulo 6 trayecto y seguimiento en vivo; 7 ejecución y resultado; 8 comunicación; 9 tablero; 10 configuración.
- [x] **SRS — requerimientos no funcionales**
  → Usabilidad (el cliente confirma en 3 toques), rendimiento (el mapa se actualiza cada 15 s), confiabilidad, **seguridad y privacidad** (la ubicación solo es visible durante el trayecto), mantenibilidad.
- [x] **Reglas de negocio**
  → Las 17 reglas RN-01 a RN-17: máquina de estados, no traslapar citas, un solo trayecto activo, límite de 3 reprogramaciones, evidencia obligatoria, horario de silencio, retención de puntos GPS.
- [x] **Casos de uso — resumen y dos detallados**
  → Tabla de CU-01 a CU-26 con actor y RF relacionados, más dos casos de uso escritos a detalle (flujo principal, alternos y excepciones): **CU-16 iniciar trayecto** y **CU-11 solicitar reprogramación**.
- [x] **Matriz de trazabilidad**
  → Tabla que liga cada objetivo específico del [[01_Plan_de_Proyecto]] con sus requerimientos funcionales.
- [x] 📦 **Entregable:** SRS completo versión 1.0, listo para que Marco lo valide con el cliente.

## E04 — Diseño técnico + infraestructura
`#agave/E04` · jue 24 sep · Sprint 2

- [ ] **Diagrama de casos de uso**
  → El general con los tres actores humanos, el temporizador y los sistemas externos, más el de relaciones «include» / «extend».
- [ ] **Diagrama de clases del dominio**
  → Las clases del modelo con sus atributos, métodos y multiplicidades.
  ⛔ **Requiere:** Jorge · diccionario de datos (BD E03).
- [ ] **Diagrama de actividades**
  → El flujo completo desde que se programa la cita hasta que se completa, incluyendo las ramas de "no responde", "pide mover", "cliente ausente" y "sin señal".
- [ ] **Diagramas de secuencia (con Jesús)**
  → Al menos tres: aviso del día y confirmación, iniciar trayecto y seguimiento, registrar resultado sin señal y sincronizar.
- [ ] 📦 **Entregable:** Diagramas UML (casos de uso, clases, actividades, secuencia).

## E05 — Autenticación y roles
`#agave/E05` · jue 01 oct · Sprint 2 (cierre)

- [ ] **Manual capítulo 1 — Introducción**
  → Qué es AgaveAlerta, quién usa cada uno de los tres servicios y qué resuelve. Escrito para alguien que nunca lo ha visto.
- [ ] **Manual capítulo 2 — Acceso**
  → Cómo entra el administrador al panel, cómo entra el inspector a su app y cómo entra el cliente con su número de teléfono y el código que le llega por SMS. Incluir qué hacer si no llega el código.
  🔸 **Mejor después de:** los logins de Marco, Anuar y Jesús (E05) para tomar las capturas de pantalla.
- [ ] **Casos de prueba del módulo de seguridad**
  → Tabla con: identificador, precondición, pasos, resultado esperado. Cubrir: login correcto, contraseña equivocada, código OTP vencido, usuario inactivo, y que un cliente **no** pueda entrar al panel.
- [ ] 📦 **Entregable:** Manual capítulos 1–2 + casos de prueba de seguridad.

## E06 — Clientes, domicilios, inspectores y zonas
`#agave/E06` · jue 08 oct · Sprint 3

- [ ] **Manual capítulo 3 — Alta de clientes, domicilios e inspectores**
  → Cómo dar de alta un cliente, agregarle su domicilio, **corregir el pin en el mapa** cuando la geocodificación falla, y asignar zonas a un inspector.
  🔸 **Mejor después de:** Marco · módulo de catálogos (LP E06).
- [ ] **Casos de prueba de catálogos**
  → Incluir los casos feos: dirección que no se puede geocodificar, cliente sin correo, teléfono repetido, baja lógica que no debe borrar el historial.
- [ ] **Actualizar los diagramas con lo que cambió**
  → Si durante la construcción se ajustó el modelo, reflejarlo en el diagrama de clases. Terminado cuando el diagrama coincide con el `schema.prisma` real.
- [ ] 📦 **Entregable:** Manual cap. 3 + casos de prueba de catálogos + UML actualizado.

## E07 — Agenda de inspecciones y asignación
`#agave/E07` · jue 15 oct · Sprint 3 (cierre)

- [x] **Manual capítulo 4 — Programar y mover una cita**
  → Paso a paso para el administrador: elegir cliente, domicilio, fecha, ventana e inspector. Explicar qué significa cada estado de la cita y qué hacer cuando el sistema avisa de un traslape.
  🔸 **Mejor después de:** Marco · agenda del panel (LP E07).
- [x] **Casos de prueba de la agenda**
  → Programar una cita válida; intentar traslapar dos citas del mismo inspector; cancelar; reasignar; verificar que **cada cambio deja renglón en el historial**.
- [x] **Diagrama de estados de la inspección — verificado**
  → Comparar el diagrama con lo que la API realmente permite. Cualquier transición que el código acepte y el diagrama no (o al revés) es un error que hay que reportar.
  ⛔ **Requiere:** Jorge · máquina de estados (BD E07).
- [x] 📦 **Entregable:** Manual cap. 4 + casos de prueba de la agenda + estados verificados.

## E08 — Motor de notificaciones push
`#agave/E08` · jue 22 oct · Sprint 4

- [ ] **Manual capítulo 5 (borrador) — Los avisos que recibe el cliente**
  → Explicar los tres momentos: el día programado, el recordatorio y "va en camino". Con la imagen de cada notificación y qué hacer con cada botón.
- [ ] **Casos de prueba de notificaciones**
  → Los difíciles: permiso de notificaciones denegado, teléfono apagado a la hora del envío, app desinstalada, token vencido, cita dentro del horario de silencio, y que **no se envíe dos veces** el mismo aviso.
- [ ] **Revisar los textos de las notificaciones**
  → Leer las plantillas de [[03_Diseno_Base_de_Datos]] §6 poniéndote en el lugar de una persona mayor que nunca ha usado la app. Proponer redacciones más claras si hace falta.
- [ ] 📦 **Entregable:** Manual cap. 5 borrador + casos de prueba de notificaciones + textos revisados.

## E09 — Confirmación y reprogramación
`#agave/E09` · jue 29 oct · Sprint 4 (cierre)

- [ ] **Manual capítulo 5 final — Confirmar y mover la cita**
  → Con capturas reales: confirmar desde la notificación, confirmar desde la app, pedir otro horario y qué pasa después (el administrador aprueba y llega el aviso del cambio).
  🔸 **Mejor después de:** Jesús · confirmación y reprogramación (CL E09).
- [ ] **Casos de prueba de confirmación y reprogramación**
  → Confirmar; intentar reprogramar una cita que ya va en camino (debe rechazarse, RN-05); pedir la **cuarta** reprogramación (debe rechazarse, RN-06); no responder y verificar que pasa a `SIN_CONFIRMAR` al vencer el plazo.
- [ ] **Manual del administrador — bandeja de reprogramaciones**
  → Cómo aprobar o rechazar y qué ve el cliente en cada caso.
- [ ] 📦 **Entregable:** Manual cap. 5 final + casos de prueba de confirmación/reprogramación.

## E10 — Trayecto y seguimiento en vivo
`#agave/E10` · jue 05 nov · Sprint 5

- [ ] **Manual capítulo 6 — Seguimiento en vivo**
  → Para el inspector: cuándo pulsar "voy en camino" y por qué la app pide la ubicación en segundo plano. Para el cliente: cómo leer el mapa y el tiempo estimado de llegada.
- [ ] **Guion de pruebas de campo del trayecto**
  → Qué se prueba en la calle: que el ETA baje conforme el inspector se acerca, que el mapa siga moviéndose con la pantalla apagada, qué pasa al entrar a una zona sin señal, y el apagado automático a los 90 minutos.
- [ ] **Aviso de privacidad de las dos apps**
  → Texto que el usuario acepta al instalar: qué datos se recogen, durante cuánto tiempo se guarda la ubicación (30 días) y quién la puede ver. Es un compromiso del riesgo R7, no un trámite.
- [ ] 📦 **Entregable:** Manual cap. 6 + guion de pruebas de campo + aviso de privacidad.

## E11 — Llegada, resultado, tablero y modo sin señal
`#agave/E11` · jue 12 nov · Sprint 5 (cierre)

- [ ] **Manuales terminados (los tres servicios)**
  → Un manual por servicio: administrador, inspector y cliente. Con índice, capturas y una sección de "problemas frecuentes".
- [ ] **Matriz completa de casos de prueba**
  → Todos los casos de los 10 módulos, numerados, con responsable de ejecución (Jesús) y columna de resultado vacía lista para llenarse.
- [ ] **Guion de la prueba de campo de E12**
  → El recorrido completo de una cita, paso por paso, con lo que debe pasar en cada teléfono y en el panel. Es el guion que se seguirá delante del cliente.
- [ ] **Manual de instalación**
  → Cómo instalar el APK en un teléfono Android, cómo dar los permisos de notificaciones y de ubicación, y cómo se accede al panel.
- [ ] 📦 **Entregable:** Manuales terminados + matriz de pruebas + guion de la prueba de campo.

## E12 — Pruebas integrales, implantación y entrega final
`#agave/E12` · jue 19 nov · Sprint 6

- [ ] **Reporte de resultados de pruebas**
  → Consolidar lo que ejecutaron Jesús (integrales) y Anuar (campo): cuántos casos pasaron, cuántos fallaron, cuáles se corrigieron y cuáles quedan como observación.
  ⛔ **Requiere:** Jesús · matriz de resultados (CL E12) y Anuar · prueba de campo (IN E12).
- [ ] **Documentación consolidada**
  → Carpeta final con: plan de proyecto, SRS, diseño de base de datos, UML, manuales, plan y reporte de pruebas, actas y minutas. Revisar que los enlaces internos funcionen.
- [ ] **Comparativa contra el proceso actual**
  → Media cuartilla con el dato que cierra el proyecto: cuántas confirmaciones se lograron y cuántas visitas fallidas se evitaron frente a la línea base del correo (la de E01).
- [ ] **Apoyo a la presentación final**
  → Revisar las diapositivas de Marco y preparar las respuestas a las preguntas previsibles de la catedrática.
- [ ] 📦 **Entregable:** Reporte de pruebas + documentación consolidada + comparativa.

---

## 📊 Resumen de tu carga por entrega

| Entrega | Documentación | Calidad |
|---------|---------------|---------|
| E01 | Levantamiento y glosario | — |
| E02 | SRS secciones 1–3 (módulos 1–5) | Historias con criterios |
| E03 | SRS completo v1.0 | Reglas de negocio |
| E04 | Diagramas UML | — |
| E05 | Manual cap. 1–2 | Casos de prueba de seguridad |
| E06 | Manual cap. 3 + UML actualizado | Casos de prueba de catálogos |
| E07 | Manual cap. 4 | Casos de agenda + estados verificados |
| E08 | Manual cap. 5 borrador | Casos de notificaciones |
| E09 | Manual cap. 5 final | Casos de confirmación/reprogramación |
| E10 | Manual cap. 6 + aviso de privacidad | Guion de pruebas de campo |
| E11 | Manuales terminados + instalación | Matriz completa + guion E12 |
| E12 | Documentación consolidada | Reporte de resultados |

**Documentos de referencia:** [[01_Plan_de_Proyecto]] · [[02_SRS_Requerimientos]] · [[03_Diseno_Base_de_Datos]] · [[04_Diagramas_UML]] · [[05_Calendario_Entregas]]
