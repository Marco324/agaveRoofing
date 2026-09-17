# Diagramas UML
## Sistema de Alerta y Seguimiento de Inspecciones de Techo — Agave Roofing (AgaveAlerta)

**Universidad Autónoma de Nuevo León — FIME**
**Proyecto Integrador I — Equipo 01 — Agosto–Diciembre 2026**

Los diagramas se escriben en **Mermaid** para que se rendericen dentro de Obsidian y del repositorio. Los casos de uso corresponden a los definidos en `02_SRS_Requerimientos.md` §3.5 y las clases al modelo de `03_Diseno_Base_de_Datos.md`.

---

## 1. Diagrama de Casos de Uso

### 1.1 General del sistema

```mermaid
flowchart TB
    ADM(["Administrador<br/>(panel web)"])
    INS(["Inspector<br/>(app movil)"])
    CLI(["Cliente<br/>(app movil)"])
    SIS(["Sistema<br/>(temporizador)"])
    MAPS(["Google Directions<br/>(actor externo)"])
    PUSH(["Expo Push / Twilio<br/>(actor externo)"])

    subgraph S["Sistema AgaveAlerta"]
        CU01["CU-01 Iniciar sesion"]
        CU02["CU-02 Gestionar usuarios e inspectores"]
        CU03["CU-03 Gestionar clientes y domicilios"]
        CU04["CU-04 Gestionar zonas de servicio"]
        CU05["CU-05 Programar inspeccion"]
        CU06["CU-06 Reasignar / mover / cancelar"]
        CU07["CU-07 Consultar agenda y estados"]
        CU08["CU-08 Registrar dispositivo"]
        CU09["CU-09 Notificar dia programado"]
        CU10["CU-10 Confirmar disponibilidad"]
        CU11["CU-11 Solicitar reprogramacion"]
        CU12["CU-12 Aprobar / rechazar reprogramacion"]
        CU13["CU-13 Notificar recordatorio previo"]
        CU14["CU-14 Marcar sin confirmar"]
        CU15["CU-15 Consultar ruta del dia"]
        CU16["CU-16 Iniciar trayecto y avisar"]
        CU17["CU-17 Seguir la llegada en el mapa"]
        CU18["CU-18 Confirmar presencia en casa"]
        CU19["CU-19 Registrar llegada"]
        CU20["CU-20 Registrar resultado"]
        CU21["CU-21 Registrar cliente ausente"]
        CU22["CU-22 Sincronizar sin senal"]
        CU23["CU-23 Comunicarse"]
        CU24["CU-24 Consultar reporte"]
        CU25["CU-25 Consultar tablero"]
        CU26["CU-26 Configurar el sistema"]
    end

    ADM --- CU01
    ADM --- CU02
    ADM --- CU03
    ADM --- CU04
    ADM --- CU05
    ADM --- CU06
    ADM --- CU07
    ADM --- CU12
    ADM --- CU24
    ADM --- CU25
    ADM --- CU26

    INS --- CU01
    INS --- CU08
    INS --- CU15
    INS --- CU16
    INS --- CU19
    INS --- CU20
    INS --- CU21
    INS --- CU22
    INS --- CU23

    CLI --- CU01
    CLI --- CU08
    CLI --- CU10
    CLI --- CU11
    CLI --- CU17
    CLI --- CU18
    CLI --- CU23
    CLI --- CU24

    SIS --- CU09
    SIS --- CU13
    SIS --- CU14

    CU09 --- PUSH
    CU13 --- PUSH
    CU16 --- PUSH
    CU16 --- MAPS
    CU17 --- MAPS
```

### 1.2 Relaciones «include» / «extend»

