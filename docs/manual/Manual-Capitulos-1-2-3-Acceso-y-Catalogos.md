# Manual de Usuario — Capítulos 1, 2 y 3: Introducción, Control de Acceso (E05) y Catálogos Operativos (E06)

**Proyecto:** AgaveAlerta — Sistema de Gestión de Inspecciones de Techos, Seguimiento en Tiempo Real y Alertas de Ruta  
**Cliente:** Agave Roofing (San Antonio, Texas)  
**Autor:** Mario (AN)  

---

## Capítulo 1 — Introducción al Sistema AgaveAlerta

**AgaveAlerta** es una plataforma integral compuesta por tres aplicaciones conectadas a una API centralizada y base de datos relacional:
1. **Panel Web de Administración (`panel/`):** Uso exclusivo del personal administrativo de Agave Roofing para gestionar clientes, domicilios geocodificados, zonas de servicio, inspectores, agenda de citas, bandeja de reprogramaciones, monitor en vivo y tablero de indicadores KPI.
2. **App Móvil del Inspector (`app-inspector/`):** Diseñada para los técnicos de techos en campo con soporte de caché local SQLite, ruta del día ordenada por ventana horaria, inicio de trayecto con transmisión GPS en segundo plano cada 15 s, captura de resultado con fotografías obligatorias (**RN-11**) y sincronización diferida sin señal (**RN-12**).
3. **App Móvil del Cliente (`app-cliente/`):** Permite a los propietarios en San Antonio recibir notificaciones Push (con respaldo automático por SMS vía Twilio), confirmar su asistencia en un toque (**RN-04**), solicitar cambio de horario (**RN-05 / RN-06**), seguir en un mapa en vivo el acercamiento del inspector con ETA (**E10**), avisar *"Ya estoy en mi casa"* y descargar su **Reporte PDF Oficial** (**E11**).

---

## Capítulo 2 — Control de Acceso, Roles y Sesiones (E05)

### 2.1 Acceso al Panel Web (`ADMINISTRADOR`)
- El administrador ingresa mediante correo electrónico corporativo y contraseña (`POST /api/auth/login`).
- Las guardas de ruta verifican que el token pertenezca exclusivamente al rol `ADMINISTRADOR`. Si una cuenta con rol `INSPECTOR` o `CLIENTE` intenta acceder al panel, el sistema bloquea el acceso con código `403 ACCESO_DENEGADO_ROL_E05`.

### 2.2 Acceso a la App del Inspector (`INSPECTOR`)
- El técnico inicia sesión con sus credenciales asignadas por la oficina y conserva su **sesión persistente** en almacenamiento seguro del teléfono para no volver a autenticarse al inicio de cada jornada.

### 2.3 Acceso a la App del Cliente por Teléfono + Código OTP (`CLIENTE`)
- Para evitar que el cliente olvide contraseñas, el ingreso se realiza capturando su número telefónico registrado (`+1-210-...`) y validando el código **OTP de 6 dígitos** enviado por SMS.
- Al iniciar sesión por primera vez, la app solicita el permiso de notificaciones explicando que se usará para avisarle cuando su inspector vaya en camino y registra el dispositivo en `POST /api/dispositivos`.

---

## Capítulo 3 — Gestión de Catálogos: Clientes, Domicilios, Zonas e Inspectores (E06)

1. **Catálogo de Clientes (`POST /api/clientes`, `PATCH /api/clientes/:id/baja`):**
   - Permite buscar por nombre o teléfono, registrar clientes con su **canal preferido** (`PUSH`, `SMS` o `CORREO`) y aplicar **baja lógica** (`activo = 0`) cumpliendo la regla **RN-15** (nunca se borran físicamente clientes con historial de inspecciones).
2. **Catálogo de Domicilios con Geocodificación (`POST /api/domicilios`):**
   - Al dar de alta un inmueble en San Antonio, TX, el sistema geocodifica automáticamente la dirección asignando `latitud`, `longitud` y `geocodificado = 1`, permitiendo ajustar el pin en el mapa y vincularlo con su zona de servicio.
3. **Catálogo de Zonas e Inspectores (`POST /api/zonas`, `GET /api/catalogos`):**
   - Administra las zonas operativas de San Antonio (*Stone Oak, Alamo Heights, Southtown, Medical Center*) y la asignación múltiple (`inspector_zona` N:M) de inspectores con su número de placa oficial y fotografía de identificación.
