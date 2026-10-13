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
  ErrorHorarioInvalido
} from './services/agendaService.ts';
import { transicionar, ErrorTransicionInvalida } from './services/maquinaEstadosService.ts';
import { obtenerRutaDelDia } from './services/rutaInspectorService.ts';
import { obtenerMisCitas } from './services/misCitasClienteService.ts';
import { EstadoInspeccion, OrigenTransicion } from '../../shared/src/types/estados.ts';

initDatabase();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

function json(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
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
        version: '1.0.0-E07',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Catálogos para selectores
    if (pathname === '/api/catalogos' && method === 'GET') {
      const zonas = db.prepare('SELECT * FROM zona WHERE activo = 1').all();
      const inspectores = db.prepare('SELECT id_inspector, nombre, telefono, placa_vehiculo FROM inspector WHERE activo = 1').all();
      const clientes = db.prepare('SELECT id_cliente, nombre, telefono, correo FROM cliente WHERE activo = 1').all();
      const domicilios = db.prepare(`
        SELECT d.*, c.nombre AS cliente_nombre, z.nombre AS zona_nombre
        FROM domicilio d
        JOIN cliente c ON d.id_cliente = c.id_cliente
        LEFT JOIN zona z ON d.id_zona = z.id_zona
        WHERE d.activo = 1
      `).all();

      return json(res, 200, { zonas, inspectores, clientes, domicilios });
    }

    // 3. Ruta del día del inspector (E07 Anuar IN)
    if (pathname === '/api/inspecciones/mi-ruta' && method === 'GET') {
      const idInspector = parseInt(reqUrl.searchParams.get('idInspector') || '1', 10);
      const fecha = reqUrl.searchParams.get('fecha') || new Date().toISOString().split('T')[0];
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

    // 404
    return json(res, 404, { ok: false, error: `Ruta no encontrada: ${method} ${pathname}` });
  } catch (err: any) {
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

    if (err instanceof ErrorHorarioInvalido) {
      return json(res, 400, {
        ok: false,
        codigo: 'HORARIO_INVALIDO',
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
      resolve(server);
    });
  });
}

if (process.argv[1]?.endsWith('server.ts')) {
  startServer();
}

export { server };
