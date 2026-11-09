/* ============================================================
   Byte Bay · Preferencias del cliente
   - Tema claro / oscuro / automático persistente
   - País, región, idioma y vista del catálogo
   - Notificaciones y avisos del sistema
   - Accesos de atención al cliente reutilizando los modales existentes
   ============================================================ */

const PREFS_KEY = 'byteBayPreferences';
const NOTIFICATIONS_KEY = 'beruNotifications';
const LEGACY_THEME_KEY = 'beruTema';

const DEFAULT_PREFS = {
  theme: 'auto',
  country: 'PE',
  region: 'Lima',
  language: 'es-PE',
  columns: 'auto',
  notifications: { deals: true, drops: true, stock: false }
};

const drawer = document.querySelector('#settingsDrawer');
const backdrop = document.querySelector('#settingsBackdrop');
const openButton = document.querySelector('#settingsToggle');
const closeButton = document.querySelector('#settingsClose');
const themeQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

let prefs = cargarPreferencias();
let lastFocusedElement = null;
let mensajeEstado = '';
let mensajeEstadoTimer = 0;

function leerJSON(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function cargarPreferencias() {
  const guardadas = leerJSON(PREFS_KEY) || {};
  const temaLegado = localStorage.getItem(LEGACY_THEME_KEY);
  const tema = guardadas.theme || (temaLegado === 'noche' ? 'dark' : temaLegado === 'claro' ? 'light' : 'auto');
  return {
    ...DEFAULT_PREFS,
    ...guardadas,
    theme: ['light', 'dark', 'auto'].includes(tema) ? tema : 'auto',
    notifications: { ...DEFAULT_PREFS.notifications, ...(guardadas.notifications || {}) }
  };
}

function guardarPreferencias() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    localStorage.setItem(LEGACY_THEME_KEY, temaResuelto() === 'dark' ? 'noche' : 'claro');
  } catch (error) {
    console.warn('No se pudieron guardar las preferencias de Byte Bay:', error);
  }
}

function temaResuelto() {
  if (prefs.theme === 'dark' || prefs.theme === 'light') return prefs.theme;
  return themeQuery && themeQuery.matches ? 'dark' : 'light';
}

function aplicarTema() {
  const resuelto = temaResuelto();
  document.documentElement.classList.toggle('dark-mode', resuelto === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resuelto === 'dark' ? '#10191c' : '#0d2b31');
  document.querySelectorAll('input[name="bbTheme"]').forEach(input => {
    input.checked = input.value === prefs.theme;
  });
}

function aplicarColumnas() {
  if (prefs.columns === '3' || prefs.columns === '4') {
    document.documentElement.dataset.catalogCols = prefs.columns;
  } else {
    delete document.documentElement.dataset.catalogCols;
  }
}

function cuentaActual() {
  const cuenta = leerJSON('beruAccount');
  if (!cuenta?.verified) return null;
  return cuenta;
}

function nombreCuenta(cuenta) {
  return cuenta?.name || cuenta?.username || cuenta?.email?.split('@')[0] || 'Cliente';
}

function refrescarCuenta() {
  const cuenta = cuentaActual();
  const nombre = document.querySelector('#settingsAccountName');
  const correo = document.querySelector('#settingsAccountEmail');
  const acceso = document.querySelector('#mobileAccountAccess span');
  const salida = document.querySelector('#mobileAccountLogout');

  if (nombre) nombre.textContent = cuenta ? nombreCuenta(cuenta) : 'Invitado';
  if (correo) correo.textContent = cuenta
    ? (cuenta.email || 'Sesión activa en este dispositivo')
    : 'Inicia sesión para ver tus datos.';
  if (acceso) acceso.textContent = cuenta ? `Mi cuenta · ${nombreCuenta(cuenta).split(' ')[0]}` : 'Crear cuenta / Ingresar';
  if (salida) salida.classList.toggle('hidden', !cuenta);
}

function suscripcionActual() {
  return leerJSON(NOTIFICATIONS_KEY);
}

function preferenciasNotificacionActivas() {
  return ['deals', 'drops', 'stock'].filter(clave => prefs.notifications[clave]);
}

