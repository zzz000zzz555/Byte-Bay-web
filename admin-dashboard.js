/* ============================================================
   BYTE BAY · Panel interno — dashboard, clientes y movimientos
   Se carga después de admin.js / admin-enhancements.js / admin-pro.js
   ============================================================ */
(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
  const num = value => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const money = value => `S/ ${num(value).toFixed(2)}`;
  const entero = value => num(value).toLocaleString('es-PE');
  const pad2 = value => String(value).padStart(2, '0');
  const isoLocal = date => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const hoyISO = () => isoLocal(new Date());
  const fechaCorta = iso => {
    if (!iso) return '—';
    const [year, month, day] = String(iso).slice(0, 10).split('-');
    return year ? `${day}/${month}/${year.slice(2)}` : '—';
  };
  const fechaHora = value => value ? new Date(value).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';
  const informar = mensaje => {
    const estado = $('#adminStatus');
    if (estado) estado.textContent = mensaje;
  };
  const errorMensaje = error => error?.message || 'No se pudo completar la operación.';

  let dashboardData = null;
  let clientesData = [];
  let clientesResumen = null;
  let movimientosData = [];
  let movimientosResumen = null;
  let ofertasAutomaticasDashboard = [];
  let clientesCargados = false;
  let dashboardIniciado = false;
  let movimientosTimer = null;

  /* ---------- Rangos de fecha ---------- */
  function rangoPreset(preset) {
    const hoy = new Date();
    if (preset === 'today') return { desde: isoLocal(hoy), hasta: isoLocal(hoy) };
    if (preset === '7') {
      const desde = new Date(hoy);
      desde.setDate(desde.getDate() - 6);
      return { desde: isoLocal(desde), hasta: isoLocal(hoy) };
    }
    if (preset === '30') {
      const desde = new Date(hoy);
      desde.setDate(desde.getDate() - 29);
      return { desde: isoLocal(desde), hasta: isoLocal(hoy) };
    }
    if (preset === 'month') {
      return { desde: isoLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: isoLocal(hoy) };
    }
    if (preset === 'year') {
      return { desde: isoLocal(new Date(hoy.getFullYear(), 0, 1)), hasta: isoLocal(hoy) };
    }
    return { desde: '', hasta: '' };
  }

  function activarPreset(contenedor, preset) {
    $$(`${contenedor} .dash-preset`).forEach(boton => {
      const clave = boton.dataset.dashboardPreset || boton.dataset.movementPreset || boton.dataset.clientPreset;
      boton.classList.toggle('is-active', clave === preset);
    });
  }

  function leerRango(desdeSelector, hastaSelector) {
    return {
      desde: $(desdeSelector)?.value || '',
      hasta: $(hastaSelector)?.value || ''
    };
  }

  /* ---------- Exportación Excel profesional ---------- */
  function exportarExcelProfesional({ archivo, hoja, titulo, subtitulo, columnas, filas, resumen }) {
    if (typeof XLSX === 'undefined') {
      informar('No se pudo cargar el módulo de exportación Excel.');
      return;
    }
    if (!filas.length) {
      informar('No hay datos para exportar con los filtros actuales.');
      return;
    }

    const libro = XLSX.utils.book_new();
    const encabezados = columnas.map(columna => columna.titulo);
    const matriz = [
      [titulo],
      [subtitulo],
      [`Generado: ${new Date().toLocaleString('es-PE')} · Byte Bay`],
      [],
      encabezados,
      ...filas.map(fila => columnas.map(columna => columna.valor(fila)))
    ];

    const ws = XLSX.utils.aoa_to_sheet(matriz);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, columnas.length - 1) } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(0, columnas.length - 1) } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: Math.max(0, columnas.length - 1) } }
    ];
    ws['!cols'] = columnas.map(columna => ({ wch: columna.ancho || 18 }));
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 4, c: 0 },
        e: { r: 4 + filas.length, c: Math.max(0, columnas.length - 1) }
      })
    };

    columnas.forEach((columna, indice) => {
      if (!columna.formato) return;
      for (let fila = 5; fila < 5 + filas.length; fila += 1) {
        const celda = XLSX.utils.encode_cell({ r: fila, c: indice });
        if (ws[celda] && typeof ws[celda].v === 'number') ws[celda].z = columna.formato;
      }
    });

    XLSX.utils.book_append_sheet(libro, ws, hoja || 'Datos');

    if (resumen && resumen.length) {
      const wsResumen = XLSX.utils.aoa_to_sheet([
        [titulo],
        ['Resumen ejecutivo'],
        [],
        ['Indicador', 'Valor'],
        ...resumen
      ]);
      wsResumen['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }
      ];
      wsResumen['!cols'] = [{ wch: 42 }, { wch: 26 }];
      XLSX.utils.book_append_sheet(libro, wsResumen, 'Resumen');
    }

    XLSX.writeFile(libro, archivo);
    informar(`Archivo ${archivo} generado correctamente.`);
  }

  /* ---------- Gráficos ---------- */
  const COLORES_ESTADO = {
    pendiente: '#b7791f',
    confirmado: '#2563a8',
    preparando: '#7c5cd6',
    enviado: '#0e8a8a',
    entregado: '#1f7a4d',
    cancelado: '#b3372f'
  };

  function graficoLinea(datos, clave, color, etiqueta, idGradiente) {
    if (!datos.length) return `<p class="dash-empty">Sin datos en el periodo.</p>`;
    const valores = datos.map(item => num(item[clave]));
    const todasCero = valores.every(valor => valor === 0);
    const W = 640;
    const H = 210;
    const padL = 46;
    const padR = 14;
    const padT = 18;
    const padB = 30;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const max = Math.max(1, ...valores);
    const n = datos.length;

    const x = indice => n <= 1 ? padL + innerW / 2 : padL + (indice * innerW) / (n - 1);
    const y = valor => padT + innerH - (valor / max) * innerH;
    const coords = datos.map((item, indice) => [x(indice), y(num(item[clave]))]);
    const linea = coords.map(([px, py], indice) => `${indice ? 'L' : 'M'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
    const area = `${linea} L ${x(n - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

    const guias = [0, 0.25, 0.5, 0.75, 1].map(proporcion => {
      const valor = max * proporcion;
      const py = y(valor);
      return `<line x1="${padL}" y1="${py.toFixed(1)}" x2="${W - padR}" y2="${py.toFixed(1)}" class="dash-grid-line"></line>
        <text x="${padL - 8}" y="${(py + 4).toFixed(1)}" text-anchor="end" class="dash-axis-text">${Math.round(valor).toLocaleString('es-PE')}</text>`;
    }).join('');

    const maxEtiquetas = Math.min(6, n);
    const indicesEtiquetas = [...new Set(Array.from({ length: maxEtiquetas }, (_, k) =>
      Math.round(k * (n - 1) / Math.max(1, maxEtiquetas - 1))))];
    const etiquetasX = indicesEtiquetas.map(indice =>
      `<text x="${x(indice).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="dash-axis-text">${fechaCorta(datos[indice].fecha)}</text>`
    ).join('');

    const puntos = n <= 16 ? coords.map(([px, py]) =>
      `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.6" fill="${color}"></circle>`
    ).join('') : '';

    return `<div class="dash-chart-inner">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(etiqueta)}">
        <defs>
          <linearGradient id="${idGradiente}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity=".28"></stop>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"></stop>
          </linearGradient>
        </defs>
        ${guias}
        <path d="${area}" fill="url(#${idGradiente})"></path>
        <path d="${linea}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"></path>
        ${puntos}
        ${etiquetasX}
      </svg>
      ${todasCero ? '<p class="dash-empty dash-chart-empty">Sin registros en el periodo seleccionado.</p>' : ''}
    </div>`;
  }

  function barrasHorizontales(items, { vacio = 'Sin datos en el periodo.', mostrarValor } = {}) {
    if (!items.length) return `<p class="dash-empty">${esc(vacio)}</p>`;
    const max = Math.max(1, ...items.map(item => num(item.valor)));
    return `<ul class="dash-bars">
      ${items.map(item => `
        <li class="dash-bar-row">
          <span class="dash-bar-label" title="${esc(item.etiqueta)}">${esc(item.etiqueta)}</span>
          <span class="dash-bar-track">
            <span class="dash-bar-fill" style="width:${Math.max(2, (num(item.valor) / max) * 100)}%;background:${item.color || 'var(--adm-brand-2)'}"></span>
          </span>
          <b class="dash-bar-value">${esc(mostrarValor ? mostrarValor(item) : entero(item.valor))}</b>
        </li>`).join('')}
    </ul>`;
  }

  function kpi({ etiqueta, valor, pista = '', tono = '', compacto = false }) {
    return `<div class="dash-kpi${compacto ? ' dash-kpi-compact' : ''}"${tono ? ` data-tone="${tono}"` : ''}>
      <span class="dash-kpi-label">${esc(etiqueta)}</span>
      <strong class="dash-kpi-value">${valor}</strong>
      ${pista ? `<small class="dash-kpi-hint">${esc(pista)}</small>` : ''}
    </div>`;
  }

  /* ---------- Dashboard ---------- */
  async function cargarDashboard() {
    const contenedor = $('#dashboardKpis');
    if (!contenedor) return;
    const { desde, hasta } = leerRango('#dashboardFrom', '#dashboardTo');
    contenedor.innerHTML = '<p class="dash-loading">Cargando indicadores…</p>';

    const [dashboard, hoyClientes] = await Promise.all([
      supabaseClient.rpc('dashboard_operativo_personal', { p_desde: desde || null, p_hasta: hasta || null }),
      supabaseClient.rpc('clientes_registrados_hoy_personal')
    ]);

    if (dashboard.error) {
      contenedor.innerHTML = `<p class="admin-error">No se pudo cargar el panel: ${esc(dashboard.error.message)}</p>`;
      return;
    }

    dashboardData = dashboard.data || {};
    const clientesHoy = hoyClientes.error ? null : Number(hoyClientes.data || 0);
    renderizarDashboard(dashboardData, clientesHoy);
    await cargarOfertasDashboard();
  }

  function renderizarDashboard(data, clientesHoy) {
    const kpis = data.kpis || {};
    const esJefe = Boolean(data.es_jefe);
    const rango = `${fechaCorta(data.desde)} – ${fechaCorta(data.hasta)}`;
    const tarjetas = [];

    if (esJefe) {
      tarjetas.push(kpi({
        etiqueta: 'Ingresos confirmados',
        valor: money(kpis.ingresos_confirmados),
        pista: 'Pagos aprobados del periodo',
        tono: 'ok'
      }));
      tarjetas.push(kpi({
        etiqueta: 'Ticket promedio',
        valor: money(kpis.ticket_promedio),
        pista: 'Por pedido confirmado'
      }));
    }
    tarjetas.push(kpi({
      etiqueta: 'Ventas confirmadas',
      valor: entero(kpis.ventas_confirmadas),
      pista: rango,
      tono: 'ok'
    }));
    tarjetas.push(kpi({
      etiqueta: 'Pedidos pendientes',
      valor: entero(kpis.pedidos_pendientes),
      pista: 'Pagos por verificar',
      tono: 'warn'
    }));
    tarjetas.push(kpi({
      etiqueta: 'Clientes registrados hoy',
      valor: clientesHoy == null ? '—' : entero(clientesHoy),
      pista: 'Altas del día',
      tono: 'info'
    }));
    tarjetas.push(kpi({
      etiqueta: 'Clientes nuevos',
      valor: entero(kpis.clientes_nuevos),
      pista: rango
    }));
    tarjetas.push(kpi({
      etiqueta: 'Clientes activos',
      valor: entero(kpis.clientes_activos),
      pista: 'Cuentas habilitadas'
    }));
    tarjetas.push(kpi({
      etiqueta: 'Ofertas activas',
      valor: entero(kpis.ofertas_activas),
      pista: 'Vigentes ahora'
    }));
    tarjetas.push(kpi({
      etiqueta: 'Avisos automáticos',
      valor: entero(kpis.avisos_automaticos),
      pista: 'Generados por el sistema',
      tono: 'info'
    }));
    tarjetas.push(kpi({
      etiqueta: 'Bajo stock',
      valor: entero(kpis.productos_bajo_stock),
      pista: '5 unidades o menos',
      tono: kpis.productos_bajo_stock > 0 ? 'danger' : ''
    }));
    tarjetas.push(kpi({
      etiqueta: 'Reclamos pendientes',
      valor: entero(kpis.reclamos_pendientes),
      pista: 'Libro de reclamaciones',
      tono: kpis.reclamos_pendientes > 0 ? 'warn' : ''
    }));

    $('#dashboardKpis').innerHTML = tarjetas.join('');

    $('#dashboardSalesCaption').textContent = esJefe
      ? 'Pedidos confirmados y pendientes del periodo.'
      : 'Pedidos del periodo. Los importes son exclusivos del jefe.';

    $('#dashboardSalesChart').innerHTML = graficoLinea(
      data.ventas_por_dia || [],
      'pedidos',
      '#14424a',
      'Pedidos por día',
      'grad-ventas'
    );
    $('#dashboardClientsChart').innerHTML = graficoLinea(
      data.registros_por_dia || [],
      'clientes',
      '#2563a8',
      'Clientes registrados por día',
      'grad-clientes'
    );

    const estados = (data.estados_pedido || []).map(item => ({
      etiqueta: item.estado,
      valor: item.cantidad,
      color: COLORES_ESTADO[item.estado] || 'var(--adm-brand-2)'
    }));
    $('#dashboardStatusChart').innerHTML = barrasHorizontales(estados, { vacio: 'Sin pedidos en el periodo.' });

    const top = (data.top_productos || []).map(item => ({
      etiqueta: item.producto,
      valor: item.unidades
    }));
    $('#dashboardTopProducts').innerHTML = barrasHorizontales(top, {
      vacio: 'Sin ventas confirmadas en el periodo.',
      mostrarValor: item => `${entero(item.valor)} und.`
    });
  }

  async function cargarOfertasDashboard() {
    const contenedor = $('#dashboardAutoOffers');
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="dash-loading">Cargando ofertas automáticas…</p>';
    const { data, error } = await supabaseClient.rpc('listar_ofertas_automaticas_personal', { p_limite: 8 });
    if (error) {
      contenedor.innerHTML = `<p class="admin-error">No se pudieron cargar: ${esc(error.message)}</p>`;
      return;
    }
    ofertasAutomaticasDashboard = data || [];
    if (!ofertasAutomaticasDashboard.length) {
      contenedor.innerHTML = '<p class="dash-empty">Aún no hay ofertas automáticas. Al marcar una oferta como super oferta o liquidación, el sistema generará el aviso aquí.</p>';
      return;
    }
    contenedor.innerHTML = ofertasAutomaticasDashboard.map(oferta => `
      <article class="dash-offer">
        <div>
          <strong>${esc(oferta.titulo)}</strong>
          <span>${esc(oferta.producto)}${oferta.descuento_porcentaje == null ? '' : ` · ${Number(oferta.descuento_porcentaje)}% dcto.`}</span>
        </div>
        <div class="dash-offer-meta">
          <b class="automatic-offer-status status-${esc(oferta.estado)}">${esc(oferta.estado)}</b>
          <small>${oferta.fecha_limite ? `Vence ${fechaHora(oferta.fecha_limite)}` : 'Sin vencimiento'}</small>
        </div>
      </article>`).join('');
  }

  /* ---------- Clientes ---------- */
  async function cargarClientes() {
    const cuerpo = $('#adminClientsList');
    if (!cuerpo) return;
    cuerpo.innerHTML = '<tr><td colspan="8" class="dash-loading">Cargando clientes…</td></tr>';
    const { desde, hasta } = leerRango('#clientFromFilter', '#clientToFilter');
    const busqueda = $('#clientSearch')?.value.trim() || null;
    const estado = $('#clientStatusFilter')?.value || null;

    const [lista, resumen] = await Promise.all([
      supabaseClient.rpc('listar_clientes_jefe', {
        p_busqueda: busqueda,
        p_estado: estado,
        p_desde: desde || null,
        p_hasta: hasta || null,
        p_limite: 1000
      }),
      supabaseClient.rpc('resumen_clientes_jefe', {
        p_desde: desde || null,
        p_hasta: hasta || null
      })
    ]);

    if (lista.error) {
      cuerpo.innerHTML = `<tr><td colspan="8" class="admin-error">No se pudieron cargar los clientes: ${esc(lista.error.message)}</td></tr>`;
      return;
    }
    clientesData = lista.data || [];
    clientesResumen = resumen.error ? null : (resumen.data || null);
    clientesCargados = true;
    renderizarResumenClientes();
    renderizarClientes();
  }

  function renderizarResumenClientes() {
    const contenedor = $('#clientKpis');
    if (!contenedor) return;
    if (!clientesResumen) {
      contenedor.innerHTML = '';
      return;
    }
    const r = clientesResumen;
    contenedor.innerHTML = [
      kpi({ etiqueta: 'Clientes registrados hoy', valor: entero(r.registrados_hoy), pista: 'Altas del día', tono: 'info', compacto: true }),
      kpi({ etiqueta: 'Nuevos en el periodo', valor: entero(r.registrados_periodo), pista: 'Según fechas filtradas', compacto: true }),
      kpi({ etiqueta: 'Total de clientes', valor: entero(r.total), pista: `${entero(r.activos)} activos · ${entero(r.inactivos)} inactivos`, compacto: true }),
      kpi({ etiqueta: 'Anulados', valor: entero(r.anulados), pista: 'Bajas lógicas', tono: r.anulados > 0 ? 'danger' : '', compacto: true }),
      kpi({ etiqueta: 'Con pedidos', valor: entero(r.con_pedidos), pista: `${entero(r.sin_pedidos)} sin pedidos`, tono: 'ok', compacto: true }),
      kpi({ etiqueta: 'Nuevos en 7 días', valor: entero(r.nuevos_7_dias), pista: 'Última semana', compacto: true }),
      kpi({ etiqueta: 'Total gastado', valor: money(r.total_gastado), pista: 'Pagos aprobados históricos', compacto: true })
    ].join('');
  }

  const ETIQUETA_ESTADO = { activo: 'Activo', inactivo: 'Inactivo', anulado: 'Anulado' };
  const CLASE_ESTADO = { activo: 'is-active', inactivo: 'is-inactive', anulado: 'is-void' };

  function renderizarClientes() {
    const cuerpo = $('#adminClientsList');
    if (!cuerpo) return;
    if (!clientesData.length) {
      cuerpo.innerHTML = '<tr><td colspan="8" class="dash-empty">No hay clientes que coincidan con los filtros.</td></tr>';
      return;
    }
    cuerpo.innerHTML = clientesData.map(cliente => {
      const estado = cliente.estado_cuenta || (cliente.activa ? 'activo' : 'inactivo');
      const nombre = [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ') || cliente.nombre_usuario || 'Sin nombre';
      const acciones = estado === 'anulado'
        ? '<button type="button" class="btn-link" data-client-action="activo" data-client-id="' + Number(cliente.id) + '">Reactivar</button>'
        : `<button type="button" class="btn-link" data-client-action="${estado === 'activo' ? 'inactivo' : 'activo'}" data-client-id="${Number(cliente.id)}">${estado === 'activo' ? 'Inactivar' : 'Activar'}</button>
           <button type="button" class="btn-link danger" data-client-action="anulado" data-client-id="${Number(cliente.id)}">Anular</button>`;
      return `<tr>
        <td>
          <strong>${esc(nombre)}</strong>
          ${cliente.motivo_estado ? `<small class="admin-table-note">Motivo: ${esc(cliente.motivo_estado)}</small>` : ''}
        </td>
        <td>${esc(cliente.correo)}</td>
        <td><span class="admin-badge ${CLASE_ESTADO[estado] || ''}">${esc(ETIQUETA_ESTADO[estado] || estado)}</span></td>
        <td>${fechaHora(cliente.creado_en)}</td>
        <td>${fechaHora(cliente.ultimo_acceso_en)}</td>
        <td class="num">${entero(cliente.pedidos_total)}${Number(cliente.pedidos_aprobados) ? `<small class="admin-table-note">${entero(cliente.pedidos_aprobados)} aprob.</small>` : ''}</td>
        <td class="num">${money(cliente.total_gastado)}</td>
        <td class="actions">${acciones}</td>
      </tr>`;
    }).join('');
  }

  function abrirDialogoCliente(id, estadoInicial) {
    const cliente = clientesData.find(item => Number(item.id) === Number(id));
    const dialogo = $('#clientStatusDialog');
    if (!cliente || !dialogo) return;
    const nombre = [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ') || cliente.nombre_usuario || cliente.correo;
    $('#clientStatusId').value = cliente.id;
    $('#clientStatusTitle').textContent = `Cambiar estado de ${nombre}`;
    $('#clientStatusDescription').textContent = `Cuenta ${cliente.correo} · Estado actual: ${ETIQUETA_ESTADO[cliente.estado_cuenta] || cliente.estado_cuenta}.`;
    $('#clientStatusSelect').value = estadoInicial;
    $('#clientStatusReason').value = '';
    $('#clientStatusMessage').textContent = '';
    actualizarDialogoCliente();
    if (typeof dialogo.showModal === 'function') dialogo.showModal();
    else dialogo.setAttribute('open', '');
  }

  function actualizarDialogoCliente() {
    const estado = $('#clientStatusSelect')?.value;
    const esAnulacion = estado === 'anulado';
    $('#clientStatusWarning').hidden = !esAnulacion;
    $('#clientStatusReasonLabel').classList.toggle('is-required', esAnulacion);
    $('#clientStatusReason').required = esAnulacion;
  }

  async function guardarEstadoCliente(event) {
    event.preventDefault();
    const id = Number($('#clientStatusId').value);
    const estado = $('#clientStatusSelect').value;
    const motivo = $('#clientStatusReason').value.trim();
    const mensaje = $('#clientStatusMessage');
    if (estado === 'anulado' && motivo.length < 5) {
      mensaje.textContent = 'Indica el motivo de la anulación (mínimo 5 caracteres).';
      return;
    }
    const boton = $('#clientStatusConfirm');
    boton.disabled = true;
    mensaje.textContent = 'Guardando cambio…';
    const { data, error } = await supabaseClient.rpc('cambiar_estado_cliente_jefe', {
      p_id: id,
      p_estado: estado,
      p_motivo: motivo || null
    });
    boton.disabled = false;
    if (error) {
      mensaje.textContent = `No se pudo cambiar el estado: ${error.message}`;
      return;
    }
    $('#clientStatusDialog').close();
    informar(`Cliente actualizado: ${ETIQUETA_ESTADO[data?.estado_nuevo] || estado}.`);
    await cargarClientes();
    await cargarDashboard();
  }

  /* ---------- Movimientos ---------- */
  async function cargarMovimientosFiltrados() {
    const contenedor = $('#adminMovementsList');
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="dash-loading">Cargando movimientos…</p>';
    const { desde, hasta } = leerRango('#movementFromFilter', '#movementToFilter');
    const motivo = $('#movementTypeFilter')?.value || null;
    const busqueda = $('#movementSearch')?.value.trim() || null;

    const [lista, resumen] = await Promise.all([
      supabaseClient.rpc('listar_movimientos_inventario_filtrado', {
        p_desde: desde || null,
        p_hasta: hasta || null,
        p_motivo: motivo,
        p_busqueda: busqueda,
        p_limite: 2000
      }),
      supabaseClient.rpc('resumen_movimientos_personal', {
        p_desde: desde || null,
        p_hasta: hasta || null
      })
    ]);

    if (lista.error) {
      contenedor.innerHTML = `<p class="admin-error">No se pudieron cargar los movimientos: ${esc(lista.error.message)}</p>`;
      return;
    }
    movimientosData = lista.data || [];
    movimientosResumen = resumen.error ? null : (resumen.data || null);
    renderizarResumenMovimientos();
    renderizarMovimientosFiltrados();
  }

  function renderizarResumenMovimientos() {
    const contenedor = $('#movementSummary');
    if (!contenedor) return;
    if (!movimientosResumen) {
      contenedor.innerHTML = '';
      return;
    }
    const r = movimientosResumen;
    contenedor.innerHTML = [
      kpi({ etiqueta: 'Movimientos', valor: entero(r.total), compacto: true }),
      kpi({ etiqueta: 'Entradas', valor: entero(r.entradas), pista: `${entero(r.unidades_entrada)} und.`, compacto: true, tono: 'ok' }),
      kpi({ etiqueta: 'Ventas', valor: entero(r.ventas), pista: `${entero(r.unidades_vendidas)} und.`, compacto: true, tono: 'info' }),
      kpi({ etiqueta: 'Ajustes', valor: entero(r.ajustes), compacto: true, tono: 'warn' }),
      kpi({ etiqueta: 'Devoluciones', valor: entero(r.devoluciones), compacto: true, tono: 'danger' })
    ].join('');
  }

  function claseMovimiento(motivo) {
    return ['entrada', 'venta', 'ajuste', 'devolucion'].includes(motivo) ? `mov-${motivo}` : '';
  }

  function renderizarMovimientosFiltrados() {
    const contenedor = $('#adminMovementsList');
    if (!contenedor) return;
    if (!movimientosData.length) {
      contenedor.innerHTML = '<p class="dash-empty">No hay movimientos que coincidan con los filtros.</p>';
      return;
    }
    contenedor.innerHTML = `<div class="admin-table-wrap"><table class="admin-table admin-table-movements">
      <thead><tr><th>Fecha</th><th>Producto</th><th>Código</th><th>Tipo</th><th class="num">Cantidad</th><th>Pedido</th><th>Lote</th><th>Nota</th></tr></thead>
      <tbody>${movimientosData.map(movimiento => `<tr>
        <td>${fechaHora(movimiento.creado_en)}</td>
        <td><strong>${esc(movimiento.producto)}</strong></td>
        <td>${esc(movimiento.codigo_producto)}</td>
        <td><span class="admin-badge ${claseMovimiento(movimiento.motivo)}">${esc(movimiento.motivo)}</span></td>
        <td class="num">${Number(movimiento.cantidad) > 0 ? '+' : ''}${entero(movimiento.cantidad)}</td>
        <td>${esc(movimiento.numero_pedido || '—')}</td>
        <td>${esc(movimiento.codigo_lote || '—')}</td>
        <td>${esc(movimiento.nota || '—')}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }

  /* ---------- Exportaciones ---------- */
  function exportarClientes() {
    const { desde, hasta } = leerRango('#clientFromFilter', '#clientToFilter');
    const rango = desde || hasta ? `${desde || 'inicio'} a ${hasta || 'hoy'}` : 'Histórico completo';
    exportarExcelProfesional({
      archivo: `clientes-byte-bay-${hoyISO()}.xlsx`,
      hoja: 'Clientes',
      titulo: 'BYTE BAY · Reporte de clientes',
      subtitulo: `Periodo: ${rango} · Filtro: ${$('#clientStatusFilter')?.value || 'todos'} · Búsqueda: ${$('#clientSearch')?.value.trim() || 'ninguna'}`,
      columnas: [
        { titulo: 'Cliente', valor: fila => [fila.nombres, fila.apellidos].filter(Boolean).join(' ') || fila.nombre_usuario || 'Sin nombre', ancho: 28 },
        { titulo: 'Correo', valor: fila => fila.correo, ancho: 32 },
        { titulo: 'Usuario', valor: fila => fila.nombre_usuario || '—', ancho: 18 },
        { titulo: 'Estado', valor: fila => ETIQUETA_ESTADO[fila.estado_cuenta] || fila.estado_cuenta, ancho: 12 },
        { titulo: 'Motivo del estado', valor: fila => fila.motivo_estado || '—', ancho: 32 },
        { titulo: 'Fecha de registro', valor: fila => fechaHora(fila.creado_en), ancho: 20 },
        { titulo: 'Último acceso', valor: fila => fechaHora(fila.ultimo_acceso_en), ancho: 20 },
        { titulo: 'Pedidos', valor: fila => num(fila.pedidos_total), ancho: 10 },
        { titulo: 'Pedidos aprobados', valor: fila => num(fila.pedidos_aprobados), ancho: 18 },
        { titulo: 'Total gastado', valor: fila => num(fila.total_gastado), ancho: 16, formato: '"S/ "#,##0.00' }
      ],
      filas: clientesData,
      resumen: clientesResumen ? [
        ['Clientes registrados hoy', clientesResumen.registrados_hoy],
        ['Nuevos en el periodo', clientesResumen.registrados_periodo],
        ['Total de clientes', clientesResumen.total],
        ['Activos', clientesResumen.activos],
        ['Inactivos', clientesResumen.inactivos],
        ['Anulados', clientesResumen.anulados],
        ['Con pedidos', clientesResumen.con_pedidos],
        ['Sin pedidos', clientesResumen.sin_pedidos],
        ['Total gastado histórico', money(clientesResumen.total_gastado)]
      ] : []
    });
  }

  function exportarMovimientos() {
    const { desde, hasta } = leerRango('#movementFromFilter', '#movementToFilter');
    const rango = desde || hasta ? `${desde || 'inicio'} a ${hasta || 'hoy'}` : 'Histórico completo';
    exportarExcelProfesional({
      archivo: `movimientos-byte-bay-${hoyISO()}.xlsx`,
      hoja: 'Movimientos',
      titulo: 'BYTE BAY · Reporte de movimientos de inventario',
      subtitulo: `Periodo: ${rango} · Tipo: ${$('#movementTypeFilter')?.value || 'todos'} · Búsqueda: ${$('#movementSearch')?.value.trim() || 'ninguna'}`,
      columnas: [
        { titulo: 'Fecha', valor: fila => fechaHora(fila.creado_en), ancho: 20 },
        { titulo: 'Producto', valor: fila => fila.producto, ancho: 34 },
        { titulo: 'Código', valor: fila => fila.codigo_producto, ancho: 18 },
        { titulo: 'Tipo', valor: fila => fila.motivo, ancho: 12 },
        { titulo: 'Cantidad', valor: fila => num(fila.cantidad), ancho: 12 },
        { titulo: 'Pedido', valor: fila => fila.numero_pedido || '—', ancho: 18 },
        { titulo: 'Lote', valor: fila => fila.codigo_lote || '—', ancho: 18 },
        { titulo: 'Nota', valor: fila => fila.nota || '—', ancho: 40 }
      ],
      filas: movimientosData,
      resumen: movimientosResumen ? [
        ['Total de movimientos', movimientosResumen.total],
        ['Entradas', movimientosResumen.entradas],
        ['Ventas', movimientosResumen.ventas],
        ['Ajustes', movimientosResumen.ajustes],
        ['Devoluciones', movimientosResumen.devoluciones],
        ['Unidades ingresadas', movimientosResumen.unidades_entrada],
        ['Unidades vendidas', movimientosResumen.unidades_vendidas]
      ] : []
    });
  }

  /* ---------- Inicialización de fechas ---------- */
  function inicializarFechas() {
    const dashboardRango = rangoPreset('30');
    if ($('#dashboardFrom')) $('#dashboardFrom').value = dashboardRango.desde;
    if ($('#dashboardTo')) $('#dashboardTo').value = dashboardRango.hasta;
    const movimientosRango = rangoPreset('30');
    if ($('#movementFromFilter')) $('#movementFromFilter').value = movimientosRango.desde;
    if ($('#movementToFilter')) $('#movementToFilter').value = movimientosRango.hasta;
    const clientesRango = rangoPreset('all');
    if ($('#clientFromFilter')) $('#clientFromFilter').value = clientesRango.desde;
    if ($('#clientToFilter')) $('#clientToFilter').value = clientesRango.hasta;
  }

  function aplicarPreset(grupo, preset) {
    const rango = rangoPreset(preset);
    if (grupo === 'dashboard') {
      $('#dashboardFrom').value = rango.desde;
      $('#dashboardTo').value = rango.hasta;
      activarPreset('#dashboardFilters', preset);
      cargarDashboard();
    }
    if (grupo === 'movement') {
      $('#movementFromFilter').value = rango.desde;
      $('#movementToFilter').value = rango.hasta;
      activarPreset('[data-admin-section="movimientos"]', preset);
      cargarMovimientosFiltrados();
    }
    if (grupo === 'client') {
      $('#clientFromFilter').value = rango.desde;
      $('#clientToFilter').value = rango.hasta;
      activarPreset('[data-admin-section="clientes"]', preset);
      cargarClientes();
    }
  }

  /* ---------- Listeners ---------- */
  $$('#dashboardFilters [data-dashboard-preset]').forEach(boton => {
    boton.addEventListener('click', () => aplicarPreset('dashboard', boton.dataset.dashboardPreset));
  });
  $$('[data-movement-preset]').forEach(boton => {
    boton.addEventListener('click', () => aplicarPreset('movement', boton.dataset.movementPreset));
  });
  $$('[data-client-preset]').forEach(boton => {
    boton.addEventListener('click', () => aplicarPreset('client', boton.dataset.clientPreset));
  });

  $('#dashboardApply')?.addEventListener('click', cargarDashboard);
  $('#dashboardRefreshOffers')?.addEventListener('click', cargarOfertasDashboard);
  $('#adminRefreshReports')?.addEventListener('click', cargarDashboard);

  $('#refreshClients')?.addEventListener('click', cargarClientes);
  $('#clientApplyFilters')?.addEventListener('click', cargarClientes);
  $('#clientStatusFilter')?.addEventListener('change', cargarClientes);
  $('#exportClients')?.addEventListener('click', exportarClientes);

  let clientesTimer = null;
  $('#clientSearch')?.addEventListener('input', () => {
    clearTimeout(clientesTimer);
    clientesTimer = setTimeout(() => {
      if (clientesCargados) cargarClientes();
    }, 350);
  });

  $('#movementApplyFilters')?.addEventListener('click', cargarMovimientosFiltrados);
  $('#exportMovements')?.addEventListener('click', exportarMovimientos);
  $('#movementTypeFilter')?.addEventListener('change', cargarMovimientosFiltrados);
  $('#movementSearch')?.addEventListener('input', () => {
    clearTimeout(movimientosTimer);
    movimientosTimer = setTimeout(cargarMovimientosFiltrados, 350);
  });

  $('#adminClientsList')?.addEventListener('click', event => {
    const boton = event.target.closest('[data-client-action]');
    if (!boton) return;
    abrirDialogoCliente(boton.dataset.clientId, boton.dataset.clientAction);
  });

  $('#clientStatusSelect')?.addEventListener('change', actualizarDialogoCliente);
  $('#clientStatusForm')?.addEventListener('submit', guardarEstadoCliente);
  const cerrarDialogo = () => {
    const dialogo = $('#clientStatusDialog');
    if (dialogo?.open) dialogo.close();
  };
  $('#clientStatusCancel')?.addEventListener('click', cerrarDialogo);
  $('#clientStatusDismiss')?.addEventListener('click', cerrarDialogo);
  $('#clientStatusDialog')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) cerrarDialogo();
  });

  /* ---------- Arranque tras el login ---------- */
  function arrancarSiVisible() {
    const app = $('#adminApp');
    if (!app || app.classList.contains('hidden') || dashboardIniciado) return;
    dashboardIniciado = true;
    inicializarFechas();
    cargarDashboard();
  }

  const observador = new MutationObserver(arrancarSiVisible);
  if ($('#adminApp')) observador.observe($('#adminApp'), { attributes: true, attributeFilter: ['class'] });
  arrancarSiVisible();

  window.bbCargarDashboard = cargarDashboard;
  window.bbCargarClientes = cargarClientes;
  window.bbCargarMovimientosFiltrados = cargarMovimientosFiltrados;
})();
