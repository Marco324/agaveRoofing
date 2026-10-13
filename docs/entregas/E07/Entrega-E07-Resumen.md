# Documento Ejecutivo de Entrega de Avance — E07
## Sistema de Alerta y Seguimiento de Inspecciones de Techo — Agave Roofing (San Antonio, TX)
### AgaveAlerta

---

**Universidad Autónoma de Nuevo León — Facultad de Ingeniería Mecánica y Eléctrica (FIME)**  
**Unidad de Aprendizaje:** Proyecto Integrador I  
**Catedrática:** Raquel Martínez Martínez  
**Equipo:** Equipo 01  
**Integrantes:**
1. **Marco Antonio Méndez Sánchez** (Líder de Proyecto / Product Owner / Panel Web)
2. **Jorge Alberto Barbosa García** (Arquitecto de Software / Backend / Base de Datos / DevOps)
3. **Anuar Guadalupe Hernández Hernández** (Desarrollador Móvil — App del Inspector)
4. **Jesús Mario Bazaldúa Bustos** (Desarrollador Móvil — App del Cliente / QA)
5. **Mario Martínez González** (Analista de Sistemas / Documentación / QA)

**Hito de la Entrega:** Agenda de inspecciones y asignación · Validación de traslapes (RN-02) · Demo Intermedia  
**Sprint:** Cierre de Sprint 3 (Semanas 5 y 6)  
**Fecha de Entrega:** Jueves 15 de octubre de 2026  
**Etiqueta de Git:** `entrega-07`  

---

## 1. Resumen Ejecutivo del Incremento de Software

Durante este Sprint 3 se concluyó el núcleo transaccional y operativo del sistema **AgaveAlerta**, enfocado en la gestión, despacho y calendarización de visitas de inspección de techos para **Agave Roofing en San Antonio, Texas**.

El incremento integra el monorepo completo con cuatro componentes funcionales conectados a través de contratos compartidos en TypeScript (`@agave/shared`):

```
agaveRoofing/
├── shared/            -> Contratos de datos, DTOs y validadores de la máquina de estados
├── api/               -> API REST en Node.js/Express, motor SQLite/PostgreSQL y lógica de negocio
├── panel/             -> Panel de administración web para calendarización y despacho
├── app-inspector/     -> Aplicación móvil para ruta del día y navegación con Google Maps
├── app-cliente/       -> Aplicación móvil para consulta de citas y línea de tiempo
└── docs/              -> Manuales, casos de prueba, minutas Scrum y bitácoras
```

---

## 2. Cumplimiento de Reglas de Negocio en la Entrega E07

1. **RN-01 (Máquina de Estados e Historial Inmutable):**
   * Toda cita atraviesa estados estrictos: `PROGRAMADA` ➔ `NOTIFICADA` ➔ `CONFIRMADA` ➔ `EN_CAMINO` ➔ `EN_SITIO` ➔ `COMPLETADA`.
   * Cualquier intento de salto inválido (por ejemplo, de `PROGRAMADA` directamente a `COMPLETADA`) es rechazado a nivel de servicio (`ErrorTransicionInvalida`).
   * Cada cambio genera un registro indeleble en `inspeccion_historial` con fecha, hora, actor y origen (`PANEL`, `APP_INSP`, `APP_CLI`, `SISTEMA`).
2. **RN-02 (Validación de Traslapes Horarios por Inspector):**
   * El sistema impide que un mismo inspector técnico tenga dos citas con ventanas de atención empalmadas en la misma fecha dentro del territorio de San Antonio, TX.
   * La API devuelve el código de error `TRASLAPE_INSPECTOR_RN02` y el panel web despliega una advertencia visual inmediata indicando el folio en conflicto.
3. **RN-06 (Estabilidad del Folio Consecutivo Anual):**
   * Los folios se generan automáticamente con el formato `INS-2026-000001`.
   * Si una cita se reprograma o se mueve de fecha, **conserva su folio original**, manteniendo intacta la trazabilidad con el cliente.
