import assert from 'node:assert';
import { runSeed, CONTRASENA_INICIAL } from '../src/seed.ts';
import { db } from '../src/db.ts';
import {
  autorizar,
  cerrarSesion,
  esRutaPublica,
  hashContrasena,
  iniciarSesion,
  normalizarTelefono,
  obtenerSesion,
  verificarContrasena,
  ErrorCredenciales,
  ErrorRolNoPermitido
} from '../src/services/authService.ts';

// RF-01, RF-02, RF-03, RF-05 y RF-07 — sobre la semilla de demostración.
runSeed();

// 1. Hash de contraseña: no se guarda en claro y solo verifica la correcta
const h = hashContrasena('secreta123');
assert.ok(h.startsWith('scrypt$') && !h.includes('secreta123'));
assert.strictEqual(verificarContrasena('secreta123', h), true);
assert.strictEqual(verificarContrasena('otra', h), false);
assert.strictEqual(verificarContrasena('secreta123', null), false);
const guardada = db.prepare(`SELECT contrasena_hash FROM usuario WHERE id_usuario = 'u-insp-001'`).get() as any;
assert.ok(guardada.contrasena_hash.startsWith('scrypt$'));
console.log('▶ [Auth-1] Contraseñas guardadas solo como hash scrypt');

// 2. Inspector con correo (sin importar mayúsculas) y cliente con teléfono en cualquier formato
const insp = iniciarSesion({ correo: 'Carlos.Garza@agaveroofing.com', contrasena: CONTRASENA_INICIAL, rolRequerido: 'INSPECTOR', app: 'APP_INSP' });
assert.strictEqual(insp.rol, 'INSPECTOR');
assert.strictEqual(insp.idInspector, 1);
assert.strictEqual(normalizarTelefono('+1-210-555-0201'), '2105550201');
const cli = iniciarSesion({ telefono: '(210) 555 0201', contrasena: CONTRASENA_INICIAL, rolRequerido: 'CLIENTE', app: 'APP_CLI' });
assert.strictEqual(cli.idCliente, 1);
assert.ok(cli.token.length >= 40);
console.log('▶ [Auth-2] Inicio de sesión de inspector (correo) y cliente (teléfono)');

// 3. Contraseña incorrecta, cuenta inexistente y app equivocada
assert.throws(() => iniciarSesion({ correo: 'carlos.garza@agaveroofing.com', contrasena: 'mala' }), ErrorCredenciales);
assert.throws(() => iniciarSesion({ correo: 'nadie@agaveroofing.com', contrasena: CONTRASENA_INICIAL }), ErrorCredenciales);
assert.throws(() => iniciarSesion({ correo: 'carlos.garza@agaveroofing.com' }), ErrorCredenciales);
assert.throws(
  () => iniciarSesion({ correo: 'carlos.garza@agaveroofing.com', contrasena: CONTRASENA_INICIAL, rolRequerido: 'CLIENTE' }),
  ErrorRolNoPermitido
);
const fallidos = db.prepare(`SELECT COUNT(*) AS n FROM bitacora WHERE accion IN ('LOGIN_FALLIDO', 'LOGIN_RECHAZADO_ROL')`).get() as any;
assert.ok(fallidos.n >= 4);
console.log('▶ [Auth-3] Credenciales inválidas y app equivocada se rechazan y quedan en bitácora');

// 4. Rutas públicas y permisos por rol
assert.strictEqual(esRutaPublica('POST', '/api/auth/login'), true);
assert.strictEqual(esRutaPublica('GET', '/api/inspecciones/mias'), false);
assert.strictEqual(autorizar(cli, 'GET', '/api/inspecciones/mias').ok, true);
assert.strictEqual(autorizar(cli, 'GET', '/api/inspecciones/mi-ruta').ok, false);
assert.strictEqual(autorizar(insp, 'GET', '/api/inspecciones/mi-ruta').ok, true);
assert.strictEqual(autorizar(insp, 'POST', '/api/inspecciones').ok, false); // solo el admin programa
assert.strictEqual(autorizar(cli, 'GET', '/api/catalogos').ok, false);
const admin = iniciarSesion({ correo: 'marco.admin@agaveroofing.com', contrasena: CONTRASENA_INICIAL, rolRequerido: 'ADMINISTRADOR' });
assert.strictEqual(autorizar(admin, 'POST', '/api/inspecciones').ok, true);
console.log('▶ [Auth-4] Cada rol solo usa sus rutas (RF-02)');

// 5. Solo sus propias citas (RF-07): cita 10 es de Robert (cliente 1) con Carlos (inspector 1);
//    la 12 es de Elena (cliente 4) con David (inspector 2).
assert.strictEqual(autorizar(cli, 'POST', '/api/inspecciones/10/confirmar').ok, true);
const ajenaCli = autorizar(cli, 'GET', '/api/inspecciones/12/seguimiento');
assert.strictEqual(ajenaCli.ok, false);
assert.strictEqual(!ajenaCli.ok && ajenaCli.status, 404);
assert.strictEqual(autorizar(insp, 'POST', '/api/inspecciones/10/llegada').ok, true);
assert.strictEqual(autorizar(insp, 'POST', '/api/inspecciones/12/llegada').ok, false);
const trayectoDavid = db.prepare(`SELECT id_trayecto FROM trayecto WHERE id_inspector = 2 AND estado = 'ACTIVO'`).get() as any;
assert.strictEqual(autorizar(insp, 'POST', `/api/trayectos/${trayectoDavid.id_trayecto}/punto`).ok, false);
console.log('▶ [Auth-5] Cliente e inspector no pueden tocar citas ni trayectos ajenos (RF-07)');

// 6. La sesión persiste hasta cerrarla (RF-05)
assert.strictEqual(obtenerSesion(insp.token)?.idInspector, 1);
assert.strictEqual(obtenerSesion('token-inventado'), null);
cerrarSesion(insp.token);
assert.strictEqual(obtenerSesion(insp.token), null);
db.prepare(`UPDATE usuario SET activo = 0 WHERE id_usuario = 'u-cli-001'`).run();
assert.strictEqual(obtenerSesion(cli.token), null, 'un usuario desactivado pierde su sesión');
console.log('▶ [Auth-6] Cerrar sesión y desactivar al usuario invalidan el token');

// 7. Semilla de cuentas: sin citas, pero todos pueden entrar (incluido Michael Flores)
runSeed({ conCitas: false });
const citas = db.prepare('SELECT COUNT(*) AS n FROM inspeccion').get() as any;
assert.strictEqual(citas.n, 0);
const michael = iniciarSesion({ telefono: '2105550310', contrasena: CONTRASENA_INICIAL, rolRequerido: 'CLIENTE' });
assert.strictEqual(michael.idCliente, 3);
const domicilios = db.prepare('SELECT COUNT(*) AS n FROM domicilio WHERE latitud IS NOT NULL').get() as any;
assert.strictEqual(domicilios.n, 4);
console.log('▶ [Auth-7] Semilla de cuentas: 0 citas, 4 clientes con domicilio y acceso');

runSeed();
console.log('✅ auth: 7 grupos de pruebas OK');
