const adminAuditRecords = [];
const adminClaimRecords = [];
let adminEsJefe = false;
let ofertasAutomaticas = [];
const adminEscape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));
const adminDate = value => value ? new Date(value).toLocaleString('es-PE') : '—';

function mostrarErrorMejoras(error) {
  const estado = document.querySelector('#adminStatus');
  if (estado) estado.textContent = error?.message || 'No se pudo completar la operación.';
  console.error('Admin enhancements:', error);
}

function exportarLibroExcel(nombre, nombreHoja, filas) {
  if (typeof XLSX === 'undefined') {
    mostrarErrorMejoras(new Error('No se pudo cargar el módulo de exportación Excel.'));
    return;
  }
  const libro = XLSX.utils.book_new();
  const hoja = XLSX.utils.json_to_sheet(filas);
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
  XLSX.writeFile(libro, nombre);
}

async function cargarOfertasAutomaticas() {
  const lista = document.querySelector('#automaticOffersList');
  const metricas = document.querySelector('#automaticOffersMetrics');
  lista.textContent = 'Cargando ofertas automáticas…';
  const { data, error } = await supabaseClient.rpc('listar_ofertas_automaticas_jefe', { p_limite: 200 });
  if (error) {
    lista.textContent = `No se pudieron cargar las ofertas automáticas: ${error.message}`;
    metricas.replaceChildren();
    return;
  }
  ofertasAutomaticas = data || [];
  const conteo = estado => ofertasAutomaticas.filter(oferta => oferta.estado === estado).length;
  metricas.innerHTML = `
    <div><strong>${ofertasAutomaticas.length}</strong><span>Avisos automáticos</span></div>
    <div><strong>${conteo('publicada')}</strong><span>Publicadas</span></div>
    <div><strong>${conteo('programada')}</strong><span>Programadas</span></div>
    <div><strong>${conteo('finalizada')}</strong><span>Finalizadas</span></div>`;
  lista.innerHTML = ofertasAutomaticas.length ? ofertasAutomaticas.map(oferta => `
    <article class="automatic-offer-row">
      <div>
        <strong>${adminEscape(oferta.titulo)}</strong>
        <span>${adminEscape(oferta.producto)}${oferta.descuento_porcentaje == null ? '' : ` · ${Number(oferta.descuento_porcentaje)}% de descuento`}</span>
        <p>${adminEscape(oferta.mensaje)}</p>
        <small>Creada: ${adminDate(oferta.creado_en)} · ${oferta.fecha_limite ? `Vence: ${adminDate(oferta.fecha_limite)}` : 'Sin fecha de vencimiento'}</small>
      </div>
      <b class="automatic-offer-status status-${adminEscape(oferta.estado)}">${adminEscape(oferta.estado)}</b>
    </article>`).join('') : 'Aún no se han generado avisos automáticos. Marca una oferta como super oferta o liquidación al crearla.';
}

function responsablesSeleccionados() {
  return new Set([...document.querySelectorAll('#auditUserOptions input:checked')].map(input => input.value));
}

function registrosAuditoriaVisibles() {
  const seleccionados = responsablesSeleccionados();
  return seleccionados.size
    ? adminAuditRecords.filter(item => seleccionados.has(item.usuario_id))
    : adminAuditRecords;
}

async function cargarReclamos() {
  const lista = document.querySelector('#adminClaimsList');
  lista.textContent = 'Cargando reclamaciones…';
  const valor = id => document.querySelector(id).value || null;
  const { data, error } = await supabaseClient.rpc('listar_reclamos_personal', {
    p_estado: valor('#claimStatusFilter'),
    p_categoria: valor('#claimCategoryFilter'),
    p_desde: valor('#claimFromFilter'),
    p_hasta: valor('#claimToFilter'),
    p_limite: 1000
  });
  if (error) {
    lista.textContent = `No se pudieron cargar las reclamaciones: ${error.message}`;
    return;
  }
  adminClaimRecords.splice(0, adminClaimRecords.length, ...(data || []));
  renderizarReclamos();
}

