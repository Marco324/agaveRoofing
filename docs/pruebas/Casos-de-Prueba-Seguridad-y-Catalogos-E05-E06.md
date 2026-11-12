# Casos de Prueba de Seguridad (E05) y Catálogos Operativos (E06)

**Proyecto:** AgaveAlerta — Agave Roofing (San Antonio, TX)  
**Autores:** Mario (AN) y Jesús (CL)  

---

## 1. Casos de Prueba del Módulo de Seguridad, Roles y RLS (E05)

| ID Caso | Requerimiento / Regla | Escenario de Prueba | Entrada | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-E05-01** | RF-01 · Auth Admin | Inicio de sesión válido en el Panel Web | `correo: marco@agaveroofing.com`, `rol: ADMINISTRADOR` | HTTP `200`, devuelve JWT y registra evento `LOGIN_EXITOSO` en tabla `bitacora` | ✅ Aprobado |
| **CP-E05-02** | RF-02 · Guarda de Rol | Intento de acceso al Panel con cuenta de `INSPECTOR` o `CLIENTE` | `correo: carlos.garza@agaveroofing.com`, `exigirRol: ADMINISTRADOR` | HTTP `403 Forbidden` con código `ACCESO_DENEGADO_ROL_E05` | ✅ Aprobado |
| **CP-E05-03** | RF-03 · Login OTP Cliente | Ingreso del cliente mediante teléfono y código OTP de 6 dígitos | `telefono: +1-210-555-0201` | HTTP `200`, sesión persistente creada y acceso exclusivo a sus propias citas | ✅ Aprobado |
| **CP-E05-04** | Seguridad RLS (`setup_rls.sql`) | Aislamiento de datos entre clientes y entre inspectores | Cliente #1 consulta `/api/inspecciones/mias?idCliente=1` | Solo recibe las inspecciones pertenecientes a `id_cliente = 1` | ✅ Aprobado |

---

## 2. Casos de Prueba del Módulo de Catálogos y Dispositivos (E06)

| ID Caso | Requerimiento / Regla | Escenario de Prueba | Entrada | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-E06-01** | RF-04 · Alta de Cliente | Crear nuevo cliente con canal preferido `PUSH` o `SMS` | `POST /api/clientes` con nombre, teléfono y `canalPreferido` | HTTP `201 Created`, cliente activo en catálogo | ✅ Aprobado |
| **CP-E06-02** | RN-15 · Baja Lógica | Dar de baja un cliente sin eliminar su historial de citas | `PATCH /api/clientes/:id/baja` | `activo = 0` en BD; las inspecciones históricas se conservan íntegras (**RN-15**) | ✅ Aprobado |
| **CP-E06-03** | RF-05 · Geocodificación | Alta de domicilio en San Antonio con coordenadas GPS | `POST /api/domicilios` | HTTP `201 Created` con `latitud`, `longitud` y `geocodificado = 1` | ✅ Aprobado |
| **CP-E06-04** | RF-06 · Zonas e Inspectores | Consulta de zonas de servicio y relación N:M `inspector_zona` | `GET /api/catalogos` | Devuelve las 4 zonas de San Antonio y los inspectores con sus placas y zonas asignadas | ✅ Aprobado |
| **CP-E06-05** | RF-07 · Dispositivo Push | Registro idempotente de token push en el teléfono | `POST /api/dispositivos` dos veces con el mismo `tokenPush` | No duplica el registro; actualiza `ultimo_uso` y mantiene `activo = 1` | ✅ Aprobado |
