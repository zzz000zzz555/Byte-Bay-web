(function(){
  const ORDEN_ESTADOS=['pendiente','confirmado','preparando','enviado','entregado'];
let pedidosCache=[];
let filtroPedidos='all';
  function escHtml(v){return (window.BBStore?.escapeHtml||function(x){return String(x).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));})(v);}
  function moneyFn(v){return (window.BBStore?.money||function(x){return 'S/ '+Number(x).toFixed(2)})(v);}
  function etiquetaEstado(estado){return ({pendiente:'Pendiente',confirmado:'Confirmado',preparando:'Preparando',enviado:'Enviado',entregado:'Entregado',cancelado:'Cancelado',aprobado:'Aprobado',rechazado:'Rechazado'})[estado]||estado;}
  function iconoEstado(estado){return ({pendiente:'⏳',confirmado:'✓',preparando:'📦',enviado:'🚚',entregado:'✅',cancelado:'✕'})[estado]||'•';}

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
    if(!lista.length){ cont.innerHTML='<div class="orders-empty-state"><div class="empty-icon">📦</div><p>No hay pedidos en esta categoría.</p><a class="btn secondary" href="#ofertas">Explorar ofertas del catálogo</a></div>'; return; }
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
      const whatsappMsg = p.estado==='enviado' ? `<div class="order-whatsapp-alert"><span>📱</span><div><strong>Tu pedido está en camino</strong><p>Estate atento a WhatsApp para coordinar la entrega.</p></div></div>` : '';
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
          <button class="btn secondary" onclick="descargarBoleta('${p.id}')">Descargar boleta</button>
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
  window.descargarBoleta=function(id){const p=pedidosCache.find(x=>String(x.id)===String(id)); if(!p) return; const w=window.open('','_blank'); w.document.write('<h1>Boleta Byte Bay</h1><p>Pedido: '+p.numero+'</p><p>Total: S/ '+Number(p.total).toFixed(2)+'</p>'); w.document.close(); w.print();};
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
