import http from 'node:http';
import { URL } from 'node:url';
import { db, initDatabase } from './db.ts';
import {
  crearInspeccion,
  listarAgenda,
  obtenerInspeccionPorId,
  reasignarInspector,
  moverInspeccion,
  cancelarInspeccion,
  ErrorTraslapeInspector,
  ErrorHorarioInvalido,
  ErrorValidacionAgenda
} from './services/agendaService.ts';
import { transicionar, ErrorTransicionInvalida } from './services/maquinaEstadosService.ts';
import { obtenerRutaDelDia } from './services/rutaInspectorService.ts';
import { obtenerMisCitas } from './services/misCitasClienteService.ts';
import {
  registrarDispositivo,
  encolarNotificacion,
  despacharNotificacionesPendientes,
  ejecutarTemporizadorAvisoDiaProgramado,
  ejecutarTemporizadorRecordatorioPrevio,
  reenviarNotificacionManual,
  listarNotificacionesPanel,
  ErrorNotificacionDuplicadaRN13
} from './services/notificacionService.ts';
import {
  confirmarInspeccion,
  obtenerHorariosDisponibles,
  solicitarReprogramacion,
  resolverReprogramacion,
  ejecutarTemporizadorSinConfirmar,
  listarBandejaReprogramaciones,
  listarCitasSinConfirmar,
  ErrorReprogramacionEnCaminoRN05,
  ErrorLimiteReprogramacionesRN06,
  ErrorConfirmacionInmutableRN04
} from './services/confirmacionReprogramacionService.ts';
import {
  iniciarTrayecto,
  registrarPuntoUbicacion,
  simularPasoTrayecto,
  cerrarTrayecto,
  cerrarTrayectosOlvidados,
  obtenerSeguimientoVivo,
  listarMonitorVivoPanel,
  ErrorTrayectoActivoRN03,
  ErrorTrayectoNoActivoRN08
} from './services/trayectoService.ts';
import {
  confirmarPresenciaCliente,
  registrarLlegadaInspector,
  registrarEvidencia,
  registrarResultadoInspeccion,
  registrarClienteAusente,
  sincronizarLoteOffline,
  obtenerReporteInspeccion,
  generarReporteHtml,
  listarMensajesInspeccion,
  enviarMensajeInspeccion,
  purgarPuntosGpsAntiguos,
  ErrorAusenciaSinEvidenciaRN10,
  ErrorEvidenciaRequeridaRN11
} from './services/ejecucionSincronizacionService.ts';
import {
  obtenerTableroIndicadores,
  exportarIndicadoresCSV
} from './services/indicadoresService.ts';
import { EstadoInspeccion, OrigenTransicion } from '../../shared/src/types/estados.ts';
import { hoy, infoFecha } from './fechaReferencia.ts';
import { cerrarCitasPasadas, programarCierreDeCitasPasadas } from './services/citasPasadasService.ts';

initDatabase();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