function renderizarReclamos() {
  const lista = document.querySelector('#adminClaimsList');
  lista.innerHTML = adminClaimRecords.length ? adminClaimRecords.map(reclamo => `
    <article class="admin-claim-row">
      <h3>${adminEscape(reclamo.codigo_reclamacion)} · ${adminEscape(reclamo.tipo_reclamo)}</h3>
      <div class="admin-claim-meta">
        <span>${adminEscape(reclamo.cliente_nombre)} · ${adminEscape(reclamo.cliente_email)}</span>
        <span>Documento: ${adminEscape(reclamo.cliente_dni_ce)}</span>
        <span>${adminEscape(reclamo.categoria_reclamo)} · ${adminEscape(reclamo.estado)}</span>
        <span>${adminDate(reclamo.created_at)}</span>
      </div>
      <p class="admin-claim-description">${adminEscape(reclamo.descripcion_reclamo)}</p>
      ${reclamo.evidencia_url ? (reclamo.evidencia_url.startsWith('https://')
        ? `<a class="admin-claim-evidence" href="${adminEscape(reclamo.evidencia_url)}" target="_blank" rel="noopener noreferrer">Abrir evidencia externa</a>`
        : `<button class="admin-claim-evidence" type="button" data-evidence-path="${adminEscape(reclamo.evidencia_url)}">Ver evidencia privada</button>`) : ''}
      <form class="admin-claim-form" data-claim-id="${Number(reclamo.id)}">
        <label>Estado<select name="estado">
          <option value="pendiente" ${reclamo.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="en_revision" ${reclamo.estado === 'en_revision' ? 'selected' : ''}>En revisión</option>
          <option value="resuelto" ${reclamo.estado === 'resuelto' ? 'selected' : ''}>Resuelto</option>
        </select></label>
        <label>Respuesta<textarea name="respuesta" maxlength="10000" placeholder="Respuesta oficial">${adminEscape(reclamo.respuesta_administracion || '')}</textarea></label>
        <button class="btn primary" type="submit">Guardar respuesta</button>
      </form>
    </article>`).join('') : 'No hay reclamaciones para los filtros seleccionados.';
}

document.querySelector('#adminClaimsList').addEventListener('submit', async event => {
  const form = event.target.closest('.admin-claim-form');
  if (!form) return;
  event.preventDefault();
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  const { error } = await supabaseClient.rpc('responder_reclamo_personal', {
    p_id: Number(form.dataset.claimId),
    p_estado: form.elements.estado.value,
    p_respuesta: form.elements.respuesta.value.trim()
  });
  submit.disabled = false;
  if (error) {
    mostrarErrorMejoras(error);
    return;
  }
  document.querySelector('#adminStatus').textContent = 'Respuesta guardada.';
  await cargarReclamos();
});

document.querySelector('#adminClaimsList').addEventListener('click', async event => {
  const boton = event.target.closest('[data-evidence-path]');
  if (!boton) return;
  const ventana = window.open('about:blank', '_blank');
  if (!ventana) {
    mostrarErrorMejoras(new Error('Permite ventanas emergentes para abrir la evidencia.'));
    return;
  }
  ventana.opener = null;
  boton.disabled = true;
  let data;
  let error;
  try {
    ({ data, error } = await supabaseClient.functions.invoke('reclamos-publicos', {
      body: { action: 'obtener_evidencia', evidence_path: boton.dataset.evidencePath }
    }));
  } catch (requestError) {
    ventana.close();
    boton.disabled = false;
    mostrarErrorMejoras(requestError);
    return;
  }
  boton.disabled = false;
  if (error || !data?.signed_url) {
    ventana.close();
    mostrarErrorMejoras(error || new Error('No se pudo obtener el enlace seguro de la evidencia.'));
    return;
  }
  ventana.location.href = data.signed_url;
});

async function cargarAuditoria() {
  const lista = document.querySelector('#adminAuditList');
  lista.textContent = 'Cargando auditoría…';
  const valor = id => document.querySelector(id).value || null;
  const { data, error } = await supabaseClient.rpc('listar_auditoria_personal', {
    p_desde: valor('#auditFromFilter'),
    p_hasta: valor('#auditToFilter'),
    p_accion: valor('#auditActionFilter'),
    p_usuario_id: null,
    p_modulo: valor('#auditModuleFilter'),
    p_limite: 5000
  });
  if (error) {
    lista.textContent = `No se pudo cargar la auditoría: ${error.message}`;
    return;
  }
  adminAuditRecords.splice(0, adminAuditRecords.length, ...(data || []));
  const opciones = document.querySelector('#auditUserOptions');
  const seleccionPrev = responsablesSeleccionados();
  const responsables = [...new Map(adminAuditRecords
    .filter(item => item.usuario_id)
    .map(item => [item.usuario_id, `${item.responsable || item.rol_usuario || 'Usuario'} · ${item.usuario_id}`])).entries()];
  opciones.innerHTML = responsables.map(([id, etiqueta]) => `
    <label><input type="checkbox" value="${adminEscape(id)}" ${seleccionPrev.has(id) ? 'checked' : ''}> ${adminEscape(etiqueta)}</label>
  `).join('') || '<span>No hay responsables en los resultados.</span>';
  renderizarAuditoria();
}

