# Documento Ejecutivo de Entrega de Avance — E09
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

**Hito de la Entrega:** Confirmación de disponibilidad · Horarios disponibles por zona · Solicitud y aprobación de reprogramación · Alerta `SIN_CONFIRMAR`  
**Sprint:** Cierre de Sprint 4 (Semanas 7 y 8 — Integra E08 y E09)  
**Fecha de Entrega:** Jueves 29 de octubre de 2026  
**Etiqueta de Git:** `entrega-09`  

---

## 1. Resumen Ejecutivo de los Incrementos E08 y E09

Durante el **Sprint 4** se completó el flujo interactivo de comunicación entre **Agave Roofing (San Antonio, TX)** y los propietarios de inmuebles, cerrando la brecha principal que provocaba las visitas fallidas cuando se notificaba por correo electrónico:

1. **Entrega E08 (22 de octubre — Motor de Notificaciones Push y Respaldo SMS):**
   * Registro de dispositivos móviles (`POST /api/dispositivos`) y motor de plantillas (`DIA_PROGRAMADO`, `RECORDATORIO`, `REPROGRAMADA`, `EN_CAMINO`, `POR_LLEGAR`).
   * Despachador con hasta 3 reintentos, desactivación automática de tokens caducados y **respaldo automático por SMS (Twilio)**.
   * Respeto de horario de silencio nocturno de `21:00` a `07:00` (**RN-14**) e índice único parcial contra avisos duplicados (**RN-13**), permitiendo reenvío manual desde el panel (`reenvio_manual = true`).
2. **Entrega E09 (29 de octubre — Confirmación y Reprogramación):**
   * Confirmación en un toque desde el botón **"✓ Sí estaré"** de la propia notificación (sin abrir la app) o desde el detalle de la cita (`POST /api/inspecciones/:id/confirmar`, **RN-04**).
   * Cálculo de **horarios disponibles reales** en la zona del domicilio excluyendo traslapes de los inspectores (`GET /api/inspecciones/:id/horarios-disponibles`, **RN-02**).
   * Solicitud de reprogramación del cliente (`POST /api/inspecciones/:id/reprogramacion`) con bloqueo cuando el inspector ya va en camino (**RN-05**) o cuando se alcanza el límite de 3 reprogramaciones (**RN-06**).
   * **Bandeja de reprogramaciones en el panel** (`PATCH /api/reprogramaciones/:id/resolver`) para aprobar (moviendo la cita **conservando su folio original** y notificando al cliente) o rechazar con motivo.
   * **Temporizador y bandeja de citas `SIN_CONFIRMAR`** (`POST /api/temporizadores/sin-confirmar`, **RN-07**) para confirmar por llamada telefónica desde la oficina sin cancelar automáticamente la cita.

---

## 2. Entregables Completados por Integrante (E08 + E09)

| Integrante | Rol | Entregables en Código y Documentación |
| :--- | :--- | :--- |
| **Marco Antonio Méndez Sánchez** | **LP** | • Vista de notificaciones + botón *Reenviar* + alerta *"Cliente no alcanzado"* y Bandeja de Reprogramaciones + Alerta `SIN_CONFIRMAR` en [panel/index.html](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/panel/index.html) y [NotificacionesYReprogramaciones.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/panel/src/pages/NotificacionesYReprogramaciones.tsx).<br>• Bitácora R4 ([Marco-Bitacora-Entregabilidad-R4.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/entregas/E08/Marco-Bitacora-Entregabilidad-R4.md)) y Minuta de Sprint 4 ([Marco-Minuta-Sprint-4.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/entregas/E09/Marco-Minuta-Sprint-4.md)). |
| **Jorge Alberto Barbosa García** | **BD** | • Motor de notificaciones ([notificacionService.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/src/services/notificacionService.ts)).<br>• Servicio de confirmación, horarios disponibles, reprogramación y temporizador `SIN_CONFIRMAR` ([confirmacionReprogramacionService.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/src/services/confirmacionReprogramacionService.ts)).<br>• Nuevas tablas e índices en [db.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/src/db.ts), datos en [seed.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/src/seed.ts) y rutas en [server.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/api/src/server.ts). |
| **Anuar Guadalupe Hernández Hernández** | **IN** | • Servicio de notificaciones del inspector en los 3 estados ([notificacionesInspector.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-inspector/src/services/notificacionesInspector.ts)).<br>• Etiquetas de estado de confirmación y advertencia destacada en citas `SIN_CONFIRMAR` en [RutaDelDia.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-inspector/src/screens/RutaDelDia.tsx) y [DetalleParada.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-inspector/src/screens/DetalleParada.tsx). |
| **Jesús Mario Bazaldúa Bustos** | **CL** | • Servicio de avisos y confirmación sin abrir la app ([notificacionesCliente.ts](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-cliente/src/services/notificacionesCliente.ts)).<br>• Botón de confirmación, selector de horarios disponibles reales, validaciones RN-05/RN-06 y estado de notificaciones en [MisCitas.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-cliente/src/screens/MisCitas.tsx) y [DetalleCita.tsx](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/app-cliente/src/screens/DetalleCita.tsx).<br>• Reporte de pruebas ([Jesus-Pruebas-E08-E09.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/pruebas/resultados/Jesus-Pruebas-E08-E09.md)). |
| **Mario Martínez González** | **AN** | • Manual de Usuario Cap. 5 completo ([Manual-Capitulo-5-Notificaciones-y-Confirmacion.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/manual/Manual-Capitulo-5-Notificaciones-y-Confirmacion.md)).<br>• Especificación de 16 casos de prueba de E08 y E09 ([Casos-de-Prueba-Notificaciones-y-Confirmacion-E08-E09.md](file:///Users/marcomendezsanchez/UANL/PROYECTO%20INTEGRADOR%20I/agaveRoofing/docs/pruebas/Casos-de-Prueba-Notificaciones-y-Confirmacion-E08-E09.md)). |

---

## 3. Instrucciones de Ejecución y Verificación

1. **Ejecutar pruebas automatizadas de E08 y E09:**
   ```bash
   node --experimental-strip-types --experimental-sqlite api/test/e08_e09.test.ts
   ```
2. **Ejecutar pruebas de regresión de E07:**
   ```bash
   node --experimental-strip-types --experimental-sqlite api/test/agenda.test.ts
   ```
3. **Levantar la API en el puerto 4000:**
   ```bash
   node --experimental-strip-types --experimental-sqlite api/src/server.ts
   ```
4. **Abrir el Panel de Administración:**
   Abrir `panel/index.html` en el navegador y navegar entre las pestañas **Agenda y Calendario**, **Notificaciones Push (E08)** y **Reprogramaciones y Sin Confirmar (E09)**.
