# 🌵 AgaveAlerta — Sistema Integral de Gestión, Notificación y Seguimiento de Inspecciones de Techos
**Cliente:** Agave Roofing (San Antonio, Texas)  
**Materia:** Proyecto Integrador I — UANL  
**Estado del Proyecto:** Release 1.0 de demostración (`E01` a `E12` · Sprints 0 a 6)

---

## 👥 Equipo de Desarrollo

| Clave | Integrante | Matrícula | Rol | Checklist |
| :--- | :--- | :--- | :--- | :--- |
| **LP** | Marco Antonio Méndez Sánchez | 2177912 | Product Owner / Scrum Master + Panel Web | [Checklist-Marco-LP.md](./docs/Checklists/Checklist-Marco-LP.md) |
| **BD** | Jorge Alberto Barbosa García | 2071973 | Arquitecto Backend + Base de Datos + DevOps | [Checklist-Jorge-BD.md](./docs/Checklists/Checklist-Jorge-BD.md) |
| **IN** | Anuar Guadalupe Hernández Hernández | 1905467 | Desarrollador Móvil — App del Inspector (Flutter) | [Checklist-Anuar-IN.md](./docs/Checklists/Checklist-Anuar-IN.md) |
| **CL** | Jesús Mario Bazaldúa Bustos | 2014834 | Desarrollador Móvil — App del Cliente (Flutter) + QA | [Checklist-Jesus-CL.md](./docs/Checklists/Checklist-Jesus-CL.md) |
| **AN** | Mario Martínez González | 2056182 | Analista / Documentación / Calidad | [Checklist-Mario-AN.md](./docs/Checklists/Checklist-Mario-AN.md) |

---

## 🏗️ Estructura del Monorepo

- `api/` — API REST en Node.js 22 + TypeScript nativo (módulo `http`, sin Express) con SQLite en modo WAL (`node:sqlite`). Máquina de estados (`RN-01` a `RN-17`), notificaciones push/SMS **simuladas** con reintentos y respaldo (`E08`), reprogramaciones (`E09`), trayecto y ETA estimado (`E10`), ejecución, sincronización idempotente e indicadores (`E11`), catálogos y bitácora (`E05`/`E06`).
- `panel/` — Panel web de administración en una sola página (`panel/index.html`, HTML + JavaScript + Tailwind por CDN): agenda (`E07`), bitácora de notificaciones (`E08`), bandeja de reprogramaciones (`E09`), monitor en vivo (`E10`), tablero de indicadores con CSV (`E11`) y catálogos (`E05`/`E06`). Los archivos de `panel/src/pages/*.tsx` son prototipos en React que no forman parte de la versión entregada.
- `app-inspector/` — App del inspector en **Flutter + Dart** (patrón MVP): ruta del día, "Voy en camino" con avance GPS simulado, llegada, resultado, cliente ausente y navegación a Maps/Waze. Su **simulador web** (`simulador_web/index.html`) agrega mensajería y cola sin conexión con sincronización idempotente (`RN-12`).
- `app-cliente/` — App del cliente en **Flutter + Dart** (patrón MVP): próxima cita, confirmación, reprogramación (`RN-05`/`RN-06`), seguimiento con distancia y ETA, aviso *"Ya estoy en casa"*, reporte y encuesta piloto. Su **simulador web** agrega notificaciones simuladas, mapa esquemático y mensajería.
- `shared/` — Tipos de dominio, estados y DTOs compartidos.
- `docs/` — Documentación normativa (`01` a `07`), manuales, casos y resultados de pruebas, y paquetes de entrega (`E03` a `E12`). Las diferencias entre el SRS y lo construido están en `docs/02_SRS_Requerimientos.md` §5.

> **Alcance de esta versión:** Release 1.0 de demostración local. Autenticación real, push/SMS reales, Google Directions, GPS y cámara en Flutter, y migración a Supabase quedan como trabajo futuro (ver `docs/entregas/E12/ADR-001-Arquitectura-Final-y-Despliegue.md`).

---

## 🚀 Cómo Ejecutar el Proyecto

Requisito: **Node.js 22 o superior** (usa `--experimental-strip-types` y `--experimental-sqlite`).

### 1. Sembrar la base de datos y levantar la API (`puerto 4000`)
```bash
npm run seed   # regenera data/agavealerta.db con los datos de prueba
npm run api    # API en http://localhost:4000
```
Con la API corriendo, abre estos archivos directamente en el navegador (la API no sirve archivos estáticos):
- **Panel de administración:** `panel/index.html`
- **Simulador web app del inspector:** `app-inspector/simulador_web/index.html`
- **Simulador web app del cliente:** `app-cliente/simulador_web/index.html`
- **Healthcheck de la API:** `http://localhost:4000/api/salud`

Para usar otro puerto: `PORT=5000 npm run api` (y actualizar `API_URL` en el panel y los simuladores).

### 2. Ejecutar las Aplicaciones Móviles en Flutter
La URL de la API se lee de `--dart-define=API_URL` (`lib/config/api_config.dart`). Si no se indica:
- **Emulador de Android:** `http://10.0.2.2:4000/api` (así ve el emulador a tu computadora).
- **Simulador de iOS, web y escritorio:** `http://localhost:4000/api`.

```bash
# App del Inspector (emulador o simulador)
cd app-inspector
flutter run

# App del Cliente (emulador o simulador)
cd ../app-cliente
flutter run
```

**En un teléfono real** (misma red Wi-Fi que la computadora), pasa la IP local de la computadora (en macOS: `ipconfig getifaddr en0`):
```bash
flutter run --dart-define=API_URL=http://192.168.1.50:4000/api
```

Notas de desarrollo:
- Android permite HTTP sin TLS solo en compilaciones *debug* y *profile* (`android/app/src/debug|profile/AndroidManifest.xml`); *release* no incluye la excepción.
- iOS tiene la excepción ATS `NSAllowsLocalNetworking` para la red local (solo desarrollo).
- La app del inspector pide permiso de **ubicación** (al pulsar "Voy en camino") y de **cámara/fotos** (al capturar evidencia). En el emulador de Android puedes mover la ubicación desde *Extended controls → Location*; en el simulador de iOS, *Features → Location*.
- La app del inspector envía su ubicación cada 15 s **solo con la app en primer plano**; el envío en segundo plano queda como trabajo futuro.
- El botón de avance simulado del GPS está oculto por defecto; se activa en el perfil del inspector (icono de credencial → "Modo demo").

### 3. Ejecutar las Suites de Pruebas Automatizadas (`E07`, `E08/E09`, `E10/E11` — 28 escenarios)
```bash
npm test
```

### 4. Análisis Estático de Flutter
```bash
flutter analyze app-inspector app-cliente
```

---

## 🌿 Convención de Ramas y Flujo de Trabajo
- `main`: Rama principal protegida; solo recibe cambios vía Pull Request revisado y con pruebas en verde.
- `feat/<modulo>`: Nuevas funcionalidades por entrega (`feat/e07-agenda`, `feat/e08-notificaciones`, `feat/e10-trayecto-vivo`, `feat/e11-sincronizacion-kpi`).
- `fix/<descripcion>`: Correcciones de defectos (`fix/renderflex-overflow-ruta`).
- `docs/<entregable>`: Documentación, manuales, actas y minutas.
