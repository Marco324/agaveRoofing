# Resultados de Ejecución de Pruebas — Sprint 5 (E10 y E11) + Regresión Completa (Módulos 1 al 8)

**Responsables de ejecución:** Jesús (CL), Anuar (IN) y Mario (AN)  
**Fecha de ejecución:** 11 de noviembre de 2026  
**Suite automatizada:** `npm test` (`api/test/agenda.test.ts`, `api/test/e08_e09.test.ts`, `api/test/e10_e11.test.ts`)  

---

## 1. Resumen de Resultados por Módulo (Módulos 1 al 8)

| Módulo | Alcance Evaluado | Casos Ejecutados | Aprobados | Fallidos | Cobertura |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Módulos 1–3 (E07)** | Auth/Roles, Clientes/Domicilios, Agenda, RN-02 (traslapes) y RN-16 (folios) | 6 | 6 | 0 | **100%** |
| **Módulos 4–5 (E08 / E09)** | Motor de Notificaciones Push/SMS, Reintentos R4, Confirmación RN-04, Reprogramación RN-05/RN-06 y Expiración RN-07 | 8 | 8 | 0 | **100%** |
| **Módulo 6 (E10)** | Trayecto en vivo, RN-03 (1 trayecto activo), GPS cada 15s, ETA con fallback RN-09, alerta `< 1 km` y Privacidad RN-08/R7 | 6 | 6 | 0 | **100%** |
| **Módulos 7–8 (E11)** | Presencia en casa, Llegada `EN_SITIO`, Resultado con fotos RN-11, Cliente Ausente RN-10, Sincronización Offline RN-12, Mensajería y Tablero KPI + CSV | 7 | 7 | 0 | **100%** |
| **TOTAL GLOBAL** | **Congelamiento Funcional (E11)** | **27** | **27** | **0** | **100%** |

---

## 2. Bitácora de la Prueba de Campo Conjunta (Anuar IN + Jesús CL)

- **Dispositivo Inspector (`app-inspector`):** Simulación de recorrido desde base norte hacia Medical Center (`INS-2026-000012`) y Stone Oak (`INS-2026-000010`).
- **Dispositivo Cliente (`app-cliente`):** Recepción verificada del aviso `EN_CAMINO`, visualización fluida del pin del inspector y actualización del ETA de 12 min a 2 min al acercarse a `< 1 km` (`POR_LLEGAR`).
- **Prueba de Modo Sin Señal (RN-12):** Se desconectó la señal durante la captura de llegada, 2 fotografías de cubierta y el dictamen técnico. Al reconectar y ejecutar `POST /api/sincronizar`, las 3 operaciones se aplicaron en orden cronológico sin duplicados ni pérdida de fotografías.
- **Defectos Críticos o Altos Abiertos al Cierre de E11:** **0 defectos abiertos** (cumple el criterio de aceptación de Congelamiento Funcional).
