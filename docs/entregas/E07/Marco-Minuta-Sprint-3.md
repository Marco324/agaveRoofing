# Minuta de Ceremonias Scrum — Cierre del Sprint 3 (Entrega E07)
## Sistema AgaveAlerta — Agave Roofing (San Antonio, Texas)

**Fecha de sesión:** Jueves 15 de octubre de 2026  
**Lugar / Medio:** Reunión híbrida (FIME UANL / Sesión con Operaciones de San Antonio)  
**Facilitador / PO:** Marco Antonio Méndez Sánchez (LP)  
**Asistentes:**
* Marco Antonio Méndez Sánchez (Product Owner / Scrum Master)
* Jorge Alberto Barbosa García (Arquitecto / Backend / BD)
* Anuar Guadalupe Hernández Hernández (Desarrollador App Inspector)
* Jesús Mario Bazaldúa Bustos (Desarrollador App Cliente / QA)
* Mario Martínez González (Analista / Documentación)
* Interlocutor de Operaciones — Agave Roofing (San Antonio, TX)

---

### 1. Sprint Review 3 (Revisión del Incremento)

#### 1.1 Objetivo del Sprint 3
Completar la gestión de clientes, domicilios en San Antonio, inspectores, zonas de cobertura y el módulo central de **Agenda de Inspecciones con validación estricta de traslapes (RN-02)**.

#### 1.2 Incremento Demostrado en Vivo (Demo Intermedia)
1. **Catálogos y Cobertura:**
   * Visualización de las 4 zonas de servicio en San Antonio: *Stone Oak*, *Alamo Heights*, *Southtown* y *Medical Center*.
   * Domicilios georreferenciados con coordenadas y notas de acceso.
2. **Programación y Regla RN-02:**
   * Se demostró la creación en vivo de una inspección en Stone Oak para el inspector Carlos Garza.
   * Se forzó un intento de traslape horario en la misma ventana; el sistema **bloqueó la creación de inmediato con alerta visual clara**, cumpliendo con la regla RN-02 y evitando duplicación de citas.
3. **Máquina de Estados y Folio Único:**
   * Comprobación del folio automático `INS-2026-XXXXXX` que permanece inmutable ante reprogramaciones.
   * Demostración de la auditoría en `inspeccion_historial` que registra cada cambio de estado, hora y usuario.
4. **Retroalimentación de Agave Roofing:**
   * *"El bloqueo de traslapes nos ahorrará múltiples llamadas y reprogramaciones imprevistas en San Antonio. La asignación por zonas facilita enormemente el despacho."*
   * **Aprobación:** El cliente dio por aceptado el incremento de la demo intermedia.

---

### 2. Retrospectiva del Sprint 3

* **¿Qué funcionó bien?**
  * La comunicación técnica entre Jorge (Backend) y los desarrolladores móviles (Anuar y Jesús) permitió consumir los contratos de `shared/` sin discrepancias de tipos.
  * La integración de SQLite nativo permitió validar rápidamente las transiciones de estados y las pruebas automatizadas.
* **¿Qué podemos mejorar?**
  * Asegurarse de que las pruebas en teléfonos reales comiencen desde el martes de cada sprint para no saturar el miércoles previo a la entrega.
* **Acciones de mejora para el Sprint 4:**
  * Configurar los tokens de prueba de Expo Push Notifications desde el inicio del Sprint 4.

---

### 3. Sprint Planning 4 (Arranque del Sprint 4: E08 y E09)

* **Objetivo del Sprint 4:**
  Implementar el **Motor de Notificaciones Push**, el registro de dispositivos móviles (Expo Push Tokens), los tres momentos de aviso (día programado, recordatorio previo y proximidad), el respaldo por SMS, y la confirmación/reprogramación directa por parte del cliente.
* **Historias de Usuario comprometidas para E08 (jueves 22 de octubre):**
  * **HU-12:** Registro de tokens de dispositivo en la base de datos (Jorge, Anuar, Jesús).
  * **HU-13:** Despachador de notificaciones push automáticas (Jorge).
  * **HU-14:** Recepción y botones de acción rápida (*Confirmar* / *Reprogramar*) en la app del cliente (Jesús).
  * **HU-15:** Alertas de citas asignadas y cambios en la app del inspector (Anuar).
  * **HU-16:** Bitácora de entregabilidad en el panel de administración (Marco).

---

**Firma del Product Owner / Scrum Master:**  
Marco Antonio Méndez Sánchez — Equipo 01
