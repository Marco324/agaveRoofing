import crypto from 'node:crypto';
import { db } from '../db.ts';

// =============================================================================
// RF-01, RF-02, RF-03, RF-05, RF-07 — Inicio de sesión, sesiones y permisos
//
// - Administrador e Inspector entran con correo y contraseña; el Cliente con
//   teléfono y contraseña (el SRS pide OTP para el cliente: queda pendiente).
// - La contraseña se guarda solo como hash scrypt con sal propia.
// - Cada inicio de sesión crea un token aleatorio en la tabla `sesion`; las apps
//   lo guardan y lo mandan en `Authorization: Bearer <token>`.
// =============================================================================

export type Rol = 'ADMINISTRADOR' | 'INSPECTOR' | 'CLIENTE';

export interface SesionActiva {
  token: string;
  idUsuario: string;
  nombre: string;
  rol: Rol;
  correo: string | null;
  telefono: string | null;
  idCliente: number | null;
  idInspector: number | null;
  expiraEn: string;
}

/**
 * Contraseña inicial de las cuentas de prueba (semilla y cuentas que aún no
 * tienen contraseña). Cámbiala con AGAVE_CONTRASENA_INICIAL si la base va a estar expuesta.
 */
export const CONTRASENA_INICIAL = process.env.AGAVE_CONTRASENA_INICIAL || 'Agave2026';

/** Duración de una sesión: las apps la conservan entre aperturas (RF-05). */
const DIAS_SESION = 30;

export class ErrorCredenciales extends Error {
  constructor(mensaje = 'Correo, teléfono o contraseña incorrectos.') {
    super(mensaje);
    this.name = 'ErrorCredenciales';
  }
}

export class ErrorRolNoPermitido extends Error {
  rolUsuario: string;
  rolRequerido: string;

  constructor(rolUsuario: string, rolRequerido: string) {
    super(`Esta aplicación es para ${nombreRol(rolRequerido)}; tu cuenta es de ${nombreRol(rolUsuario)}.`);
    this.name = 'ErrorRolNoPermitido';
    this.rolUsuario = rolUsuario;
    this.rolRequerido = rolRequerido;
  }
}

function nombreRol(rol: string): string {
  switch (rol) {
    case 'ADMINISTRADOR': return 'administradores';
    case 'INSPECTOR': return 'inspectores';
    case 'CLIENTE': return 'clientes';
    default: return rol.toLowerCase();
  }
}

// -----------------------------------------------------------------------------
// Contraseñas
// -----------------------------------------------------------------------------

