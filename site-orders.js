(function(){
  const ORDEN_ESTADOS=['pendiente','confirmado','preparando','enviado','entregado'];
let pedidosCache=[];
let filtroPedidos='all';
  function escHtml(v){return (window.BBStore?.escapeHtml||function(x){return String(x).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));})(v);}
  function moneyFn(v){return (window.BBStore?.money||function(x){return 'S/ '+Number(x).toFixed(2)})(v);}
  function etiquetaEstado(estado){return ({pendiente:'Pendiente',confirmado:'Confirmado',preparando:'Preparando',enviado:'Enviado',entregado:'Entregado',cancelado:'Cancelado',aprobado:'Aprobado',rechazado:'Rechazado'})[estado]||estado;}
  function iconoEstado(estado){return ({pendiente:'Pend.',confirmado:'Conf.',preparando:'Prep.',enviado:'Env.',entregado:'Ent.',cancelado:'Can.'})[estado]||'—';}

  function estadoGrupo(estado){
    if(estado==='cancelado'||estado==='rechazado') return 'cancelado';
    if(estado==='entregado') return 'entregado';
    if(estado==='enviado') return 'camino';
    return 'proceso';
  }
  function renderizarPedidos(){
    const cont=document.querySelector('#ordersList');
    if(!cont) return;
    const busqueda=(document.querySelector('#ordersSearch')?.value||'').toLowerCase();
    let lista=pedidosCache.filter(p=>{
      if(filtroPedidos!=='all' && estadoGrupo(p.estado)!==filtroPedidos) return false;
      if(busqueda && !(p.numero||'').toLowerCase().includes(busqueda) && !(p.items||[]).some(it=>(it.nombre||'').toLowerCase().includes(busqueda))) return false;
      return true;
    });
    if(!lista.length){ cont.innerHTML='<div class="orders-empty-state"><div class="empty-icon">—</div><p>No hay pedidos en esta categoría.</p><a class="btn secondary" href="#ofertas">Explorar ofertas del catálogo</a></div>'; return; }
    cont.innerHTML=lista.map(p=>{
      const cancelado=p.estado==='cancelado';
      const idx=ORDEN_ESTADOS.indexOf(p.estado);
      const pasos=ORDEN_ESTADOS.map((e,i)=>{
        let cls='';
        if(!cancelado){if(i<idx)cls='done';else if(i===idx)cls='active';}
        return `<div class="timeline-step ${cls} ${cancelado&&i===0?'cancelled':''}"><div class="timeline-dot">${iconoEstado(cancelado&&i===0?'cancelado':e)}</div><span>${etiquetaEstado(cancelado&&i===0?'cancelado':e)}</span></div>`;
      }).join('');
      const items=(p.items||[]).map(it=>`<div class="order-item"><img src="${escHtml(it.imagen||'imagen-producto-predeterminada.svg')}" alt=""><div><strong>${escHtml(it.nombre)}</strong><small>${escHtml(it.variante||'')} x${it.cantidad}</small></div><span>${moneyFn(Number(it.precio)*Number(it.cantidad))}</span></div>`).join('');
      const trackingInfo = p.tracking_number ? `<div class="order-tracking-info"><strong>Tracking:</strong> ${escHtml(p.carrier||'')} ${escHtml(p.tracking_number)}${p.tracking_url?` <a href="${escHtml(p.tracking_url)}" target="_blank" rel="noopener">Ver seguimiento</a>`:''}</div>` : '';
      const whatsappMsg = p.estado==='enviado' ? `<div class="order-whatsapp-alert"><span>WhatsApp</span><div><strong>Tu pedido está en camino</strong><p>Estate atento a WhatsApp para coordinar la entrega.</p></div></div>` : '';
      return `<article class="order-card">
        <div class="order-head">
          <div><strong>#${escHtml(p.numero)}</strong><br><small>${new Date(p.creado_en).toLocaleString('es-PE')}</small></div>
          <span class="order-status-badge ${p.estado}">${etiquetaEstado(p.estado)}</span>
        </div>
        <div class="order-meta"><span>Total: <b>${moneyFn(Number(p.total))}</b></span><span>Método: <b>${escHtml(p.metodo_pago)}</b></span><span>Pago: <b>${etiquetaEstado(p.estado_pago)}</b></span></div>
        ${trackingInfo}
        <div class="order-items">${items}</div>
        ${whatsappMsg}
        ${cancelado?'':`<div class="order-timeline">${pasos}</div>`}
        <div class="order-actions">
          <button class="btn secondary" onclick="verDetallePedido('${p.id}')">Ver detalle</button>
          <button class="btn secondary" onclick="descargarBoleta('${p.id}')">Imprimir resumen</button>
          <button class="btn primary" onclick="volverAComprar('${p.id}')">Volver a comprar</button>
        </div>
      </article>`;
    }).join('');
  }

  function abrirMisPedidos(){
    const modal=document.querySelector('#ordersModal');
    if(!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('checkout-open');
    if(window.cachedUserOrders){ pedidosCache=window.cachedUserOrders; renderizarPedidos(); }
    cargarMisPedidos();
    document.querySelectorAll('.orders-tab').forEach(btn=>{btn.onclick=()=>{document.querySelectorAll('.orders-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');filtroPedidos=btn.dataset.status;renderizarPedidos();};});
    const search=document.querySelector('#ordersSearch'); if(search) search.oninput=()=>renderizarPedidos();
  }
  function cerrarMisPedidos(){
    const modal=document.querySelector('#ordersModal');
    if(!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('checkout-open');
  }
  async function cargarMisPedidos(){
    const cont=document.querySelector('#ordersList');
    if(!cont) return;
    cont.innerHTML='<p class="orders-empty">Cargando tus pedidos…</p>';
    const sesion=await window.BBPrivacy?.obtenerSesionCliente?.();
    if(!sesion?.ok){cont.innerHTML='<p class="orders-empty">Inicia sesión para ver tus pedidos.</p>';return;}
    const sb=window.BBStore?.client||window.supabaseClient;
    if(!sb){cont.innerHTML='<p class="orders-empty">No se pudo conectar con la base de datos.</p>';return;}
    try{
      const {data,error}=await sb.rpc('bb_listar_pedidos_cliente',{p_access_token:sesion.access_token});
      if(error||!data?.ok){cont.innerHTML='<p class="orders-empty">No pudimos cargar tus pedidos.</p>';return;}
      const pedidos=Array.isArray(data.pedidos)?data.pedidos:[];
      pedidosCache=pedidos;
      // badge
      const badge=document.querySelector('#ordersBadge'); if(badge){ badge.textContent=pedidos.length; badge.hidden=pedidos.length===0; }
      if(!pedidos.length){cont.innerHTML='<p class="orders-empty">Aún no tienes pedidos. ¡Empieza a comprar!</p>';return;}
      renderizarPedidos();
      return;
      // rendering moved to renderizarPedidos
      return;
    }catch(err){console.error('Mis pedidos:',err);cont.innerHTML='<p class="orders-empty">No pudimos cargar tus pedidos.</p>';}
  }
  document.querySelector('#ordersOpen')?.addEventListener('click',abrirMisPedidos);
  document.querySelector('#ordersClose')?.addEventListener('click',cerrarMisPedidos);
  document.querySelector('#ordersModal')?.addEventListener('click',e=>{if(e.target.id==='ordersModal')cerrarMisPedidos();});

  window.verDetallePedido=function(id){const p=pedidosCache.find(x=>String(x.id)===String(id)); if(!p) return; alert('Pedido '+p.numero+'\nEstado: '+p.estado+'\nTotal: S/ '+Number(p.total).toFixed(2));};
  window.descargarBoleta=function(id){
    const pedido=pedidosCache.find(item=>String(item.id)===String(id));
    if(!pedido) return;
    const ventana=window.open('about:blank','_blank');
    if(!ventana){
      const mensaje='Permite las ventanas emergentes para imprimir el resumen de tu pedido.';
      if(window.BBStore?.toast) window.BBStore.toast(mensaje);
      else window.alert(mensaje);
      return;
    }
    ventana.opener=null;
    const documento=ventana.document;
    const estilo=documento.createElement('style');
    estilo.textContent=`
      :root{color-scheme:light;font-family:Inter,Arial,sans-serif;color:#173c38;background:#f4f4ed}
      *{box-sizing:border-box}
      body{margin:0;padding:40px 18px}
      main{width:min(760px,100%);margin:0 auto;background:#fff;border:1px solid #dfe5dc;border-radius:20px;padding:clamp(24px,5vw,52px);box-shadow:0 18px 48px rgba(20,52,43,.1)}
      header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:24px;border-bottom:1px solid #dfe5dc}
      h1{font-size:clamp(26px,4vw,36px);line-height:1.1;margin:4px 0 8px;letter-spacing:-.04em}
      h2{font-size:17px;margin:28px 0 12px}
      p{line-height:1.55;margin:5px 0;color:#3d514b}
      .kicker{font-size:11px;letter-spacing:.1em;font-weight:800;text-transform:uppercase;color:#627760}
      .order-number{font-variant-numeric:tabular-nums;font-weight:700}
      .status{display:inline-block;margin-top:8px;padding:6px 10px;border-radius:999px;background:#eef3e7;font-size:12px;font-weight:700}
      .meta{min-width:190px;text-align:right;font-size:13px}
      .items{width:100%;border-collapse:collapse;font-size:13px}
      .items th,.items td{padding:11px 8px;border-bottom:1px solid #e8ece5;text-align:left;vertical-align:top}
      .items th:nth-child(2),.items td:nth-child(2){text-align:center}
      .items th:nth-last-child(-n+2),.items td:nth-last-child(-n+2){text-align:right;white-space:nowrap}
      .items th{font-size:11px;color:#627760;text-transform:uppercase}
      .muted{display:block;color:#63716c;font-size:11px;margin-top:3px}
      .totals{width:min(330px,100%);margin:18px 0 0 auto}
      .totals p{display:flex;justify-content:space-between;gap:20px}
      .totals .grand{border-top:1px solid #bac6b9;padding-top:12px;margin-top:12px;font-size:18px;font-weight:800;color:#173c38}
      .notice{margin-top:30px;padding:14px;border:1px solid #dfe5dc;border-radius:12px;font-size:12px}
      .actions{display:flex;justify-content:flex-end;margin-top:24px}
      button{border:0;border-radius:9px;background:#173c38;color:#fff;padding:12px 18px;font:700 14px Inter,Arial,sans-serif;cursor:pointer}
      @media(max-width:560px){body{padding:12px 8px}main{border-radius:14px;padding:22px 16px}header{display:block}.meta{text-align:left;margin-top:18px}.items{font-size:12px}.items th,.items td{padding:9px 5px}}
      @media print{body{padding:0;background:#fff}main{width:100%;border:0;border-radius:0;box-shadow:none;padding:0}.actions{display:none}}
    `;
    documento.head.append(estilo);
    documento.title=`Resumen de pedido ${String(pedido.numero||'').trim()}`;

    const crear=(tag,contenido='',clase='')=>{
      const nodo=documento.createElement(tag);
      if(contenido) nodo.textContent=String(contenido);
      if(clase) nodo.className=clase;
      return nodo;
    };
    const monto=valor=>{
      const numero=Number(valor);
      return `S/ ${(Number.isFinite(numero)?numero:0).toFixed(2)}`;
    };
    const fecha=new Date(pedido.creado_en);
    const fechaTexto=Number.isNaN(fecha.getTime())?'No disponible':new Intl.DateTimeFormat('es-PE',{dateStyle:'long',timeStyle:'short'}).format(fecha);
    const main=documento.createElement('main');
    const encabezado=documento.createElement('header');
    const marca=documento.createElement('div');
    marca.append(crear('span','BYTE BAY','kicker'),crear('h1','Resumen de pedido'),crear('p',`Pedido ${pedido.numero||'—'}`,'order-number'));
    const datos=documento.createElement('div');
    datos.className='meta';
    datos.append(crear('p',fechaTexto),crear('p',`Pago: ${etiquetaEstado(pedido.estado_pago)}`,'status'),crear('p',`Pedido: ${etiquetaEstado(pedido.estado)}`));
    encabezado.append(marca,datos);
    main.append(encabezado,crear('h2','Detalle de productos'));

    const tabla=documento.createElement('table');
    tabla.className='items';
    const head=documento.createElement('thead');
    const filaTitulos=documento.createElement('tr');
    ['Producto','Cantidad','Precio unit.','Importe'].forEach(texto=>filaTitulos.append(crear('th',texto)));
    head.append(filaTitulos);
    const cuerpo=documento.createElement('tbody');
    (Array.isArray(pedido.items)?pedido.items:[]).forEach(item=>{
      const fila=document.createElement('tr');
      const producto=document.createElement('td');
      producto.append(crear('strong',item.nombre||'Producto'));
      if(item.codigo) producto.append(crear('span',`Código: ${item.codigo}`,'muted'));
      if(item.variante) producto.append(crear('span',item.variante,'muted'));
      fila.append(producto,crear('td',item.cantidad??'—'),crear('td',monto(item.precio)),crear('td',monto(Number(item.precio)*Number(item.cantidad))));
      cuerpo.append(fila);
    });
    tabla.append(head,cuerpo);
    main.append(tabla);

    const totales=document.createElement('section');
    totales.className='totals';
    [
      ['Subtotal',pedido.subtotal],
      ['Envío',pedido.envio]
    ].forEach(([etiqueta,valor])=>{
      if(valor!==null&&valor!==undefined) totales.append(crear('p',`${etiqueta}: ${monto(valor)}`));
    });
    const descuento=Number(pedido.descuento);
    if(Number.isFinite(descuento)&&descuento>0) totales.append(crear('p',`Descuento: - ${monto(descuento)}`));
    totales.append(crear('p',`Total: ${monto(pedido.total)}`,'grand'));
    main.append(totales);
    if(pedido.metodo_pago) main.append(crear('p',`Método de pago: ${pedido.metodo_pago}`));
    main.append(crear('p','Este documento es un resumen de pedido y no es un comprobante tributario.','notice'));
    const acciones=documento.createElement('div');
    acciones.className='actions';
    const boton=documento.createElement('button');
    boton.type='button';
    boton.textContent='Imprimir o guardar como PDF';
    boton.addEventListener('click',()=>ventana.print());
    acciones.append(boton);
    main.append(acciones);
    documento.body.append(main);
    ventana.focus();
    ventana.setTimeout(()=>ventana.print(),300);
  };
  window.volverAComprar=function(id){const p=pedidosCache.find(x=>String(x.id)===String(id)); if(!p) return; (p.items||[]).forEach(it=>{ if(window.BBStore?.addToCart) window.BBStore.addToCart(it.id_producto, it.cantidad); }); };


  async function prefetchUserOrders(){
    try{
      const sesion=await window.BBPrivacy?.obtenerSesionCliente?.();
      if(!sesion?.ok) return;
      const sb=window.BBStore?.client||window.supabaseClient;
      if(!sb) return;
      const {data}=await sb.rpc('bb_listar_pedidos_cliente',{p_access_token:sesion.access_token});
      if(data?.ok && Array.isArray(data.pedidos)){
        window.cachedUserOrders=data.pedidos;
        const badge=document.querySelector('#ordersBadge');
        if(badge){ badge.textContent=data.pedidos.length; badge.hidden=data.pedidos.length===0; }
      }
    }catch(e){ console.warn('prefetch orders', e); }
  }
  if('requestIdleCallback' in window) requestIdleCallback(()=>prefetchUserOrders(), {timeout:2000});
  else setTimeout(prefetchUserOrders, 1500);

})();
