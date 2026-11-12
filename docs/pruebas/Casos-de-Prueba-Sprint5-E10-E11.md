# Matriz Completa de Casos de Prueba (Módulos 1 al 10) y Guion de Prueba de Campo — Sprint 5 (E10 y E11)

**Proyecto:** AgaveAlerta — Agave Roofing (San Antonio, TX)  
**Autores:** Mario (AN) y Jesús (CL)  
**Fecha:** 11 de noviembre de 2026  

---

## 1. Matriz de Casos de Prueba del Sprint 5 (Módulos 6, 7 y 8: Seguimiento, Ejecución, Modo Sin Señal y Tablero)

| ID Caso | Módulo / RF / RN | Descripción | Precondición | Pasos | Resultado Esperado | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-E10-01** | Módulo 6 · RF-14 · RN-01 | Iniciar trayecto ("Voy en camino") y notificación urgente al cliente | Cita en estado `CONFIRMADA` (`INS-2026-000010`) | 1. Inspector toca "Voy en camino" (`POST /api/inspecciones/10/trayecto`) | Cita pasa a `EN_CAMINO`, se crea registro `ACTIVO` en `trayecto` y notificación `EN_CAMINO` entregada | Alta |
| **CP-E10-02** | Módulo 6 · RN-03 | Bloqueo de segundo trayecto simultáneo para un mismo inspector | Inspector ya tiene un trayecto `ACTIVO` | 1. Intentar iniciar trayecto en otra cita del mismo inspector | HTTP `409 Conflict` con mensaje de regla **RN-03** (índice único `ux_trayecto_activo`) | Alta |
| **CP-E10-03** | Módulo 6 · RN-08 · RN-09 · RN-02 | Ingesta GPS cada 15 s, cálculo de ETA y disparo único de `POR_LLEGAR` (< 1 km) | Cita `EN_CAMINO` con trayecto activo | 1. Enviar coordenada a > 1 km<br>2. Enviar dos coordenadas a < 1 km | Se calcula ETA; al cruzar < 1 km se envía exactamente 1 notificación `POR_LLEGAR` sin duplicarse | Alta |
| **CP-E10-04** | Módulo 6 · RN-08 · R7 | Privacidad de ubicación: mapa oculto fuera de `EN_CAMINO` | Cita en `CONFIRMADA` o `EN_SITIO` | 1. Consultar `GET /api/inspecciones/:id/seguimiento` | Devuelve `activo: false` y `posicionInspector: null` protegiendo la privacidad del inspector | Alta |
| **CP-E10-05** | Módulo 6 · Riesgo R5 | Corte automático de trayectos olvidados (> 90 minutos) | Trayecto activo con más de 90 min desde `iniciado_en` | 1. Ejecutar `POST /api/temporizadores/cerrar-trayectos` | El trayecto pasa a `CERRADO_AUTO` evitando consumo indefinido de batería y GPS | Media |
| **CP-E11-01** | Módulo 7 · RF-17 | Confirmación de presencia del cliente ("Ya estoy en mi casa") | Cita del día en `CONFIRMADA` o `EN_CAMINO` | 1. Cliente presiona "Ya estoy en mi casa" (`POST /api/inspecciones/:id/presencia`) | Se registra `PRESENCIA_CONFIRMADA` en historial y la app del inspector muestra el aviso `clienteEnCasa = true` | Media |
| **CP-E11-02** | Módulo 7 · RN-11 | Bloqueo de cierre de inspección sin fotografía de evidencia | Cita en estado `EN_SITIO` | 1. Enviar `POST /api/inspecciones/:id/resultado` con `evidencias: []` | HTTP `422` exigiendo al menos 1 fotografía obligatoria (**RN-11**) | Alta |
| **CP-E11-03** | Módulo 7 · RF-18 · RN-11 | Captura completa de resultado con fotos y generación de Reporte PDF | Cita en `EN_SITIO` con >= 1 foto | 1. Guardar resultado (`estadoTecho`, `hallazgos`, `urgencia`, `recomendaciones`, `evidencias`) | Cita pasa a `COMPLETADA`, se genera `/reporte-html` y se envía push `RESULTADO` al cliente | Alta |
| **CP-E11-04** | Módulo 7 · RN-10 | Registro de `CLIENTE_AUSENTE` con foto de fachada y nota obligatoria | Cita en `EN_CAMINO` o `EN_SITIO` | 1. Intentar sin foto (rechaza 422)<br>2. Enviar con foto de fachada y nota | Cita pasa a `CLIENTE_AUSENTE`, trayecto se cierra y queda evidencia fotográfica en expediente | Alta |
| **CP-E11-05** | Módulo 7 · RN-12 | Sincronización offline idempotente (`POST /api/sincronizar`) | Inspector captura llegada, foto y resultado sin señal | 1. Enviar lote con `idLocal` a `/api/sincronizar`<br>2. Reenviar el mismo lote por segunda vez | Primera llamada aplica cambios; segunda llamada detecta `id_local` ya sincronizado y no duplica registros | Alta |
| **CP-E11-06** | Módulo 8 · RF-20 · RN-17 | Tablero de indicadores KPI, exportación CSV y purga GPS > 30 días | Datos semilla de E07 a E11 cargados | 1. Consultar `/api/panel/indicadores` y `/api/panel/indicadores/csv`<br>2. Ejecutar `/api/mantenimiento/purgar-puntos` | Devuelve las 6 tarjetas operativas, descarga CSV válido y elimina puntos GPS con antigüedad > 30 días | Media |

---

## 2. Guion de Prueba de Campo en San Antonio / Monterrey (E10 y Ensayo E12)

1. **Preparación (08:30 AM):**
   - El administrador abre el **Panel Web** en la pestaña **Monitor en Vivo (E10)** para la fecha `2026-11-12`.
   - El inspector (Anuar) abre la **App del Inspector** y verifica que su ruta esté sincronizada en caché SQLite.
   - El cliente (Jesús) abre la **App del Cliente** con su sesión activa.
2. **Paso 1 — Inicio de Trayecto (E10):**
   - El inspector presiona **"🛻 Voy en camino"**.
   - El cliente verifica la recepción inmediata de la notificación push y abre el **Mapa en Vivo con ETA**.
3. **Paso 2 — Traslado y Alerta < 1 km (`POR_LLEGAR`):**
   - Durante el recorrido (cada 15 s), el pin del inspector avanza en el mapa del cliente y en el monitor del panel.
   - Al cruzar el umbral de 1 km del domicilio, el cliente recibe la alerta urgente **`POR_LLEGAR`** y presiona **"🏠 Ya estoy en mi casa"**.
4. **Paso 3 — Llegada, Modo Sin Señal y Captura de Resultado (E11):**
   - El inspector presiona **"📍 Llegué"** (se verifica que el mapa del cliente apague el GPS por privacidad **RN-08**).
   - El inspector activa **Modo Sin Señal**, captura el estado del techo (`REGULAR`), hallazgos y 2 fotografías (**RN-11**).
   - Al desactivar el Modo Sin Señal y presionar **"🔄 Sincronizar"**, el reporte se sube a la API sin duplicados (**RN-12**) y el cliente abre su **Reporte PDF Oficial**.