```mermaid
flowchart LR
    CU05["CU-05 Programar inspeccion"] -->|include| VAL["Validar traslape de ventana (RN-02)"]
    CU05 -->|include| GEO["Geocodificar domicilio"]
    CU05 -->|include| FOL["Asignar folio"]

    CU09["CU-09 Notificar dia programado"] -->|include| SEL["Seleccionar canal y plantilla"]
    CU09 -->|extend| RESP["Respaldo por SMS / correo si la push falla"]

    CU10["CU-10 Confirmar disponibilidad"] -->|extend| DESDE["Confirmar desde la notificacion (sin abrir la app)"]

    CU11["CU-11 Solicitar reprogramacion"] -->|include| HOR["Consultar horarios disponibles"]
    CU11 -->|include| LIM["Validar limite de 3 reprogramaciones (RN-06)"]
    CU12["CU-12 Aprobar reprogramacion"] -->|include| CU05

    CU16["CU-16 Iniciar trayecto"] -->|include| ETA["Calcular ETA"]
    CU16 -->|include| PUB["Abrir canal de ubicacion en vivo"]
    CU16 -->|include| CU09
    CU16 -->|extend| ETAAP["ETA aproximado si falla el servicio de rutas (RN-09)"]

    CU17["CU-17 Seguir la llegada"] -->|include| ETA
    CU17 -->|extend| POR["Aviso 'esta por llegar' a menos de 1 km"]

    CU19["CU-19 Registrar llegada"] -->|include| CIERRA["Cerrar trayecto y calcular resumen"]
    CU20["CU-20 Registrar resultado"] -->|include| EVI["Adjuntar evidencia fotografica (RN-11)"]
    CU20 -->|extend| CU22["CU-22 Encolar si no hay senal"]
    CU21["CU-21 Cliente ausente"] -->|include| EVI
    CU21 -->|extend| REINT["Crear inspeccion de reintento (RN-10)"]
```

### 1.3 Descripción de actores

| Actor | Tipo | Descripción | Servicio que usa |
|-------|------|-------------|------------------|
| **Administrador** | Humano primario | Coordinador de operaciones de Agave Roofing. Programa, asigna, vigila y mide. | Panel web |
| **Inspector** | Humano primario | Personal de campo que revisa el techo. Trabaja de pie, a la intemperie y a veces sin señal. | App móvil del inspector |
| **Cliente** | Humano primario | Propietario de la vivienda. Alfabetización digital muy variable: debe poder confirmar con un toque. | App móvil del cliente |
| **Sistema (temporizador)** | Sistema interno | Tareas programadas de la API: dispara los avisos, marca las citas sin confirmar, purga los puntos GPS y cierra trayectos olvidados. | API |
| **Expo Push / FCM / APNs** | Sistema externo | Entrega las notificaciones al teléfono. No garantiza la entrega (RES-05). | API |
| **Twilio / Resend** | Sistema externo | Canales de respaldo: SMS y correo. | API |
| **Google Directions / Maps** | Sistema externo | Ruta y tiempo estimado de llegada; mapa en ambas apps. | API y apps |
| **Supabase Auth / Realtime / Storage** | Sistema externo | Identidad, canal de ubicación en vivo y almacenamiento de fotos y PDF. | Todos |

---

## 2. Diagrama de Clases

### 2.1 Modelo de dominio

