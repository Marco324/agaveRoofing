import { db, initDatabase } from './db.ts';

export function runSeed() {
  initDatabase();

  // Limpiar datos existentes de forma ordenada
  db.exec(`
    DELETE FROM inspeccion_historial;
    DELETE FROM reprogramacion;
    DELETE FROM inspeccion;
    DELETE FROM inspector_zona;
    DELETE FROM domicilio;
    DELETE FROM cliente;
    DELETE FROM inspector;
    DELETE FROM usuario;
    DELETE FROM rol;
    DELETE FROM zona;
  `);

  console.log('🌱 Sembrando datos para Agave Roofing en San Antonio, Texas...');

  // 1. Roles
  const insertRol = db.prepare('INSERT INTO rol (id_rol, nombre, descripcion) VALUES (?, ?, ?)');
  insertRol.run(1, 'ADMINISTRADOR', 'Personal administrativo de Agave Roofing');
  insertRol.run(2, 'INSPECTOR', 'Inspector técnico de techos en campo');
  insertRol.run(3, 'CLIENTE', 'Propietario o encargado del inmueble');

  // 2. Usuarios
  const insertUsuario = db.prepare(`
    INSERT INTO usuario (id_usuario, auth_uid, id_rol, nombre_completo, correo, telefono, activo)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const uAdmin = 'u-admin-001';
  const uInsp1 = 'u-insp-001';
  const uInsp2 = 'u-insp-002';
  const uCli1  = 'u-cli-001';
  const uCli2  = 'u-cli-002';

  insertUsuario.run(uAdmin, 'auth-admin-001', 1, 'Marco Méndez Sánchez', 'marco.admin@agaveroofing.com', '+1-210-555-0100');
  insertUsuario.run(uInsp1, 'auth-insp-001', 2, 'Carlos Garza', 'carlos.garza@agaveroofing.com', '+1-210-555-0142');
  insertUsuario.run(uInsp2, 'auth-insp-002', 2, 'David Vance', 'david.vance@agaveroofing.com', '+1-210-555-0188');
  insertUsuario.run(uCli1,  'auth-cli-001',  3, 'Robert B. Martinez', 'robert.martinez@gmail.com', '+1-210-555-0201');
  insertUsuario.run(uCli2,  'auth-cli-002',  3, 'Sarah Jenkins', 'sarah.jenkins@outlook.com', '+1-210-555-0233');

  // 3. Zonas de cobertura en San Antonio, TX
  const insertZona = db.prepare('INSERT INTO zona (id_zona, nombre, descripcion) VALUES (?, ?, ?)');
  insertZona.run(1, 'Zona Norte (Stone Oak)', 'Stone Oak, Timberwood Park, Sonterra, ZIP 78258 / 78260');
  insertZona.run(2, 'Zona Este (Alamo Heights)', 'Alamo Heights, Terrell Hills, Lincoln Heights, ZIP 78209');
  insertZona.run(3, 'Zona Centro / Sur (Downtown & Southtown)', 'Downtown, Southtown, King William, Blue Star, ZIP 78204 / 78205');
  insertZona.run(4, 'Zona Noroeste (Medical Center)', 'Medical Center, Leon Valley, UTSA, Helotes, ZIP 78229 / 78240');

  // 4. Inspectores
  const insertInspector = db.prepare(`
    INSERT INTO inspector (id_inspector, id_usuario, nombre, telefono, placa_vehiculo, url_foto)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertInspector.run(1, uInsp1, 'Carlos Garza', '+1-210-555-0142', 'TX-ROOF-01', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb');
  insertInspector.run(2, uInsp2, 'David Vance', '+1-210-555-0188', 'TX-AGAVE-02', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d');

  // Inspectores por zona
  const insertInspZona = db.prepare('INSERT INTO inspector_zona (id_inspector, id_zona) VALUES (?, ?)');
  insertInspZona.run(1, 1);
  insertInspZona.run(1, 2);
  insertInspZona.run(2, 3);
  insertInspZona.run(2, 4);

  // 5. Clientes
  const insertCliente = db.prepare(`
    INSERT INTO cliente (id_cliente, id_usuario, nombre, telefono, correo, canal_preferido, notas)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCliente.run(1, uCli1, 'Robert B. Martinez', '+1-210-555-0201', 'robert.martinez@gmail.com', 'PUSH', 'Techo residencial con teja asfáltica. Filtración tras tormenta.');
  insertCliente.run(2, uCli2, 'Sarah Jenkins', '+1-210-555-0233', 'sarah.jenkins@outlook.com', 'PUSH', 'Propiedad de dos pisos en Alamo Heights. Sospecha de granizo.');
  insertCliente.run(3, null,  'Michael A. Flores', '+1-210-555-0310', 'mflores.satx@yahoo.com', 'SMS', 'Local comercial en Southtown. Requiere inspección anual preventiva.');
  insertCliente.run(4, null,  'Elena Rodriguez', '+1-210-555-0455', 'elena.rodriguez@gmail.com', 'PUSH', 'Casa de madera con teja metálica cerca de Medical Center.');

  // 6. Domicilios en San Antonio, Texas
  const insertDomicilio = db.prepare(`
    INSERT INTO domicilio (id_domicilio, id_cliente, id_zona, alias, calle, numero, colonia, ciudad, estado, codigo_postal, referencias, latitud, longitud, geocodificado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertDomicilio.run(
    1, 1, 1, 'Casa Stone Oak',
    'Stone Oak Pkwy', '19202', 'Stone Oak',
    'San Antonio', 'Texas', '78258',
    'Portón negro con interfono. Timbre principal al lado derecho.',
    29.620120, -98.498230
  );

  insertDomicilio.run(
    2, 2, 2, 'Residencia Alamo Heights',
    'Broadway St', '5930', 'Alamo Heights',
    'San Antonio', 'Texas', '78209',
    'Frente a gasolinera Chevron. Casa blanca con tejas rojas.',
    29.489140, -98.463310
  );

  insertDomicilio.run(
    3, 3, 3, 'Bodega Comercial Southtown',
    'S St Marys St', '1011', 'Southtown',
    'San Antonio', 'Texas', '78204',
    'Entrada por portón metálico trasero para vehículos de servicio.',
    29.408930, -98.491240
  );

  insertDomicilio.run(
    4, 4, 4, 'Residencia Floyd Curl',
    'Floyd Curl Dr', '7703', 'Medical Center',
    'San Antonio', 'Texas', '78229',
    'Casa esquina con roble grande al frente.',
    29.508210, -98.579120
  );

  // 7. Inspecciones de ejemplo (incluyendo citas para el jueves 15 de octubre de 2026 - Entrega E07)
  const insertInspeccion = db.prepare(`
    INSERT INTO inspeccion (
      id_inspeccion, folio, id_cliente, id_domicilio, id_inspector,
      fecha_programada, ventana_inicio, ventana_fin, estado,
      motivo_visita, notas, veces_reprogramada, creado_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertHistorial = db.prepare(`
    INSERT INTO inspeccion_historial (id_inspeccion, estado_anterior, estado_nuevo, id_usuario, origen, nota, ocurrido_en)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  // Inspección 1: Jueves 15 de octubre de 2026, 09:00 - 11:00 (Inspector 1)
  insertInspeccion.run(
    1, 'INS-2026-000001', 1, 1, 1,
    '2026-10-15', '09:00', '11:00', 'CONFIRMADA',
    'Revisión de tejas levantadas tras tormenta de viento',
    'El cliente confirmó que estará presente en el domicilio.', 0
  );
  insertHistorial.run(1, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Cita agendada por administración');
  insertHistorial.run(1, 'PROGRAMADA', 'NOTIFICADA', null, 'SISTEMA', 'Notificación push enviada al cliente');
  insertHistorial.run(1, 'NOTIFICADA', 'CONFIRMADA', uCli1, 'APP_CLI', 'Cliente confirmó disponibilidad en la app');

  // Inspección 2: Jueves 15 de octubre de 2026, 11:30 - 13:30 (Inspector 1)
  insertInspeccion.run(
    2, 'INS-2026-000002', 2, 2, 1,
    '2026-10-15', '11:30', '13:30', 'NOTIFICADA',
    'Evaluación por posible impacto de granizo en cumbrera',
    'Pendiente de confirmación del cliente.', 0
  );
  insertHistorial.run(2, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Cita agendada por administración');
  insertHistorial.run(2, 'PROGRAMADA', 'NOTIFICADA', null, 'SISTEMA', 'Aviso del día programado enviado');

  // Inspección 3: Jueves 15 de octubre de 2026, 14:30 - 16:30 (Inspector 2)
  insertInspeccion.run(
    3, 'INS-2026-000003', 3, 3, 2,
    '2026-10-15', '14:30', '16:30', 'PROGRAMADA',
    'Inspección comercial anual preventiva en cubierta plana',
    'Coordinar con vigilante de acceso en caseta.', 0
  );
  insertHistorial.run(3, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Programación inicial');

  // Inspección 4: Viernes 16 de octubre de 2026, 10:00 - 12:00 (Inspector 2)
  insertInspeccion.run(
    4, 'INS-2026-000004', 4, 4, 2,
    '2026-10-16', '10:00', '12:00', 'PROGRAMADA',
    'Revisión de sellado de tragaluces y chimenea',
    'Revisar si hay filtraciones cerca del tragaluz principal.', 0
  );
  insertHistorial.run(4, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Programación inicial');

  console.log('✅ Semilla completada exitosamente: 4 zonas de San Antonio, 2 inspectores, 4 clientes, 4 domicilios y 4 inspecciones.');
}

// Ejecutar si se llama directamente
if (process.argv[1]?.endsWith('seed.ts')) {
  runSeed();
}
