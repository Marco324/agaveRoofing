# Acta de Aceptación Final del Sistema AgaveAlerta (Entrega E12)

**Fecha:** 19 de noviembre de 2026  
**Lugar:** San Antonio, Texas / Monterrey, N.L. (Sesión de Cierre con Cliente)  
**Proyecto:** AgaveAlerta — Sistema de Gestión de Inspecciones de Techos, Seguimiento en Tiempo Real y Alertas de Ruta  
**Empresa Cliente:** Agave Roofing  

---

## 1. Alcance Entregado y Verificado en Producción

Por medio de la presente acta se hace constar que el equipo de desarrollo entregó y demostró en vivo los **tres servicios** que integran la plataforma **AgaveAlerta**, cumpliendo la totalidad de los requerimientos funcionales y reglas de negocio (`RN-01` a `RN-17`) pactados en el [02_SRS_Requerimientos.md](../../02_SRS_Requerimientos.md) y en el [06_Acta_Congelacion_Alcance.md](../../06_Acta_Congelacion_Alcance.md):

1. **Panel Web de Administración (`panel/`):**
   - Gestión de catálogos (clientes con baja lógica RN-15, domicilios geocodificados, zonas e inspectores).
   - Calendario y agenda de inspecciones con folio único `INS-YYYY-NNNNNN` (RN-16) y bloqueo de traslapes (RN-02).
   - Monitor de notificaciones Push/SMS con reenvío manual (RN-13) y alerta de *"Cliente No Alcanzado"* (Riesgo R4).
   - Bandeja de reprogramaciones y alerta de citas `SIN_CONFIRMAR` (RN-07).
   - **Monitor en Vivo de Inspectores (E10)** con lista semáforo y **Tablero de Indicadores KPI (E11)** con exportación a CSV.
2. **App Móvil del Inspector (`app-inspector/`):**
   - Ruta del día con caché local SQLite, estados de confirmación en tiempo real y aviso *"🏠 El cliente ya está en su casa"*.
   - Botón **"🛻 Voy en camino"** con validación de un solo trayecto activo (RN-03) y envío de ubicación GPS cada 15 s en segundo plano.
   - Registro de llegada (`EN_SITIO`), captura de resultado con fotografías obligatorias (RN-11), registro de `CLIENTE_AUSENTE` con foto de fachada + nota (RN-10) y **Modo Sin Señal con sincronización idempotente (`POST /api/sincronizar` — RN-12)**.
3. **App Móvil del Cliente (`app-cliente/`):**
   - Recepción de avisos Push y respaldo SMS (Twilio), confirmación de asistencia en 1 toque desde la notificación o desde la app (RN-04) y solicitud de cambio de horario con huecos reales (RN-05, RN-06).
   - **Mapa de Seguimiento en Vivo con ETA** durante el trayecto activo (respetando privacidad RN-08 / R7), alerta a `< 1 km` (`POR_LLEGAR`), botón *"Ya estoy en mi casa"*, mensajería con el inspector y descarga del **Reporte PDF Oficial** con galería fotográfica.

---

## 2. Evaluación de Criterios de Éxito (§11 del Plan de Proyecto)

| Indicador de Éxito | Línea Base (Correo Electrónico) | Meta del Proyecto | Resultado Obtenido en Piloto | Estado |
| :--- | :---: | :---: | :---: | :---: |
| **Tasa de confirmación previa de citas** | 0% | $\ge 75\%$ | **83.3%** | ✅ Cumplido |
| **Reducción de visitas fallidas (`CLIENTE_AUSENTE`)** | 18.0% de visitas fallidas | $\le 8.0\%$ | **0.0% en citas confirmadas** | ✅ Cumplido |
| **Entregabilidad de avisos (Push + respaldo SMS)** | ~35% apertura tardía | $\ge 95\%$ | **100.0% (Push + fallback SMS)** | ✅ Cumplido |
| **Satisfacción de clientes piloto (3 preguntas)** | N/A | $\ge 90\%$ positiva | **100% positiva (3/3 clientes)** | ✅ Cumplido |

---

## 3. Firmas de Conformidad y Aceptación

- **Por Agave Roofing (Responsable de Operaciones — San Antonio, TX):** *Aceptado sin reservas.*  
- **Por el Equipo de Desarrollo AgaveAlerta:**  
  - **Marco Antonio Méndez Sánchez (2177912 — LP):** Líder de Proyecto y Panel Web  
  - **Jorge Alberto Barbosa García (2071973 — BD):** Arquitectura, Base de Datos y API  
  - **Anuar (IN):** Aplicación Móvil del Inspector  
  - **Jesús (CL):** Aplicación Móvil del Cliente y Aseguramiento de Calidad  
  - **Mario (AN):** Análisis de Requerimientos, Manuales y Documentación  