```mermaid
classDiagram
    class Usuario {
        +UUID idUsuario
        +UUID authUid
        +String nombreCompleto
        +String correo
        +String telefono
        +boolean activo
        +tieneRol(nombre) boolean
    }

    class Rol {
        +int idRol
        +String nombre
    }

    class Cliente {
        +int idCliente
        +String nombre
        +String telefono
        +String canalPreferido
        +boolean activo
        +domicilioPrincipal() Domicilio
    }

    class Domicilio {
        +int idDomicilio
        +String calle
        +String numero
        +String colonia
        +String codigoPostal
        +Decimal latitud
        +Decimal longitud
        +boolean geocodificado
        +coordenadasValidas() boolean
        +direccionCompleta() String
    }

    class Zona {
        +int idZona
        +String nombre
        +inspectoresDisponibles(fecha) List~Inspector~
    }

    class Inspector {
        +int idInspector
        +String nombre
        +String telefono
        +String placaVehiculo
        +tieneTrayectoActivo() boolean
        +agendaDelDia(fecha) List~Inspeccion~
    }

    class Inspeccion {
        +long idInspeccion
        +String folio
        +Date fechaProgramada
        +Time ventanaInicio
        +Time ventanaFin
        +EstadoInspeccion estado
        +int vecesReprogramada
        +DateTime confirmadoEn
        +DateTime presenciaConfirmadaEn
        +puedeTransicionarA(estado) boolean
        +confirmar() void
        +cancelar(motivo) void
        +estaEnCurso() boolean
    }

    class InspeccionHistorial {
        +long idHistorial
        +String estadoAnterior
        +String estadoNuevo
        +String origen
        +DateTime ocurridoEn
    }

    class Reprogramacion {
        +long idReprogramacion
        +Date fechaSolicitada
        +String motivo
        +String solicitadaPor
        +String estado
        +aprobar(admin) Inspeccion
        +rechazar(admin, motivo) void
    }

    class Dispositivo {
        +long idDispositivo
        +String tokenPush
        +String plataforma
        +boolean activo
        +desactivar() void
    }

    class Notificacion {
        +long idNotificacion
        +TipoNotificacion tipo
        +String canal
        +String destinatario
        +String estado
        +int intentos
        +DateTime programadaPara
        +marcarEnviada() void
        +marcarFallida(error) void
        +debeReintentar() boolean
    }

    class PlantillaNotificacion {
        +int idPlantilla
        +TipoNotificacion tipo
        +String canal
        +String cuerpo
        +boolean urgente
        +render(datos) String
    }

    class Trayecto {
        +long idTrayecto
        +String estado
        +DateTime iniciadoEn
        +DateTime finalizadoEn
        +int etaActualS
        +boolean etaAproximado
        +int distanciaM
        +int duracionS
        +publicarPunto(lat, lng) void
        +recalcularEta() int
        +cerrar(motivo) void
    }

    class PuntoUbicacion {
        +long idPunto
        +Decimal latitud
        +Decimal longitud
        +int precisionM
        +DateTime capturadoEn
    }

    class ResultadoInspeccion {
        +long idResultado
        +String estadoTecho
        +String hallazgos
        +boolean requiereReparacion
        +String urgencia
        +UUID idLocal
        +boolean registradoSinSenal
        +generarReportePdf() String
    }

    class Evidencia {
        +long idEvidencia
        +String tipo
        +String rutaArchivo
        +UUID idLocal
        +DateTime capturadaEn
        +subir() void
    }

    class Mensaje {
        +long idMensaje
        +String texto
        +DateTime enviadoEn
        +DateTime leidoEn
        +marcarLeido() void
    }

    class Configuracion {
        +String clave
        +String valor
        +obtenerInt(clave) int
    }

    Rol "1" --> "*" Usuario
    Usuario "1" --> "0..1" Cliente
    Usuario "1" --> "0..1" Inspector
    Usuario "1" --> "*" Dispositivo
    Cliente "1" --> "*" Domicilio
    Zona "1" --> "*" Domicilio
    Inspector "*" --> "*" Zona
    Cliente "1" --> "*" Inspeccion
    Domicilio "1" --> "*" Inspeccion
    Inspector "1" --> "*" Inspeccion
    Inspeccion "1" --> "*" InspeccionHistorial
    Inspeccion "1" --> "*" Reprogramacion
    Inspeccion "1" --> "*" Notificacion
    PlantillaNotificacion "1" --> "*" Notificacion
    Dispositivo "1" --> "*" Notificacion
    Inspeccion "1" --> "*" Trayecto
    Trayecto "1" --> "*" PuntoUbicacion
    Inspeccion "1" --> "0..1" ResultadoInspeccion
    Inspeccion "1" --> "*" Evidencia
    Inspeccion "1" --> "*" Mensaje
    Inspeccion "0..1" --> "*" Inspeccion : origina reintento
```

### 2.2 Arquitectura por capas

