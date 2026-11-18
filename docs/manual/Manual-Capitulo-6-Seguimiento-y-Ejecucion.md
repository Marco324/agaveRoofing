# Manual de Usuario — Capítulo 6: Seguimiento en Vivo, Ejecución en Sitio, Reporte y Tablero Operativo (E10 y E11)

**Proyecto:** AgaveAlerta — Sistema de Gestión de Inspecciones de Techos, Seguimiento en Tiempo Real y Alertas de Ruta  
**Cliente:** Agave Roofing (San Antonio, Texas)  
**Responsable de documentación:** Mario (AN)  
**Hitos cubiertos:** E10 (05 nov 2026) y E11 (12 nov 2026 — Congelamiento Funcional)

---

## 6.1 Seguimiento en Vivo y Telemetría GPS (App del Inspector y App del Cliente — E10)

### Para el Inspector en Campo (`app-inspector`)
1. **Iniciar el trayecto ("Voy en camino"):**
   - Desde el detalle de la parada en la **Ruta del Día**, presiona el botón **"🛻 Voy en camino (Activar GPS + Avisar al Cliente)"**.
   - El sistema verifica automáticamente la regla **RN-03**: ningún inspector puede mantener dos trayectos activos simultáneamente.
   - Al iniciar el trayecto, la cita cambia a `EN_CAMINO`, comienza el envío de coordenadas GPS cada **15 segundos** en segundo plano y el cliente recibe una notificación push urgente.
2. **Aproximación a menos de 1 km (`POR_LLEGAR`):**
   - Cuando la distancia entre la camioneta del inspector y el domicilio del cliente es menor a **1,000 metros** (**RN-02**), el servidor envía por única vez la alerta urgente *"Su inspector está por llegar (< 1 km)"*.
3. **Corte automático del GPS:**
   - La transmisión de ubicación se detiene de forma automática en cuanto el inspector presiona **"📍 Llegué (`EN_SITIO`)"** o **"🚫 Cliente Ausente"**, o bien tras **90 minutos** de trayecto continuo mediante el temporizador de seguridad (**Riesgo R5**).

### Para el Cliente (`app-cliente`)
1. **Mapa en Vivo y Tiempo Estimado de Llegada (ETA):**
   - Mientras la cita está en estado `EN_CAMINO`, la pantalla de detalle muestra el **Mapa de Seguimiento en Vivo** con el pin del vehículo oficial del inspector, la distancia restante y el **ETA en minutos**.
   - Si el servicio externo de rutas no responde, el sistema calcula el ETA mediante distancia en línea recta a **30 km/h** y muestra la etiqueta *"ETA Aproximado"* (**RN-09**).
   - Si el inspector atraviesa una zona sin cobertura celular por más de 2 minutos, la tarjeta informa *"Última ubicación hace X min"*.

---

## 6.2 Aviso de Privacidad de Ubicación GPS (RN-08 y Riesgo R7)

> **Aviso de Privacidad Operativa — AgaveAlerta (San Antonio, TX):**  
> Conforme a la regla de negocio **RN-08** y la mitigación del riesgo **R7**, la ubicación GPS del teléfono del inspector **únicamente** se recolecta y se comparte con el cliente durante el traslado activo (`EN_CAMINO`) hacia el domicilio programado.  
> - **Antes de salir (`PROGRAMADA`, `NOTIFICADA`, `CONFIRMADA`):** El mapa de ubicación permanece oculto para el cliente.  
> - **Al llegar (`EN_SITIO`, `COMPLETADA`, `CLIENTE_AUSENTE`):** La transmisión GPS se corta inmediatamente.  
> - **Retención de datos (RN-17):** Los puntos crudos de la tabla `punto_ubicacion` se eliminan automáticamente después de **30 días**, conservando únicamente el resumen estadístico (`distancia_m` y `duracion_s`) en la tabla `trayecto`.

---

## 6.3 Confirmación de Presencia, Llegada, Resultado y Cliente Ausente (E11)

1. **Botón "🏠 Ya estoy en mi casa" (App del Cliente):**
   - El día de la cita, el cliente puede presionar **"Ya estoy en mi casa"** (`POST /api/inspecciones/:id/presencia`) para notificar en tiempo real al inspector que ya lo espera en el domicilio.
2. **Captura de Resultado de Inspección y Fotos (RN-11):**
   - Una vez `EN_SITIO`, el inspector captura:
     - **Estado del techo:** `BUENO`, `REGULAR`, `MALO` o `CRITICO`.
     - **Hallazgos técnicos**, si **requiere reparación**, nivel de **urgencia** (`BAJA`, `MEDIA`, `ALTA`, `INMEDIATA`) y **recomendaciones**.
     - **Evidencias fotográficas:** Es obligatorio adjuntar **al menos 1 fotografía** (**RN-11**) antes de cerrar la inspección como `COMPLETADA`.
   - Al guardar, se genera automáticamente el **Reporte PDF Oficial** (`/api/inspecciones/:id/reporte-html`) y el cliente recibe la notificación de reporte disponible.