function renderizarAuditoria() {
  const lista = document.querySelector('#adminAuditList');
  const registros = registrosAuditoriaVisibles();
  lista.innerHTML = registros.length ? registros.map(registro => `
    <article class="admin-audit-row">
      <strong>${adminEscape(registro.accion)} · ${adminEscape(registro.tabla_afectada)} #${adminEscape(registro.registro_id)}</strong>
      <div class="admin-audit-meta">
        <span>${adminDate(registro.created_at)}</span>
        <span>Responsable: ${adminEscape(registro.responsable || registro.usuario_id || 'No disponible')}</span>
        <span>Rol: ${adminEscape(registro.rol_usuario || 'No disponible')}</span>
        <span>IP: ${adminEscape(registro.ip_address || 'No registrada')}</span>
      </div>
      ${(registro.datos_anteriores || registro.datos_nuevos) ? `<details><summary>Valores modificados</summary><pre>${adminEscape(JSON.stringify({ antes: registro.datos_anteriores, despues: registro.datos_nuevos }, null, 2))}</pre></details>` : ''}
    </article>`).join('') : 'No hay movimientos de auditoría para los filtros seleccionados.';
}

document.querySelector('#auditUserOptions').addEventListener('change', renderizarAuditoria);

async function cargarConfiguracionMarca() {
  const { data, error } = await supabaseClient.rpc('obtener_configuracion_publica');
  if (error) {
    document.querySelector('#brandStatus').textContent = `No se pudo cargar: ${error.message}`;
    return;
  }
  const valores = Object.fromEntries((data || []).map(item => [item.clave, item.valor]));
  document.querySelector('#brandName').value = valores.nombre_comercio || '';
  document.querySelector('#brandLogo').value = valores.url_logo || '';
  document.querySelector('#brandFavicon').value = valores.favicon || '';
  document.querySelector('#brandSeoTitle').value = valores.titulo_seo || '';
  document.querySelector('#brandSlogan').value = valores.lema || '';
  document.querySelector('#brandSupport').value = valores.contacto_soporte || '';
  document.querySelector('#brandFooter').value = valores.pie_pagina || '';
}

async function subirImagenMarca(archivo, tipo) {
  const estado = document.querySelector('#brandStatus');
  const esLogo = tipo === 'logo';
  const bitmap = await createImageBitmap(archivo);
  const ancho = bitmap.width;
  const alto = bitmap.height;
  const dimensionesValidas = esLogo
    ? ancho >= 128 && alto >= 48 && ancho <= 4096 && alto <= 2048 && ancho / alto >= 0.5 && ancho / alto <= 6.5
    : ancho === alto && ancho >= 32 && ancho <= 1024;
  if (!dimensionesValidas) {
    bitmap.close();
    throw new Error(esLogo
      ? 'El logotipo debe medir al menos 128×48 px, no superar 4096×2048 px y tener una proporción entre 0.5:1 y 6.5:1.'
      : 'El favicon debe ser cuadrado y medir entre 32×32 y 1024×1024 px.');
  }

  const escala = Math.min(1, (esLogo ? 1600 : 512) / ancho, (esLogo ? 600 : 512) / alto);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(ancho * escala);
  canvas.height = Math.round(alto * escala);
  const contexto = canvas.getContext('2d');
  if (!contexto) {
    bitmap.close();
    throw new Error('No se pudo preparar la imagen en este navegador.');
  }
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const imagenComprimida = await new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen.')), 'image/webp', 0.85);
  });
  if (imagenComprimida.type !== 'image/webp') {
    throw new Error('Este navegador no puede convertir imágenes a WEBP.');
  }
  if (imagenComprimida.size > 5 * 1024 * 1024) {
    throw new Error('La imagen comprimida supera el límite de almacenamiento de 5 MB.');
  }
  const ruta = esLogo ? 'logo.webp' : 'favicon.webp';
  const { error } = await supabaseClient.storage.from('marca-sitio').upload(ruta, imagenComprimida, {
    contentType: 'image/webp',
    cacheControl: '3600',
    upsert: true
  });
  if (error) throw error;
  const { data } = supabaseClient.storage.from('marca-sitio').getPublicUrl(ruta);
  document.querySelector(esLogo ? '#brandLogo' : '#brandFavicon').value = `${data.publicUrl}?v=${Date.now()}`;
  estado.textContent = `${esLogo ? 'Logotipo' : 'Favicon'} cargado y optimizado. Guarda la configuración para publicarlo.`;
}

