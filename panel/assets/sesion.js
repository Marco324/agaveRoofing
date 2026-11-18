// =============================================================================
// Inicio de sesión del panel de administración (RF-01, RF-05, RF-07)
//
// Uso:
//   const sesion = SesionAgave.crear({ apiUrl, rol: 'ADMINISTRADOR', app: 'PANEL',
//                                      titulo: 'Panel de operaciones', campo: 'correo' });
//   const usuario = await sesion.asegurar();   // muestra el formulario si hace falta
//
// - Guarda el token en localStorage (la sesión sigue al recargar, RF-05).
// - Agrega `Authorization: Bearer <token>` a toda petición fetch hacia la API.
// - Si la API responde 401 (sesión vencida o cerrada), vuelve a pedir la contraseña.
// =============================================================================
(function () {
  'use strict';

  function leer(clave) {
    try { return JSON.parse(localStorage.getItem(clave) || 'null'); } catch (_) { return null; }
  }
  function guardar(clave, valor) {
    try {
      if (valor) localStorage.setItem(clave, JSON.stringify(valor));
      else localStorage.removeItem(clave);
    } catch (_) { /* sin almacenamiento: la sesión dura lo que la pestaña */ }
  }

  function crear(opciones) {
    const apiUrl = opciones.apiUrl.replace(/\/+$/, '');
    const clave = `agave.sesion.${opciones.app}`;
    const campo = opciones.campo === 'telefono' ? 'telefono' : 'correo';
    let actual = leer(clave); // { token, usuario }
    let pidiendo = null;
    const fetchOriginal = window.fetch.bind(window);

    function esDeLaApi(url) {
      return typeof url === 'string' ? url.startsWith(apiUrl) : (url && url.url ? url.url.startsWith(apiUrl) : false);
    }

    // Toda petición a la API sale con el token.
    window.fetch = async function (url, init) {
      if (!esDeLaApi(url) || !actual) return fetchOriginal(url, init);
      const conToken = Object.assign({}, init || {});
      const headers = new Headers(conToken.headers || {});
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${actual.token}`);
      conToken.headers = headers;
      const res = await fetchOriginal(url, conToken);
      if (res.status === 401 && !String(url).includes('/auth/')) {
        guardar(clave, null);
        actual = null;
        // La pantalla vuelve a pedir la contraseña y se recarga para empezar limpia.
        pedirCredenciales('Tu sesión terminó. Vuelve a iniciar sesión.').then(() => location.reload());
      }
      return res;
    };

    function estilos() {
      if (document.getElementById('agaveSesionEstilos')) return;
      const css = document.createElement('style');
      css.id = 'agaveSesionEstilos';
      css.textContent = `
        .agave-sesion-fondo{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
          padding:16px;background:linear-gradient(135deg,#0f172a,#064e3b);font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
        .agave-sesion-caja{width:100%;max-width:380px;background:#fff;border-radius:18px;padding:28px 24px;
          box-shadow:0 20px 50px rgba(0,0,0,.35);color:#0f172a}
        .agave-sesion-caja h1{margin:12px 0 4px;font-size:22px;font-weight:800}
        .agave-sesion-caja p{margin:0 0 18px;font-size:14px;color:#475569}
        .agave-sesion-caja label{display:block;font-size:13px;font-weight:600;margin:12px 0 6px;color:#334155}
        .agave-sesion-caja input{width:100%;box-sizing:border-box;font-size:16px;padding:12px;border:1px solid #cbd5e1;
          border-radius:10px;background:#f8fafc}
        .agave-sesion-caja input:focus{outline:2px solid #059669;border-color:#059669;background:#fff}
        .agave-sesion-caja button{width:100%;margin-top:20px;min-height:48px;border:0;border-radius:10px;background:#059669;
          color:#fff;font-size:16px;font-weight:700;cursor:pointer}
        .agave-sesion-caja button[disabled]{opacity:.6;cursor:wait}
        .agave-sesion-error{margin-top:14px;padding:10px 12px;border-radius:10px;background:#fef2f2;color:#b91c1c;
          font-size:14px;display:none}
        .agave-sesion-logo{width:56px;height:56px;border-radius:14px;background:#04949C;padding:8px;box-sizing:border-box}
      `;
      document.head.appendChild(css);
    }

    function pedirCredenciales(aviso) {
      if (pidiendo) return pidiendo;
      estilos();
      pidiendo = new Promise((resolve) => {
        const fondo = document.createElement('div');
        fondo.className = 'agave-sesion-fondo';
        fondo.innerHTML = `
          <form class="agave-sesion-caja" novalidate>
            ${opciones.logo ? `<img class="agave-sesion-logo" src="${opciones.logo}" alt="Agave Roofing">` : ''}
            <h1>${opciones.titulo}</h1>
            <p>${aviso || 'Inicia sesión para continuar.'}</p>
            <label for="agaveSesionUsuario">${campo === 'telefono' ? 'Teléfono' : 'Correo'}</label>
            <input id="agaveSesionUsuario" name="usuario" autocomplete="username"
              type="${campo === 'telefono' ? 'tel' : 'email'}" inputmode="${campo === 'telefono' ? 'tel' : 'email'}" required>
            <label for="agaveSesionContrasena">Contraseña</label>
            <input id="agaveSesionContrasena" name="contrasena" type="password" autocomplete="current-password" required>
            <button type="submit">Entrar</button>
            <div class="agave-sesion-error" role="alert"></div>
          </form>`;
        document.body.appendChild(fondo);
        const form = fondo.querySelector('form');
        const error = fondo.querySelector('.agave-sesion-error');
        const boton = fondo.querySelector('button');
        fondo.querySelector('#agaveSesionUsuario').focus();

        form.onsubmit = async (e) => {
          e.preventDefault();
          const usuario = form.usuario.value.trim();
          const contrasena = form.contrasena.value;
          if (!usuario || !contrasena) {
            error.textContent = `Escribe tu ${campo === 'telefono' ? 'teléfono' : 'correo'} y tu contraseña.`;
            error.style.display = 'block';
            return;
          }
          boton.disabled = true;
          boton.textContent = 'Entrando…';
          error.style.display = 'none';
          try {
            const res = await fetchOriginal(`${apiUrl}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [campo]: usuario, contrasena, exigirRol: opciones.rol, app: opciones.app })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.token) throw new Error(data.error || `No se pudo iniciar sesión (${res.status}).`);
            actual = { token: data.token, usuario: data.usuario };
            guardar(clave, actual);
            fondo.remove();
            pidiendo = null;
            resolve(actual.usuario);
          } catch (err) {
            error.textContent = err instanceof TypeError
              ? `No hay conexión con la API (${apiUrl}).`
              : err.message;
            error.style.display = 'block';
            boton.disabled = false;
            boton.textContent = 'Entrar';
          }
        };
      });
      return pidiendo;
    }

    /** Resuelve con el usuario de la sesión; si no hay o venció, muestra el formulario. */
    async function asegurar() {
      if (actual) {
        try {
          const res = await fetchOriginal(`${apiUrl}/auth/sesion`, {
            headers: { Authorization: `Bearer ${actual.token}` }
          });
          if (res.ok) {
            const data = await res.json();
            actual.usuario = data.usuario;
            guardar(clave, actual);
            return actual.usuario;
          }
          if (res.status === 401) {
            guardar(clave, null);
            actual = null;
            return pedirCredenciales('Tu sesión terminó. Vuelve a iniciar sesión.');
          }
        } catch (_) {
          // Sin API: se usa la sesión guardada; las pantallas ya avisan que no hay conexión.
          return actual.usuario;
        }
      }
      return pedirCredenciales();
    }

    async function cerrar() {
      if (actual) {
        try {
          await fetchOriginal(`${apiUrl}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${actual.token}` }
          });
        } catch (_) { /* aunque falle la red, se borra la sesión local */ }
      }
      guardar(clave, null);
      actual = null;
      location.reload();
    }

    return {
      asegurar,
      cerrar,
      get usuario() { return actual ? actual.usuario : null; },
      get token() { return actual ? actual.token : null; }
    };
  }

  window.SesionAgave = { crear };
})();
