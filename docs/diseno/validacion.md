# Validación del rediseño

- Base: `agaveRoofing-main nueva.zip`.
- Integración: 55 archivos funcionales coinciden byte a byte con el comprimido nuevo, incluidos la API y los modelos, servicios y presenters de las apps.
- API: 7 suites aprobadas (agenda, notificaciones/reprogramaciones, trayecto/ejecución, citas pasadas, FCM, fecha y autenticación).
- Panel: 7 pruebas de navegador aprobadas, incluyendo alta de inspección conectada a la API, diálogos con teclado, datos en las seis secciones y tamaños de 320, 390 y 768 px.
- Cliente Flutter: 3 pruebas aprobadas; validación del acceso, confirmación/cambio de horario y presencia durante el trayecto.
- Inspector Flutter: 8 pruebas aprobadas; estados de visita, cierre pendiente, fechas y calendario estrecho.
- Análisis estático: sin incidencias en ambas apps.
- Compilación: ambas apps generadas correctamente para web con las dependencias de la versión nueva y el componente visual local `agave_ui`.
- Revisión visual: panel, indicadores, notificaciones, catálogos, formulario de agenda, próxima visita con mapa, ruta del inspector y pasos del formulario de resultado.
- Interacciones revisadas en las vistas Flutter: sesión guardada, navegación al formulario, cambio de paso y apertura/cierre de los detalles de contacto. No se enviaron resultados ni se activó la cámara o el GPS físico durante esta revisión.
- Pulido final: las 18 pruebas de interfaz volvieron a pasar; análisis de ambas apps sin incidencias. Se revisaron el reporte del cliente, el historial, el selector de horario a 320 y 390 px y los controles de estado y fotos del inspector. Fecha y hora se muestran completas en el selector y en sus opciones.

La vista previa usa datos locales de demostración. Las pruebas automáticas usan bases separadas de la vista previa.
