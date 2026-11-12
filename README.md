# 🌵 AgaveAlerta — Sistema Integral de Gestión, Notificación y Seguimiento de Inspecciones de Techos
**Cliente:** Agave Roofing (San Antonio, Texas)  
**Materia:** Proyecto Integrador I — UANL  
**Estado del Proyecto:** 100% Completado (`E01` a `E12` · Sprints 0 a 6)

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

- `api/` — Backend REST + SQLite/PostgreSQL (`node:sqlite`), Máquina de Estados (`RN-01` a `RN-17`), Motor de Notificaciones Push/SMS (`E08`), Reprogramaciones (`E09`), Seguimiento GPS y ETA (`E10`), Ejecución/Sincronización Idempotente e Indicadores (`E11`), Seguridad y Catálogos (`E05`/`E06`/`E12`).
- `panel/` — Panel Web de Administración (React/TypeScript + Simulador HTML interactivo) con Agenda (`E07`), Bitácora Push/SMS (`E08`), Bandeja de Reprogramaciones (`E09`), Monitor en Vivo (`E10`), Tablero Ejecutivo KPI + CSV (`E11`) y Catálogos/Seguridad (`E05`/`E06`/`E12`).
- `app-inspector/` — Aplicación Móvil del Inspector en **Flutter + Dart** (MVP) y Simulador Web, con Ruta del Día, GPS en segundo plano cada 15 s, captura de resultado con fotos (`RN-11`), cliente ausente (`RN-10`) y cola offline SQLite con sincronización idempotente (`RN-12`).
- `app-cliente/` — Aplicación Móvil del Cliente en **Flutter + Dart** (MVP) y Simulador Web, con confirmación en $\le 3$ toques, solicitud de reprogramación (`RN-05`/`RN-06`), mapa en vivo con ETA (`RN-08`/`RN-09`), aviso *"Ya estoy en mi casa"*, consulta de Reporte PDF y encuesta piloto (`E12`).
- `shared/` — Tipos de dominio, estados, DTOs y cliente HTTP compartido (`ApiClient`).
- `docs/` — Documentación normativa (`01` a `05`), manuales de usuario, matrices y reportes de pruebas, y paquetes de entrega (`E03` a `E12`).

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Sembrar la Base de Datos y Levantar la API + Simuladores Web (`Puerto 3001`)
```bash
npm run seed
npm run dev:api
```
Una vez corriendo en `http://localhost:3001`:
- **Panel de Administración:** `http://localhost:3001/panel/index.html`
- **Simulador Web App Inspector:** `http://localhost:3001/app-inspector/index.html`
- **Simulador Web App Cliente:** `http://localhost:3001/app-cliente/index.html`
- **Healthcheck API:** `http://localhost:3001/api/salud`

### 2. Ejecutar las Aplicaciones Móviles en Flutter
```bash
# App del Inspector
cd app-inspector
flutter run

# App del Cliente
cd ../app-cliente
flutter run
```

### 3. Ejecutar las Suites de Pruebas Automatizadas (`E07`, `E08/E09`, `E10/E11`)
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