export function hashContrasena(contrasena: string): string {
  const sal = crypto.randomBytes(16);
  const hash = crypto.scryptSync(contrasena, sal, 64);
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`;
}

export function verificarContrasena(contrasena: string, guardado: string | null | undefined): boolean {
  if (!guardado) return false;
  const [algoritmo, salHex, hashHex] = guardado.split('$');
  if (algoritmo !== 'scrypt' || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = crypto.scryptSync(contrasena, Buffer.from(salHex, 'hex'), esperado.length);
  return crypto.timingSafeEqual(esperado, calculado);
}

export function asignarContrasena(idUsuario: string, contrasena: string) {
  db.prepare('UPDATE usuario SET contrasena_hash = ? WHERE id_usuario = ?').run(hashContrasena(contrasena), idUsuario);
}

/**
 * Una base creada antes de RF-01 tiene usuarios sin contraseña: se les asigna la
 * inicial para que puedan entrar. Devuelve cuántos se completaron.
 */
export function completarContrasenasFaltantes(): number {
  const pendientes = db.prepare('SELECT id_usuario FROM usuario WHERE contrasena_hash IS NULL').all() as any[];
  for (const u of pendientes) asignarContrasena(u.id_usuario, CONTRASENA_INICIAL);
  return pendientes.length;
}

/** Últimos 10 dígitos: "+1-210-555-0201", "(210) 555 0201" y "2105550201" son el mismo teléfono. */
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, '').slice(-10);
}

// -----------------------------------------------------------------------------
// Sesiones
// -----------------------------------------------------------------------------

function buscarUsuario(dto: { correo?: string; telefono?: string }): any {
  const base = `
    SELECT u.*, r.nombre AS rol_nombre
    FROM usuario u
    JOIN rol r ON u.id_rol = r.id_rol
    WHERE u.activo = 1
  `;
  if (dto.correo && dto.correo.trim()) {
    return db.prepare(`${base} AND lower(u.correo) = lower(?)`).get(dto.correo.trim());
  }
  if (dto.telefono && dto.telefono.trim()) {
    const buscado = normalizarTelefono(dto.telefono);
    if (buscado.length < 10) return undefined;
    const candidatos = db.prepare(`${base} AND u.telefono IS NOT NULL`).all() as any[];
    return candidatos.find((u) => normalizarTelefono(u.telefono) === buscado);
  }
  return undefined;
}

function perfilDe(usuario: any) {
  const cliente = db.prepare('SELECT id_cliente FROM cliente WHERE id_usuario = ? AND activo = 1').get(usuario.id_usuario) as any;
  const inspector = db.prepare('SELECT id_inspector FROM inspector WHERE id_usuario = ? AND activo = 1').get(usuario.id_usuario) as any;
  return {
    idCliente: cliente?.id_cliente ?? null,
    idInspector: inspector?.id_inspector ?? null
  };
}

function registrarBitacora(idUsuario: string | null, rol: string | null, accion: string, detalle: string) {
  db.prepare(`
    INSERT INTO bitacora (id_usuario, rol, accion, entidad, id_registro, detalle)
    VALUES (?, ?, ?, 'usuario', ?, ?)
  `).run(idUsuario, rol, accion, idUsuario, detalle);
}

export function iniciarSesion(dto: {
  correo?: string;
  telefono?: string;
  contrasena?: string;
  rolRequerido?: Rol;
  app?: string;
}): SesionActiva {
  const contrasena = dto.contrasena ?? '';
  const usuario = buscarUsuario(dto);

  if (!usuario || !contrasena || !verificarContrasena(contrasena, usuario.contrasena_hash)) {
    registrarBitacora(usuario?.id_usuario ?? null, usuario?.rol_nombre ?? null, 'LOGIN_FALLIDO',
      `Intento fallido desde ${dto.app || 'desconocida'} (${dto.correo ? 'correo' : 'teléfono'})`);
    throw new ErrorCredenciales();
  }

  if (dto.rolRequerido && usuario.rol_nombre !== dto.rolRequerido) {
    registrarBitacora(usuario.id_usuario, usuario.rol_nombre, 'LOGIN_RECHAZADO_ROL',
      `Cuenta de ${usuario.rol_nombre} intentó entrar a la app de ${dto.rolRequerido}`);
    throw new ErrorRolNoPermitido(usuario.rol_nombre, dto.rolRequerido);
  }

  const perfil = perfilDe(usuario);
  if (usuario.rol_nombre === 'CLIENTE' && perfil.idCliente === null) {
    throw new ErrorCredenciales('Tu cuenta no tiene un cliente activo. Llama a Agave Roofing.');
  }
  if (usuario.rol_nombre === 'INSPECTOR' && perfil.idInspector === null) {
    throw new ErrorCredenciales('Tu cuenta no tiene un inspector activo. Avisa a la oficina.');
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const expira = new Date(Date.now() + DIAS_SESION * 24 * 3600 * 1000).toISOString();
  db.prepare(`INSERT INTO sesion (token, id_usuario, app, expira_en) VALUES (?, ?, ?, ?)`)
    .run(token, usuario.id_usuario, dto.app || null, expira);

  registrarBitacora(usuario.id_usuario, usuario.rol_nombre, 'LOGIN_EXITOSO',
    `Inicio de sesión en ${dto.app || 'desconocida'}`);

  return {
    token,
    idUsuario: usuario.id_usuario,
    nombre: usuario.nombre_completo,
    rol: usuario.rol_nombre,
    correo: usuario.correo,
    telefono: usuario.telefono,
    ...perfil,
    expiraEn: expira
  };
}

/** Devuelve la sesión del token si sigue vigente y el usuario sigue activo. */
export function obtenerSesion(token: string | null | undefined): SesionActiva | null {
  if (!token) return null;
  const fila = db.prepare(`
    SELECT s.token, s.expira_en, u.*, r.nombre AS rol_nombre
    FROM sesion s
    JOIN usuario u ON u.id_usuario = s.id_usuario
    JOIN rol r ON r.id_rol = u.id_rol
    WHERE s.token = ? AND s.cerrada_en IS NULL AND u.activo = 1
  `).get(token) as any;
  if (!fila) return null;
  if (new Date(fila.expira_en).getTime() < Date.now()) return null;
  return {
    token: fila.token,
    idUsuario: fila.id_usuario,
    nombre: fila.nombre_completo,
    rol: fila.rol_nombre,
    correo: fila.correo,
    telefono: fila.telefono,
    ...perfilDe(fila),
    expiraEn: fila.expira_en
  };
}

export function cerrarSesion(token: string) {
  const sesion = obtenerSesion(token);
  db.prepare(`UPDATE sesion SET cerrada_en = datetime('now') WHERE token = ? AND cerrada_en IS NULL`).run(token);
  if (sesion) registrarBitacora(sesion.idUsuario, sesion.rol, 'LOGOUT', 'Cierre de sesión');
}

/** Lo que el cliente de la API ve de su sesión (sin el token). */
export function sesionPublica(s: SesionActiva) {
  return {
    idUsuario: s.idUsuario,
    nombre: s.nombre,
    rol: s.rol,
    correo: s.correo,
    telefono: s.telefono,
    idCliente: s.idCliente,
    idInspector: s.idInspector,
    expiraEn: s.expiraEn
  };
}

// -----------------------------------------------------------------------------
// Permisos por rol (RF-02) y por dueño de la inspección (RF-07)
// -----------------------------------------------------------------------------

/** Rutas que no piden sesión. */
const RUTAS_PUBLICAS: Array<[string, RegExp]> = [
  ['GET', /^\/api\/salud$/],
  ['GET', /^\/api\/sistema\/fecha$/],
  ['POST', /^\/api\/auth\/login$/],
  // El acuse lo manda el teléfono al recibir el push, incluso con la app cerrada.
  ['POST', /^\/api\/notificaciones\/\d+\/acuse$/]
];

type Recurso = 'inspeccion' | 'trayecto' | null;

interface Regla {
  metodo: string;
  patron: RegExp;
  roles: Rol[];
  /** Qué recurso del grupo 1 de la expresión hay que revisar que sea suyo. */
  recurso: Recurso;
}

/**
 * Lo que pueden hacer Inspector y Cliente. Todo lo demás es solo del Administrador.
 * El Administrador puede usar cualquier ruta.
 */
const REGLAS: Regla[] = [
  { metodo: 'GET', patron: /^\/api\/auth\/sesion$/, roles: ['INSPECTOR', 'CLIENTE'], recurso: null },
  { metodo: 'POST', patron: /^\/api\/auth\/logout$/, roles: ['INSPECTOR', 'CLIENTE'], recurso: null },
  { metodo: 'POST', patron: /^\/api\/dispositivos$/, roles: ['INSPECTOR', 'CLIENTE'], recurso: null },

  // Inspector
  { metodo: 'GET', patron: /^\/api\/inspecciones\/mi-ruta$/, roles: ['INSPECTOR'], recurso: null },
  { metodo: 'GET', patron: /^\/api\/inspecciones$/, roles: ['INSPECTOR'], recurso: null },
  { metodo: 'POST', patron: /^\/api\/inspecciones\/(\d+)\/trayecto$/, roles: ['INSPECTOR'], recurso: 'inspeccion' },
  { metodo: 'POST', patron: /^\/api\/trayectos\/(\d+)\/punto$/, roles: ['INSPECTOR'], recurso: 'trayecto' },
  { metodo: 'POST', patron: /^\/api\/inspecciones\/(\d+)\/simular-avance$/, roles: ['INSPECTOR'], recurso: 'inspeccion' },
  { metodo: 'POST', patron: /^\/api\/inspecciones\/(\d+)\/llegada$/, roles: ['INSPECTOR'], recurso: 'inspeccion' },
  { metodo: 'POST', patron: /^\/api\/inspecciones\/(\d+)\/evidencias$/, roles: ['INSPECTOR'], recurso: 'inspeccion' },
  { metodo: 'POST', patron: /^\/api\/inspecciones\/(\d+)\/resultado$/, roles: ['INSPECTOR'], recurso: 'inspeccion' },
  { metodo: 'POST', patron: /^\/api\/inspecciones\/(\d+)\/ausente$/, roles: ['INSPECTOR'], recurso: 'inspeccion' },
  { metodo: 'POST', patron: /^\/api\/sincronizar$/, roles: ['INSPECTOR'], recurso: null },

  // Cliente
  { metodo: 'GET', patron: /^\/api\/inspecciones\/mias$/, roles: ['CLIENTE'], recurso: null },
  { metodo: 'POST', patron: /^\/api\/inspecciones\/(\d+)\/confirmar$/, roles: ['CLIENTE'], recurso: 'inspeccion' },
  { metodo: 'GET', patron: /^\/api\/inspecciones\/(\d+)\/horarios-disponibles$/, roles: ['CLIENTE'], recurso: 'inspeccion' },
  { metodo: 'POST', patron: /^\/api\/inspecciones\/(\d+)\/(?:reprogramacion|reprogramar)$/, roles: ['CLIENTE'], recurso: 'inspeccion' },
  { metodo: 'POST', patron: /^\/api\/inspecciones\/(\d+)\/(?:presencia|estoy-en-casa)$/, roles: ['CLIENTE'], recurso: 'inspeccion' },
  { metodo: 'POST', patron: /^\/api\/encuestas-piloto$/, roles: ['CLIENTE'], recurso: null },

  // Ambos, sobre sus propias citas
  { metodo: 'GET', patron: /^\/api\/inspecciones\/(\d+)$/, roles: ['INSPECTOR', 'CLIENTE'], recurso: 'inspeccion' },
  { metodo: 'GET', patron: /^\/api\/inspecciones\/(\d+)\/seguimiento$/, roles: ['INSPECTOR', 'CLIENTE'], recurso: 'inspeccion' },
  { metodo: 'GET', patron: /^\/api\/inspecciones\/(\d+)\/reporte$/, roles: ['INSPECTOR', 'CLIENTE'], recurso: 'inspeccion' },
  { metodo: 'GET', patron: /^\/api\/inspecciones\/(\d+)\/reporte-html$/, roles: ['INSPECTOR', 'CLIENTE'], recurso: 'inspeccion' },
  { metodo: 'GET', patron: /^\/api\/inspecciones\/(\d+)\/mensajes$/, roles: ['INSPECTOR', 'CLIENTE'], recurso: 'inspeccion' },
  { metodo: 'POST', patron: /^\/api\/inspecciones\/(\d+)\/mensajes$/, roles: ['INSPECTOR', 'CLIENTE'], recurso: 'inspeccion' }
];

export function esRutaPublica(metodo: string, ruta: string): boolean {
  return RUTAS_PUBLICAS.some(([m, p]) => m === metodo && p.test(ruta));
}

export type ResultadoAutorizacion =
  | { ok: true }
  | { ok: false; status: 403 | 404; codigo: string; error: string };

function esSuya(sesion: SesionActiva, recurso: Recurso, id: number): boolean {
  if (recurso === 'inspeccion') {
    const fila = db.prepare('SELECT id_cliente, id_inspector FROM inspeccion WHERE id_inspeccion = ?').get(id) as any;
    if (!fila) return false;
    if (sesion.rol === 'CLIENTE') return fila.id_cliente === sesion.idCliente;
    if (sesion.rol === 'INSPECTOR') return fila.id_inspector === sesion.idInspector;
  }
  if (recurso === 'trayecto') {
    const fila = db.prepare('SELECT id_inspector FROM trayecto WHERE id_trayecto = ?').get(id) as any;
    return Boolean(fila) && sesion.rol === 'INSPECTOR' && fila.id_inspector === sesion.idInspector;
  }
  return false;
}

export function autorizar(sesion: SesionActiva, metodo: string, ruta: string): ResultadoAutorizacion {
  if (sesion.rol === 'ADMINISTRADOR') return { ok: true };

  for (const regla of REGLAS) {
    if (regla.metodo !== metodo) continue;
    const m = ruta.match(regla.patron);
    if (!m) continue;
    if (!regla.roles.includes(sesion.rol)) break;
    if (regla.recurso && !esSuya(sesion, regla.recurso, parseInt(m[1], 10))) {
      // 404 y no 403: no se revela si la cita de otra persona existe.
      return { ok: false, status: 404, codigo: 'NO_ENCONTRADA', error: 'No encontramos esa cita en tu cuenta.' };
    }
    return { ok: true };
  }

  return {
    ok: false,
    status: 403,
    codigo: 'ACCESO_DENEGADO_ROL',
    error: 'Tu cuenta no tiene permiso para esta operación.'
  };
}

/** Token de `Authorization: Bearer …`, o de `?token=` para enlaces que se abren en el navegador (reporte, CSV). */
export function tokenDePeticion(headers: Record<string, string | string[] | undefined>, url: URL): string | null {
  const encabezado = headers['authorization'];
  const valor = Array.isArray(encabezado) ? encabezado[0] : encabezado;
  if (valor && /^Bearer\s+/i.test(valor)) return valor.replace(/^Bearer\s+/i, '').trim();
  return url.searchParams.get('token');
}
