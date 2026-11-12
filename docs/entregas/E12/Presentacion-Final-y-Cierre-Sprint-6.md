# Presentación Final, Guion de Demostración en Vivo y Cierre del Proyecto (Entrega E12)

**Responsable:** Marco Antonio Méndez Sánchez (LP — Matrícula 2177912)  
**Fecha:** Jueves 19 de noviembre de 2026 (Sprint 6 — Entrega Final)  

---

## 1. Estructura de Diapositivas para la Defensa Final (15 minutos)

1. **Diapositiva 1 — El Problema en Agave Roofing (San Antonio, TX):**
   - Notificaciones solo por correo electrónico $\rightarrow$ **0% de confirmación previa** y **18% de visitas fallidas** (\$65 USD perdidos por traslado fallido).
2. **Diapositiva 2 — La Solución AgaveAlerta (3 Aplicaciones + 1 API Central):**
   - Panel Web de Administración (`panel`), App Móvil del Inspector (`app-inspector`) y App Móvil del Cliente (`app-cliente`).
3. **Diapositiva 3 — Reglas de Negocio Críticas y Mitigación de Riesgos:**
   - Máquina de 11 estados (**RN-01**), bloqueo de traslapes (**RN-02**), respaldo automático Push $\rightarrow$ SMS (**Riesgo R4**), privacidad GPS estricta solo durante `EN_CAMINO` (**RN-08 / R7**) y cola offline idempotente por `id_local` (**RN-12**).
4. **Diapositiva 4 — Demostración en Vivo de Punta a Punta (5 minutos):**
   - Recorrido completo en tiempo real entre las 3 pantallas.
5. **Diapositiva 5 — Resultados del Tablero KPI vs. Línea Base y Trabajo Futuro:**
   - **83.3% de confirmación previa**, **100% de entregabilidad** (Push + SMS) y reducción de visitas fallidas.

---

## 2. Guion Paso a Paso para la Demostración en Vivo

1. **Levantar el entorno:**
   ```bash
   npm run seed && npm run api
   ```
2. **Paso 1 — Panel de Administración (`panel/index.html`):**
   - Mostrar la **Agenda (E07)**, las **Bandejas de Notificaciones y Reprogramaciones (E08/E09)** y abrir el **Monitor en Vivo (E10)**.
3. **Paso 2 — App del Inspector (`app-inspector/simulador_web/index.html` o app Flutter):**
   - Seleccionar la parada confirmada (`INS-2026-000010`) y presionar **"🛻 Voy en camino"**.
   - Mostrar cómo se activa el envío de GPS cada 15 s y cómo el Monitor del Panel actualiza el pin del inspector.
4. **Paso 3 — App del Cliente (`app-cliente/simulador_web/index.html` o app Flutter):**
   - Mostrar la notificación urgente recibida, el **Mapa en Vivo con ETA**, simular el acercamiento a `< 1 km` (`POR_LLEGAR`) y presionar **"🏠 Ya estoy en mi casa"**.
5. **Paso 4 — Llegada, Modo Sin Señal y Reporte PDF (E11):**
   - En la App del Inspector, presionar **"📍 Llegué"** (el mapa del cliente se apaga por privacidad **RN-08**).
   - Activar **"✈️ Modo Sin Señal"**, capturar el dictamen del techo con 2 fotografías (**RN-11**) y luego presionar **"🔄 Sincronizar"** (**RN-12**).
   - En la App del Cliente, abrir el **Reporte PDF Oficial** recién generado y finalizar mostrando el **Tablero KPI (E11)** en el Panel Web.

---

## 3. Retrospectiva Final y Cierre del Proyecto (Sprint 6)

- **Logros del equipo:** Los 5 integrantes (Marco LP, Jorge BD, Anuar IN, Jesús CL y Mario AN) completaron las 12 entregas semanales (`E01` a `E12`) con trazabilidad completa entre requerimientos, base de datos, código, pruebas automatizadas y manuales.
- **Estado del repositorio:** Cerrado, documentado y con **100% de pruebas en verde (`npm test` y `flutter analyze`)**.