```mermaid
classDiagram
    direction TB

    class AppCliente {
        <<React Native / Expo>>
        +PantallaMisCitas
        +PantallaDetalleCita
        +PantallaSeguimientoMapa
        +PantallaReprogramar
        +PantallaReporte
    }
    class AppInspector {
        <<React Native / Expo>>
        +PantallaRutaDelDia
        +PantallaNavegacion
        +PantallaCapturaResultado
        +PantallaContacto
    }
    class PanelAdmin {
        <<React + Vite>>
        +PaginaAgenda
        +PaginaClientes
        +PaginaInspectores
        +PaginaReprogramaciones
        +PaginaTablero
    }

    class ApiClient {
        <<compartido>>
        +get(ruta) Promise
        +post(ruta, cuerpo) Promise
        +adjuntarToken(jwt) void
    }
    class ServicioNotificaciones {
        <<app>>
        +registrarDispositivo() String
        +manejarAccion(accion) void
    }
    class ServicioUbicacion {
        <<app inspector>>
        +iniciarSeguimiento(idTrayecto) void
        +detener() void
    }
    class ColaLocal {
        <<app inspector - SQLite>>
        +encolar(operacion) void
        +pendientes() List
        +sincronizar() Resultado
    }
    class CanalRealtime {
        <<app cliente>>
        +suscribir(idInspeccion) void
        +alRecibirPunto(cb) void
    }

    class RutasExpress {
        <<API>>
        +/auth
        +/clientes
        +/inspecciones
        +/trayectos
        +/notificaciones
        +/indicadores
    }
    class MiddlewareAuth {
        <<API>>
        +verificarJwt(req) Usuario
        +exigirRol(rol) void
    }
    class ServicioAgenda {
        <<API>>
        +programar(datos) Inspeccion
        +validarTraslape(...) boolean
        +horariosDisponibles(fecha, zona) List
    }
    class MaquinaEstados {
        <<API>>
        +transicionar(inspeccion, nuevo, actor) void
        +esValida(actual, nuevo) boolean
    }
    class MotorNotificaciones {
        <<API>>
        +programarAvisos(inspeccion) void
        +despachar() void
        +reintentar(notificacion) void
        +respaldar(notificacion) void
    }
    class ServicioTrayecto {
        <<API>>
        +iniciar(idInspeccion) Trayecto
        +registrarPunto(punto) void
        +calcularEta(origen, destino) int
        +cerrar(idTrayecto, motivo) void
    }
    class ServicioSincronizacion {
        <<API>>
        +aplicarLote(operaciones) Resultado
        +esDuplicado(idLocal) boolean
    }
    class RepositorioPrisma {
        <<API>>
        +inspeccion
        +trayecto
        +notificacion
    }

    AppCliente --> ApiClient
    AppCliente --> ServicioNotificaciones
    AppCliente --> CanalRealtime
    AppInspector --> ApiClient
    AppInspector --> ServicioUbicacion
    AppInspector --> ColaLocal
    AppInspector --> ServicioNotificaciones
    PanelAdmin --> ApiClient

    ApiClient --> RutasExpress
    RutasExpress --> MiddlewareAuth
    RutasExpress --> ServicioAgenda
    RutasExpress --> ServicioTrayecto
    RutasExpress --> ServicioSincronizacion
    ServicioAgenda --> MaquinaEstados
    ServicioAgenda --> MotorNotificaciones
    ServicioTrayecto --> MaquinaEstados
    ServicioTrayecto --> MotorNotificaciones
    ServicioSincronizacion --> MaquinaEstados
    MaquinaEstados --> RepositorioPrisma
    MotorNotificaciones --> RepositorioPrisma
    ServicioTrayecto --> RepositorioPrisma
```

---

## 3. Diagramas de Secuencia

### 3.1 CU-09 Notificar el día programado y confirmar (el corazón de la propuesta)

```mermaid
sequenceDiagram
    autonumber
    participant T as Temporizador (API)
    participant MN as MotorNotificaciones
    participant BD as PostgreSQL
    participant EX as Expo Push
    participant TW as Twilio (SMS)
    participant AC as App Cliente
    participant C as Cliente

    T->>BD: SELECT inspecciones PROGRAMADA con fecha en 24 h
    BD-->>T: lista de citas
    loop por cada cita
        T->>MN: programarAviso(cita, DIA_PROGRAMADO)
        MN->>BD: INSERT notificacion (PENDIENTE, canal segun preferencia)
        MN->>BD: UPDATE inspeccion SET estado = 'NOTIFICADA'
        MN->>BD: INSERT inspeccion_historial
    end

    T->>MN: despachar()
    MN->>BD: SELECT notificaciones PENDIENTE con programada_para <= now()
    MN->>EX: enviar(token, titulo, cuerpo, acciones)
    alt entrega confirmada
        EX-->>MN: acuse de recibo
        MN->>BD: UPDATE notificacion SET estado='ENTREGADA'
        EX-->>AC: notificacion en pantalla
        AC-->>C: "Su inspeccion es el jueves 10 entre 10:00 y 12:00"
    else token invalido o sin acuse
        EX-->>MN: error / sin acuse
        MN->>BD: UPDATE notificacion SET estado='FALLIDA', error
        MN->>TW: enviar SMS de respaldo con enlace corto
        TW-->>C: SMS
        MN->>BD: INSERT notificacion (canal SMS)
    end

    C->>AC: toca "Si estare"
    AC->>BD: POST /inspecciones/:id/confirmar (via API)
    BD-->>AC: 200 estado CONFIRMADA
    AC-->>C: "Confirmado. Lo esperamos el jueves"
    Note over BD: confirmado_en = now(); la confirmacion no se deshace (RN-04)
```

### 3.2 CU-16 + CU-17 Iniciar trayecto y seguimiento en vivo

