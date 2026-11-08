/* ============================================================
   BYTE BAY · Panel interno — capa de experiencia
   Se carga después de admin.js / admin-enhancements.js.
   No reemplaza la lógica existente: solo la complementa.
   ============================================================ */
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);

  /* ---------- Mapa de secciones ---------- */
  const SECCIONES = {
    resumen: { miga: 'Operación', titulo: 'Resumen operativo' },
    productos: { miga: 'Catálogo', titulo: 'Productos' },
    inventario: { miga: 'Almacén', titulo: 'Inventario y proveedores' },
    ofertas: { miga: 'Comercial', titulo: 'Ofertas y promociones' },
    avisos: { miga: 'Comercial', titulo: 'Avisos y promociones' },
    movimientos: { miga: 'Almacén', titulo: 'Movimientos de inventario' },
    reclamos: { miga: 'Atención', titulo: 'Libro de reclamaciones' },
    auditoria: { miga: 'Control', titulo: 'Auditoría' },
    marca: { miga: 'Configuración', titulo: 'Marca y empresa' },
    personal: { miga: 'Equipo', titulo: 'Gestión de personal' },
  };

  function aplicarSeccion(tab) {
    const meta = SECCIONES[tab];
    if (!meta) return;

    const miga = $('#adminBreadcrumb');
    const titulo = $('#adminPageTitle');
    if (miga) miga.textContent = `Byte Bay / ${meta.miga}`;
    if (titulo) titulo.textContent = meta.titulo;
    document.title = `${meta.titulo} | Byte Bay`;

    document.querySelectorAll('[data-admin-tab]').forEach((boton) => {
      const activo = boton.dataset.adminTab === tab;
      boton.classList.toggle('active', activo);
      if (activo) boton.setAttribute('aria-current', 'page');
      else boton.removeAttribute('aria-current');
    });

    const principal = document.querySelector('.admin-main');
    if (principal && principal.scrollTop > 0) {
      principal.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* Captura el clic antes de que admin.js ejecute su propio handler. */
  document.addEventListener(
    'click',
    (evento) => {
      const boton = evento.target.closest('[data-admin-tab]');
      if (boton) aplicarSeccion(boton.dataset.adminTab);
    },
    true
  );

  /* ---------- Chip de usuario ---------- */
  const iniciales = (texto) =>
    String(texto || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase() || 'BB';

  const nombreBonito = (texto) =>
    String(texto || '')
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\p{L}/gu, (letra) => letra.toUpperCase());

  let ultimoUsuario = '';

  async function actualizarUsuario() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) return;

    const usuario = session.user || {};
    const metadatos = usuario.user_metadata || {};
    const correo = usuario.email || '';
    const nombreCompleto =
      [metadatos.nombres, metadatos.apellidos].filter(Boolean).join(' ') ||
      metadatos.full_name ||
      metadatos.name ||
      correo.split('@')[0];

    if (nombreCompleto === ultimoUsuario) return;
    ultimoUsuario = nombreCompleto;

    const nombre = nombreBonito(nombreCompleto);
    const rol = String(typeof rolPersonal !== 'undefined' ? rolPersonal : '').toLowerCase();

    const nodoNombre = $('#adminUserName');
    const nodoRol = $('#adminUserRole');
    const nodoAvatar = $('#adminAvatar');

    if (nodoNombre) nodoNombre.textContent = nombre;
    if (nodoRol) {
      nodoRol.textContent =
        rol === 'jefe' ? 'Jefe · acceso total' : rol === 'empleado' ? 'Empleado · operación' : 'Personal autorizado';
    }
    if (nodoAvatar) nodoAvatar.textContent = iniciales(nombreCompleto);
  }

  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    supabaseClient.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_IN' || evento === 'TOKEN_REFRESHED' || evento === 'USER_UPDATED') {
        setTimeout(actualizarUsuario, 0);
      }
      if (evento === 'SIGNED_OUT') {
        ultimoUsuario = '';
      }
    });
  }

  /* admin.js valida la sesión de forma asíncrona: observamos cuándo aparece el panel. */
  const app = document.querySelector('#adminApp');
  if (app) {
    const observador = new MutationObserver(() => {
      if (!app.classList.contains('hidden')) actualizarUsuario();
    });
    observador.observe(app, { attributes: true, attributeFilter: ['class'] });
  }
  setTimeout(actualizarUsuario, 400);
  setTimeout(actualizarUsuario, 1500);

  /* ---------- Mensajes de estado ---------- */
  const estado = document.querySelector('#adminStatus');
  if (estado) {
    let temporizador;
    const patronError = /no se pudo|error|inválid|incorrect|fall|denegad|exclusiv|requiere|no pertenece|no autoriz|insuficient/i;
    new MutationObserver(() => {
      const texto = estado.textContent.trim();
      if (!texto) return;
      estado.dataset.tone = patronError.test(texto) ? 'error' : 'ok';
      estado.setAttribute('role', patronError.test(texto) ? 'alert' : 'status');
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        estado.textContent = '';
        delete estado.dataset.tone;
      }, 8000);
    }).observe(estado, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- Atajos de teclado ---------- */
  document.addEventListener('keydown', (evento) => {
    const esBusqueda = (evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k';
    if (esBusqueda) {
      evento.preventDefault();
      const campo = [...document.querySelectorAll('input[type="search"]')].find(
        (input) => input.offsetParent !== null
      );
      if (campo) {
        campo.focus();
        campo.select?.();
      }
      return;
    }

    if (evento.key === 'Escape' && document.activeElement?.matches('input[type="search"]')) {
      document.activeElement.blur();
    }
  });

  /* ---------- Indicador de conexión ---------- */
  const sincronizarConexion = () => {
    document.documentElement.classList.toggle('is-offline', !navigator.onLine);
    if (!navigator.onLine && estado) estado.textContent = 'Sin conexión. Los cambios no se guardarán.';
  };
  window.addEventListener('online', sincronizarConexion);
  window.addEventListener('offline', sincronizarConexion);
  sincronizarConexion();

  /* ---------- Arranque ---------- */
  aplicarSeccion('resumen');
})();