function sincronizarInterruptores() {
  const suscripcion = suscripcionActual();
  const avisos = suscripcion?.wants;
  if (Array.isArray(avisos)) {
    prefs.notifications = {
      deals: avisos.includes('ofertas'),
      drops: avisos.includes('novedades'),
      stock: avisos.includes('stock')
    };
  }
  const mapa = {
    settingsNotifyDeals: 'deals',
    settingsNotifyDrops: 'drops',
    settingsNotifyStock: 'stock'
  };
  Object.entries(mapa).forEach(([id, clave]) => {
    const input = document.querySelector(`#${id}`);
    if (input) input.checked = Boolean(prefs.notifications[clave]);
  });
  guardarPreferencias();
}

function guardarSuscripcionDesdePreferencias() {
  const suscripcion = suscripcionActual();
  if (!suscripcion) return;
  const etiquetas = { deals: 'ofertas', drops: 'novedades', stock: 'stock' };
  suscripcion.wants = preferenciasNotificacionActivas().map(clave => etiquetas[clave]);
  try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(suscripcion)); } catch { /* sin almacenamiento */ }
}

function renderizarAvisosSistema(mensajeTemporal = '') {
  const contenedor = document.querySelector('#settingsSystemAlerts');
  if (!contenedor) return;

  if (mensajeTemporal) {
    mensajeEstado = mensajeTemporal;
    window.clearTimeout(mensajeEstadoTimer);
    mensajeEstadoTimer = window.setTimeout(() => {
      mensajeEstado = '';
      renderizarAvisosSistema();
    }, 4000);
  }

  const cuenta = cuentaActual();
  const activas = preferenciasNotificacionActivas();
  const etiquetas = { deals: 'ofertas', drops: 'novedades', stock: 'stock' };
  const cantidad = document.querySelector('#offersNotificationCount')?.textContent?.trim() || '0';
  const avisos = [];

  if (mensajeEstado) avisos.push({ tipo: 'success', texto: mensajeEstado });

  if (navigator.onLine) {
    avisos.push({ tipo: 'success', texto: 'Estás conectado a la tienda.' });
  } else {
    avisos.push({ tipo: 'warning', texto: 'Sin conexión: algunas funciones pueden no estar disponibles.' });
  }

  avisos.push({
    tipo: 'info',
    texto: Number(cantidad) > 0
      ? `Hay ${cantidad} aviso(s) de ofertas disponible(s).`
      : 'No hay avisos de ofertas nuevos por ahora.'
  });

  if (!activas.length) {
    avisos.push({ tipo: 'warning', texto: 'Todas las alertas están desactivadas. No recibirás correos de ofertas.' });
  } else {
    avisos.push({ tipo: 'info', texto: `Alertas activas: ${activas.map(clave => etiquetas[clave]).join(', ')}.` });
  }

  avisos.push(cuenta
    ? { tipo: 'success', texto: `Sesión iniciada como ${nombreCuenta(cuenta)}.` }
    : { tipo: 'info', texto: 'Estás comprando como invitado.' });

  contenedor.innerHTML = avisos.map(aviso => `<div class="system-alert is-${aviso.tipo}"><span>${aviso.texto}</span></div>`).join('');
}

function actualizarNotaEntrega() {
  const nota = document.querySelector('#cartDeliveryNote');
  if (nota) {
    nota.textContent = `Entrega en ${prefs.region}, ${prefs.country === 'PE' ? 'Perú' : prefs.country}. Envío gratis a todo el Perú. El cupón y el total final se calculan al instante.`;
  }
}

function cargarControles() {
  const pais = document.querySelector('#settingsCountry');
  const region = document.querySelector('#settingsRegion');
  const idioma = document.querySelector('#settingsLanguage');
  const columnas = document.querySelector('#settingsColumns');
  if (pais) pais.value = prefs.country;
  if (region) {
    const existe = [...region.options].some(opcion => opcion.value === prefs.region);
    region.value = existe ? prefs.region : 'Lima';
    if (!existe) prefs.region = 'Lima';
  }
  if (idioma) idioma.value = prefs.language;
  if (columnas) columnas.value = prefs.columns;
  aplicarTema();
  aplicarColumnas();
  sincronizarInterruptores();
  refrescarCuenta();
  actualizarNotaEntrega();
}

