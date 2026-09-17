# Minutas de Ceremonias Scrum

**Proyecto:** Sistema de Alerta y Seguimiento de Inspecciones de Techo — Agave Roofing (AgaveAlerta)
**Fecha de reunión:** 17 de septiembre de 2026
**Ubicación:** Reunión virtual / Sala de juntas
**Scrum Master:** Marco Antonio Méndez Sánchez (LP)

---

## 1. Sprint Review (Cierre del Sprint 1)
**Duración:** 45 minutos
**Participantes:** Equipo de Desarrollo (Marco, Mario, Jorge, Anuar, Jesús) y Representante del Cliente.

**Resumen de avances presentados:**
- **Mario (AN):** Presentó el SRS Versión 1.0 finalizado con requerimientos funcionales y no funcionales de los 10 módulos.
- **Jorge (BD):** Mostró el diseño de la base de datos, el ERD y el esquema `schema.prisma`. Se confirmó que la máquina de estados de las inspecciones soporta todas las reglas de negocio solicitadas.
- **Anuar e Jesús (IN, CL):** Expusieron los mockups iniciales de la aplicación del inspector (rutas y modo sin señal) y del cliente (notificaciones y mapa).
- **Marco (LP):** Mostró el diseño base del panel de administración (Agenda y Tablero).

**Retroalimentación del cliente / Comentarios:**
- El cliente aprobó el flujo de reprogramaciones (límite de 3 intentos).
- Se validó positivamente la decisión técnica de guardar los registros offline cuando no hay señal y sincronizarlos después (muy común en zonas periféricas).
- **Resolución:** Se aprueba el incremento y se procede a la firma del **Acta de Congelación de Alcance**.

---

## 2. Retrospectiva del Sprint 1
**Duración:** 30 minutos
**Participantes:** Solo Equipo de Desarrollo.

**¿Qué hicimos bien?**
- Excelente paralelismo: Análisis (Mario) y Base de datos (Jorge) lograron avanzar sin bloquearse mutuamente.
- Buena comunicación en la definición de la base de datos. El uso del diccionario de datos ayudó a esclarecer términos confusos.

**¿Qué podemos mejorar?**
- Los "Spikes" técnicos (investigaciones de notificaciones Push y GPS en segundo plano) tomaron un poco más de tiempo del esperado.
- Hubo ligeros retrasos en la definición de los mockups debido a dudas sobre cómo el cliente interactúa con las notificaciones.

**Plan de Acción (Action Items):**
- **Para el Sprint 2:** Comenzar a integrar código desde el primer día. Ya tenemos el diseño de la base de datos, no hay excusa para retrasar la construcción de los esqueletos (boilerplate) de las apps.
- **Responsable:** Jorge levantará la infraestructura base (CI/CD) este mismo fin de semana para que todos puedan programar sobre ella.

---

## 3. Sprint Planning (Arranque del Sprint 2)
**Duración:** 45 minutos
**Objetivo del Sprint 2:** Diseño técnico, infraestructura y seguridad (Login).
**Fechas del Sprint:** 17 de septiembre al 01 de octubre de 2026.

**Asignación de Tareas y Compromisos (Backlog del Sprint 2):**

1. **Marco (LP):** 
   - Diseñar el Plan de Pruebas (criterios de aceptación por historia).
   - Levantar el esqueleto del panel React + Vite con layout, rutas base y login.
2. **Mario (AN):** 
   - Documentación técnica: Diagramas UML (casos de uso, clases de dominio y actividades).
   - Iniciar redacción del Manual de Usuario (Capítulos 1 y 2).
3. **Jorge (BD):** 
   - Ejecutar la migración a Supabase (crear tablas con SQL y RLS).
   - Desplegar API inicial en Node/Express y configurar GitHub Actions (CI).
   - Implementar JWT y validación de roles en la API.
4. **Anuar (IN):** 
   - Crear el proyecto base de Expo para el Inspector e integrar SQLite local.
   - Desarrollar pantalla de Login de inspector.
5. **Jesús (CL):** 
   - Crear el proyecto base de Expo para el Cliente.
   - Implementar diagramas de secuencia.
   - Desarrollar login del cliente usando validación por teléfono (OTP).

**Conclusión:**
El equipo acepta el compromiso. La carga de trabajo está equilibrada y las dependencias técnicas están claras (Todos dependen de que Jorge libere la API inicial para conectar sus pantallas de Login).