```mermaid
sequenceDiagram
    autonumber
    participant I as Inspector
    participant AI as App Inspector
    participant API as API Express
    participant GM as Google Directions
    participant BD as PostgreSQL
    participant RT as Supabase Realtime
    participant AC as App Cliente
    participant C as Cliente

    I->>AI: pulsa "Voy en camino"
    AI->>API: POST /inspecciones/:id/trayecto
    API->>GM: ruta(ubicacion actual, domicilio)
    alt el servicio responde
        GM-->>API: distancia y duracion
    else el servicio falla
        API->>API: ETA aproximado = distancia recta / velocidad promedio (RN-09)
    end
    API->>BD: SELECT iniciar_trayecto(...)
    Note over BD: transaccion unica: estado EN_CAMINO + historial + trayecto + notificacion
    BD-->>API: id_trayecto
    API-->>AI: trayecto ACTIVO, ETA inicial
    API->>AC: push "El inspector va en camino, llega en ~18 min"
    AC-->>C: notificacion urgente (ignora horario de silencio)

    AI->>AI: expo-location en segundo plano (cada 15 s)
    loop mientras el trayecto este ACTIVO
        AI->>API: POST /trayectos/:id/punto {lat, lng, capturado_en}
        API->>BD: INSERT punto_ubicacion
        API->>RT: publicar punto en canal inspeccion:{id}
        RT-->>AC: punto recibido
        AC->>AC: mover el marcador en el mapa
        alt cada 60 s
            API->>GM: recalcular ETA
            GM-->>API: nuevo ETA
            API->>BD: UPDATE trayecto SET eta_actual_s
            API->>RT: publicar ETA
            RT-->>AC: ETA actualizado
        end
    end

    API->>API: distancia al domicilio < 1000 m
    API->>AC: push "El inspector esta por llegar"
    C->>AC: toca "Ya estoy en mi casa"
    AC->>API: POST /inspecciones/:id/presencia
    API->>BD: UPDATE inspeccion SET presencia_confirmada_en
    API-->>AI: aviso en pantalla: "El cliente confirmo que esta en casa"
```

### 3.3 CU-11 + CU-12 Reprogramar la cita

```mermaid
sequenceDiagram
    autonumber
    participant C as Cliente
    participant AC as App Cliente
    participant API as API Express
    participant BD as PostgreSQL
    participant AD as Administrador (panel)
    participant AI as App Inspector

    C->>AC: "No puedo ese dia" -> Mover cita
    AC->>API: GET /inspecciones/:id/horarios-disponibles
    API->>BD: buscar huecos por zona y ventana (RN-02)
    BD-->>API: lista de fecha + ventana libres
    API-->>AC: horarios disponibles
    AC-->>C: muestra 6 opciones
    C->>AC: elige jueves 17, 10:00-12:00 y escribe el motivo
    AC->>API: POST /inspecciones/:id/reprogramacion
    API->>BD: validar veces_reprogramada < 3 (RN-06) y estado permitido (RN-05)
    alt validacion correcta
        API->>BD: INSERT reprogramacion (SOLICITADA)
        API->>BD: UPDATE inspeccion SET estado='REPROG_SOLICITADA'
        API-->>AC: "Solicitud enviada"
        API->>AD: aparece en la bandeja de reprogramaciones
    else limite alcanzado o cita en curso
        API-->>AC: 409 "Comuniquese con la oficina"
    end

    AD->>API: POST /reprogramaciones/:id/aprobar
    API->>BD: validar traslape del nuevo horario
    API->>BD: UPDATE inspeccion (nueva fecha, +1 en veces_reprogramada, estado NOTIFICADA)
    Note over BD: el folio se conserva (RN-06)
    API->>BD: UPDATE reprogramacion SET estado='APROBADA'
    API->>AC: push "Su cita quedo para el jueves 17 entre 10:00 y 12:00"
    API->>AI: la ruta del dia del inspector se actualiza
```

### 3.4 CU-20 + CU-22 Registrar el resultado sin señal y sincronizar