function abrirPanel() {
  if (!drawer || !backdrop) return;
  lastFocusedElement = document.activeElement;
  drawer.inert = false;
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.hidden = false;
  document.body.classList.add('settings-locked');
  document.documentElement.classList.add('settings-locked');
  openButton?.setAttribute('aria-expanded', 'true');
  // Forzar el recalculo para que la transición se ejecute aunque la pestaña
  // esté en segundo plano (requestAnimationFrame puede quedar en pausa).
  void drawer.offsetWidth;
  backdrop.classList.add('is-open');
  drawer.classList.add('is-open');
  closeButton?.focus({ preventScroll: true });
  window.setTimeout(() => {
    if (drawer.classList.contains('is-open') && !drawer.contains(document.activeElement)) {
      closeButton?.focus({ preventScroll: true });
    }
  }, 120);
  cargarControles();
  renderizarAvisosSistema();
  window.BBPrivacy?.actualizarPanel?.();
  window.BBPrivacy?.actualizarSesionUI?.();
  window.dispatchEvent(new Event('bb:drawer-open'));
  if (typeof window.cargarAvisosOferta === 'function') {
    Promise.resolve(window.cargarAvisosOferta())
      .then(() => renderizarAvisosSistema())
      .catch(() => { /* los avisos son opcionales */ });
  }
}

