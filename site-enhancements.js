const supabaseClient = window.BBStore?.client || window.supabase?.createClient('https://inwugycvtaaceugvtfpv.supabase.co','sb_publishable_5cTHcYI6byM03VSffW0OlQ_JlBB8D9u');
const siteEscape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));
const claimsModal = document.querySelector('#claimsModal');
const claimsStatus = document.querySelector('#claimsStatus');

async function cargarAvisosOferta() {
  const lista = document.querySelector('#offersNotificationList');
  if (!supabaseClient) {
    lista.textContent = 'El servicio de avisos no está disponible.';
    return;
  }
  lista.textContent = 'Cargando avisos…';
  const { data, error } = await supabaseClient.rpc('listar_notificaciones_ofertas_publicas');
  if (error) {
    lista.textContent = 'No se pudieron cargar los avisos.';
    console.error('Public notifications:', error);
    return;
  }
  const avisos = data || [];
  document.querySelector('#offersNotificationCount').textContent = String(avisos.length);
  lista.innerHTML = avisos.length ? avisos.map(aviso => `
    <article class="offer-notification-card">
      <strong>${siteEscape(aviso.titulo)}</strong>
      <p>${siteEscape(aviso.mensaje)}</p>
      ${aviso.descuento_porcentaje ? `<small>${Number(aviso.descuento_porcentaje)}% de descuento</small>` : ''}
      <small>${new Date(aviso.fecha_envio).toLocaleString('es-PE')}</small>
    </article>`).join('') : 'No hay ofertas nuevas por ahora.';
}

document.querySelector('#offersNotificationToggle').addEventListener('click', async event => {
  const panel = document.querySelector('#offersNotificationPanel');
  const abrir = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !abrir);
  event.currentTarget.setAttribute('aria-expanded', String(abrir));
  if (abrir) await cargarAvisosOferta();
});
document.querySelector('#offersNotificationClose').addEventListener('click', () => {
  document.querySelector('#offersNotificationPanel').classList.add('hidden');
  document.querySelector('#offersNotificationToggle').setAttribute('aria-expanded', 'false');
});

document.querySelector('#openClaimsForm').addEventListener('click', event => {
  event.preventDefault();
  claimsModal.classList.add('open');
  claimsModal.setAttribute('aria-hidden', 'false');
  document.querySelector('#claimsForm [name="nombre"]').focus();
});
document.querySelector('#claimsClose').addEventListener('click', cerrarFormularioReclamo);
claimsModal.addEventListener('click', event => {
  if (event.target === claimsModal) cerrarFormularioReclamo();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && claimsModal.classList.contains('open')) cerrarFormularioReclamo();
});
function cerrarFormularioReclamo() {
  claimsModal.classList.remove('open');
  claimsModal.setAttribute('aria-hidden', 'true');
}

document.querySelector('#claimsForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const valor = nombre => form.elements[nombre].value.trim();
  const boton = document.querySelector('#claimsSubmit');
  if (!supabaseClient) {
    claimsStatus.textContent = 'El servicio de reclamaciones no está disponible. Intenta más tarde.';
    return;
  }
  boton.disabled = true;
  claimsStatus.textContent = 'Enviando…';
  let data;
  let error;
  try {
    ({ data, error } = await supabaseClient.functions.invoke('reclamos-publicos', {
      body: new FormData(form)
    }));
  } catch (requestError) {
    boton.disabled = false;
    claimsStatus.textContent = 'No se pudo conectar con el servicio. Intenta nuevamente.';
    console.error('Public claims request:', requestError);
    return;
  }
  boton.disabled = false;
  if (error) {
    let mensaje = error.message;
    try {
      const response = error.context;
      if (response?.clone) {
        const detalle = await response.clone().json();
        mensaje = detalle.error || mensaje;
      }
    } catch (parseError) {
      console.error('No se pudo interpretar la respuesta del Libro de Reclamaciones:', parseError);
    }
    claimsStatus.textContent = `No se pudo registrar: ${mensaje}`;
    return;
  }
  claimsStatus.textContent = `Reclamación registrada. Guarda este código: ${data.codigo_reclamacion}`;
  form.reset();
});

async function aplicarConfiguracionPublica() {
  const { data, error } = await supabaseClient.rpc('obtener_configuracion_publica');
  if (error) {
    console.error('Public site configuration:', error);
    return;
  }
  const valores = Object.fromEntries((data || []).map(item => [item.clave, item.valor]));
  const nombre = valores.nombre_comercio;
  if (nombre) document.querySelectorAll('.brand-logo img').forEach(imagen => { imagen.alt = nombre; });
  if (valores.url_logo) {
    try {
      if (new URL(valores.url_logo).protocol === 'https:') {
        document.querySelectorAll('.brand-logo img').forEach(imagen => { imagen.src = valores.url_logo; });
      }
    } catch {
      console.error('El logotipo configurado no es una URL válida.');
    }
  }
  if (valores.titulo_seo || nombre) document.title = valores.titulo_seo || nombre;
  const favicon = valores.favicon;
  if (favicon) {
    try {
      if (new URL(favicon).protocol === 'https:') {
        let link = document.querySelector('link[rel="icon"]');
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.append(link);
        }
        link.href = favicon;
      }
    } catch {
      console.error('El favicon configurado no es una URL válida.');
    }
  }
  if (valores.pie_pagina) {
    const textoPie = document.querySelector('.footer-grid > div:first-child > p');
    if (textoPie) textoPie.textContent = valores.pie_pagina;
  }
}

if (window.supabaseClient || window.BBStore?.client) {
  aplicarConfiguracionPublica();
}