for (const [selector, tipo] of [['#brandLogoFile', 'logo'], ['#brandFaviconFile', 'favicon']]) {
  document.querySelector(selector).addEventListener('change', async event => {
    const input = event.currentTarget;
    const archivo = input.files?.[0];
    if (!archivo) return;
    input.disabled = true;
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 10 * 1024 * 1024) {
        throw new Error('Selecciona una imagen JPG, PNG o WEBP de hasta 10 MB.');
      }
      await subirImagenMarca(archivo, tipo);
    } catch (error) {
      document.querySelector('#brandStatus').textContent = error.message || 'No se pudo cargar la imagen.';
      console.error('Brand image upload:', error);
    } finally {
      input.disabled = false;
      input.value = '';
    }
  });
}

async function cargarCicloUsuarios() {
  const valores = id => document.querySelector(id).value || null;
  const { data, error } = await supabaseClient.rpc('resumen_ciclo_usuarios_jefe', {
    p_desde: valores('#userLifecycleFrom'),
    p_hasta: valores('#userLifecycleTo')
  });
  const resumen = document.querySelector('#userLifecycleSummary');
  if (error) {
    resumen.textContent = `No se pudieron cargar las métricas: ${error.message}`;
    return;
  }
  const registro = data?.[0] || { usuarios_nuevos: 0, solicitudes_baja: 0 };
  resumen.innerHTML = `<div><strong>${Number(registro.usuarios_nuevos)}</strong><span>Nuevos clientes</span></div><div><strong>${Number(registro.solicitudes_baja)}</strong><span>Bajas lógicas</span></div>`;
}

document.querySelector('#adminBrandForm').addEventListener('submit', async event => {
  event.preventDefault();
  const httpsUrl = value => {
    if (!value) return true;
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
  };
  if (!httpsUrl(document.querySelector('#brandLogo').value.trim()) ||
      !httpsUrl(document.querySelector('#brandFavicon').value.trim())) {
    document.querySelector('#brandStatus').textContent = 'El logotipo y el favicon deben usar una URL HTTPS válida.';
    return;
  }
  const valores = {
    nombre_comercio: document.querySelector('#brandName').value.trim(),
    url_logo: document.querySelector('#brandLogo').value.trim(),
    favicon: document.querySelector('#brandFavicon').value.trim(),
    titulo_seo: document.querySelector('#brandSeoTitle').value.trim(),
    lema: document.querySelector('#brandSlogan').value.trim(),
    contacto_soporte: document.querySelector('#brandSupport').value.trim(),
    pie_pagina: document.querySelector('#brandFooter').value.trim()
  };
  const { error } = await supabaseClient.rpc('guardar_configuracion_sitio_jefe', { p_valores: valores });
  document.querySelector('#brandStatus').textContent = error
    ? `No se pudo guardar: ${error.message}`
    : 'Configuración guardada.';
});

document.querySelector('#adminNotificationForm').addEventListener('submit', async event => {
  event.preventDefault();
  const estado = document.querySelector('#notificationStatus');
  const banner = document.querySelector('#notificationBanner').value.trim() || null;
  if (banner) {
    try {
      if (new URL(banner).protocol !== 'https:') throw new Error('https');
    } catch {
      estado.textContent = 'El banner debe ser una URL HTTPS válida.';
      return;
    }
  }
  const convertirFecha = value => value ? new Date(value).toISOString() : null;
  const { data, error } = await supabaseClient.rpc('crear_notificacion_jefe', {
    p_titulo: document.querySelector('#notificationTitle').value.trim(),
    p_mensaje: document.querySelector('#notificationMessage').value.trim(),
    p_fecha_envio: convertirFecha(document.querySelector('#notificationStart').value),
    p_fecha_limite: convertirFecha(document.querySelector('#notificationEnd').value),
    p_banner_url: banner
  });
  if (error) {
    estado.textContent = `No se pudo programar: ${error.message}`;
    return;
  }
  event.currentTarget.reset();
  estado.textContent = `Aviso programado correctamente (ID ${data}).`;
});