```mermaid
sequenceDiagram
    autonumber
    participant I as Inspector
    participant AI as App Inspector
    participant SQ as SQLite local
    participant API as API Express
    participant ST as Supabase Storage
    participant BD as PostgreSQL
    participant AC as App Cliente

    I->>AI: captura hallazgos y toma 4 fotos del techo
    AI->>AI: detecta que no hay conexion
    AI->>SQ: encolar resultado {id_local: UUID, registrado_en: hora real}
    AI->>SQ: encolar 4 evidencias con su id_local y la ruta del archivo
    AI-->>I: "Guardado. Se enviara al recuperar senal" (marcador visible)

    Note over AI,SQ: el inspector sigue con la siguiente casa de su ruta

    AI->>AI: recupera conexion
    AI->>API: POST /sincronizar {operaciones pendientes}
    API->>BD: SELECT por id_local (idempotencia, RN-12)
    alt ninguno existe
        API->>BD: INSERT resultado_inspeccion (registrado_sin_senal = true)
        API->>BD: UPDATE inspeccion SET estado='COMPLETADA'
        API->>BD: INSERT inspeccion_historial (origen APP_INSP)
    else ya se habia aplicado
        API-->>AI: 200 con el registro existente (no duplica)
    end
    AI->>ST: subir las 4 fotos
    ST-->>AI: rutas de los archivos
    AI->>API: POST /evidencias {id_local, ruta}
    API->>BD: INSERT evidencia
    API->>API: generar el reporte PDF
    API->>ST: guardar el PDF
    API->>AC: push "Ya esta disponible el resultado de su inspeccion"
    API-->>AI: sincronizacion completa; se vacia la cola
    AI->>SQ: borrar operaciones confirmadas
```

### 3.5 CU-21 Registrar cliente ausente

```mermaid
sequenceDiagram
    autonumber
    participant I as Inspector
    participant AI as App Inspector
    participant API as API Express
    participant BD as PostgreSQL
    participant AD as Panel del Administrador

    I->>AI: nadie abre; pulsa "Cliente ausente"
    AI-->>I: exige foto de la fachada y una nota (RN-10)
    I->>AI: toma la foto y escribe "Se toco 3 veces, sin respuesta, 10:40"
    AI->>API: POST /inspecciones/:id/ausente
    API->>BD: validar estado EN_CAMINO o EN_SITIO
    API->>BD: UPDATE inspeccion SET estado='CLIENTE_AUSENTE'
    API->>BD: INSERT evidencia (FOTO_AUSENCIA)
    API->>BD: SELECT cerrar_trayecto(id, 'LLEGADA')
    API->>BD: INSERT inspeccion_historial
    API-->>AI: registrado; siguiente parada de la ruta
    API->>AD: se suma a "visitas fallidas" del tablero
    AD->>API: POST /inspecciones {origen: id} para crear el reintento
    API->>BD: INSERT inspeccion con id_inspeccion_origen
```

### 3.6 CU-25 Consultar el tablero de indicadores

```mermaid
sequenceDiagram
    autonumber
    participant AD as Administrador
    participant P as Panel web
    participant API as API Express
    participant BD as PostgreSQL

    AD->>P: abre "Tablero", elige el rango del mes
    P->>API: GET /indicadores?desde=2026-11-01&hasta=2026-11-30
    API->>BD: SELECT * FROM v_indicadores_semana WHERE semana BETWEEN ...
    API->>BD: SELECT * FROM v_puntualidad_inspector
    API->>BD: SELECT * FROM v_efectividad_notificacion
    BD-->>API: filas agregadas
    API-->>P: JSON con series y totales
    P-->>AD: tarjetas (tasa de confirmacion, visitas fallidas, reprogramaciones)
    P-->>AD: grafica de citas por estado y ranking de puntualidad por inspector
    AD->>P: exportar a CSV
    P-->>AD: archivo descargado
```

---

## 4. Diagrama de Actividades — De la programación a la inspección completada

```mermaid
flowchart TD
    A([Inicio]) --> B["Administrador programa la inspeccion<br/>fecha + ventana + inspector"]
    B --> C{"Hay traslape<br/>en la agenda del inspector?"}
    C -->|Si| B
    C -->|No| D["Cita PROGRAMADA con folio"]
    D --> E["Temporizador: 24 h antes<br/>envia el aviso del dia"]
    E --> F{"Se entrego<br/>la notificacion push?"}
    F -->|No| G["Respaldo por SMS y correo<br/>+ alerta al administrador"]
    F -->|Si| H["Cita NOTIFICADA"]
    G --> H
    H --> I{"Respuesta<br/>del cliente"}
    I -->|Confirma| J["CONFIRMADA"]
    I -->|Pide mover| K["REPROG_SOLICITADA"]
    I -->|No responde en 12 h| L["SIN_CONFIRMAR<br/>+ alerta al administrador"]

    K --> M{"El administrador<br/>aprueba?"}
    M -->|Si| N["Nueva fecha, mismo folio<br/>regresa al ciclo de aviso"]
    M -->|No| H
    N --> E

    J --> O["Temporizador: 3 h antes<br/>recordatorio previo"]
    L --> P{"El administrador<br/>decide ir de todos modos?"}
    P -->|No| Q["CANCELADA"]
    P -->|Si| O

    O --> R["El inspector pulsa 'Voy en camino'"]
    R --> S["EN_CAMINO: se abre el trayecto<br/>push al cliente + mapa en vivo + ETA"]
    S --> T["A menos de 1 km:<br/>aviso 'esta por llegar'"]
    T --> U{"El cliente esta<br/>en el domicilio?"}
    U -->|No| V["CLIENTE_AUSENTE<br/>foto + nota obligatorias"]
    V --> W["Se registra visita fallida<br/>y se puede crear reintento"]
    W --> Z([Fin])

    U -->|Si| X["EN_SITIO: se registra la llegada<br/>y se cierra el trayecto"]
    X --> Y["El inspector revisa el techo<br/>y captura hallazgos + fotos"]
    Y --> AA{"Hay senal?"}
    AA -->|No| AB["Se encola en SQLite<br/>con id_local y hora real"]
    AB --> AC["Al reconectar: sincroniza<br/>sin duplicar (idempotencia)"]
    AA -->|Si| AD["Se envia directo a la API"]
    AC --> AE["COMPLETADA: se genera el reporte PDF"]
    AD --> AE
    AE --> AF["Push al cliente:<br/>'Ya esta disponible su reporte'"]
    AF --> Z
    Q --> Z
```

