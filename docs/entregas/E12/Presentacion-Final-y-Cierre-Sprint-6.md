# Presentación Final, Guion de Demostración en Vivo y Cierre del Proyecto (Entrega E12)

**Responsable:** Marco Antonio Méndez Sánchez (LP — Matrícula 2177912)  
**Fecha de la defensa:** jueves 19 de noviembre de 2026 (Sprint 6 — Entrega Final)  

---

## 1. Estructura de diapositivas para la defensa final (15 minutos)

1. **El problema en Agave Roofing (San Antonio, TX)**
   - Avisos solo por correo, sin confirmación ni aviso del traslado.
   - Según el levantamiento inicial: ~18 % de visitas fallidas y ~$65 USD por vuelta perdida (citar la fuente).
2. **La solución AgaveAlerta: 3 servicios + 1 API central**
   - Panel web de administración, app del inspector y app del cliente (Flutter + simuladores web).
3. **Reglas de negocio críticas y riesgos mitigados**
   - Máquina de 11 estados (RN-01), bloqueo de traslapes (RN-02), un solo trayecto activo (RN-03), respaldo push → SMS (riesgo R4), ubicación visible solo durante el trayecto (RN-08 / R7) y sincronización idempotente por `id_local` (RN-12).
4. **Demostración en vivo de punta a punta (5 minutos)** — guion en la sección 2.
5. **Resultados y trabajo futuro**
   - Calidad: 28 de 28 pruebas automatizadas aprobadas.
   - Tablero con datos de prueba: 12 citas, 66.7 % confirmadas, 1 reprogramación y 0 visitas fallidas. Aclarar que son datos de demostración, no de un piloto.
   - Si para el 19 de noviembre hay piloto real, sustituir con esos resultados y decirlo explícitamente.
   - Trabajo futuro: ver sección 3.

---

## 2. Guion paso a paso para la demostración en vivo

**Antes de la defensa**

- Comprobar que la computadora tenga internet o que existan copias locales de Tailwind y Font Awesome; sin ellas el panel y los simuladores se ven sin estilos.
- Ensayar el recorrido completo al menos una vez el día anterior.

1. **Levantar el entorno** (en la raíz del proyecto):
   ```bash
   npm run seed
   npm run api        # API en http://localhost:4000
   ```
2. **Panel de administración** — abrir el archivo `panel/index.html` en el navegador.
   - Verificar que la barra superior indique "API Conectada".
   - Mostrar la agenda, la bitácora de notificaciones, la bandeja de reprogramaciones y el monitor en vivo.
3. **App del inspector** — abrir `app-inspector/simulador_web/index.html` (o la app Flutter).
   - Seleccionar la parada confirmada `INS-2026-000010` y pulsar **"Voy en camino"**.
   - Avanzar el GPS simulado y mostrar cómo se actualiza el monitor del panel.
4. **App del cliente** — abrir `app-cliente/simulador_web/index.html` (o la app Flutter).
   - Mostrar el aviso "va en camino", el seguimiento con ETA y el aviso a menos de 1 km (`POR_LLEGAR`).
   - Pulsar **"Ya estoy en casa"**.
5. **Llegada, modo sin señal y reporte**
   - En la app del inspector, pulsar **"Llegué"** (el seguimiento del cliente se apaga por privacidad, RN-08).
   - Activar el modo sin señal (simulador web), capturar el resultado con fotos (RN-11) y sincronizar (RN-12).
   - En la app del cliente, abrir el reporte de la inspección y cerrar mostrando el tablero de indicadores en el panel.

**Qué decir si preguntan por las integraciones:** push, SMS y ETA están simulados dentro de la API para poder probar las reglas de negocio sin cuentas externas; la arquitectura objetivo (Supabase, FCM, Twilio, Google Directions) está en el ADR-001 §2.1.

---

## 3. Trabajo futuro (Release 2.0)

- Autenticación real (Supabase Auth con correo y OTP) y validación de token y rol en cada ruta de la API.
- Notificaciones push reales con FCM/APNs y SMS con Twilio.
- Apps Flutter: GPS real en segundo plano, cámara, cola sin conexión en SQLite, mapa con cartografía y actualización automática del ETA.
- Mensajería y llamada al cliente dentro de la app Flutter del inspector; calificación de la visita en la app del cliente.
- Reporte en PDF, pantalla de configuración (RF-72 a RF-75) y respaldo automático (RF-76).
- Migración a PostgreSQL/Supabase y despliegue del panel en Vercel.

---

## 4. Retrospectiva final y cierre del proyecto (Sprint 6)

- **Logros del equipo:** los 5 integrantes completaron las 12 entregas semanales (E01 a E12) con trazabilidad entre requerimientos, base de datos, código, pruebas automatizadas y manuales.
- **Estado del repositorio:** 28 de 28 pruebas automatizadas en verde (`npm test`). Registrar aquí el resultado de `flutter analyze` de las dos apps.
- **Lecciones aprendidas:** _llenar en la retrospectiva del 19 de noviembre._