4. **RN-05 & RN-06 (Límite de Reprogramaciones):**
   * Se restringe a un máximo de **3 reprogramaciones** por cita; a partir de ahí se requiere autorización especial.
   * Las citas en trayecto activo (`EN_CAMINO`) o `EN_SITIO` no admiten reprogramación.

---

## 3. Entregables Detallados por Integrante

### 3.1 Marco Antonio Méndez Sánchez (LP — Product Owner / Panel Web)
* **Panel Web de Agenda ([panel/index.html](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/panel/index.html) y [Agenda.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/panel/src/pages/Agenda.tsx)):**
  * Calendario interactivo con filtros por inspector (Carlos Garza, David Vance) y por zona (Stone Oak, Alamo Heights, Southtown, Medical Center).
  * Modal para nueva inspección con detección de traslapes en tiempo real.
  * Modal de detalle de inspección con línea de tiempo y opciones de reasignación, reprogramación y cancelación.
* **Minuta de Ceremonias Scrum ([docs/entregas/E07/Marco-Minuta-Sprint-3.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/entregas/E07/Marco-Minuta-Sprint-3.md)):**
  * Sprint Review 3 con los resultados de la **Demo Intermedia** presentada a operaciones de Agave Roofing.
  * Retrospectiva del Sprint 3 y Sprint Planning del Sprint 4 (Motor Push).

### 3.2 Jorge Alberto Barbosa García (BD — Arquitecto / Backend)
* **Esquema de Base de Datos y Prisma ([api/prisma/schema.prisma](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/prisma/schema.prisma)):**
  * Definición completa de las tablas relacionales según [[03_Diseno_Base_de_Datos]].
* **Servicios de Negocio y API ([api/src/](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/src)):**
  * Generador de folios (`folioService.ts`).
  * Máquina de estados formal (`maquinaEstadosService.ts`).
  * Validador de traslapes y CRUD de agenda (`agendaService.ts`).
  * Servidor REST con endpoints `/api/inspecciones`, `/api/inspecciones/mi-ruta` y `/api/inspecciones/mias` (`server.ts`).
* **Semilla San Antonio, TX ([api/src/seed.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/src/seed.ts)):**
  * Clientes, zonas georreferenciadas y citas base en San Antonio, Texas.

### 3.3 Anuar Guadalupe Hernández Hernández (IN — App del Inspector)
* **Ruta del Día ([app-inspector/src/screens/RutaDelDia.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-inspector/src/screens/RutaDelDia.tsx)):**
  * Listado cronológico de paradas ordenadas por ventana de atención, con selector de fecha y recarga de datos.
* **Detalle de la Parada ([app-inspector/src/screens/DetalleParada.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-inspector/src/screens/DetalleParada.tsx)):**
  * Enlace directo de llamada telefónica al cliente y botón de navegación en Google Maps mediante coordenadas.
* **Caché Local Offline ([app-inspector/src/services/cacheLocal.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-inspector/src/services/cacheLocal.ts)):**
  * Persistencia de la ruta para consulta en campo ante pérdidas de cobertura celular.

### 3.4 Jesús Mario Bazaldúa Bustos (CL — App del Cliente / Pruebas)
* **Mis Citas ([app-cliente/src/screens/MisCitas.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-cliente/src/screens/MisCitas.tsx)):**
  * Tarjeta destacada de próxima cita con traducción del estado a lenguaje humano, historial y manejo de estado vacío (*empty state*).
* **Detalle de Cita ([app-cliente/src/screens/DetalleCita.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-cliente/src/screens/DetalleCita.tsx)):**
  * Ficha del inspector asignado (nombre, foto, placas `TX-ROOF-01`) y visualización de la línea de tiempo.