document.querySelector('#refreshClaims').addEventListener('click', cargarReclamos);
document.querySelector('#refreshAudit').addEventListener('click', cargarAuditoria);
document.querySelector('#refreshUserLifecycle').addEventListener('click', cargarCicloUsuarios);
document.querySelector('#refreshAutomaticOffers').addEventListener('click', cargarOfertasAutomaticas);
document.querySelector('#adminRefreshReports').addEventListener('click', () => {
  if (adminEsJefe) cargarCicloUsuarios();
});
document.querySelector('#exportClaims').addEventListener('click', () => exportarLibroExcel(
  'reclamaciones-byte-bay.xlsx',
  'Reclamaciones',
  adminClaimRecords.map(item => ({
    Código: item.codigo_reclamacion,
    Tipo: item.tipo_reclamo,
    Categoría: item.categoria_reclamo,
    Estado: item.estado,
    Cliente: item.cliente_nombre,
    Documento: item.cliente_dni_ce,
    Correo: item.cliente_email,
    Teléfono: item.cliente_telefono,
    Fecha: item.created_at,
    Descripción: item.descripcion_reclamo,
    Respuesta: item.respuesta_administracion,
    Evidencia: item.evidencia_url
  }))
));
document.querySelector('#exportAudit').addEventListener('click', () => exportarLibroExcel(
  'auditoria-byte-bay.xlsx',
  'Auditoría',
  registrosAuditoriaVisibles().map(item => ({
    Fecha: item.created_at,
    Responsable: item.responsable || item.usuario_id,
    Rol: item.rol_usuario,
    Acción: item.accion,
    Módulo: item.tabla_afectada,
    Registro: item.registro_id,
    'Valores anteriores': JSON.stringify(item.datos_anteriores || {}),
    'Valores nuevos': JSON.stringify(item.datos_nuevos || {}),
    IP: item.ip_address,
    'Agente de usuario': item.user_agent
  }))
));

document.querySelectorAll('[data-admin-tab]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.adminTab === 'resumen' && adminEsJefe) cargarCicloUsuarios();
    if (button.dataset.adminTab === 'reclamos') cargarReclamos();
    if (button.dataset.adminTab === 'auditoria') cargarAuditoria();
    if (button.dataset.adminTab === 'marca') cargarConfiguracionMarca();
  });
});

const adminReadyObserver = new MutationObserver(() => {
  const adminApp = document.querySelector('#adminApp');
  if (adminApp.classList.contains('hidden')) return;
  adminReadyObserver.disconnect();
  const rol = document.querySelector('#adminRole').textContent.split('·').pop().trim().toLowerCase();
  adminEsJefe = rol === 'jefe';
  document.querySelector('#adminAuditTab').classList.toggle('hidden', !adminEsJefe);
  document.querySelector('#adminBrandTab').classList.toggle('hidden', !adminEsJefe);
  document.querySelector('#adminNotificationsTab').classList.toggle('hidden', !adminEsJefe);
  document.querySelector('#specialOfferOptions').classList.toggle('hidden', !adminEsJefe);
  document.querySelector('#userLifecyclePanel').classList.toggle('hidden', !adminEsJefe);
  document.querySelector('#automaticOffersDashboard').classList.toggle('hidden', !adminEsJefe);
  document.querySelector('[data-admin-section="auditoria"]').classList.toggle('hidden', true);
  document.querySelector('[data-admin-section="marca"]').classList.toggle('hidden', true);
  if (adminEsJefe) cargarCicloUsuarios();
});
adminReadyObserver.observe(document.querySelector('#adminApp'), { attributes: true, attributeFilter: ['class'] });

document.querySelectorAll('[data-admin-tab="ofertas"]').forEach(button => {
  button.addEventListener('click', () => {
    if (adminEsJefe) cargarOfertasAutomaticas();
  });
});
