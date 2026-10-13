import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'agavealerta.db');

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
      fecha_solicitada TEXT NOT NULL,
      ventana_inicio_solicitada TEXT NOT NULL,
      motivo TEXT,
      solicitada_por TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'SOLICITADA',
      resuelta_por TEXT REFERENCES usuario(id_usuario),
      resuelta_en TEXT,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

initDatabase();