function cerrarPanel(restaurarFoco = true) {
  if (!drawer || !backdrop) return;
  drawer.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  openButton?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('settings-locked');
  document.documentElement.classList.remove('settings-locked');
  window.setTimeout(() => {
    if (!drawer.classList.contains('is-open')) {
      drawer.inert = true;
      backdrop.hidden = true;
    }
  }, 340);
  if (restaurarFoco && lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

function confirmar(mensaje) {
  renderizarAvisosSistema(mensaje);
  if (typeof window.showToast === 'function') window.showToast(mensaje);
}

/* ---------- Eventos de preferencias ---------- */
document.querySelectorAll('input[name="bbTheme"]').forEach(input => {
  input.addEventListener('change', event => {
    prefs.theme = event.target.value;
    guardarPreferencias();
    aplicarTema();
    confirmar(`Tema ${event.target.value === 'dark' ? 'oscuro' : event.target.value === 'light' ? 'claro' : 'automático'} aplicado.`);
  });
});

document.querySelector('#settingsCountry')?.addEventListener('change', event => {
  prefs.country = event.target.value;
  guardarPreferencias();
  actualizarNotaEntrega();
  confirmar('País guardado.');
});

document.querySelector('#settingsRegion')?.addEventListener('change', event => {
  prefs.region = event.target.value;
  guardarPreferencias();
  actualizarNotaEntrega();
  confirmar(`Región de entrega: ${prefs.region}.`);
});

document.querySelector('#settingsLanguage')?.addEventListener('change', event => {
  prefs.language = event.target.value;
  guardarPreferencias();
  confirmar('Idioma guardado.');
});

document.querySelector('#settingsColumns')?.addEventListener('change', event => {
  prefs.columns = event.target.value;
  guardarPreferencias();
  aplicarColumnas();
  confirmar('Vista del catálogo actualizada.');
});

const mapaInterruptores = {
  settingsNotifyDeals: 'deals',
  settingsNotifyDrops: 'drops',
  settingsNotifyStock: 'stock'
};
Object.entries(mapaInterruptores).forEach(([id, clave]) => {
  document.querySelector(`#${id}`)?.addEventListener('change', event => {
    prefs.notifications[clave] = event.target.checked;
    guardarPreferencias();
    guardarSuscripcionDesdePreferencias();
    const etiquetas = { deals: 'Ofertas', drops: 'Novedades', stock: 'Avisos de stock' };
    confirmar(`${etiquetas[clave]}: ${event.target.checked ? 'activado' : 'desactivado'}.`);
  });
});

/* ---------- Enlaces de ayuda ---------- */
document.querySelectorAll('[data-settings-info]').forEach(boton => {
  boton.addEventListener('click', () => {
    const clave = boton.dataset.settingsInfo;
    cerrarPanel(false);
    window.setTimeout(() => {
      const ayuda = window.bbAyuda;
      if (!ayuda) { window.showToast?.('Contenido no disponible.'); return; }
      if (clave === 'Libro de reclamaciones') {
        ayuda.reclamaciones();
        return;
      }
      const info = ayuda.info?.[clave];
      if (info) ayuda.abrir(info);
      else window.showToast?.('Contenido no disponible.');
    }, 230);
  });
});

/* ---------- Navegación rápida y cierre ---------- */
document.querySelectorAll('[data-settings-close]').forEach(elemento => {
  elemento.addEventListener('click', event => {
    const destino = elemento.dataset.settingsTarget || elemento.getAttribute('href');
    cerrarPanel(false);
    if (elemento.tagName === 'BUTTON' && destino?.startsWith('#')) {
      event.preventDefault();
      window.setTimeout(() => document.querySelector(destino)?.scrollIntoView({ behavior: 'smooth' }), 240);
    }
  });
});

document.querySelector('#settingsToggle')?.addEventListener('click', abrirPanel);
closeButton?.addEventListener('click', () => cerrarPanel());
backdrop?.addEventListener('click', () => cerrarPanel());

document.addEventListener('keydown', event => {
  if (!drawer?.classList.contains('is-open')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    cerrarPanel();
    return;
  }
  if (event.key !== 'Tab') return;
  const enfocables = [...drawer.querySelectorAll('a[href], button:not([disabled]), select, input, [tabindex]:not([tabindex="-1"])')]
    .filter(elemento => elemento.offsetParent !== null);
  if (!enfocables.length) return;
  const primero = enfocables[0];
  const ultimo = enfocables[enfocables.length - 1];
  if (event.shiftKey && document.activeElement === primero) {
    event.preventDefault();
    ultimo.focus();
  } else if (!event.shiftKey && document.activeElement === ultimo) {
    event.preventDefault();
    primero.focus();
  }
});

/* ---------- Cuenta: cerrar el panel antes de abrir el modal ---------- */
document.querySelector('#mobileAccountAccess')?.addEventListener('click', () => {
  window.setTimeout(() => cerrarPanel(false), 0);
});
document.querySelector('#mobileAccountLogout')?.addEventListener('click', () => {
  window.setTimeout(() => cerrarPanel(false), 0);
});

/* ---------- Avisos de ofertas ---------- */
document.querySelector('#offersNotificationToggle')?.addEventListener('click', () => {
  cerrarPanel(false);
});

/* ---------- Restablecer ---------- */
document.querySelector('#settingsReset')?.addEventListener('click', () => {
  prefs = { ...DEFAULT_PREFS, notifications: { ...DEFAULT_PREFS.notifications } };
  try {
    localStorage.removeItem(PREFS_KEY);
    localStorage.removeItem(LEGACY_THEME_KEY);
  } catch { /* sin almacenamiento */ }
  guardarPreferencias();
  cargarControles();
  confirmar('Preferencias restablecidas.');
});

/* ---------- Sincronización con el resto de la tienda ---------- */
if (themeQuery?.addEventListener) {
  themeQuery.addEventListener('change', () => {
    if (prefs.theme === 'auto') {
      aplicarTema();
      guardarPreferencias();
      renderizarAvisosSistema();
    }
  });
}

window.addEventListener('storage', event => {
  if (event.key === PREFS_KEY || event.key === LEGACY_THEME_KEY) {
    prefs = cargarPreferencias();
    cargarControles();
    renderizarAvisosSistema();
  }
  if (event.key === NOTIFICATIONS_KEY) {
    sincronizarInterruptores();
    renderizarAvisosSistema();
  }
});

window.addEventListener('bb:notifications-updated', () => {
  sincronizarInterruptores();
  renderizarAvisosSistema();
});

window.addEventListener('bb:account-updated', () => {
  refrescarCuenta();
  window.BBPrivacy?.actualizarSesionUI?.();
  if (drawer?.classList.contains('is-open')) renderizarAvisosSistema();
});

window.addEventListener('bb:privacy-updated', () => {
  refrescarCuenta();
  window.BBPrivacy?.actualizarSesionUI?.();
});

window.addEventListener('online', () => renderizarAvisosSistema('Conexión restablecida.'));
window.addEventListener('offline', () => renderizarAvisosSistema('Sin conexión a internet.'));

/* ---------- Estado inicial ---------- */
if (drawer) drawer.inert = true;
aplicarTema();
aplicarColumnas();
sincronizarInterruptores();
refrescarCuenta();
actualizarNotaEntrega();
renderizarAvisosSistema();
