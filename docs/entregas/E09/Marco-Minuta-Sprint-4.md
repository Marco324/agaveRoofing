# Minuta de Ceremonias Scrum — Cierre del Sprint 4 (Entrega E09)
## Sistema AgaveAlerta — Agave Roofing (San Antonio, Texas)

**Fecha de sesión:** Jueves 29 de octubre de 2026  
**Lugar / Medio:** Reunión híbrida (FIME UANL / Operaciones Agave Roofing San Antonio, TX)  
**Facilitador / PO:** Marco Antonio Méndez Sánchez (LP)  
**Asistentes:**
* Marco Antonio Méndez Sánchez (Product Owner / Scrum Master)
* Jorge Alberto Barbosa García (Arquitecto / Backend / BD)
* Anuar Guadalupe Hernández Hernández (Desarrollador App Inspector)
* Jesús Mario Bazaldúa Bustos (Desarrollador App Cliente / QA)
* Mario Martínez González (Analista / Documentación)

---

## 1. Sprint Review 4 (Revisión de las Entregas E08 y E09)

### 1.1 Objetivo del Sprint 4
Poner en producción el **Motor de Notificaciones Push con respaldo por SMS (E08)** y cerrar el ciclo de **Confirmación y Reprogramación de citas (E09)** entre el cliente, el inspector y la oficina en San Antonio, Texas.

### 1.2 Demostración del Incremento
1. **Entregabilidad de Notificaciones y Respaldo SMS (E08):**
   * Se presentaron los resultados de la bitácora del riesgo R4 (22 envíos medidos con 95.5% de alcance combinado entre Firebase Push (FCM) y Twilio SMS).
   * Se demostró el respeto al horario de silencio nocturno (`21:00` a `07:00`, **RN-14**) y el bloqueo de envíos automáticos duplicados (**RN-13**).
2. **Confirmación en 1 toque y Bandeja de Reprogramaciones (E09):**
   * Se mostró cómo el cliente confirma desde el botón `"✓ Sí estaré"` de la propia notificación sin abrir la app (**RN-04**), reflejándose al instante como `✅ Cliente confirmó asistencia` en la ruta del inspector.
   * Se demostró una solicitud de reprogramación de Sarah Jenkins (`INS-2026-000006`) eligiendo un horario real disponible en Alamo Heights, y su aprobación desde la bandeja del panel **conservando el mismo folio (`RN-06`)**.
   * Se verificaron los bloqueos de negocio cuando el inspector ya va en camino (**RN-05**), cuando se intenta una cuarta reprogramación (**RN-06**) y el paso automático a `SIN_CONFIRMAR` al vencer el plazo de 12 horas (**RN-07**).

---

## 2. Retrospectiva del Sprint 4

* **¿Qué funcionó bien?**
  * El respaldo automático por SMS resolvió los casos en que el usuario rechaza el permiso de notificaciones push en iOS/Android.
  * La vista unificada del panel permitió al administrador atender tanto las solicitudes de cambio de horario como las citas `SIN_CONFIRMAR` en una sola pantalla.
* **¿Qué podemos mejorar?**
  * El próximo Sprint 5 involucra GPS en segundo plano y Supabase Realtime en vivo entre tres integrantes la misma semana (Jorge, Anuar y Jesús).
* **Acción de mejora para el Sprint 5:**
  * Jorge dejará corriendo el script simulador de coordenadas desde el lunes del Sprint 5 para que Jesús construya el mapa del cliente en paralelo sin esperar a que Anuar termine el módulo de GPS en segundo plano.

---

## 3. Sprint Planning 5 (Arranque del Sprint 5: E10 y E11)

* **Objetivo del Sprint 5:**
  Implementar el **Trayecto y Seguimiento en Vivo con ETA en el Mapa (E10 — jueves 5 de noviembre)** y el **Registro de Llegada, Resultado con Evidencia Fotográfica, Modo Sin Señal y Tablero de Indicadores (E11 — jueves 12 de noviembre)**.
* **Compromisos para E10 (jueves 5 de noviembre):**
  * **BD (Jorge):** `iniciar_trayecto` transaccional (RN-03), recepción de puntos GPS (`POST /trayectos/:id/punto`, RN-08), publicación en Realtime, cálculo de ETA cada 60 s (RN-09), aviso `"está por llegar"` (< 1000 m) y cierre automático a los 90 min.
  * **IN (Anuar):** Botón `"Voy en camino"`, envío de ubicación en segundo plano cada 15 s y prueba de campo real de 15 min.
  * **CL (Jesús):** Mapa de seguimiento en vivo con marcador del inspector y ETA actualizado, visible únicamente durante `EN_CAMINO` (privacidad R7).
  * **LP (Marco):** Monitor en vivo en el panel con semáforo de citas de hoy y sesión de capacitación a inspectores piloto.
  * **AN (Mario):** Manual Capítulo 6 (seguimiento en vivo), guion de pruebas de campo y aviso de privacidad de ambas apps.

---

**Firma del Product Owner / Scrum Master:**  
Marco Antonio Méndez Sánchez — Equipo 01