---

## 5. Diagrama de Estados — Trayecto

Complemento de la máquina de estados de la inspección (ver `03_Diseno_Base_de_Datos.md` §1.1).

```mermaid
stateDiagram-v2
    [*] --> ACTIVO : el inspector pulsa "Voy en camino"
    ACTIVO --> ACTIVO : publica un punto cada 15 s
    ACTIVO --> ACTIVO : recalcula el ETA cada 60 s
    ACTIVO --> FINALIZADO : registra llegada o cliente ausente
    ACTIVO --> CANCELADO : el inspector aborta el trayecto
    ACTIVO --> CANCELADO : apagado automatico a los 90 min
    FINALIZADO --> [*] : se calcula distancia y duracion
    CANCELADO --> [*]

    note right of ACTIVO
        Solo en este estado se publica
        y es visible la ubicacion (RN-08).
        Un inspector no puede tener dos
        trayectos ACTIVO a la vez (RN-03).
    end note
```

---

## 6. Diagrama de Componentes

```mermaid
flowchart TB
    subgraph MOVIL["Dispositivos moviles"]
        subgraph APPCLI["App del Cliente (Expo)"]
            C1["Pantallas: citas, detalle, mapa, reporte"]
            C2["ServicioNotificaciones"]
            C3["CanalRealtime"]
            C4["ApiClient"]
        end
        subgraph APPINS["App del Inspector (Expo)"]
            I1["Pantallas: ruta, navegacion, captura"]
            I2["ServicioUbicacion (background)"]
            I3["ColaLocal (SQLite)"]
            I4["Camara y compresion de fotos"]
            I5["ApiClient"]
        end
    end

    subgraph WEB["Navegador"]
        subgraph PANEL["Panel de administracion (React + Vite)"]
            P1["Agenda y calendario"]
            P2["Clientes, domicilios, inspectores, zonas"]
            P3["Bandeja de reprogramaciones"]
            P4["Tablero de indicadores"]
            P5["ApiClient"]
        end
    end

    subgraph SERVIDOR["API Node.js + Express (Vercel / Render)"]
        A1["Rutas REST"]
        A2["MiddlewareAuth (JWT)"]
        A3["ServicioAgenda"]
        A4["MaquinaEstados"]
        A5["MotorNotificaciones"]
        A6["ServicioTrayecto + ETA"]
        A7["ServicioSincronizacion"]
        A8["GeneradorReportePdf"]
        A9["Temporizadores (cron)"]
        A10["RepositorioPrisma"]
    end

    subgraph NUBE["Servicios gestionados"]
        D1[("PostgreSQL - Supabase")]
        D2["Supabase Auth"]
        D3["Supabase Realtime"]
        D4["Supabase Storage"]
        D5["Expo Push / FCM / APNs"]
        D6["Twilio SMS"]
        D7["Resend correo"]
        D8["Google Directions / Maps"]
    end

    C4 -->|HTTPS REST| A1
    I5 -->|HTTPS REST| A1
    P5 -->|HTTPS REST| A1
    A1 --> A2
    A2 --> D2
    A1 --> A3 --> A4 --> A10
    A1 --> A6 --> A10
    A1 --> A7 --> A4
    A3 --> A5
    A6 --> A5
    A9 --> A5
    A9 --> A10
    A5 --> D5
    A5 --> D6
    A5 --> D7
    A6 --> D8
    A8 --> D4
    A10 --> D1
    I2 --> A6
    A6 --> D3
    D3 --> C3
    D5 --> C2
    I3 --> A7
    I4 --> D4
```

