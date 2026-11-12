# Comparativa Contra el Proceso Actual y Reporte Consolidado de Pruebas (Entrega E12)

**Proyecto:** AgaveAlerta — Agave Roofing (San Antonio, TX)  
**Autores:** Mario (AN), Jesús (CL) y Anuar (IN)  
**Fecha:** 19 de noviembre de 2026  

---

## 1. Comparativa Operativa: Proceso Anterior (Correo) vs. AgaveAlerta

Antes de **AgaveAlerta**, Agave Roofing notificaba las citas de inspección en San Antonio únicamente por correo electrónico sin mecanismo de confirmación ni aviso de traslado. Esto provocaba un **18% de visitas fallidas** (inspectores que recorrían 25 a 40 minutos hasta Stone Oak o Alamo Heights para encontrar el domicilio vacío), con un costo directo estimado de **\$65 USD por vuelta perdida** en combustible y horas-hombre.

Con la implantación de **AgaveAlerta**:
1. **Del correo ignorado al aviso multicanal con confirmación en 1 toque:** El motor de notificaciones envía avisos Push 24 h y 3 h antes con respaldo automático por SMS (Twilio) si el token falla, logrando elevar la **confirmación previa del 0% al 83.3%**.
2. **Reprogramación anticipada en vez de puertas cerradas:** Los clientes que no pueden asistir solicitan otro horario disponible desde la app antes de que el inspector salga (respetando **RN-05** y **RN-06**), y las citas no respondidas pasan a `SIN_CONFIRMAR` (**RN-07**) para que la oficina confirme por teléfono antes de despachar la camioneta.
3. **Cero incertidumbre el día de la visita:** El seguimiento en vivo con ETA (**E10**), la alerta automática a `< 1 km` (`POR_LLEGAR`) y el botón *"🏠 Ya estoy en mi casa"* (**E11**) eliminaron las visitas sorpresa, reduciendo las vueltas en falso en más de un **60%** durante el piloto.

---

## 2. Reporte Final Consolidado de Pruebas (Módulos 1 al 10)

| Suite / Nivel de Prueba | Archivo / Evidencia | Casos Totales | Pasaron | Fallaron | Estado Final |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Seguridad y Catálogos (E05–E06)** | `Casos-de-Prueba-Seguridad-y-Catalogos-E05-E06.md` | 9 | 9 | 0 | ✅ 100% OK |
| **Agenda y Máquina de Estados (E07)** | `api/test/agenda.test.ts` | 7 | 7 | 0 | ✅ 100% OK |
| **Notificaciones y Reprogramación (E08–E09)** | `api/test/e08_e09.test.ts` | 8 | 8 | 0 | ✅ 100% OK |
| **Trayecto Vivo, Modo Sin Señal y KPI (E10–E11)** | `api/test/e10_e11.test.ts` | 10 | 10 | 0 | ✅ 100% OK |
| **Análisis Estático Flutter (`flutter analyze`)** | `app-inspector/` y `app-cliente/` | 2 apps | 2 | 0 | ✅ 0 warnings / 0 errores |
| **TOTAL CONSOLIDADO** | **Módulos 1 al 10** | **34** | **34** | **0** | **✅ 100% APROBADO** |

---

## 3. Opinión Recogida de los Clientes Piloto (Jesús CL — E12)

Se aplicó la encuesta corta de 3 preguntas a los clientes piloto al concluir el recorrido completo:

| Cliente Piloto | Zona en San Antonio | 1. ¿Entendiste la notificación? | 2. ¿Fue fácil confirmar en 1 toque? | 3. ¿Te sirvió ver el mapa con ETA y el reporte PDF? | Comentario del Cliente |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Robert B. Martinez** | Stone Oak | Sí | Sí | Sí | *"Confirmé desde la pantalla bloqueada en 2 segundos y el PDF con fotos del techo quedó clarísimo."* |
| **Sarah Jenkins** | Alamo Heights | Sí | Sí | Sí | *"Pude pedir cambio de horario cuando tuve cita médica sin tener que llamar a la oficina."* |
| **Elena Rodriguez** | Medical Center | Sí | Sí | Sí | *"El aviso cuando el inspector estaba a menos de 1 km me dio tiempo exacto de abrir el portón."* |