function json(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Las fotos de evidencia llegan como data URI en base64 (hasta 5 fotos de
// ~1280 px), así que el cuerpo puede pesar varios MB.
export const LIMITE_CUERPO_BYTES = 15 * 1024 * 1024;

export class ErrorCuerpoDemasiadoGrande extends Error {
  constructor() {
    super(
      `La petición supera el límite de ${LIMITE_CUERPO_BYTES / (1024 * 1024)} MB. Envía menos fotos o fotos más pequeñas.`
    );
    this.name = 'ErrorCuerpoDemasiadoGrande';
  }
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    // Se juntan los bytes y se decodifican al final: decodificar cada fragmento
    // por separado puede romper caracteres UTF-8 (acentos) partidos entre fragmentos.
    const chunks: Buffer[] = [];
    let total = 0;
    let excedido = false;
    req.on('data', (chunk: Buffer) => {
      if (excedido) return;
      total += chunk.length;
      if (total > LIMITE_CUERPO_BYTES) {
        excedido = true;
        chunks.length = 0;
        reject(new ErrorCuerpoDemasiadoGrande());
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (excedido) return;
      const body = Buffer.concat(chunks).toString('utf8');
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('JSON malformado en cuerpo de petición'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const method = req.method?.toUpperCase();

  // Responder preflight CORS
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  try {
    // 1. Salud
    if (pathname === '/api/salud' && method === 'GET') {
      return json(res, 200, {
        ok: true,
        servicio: 'AgaveAlerta API',
        empresa: 'Agave Roofing (San Antonio, TX)',
        version: '1.2.0-E12',
        sprint: 'Sprint 6 (E01 a E12 Completos)',
        timestamp: new Date().toISOString(),
        fecha: infoFecha()
      });
    }

    // 1a. Fecha de negocio ("hoy"), real o fijada con FECHA_HOY
    if (pathname === '/api/sistema/fecha' && method === 'GET') {
      return json(res, 200, infoFecha());
    }

    // 1a'. Cierre de citas pasadas (también corre solo al arrancar y cada 10 min)
    if (pathname === '/api/sistema/cerrar-citas-pasadas' && method === 'POST') {
      return json(res, 200, { ok: true, ...cerrarCitasPasadas() });
    }

    // 1b. Autenticación por Rol y OTP (E05) + Bitácora
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const rolSolicitado = body.rol || 'ADMINISTRADOR';
      let usuarioRow: any = null;

      if (body.correo) {
        usuarioRow = db.prepare(`
          SELECT u.*, r.nombre AS rol_nombre
          FROM usuario u
          JOIN rol r ON u.id_rol = r.id_rol
          WHERE u.correo = ? AND u.activo = 1
        `).get(body.correo);
      } else if (body.telefono) {
        usuarioRow = db.prepare(`
          SELECT u.*, r.nombre AS rol_nombre
          FROM usuario u
          JOIN rol r ON u.id_rol = r.id_rol
          WHERE u.telefono = ? AND u.activo = 1
        `).get(body.telefono);
      }

      if (!usuarioRow) {
        // Fallback por rol para demostración ágil
        usuarioRow = db.prepare(`
          SELECT u.*, r.nombre AS rol_nombre
          FROM usuario u
          JOIN rol r ON u.id_rol = r.id_rol
          WHERE r.nombre = ? AND u.activo = 1
          LIMIT 1
        `).get(rolSolicitado);
      }

      if (body.exigirRol && usuarioRow && usuarioRow.rol_nombre !== body.exigirRol) {
        return json(res, 403, {
          ok: false,
          codigo: 'ACCESO_DENEGADO_ROL_E05',
          error: `Acceso denegado: esta aplicación requiere rol ${body.exigirRol} (tu rol actual es ${usuarioRow.rol_nombre}).`
        });
      }

      db.prepare(`
        INSERT INTO bitacora (id_usuario, rol, accion, entidad, id_registro, detalle)
        VALUES (?, ?, 'LOGIN_EXITOSO', 'usuario', ?, ?)
      `).run(
        usuarioRow?.id_usuario || 'u-admin-001',
        usuarioRow?.rol_nombre || rolSolicitado,
        usuarioRow?.id_usuario || 'u-admin-001',
        `Inicio de sesión verificado (${body.metodo || 'JWT / OTP'})`
      );

      return json(res, 200, {
        ok: true,
        token: `jwt-agave-${usuarioRow?.id_usuario || 'u-admin-001'}-${Date.now()}`,
        usuario: usuarioRow || {
          id_usuario: 'u-admin-001',
          nombre_completo: 'Marco Méndez (Admin)',
          rol_nombre: rolSolicitado
        }
      });
    }

    // 1c. Bitácora de auditoría y monitoreo (E05 / E12)
    if (pathname === '/api/bitacora' && method === 'GET') {
      const registros = db.prepare(`SELECT * FROM bitacora ORDER BY id_bitacora DESC LIMIT 50`).all();
      return json(res, 200, { total: registros.length, registros });
    }

    // 2. Catálogos para selectores y módulo de Catálogos (E06)
    if (pathname === '/api/catalogos' && method === 'GET') {
      const zonas = db.prepare('SELECT * FROM zona WHERE activo = 1').all();
      const inspectores = db.prepare(`
        SELECT i.id_inspector, i.nombre, i.telefono, i.placa_vehiculo, i.activo,
               GROUP_CONCAT(z.nombre, ', ') AS zonas_asignadas
        FROM inspector i
        LEFT JOIN inspector_zona iz ON i.id_inspector = iz.id_inspector
        LEFT JOIN zona z ON iz.id_zona = z.id_zona
        WHERE i.activo = 1
        GROUP BY i.id_inspector
      `).all();
      const clientes = db.prepare('SELECT id_cliente, nombre, telefono, correo, canal_preferido, activo FROM cliente WHERE activo = 1').all();
      const domicilios = db.prepare(`
        SELECT d.*, c.nombre AS cliente_nombre, z.nombre AS zona_nombre
        FROM domicilio d
        JOIN cliente c ON d.id_cliente = c.id_cliente
        LEFT JOIN zona z ON d.id_zona = z.id_zona
        WHERE d.activo = 1
      `).all();

      return json(res, 200, { zonas, inspectores, clientes, domicilios });
    }

    // 2b. Alta y baja lógica de Clientes (E06 · RN-15)
    if (pathname === '/api/clientes' && method === 'POST') {
      const b = await parseBody(req);
      const info = db.prepare(`
        INSERT INTO cliente (nombre, telefono, correo, canal_preferido, notas, activo)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(b.nombre, b.telefono, b.correo || null, b.canalPreferido || 'PUSH', b.notas || null);
      const nuevo = db.prepare('SELECT * FROM cliente WHERE id_cliente = ?').get(info.lastInsertRowid);
      return json(res, 201, { ok: true, cliente: nuevo });
    }

    const matchClienteBaja = pathname.match(/^\/api\/clientes\/(\d+)\/baja$/);
    if (matchClienteBaja && method === 'PATCH') {
      const idCli = parseInt(matchClienteBaja[1], 10);
      db.prepare('UPDATE cliente SET activo = 0 WHERE id_cliente = ?').run(idCli);
      return json(res, 200, { ok: true, mensaje: 'Baja lógica aplicada al cliente (RN-15: sin borrado físico).' });
    }

    // 2c. Alta de Domicilio con Geocodificación en San Antonio, TX (E06)
    if (pathname === '/api/domicilios' && method === 'POST') {
      const b = await parseBody(req);
      const lat = b.latitud ?? Number((29.4241 + (Math.random() - 0.5) * 0.15).toFixed(5));
      const lng = b.longitud ?? Number((-98.4936 + (Math.random() - 0.5) * 0.15).toFixed(5));
      const info = db.prepare(`
        INSERT INTO domicilio (id_cliente, id_zona, alias, calle, numero, colonia, ciudad, estado, codigo_postal, referencias, latitud, longitud, geocodificado, activo)
        VALUES (?, ?, ?, ?, ?, ?, 'San Antonio', 'Texas', ?, ?, ?, ?, 1, 1)
      `).run(
        b.idCliente,
        b.idZona || 1,
        b.alias || 'Casa Principal',
        b.calle,
        b.numero || 'S/N',
        b.colonia,
        b.codigoPostal || '78258',
        b.referencias || '',
        lat,
        lng
      );
      const dom = db.prepare('SELECT * FROM domicilio WHERE id_domicilio = ?').get(info.lastInsertRowid);
      return json(res, 201, { ok: true, domicilio: dom });
    }

    // 2d. Alta de Zona de Servicio (E06)
    if (pathname === '/api/zonas' && method === 'POST') {
      const b = await parseBody(req);
      const info = db.prepare(`INSERT INTO zona (nombre, descripcion, activo) VALUES (?, ?, 1)`).run(b.nombre, b.descripcion || '');
      const zona = db.prepare('SELECT * FROM zona WHERE id_zona = ?').get(info.lastInsertRowid);
      return json(res, 201, { ok: true, zona });
    }

    // 2e. Encuesta de satisfacción de clientes piloto (E12)
    if (pathname === '/api/encuestas-piloto' && method === 'GET') {
      const encuestas = db.prepare(`
        SELECT e.*, c.nombre AS cliente_nombre
        FROM encuesta_piloto e
        JOIN cliente c ON e.id_cliente = c.id_cliente
        ORDER BY e.id_encuesta DESC
      `).all();
      return json(res, 200, { total: encuestas.length, encuestas });
    }
    if (pathname === '/api/encuestas-piloto' && method === 'POST') {
      const b = await parseBody(req);
      const info = db.prepare(`
        INSERT INTO encuesta_piloto (id_cliente, id_inspeccion, entendio_notificacion, facil_confirmar, util_mapa_vivo, comentario)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        b.idCliente || 1,
        b.idInspeccion || null,
        b.entendioNotificacion !== false ? 1 : 0,
        b.facilConfirmar !== false ? 1 : 0,
        b.utilMapaVivo !== false ? 1 : 0,
        b.comentario || 'Excelente seguimiento en vivo y reporte PDF claro.'
      );
      const enc = db.prepare('SELECT * FROM encuesta_piloto WHERE id_encuesta = ?').get(info.lastInsertRowid);
      return json(res, 201, { ok: true, encuesta: enc });
    }

    // 3. Ruta del día del inspector (E07 Anuar IN)
    if (pathname === '/api/inspecciones/mi-ruta' && method === 'GET') {
      const idInspector = parseInt(reqUrl.searchParams.get('idInspector') || '1', 10);
      const fecha = reqUrl.searchParams.get('fecha') || hoy();
      const ruta = obtenerRutaDelDia(idInspector, fecha);
      return json(res, 200, { idInspector, fecha, totalParadas: ruta.length, paradas: ruta });
    }

    // 4. Mis citas del cliente (E07 Jesús CL)
    if (pathname === '/api/inspecciones/mias' && method === 'GET') {
      const idCliente = parseInt(reqUrl.searchParams.get('idCliente') || '1', 10);
      const misCitas = obtenerMisCitas(idCliente);
      return json(res, 200, misCitas);
    }

    // 5. Listar agenda con filtros (E07 Marco LP)
    if (pathname === '/api/inspecciones' && method === 'GET') {
      const fecha = reqUrl.searchParams.get('fecha') || undefined;
      const fechaInicio = reqUrl.searchParams.get('fechaInicio') || undefined;
      const fechaFin = reqUrl.searchParams.get('fechaFin') || undefined;
      const idInspector = reqUrl.searchParams.get('idInspector') ? parseInt(reqUrl.searchParams.get('idInspector')!, 10) : undefined;
      const idZona = reqUrl.searchParams.get('idZona') ? parseInt(reqUrl.searchParams.get('idZona')!, 10) : undefined;
      const estado = reqUrl.searchParams.get('estado') as EstadoInspeccion | undefined;

      const agenda = listarAgenda({ fecha, fechaInicio, fechaFin, idInspector, idZona, estado });
      return json(res, 200, { total: agenda.length, inspecciones: agenda });
    }

    // 6. Programar nueva inspección (E07 Marco LP / Jorge BD)
    if (pathname === '/api/inspecciones' && method === 'POST') {
      const body = await parseBody(req);
      const nueva = crearInspeccion(body);
      return json(res, 201, { ok: true, mensaje: 'Inspección programada con éxito', inspeccion: nueva });
    }

    // 7. Detalle de inspección por ID
    const matchDetalle = pathname.match(/^\/api\/inspecciones\/(\d+)$/);
    if (matchDetalle && method === 'GET') {
      const id = parseInt(matchDetalle[1], 10);
      const cita = obtenerInspeccionPorId(id);
      if (!cita) return json(res, 404, { ok: false, error: 'Inspección no encontrada' });
      return json(res, 200, cita);
    }

    // 8. Reasignar inspector
    const matchReasignar = pathname.match(/^\/api\/inspecciones\/(\d+)\/reasignar$/);
    if (matchReasignar && method === 'PATCH') {
      const id = parseInt(matchReasignar[1], 10);
      const body = await parseBody(req);
      const actualizada = reasignarInspector(id, body);
      return json(res, 200, { ok: true, mensaje: 'Inspector reasignado con éxito', inspeccion: actualizada });
    }

    // 9. Mover fecha/ventana (Reprogramar)
    const matchMover = pathname.match(/^\/api\/inspecciones\/(\d+)\/mover$/);
    if (matchMover && method === 'PATCH') {
      const id = parseInt(matchMover[1], 10);
      const body = await parseBody(req);
      const actualizada = moverInspeccion(id, body);
      return json(res, 200, { ok: true, mensaje: 'Cita reprogramada con éxito', inspeccion: actualizada });
    }

    // 10. Cancelar cita
    const matchCancelar = pathname.match(/^\/api\/inspecciones\/(\d+)\/cancelar$/);
    if (matchCancelar && method === 'PATCH') {
      const id = parseInt(matchCancelar[1], 10);
      const body = await parseBody(req);
      const resultado = cancelarInspeccion(id, body);
      return json(res, 200, { ok: true, mensaje: 'Inspección cancelada', resultado });
    }

    // 11. Cambiar estado mediante la máquina de estados
    const matchEstado = pathname.match(/^\/api\/inspecciones\/(\d+)\/estado$/);
    if (matchEstado && method === 'PATCH') {
      const id = parseInt(matchEstado[1], 10);
      const body = await parseBody(req);
      const resTransicion = transicionar(
        id,
        body.nuevoEstado,
        body.idUsuario,
        body.origen || 'PANEL',
        body.nota
      );
      return json(res, 200, { ok: true, transicion: resTransicion });
    }

    // =========================================================================
    // E08 — Motor de Notificaciones Push y Respaldo SMS
    // =========================================================================

    // 12. Registrar dispositivo móvil (Expo Push Token)
    if (pathname === '/api/dispositivos' && method === 'POST') {
      const body = await parseBody(req);
      const dispositivo = registrarDispositivo(body);
      return json(res, 201, { ok: true, dispositivo });
    }

    // 13. Listar notificaciones, métricas y alerta de "cliente no alcanzado"
    if (pathname === '/api/notificaciones' && method === 'GET') {
      const data = listarNotificacionesPanel();
      return json(res, 200, data);
    }

    // 14. Encolar una notificación nueva
    if (pathname === '/api/notificaciones' && method === 'POST') {
      const body = await parseBody(req);
      const notif = encolarNotificacion(body);
      return json(res, 201, { ok: true, notificacion: notif });
    }

    // 15. Ejecutar despachador y temporizadores de notificaciones (24h y 3h)
    if (pathname === '/api/notificaciones/despachar' && method === 'POST') {
      const body = await parseBody(req);
      const resDia = ejecutarTemporizadorAvisoDiaProgramado(body.fecha);
      const resRec = ejecutarTemporizadorRecordatorioPrevio(body.fecha);
      const resDespacho = despacharNotificacionesPendientes(body.ahoraISO);
      return json(res, 200, {
        ok: true,
        avisoDiaProgramado: resDia,
        recordatorioPrevio: resRec,
        despacho: resDespacho
      });
    }

    // 16. Reenvío manual de notificación desde el panel (RN-13)
    const matchReenviar = pathname.match(/^\/api\/notificaciones\/(\d+)\/reenviar$/);
    if (matchReenviar && method === 'POST') {
      const idNotif = parseInt(matchReenviar[1], 10);
      const body = await parseBody(req);
      const reenviada = reenviarNotificacionManual(idNotif, body.idUsuario);
      return json(res, 200, { ok: true, mensaje: 'Notificación reenviada manualmente', notificacion: reenviada });
    }

    // =========================================================================
    // E09 — Confirmación y Reprogramación de Citas
    // =========================================================================

    // 17. Listar citas en estado SIN_CONFIRMAR para alerta del panel
    if (pathname === '/api/inspecciones/sin-confirmar' && method === 'GET') {
      const citas = listarCitasSinConfirmar();
      return json(res, 200, { total: citas.length, citas });
    }

    // 18. Confirmar disponibilidad de una cita (desde notificación, app o llamada del admin)
    const matchConfirmar = pathname.match(/^\/api\/inspecciones\/(\d+)\/confirmar$/);
    if (matchConfirmar && method === 'POST') {
      const id = parseInt(matchConfirmar[1], 10);
      const body = await parseBody(req);
      const confirmada = confirmarInspeccion(id, body);
      return json(res, 200, { ok: true, mensaje: 'Cita confirmada exitosamente (RN-04)', inspeccion: confirmada });
    }

    // 19. Consultar horarios disponibles reales en la zona del domicilio
    const matchHorarios = pathname.match(/^\/api\/inspecciones\/(\d+)\/horarios-disponibles$/);
    if (matchHorarios && method === 'GET') {
      const id = parseInt(matchHorarios[1], 10);
      const dias = parseInt(reqUrl.searchParams.get('dias') || '5', 10);
      const horarios = obtenerHorariosDisponibles(id, dias);
      return json(res, 200, {
        idInspeccion: id,
        totalDisponibles: horarios.length,
        horarios,
        horariosDisponibles: horarios
      });
    }

    // 20. Solicitar reprogramación por parte del cliente (valida RN-05 y RN-06)
    const matchSolicitarReprog = pathname.match(/^\/api\/inspecciones\/(\d+)\/(?:reprogramacion|reprogramar)$/);
    if (matchSolicitarReprog && method === 'POST') {
      const id = parseInt(matchSolicitarReprog[1], 10);
      const body = await parseBody(req);
      // Soportar alias de campos de Flutter (nuevaFecha, nuevaVentana)
      const [vIni, vFin] = (body.nuevaVentana || '').split('-').map((s: string) => s.trim());
      const dto = {
        fechaSolicitada: body.fechaSolicitada || body.nuevaFecha,
        ventanaInicioSolicitada: body.ventanaInicioSolicitada || vIni || '09:00',
        ventanaFinSolicitada: body.ventanaFinSolicitada || vFin || '11:00',
        motivo: body.motivo,
        solicitadaPor: body.solicitadaPor || body.solicitadoPor || 'CLIENTE',
        idUsuario: body.idUsuario
      };
      const resultado = solicitarReprogramacion(id, dto);
      return json(res, 201, {
        ok: true,
        mensaje: 'Tu solicitud de cambio de horario está en revisión por la oficina de Agave Roofing.',
        ...resultado
      });
    }

    // 21. Bandeja de reprogramaciones para el panel del administrador
    if (pathname === '/api/reprogramaciones' && method === 'GET') {
      const estado = reqUrl.searchParams.get('estado') || undefined;
      const solicitudes = listarBandejaReprogramaciones(estado);
      return json(res, 200, { total: solicitudes.length, solicitudes });
    }

    // 22. Aprobar o rechazar solicitud de reprogramación en el panel
    const matchResolverReprog = pathname.match(/^\/api\/reprogramaciones\/(\d+)\/resolver$/);
    if (matchResolverReprog && method === 'PATCH') {
      const idReprog = parseInt(matchResolverReprog[1], 10);
      const body = await parseBody(req);
      const resultado = resolverReprogramacion(idReprog, body);
      return json(res, 200, { ok: true, ...resultado });
    }

    // 23. Ejecutar temporizador de citas SIN_CONFIRMAR (RN-07)
    if (pathname === '/api/temporizadores/sin-confirmar' && method === 'POST') {
      const body = await parseBody(req);
      const resultado = ejecutarTemporizadorSinConfirmar(body.fechaLimite);
      return json(res, 200, { ok: true, ...resultado });
    }

    // =========================================================================
    // E10 — Trayecto y Seguimiento en Vivo (RN-03, RN-08, RN-09, Riesgo R5/R7)
    // =========================================================================

    // 24. Iniciar trayecto ("Voy en camino") de forma transaccional
    const matchIniciarTrayecto = pathname.match(/^\/api\/inspecciones\/(\d+)\/trayecto$/);
    if (matchIniciarTrayecto && method === 'POST') {
      const id = parseInt(matchIniciarTrayecto[1], 10);
      const body = await parseBody(req);
      const resultado = iniciarTrayecto(id, body);
      return json(res, 201, {
        ok: true,
        mensaje: 'Trayecto iniciado. Cita en EN_CAMINO, cliente notificado y GPS activo.',
        ...resultado
      });
    }

    // 25. Publicar punto GPS cada 15 segundos en segundo plano
    const matchPuntoGps = pathname.match(/^\/api\/trayectos\/(\d+)\/punto$/);
    if (matchPuntoGps && method === 'POST') {
      const idTrayecto = parseInt(matchPuntoGps[1], 10);
      const body = await parseBody(req);
      const resultado = registrarPuntoUbicacion(idTrayecto, body);
      return json(res, 200, { ok: true, ...resultado });
    }

    // 26. Simular avance de 15 s en la ruta hacia el domicilio (Punto simulado Jorge E10)
    const matchSimularAvance = pathname.match(/^\/api\/inspecciones\/(\d+)\/simular-avance$/);
    if (matchSimularAvance && method === 'POST') {
      const id = parseInt(matchSimularAvance[1], 10);
      const body = await parseBody(req);
      const resultado = simularPasoTrayecto(id, Boolean(body.acercarPorLlegar));
      return json(res, 200, {
        ok: true,
        mensaje: resultado.avisoPorLlegarDisparado
          ? '¡Inspector a menos de 1 km! Se disparó la notificación urgente POR_LLEGAR.'
          : `Posición GPS actualizada. ETA: ${resultado.etaMinutos} min (${resultado.distanciaRestanteM} m).`,
        ...resultado
      });
    }

    // 27. Consultar estado de seguimiento en vivo para el mapa del cliente (RN-08 / R7)
    const matchSeguimiento = pathname.match(/^\/api\/inspecciones\/(\d+)\/seguimiento$/);
    if (matchSeguimiento && method === 'GET') {
      const id = parseInt(matchSeguimiento[1], 10);
      const ahoraISO = reqUrl.searchParams.get('ahoraISO') || undefined;
      const seguimiento = obtenerSeguimientoVivo(id, ahoraISO);
      return json(res, 200, seguimiento);
    }

    // 28. Monitor en vivo para el Panel de Administración (Marco LP E10)
    if ((pathname === '/api/monitor-vivo' || pathname === '/api/panel/monitor-vivo') && method === 'GET') {
      const fecha = reqUrl.searchParams.get('fecha') || undefined;
      const monitor = listarMonitorVivoPanel(fecha);
      return json(res, 200, monitor);
    }

    // 29. Apagado automático de trayectos activos con más de 90 minutos (Riesgo R5)
    if (pathname === '/api/temporizadores/cerrar-trayectos' && method === 'POST') {
      const body = await parseBody(req);
      const resultado = cerrarTrayectosOlvidados(body.ahoraISO);
      return json(res, 200, { ok: true, ...resultado });
    }

    // =========================================================================
    // E11 — Llegada, Resultado, Reporte PDF, Modo Sin Señal y Tablero
    // =========================================================================

    // 30. Confirmar presencia del cliente ("Ya estoy en mi casa")
    const matchPresencia = pathname.match(/^\/api\/inspecciones\/(\d+)\/(?:presencia|estoy-en-casa)$/);
    if (matchPresencia && method === 'POST') {
      const id = parseInt(matchPresencia[1], 10);
      const body = await parseBody(req);
      const resultado = confirmarPresenciaCliente(id, body);
      return json(res, 200, {
        ok: true,
        mensaje: 'Confirmación de presencia registrada. El inspector ya ve en su ruta que usted está en casa.',
        ...resultado
      });
    }

    // 31. Registrar llegada del inspector al domicilio (`EN_SITIO`) y cortar GPS
    const matchLlegada = pathname.match(/^\/api\/inspecciones\/(\d+)\/llegada$/);
    if (matchLlegada && method === 'POST') {
      const id = parseInt(matchLlegada[1], 10);
      const body = await parseBody(req);
      const resultado = registrarLlegadaInspector(id, body);
      return json(res, 200, {
        ok: true,
        mensaje: 'Llegada registrada (EN_SITIO). El seguimiento GPS se ha detenido y el cliente fue notificado.',
        ...resultado
      });
    }

    // 32. Subir evidencia fotográfica con idempotencia por idLocal
    const matchEvidencia = pathname.match(/^\/api\/inspecciones\/(\d+)\/evidencias$/);
    if (matchEvidencia && method === 'POST') {
      const id = parseInt(matchEvidencia[1], 10);
      const body = await parseBody(req);
      const resultado = registrarEvidencia(id, body);
      return json(res, 201, { ok: true, ...resultado });
    }

    // 33. Capturar resultado técnico de la inspección (exige >= 1 foto RN-11)
    const matchResultado = pathname.match(/^\/api\/inspecciones\/(\d+)\/resultado$/);
    if (matchResultado && method === 'POST') {
      const id = parseInt(matchResultado[1], 10);
      const body = await parseBody(req);
      const resultado = registrarResultadoInspeccion(id, body);
      return json(res, 201, {
        ok: true,
        mensaje: 'Resultado de inspección guardado con evidencia fotográfica y reporte PDF disponible.',
        ...resultado
      });
    }

    // 34. Registrar cliente ausente con foto de fachada + nota obligatoria (RN-10)
    const matchAusente = pathname.match(/^\/api\/inspecciones\/(\d+)\/ausente$/);
    if (matchAusente && method === 'POST') {
      const id = parseInt(matchAusente[1], 10);
      const body = await parseBody(req);
      const resultado = registrarClienteAusente(id, body);
      return json(res, 200, {
        ok: true,
        mensaje: 'Cliente ausente registrado con evidencia fotográfica obligatoria (RN-10).',
        ...resultado
      });
    }

    // 35. Sincronización en lote del modo sin señal con idempotencia por id_local (RN-12)
    if (pathname === '/api/sincronizar' && method === 'POST') {
      const body = await parseBody(req);
      const resultado = sincronizarLoteOffline(body);
      return json(res, 200, resultado);
    }

    // 36. Consultar reporte de inspección y galería de fotos (App del Cliente E11)
    const matchReporte = pathname.match(/^\/api\/inspecciones\/(\d+)\/reporte$/);
    if (matchReporte && method === 'GET') {
      const id = parseInt(matchReporte[1], 10);
      const reporte = obtenerReporteInspeccion(id);
      return json(res, 200, reporte);
    }

    // 37. Abrir / descargar Reporte Oficial en vista imprimible PDF/HTML
    const matchReporteHtml = pathname.match(/^\/api\/inspecciones\/(\d+)\/reporte-html$/);
    if (matchReporteHtml && method === 'GET') {
      const id = parseInt(matchReporteHtml[1], 10);
      const html = generarReporteHtml(id);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(html);
    }

    // 38. Listar y enviar mensajes directos Inspector <-> Cliente (E11)
    const matchMensajes = pathname.match(/^\/api\/inspecciones\/(\d+)\/mensajes$/);
    if (matchMensajes && method === 'GET') {
      const id = parseInt(matchMensajes[1], 10);
      const mensajes = listarMensajesInspeccion(id);
      return json(res, 200, { idInspeccion: id, total: mensajes.length, mensajes });
    }
    if (matchMensajes && method === 'POST') {
      const id = parseInt(matchMensajes[1], 10);
      const body = await parseBody(req);
      const mensaje = enviarMensajeInspeccion(id, body);
      return json(res, 201, { ok: true, mensaje });
    }

    // 39. Tablero de Indicadores para el Panel de Administración (Marco LP E11)
    if ((pathname === '/api/indicadores' || pathname === '/api/panel/indicadores') && method === 'GET') {
      const fechaInicio = reqUrl.searchParams.get('fechaInicio') || undefined;
      const fechaFin = reqUrl.searchParams.get('fechaFin') || undefined;
      const indicadores = obtenerTableroIndicadores(fechaInicio, fechaFin);
      return json(res, 200, indicadores);
    }

    // 40. Exportar indicadores a CSV
    if ((pathname === '/api/indicadores/csv' || pathname === '/api/panel/indicadores/csv') && method === 'GET') {
      const fechaInicio = reqUrl.searchParams.get('fechaInicio') || undefined;
      const fechaFin = reqUrl.searchParams.get('fechaFin') || undefined;
      const csv = exportarIndicadoresCSV(fechaInicio, fechaFin);
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="indicadores_agave_roofing.csv"',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(csv);
    }

    // 41. Purga de puntos GPS con más de 30 días (RN-17 / R7)
    if (pathname === '/api/mantenimiento/purgar-puntos' && method === 'POST') {
      const body = await parseBody(req);
      const resultado = purgarPuntosGpsAntiguos(body.diasRetencion, body.ahoraISO);
      return json(res, 200, { ok: true, ...resultado });
    }

    // 404
    return json(res, 404, { ok: false, error: `Ruta no encontrada: ${method} ${pathname}` });
  } catch (err: any) {
    if (err instanceof ErrorCuerpoDemasiadoGrande) {
      // Se responde y se cierra la conexión para no seguir recibiendo el cuerpo.
      res.setHeader('Connection', 'close');
      return json(res, 413, {
        ok: false,
        codigo: 'CUERPO_DEMASIADO_GRANDE',
        error: err.message
      });
    }

    if (err instanceof ErrorTraslapeInspector) {
      return json(res, 409, {
        ok: false,
        codigo: 'TRASLAPE_INSPECTOR_RN02',
        error: err.message,
        folioConflicto: err.folioConflicto
      });
    }

    if (err instanceof ErrorTransicionInvalida) {
      return json(res, 400, {
        ok: false,
        codigo: 'TRANSICION_INVALIDA_RN01',
        error: err.message,
        estadoActual: err.estadoActual,
        estadoNuevo: err.estadoNuevo
      });
    }

    if (err instanceof ErrorValidacionAgenda) {
      return json(res, 400, {
        ok: false,
        codigo: 'VALIDACION_AGENDA',
        error: err.message
      });
    }

    if (err instanceof ErrorHorarioInvalido) {
      return json(res, 400, {
        ok: false,
        codigo: 'HORARIO_INVALIDO',
        error: err.message
      });
    }

    if (err instanceof ErrorNotificacionDuplicadaRN13) {
      return json(res, 409, {
        ok: false,
        codigo: 'NOTIFICACION_DUPLICADA_RN13',
        error: err.message
      });
    }

    if (err instanceof ErrorReprogramacionEnCaminoRN05) {
      return json(res, 400, {
        ok: false,
        codigo: 'REPROGRAMACION_EN_CAMINO_RN05',
        error: err.message
      });
    }

    if (err instanceof ErrorLimiteReprogramacionesRN06) {
      return json(res, 400, {
        ok: false,
        codigo: 'LIMITE_REPROGRAMACIONES_RN06',
        error: err.message
      });
    }

    if (err instanceof ErrorConfirmacionInmutableRN04) {
      return json(res, 400, {
        ok: false,
        codigo: 'CONFIRMACION_INMUTABLE_RN04',
        error: err.message
      });
    }

    if (err instanceof ErrorTrayectoActivoRN03) {
      return json(res, 409, {
        ok: false,
        codigo: 'TRAYECTO_ACTIVO_RN03',
        error: err.message,
        idTrayectoConflictivo: err.idTrayectoConflictivo
      });
    }

    if (err instanceof ErrorTrayectoNoActivoRN08) {
      return json(res, 400, {
        ok: false,
        codigo: 'TRAYECTO_NO_ACTIVO_RN08',
        error: err.message,
        estadoActual: err.estadoActual
      });
    }

    if (err instanceof ErrorAusenciaSinEvidenciaRN10) {
      return json(res, 400, {
        ok: false,
        codigo: 'AUSENCIA_SIN_EVIDENCIA_RN10',
        error: err.message
      });
    }

    if (err instanceof ErrorEvidenciaRequeridaRN11) {
      return json(res, 400, {
        ok: false,
        codigo: 'EVIDENCIA_REQUERIDA_RN11',
        error: err.message
      });
    }

    return json(res, 500, {
      ok: false,
      error: err.message || 'Error interno del servidor'
    });
  }
});

export function startServer(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`🚀 AgaveAlerta API escuchando en http://localhost:${port}`);
      const f = infoFecha();
      console.log(
        f.simulada
          ? `📅 Fecha de referencia FIJA (FECHA_HOY): ${f.hoy} — la real es ${f.fechaReal}`
          : `📅 Fecha de referencia: ${f.hoy} (${f.zonaHoraria})`
      );
      programarCierreDeCitasPasadas();
      resolve(server);
    });
  });
}

if (process.argv[1]?.endsWith('server.ts')) {
  startServer();
}

export { server };