---

## 7. Diagrama de Despliegue

```mermaid
flowchart TB
    subgraph TEL_CLI["Telefono del cliente - Android 10+ / iOS 14+"]
        N1["App Cliente (build EAS)"]
        N2["Permiso de notificaciones"]
    end

    subgraph TEL_INS["Telefono del inspector - Android 10+"]
        N3["App Inspector (build EAS)"]
        N4["GPS + permiso de ubicacion en segundo plano"]
        N5["SQLite local (cola de sincronizacion)"]
    end

    subgraph PC["PC de oficina - Agave Roofing"]
        N6["Navegador Chrome / Edge"]
    end

    subgraph VERCEL["Vercel"]
        N7["Panel de administracion (estatico)"]
        N8["API Node.js + Express (funciones)"]
    end

    subgraph SUPA["Supabase (nube)"]
        N9[("PostgreSQL 15")]
        N10["Auth"]
        N11["Realtime"]
        N12["Storage (fotos y PDF)"]
    end

    subgraph TERCEROS["Servicios de terceros"]
        N13["Expo Push Service"]
        N14["FCM / APNs"]
        N15["Twilio"]
        N16["Resend"]
        N17["Google Maps Platform"]
    end

    N1 -->|HTTPS| N8
    N3 -->|HTTPS| N8
    N6 --> N7
    N7 -->|HTTPS| N8
    N8 -->|TLS 5432| N9
    N8 --> N10
    N8 --> N12
    N3 -->|WebSocket| N11
    N1 -->|WebSocket| N11
    N8 --> N13 --> N14 --> N1
    N8 --> N15
    N8 --> N16
    N8 --> N17
    N1 --> N17
    N3 --> N17
```

**Notas de despliegue**

- Las apps se distribuyen con **EAS Build** (APK directo y enlace de instalación) para la demostración; la publicación en tiendas queda fuera del alcance (riesgo R9).
- Los **temporizadores** de la API (avisos, marcado de sin confirmar, purga de puntos, cierre de trayectos) se ejecutan con *cron jobs* de Vercel o, si el plan lo limita, con `pg_cron` dentro de Supabase.
- Ambientes: `desarrollo` (Supabase local o proyecto de pruebas) y `produccion` (proyecto piloto con datos reales autorizados).

---

## 8. Trazabilidad diagramas ↔ requerimientos

| Diagrama | Casos de uso | Requerimientos |
|----------|--------------|----------------|
| §1.1 Casos de uso general | CU-01 a CU-26 | Todos |
| §1.2 Include / extend | CU-05, CU-09, CU-11, CU-16, CU-20, CU-21 | RF-16 a RF-24, RF-25 a RF-35, RF-37 a RF-41, RF-44 a RF-52, RF-53 a RF-58 |
| §2.1 Modelo de dominio | — | Modelo completo de `03_Diseno_Base_de_Datos.md` |
| §2.2 Arquitectura por capas | — | RNF de mantenibilidad y portabilidad |
| §3.1 Aviso y confirmación | CU-09, CU-10 | RF-26, RF-31 a RF-36, RF-43 |
| §3.2 Trayecto y seguimiento | CU-16, CU-17, CU-18 | RF-28, RF-29, RF-44 a RF-50 |
| §3.3 Reprogramación | CU-11, CU-12 | RF-37 a RF-41 |
| §3.4 Resultado sin señal | CU-20, CU-22 | RF-53 a RF-55, RF-57, RF-58 |
| §3.5 Cliente ausente | CU-21 | RF-56, RF-24 |
| §3.6 Tablero | CU-25 | RF-65 a RF-71 |
| §4 Actividades | CU-05 a CU-22 | Flujo completo de negocio |
| §5 Estados del trayecto | CU-16, CU-19, CU-21 | RF-44, RF-49, RF-51, RN-03, RN-08 |
| §6 Componentes | — | RES-01 a RES-07 |
| §7 Despliegue | — | RNF de disponibilidad y portabilidad |

---

**Documentos relacionados:** [[01_Plan_de_Proyecto]] · [[02_SRS_Requerimientos]] · [[03_Diseno_Base_de_Datos]] · [[05_Calendario_Entregas]]