3. **Registro de Cliente Ausente (RN-10):**
   - Si el cliente no atiende tras tocar a la puerta, el inspector selecciona **"🚫 Cliente Ausente"**, donde **RN-10** exige adjuntar obligatoriamente **1 fotografía de la fachada** y una **nota explicativa**.

---

## 6.4 Modo Sin Señal (Cola SQLite Offline e Idempotencia RN-12)

1. Cuando el inspector pierde cobertura celular en zonas suburbanas de San Antonio, la app activa el **Modo Sin Señal** y muestra el indicador *"📦 X registros en cola SQLite por enviar"*.
2. Las operaciones de llegada (`LLEGADA`), fotografías (`EVIDENCIA`), dictamen (`RESULTADO`) y ausencia (`CLIENTE_AUSENTE`) se almacenan localmente con un identificador único `id_local` y su hora real de captura en el dispositivo (`ocurrido_en`).
3. Al recuperar conexión, el lote se envía a `POST /api/sincronizar`. Gracias a la restricción de unicidad por `id_local` (**RN-12**), si el envío se reintenta varias veces no se generan registros duplicados y se respeta la marca de tiempo original.

---

## 6.5 Monitor en Vivo y Tablero de Indicadores del Administrador (`panel`)

1. **Pestaña "🛰️ Monitor en Vivo (E10)":**
   - Muestra el mapa operativo de San Antonio con los inspectores en campo y la **Lista Semáforo de Citas del Día**:
     - 🟢 **A TIEMPO:** Cita confirmada en ventana o inspector en camino dentro de horario.
     - 🟡 **EN RIESGO:** Cita próxima a su ventana sin confirmación o con reprogramación pendiente.
     - 🔴 **RETRASADA:** Cita `SIN_CONFIRMAR`, visita fallida o ventana vencida.
2. **Pestaña "📊 Tablero KPI (E11)":**
   - Presenta las 6 tarjetas operativas comparadas contra la línea base de Agave Roofing (18% de visitas fallidas y 0% de confirmación previa), gráficas semanales, tabla de puntualidad por inspector y el botón **"📥 Exportar CSV"** (`/api/panel/indicadores/csv`).

---

## 6.6 Manual de Instalación y Puesta en Marcha

1. **Requisitos:** Node.js v22+ (con soporte nativo de SQLite y TypeScript) y navegador moderno (Chrome/Safari/Edge). Para compilar los proyectos móviles nativos: Flutter SDK 3.24+.
2. **Arranque del Backend y Base de Datos:**
   ```bash
   npm run seed   # Inicializa SQLite y carga datos semilla de E07 a E11
   npm run api    # Levanta el servidor REST en http://localhost:4000
   ```
3. **Ejecución de Pruebas Automatizadas:**
   ```bash
   npm test       # Ejecuta las suites de E07, E08-E09 y E10-E11
   ```
4. **Apertura de las 3 Aplicaciones:**
   - **Panel Web de Administración:** Abrir `panel/index.html` y entrar con `marco.admin@agaveroofing.com`.
   - **App del Inspector:** `flutter run` en `app-inspector/` y entrar con `carlos.garza@agaveroofing.com`.
   - **App del Cliente:** `flutter run` en `app-cliente/` y entrar con el teléfono `210 555 0201`.
   - Todas las cuentas de prueba usan la contraseña `Agave2026` (ver README, *Cuentas de prueba*).

---

## 6.7 Anexo: Problemas Frecuentes (Troubleshooting)

| Síntoma | Causa Probable | Solución |
| :--- | :--- | :--- |
| Las aplicaciones muestran *"Modo Local"* en la barra superior | El servidor API en el puerto `4000` no está encendido | Ejecutar `npm run api` en la raíz del proyecto y presionar **Actualizar** |
| El botón *"Voy en camino"* devuelve error `409 Conflict` | El inspector ya tiene otra cita en estado `EN_CAMINO` (**RN-03**) | Registrar llegada o cerrar primero el trayecto activo antes de iniciar el siguiente |
| No permite finalizar una inspección como `COMPLETADA` | No se ha adjuntado ninguna fotografía (**RN-11**) | Agregar al menos 1 fotografía de evidencia del techo antes de guardar |
| El cliente no ve el mapa en vivo de su inspector | La cita aún no está en estado `EN_CAMINO` o el inspector ya llegó (`EN_SITIO`) | Por privacidad (**RN-08 / R7**), el mapa solo está visible durante el traslado activo |
