# Bitácora de Entregabilidad de Notificaciones — Seguimiento del Riesgo R4 (Entrega E08)
## Sistema AgaveAlerta — Agave Roofing (San Antonio, Texas)

**Responsable:** Marco Antonio Méndez Sánchez (LP — Product Owner / Scrum Master)  
**En coordinación con:** Jorge Alberto Barbosa García (BD) y Jesús Mario Bazaldúa Bustos (CL)  
**Fecha de corte:** Jueves 22 de octubre de 2026  
**Riesgo Monitoreado:** **R4 — La notificación push no llega al teléfono del cliente** (por permiso denegado, ahorro de batería agresivo, falta de datos o token vencido).

---

## 1. Metodología de Medición
Para cumplir el criterio de calidad de la **Entrega E08** (mínimo **20 envíos medidos** en distintos dispositivos y condiciones operativas), se realizaron **22 envíos controlados** hacia teléfonos Android e iOS en los tres estados de la aplicación (*Abierta / Foreground*, *Segundo Plano / Background* y *Cerrada / Killed*), así como pruebas con permiso denegado y token caducado para medir el disparo automático del respaldo por **SMS (Twilio)**.

---

## 2. Tabla de Resultados de los 22 Envíos Medidos

| # Envío | Dispositivo / OS | Rol | Tipo de Aviso | Estado de la App | Canal Inicial | ¿Llegó Push? | ¿Requirió Respaldo SMS? | Tiempo de Entrega | Resultado Final |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **01** | iPhone 15 (iOS 17.6) | Cliente | `DIA_PROGRAMADO` | Cerrada (`KILLED`) | `PUSH` | Sí | No | 1.4 s | **ENTREGADA** |
| **02** | iPhone 15 (iOS 17.6) | Cliente | `RECORDATORIO` | Segundo plano | `PUSH` | Sí | No | 1.1 s | **ENTREGADA** |
| **03** | Samsung S23 (Android 14) | Cliente | `DIA_PROGRAMADO` | Cerrada (`KILLED`) | `PUSH` | Sí | No | 1.8 s | **ENTREGADA** |
| **04** | Samsung S23 (Android 14) | Cliente | `RECORDATORIO` | Abierta (`FOREGROUND`) | `PUSH` | Sí | No | 0.8 s | **ENTREGADA** |
| **05** | Motorola G84 (Android 14) | Inspector | `CITA_ASIGNADA` | Segundo plano | `PUSH` | Sí | No | 1.5 s | **ENTREGADA** |
| **06** | Motorola G84 (Android 14) | Inspector | `REPROGRAMADA` | Cerrada (`KILLED`) | `PUSH` | Sí | No | 2.1 s | **ENTREGADA** |
| **07** | iPhone 13 (iOS 18.0) | Inspector | `CITA_ASIGNADA` | Abierta (`FOREGROUND`) | `PUSH` | Sí | No | 0.9 s | **ENTREGADA** |
| **08** | iPhone 13 (iOS 18.0) | Inspector | `CLIENTE_EN_CASA` | Segundo plano | `PUSH` | Sí | No | 1.2 s | **ENTREGADA** |
| **09** | Xiaomi Redmi Note 12 (Android 13) | Cliente | `DIA_PROGRAMADO` | Cerrada (Ahorro batería) | `PUSH` | Sí (2.º int.) | No | 8.4 s | **ENTREGADA** |
| **10** | Xiaomi Redmi Note 12 (Android 13) | Cliente | `RECORDATORIO` | Segundo plano | `PUSH` | Sí | No | 1.9 s | **ENTREGADA** |
| **11** | iPhone 14 Pro (iOS 17.5) | Cliente | `DIA_PROGRAMADO` | Pantalla bloqueada | `PUSH` | Sí | No | 1.3 s | **ENTREGADA** |
| **12** | iPhone 14 Pro (iOS 17.5) | Cliente | `REPROGRAMADA` | Cerrada (`KILLED`) | `PUSH` | Sí | No | 1.6 s | **ENTREGADA** |
| **13** | Google Pixel 7 (Android 14) | Cliente | `DIA_PROGRAMADO` | Segundo plano | `PUSH` | Sí | No | 1.0 s | **ENTREGADA** |
| **14** | Google Pixel 7 (Android 14) | Cliente | `RECORDATORIO` | Cerrada (`KILLED`) | `PUSH` | Sí | No | 1.4 s | **ENTREGADA** |
| **15** | iPhone 12 (Permiso Push Denegado) | Cliente | `DIA_PROGRAMADO` | Sin permiso Push | `SMS` | N/A | **Sí (Automático)** | 3.2 s | **ENTREGADA (SMS)** |
| **16** | Samsung A54 (Permiso Push Denegado) | Cliente | `RECORDATORIO` | Sin permiso Push | `SMS` | N/A | **Sí (Automático)** | 2.9 s | **ENTREGADA (SMS)** |
| **17** | iPhone 15 (Token Vencido / Reinstalación) | Cliente | `RECORDATORIO` | Token inválido | `PUSH ➔ SMS` | No (`DeviceNotRegistered`) | **Sí (Respaldo Twilio)** | 4.1 s | **ENTREGADA (SMS)** |
| **18** | Samsung S23 (Modo Avión temporal) | Cliente | `DIA_PROGRAMADO` | Sin red (Reintento 2/3) | `PUSH` | Sí (al reconectar) | No | 22.0 s | **ENTREGADA** |
| **19** | iPhone 13 (Horario nocturno 22:45) | Cliente | `DIA_PROGRAMADO` | Cerrada (`KILLED`) | `PUSH` | Sí (07:00 AM RN-14) | No | Diferida 07:00 | **ENTREGADA** |
| **20** | iPhone 13 (Horario nocturno 22:45) | Cliente | `EN_CAMINO` (Urgente) | Pantalla bloqueada | `PUSH` | Sí (Inmediata RN-14) | No | 1.2 s | **ENTREGADA** |
| **21** | Teléfono Comercial (Preferencia SMS) | Cliente | `DIA_PROGRAMADO` | Sin app instalada | `SMS` | N/A | **Sí (Canal preferido)** | 2.7 s | **ENTREGADA (SMS)** |
| **22** | Línea desconectada / Buzón lleno | Cliente | `DIA_PROGRAMADO` | Apagado permanentemente | `SMS` | No | Falló tras 3 intentos | — | **FALLIDA (Alerta en Panel)** |

---

## 3. Conclusiones e Indicadores de Mitigación del Riesgo R4

* **Total de envíos medidos:** **22 envíos** en 7 modelos de teléfonos distintos (iOS y Android).
* **Entregadas por Push al primer o segundo intento:** **17 de 18** intentos con permiso activo (**94.4% de efectividad Push**).
* **Respaldos por SMS activados con éxito:** **4 envíos** rescatados automáticamente por **Twilio SMS** cuando el cliente negó el permiso de notificaciones o el token había vencido.
* **Tasa de alcance combinada (Push + Respaldo SMS):** **21 de 22 (95.5%)**.
* **Manejo del 4.5% restante (Caso #22):** El único caso donde fallaron los 3 intentos activó automáticamente la **Alerta de "Cliente no alcanzado"** en el Panel de Administración para contacto telefónico directo, garantizando que ninguna inspección se quede sin aviso.
