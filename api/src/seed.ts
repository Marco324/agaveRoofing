import { db, initDatabase } from './db.ts';
import { asignarContrasena, CONTRASENA_INICIAL } from './services/authService.ts';

export { CONTRASENA_INICIAL };

/**
 * - `runSeed()` (por defecto, la usan las pruebas): cuentas + 12 citas de demostración.
 * - `runSeed({ conCitas: false })`: solo cuentas, zonas, domicilios, plantillas y
 *   configuración; las citas se programan a mano desde el panel.
 */
export function runSeed({ conCitas = true }: { conCitas?: boolean } = {}) {
  initDatabase();

  // Limpiar datos existentes de forma ordenada
  db.exec(`
    DELETE FROM bitacora;
    DELETE FROM encuesta_piloto;
    DELETE FROM operacion_sincronizada;
    DELETE FROM mensaje;
    DELETE FROM evidencia;
    DELETE FROM resultado_inspeccion;
    DELETE FROM punto_ubicacion;
    DELETE FROM trayecto;
    DELETE FROM notificacion;
    DELETE FROM plantilla_notificacion;
    DELETE FROM dispositivo;
    DELETE FROM configuracion;
    DELETE FROM inspeccion_historial;
    DELETE FROM reprogramacion;
    DELETE FROM inspeccion;
    DELETE FROM inspector_zona;
    DELETE FROM domicilio;
    DELETE FROM cliente;
    DELETE FROM inspector;
    DELETE FROM sesion;
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
  const uCli4  = 'u-cli-004';

  insertUsuario.run(uAdmin, 'auth-admin-001', 1, 'Marco Méndez Sánchez', 'marco.admin@agaveroofing.com', '+1-210-555-0100');
  insertUsuario.run(uInsp1, 'auth-insp-001', 2, 'Carlos Garza', 'carlos.garza@agaveroofing.com', '+1-210-555-0142');
  insertUsuario.run(uInsp2, 'auth-insp-002', 2, 'David Vance', 'david.vance@agaveroofing.com', '+1-210-555-0188');
  insertUsuario.run(uCli1,  'auth-cli-001',  3, 'Robert B. Martinez', 'robert.martinez@gmail.com', '+1-210-555-0201');
  insertUsuario.run(uCli2,  'auth-cli-002',  3, 'Sarah Jenkins', 'sarah.jenkins@outlook.com', '+1-210-555-0233');
  insertUsuario.run(uCli4,  'auth-cli-004',  3, 'Elena Rodriguez', 'elena.rodriguez@gmail.com', '+1-210-555-0455');
  // En la demo, Michael Flores no tiene app (prueba el respaldo por SMS); en la semilla de cuentas sí.
  const uCli3 = conCitas ? null : 'u-cli-003';
  if (uCli3) {
    insertUsuario.run(uCli3, 'auth-cli-003', 3, 'Michael A. Flores', 'mflores.satx@yahoo.com', '+1-210-555-0310');
  }

  // RF-01 — Todas las cuentas de prueba arrancan con la misma contraseña (solo se guarda su hash).
  for (const idUsuario of [uAdmin, uInsp1, uInsp2, uCli1, uCli2, uCli4, uCli3]) {
    if (idUsuario) asignarContrasena(idUsuario, CONTRASENA_INICIAL);
  }

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
  insertCliente.run(3, uCli3, 'Michael A. Flores', '+1-210-555-0310', 'mflores.satx@yahoo.com', 'SMS', 'Local comercial en Southtown. Requiere inspección anual preventiva.');
  insertCliente.run(4, uCli4, 'Elena Rodriguez', '+1-210-555-0455', 'elena.rodriguez@gmail.com', 'PUSH', 'Casa de madera con teja metálica cerca de Medical Center.');

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

  // 8. Configuración del sistema (Tabla 4.19 de 03_Diseno_Base_de_Datos.md)
  const insertConfig = db.prepare(`
    INSERT INTO configuracion (clave, valor, tipo, descripcion)
    VALUES (?, ?, ?, ?)
  `);
  insertConfig.run('aviso_dia_horas_antes', '24', 'INT', 'Horas antes de la cita para el aviso del día programado');
  insertConfig.run('recordatorio_horas_antes', '3', 'INT', 'Horas antes de la ventana para el recordatorio previo');
  insertConfig.run('plazo_confirmacion_horas', '12', 'INT', 'Plazo sin respuesta tras el cual la cita pasa a SIN_CONFIRMAR (RN-07)');
  insertConfig.run('intervalo_ubicacion_seg', '15', 'INT', 'Intervalo de publicación de ubicación del inspector');
  insertConfig.run('distancia_por_llegar_m', '1000', 'INT', 'Distancia para el aviso "está por llegar"');
  insertConfig.run('trayecto_max_minutos', '90', 'INT', 'Apagado automático del trayecto (riesgo R5)');
  insertConfig.run('retencion_puntos_dias', '30', 'INT', 'Días de retención de puntos GPS (RN-17)');
  insertConfig.run('max_reprogramaciones', '3', 'INT', 'Límite máximo de reprogramaciones por inspección (RN-06)');
  insertConfig.run('silencio_inicio', '21:00', 'HORA', 'Inicio del horario de silencio nocturno (RN-14)');
  insertConfig.run('silencio_fin', '07:00', 'HORA', 'Fin del horario de silencio nocturno (RN-14)');
  insertConfig.run('horario_operacion_inicio', '08:00', 'HORA', 'Hora mínima de operación para programar');
  insertConfig.run('horario_operacion_fin', '18:00', 'HORA', 'Hora máxima de operación para programar');
  insertConfig.run('velocidad_promedio_kmh', '35', 'INT', 'Velocidad para el ETA aproximado (RN-09)');

  // 9. Plantillas de Notificación (E08 Jorge BD + Revisión de textos claros Mario AN)
  const insertPlantilla = db.prepare(`
    INSERT INTO plantilla_notificacion (id_plantilla, tipo, canal, titulo, cuerpo, urgente, activo)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  insertPlantilla.run(1, 'DIA_PROGRAMADO', 'PUSH', 'Inspección de techo programada',
    'Hola {{cliente}}: su inspección de Agave Roofing es el {{fecha}} entre {{ventana}} con {{inspector}}. Toque "Sí estaré" para confirmar o "Mover cita" si necesita otro horario.', 0);
  insertPlantilla.run(2, 'RECORDATORIO', 'PUSH', 'Recordatorio: su inspección es hoy',
    'Hola {{cliente}}: hoy entre {{ventana}} lo visitará {{inspector}} de Agave Roofing para revisar su techo.', 0);
  insertPlantilla.run(3, 'EN_CAMINO', 'PUSH', 'Su inspector va en camino',
    '{{inspector}} salió hacia su domicilio. Tiempo estimado de llegada: {{eta}} minutos.', 1);
  insertPlantilla.run(4, 'POR_LLEGAR', 'PUSH', 'Su inspector está por llegar',
    '{{inspector}} está a menos de {{eta}} minutos de su domicilio. Por favor confirme que se encuentra en casa.', 1);
  insertPlantilla.run(5, 'LLEGADA', 'PUSH', 'El inspector ha llegado',
    '{{inspector}} de Agave Roofing ya se encuentra afuera de su domicilio.', 1);
  insertPlantilla.run(6, 'RESULTADO', 'PUSH', 'Reporte de inspección disponible',
    'Hola {{cliente}}: ya puede consultar el reporte y fotografías de la inspección de su techo.', 0);
  insertPlantilla.run(7, 'REPROGRAMADA', 'PUSH', 'Su cita cambió de fecha',
    'Hola {{cliente}}: su inspección de techo quedó reprogramada para el {{fecha}} entre {{ventana}} con {{inspector}}.', 0);
  insertPlantilla.run(8, 'MENSAJE', 'PUSH', 'Mensaje de su inspector',
    '{{inspector}}: {{texto}}', 1);
  insertPlantilla.run(9, 'DIA_PROGRAMADO', 'SMS', null,
    'Agave Roofing (San Antonio): Hola {{cliente}}, su inspeccion de techo es el {{fecha}} ({{ventana}}) con {{inspector}}. Confirme sin costo en: {{enlace}}', 0);
  insertPlantilla.run(10, 'RECORDATORIO', 'SMS', null,
    'Agave Roofing: Recordatorio de su inspeccion de techo hoy entre {{ventana}} con {{inspector}}. Info: {{enlace}}', 0);
  insertPlantilla.run(11, 'REPROGRAMADA', 'SMS', null,
    'Agave Roofing: Su cita fue reprogramada para el {{fecha}} ({{ventana}}) con {{inspector}}. Detalles: {{enlace}}', 0);
  insertPlantilla.run(12, 'EN_CAMINO', 'SMS', null,
    'Agave Roofing: {{inspector}} va en camino a su domicilio, llega en ~{{eta}} min. Sigalo en vivo: {{enlace}}', 1);

  if (conCitas) {
    // Citas, trayectos y notificaciones de ejemplo (solo en la semilla de demostración)
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
    db.prepare(`UPDATE inspeccion SET confirmado_en = '2026-10-14T10:00:00Z' WHERE id_inspeccion = 1`).run();
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
      '2026-10-15', '14:30', '16:30', 'CONFIRMADA',
      'Inspección comercial anual preventiva en cubierta plana',
      'Coordinar con vigilante de acceso en caseta.', 0
    );
    db.prepare(`UPDATE inspeccion SET confirmado_en = '2026-10-14T16:30:00Z' WHERE id_inspeccion = 3`).run();
    insertHistorial.run(3, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Programación inicial');

    // Inspección 4: Viernes 16 de octubre de 2026, 10:00 - 12:00 (Inspector 2)
    insertInspeccion.run(
      4, 'INS-2026-000004', 4, 4, 2,
      '2026-10-16', '10:00', '12:00', 'PROGRAMADA',
      'Revisión de sellado de tragaluces y chimenea',
      'Revisar si hay filtraciones cerca del tragaluz principal.', 0
    );
    insertHistorial.run(4, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Programación inicial');

    // Inspección 5: Jueves 29 de octubre de 2026 (E09), 09:00 - 11:00 (Inspector 1 - Robert Martinez - CONFIRMADA)
    insertInspeccion.run(
      5, 'INS-2026-000005', 1, 1, 1,
      '2026-10-29', '09:00', '11:00', 'CONFIRMADA',
      'Seguimiento de reparación de teja asfáltica en Stone Oak',
      'Cliente confirmó desde el botón rápido de la notificación push.', 0
    );
    db.prepare(`UPDATE inspeccion SET confirmado_en = '2026-10-28T10:15:00Z' WHERE id_inspeccion = 5`).run();
    insertHistorial.run(5, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Cita agendada para cierre de Sprint 4');
    insertHistorial.run(5, 'PROGRAMADA', 'NOTIFICADA', null, 'SISTEMA', 'Aviso del día programado (24h antes) enviado por PUSH');
    insertHistorial.run(5, 'NOTIFICADA', 'CONFIRMADA', uCli1, 'APP_CLI', 'Cliente confirmó asistencia desde botón "Sí estaré" en notificación');

    // Inspección 6: Jueves 29 de octubre de 2026 (E09), 11:30 - 13:30 (Inspector 1 - Sarah Jenkins - REPROG_SOLICITADA)
    insertInspeccion.run(
      6, 'INS-2026-000006', 2, 2, 1,
      '2026-10-29', '11:30', '13:30', 'REPROG_SOLICITADA',
      'Inspección de cumbrera y canaletas en Alamo Heights',
      'Cliente solicitó mover la cita al viernes 30 de octubre.', 1
    );
    insertHistorial.run(6, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Cita agendada por administración');
    insertHistorial.run(6, 'PROGRAMADA', 'NOTIFICADA', null, 'SISTEMA', 'Aviso del día programado enviado por PUSH');
    insertHistorial.run(6, 'NOTIFICADA', 'REPROG_SOLICITADA', uCli2, 'APP_CLI', 'Cliente solicitó reprogramación para 2026-10-30 (09:00 - 11:00)');

    // Solicitud de reprogramación en bandeja (SOLICITADA) para Inspección 6
    db.prepare(`
      INSERT INTO reprogramacion (
        id_reprogramacion, id_inspeccion, fecha_anterior, ventana_inicio_anterior, ventana_fin_anterior,
        fecha_solicitada, ventana_inicio_solicitada, ventana_fin_solicitada, motivo,
        solicitada_por, estado, creado_en
      ) VALUES (1, 6, '2026-10-29', '11:30', '13:30', '2026-10-30', '09:00', '11:00',
        'Tengo cita médica en el centro de San Antonio a mediodía, ¿podrían venir el viernes por la mañana?',
        'CLIENTE', 'SOLICITADA', '2026-10-28T14:20:00Z')
    `).run();

    // Inspección 7: Jueves 29 de octubre de 2026 (E09), 14:30 - 16:30 (Inspector 2 - Michael Flores - SIN_CONFIRMAR)
    insertInspeccion.run(
      7, 'INS-2026-000007', 3, 3, 2,
      '2026-10-29', '14:30', '16:30', 'SIN_CONFIRMAR',
      'Inspección preventiva de cubierta comercial en Southtown',
      'Venció el plazo de 12 horas sin confirmación. Llamar por teléfono.', 0
    );
    insertHistorial.run(7, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Cita comercial programada');
    insertHistorial.run(7, 'PROGRAMADA', 'NOTIFICADA', null, 'SISTEMA', 'Aviso enviado por respaldo SMS (Twilio)');
    insertHistorial.run(7, 'NOTIFICADA', 'SIN_CONFIRMAR', null, 'SISTEMA', 'Plazo de confirmación (12 h) vencido sin respuesta del cliente (RN-07)');

    // Inspección 8: Viernes 30 de octubre de 2026, 10:00 - 12:00 (Inspector 2 - Elena Rodriguez - NOTIFICADA)
    insertInspeccion.run(
      8, 'INS-2026-000008', 4, 4, 2,
      '2026-10-30', '10:00', '12:00', 'NOTIFICADA',
      'Revisión de sellado de tragaluces en Medical Center',
      'Lista para que el cliente confirme o reprograme desde la app.', 0
    );
    insertHistorial.run(8, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Programación inicial');
    insertHistorial.run(8, 'PROGRAMADA', 'NOTIFICADA', null, 'SISTEMA', 'Aviso del día programado enviado por PUSH');

    // 10. Dispositivos móviles registrados (E08 Expo Push Tokens)
    const insertDispositivo = db.prepare(`
      INSERT INTO dispositivo (id_dispositivo, id_usuario, token_push, plataforma, version_app, activo, ultimo_uso)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
    `);
    insertDispositivo.run(1, uInsp1, 'ExponentPushToken[insp-carlos-garza-satx01]', 'ANDROID', '1.4.0');
    insertDispositivo.run(2, uInsp2, 'ExponentPushToken[insp-david-vance-satx02]', 'IOS', '1.4.0');
    insertDispositivo.run(3, uCli1,  'ExponentPushToken[cli-robert-martinez-ios17]', 'IOS', '1.4.0');
    insertDispositivo.run(4, uCli2,  'ExponentPushToken[cli-sarah-jenkins-and14]', 'ANDROID', '1.4.0');
    insertDispositivo.run(5, uCli4,  'ExponentPushToken[cli-elena-rodriguez-ios18]', 'IOS', '1.4.0');

    // 11. Notificaciones iniciales de ejemplo para vista del panel y bitácora R4 (E08)
    const insertNotif = db.prepare(`
      INSERT INTO notificacion (
        id_inspeccion, id_plantilla, id_dispositivo, tipo, canal, destinatario,
        titulo_renderizado, cuerpo_renderizado, estado, intentos, reenvio_manual,
        programada_para, enviada_en, entregada_en, error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNotif.run(
      1, 1, 3, 'DIA_PROGRAMADO', 'PUSH', 'ExponentPushToken[cli-robert-martinez-ios17]',
      'Inspección de techo programada',
      'Hola Robert B. Martinez: su inspección de Agave Roofing es el 2026-10-15 entre 09:00 - 11:00 con Carlos Garza.',
      'ENTREGADA', 1, 0, '2026-10-14T09:00:00Z', '2026-10-14T09:00:02Z', '2026-10-14T09:00:03Z', null
    );
    insertNotif.run(
      2, 1, 4, 'DIA_PROGRAMADO', 'PUSH', 'ExponentPushToken[cli-sarah-jenkins-and14]',
      'Inspección de techo programada',
      'Hola Sarah Jenkins: su inspección de Agave Roofing es el 2026-10-15 entre 11:30 - 13:30 con Carlos Garza.',
      'ENTREGADA', 1, 0, '2026-10-14T11:30:00Z', '2026-10-14T11:30:01Z', '2026-10-14T11:30:02Z', null
    );
    insertNotif.run(
      5, 1, 3, 'DIA_PROGRAMADO', 'PUSH', 'ExponentPushToken[cli-robert-martinez-ios17]',
      'Inspección de techo programada',
      'Hola Robert B. Martinez: su inspección de Agave Roofing es el 2026-10-29 entre 09:00 - 11:00 con Carlos Garza. Toque "Sí estaré" para confirmar o "Mover cita" si necesita otro horario.',
      'ENTREGADA', 1, 0, '2026-10-28T09:00:00Z', '2026-10-28T09:00:01Z', '2026-10-28T09:00:02Z', null
    );
    insertNotif.run(
      5, 2, 3, 'RECORDATORIO', 'PUSH', 'ExponentPushToken[cli-robert-martinez-ios17]',
      'Recordatorio: su inspección es hoy',
      'Hola Robert B. Martinez: hoy entre 09:00 - 11:00 lo visitará Carlos Garza de Agave Roofing para revisar su techo.',
      'ENTREGADA', 1, 0, '2026-10-29T06:00:00Z', '2026-10-29T07:00:01Z', '2026-10-29T07:00:02Z', null
    );
    insertNotif.run(
      6, 1, 4, 'DIA_PROGRAMADO', 'PUSH', 'ExponentPushToken[cli-sarah-jenkins-and14]',
      'Inspección de techo programada',
      'Hola Sarah Jenkins: su inspección de Agave Roofing es el 2026-10-29 entre 11:30 - 13:30 con Carlos Garza. Toque "Sí estaré" para confirmar o "Mover cita" si necesita otro horario.',
      'ENTREGADA', 1, 0, '2026-10-28T11:30:00Z', '2026-10-28T11:30:01Z', '2026-10-28T11:30:02Z', null
    );
    insertNotif.run(
      7, 9, null, 'DIA_PROGRAMADO', 'SMS', '+1-210-555-0310',
      null,
      'Agave Roofing (San Antonio): Hola Michael A. Flores, su inspeccion de techo es el 2026-10-29 (14:30 - 16:30) con David Vance. Confirme sin costo en: https://agave.tx/c/7',
      'FALLIDA', 3, 0, '2026-10-28T14:30:00Z', '2026-10-28T14:30:05Z', null,
      'Twilio Error 30005: Unknown destination handset / Buzón lleno tras 3 intentos'
    );
    insertNotif.run(
      8, 1, 5, 'DIA_PROGRAMADO', 'PUSH', 'ExponentPushToken[cli-elena-rodriguez-ios18]',
      'Inspección de techo programada',
      'Hola Elena Rodriguez: su inspección de Agave Roofing es el 2026-10-30 entre 10:00 - 12:00 con David Vance. Toque "Sí estaré" para confirmar o "Mover cita" si necesita otro horario.',
      'ENTREGADA', 1, 0, '2026-10-28T15:00:00Z', '2026-10-28T15:00:01Z', '2026-10-28T15:00:02Z', null
    );

    // =========================================================================
    // 12. Datos de Sprint 5 (E10: 05 de nov y E11: 12 de nov de 2026)
    // =========================================================================

    // Inspección 9: Jueves 05 de noviembre de 2026 (E10), 09:00 - 11:00 (Inspector 1 - Robert Martinez - COMPLETADA con Reporte PDF y Fotos)
    insertInspeccion.run(
      9, 'INS-2026-000009', 1, 1, 1,
      '2026-11-05', '09:00', '11:00', 'COMPLETADA',
      'Inspección integral post-granizada en techo de teja asfáltica (Stone Oak)',
      'Inspección completada en tiempo y forma con reporte fotográfico.', 0
    );
    db.prepare(`
      UPDATE inspeccion
      SET confirmado_en = '2026-11-04T11:20:00Z',
          presencia_confirmada_en = '2026-11-05T08:52:00Z'
      WHERE id_inspeccion = 9
    `).run();
    insertHistorial.run(9, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Cita programada para Sprint 5');
    insertHistorial.run(9, 'PROGRAMADA', 'NOTIFICADA', null, 'SISTEMA', 'Aviso del día programado enviado');
    insertHistorial.run(9, 'NOTIFICADA', 'CONFIRMADA', uCli1, 'APP_CLI', 'Cliente confirmó asistencia desde la app');
    insertHistorial.run(9, 'CONFIRMADA', 'EN_CAMINO', uInsp1, 'APP_INSP', 'Inspector inició trayecto con GPS activo');
    db.prepare(`
      INSERT INTO inspeccion_historial (id_inspeccion, estado_anterior, estado_nuevo, id_usuario, origen, nota, ocurrido_en)
      VALUES (9, 'EN_CAMINO', 'EN_SITIO', ?, 'APP_INSP', 'Llegada puntual dentro de ventana comprometida', '2026-11-05T09:18:00Z')
    `).run(uInsp1);
    db.prepare(`
      INSERT INTO inspeccion_historial (id_inspeccion, estado_anterior, estado_nuevo, id_usuario, origen, nota, ocurrido_en)
      VALUES (9, 'EN_SITIO', 'COMPLETADA', ?, 'APP_INSP', 'Resultado capturado con 2 fotografías y reporte PDF generado', '2026-11-05T10:05:00Z')
    `).run(uInsp1);

    // Trayecto finalizado de la Inspección 9
    db.prepare(`
      INSERT INTO trayecto (
        id_trayecto, id_inspeccion, id_inspector, estado,
        iniciado_en, finalizado_en, eta_inicial_s, eta_actual_s,
        eta_actualizado_en, eta_aproximado, distancia_m, duracion_s
      ) VALUES (
        1, 9, 1, 'FINALIZADO',
        '2026-11-05T08:55:00Z', '2026-11-05T09:18:00Z', 1380, 0,
        '2026-11-05T09:18:00Z', 0, 11450, 1380
      )
    `).run();

    // Resultado y evidencias fotográficas de la Inspección 9 (E11)
    db.prepare(`
      INSERT INTO resultado_inspeccion (
        id_resultado, id_inspeccion, estado_techo, hallazgos,
        requiere_reparacion, urgencia, recomendaciones, url_reporte_pdf,
        id_local, registrado_sin_senal, registrado_en, sincronizado_en
      ) VALUES (
        1, 9, 'REGULAR',
        'Se detectaron 6 tejas asfálticas fracturadas en el faldón norte por impacto de granizo y desgaste en el sellador de elastómero alrededor de la chimenea.',
        1, 'MEDIA',
        'Reemplazar el paquete de tejas dañadas en el sector norte y re-sellar el tapajuntas metálico antes de la temporada invernal en San Antonio.',
        '/api/inspecciones/9/reporte-html',
        '11111111-2222-4333-8444-555555555009', 0, '2026-11-05T10:05:00Z', '2026-11-05T10:05:02Z'
      )
    `).run();

    db.prepare(`
      INSERT INTO evidencia (
        id_evidencia, id_inspeccion, tipo, ruta_archivo, descripcion,
        id_local, registrado_sin_senal, capturada_en, subida_en
      ) VALUES
        (1, 9, 'FOTO_TECHO', 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=800&q=80',
         'Faldón norte: tejas asfálticas con fisura por impacto de granizo en Stone Oak.',
         '11111111-2222-4333-8444-555555555091', 0, '2026-11-05T09:42:00Z', '2026-11-05T10:05:01Z'),
        (2, 9, 'FOTO_FACHADA', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
         'Fachada frontal del inmueble en 19202 Stone Oak Pkwy verificada al concluir.',
         '11111111-2222-4333-8444-555555555092', 0, '2026-11-05T09:58:00Z', '2026-11-05T10:05:02Z')
    `).run();

    // Inspección 10: Jueves 12 de noviembre de 2026 (E11), 09:00 - 11:00 (Inspector 1 - Robert Martinez - CONFIRMADA lista para iniciar trayecto)
    insertInspeccion.run(
      10, 'INS-2026-000010', 1, 1, 1,
      '2026-11-12', '09:00', '11:00', 'CONFIRMADA',
      'Verificación final de sellado e impermeabilización en Stone Oak',
      'Cliente confirmado. Lista para pulsar "Voy en camino" (E10) y probar modo sin señal (E11).', 0
    );
    db.prepare(`
      UPDATE inspeccion
      SET confirmado_en = '2026-11-11T10:00:00Z',
          presencia_confirmada_en = '2026-11-12T08:40:00Z'
      WHERE id_inspeccion = 10
    `).run();
    insertHistorial.run(10, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Cita agendada para cierre de Sprint 5 (E11)');
    insertHistorial.run(10, 'PROGRAMADA', 'NOTIFICADA', null, 'SISTEMA', 'Aviso del día programado enviado por PUSH');
    insertHistorial.run(10, 'NOTIFICADA', 'CONFIRMADA', uCli1, 'APP_CLI', 'Cliente confirmó asistencia y marcó "Ya estoy en mi casa"');

    // Mensajes iniciales de ejemplo en la Inspección 10 (E11)
    db.prepare(`
      INSERT INTO mensaje (id_inspeccion, de_usuario, para_usuario, remitente_rol, texto, enviado_en)
      VALUES
        (10, ?, ?, 'INSPECTOR', 'Buenos días Sr. Martinez, estoy revisando el equipo de escalera y salgo hacia Stone Oak en unos minutos.', '2026-11-12T08:35:00Z'),
        (10, ?, ?, 'CLIENTE', '¡Gracias Carlos! Ya estoy aquí en casa, el portón principal está abierto.', '2026-11-12T08:40:00Z')
    `).run(uInsp1, uCli1, uCli1, uInsp1);

    // Inspección 11: Jueves 12 de noviembre de 2026 (E11), 11:30 - 13:30 (Inspector 1 - Sarah Jenkins - EN_SITIO lista para capturar resultado)
    insertInspeccion.run(
      11, 'INS-2026-000011', 2, 2, 1,
      '2026-11-12', '11:30', '13:30', 'EN_SITIO',
      'Diagnóstico de cumbrera y ventilación de ático en Alamo Heights',
      'Inspector en sitio tomando fotografías del techo.', 0
    );
    db.prepare(`
      UPDATE inspeccion
      SET confirmado_en = '2026-11-11T12:10:00Z',
          presencia_confirmada_en = '2026-11-12T11:15:00Z'
      WHERE id_inspeccion = 11
    `).run();
    insertHistorial.run(11, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Cita agendada por administración');
    insertHistorial.run(11, 'PROGRAMADA', 'NOTIFICADA', null, 'SISTEMA', 'Aviso enviado por PUSH');
    insertHistorial.run(11, 'NOTIFICADA', 'CONFIRMADA', uCli2, 'APP_CLI', 'Confirmada por Sarah Jenkins');
    insertHistorial.run(11, 'CONFIRMADA', 'EN_CAMINO', uInsp1, 'APP_INSP', 'Inicio de trayecto hacia Alamo Heights');
    db.prepare(`
      INSERT INTO inspeccion_historial (id_inspeccion, estado_anterior, estado_nuevo, id_usuario, origen, nota, ocurrido_en)
      VALUES (11, 'EN_CAMINO', 'EN_SITIO', ?, 'APP_INSP', 'Llegada registrada en Alamo Heights', '2026-11-12T11:28:00Z')
    `).run(uInsp1);

    // Inspección 12: Jueves 12 de noviembre de 2026 (E10 / E11), 14:30 - 16:30 (Inspector 2 David Vance - Elena Rodriguez - EN_CAMINO con trayecto ACTIVO)
    insertInspeccion.run(
      12, 'INS-2026-000012', 4, 4, 2,
      '2026-11-12', '14:30', '16:30', 'EN_CAMINO',
      'Revisión de tapajuntas y tragaluces en Medical Center',
      'Inspector David Vance en trayecto activo transmitiendo GPS cada 15 s.', 0
    );
    db.prepare(`
      UPDATE inspeccion
      SET confirmado_en = '2026-11-11T15:00:00Z'
      WHERE id_inspeccion = 12
    `).run();
    insertHistorial.run(12, null, 'PROGRAMADA', uAdmin, 'PANEL', 'Cita agendada para Sprint 5');
    insertHistorial.run(12, 'PROGRAMADA', 'NOTIFICADA', null, 'SISTEMA', 'Aviso enviado por PUSH');
    insertHistorial.run(12, 'NOTIFICADA', 'CONFIRMADA', uCli4, 'APP_CLI', 'Confirmada por Elena Rodriguez');
    insertHistorial.run(12, 'CONFIRMADA', 'EN_CAMINO', uInsp2, 'APP_INSP', 'Inspector David Vance pulsó "Voy en camino"');

    // Trayecto ACTIVO para Inspección 12 (Inspector 2 David Vance rumbo a Medical Center)
    const ahoraISO = new Date().toISOString();
    db.prepare(`
      INSERT INTO trayecto (
        id_trayecto, id_inspeccion, id_inspector, estado,
        iniciado_en, eta_inicial_s, eta_actual_s, eta_actualizado_en, eta_aproximado
      ) VALUES (
        2, 12, 2, 'ACTIVO',
        ?, 960, 540, ?, 0
      )
    `).run(ahoraISO, ahoraISO);

    db.prepare(`
      INSERT INTO punto_ubicacion (id_trayecto, latitud, longitud, precision_m, velocidad_ms, capturado_en)
      VALUES
        (2, 29.485100, -98.535200, 7, 14.2, ?),
        (2, 29.496400, -98.556800, 6, 13.8, ?),
        (2, 29.502900, -98.568900, 5, 12.5, ?)
    `).run(ahoraISO, ahoraISO, ahoraISO);

    insertNotif.run(
      9, 6, 3, 'RESULTADO', 'PUSH', 'ExponentPushToken[cli-robert-martinez-ios17]',
      'Reporte de inspección disponible',
      'Hola Robert B. Martinez: ya puede consultar el reporte y fotografías de la inspección de su techo.',
      'ENTREGADA', 1, 0, '2026-11-05T10:05:00Z', '2026-11-05T10:05:01Z', '2026-11-05T10:05:02Z', null
    );
    insertNotif.run(
      12, 3, 5, 'EN_CAMINO', 'PUSH', 'ExponentPushToken[cli-elena-rodriguez-ios18]',
      'Su inspector va en camino',
      'David Vance salió hacia su domicilio. Tiempo estimado de llegada: 9 minutos.',
      'ENTREGADA', 1, 0, ahoraISO, ahoraISO, ahoraISO, null
    );

  }
  console.log(conCitas
    ? '✅ Semilla completada exitosamente: 4 zonas de San Antonio, 2 inspectores, 4 clientes, 5 dispositivos push, 12 plantillas y 12 inspecciones (E07 a E11).'
    : '✅ Cuentas listas: 1 administrador, 2 inspectores y 4 clientes con domicilio, sin citas. Programa la primera desde el panel.');
}

// Ejecutar si se llama directamente
if (process.argv[1]?.endsWith('seed.ts')) {
  // `npm run seed` → solo cuentas; `npm run seed:demo` → cuentas + citas de demostración.
  runSeed({ conCitas: process.argv.includes('--demo') });
}