* **Reporte de Ejecución de Pruebas ([docs/pruebas/resultados/Jesus-Pruebas-Agenda-E07.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/pruebas/resultados/Jesus-Pruebas-Agenda-E07.md)):**
  * 7 casos de prueba ejecutados y aprobados al 100%.

### 3.5 Mario Martínez González (AN — Analista / Documentación / QA)
* **Manual de Usuario — Capítulo 4 ([docs/manual/Manual-Capitulo-4-Agenda.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/manual/Manual-Capitulo-4-Agenda.md)):**
  * Guía operativa para el Administrador sobre cómo agendar citas, significado de colores de estados y protocolo de resolución ante traslapes.
* **Casos de Prueba y Matriz de Auditoría ([docs/pruebas/Casos-de-Prueba-Agenda-E07.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/pruebas/Casos-de-Prueba-Agenda-E07.md)):**
  * Especificación técnica de los casos CP-AG-01 a CP-AG-07 y tabla comparativa del diagrama de estados UML contra la implementación de la API.

---

## 4. Evidencia de Pruebas Automatizadas

La suite de pruebas automatizadas ([api/test/agenda.test.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/test/agenda.test.ts)) arrojó un resultado satisfactorio:

```text
🧪 Iniciando pruebas automáticas de Agenda y Máquina de Estados (E07)...

🌱 Sembrando datos para Agave Roofing en San Antonio, Texas...
✅ Semilla completada exitosamente: 4 zonas de San Antonio, 2 inspectores, 4 clientes, 4 domicilios y 4 inspecciones.
▶ [Prueba 1] Verificación de formato y consecutividad de folio
  ✔ Folio generado correctamente: INS-2026-000005

▶ [Prueba 2] Creación de inspección sin traslapes
  ✔ Cita creada con folio INS-2026-000005 e historial auditado.

▶ [Prueba 3] Validación de traslape de horario para el mismo inspector (RN-02)
  ✔ Traslape detectado y bloqueado exitosamente: El inspector #1 ya cuenta con la cita [INS-2026-000005] en horario traslapado para el día 2026-10-15 (15:00 - 17:00). Violación de regla RN-02.

▶ [Prueba 4] Máquina de estados - Validación estricta de transiciones (RN-01)
  ✔ Transición legal PROGRAMADA -> NOTIFICADA aceptada.
  ✔ Transición ilegal bloqueada exitosamente: Transición inválida de [NOTIFICADA] hacia [COMPLETADA] (Violación de RN-01)

▶ [Prueba 5] Reprogramación de citas y límite de 3 movimientos
  ✔ Cita reprogramada a 2026-10-17, conservando folio INS-2026-000005.

▶ [Prueba 6] Ruta del día del inspector (orden cronológico en San Antonio, TX)
  ✔ Se recuperaron 2 paradas en orden:
     Parada 1: 09:00 - 11:00 | Robert B. Martinez (Stone Oak, San Antonio) [CONFIRMADA]
     Parada 2: 11:30 - 13:30 | Sarah Jenkins (Alamo Heights, San Antonio) [NOTIFICADA]

▶ [Prueba 7] Mis Citas del cliente (próxima cita y línea de tiempo)
  ✔ Próxima cita de INS-2026-000005: 2026-10-17 (10:00)
  ✔ Eventos en línea de tiempo: 3

=============================================================
🎉 TODAS LAS PRUEBAS DE E07 PASARON EXITOSAMENTE (100% OK)
=============================================================
```

---

## 5. Instrucciones para Evaluación y Demostración

1. **Ejecutar pruebas automatizadas:**
   ```bash
   node --experimental-strip-types --experimental-sqlite api/test/agenda.test.ts
   ```
2. **Iniciar servidor API:**
   ```bash
   node --experimental-strip-types --experimental-sqlite api/src/server.ts
   ```
3. **Acceder al Panel de Administración:**
   Abrir en cualquier navegador el archivo `panel/index.html`.
4. **Verificar estado de Git:**
   Etiqueta de congelación: `git tag -l "entrega-07"`.
