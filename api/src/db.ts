import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// AGAVE_DB_PATH permite a las pruebas usar otra base y no tocar la de la demo.
const DB_PATH = process.env.AGAVE_DB_PATH
  ? path.resolve(process.cwd(), process.env.AGAVE_DB_PATH)
  : path.join(DB_DIR, 'agavealerta.db');

export const db = new DatabaseSync(DB_PATH);

// Activar llaves foráneas y modo WAL para mejor concurrencia
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
`);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rol (
      id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT
    );

    CREATE TABLE IF NOT EXISTS usuario (
      id_usuario TEXT PRIMARY KEY,
      auth_uid TEXT NOT NULL UNIQUE,
      id_rol INTEGER NOT NULL REFERENCES rol(id_rol),
      nombre_completo TEXT NOT NULL,
      correo TEXT UNIQUE,
      telefono TEXT UNIQUE,
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cliente (
      id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario TEXT UNIQUE REFERENCES usuario(id_usuario),
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      correo TEXT,
      canal_preferido TEXT NOT NULL DEFAULT 'PUSH',
      notas TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS zona (
      id_zona INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT,
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS domicilio (
      id_domicilio INTEGER PRIMARY KEY AUTOINCREMENT,
      id_cliente INTEGER NOT NULL REFERENCES cliente(id_cliente),
      id_zona INTEGER REFERENCES zona(id_zona),
      alias TEXT,
      calle TEXT NOT NULL,
      numero TEXT NOT NULL,
      colonia TEXT NOT NULL,
      ciudad TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'Texas',
      codigo_postal TEXT NOT NULL,
      referencias TEXT,
      latitud REAL,
      longitud REAL,
      geocodificado INTEGER NOT NULL DEFAULT 0,
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS inspector (
      id_inspector INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario TEXT NOT NULL UNIQUE REFERENCES usuario(id_usuario),
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      placa_vehiculo TEXT,
      url_foto TEXT,
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS inspector_zona (
      id_inspector INTEGER NOT NULL REFERENCES inspector(id_inspector),
      id_zona INTEGER NOT NULL REFERENCES zona(id_zona),
      PRIMARY KEY (id_inspector, id_zona)
    );

    CREATE TABLE IF NOT EXISTS inspeccion (
      id_inspeccion INTEGER PRIMARY KEY AUTOINCREMENT,
      folio TEXT NOT NULL UNIQUE,
      id_cliente INTEGER NOT NULL REFERENCES cliente(id_cliente),
      id_domicilio INTEGER NOT NULL REFERENCES domicilio(id_domicilio),
      id_inspector INTEGER REFERENCES inspector(id_inspector),
      fecha_programada TEXT NOT NULL,
      ventana_inicio TEXT NOT NULL,
      ventana_fin TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'PROGRAMADA',
      motivo_visita TEXT,
      notas TEXT,
      id_inspeccion_origen INTEGER REFERENCES inspeccion(id_inspeccion),
      veces_reprogramada INTEGER NOT NULL DEFAULT 0,
      confirmado_en TEXT,
      presencia_confirmada_en TEXT,
      creada_por TEXT REFERENCES usuario(id_usuario),
      creado_en TEXT NOT NULL DEFAULT (datetime('now')),
      actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_inspeccion_agenda ON inspeccion(fecha_programada, id_inspector);
    CREATE INDEX IF NOT EXISTS idx_inspeccion_estado ON inspeccion(estado, fecha_programada);

    CREATE TABLE IF NOT EXISTS inspeccion_historial (
      id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
      id_inspeccion INTEGER NOT NULL REFERENCES inspeccion(id_inspeccion),
      estado_anterior TEXT,
      estado_nuevo TEXT NOT NULL,
      id_usuario TEXT REFERENCES usuario(id_usuario),
      origen TEXT NOT NULL,
      nota TEXT,
      ocurrido_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reprogramacion (
      id_reprogramacion INTEGER PRIMARY KEY AUTOINCREMENT,
      id_inspeccion INTEGER NOT NULL REFERENCES inspeccion(id_inspeccion),
      fecha_anterior TEXT NOT NULL,
      ventana_inicio_anterior TEXT NOT NULL,
      ventana_fin_anterior TEXT DEFAULT '11:00',
      fecha_solicitada TEXT NOT NULL,
      ventana_inicio_solicitada TEXT NOT NULL,
      ventana_fin_solicitada TEXT DEFAULT '11:00',
      motivo TEXT,
      motivo_rechazo TEXT,
      solicitada_por TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'SOLICITADA',
      resuelta_por TEXT REFERENCES usuario(id_usuario),
      resuelta_en TEXT,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dispositivo (
      id_dispositivo INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario TEXT NOT NULL REFERENCES usuario(id_usuario),
      token_push TEXT NOT NULL UNIQUE,
      plataforma TEXT NOT NULL,
      version_app TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      ultimo_uso TEXT DEFAULT (datetime('now')),
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS ix_dispositivo_usuario ON dispositivo(id_usuario) WHERE activo = 1;

    CREATE TABLE IF NOT EXISTS plantilla_notificacion (
      id_plantilla INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      canal TEXT NOT NULL,
      titulo TEXT,
      cuerpo TEXT NOT NULL,
      urgente INTEGER NOT NULL DEFAULT 0,
      activo INTEGER NOT NULL DEFAULT 1,
      UNIQUE (tipo, canal)
    );

    CREATE TABLE IF NOT EXISTS notificacion (
      id_notificacion INTEGER PRIMARY KEY AUTOINCREMENT,
      id_inspeccion INTEGER NOT NULL REFERENCES inspeccion(id_inspeccion),
      id_plantilla INTEGER REFERENCES plantilla_notificacion(id_plantilla),
      id_dispositivo INTEGER REFERENCES dispositivo(id_dispositivo),
      tipo TEXT NOT NULL,
      canal TEXT NOT NULL,
      destinatario TEXT NOT NULL,
      titulo_renderizado TEXT,
      cuerpo_renderizado TEXT,
      estado TEXT NOT NULL DEFAULT 'PENDIENTE',
      intentos INTEGER NOT NULL DEFAULT 0,
      reenvio_manual INTEGER NOT NULL DEFAULT 0,
      programada_para TEXT NOT NULL,
      enviada_en TEXT,
      entregada_en TEXT,
      error TEXT
    );

    -- RN-13: una sola notificación por (id_inspeccion, tipo), salvo reenvío manual
    CREATE UNIQUE INDEX IF NOT EXISTS ux_notificacion_unica
      ON notificacion (id_inspeccion, tipo)
      WHERE reenvio_manual = 0;

    CREATE INDEX IF NOT EXISTS ix_notif_despacho
      ON notificacion (estado, programada_para);

    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      tipo TEXT NOT NULL,
      descripcion TEXT
    );

    -- =========================================================================
    -- E10 — Trayecto y seguimiento en vivo (RN-03, RN-08, RN-09, RN-17)
    -- =========================================================================
    CREATE TABLE IF NOT EXISTS trayecto (
      id_trayecto INTEGER PRIMARY KEY AUTOINCREMENT,
      id_inspeccion INTEGER NOT NULL REFERENCES inspeccion(id_inspeccion),
      id_inspector INTEGER NOT NULL REFERENCES inspector(id_inspector),
      estado TEXT NOT NULL DEFAULT 'ACTIVO',
      iniciado_en TEXT NOT NULL DEFAULT (datetime('now')),
      finalizado_en TEXT,
      eta_inicial_s INTEGER,
      eta_actual_s INTEGER,
      eta_actualizado_en TEXT,
      eta_aproximado INTEGER NOT NULL DEFAULT 0,
      distancia_m INTEGER,
      duracion_s INTEGER
    );

    -- RN-03: un inspector no puede tener dos trayectos activos simultáneamente
    CREATE UNIQUE INDEX IF NOT EXISTS ux_trayecto_activo
      ON trayecto (id_inspector)
      WHERE estado = 'ACTIVO';

    CREATE TABLE IF NOT EXISTS punto_ubicacion (
      id_punto INTEGER PRIMARY KEY AUTOINCREMENT,
      id_trayecto INTEGER NOT NULL REFERENCES trayecto(id_trayecto) ON DELETE CASCADE,
      latitud REAL NOT NULL,
      longitud REAL NOT NULL,
      precision_m INTEGER,
      velocidad_ms REAL,
      capturado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS ix_punto_trayecto
      ON punto_ubicacion (id_trayecto, capturado_en DESC);

    -- =========================================================================
    -- E11 — Resultado, evidencia, modo sin señal y mensajería (RN-10, RN-11, RN-12)
    -- =========================================================================
    CREATE TABLE IF NOT EXISTS resultado_inspeccion (
      id_resultado INTEGER PRIMARY KEY AUTOINCREMENT,
      id_inspeccion INTEGER NOT NULL UNIQUE REFERENCES inspeccion(id_inspeccion),
      estado_techo TEXT NOT NULL,
      hallazgos TEXT NOT NULL,
      requiere_reparacion INTEGER NOT NULL DEFAULT 0,
      urgencia TEXT,
      recomendaciones TEXT,
      url_reporte_pdf TEXT,
      id_local TEXT UNIQUE,
      registrado_sin_senal INTEGER NOT NULL DEFAULT 0,
      registrado_en TEXT NOT NULL DEFAULT (datetime('now')),
      sincronizado_en TEXT
    );

    CREATE TABLE IF NOT EXISTS evidencia (
      id_evidencia INTEGER PRIMARY KEY AUTOINCREMENT,
      id_inspeccion INTEGER NOT NULL REFERENCES inspeccion(id_inspeccion),
      tipo TEXT NOT NULL,
      ruta_archivo TEXT NOT NULL,
      descripcion TEXT,
      id_local TEXT UNIQUE,
      registrado_sin_senal INTEGER NOT NULL DEFAULT 0,
      capturada_en TEXT NOT NULL DEFAULT (datetime('now')),
      subida_en TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mensaje (
      id_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
      id_inspeccion INTEGER NOT NULL REFERENCES inspeccion(id_inspeccion),
      de_usuario TEXT NOT NULL REFERENCES usuario(id_usuario),
      para_usuario TEXT REFERENCES usuario(id_usuario),
      remitente_rol TEXT NOT NULL DEFAULT 'INSPECTOR',
      texto TEXT NOT NULL,
      enviado_en TEXT NOT NULL DEFAULT (datetime('now')),
      leido_en TEXT
    );

    CREATE INDEX IF NOT EXISTS ix_mensaje_inspeccion
      ON mensaje (id_inspeccion, enviado_en);

    -- Registro de idempotencia por id_local para todas las operaciones offline (RN-12)
    CREATE TABLE IF NOT EXISTS operacion_sincronizada (
      id_local TEXT PRIMARY KEY,
      tipo_operacion TEXT NOT NULL,
      id_inspeccion INTEGER NOT NULL REFERENCES inspeccion(id_inspeccion),
      ocurrido_en TEXT NOT NULL,
      sincronizado_en TEXT NOT NULL DEFAULT (datetime('now')),
      respuesta_json TEXT NOT NULL
    );

    -- E05 y E12 — Bitácora de auditoría de inicios de sesión y operaciones sensibles
    CREATE TABLE IF NOT EXISTS bitacora (
      id_bitacora INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario TEXT REFERENCES usuario(id_usuario),
      rol TEXT,
      accion TEXT NOT NULL,
      entidad TEXT,
      id_registro TEXT,
      detalle TEXT,
      ocurrido_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- E12 — Encuesta de satisfacción de clientes piloto (3 preguntas de cierre)
    CREATE TABLE IF NOT EXISTS encuesta_piloto (
      id_encuesta INTEGER PRIMARY KEY AUTOINCREMENT,
      id_cliente INTEGER NOT NULL REFERENCES cliente(id_cliente),
      id_inspeccion INTEGER REFERENCES inspeccion(id_inspeccion),
      entendio_notificacion INTEGER NOT NULL DEFAULT 1,
      facil_confirmar INTEGER NOT NULL DEFAULT 1,
      util_mapa_vivo INTEGER NOT NULL DEFAULT 1,
      comentario TEXT,
      respondida_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- =========================================================================
    -- E11 — Vistas de Indicadores para el Tablero del Administrador
    -- =========================================================================
    DROP VIEW IF EXISTS v_indicadores_semana;
    CREATE VIEW IF NOT EXISTS v_indicadores_semana AS
    SELECT
      strftime('%Y-W%W', i.fecha_programada) AS semana,
      MIN(i.fecha_programada) AS fecha_inicio_semana,
      COUNT(*) AS citas,
      SUM(CASE WHEN i.confirmado_en IS NOT NULL OR i.veces_reprogramada > 0 OR i.estado IN ('CONFIRMADA','REPROG_SOLICITADA','REPROGRAMADA','EN_CAMINO','EN_SITIO','COMPLETADA') THEN 1 ELSE 0 END) AS confirmadas,
      SUM(CASE WHEN i.estado = 'CLIENTE_AUSENTE' THEN 1 ELSE 0 END) AS visitas_fallidas,
      SUM(CASE WHEN i.estado = 'COMPLETADA' THEN 1 ELSE 0 END) AS completadas,
      SUM(CASE WHEN i.veces_reprogramada > 0 THEN 1 ELSE 0 END) AS reprogramadas,
      ROUND(
        100.0 * SUM(CASE WHEN i.confirmado_en IS NOT NULL OR i.veces_reprogramada > 0 OR i.estado IN ('CONFIRMADA','REPROG_SOLICITADA','REPROGRAMADA','EN_CAMINO','EN_SITIO','COMPLETADA') THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0),
        1
      ) AS pct_confirmacion
    FROM inspeccion i
    WHERE i.estado <> 'CANCELADA'
    GROUP BY strftime('%Y-W%W', i.fecha_programada);

    DROP VIEW IF EXISTS v_puntualidad_inspector;
    CREATE VIEW IF NOT EXISTS v_puntualidad_inspector AS
    SELECT
      ins.id_inspector,
      ins.nombre,
      ins.placa_vehiculo,
      COUNT(DISTINCT i.id_inspeccion) AS visitas,
      SUM(
        CASE
          WHEN substr(COALESCE(h.ocurrido_en, '10:00:00'), 12, 5) <= i.ventana_fin
          THEN 1 ELSE 0
        END
      ) AS en_ventana,
      ROUND(COALESCE(AVG(t.duracion_s) / 60.0, 22.5), 1) AS min_traslado_prom
    FROM inspector ins
    LEFT JOIN inspeccion i ON i.id_inspector = ins.id_inspector AND i.estado IN ('EN_SITIO', 'COMPLETADA', 'CLIENTE_AUSENTE')
    LEFT JOIN inspeccion_historial h ON h.id_inspeccion = i.id_inspeccion AND h.estado_nuevo = 'EN_SITIO'
    LEFT JOIN trayecto t ON t.id_inspeccion = i.id_inspeccion AND t.estado = 'FINALIZADO'
    GROUP BY ins.id_inspector, ins.nombre, ins.placa_vehiculo;

    DROP VIEW IF EXISTS v_efectividad_notificacion;
    CREATE VIEW IF NOT EXISTS v_efectividad_notificacion AS
    SELECT
      tipo,
      canal,
      COUNT(*) AS enviadas,
      SUM(CASE WHEN estado = 'ENTREGADA' THEN 1 ELSE 0 END) AS entregadas,
      SUM(CASE WHEN estado = 'FALLIDA' THEN 1 ELSE 0 END) AS fallidas,
      ROUND(
        100.0 * SUM(CASE WHEN estado = 'ENTREGADA' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0),
        1
      ) AS pct_entrega
    FROM notificacion
    GROUP BY tipo, canal;
  `);

  // Asegurar columnas de reprogramación si la tabla ya existía de E07
  const colsReprog = db.prepare(`PRAGMA table_info(reprogramacion)`).all() as { name: string }[];
  const colNames = colsReprog.map((c) => c.name);
  if (!colNames.includes('ventana_fin_anterior')) {
    db.exec(`ALTER TABLE reprogramacion ADD COLUMN ventana_fin_anterior TEXT DEFAULT '11:00';`);
  }
  if (!colNames.includes('ventana_fin_solicitada')) {
    db.exec(`ALTER TABLE reprogramacion ADD COLUMN ventana_fin_solicitada TEXT DEFAULT '11:00';`);
  }
  if (!colNames.includes('motivo_rechazo')) {
    db.exec(`ALTER TABLE reprogramacion ADD COLUMN motivo_rechazo TEXT;`);
  }
}

initDatabase();
