(function(){
  const ORDEN_ESTADOS=['pendiente','confirmado','preparando','enviado','entregado'];
  function etiquetaEstado(estado){return ({pendiente:'Pendiente',confirmado:'Confirmado',preparando:'Preparando',enviado:'Enviado',entregado:'Entregado',cancelado:'Cancelado',aprobado:'Aprobado',rechazado:'Rechazado'})[estado]||estado;}
  function iconoEstado(estado){return ({pendiente:'⏳',confirmado:'✓',preparando:'📦',enviado:'🚚',entregado:'✅',cancelado:'✕'})[estado]||'•';}
  function abrirMisPedidos(){
    const modal=document.querySelector('#ordersModal');
    if(!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('checkout-open');
    cargarMisPedidos();
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
    try{
      const {data,error}=await supabaseClient.rpc('bb_listar_pedidos_cliente',{p_access_token:sesion.access_token});
      if(error||!data?.ok){cont.innerHTML='<p class="orders-empty">No pudimos cargar tus pedidos.</p>';return;}
      const pedidos=Array.isArray(data.pedidos)?data.pedidos:[];
      if(!pedidos.length){cont.innerHTML='<p class="orders-empty">Aún no tienes pedidos. ¡Empieza a comprar!</p>';return;}
      cont.innerHTML=pedidos.map(p=>{
        const cancelado=p.estado==='cancelado';
        const idx=ORDEN_ESTADOS.indexOf(p.estado);
        const pasos=ORDEN_ESTADOS.map((e,i)=>{
          let cls='';
          if(!cancelado){if(i<idx)cls='done';else if(i===idx)cls='active';}
          return `<div class="timeline-step ${cls} ${cancelado&&i===0?'cancelled':''}"><div class="timeline-dot">${iconoEstado(cancelado&&i===0?'cancelado':e)}</div><span>${etiquetaEstado(cancelado&&i===0?'cancelado':e)}</span></div>`;
        }).join('');
        const items=(p.items||[]).map(it=>`<div class="order-item"><span>${escapeHtml(it.nombre)} × ${it.cantidad}</span><span>${money(Number(it.precio)*Number(it.cantidad))}</span></div>`).join('');
        const trackingInfo = p.tracking_number ? `<div class="order-tracking-info"><strong>Tracking:</strong> ${escapeHtml(p.carrier||'')} ${escapeHtml(p.tracking_number)}${p.tracking_url?` <a href="${escapeHtml(p.tracking_url)}" target="_blank" rel="noopener">Ver seguimiento</a>`:''}</div>` : '';
        const whatsappMsg = p.estado==='enviado' ? `<div class="order-whatsapp-alert"><span>📱</span><div><strong>Tu pedido está en camino</strong><p>Por favor, estate atento a WhatsApp para que el repartidor se comunique contigo y coordine la entrega.</p></div></div>` : '';
        return `<article class="order-card">
          <div class="order-head">
            <div><strong>${escapeHtml(p.numero)}</strong><br><small>${new Date(p.creado_en).toLocaleString('es-PE')}</small></div>
            <span class="order-status-badge ${p.estado}">${etiquetaEstado(p.estado)}</span>
          </div>
          <div class="order-meta"><span>Total: <b>${money(Number(p.total))}</b></span><span>Método: <b>${escapeHtml(p.metodo_pago)}</b></span><span>Pago: <b>${etiquetaEstado(p.estado_pago)}</b></span></div>
          ${trackingInfo}
          <div class="order-items">${items}</div>
          ${whatsappMsg}
          ${cancelado?'':`<div class="order-timeline">${pasos}</div>`}
        </article>`;
      }).join('');
    }catch(err){console.error('Mis pedidos:',err);cont.innerHTML='<p class="orders-empty">No pudimos cargar tus pedidos.</p>';}
  }
  document.querySelector('#ordersOpen')?.addEventListener('click',abrirMisPedidos);
  document.querySelector('#ordersClose')?.addEventListener('click',cerrarMisPedidos);
  document.querySelector('#ordersModal')?.addEventListener('click',e=>{if(e.target.id==='ordersModal')cerrarMisPedidos();});
})();