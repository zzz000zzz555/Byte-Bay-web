const SUPABASE_URL='https://inwugycvtaaceugvtfpv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_5cTHcYI6byM03VSffW0OlQ_JlBB8D9u';
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
let rolPersonal='';
let productosCatalogo=[],lotesInventario=[],ofertasRegistradas=[],movimientosRegistrados=[],personalRegistrado=[];
const imagenesProductos=new Map();
const imagenPredeterminada='imagen-producto-predeterminada.svg';
const $=selector=>document.querySelector(selector);
const escapar=(valor='')=>String(valor).replace(/[&<>'"]/g,caracter=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[caracter]));
const informar=mensaje=>{$('#adminStatus').textContent=mensaje;};
const imagenProducto=(id,nombre='')=>imagenesProductos.get(Number(id))||imagenesProductos.get(nombre)||imagenPredeterminada;
function mostrarVistaPrevia(imagenSelector,vacioSelector,url=''){const imagen=$(imagenSelector),vacio=$(vacioSelector);imagen.onerror=()=>{imagen.onerror=null;imagen.src=imagenPredeterminada;};imagen.src=url||imagenPredeterminada;imagen.style.display='block';vacio.style.display=url?'none':'block';}

document.addEventListener('error',evento=>{
  const imagen=evento.target;
  if(imagen.tagName!=='IMG'||imagen.dataset.respaldoAplicado) return;
  imagen.dataset.respaldoAplicado='true';
  imagen.src=imagenPredeterminada;
},true);

function actualizarTema(){
  const esNoche=document.documentElement.classList.contains('dark-mode');
  document.querySelectorAll('[data-theme-toggle]').forEach(boton=>{
    boton.setAttribute('aria-label',esNoche?'Activar modo claro':'Activar modo noche');
    boton.title=esNoche?'Cambiar a modo claro':'Cambiar a modo noche';
    boton.querySelector('span').textContent=esNoche?'☀':'☾';
  });
}
document.querySelectorAll('[data-theme-toggle]').forEach(boton=>boton.addEventListener('click',()=>{
  document.documentElement.classList.toggle('dark-mode');
  try{localStorage.setItem('beruTema',document.documentElement.classList.contains('dark-mode')?'noche':'claro')}catch(e){}
  actualizarTema();
}));
actualizarTema();

async function validarSesion(){
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(!session) return mostrarAcceso();
  const {data:rol,error}=await supabaseClient.rpc('mi_rol_personal');
  if(error||!rol){await supabaseClient.auth.signOut();return mostrarAcceso('La cuenta no pertenece al personal autorizado.');}
  rolPersonal=rol;
  $('#adminLogin').classList.add('hidden');$('#adminApp').classList.remove('hidden');
  $('#adminRole').textContent=`Sesión: ${session.user.email} · ${rol}`;
  $('#adminPeopleTab').classList.toggle('hidden',rol!=='jefe');
  $('#adminClientsTab').classList.toggle('hidden',rol!=='jefe');
  mostrarSeccion('resumen');
}
function mostrarAcceso(mensaje=''){$('#adminLogin').classList.remove('hidden');$('#adminApp').classList.add('hidden');$('#adminLoginStatus').textContent=mensaje;}
function mostrarFormularioRecuperacion(){
  $('#adminLoginForm').classList.add('hidden');
  $('#adminForgotPassword').classList.add('hidden');
  $('#adminRecoveryForm').classList.remove('hidden');
  $('#adminLoginStatus').textContent='Crea una contraseña nueva para tu cuenta.';
}
function mostrarSeccion(seccion){
  document.querySelectorAll('[data-admin-section]').forEach(elemento=>elemento.classList.toggle('hidden',elemento.dataset.adminSection!==seccion));
  document.querySelectorAll('[data-admin-tab]').forEach(boton=>boton.classList.toggle('active',boton.dataset.adminTab===seccion));
  if(seccion==='resumen'){cargarReportes();window.bbCargarDashboard?.();}
  if(seccion==='productos') cargarCatalogo();
  if(seccion==='inventario'||seccion==='ofertas') cargarOpciones();
  if(seccion==='ofertas') cargarOfertas();
  if(seccion==='clientes'&&rolPersonal==='jefe') window.bbCargarClientes?.();
  if(seccion==='pedidos') cargarPedidosAdmin();
  if(seccion==='movimientos'){if(window.bbCargarMovimientosFiltrados) window.bbCargarMovimientosFiltrados(); else cargarMovimientos();}
  if(seccion==='personal'&&rolPersonal==='jefe') cargarPersonal();
}

$('#adminLoginForm').onsubmit=async event=>{
  event.preventDefault();$('#adminLoginStatus').textContent='Validando credenciales…';
  const {error}=await supabaseClient.auth.signInWithPassword({email:$('#adminEmail').value.trim(),password:$('#adminPassword').value});
  if(error){$('#adminLoginStatus').textContent='Correo o contraseña incorrectos.';return;}
  await validarSesion();
};
$('#adminForgotPassword').onclick=async()=>{
  const correo=$('#adminEmail').value.trim();
  if(!correo){$('#adminLoginStatus').textContent='Escribe tu correo laboral para enviarte el enlace.';$('#adminEmail').focus();return;}
  $('#adminForgotPassword').disabled=true;
  try{localStorage.setItem('bbAdminPasswordRecoveryRequestedAt',String(Date.now()));}catch{}
  const redirectTo=`${window.location.origin}${window.location.pathname}`;
  const {error}=await supabaseClient.auth.resetPasswordForEmail(correo,{redirectTo});
  $('#adminForgotPassword').disabled=false;
  if(error){try{localStorage.removeItem('bbAdminPasswordRecoveryRequestedAt');}catch{}}
  $('#adminLoginStatus').textContent=error
    ? `No se pudo enviar el enlace: ${error.message}`
    : 'Si el correo corresponde a una cuenta, recibirás un enlace para cambiar la contraseña.';
};
supabaseClient.auth.onAuthStateChange(event=>{
  if(event==='PASSWORD_RECOVERY'){
    try{localStorage.removeItem('bbAdminPasswordRecoveryRequestedAt');}catch{}
    mostrarFormularioRecuperacion();
  }
});
$('#adminRecoveryForm').onsubmit=async event=>{
  event.preventDefault();
  const password=$('#adminNewPassword').value;
  if(password.length<10){$('#adminLoginStatus').textContent='La contraseña debe tener al menos 10 caracteres.';return;}
  if(password!==$('#adminConfirmPassword').value){$('#adminLoginStatus').textContent='Las contraseñas no coinciden.';return;}
  const {error}=await supabaseClient.auth.updateUser({password});
  if(error){$('#adminLoginStatus').textContent=`No se pudo cambiar la contraseña: ${error.message}`;return;}
  window.history.replaceState({},document.title,`${window.location.pathname}${window.location.search}`);
  $('#adminLoginStatus').textContent='Contraseña actualizada. Iniciando sesión…';
  await validarSesion();
};
$('#adminLogout').onclick=async()=>{await supabaseClient.auth.signOut();rolPersonal='';mostrarAcceso('Sesión cerrada correctamente.');};
document.querySelectorAll('[data-admin-tab]').forEach(boton=>boton.onclick=()=>{if(boton.dataset.adminTab==='personal'&&rolPersonal!=='jefe')return;mostrarSeccion(boton.dataset.adminTab);});

async function cargarOpciones(){
  const [productos,proveedores,catalogo]=await Promise.all([supabaseClient.rpc('listar_productos_inventario_personal'),supabaseClient.rpc('listar_proveedores_personal'),supabaseClient.from('catalogo_productos').select('id,nombre,url_imagen')]);
  if(productos.error||proveedores.error){informar(productos.error?.message||proveedores.error?.message);return;}
  (catalogo.data||[]).forEach(p=>{imagenesProductos.set(Number(p.id),p.url_imagen||imagenPredeterminada);imagenesProductos.set(p.nombre,p.url_imagen||imagenPredeterminada);});
  const opcionesProductos='<option value="">Selecciona un producto</option>'+(productos.data||[]).map(p=>`<option value="${p.id}">${escapar(p.codigo)} — ${escapar(p.nombre)}</option>`).join('');
  $('#lotProduct').innerHTML=opcionesProductos;$('#offerProduct').innerHTML=opcionesProductos;
  $('#lotProvider').innerHTML='<option value="">Sin proveedor</option>'+(proveedores.data||[]).map(p=>`<option value="${p.id}">${escapar(p.razon_social)}</option>`).join('');
}
async function cargarCatalogo(){
  const lista=$('#adminCatalogList');lista.textContent='Cargando productos…';
  const {data,error}=await supabaseClient.from('catalogo_productos').select('id,codigo,nombre,categoria,marca,url_imagen,fecha_vencimiento,precio_venta,existencias').order('id');
  if(error){lista.textContent=error.message;return;}
  productosCatalogo=data||[];productosCatalogo.forEach(p=>{imagenesProductos.set(Number(p.id),p.url_imagen||imagenPredeterminada);imagenesProductos.set(p.nombre,p.url_imagen||imagenPredeterminada);});
  const categorias=[...new Set(productosCatalogo.map(p=>p.categoria).filter(Boolean))].sort();$('#productCategoryFilter').innerHTML='<option value="">Todas las categorías</option>'+categorias.map(c=>`<option>${escapar(c)}</option>`).join('');
  renderizarCatalogo();
}
function renderizarCatalogo(){const texto=$('#productSearch').value.trim().toLowerCase(),categoria=$('#productCategoryFilter').value;const datos=productosCatalogo.filter(p=>(!categoria||p.categoria===categoria)&&(!texto||`${p.codigo} ${p.nombre} ${p.marca||''}`.toLowerCase().includes(texto)));const lista=$('#adminCatalogList');lista.innerHTML=datos.length?datos.map(p=>`<article class="admin-list-item"><img src="${escapar(imagenProducto(p.id,p.nombre))}" alt="${escapar(p.nombre)}"><div><strong>${escapar(p.nombre)}</strong><span>${escapar(p.codigo)} · ${escapar(p.categoria)} · S/ ${Number(p.precio_venta).toFixed(2)} · ${p.existencias} unidades</span></div><button data-edit-product="${p.id}">Editar</button></article>`).join(''):'No hay productos que coincidan con el filtro.';lista.querySelectorAll('[data-edit-product]').forEach(boton=>boton.onclick=()=>{const p=productosCatalogo.find(item=>item.id===Number(boton.dataset.editProduct));$('#adminProductId').value=p.id;$('#adminProductCode').value=p.codigo;$('#adminProductName').value=p.nombre;$('#adminProductCategory').value=p.categoria;$('#adminProductBrand').value=p.marca||'';$('#adminProductImage').value=p.url_imagen||'';$('#adminProductPrice').value=p.precio_venta;$('#adminProductStock').value=p.existencias;$('#adminProductExpiry').value=p.fecha_vencimiento||'';$('#adminProductHeading').textContent=`Editar: ${p.nombre}`;mostrarVistaPrevia('#adminProductPreview','#adminProductPreviewEmpty',p.url_imagen);window.scrollTo({top:0,behavior:'smooth'});});}
async function cargarReportes(){
  await cargarOpciones();
  const [{data:lotes,error},{data:gestion,error:errorGestion}]=await Promise.all([supabaseClient.rpc('listar_reporte_lotes_personal'),supabaseClient.rpc('resumen_reportes_jefe')]);
  if(error){informar(error.message);return;}
  const registros=lotes||[];lotesInventario=registros;const danados=registros.filter(x=>x.estado==='daniado').length,vencidos=registros.filter(x=>x.estado==='vencido'||x.dias_para_vencer<0).length,porVencer=registros.filter(x=>x.dias_para_vencer>=0&&x.dias_para_vencer<=30).length;
  $('#inventorySummary').innerHTML=`<div><strong>${registros.length}</strong><span>Lotes</span></div><div><strong>${porVencer}</strong><span>Por vencer</span></div><div><strong>${vencidos}</strong><span>Vencidos</span></div><div><strong>${danados}</strong><span>Dañados</span></div>`;
  $('#managementSummary').innerHTML=!errorGestion&&gestion?`<div><strong>${gestion.ventas_confirmadas}</strong><span>Ventas confirmadas</span></div><div><strong>S/ ${Number(gestion.importe_ventas_confirmadas).toFixed(2)}</strong><span>Ingresos</span></div><div><strong>${gestion.pedidos_pendientes}</strong><span>Pagos pendientes</span></div><div><strong>${gestion.productos_en_oferta}</strong><span>Ofertas activas</span></div>`:'<p>Los indicadores de ventas son exclusivos del jefe.</p>';
  renderizarInventario();
}
function renderizarInventario(){const texto=$('#inventorySearch').value.trim().toLowerCase(),estado=$('#inventoryStatusFilter').value;const datos=lotesInventario.filter(l=>(!estado||l.estado===estado)&&(!texto||`${l.producto} ${l.codigo_lote}`.toLowerCase().includes(texto)));$('#inventoryReportList').innerHTML=datos.length?datos.map(l=>`<article class="admin-list-item"><img src="${escapar(imagenProducto(0,l.producto))}" alt="${escapar(l.producto)}"><div><strong>${escapar(l.producto)}</strong><span>Lote ${escapar(l.codigo_lote)} · ${l.existencias_actuales} unidades · ${escapar(l.estado)}</span></div></article>`).join(''):'No hay lotes que coincidan con el filtro.';}
async function cargarOfertas(){const lista=$('#adminOffersList');lista.textContent='Cargando ofertas…';await cargarOpciones();const {data,error}=await supabaseClient.rpc('listar_ofertas_personal');if(error){lista.textContent='No se pudieron cargar las ofertas: '+error.message;return;}ofertasRegistradas=data||[];renderizarOfertas();}
function renderizarOfertas(){const texto=$('#offerSearch').value.trim().toLowerCase(),estado=$('#offerStatusFilter').value;const datos=ofertasRegistradas.filter(o=>(!estado||(estado==='activa')===o.activa)&&(!texto||`${o.producto} ${o.nombre}`.toLowerCase().includes(texto)));$('#adminOffersList').innerHTML=datos.length?datos.map(o=>`<article class="admin-list-item"><img src="${escapar(imagenProducto(o.id_producto,o.producto))}" alt="${escapar(o.producto)}"><div><strong>${escapar(o.producto)}</strong><span>${escapar(o.nombre)} · S/ ${Number(o.precio_oferta).toFixed(2)} · ${o.activa?'Activa':'Inactiva'}</span></div></article>`).join(''):'No hay ofertas que coincidan con el filtro.';}
async function cargarMovimientos(){const lista=$('#adminMovementsList');lista.textContent='Cargando movimientos…';await cargarOpciones();const {data,error}=await supabaseClient.rpc('listar_movimientos_inventario_personal');if(error){lista.textContent='No se pudieron cargar los movimientos: '+error.message;return;}movimientosRegistrados=data||[];renderizarMovimientos();}
function renderizarMovimientos(){const texto=$('#movementSearch').value.trim().toLowerCase(),tipo=$('#movementTypeFilter').value;const datos=movimientosRegistrados.filter(m=>(!tipo||m.motivo===tipo)&&(!texto||m.producto.toLowerCase().includes(texto)));$('#adminMovementsList').innerHTML=datos.length?datos.map(m=>`<article class="admin-list-item"><img src="${escapar(imagenProducto(m.id_producto,m.producto))}" alt="${escapar(m.producto)}"><div><strong>${escapar(m.producto)}</strong><span>${escapar(m.motivo)} · ${m.cantidad} unidades · ${new Date(m.creado_en).toLocaleString('es-CO')}</span></div></article>`).join(''):'No hay movimientos que coincidan con el filtro.';}

async function llamarGestionPersonal(accion,datos={}){
  const {data,error}=await supabaseClient.functions.invoke('crear-personal',{body:{accion,...datos,url_redireccion:`${window.location.origin}${window.location.pathname}`}});
  if(error||data?.error){
    let detalle=data?.error||error?.message||'No se pudo completar la operación.';
    try{const respuesta=error?.context;if(respuesta?.clone){const cuerpo=await respuesta.clone().json();detalle=cuerpo.error||cuerpo.message||detalle;}}catch(e){}
    throw new Error(detalle);
  }
  return data;
}
async function cargarPersonal(){
  const lista=$('#adminStaffList');lista.textContent='Cargando personal…';
  try{const data=await llamarGestionPersonal('listar');personalRegistrado=data.personal||[];renderizarPersonal();}
  catch(error){lista.innerHTML=`<p class="admin-error">${escapar(error.message)}. Verifica que la Edge Function <code>crear-personal</code> esté desplegada.</p>`;}
}
function renderizarPersonal(){
  const texto=$('#staffSearch').value.trim().toLowerCase(),estado=$('#staffStatusFilter').value;
  const datos=personalRegistrado.filter(p=>(!estado||(estado==='activo')===p.activo)&&(!texto||`${p.nombres} ${p.apellidos} ${p.correo} ${p.rol}`.toLowerCase().includes(texto)));
  const lista=$('#adminStaffList');
  lista.innerHTML=datos.length?datos.map(p=>`<article class="admin-list-item staff-item"><div><strong>${escapar(`${p.nombres} ${p.apellidos}`)}</strong><span>${escapar(p.correo)} · ${escapar(p.rol)} · <b class="staff-status ${p.activo?'is-active':'is-inactive'}">${p.activo?'Activo':'Anulado'}</b></span>${p.motivo_anulacion?`<small>Motivo: ${escapar(p.motivo_anulacion)}</small>`:''}</div><div class="staff-actions"><button data-edit-staff="${p.id_usuario}">Editar</button><button data-toggle-staff="${p.id_usuario}">${p.activo?'Anular':'Reactivar'}</button><button data-password-staff="${p.id_usuario}">Contraseña</button><button class="danger" data-delete-staff="${p.id_usuario}">Eliminar</button></div></article>`).join(''):'No hay personas que coincidan con el filtro.';
  lista.querySelectorAll('[data-edit-staff]').forEach(b=>b.onclick=()=>editarPersonal(b.dataset.editStaff));
  lista.querySelectorAll('[data-toggle-staff]').forEach(b=>b.onclick=()=>cambiarEstadoPersonal(b.dataset.toggleStaff));
  lista.querySelectorAll('[data-delete-staff]').forEach(b=>b.onclick=()=>eliminarPersonal(b.dataset.deleteStaff));
lista.querySelectorAll('[data-password-staff]').forEach(b=>b.onclick=()=>cambiarContrasenaPersonal(b.dataset.passwordStaff));
}
function contrasenaEmpleadoFuerte(contrasena){
  return contrasena.length>=10&&/[a-z]/.test(contrasena)&&/[A-Z]/.test(contrasena)&&/\d/.test(contrasena)&&/[@$!%*#?&.]/.test(contrasena);
}
$('#newStaffPassword').addEventListener('input',event=>{
  const password=event.currentTarget.value;
  const cumple=contrasenaEmpleadoFuerte(password);
  const estado=$('#staffPasswordStrength');
  estado.textContent=cumple?'Contraseña segura: cumple todos los requisitos.':'Debe tener al menos 10 caracteres, mayúscula, minúscula, número y un símbolo permitido.';
  estado.classList.toggle('is-valid',cumple);
  estado.classList.toggle('is-invalid',Boolean(password)&&!cumple);
});
function editarPersonal(id){const p=personalRegistrado.find(x=>x.id_usuario===id);if(!p)return;$('#staffUserId').value=p.id_usuario;$('#newStaffNames').value=p.nombres;$('#newStaffLastNames').value=p.apellidos;$('#newStaffEmail').value=p.correo;$('#newStaffEmail').readOnly=true;$('#newStaffPassword').required=false;$('#newStaffPasswordLabel').classList.add('hidden');$('#staffPasswordFeedback').classList.add('hidden');$('#adminStaffHeading').textContent=`Editar: ${p.nombres} ${p.apellidos}`;$('#staffSubmit').textContent='Guardar cambios';$('#staffCancelEdit').classList.remove('hidden');}
function limpiarFormularioPersonal(){const f=$('#adminStaffForm');f.reset();$('#staffPasswordStrength').textContent='Aún no cumple los requisitos.';$('#staffPasswordStrength').classList.remove('is-valid','is-invalid');$('#staffUserId').value='';$('#newStaffEmail').readOnly=false;$('#newStaffPassword').required=true;$('#newStaffPasswordLabel').classList.remove('hidden');$('#staffPasswordFeedback').classList.remove('hidden');$('#adminStaffHeading').textContent='Registrar empleado';$('#staffSubmit').textContent='Registrar empleado';$('#staffCancelEdit').classList.add('hidden');}
async function cambiarEstadoPersonal(id){const p=personalRegistrado.find(x=>x.id_usuario===id);if(!p)return;let motivo=null;if(p.activo){motivo=window.prompt('Motivo de la anulación (obligatorio):');if(!motivo?.trim())return;}try{await llamarGestionPersonal('cambiar_estado',{id_usuario:id,activo:!p.activo,motivo_anulacion:motivo?.trim()||null});informar(p.activo?'Personal anulado.':'Personal reactivado.');cargarPersonal();}catch(error){informar(error.message);}}
async function eliminarPersonal(id){const p=personalRegistrado.find(x=>x.id_usuario===id);if(!p||!window.confirm(`¿Eliminar definitivamente a ${p.nombres} ${p.apellidos}? Esta acción no se puede deshacer.`))return;try{await llamarGestionPersonal('eliminar',{id_usuario:id});informar('Personal eliminado.');cargarPersonal();}catch(error){informar(error.message);}}
async function cambiarContrasenaPersonal(id){const p=personalRegistrado.find(x=>x.id_usuario===id);if(!p)return;document.querySelector('#staffPasswordUserId').value=id;document.querySelector('#staffPasswordTitle').textContent=`Cambiar contraseña: ${p.nombres} ${p.apellidos}`;document.querySelector('#staffPasswordDescription').textContent='La contraseña debe tener al menos 10 caracteres, con mayúscula, minúscula, número y símbolo.';document.querySelector('#staffPasswordNew').value='';document.querySelector('#staffPasswordConfirm').value='';document.querySelector('#staffPasswordStatus').textContent='';const d=document.querySelector('#staffPasswordDialog');if(d)d.showModal();}
document.querySelector('#staffPasswordForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=document.querySelector('#staffPasswordUserId').value;const nueva=document.querySelector('#staffPasswordNew').value;const confirmar=document.querySelector('#staffPasswordConfirm').value;const status=document.querySelector('#staffPasswordStatus');const p=personalRegistrado.find(x=>x.id_usuario===id);if(nueva.length<10){status.textContent='La contraseña debe tener al menos 10 caracteres.';return;}if(!contrasenaEmpleadoFuerte(nueva)){status.textContent='Debe incluir mayúscula, minúscula, número y símbolo.';return;}if(nueva!==confirmar){status.textContent='Las contraseñas no coinciden.';return;}status.textContent='Guardando…';try{await llamarGestionPersonal('cambiar_contrasena',{id_usuario:id,contrasena:nueva});status.textContent=`Contraseña actualizada para ${p?.nombres||''} ${p?.apellidos||''}.`;setTimeout(()=>{document.querySelector('#staffPasswordDialog')?.close();},1200);}catch(error){status.textContent=error.message;}});

$('#adminProductForm').onsubmit=async event=>{event.preventDefault();const valor=id=>$('#'+id).value.trim();const {error}=await supabaseClient.rpc('guardar_producto_personal',{p_id:valor('adminProductId')?Number(valor('adminProductId')):null,p_codigo:valor('adminProductCode'),p_nombre:valor('adminProductName'),p_categoria:valor('adminProductCategory'),p_marca:valor('adminProductBrand')||null,p_precio:Number(valor('adminProductPrice')),p_existencias:Number(valor('adminProductStock')),p_url_imagen:valor('adminProductImage')||null,p_descripcion:null,p_fecha_vencimiento:valor('adminProductExpiry')||null});if(error)return informar(error.message);informar('Producto guardado.');event.target.reset();$('#adminProductId').value='';$('#adminProductHeading').textContent='Nuevo producto';mostrarVistaPrevia('#adminProductPreview','#adminProductPreviewEmpty');cargarCatalogo();};
$('#adminProviderForm').onsubmit=async event=>{event.preventDefault();const valor=id=>$('#'+id).value.trim();const {error}=await supabaseClient.rpc('guardar_proveedor_personal',{p_id:null,p_razon_social:valor('providerName'),p_documento:valor('providerDocument')||null,p_contacto_nombre:null,p_correo:valor('providerEmail')||null,p_telefono:valor('providerPhone')||null,p_direccion:null,p_notas:null});if(error)return informar(error.message);informar('Proveedor guardado.');event.target.reset();cargarOpciones();};
$('#adminLotForm').onsubmit=async event=>{event.preventDefault();const valor=id=>$('#'+id).value.trim(),estado=valor('lotStatus');const {error}=await supabaseClient.rpc('registrar_lote_personal',{p_id_producto:Number(valor('lotProduct')),p_id_proveedor:valor('lotProvider')?Number(valor('lotProvider')):null,p_codigo_lote:valor('lotCode'),p_cantidad:Number(valor('lotQuantity')),p_costo_unitario:valor('lotCost')?Number(valor('lotCost')):null,p_fecha_vencimiento:valor('lotExpiry')||null,p_estado:estado,p_motivo_danio:estado==='daniado'?valor('lotNote'):null,p_observacion:estado!=='daniado'?valor('lotNote'):null});if(error)return informar(error.message);informar('Lote registrado.');event.target.reset();cargarReportes();};
$('#adminOfferForm').onsubmit=async event=>{event.preventDefault();const valor=id=>$('#'+id).value.trim(),superOferta=$('#offerSuperSale').checked,liquidacion=$('#offerClearance').checked;const {data,error}=await supabaseClient.rpc('guardar_oferta_personal',{p_id_producto:Number(valor('offerProduct')),p_nombre:valor('offerName'),p_precio_oferta:Number(valor('offerPrice')),p_inicia_en:new Date(valor('offerStart')).toISOString(),p_termina_en:valor('offerEnd')?new Date(valor('offerEnd')).toISOString():null});if(error)return informar(error.message);if(superOferta||liquidacion){const {error:errorMarca}=await supabaseClient.rpc('marcar_oferta_especial_jefe',{p_id_oferta:Number(data),p_super_oferta:superOferta,p_liquidacion_stock:liquidacion});if(errorMarca){informar(`Oferta guardada, pero no se pudo activar el aviso: ${errorMarca.message}`);event.target.reset();cargarOfertas();return;}}informar('Oferta guardada.');event.target.reset();cargarOfertas();};
$('#adminStaffForm').onsubmit=async event=>{event.preventDefault();const id=$('#staffUserId').value;if(!id&&!contrasenaEmpleadoFuerte($('#newStaffPassword').value)){informar('La contraseña inicial debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un símbolo (@$!%*#?&.).');$('#newStaffPassword').focus();return;}const datos={nombres:$('#newStaffNames').value.trim(),apellidos:$('#newStaffLastNames').value.trim(),correo:$('#newStaffEmail').value.trim().toLowerCase()};try{const data=await llamarGestionPersonal(id?'actualizar':'registrar_empleado',id?{...datos,id_usuario:id}:{...datos,contrasena:$('#newStaffPassword').value});informar(id?'Datos del personal actualizados.':`Empleado registrado: ${data.correo}. Entrégale su contraseña inicial de forma privada.`);limpiarFormularioPersonal();cargarPersonal();}catch(error){informar(error.message);}};
$('#adminRefreshReports').onclick=cargarReportes;$('#adminRefreshCatalog').onclick=cargarCatalogo;$('#adminRefreshMovements').onclick=cargarMovimientos;$('#adminRefreshStaff').onclick=cargarPersonal;$('#staffCancelEdit').onclick=limpiarFormularioPersonal;
$('#adminProductImage').addEventListener('input',event=>mostrarVistaPrevia('#adminProductPreview','#adminProductPreviewEmpty',event.target.value.trim()));
$('#offerProduct').addEventListener('change',event=>mostrarVistaPrevia('#offerProductPreview','#offerProductPreviewEmpty',imagenProducto(event.target.value)));
$('#productSearch').addEventListener('input',renderizarCatalogo);$('#productCategoryFilter').addEventListener('change',renderizarCatalogo);
$('#inventorySearch').addEventListener('input',renderizarInventario);$('#inventoryStatusFilter').addEventListener('change',renderizarInventario);
$('#offerSearch').addEventListener('input',renderizarOfertas);$('#offerStatusFilter').addEventListener('change',renderizarOfertas);
$('#staffSearch').addEventListener('input',renderizarPersonal);$('#staffStatusFilter').addEventListener('change',renderizarPersonal);
const parametrosRecuperacion=new URLSearchParams(window.location.search);
const errorRecuperacion=parametrosRecuperacion.get('error_code');
const esEnlaceRecuperacion=/[?&]code=|type=recovery/.test(`${window.location.search}${window.location.hash}`);
if(errorRecuperacion){
  try{localStorage.removeItem('bbAdminPasswordRecoveryRequestedAt');}catch{}
  const mensaje=errorRecuperacion==='otp_expired'
    ? 'El enlace venció o ya fue utilizado. Solicita otro y abre únicamente el correo más reciente.'
    : 'No se pudo validar el enlace. Solicita uno nuevo para cambiar la contraseña.';
  window.history.replaceState({},document.title,window.location.pathname);
  mostrarAcceso(mensaje);
}else if(!esEnlaceRecuperacion){
  validarSesion();
}
async function cargarPedidosAdmin(){
  const lista=$('#adminOrdersList'); if(!lista) return; lista.textContent='Cargando pedidos…';
  const {data,error}=await supabaseClient.rpc('bb_admin_listar_pedidos');
  if(error||!data?.ok){lista.textContent=error?.message||data?.error||'No se pudieron cargar los pedidos.';return;}
  const pedidos=data.pedidos||[];
  window.pedidosData=pedidos;
  const filtroEstado=$('#orderStatusFilter')?.value||'';
  const busqueda=($('#orderSearch')?.value||'').toLowerCase();
  const filtrados=pedidos.filter(p=>{
    if(filtroEstado&&p.estado!==filtroEstado) return false;
    if(busqueda&&!p.numero.toLowerCase().includes(busqueda)&&!String(p.correo_cliente||'').toLowerCase().includes(busqueda)) return false;
    return true;
  });
  if(!filtrados.length){lista.innerHTML='<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">Sin pedidos</td></tr>';return;}
  lista.innerHTML=filtrados.map(p=>`<tr>
    <td><strong>${escapar(p.numero)}</strong><br><small>${new Date(p.creado_en).toLocaleString('es-PE')}</small></td>
    <td>${escapar(p.correo_cliente)}</td>
    <td>S/ ${Number(p.total).toFixed(2)}</td>
    <td><select class="admin-status-select" data-id="${p.id}" onchange="cambiarEstadoRapido(this)">
      <option value="pendiente" ${p.estado==='pendiente'?'selected':''}>Pendiente</option>
      <option value="confirmado" ${p.estado==='confirmado'?'selected':''}>Confirmado</option>
      <option value="preparando" ${p.estado==='preparando'?'selected':''}>Preparando</option>
      <option value="enviado" ${p.estado==='enviado'?'selected':''}>Enviado</option>
      <option value="entregado" ${p.estado==='entregado'?'selected':''}>Entregado</option>
      <option value="cancelado" ${p.estado==='cancelado'?'selected':''}>Cancelado</option>
    </select></td>
    <td>${p.estado_pago}</td>
    <td>${p.tracking_number?`${escapar(p.carrier||'')} ${escapar(p.tracking_number)}`:'—'}</td>
    <td class="actions">
      <button class="btn secondary" onclick="abrirEditorPedido('${p.id}','${escapar(p.numero)}','${p.estado}','${escapar(p.tracking_number||'')}','${escapar(p.carrier||'')}','${escapar(p.tracking_url||'')}')">Editar</button>
      <button class="btn secondary" onclick="verLogsPedido('${p.id}','${escapar(p.numero)}')">Historial</button>
    </td>
  </tr>`).join('');
}
async function abrirEditorPedido(id,numero,estadoActual,tracking,carrier,url){
  document.querySelector('#orderStatusId').value=id;
  document.querySelector('#orderStatusTitle').textContent='Editar pedido: '+numero;
  document.querySelector('#orderStatusDescription').textContent='Cambia el estado y agrega datos de seguimiento.';
  document.querySelector('#orderStatusSelect').value=estadoActual||'pendiente';
  document.querySelector('#orderTrackingNumber').value=tracking||'';
  document.querySelector('#orderCarrier').value=carrier||'';
  document.querySelector('#orderTrackingUrl').value=url||'';
  document.querySelector('#orderStatusMotivo').value='';
  document.querySelector('#orderStatusFormStatus').textContent='';
  const d=document.querySelector('#orderStatusDialog'); if(d) d.showModal();
}
async function cambiarEstadoRapido(select){
  const id=select.dataset.id;
  const numero=select.dataset.numero;
  const nuevoEstado=select.value;
  const {data,error}=await supabaseClient.rpc('bb_admin_cambiar_estado_pedido',{p_pedido_id:id,p_nuevo_estado:nuevoEstado});
  if(error||!data?.ok){
    alert(error?.message||data?.error||'Error al cambiar estado');
    cargarPedidosAdmin();
    return;
  }
  // Si es "enviado", abrir editor para agregar tracking
  if(nuevoEstado==='enviado'){
    abrirEditorPedido(id,numero,nuevoEstado,'','','');
  } else {
    cargarPedidosAdmin();
  }
}
async function verLogsPedido(id,numero){
  const {data,error}=await supabaseClient.rpc('bb_admin_listar_logs_pedido',{p_pedido_id:id});
  if(error||!data?.ok){alert(error?.message||data?.error||'Error');return;}
  const logs=data.logs||[];
  if(!logs.length){document.querySelector('#orderLogsBody').textContent='Sin historial de cambios.';}
  else{
    document.querySelector('#orderLogsBody').innerHTML=logs.map(l=>`<div style="padding:8px 0;border-bottom:1px solid #eee"><strong>${l.estado_anterior} â†’ ${l.estado_nuevo}</strong><br><small>${new Date(l.creado_en).toLocaleString('es-PE')}</small>${l.motivo?`<br><em>${l.motivo}</em>`:''}${l.tracking_number?`<br>Tracking: ${l.carrier||''} ${l.tracking_number}`:''}</div>`).join('');
  }
  document.querySelector('#orderLogsTitle').textContent='Historial: '+numero;
  const d=document.querySelector('#orderLogsDialog'); if(d) d.showModal();
}
document.querySelector('#orderStatusForm')?.addEventListener('submit',async function(e){
  e.preventDefault();
  const id=document.querySelector('#orderStatusId').value;
  const estado=document.querySelector('#orderStatusSelect').value;
  const tracking=document.querySelector('#orderTrackingNumber').value.trim()||null;
  const carrier=document.querySelector('#orderCarrier').value.trim()||null;
  const url=document.querySelector('#orderTrackingUrl').value.trim()||null;
  const motivo=document.querySelector('#orderStatusMotivo').value.trim()||null;
  const status=document.querySelector('#orderStatusFormStatus');
  status.textContent='Guardando...';
  const {data,error}=await supabaseClient.rpc('bb_admin_cambiar_estado_pedido',{p_pedido_id:id,p_nuevo_estado:estado,p_tracking_number:tracking,p_carrier:carrier,p_tracking_url:url,p_motivo:motivo});
  if(error||!data?.ok){status.textContent=error?.message||data?.error||'Error al cambiar estado';return;}
  if(data.sin_cambios){status.textContent='Sin cambios';setTimeout(()=>document.querySelector('#orderStatusDialog')?.close(),800);return;}
  status.textContent=`Estado cambiado: ${data.estado_anterior} â†’ ${data.estado_nuevo}`;
  setTimeout(()=>{document.querySelector('#orderStatusDialog')?.close();cargarPedidosAdmin();},1000);
});
document.querySelector('#orderStatusCancel')?.addEventListener('click',()=>document.querySelector('#orderStatusDialog')?.close());
document.querySelector('#orderStatusCancel2')?.addEventListener('click',()=>document.querySelector('#orderStatusDialog')?.close());
document.querySelector('#orderLogsCancel')?.addEventListener('click',()=>document.querySelector('#orderLogsDialog')?.close());
document.querySelector('#orderLogsOk')?.addEventListener('click',()=>document.querySelector('#orderLogsDialog')?.close());

$('#refreshOrders')?.addEventListener('click',cargarPedidosAdmin);
$('#orderStatusFilter')?.addEventListener('change',cargarPedidosAdmin);
$('#orderSearch')?.addEventListener('input',cargarPedidosAdmin);

$('#adminChangePassword')?.addEventListener('click',function(){
  const d=document.querySelector('#adminChangePasswordDialog');
  if(d) d.showModal();
  document.querySelector('#adminPasswordReauthField').hidden=true;
  document.querySelector('#adminPasswordReauthCode').value='';
  const s=document.querySelector('#adminChangePasswordStatus'); if(s) s.textContent='';
});
function cerrarDialogoCambioContrasena(){const d=document.querySelector('#adminChangePasswordDialog'); if(d) d.close();}
document.querySelector('#adminChangePasswordCancel')?.addEventListener('click',cerrarDialogoCambioContrasena);
document.querySelector('#adminChangePasswordCancel2')?.addEventListener('click',cerrarDialogoCambioContrasena);
document.querySelector('#adminChangePasswordForm')?.addEventListener('submit',async function(e){
  e.preventDefault();
  const status=document.querySelector('#adminChangePasswordStatus');
  const nueva=document.querySelector('#adminNewPasswordValue').value;
  const confirmar=document.querySelector('#adminConfirmPasswordValue').value;
  const codigo=document.querySelector('#adminPasswordReauthCode').value.trim();
  const campoCodigo=document.querySelector('#adminPasswordReauthField');
  if(nueva.length<10){status.textContent='La contraseña debe tener al menos 10 caracteres.';return;}
  if(nueva!==confirmar){status.textContent='Las contraseñas no coinciden.';return;}
  if(!campoCodigo.hidden&&!codigo){status.textContent='Escribe el código que enviamos a tu correo.';return;}
  status.textContent='Guardando...';
  let r=await supabaseClient.auth.updateUser(codigo?{password:nueva,nonce:codigo}:{password:nueva});
  if(r.error?.code==='reauthentication_needed'&&!codigo){
    const reautenticacion=await supabaseClient.auth.reauthenticate();
    if(reautenticacion.error){status.textContent='No se pudo verificar tu sesión: '+reautenticacion.error.message;return;}
    campoCodigo.hidden=false;
    document.querySelector('#adminPasswordReauthCode').focus();
    status.textContent='Te enviamos un código de seguridad. Escríbelo para confirmar el cambio.';
    return;
  }
  if(r.error){status.textContent='No se pudo cambiar: '+r.error.message;return;}
  status.textContent='Contraseña actualizada correctamente.';
  setTimeout(function(){cerrarDialogoCambioContrasena();document.querySelector('#adminNewPasswordValue').value='';document.querySelector('#adminConfirmPasswordValue').value='';document.querySelector('#adminPasswordReauthCode').value='';campoCodigo.hidden=true;},1200);
});

async function exportarPedidos() {
  if (typeof XLSX === 'undefined') { alert('No se pudo cargar el modulo de exportacion Excel.'); return; }
  const pedidos = window.pedidosData || [];
  if (!pedidos.length) { alert('No hay pedidos para exportar. Actualiza la lista primero.'); return; }
  const filtroEstado = (document.querySelector('#orderStatusFilter') && document.querySelector('#orderStatusFilter').value) || '';
  const busqueda = ((document.querySelector('#orderSearch') && document.querySelector('#orderSearch').value) || '').trim().toLowerCase();
  const filtrados = pedidos.filter(function(p) {
    if (filtroEstado && p.estado !== filtroEstado) return false;
    if (busqueda && !p.numero.toLowerCase().includes(busqueda) && !String(p.correo_cliente||'').toLowerCase().includes(busqueda)) return false;
    return true;
  });
  if (!filtrados.length) { alert('No hay datos para exportar con los filtros actuales.'); return; }

  const hoy = new Date().toISOString().slice(0,10);
  const libro = XLSX.utils.book_new();
  const encabezados = ['N Pedido','Cliente','Correo','Total (S/)','Estado','Estado de pago','Metodo de pago','Tracking','Transportista','Fecha creacion','Fecha actualizacion'];
  const matriz = [
    ['BYTE BAY - Reporte de pedidos'],
    ['Periodo: todos - Filtro estado: ' + (filtroEstado || 'todos') + ' - Busqueda: ' + (busqueda || 'ninguna')],
    ['Generado: ' + new Date().toLocaleString('es-PE') + ' - Byte Bay'],
    [],
    encabezados
  ];
  filtrados.forEach(function(p) {
    matriz.push([
      p.numero,
      p.correo_cliente,
      p.correo_cliente,
      Number(p.total),
      (p.estado||'').toUpperCase(),
      (p.estado_pago||'').toUpperCase(),
      p.metodo_pago,
      p.tracking_number || '---',
      p.carrier || '---',
      new Date(p.creado_en).toLocaleString('es-PE'),
      new Date(p.actualizado_en).toLocaleString('es-PE')
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(matriz);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: encabezados.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: encabezados.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: encabezados.length - 1 } }
  ];
  ws['!cols'] = [
    { wch: 20 }, { wch: 28 }, { wch: 30 }, { wch: 12 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 22 }, { wch: 22 }
  ];
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 4, c: 0 }, e: { r: 4 + filtrados.length, c: encabezados.length - 1 } })
  };

  for (let fila = 5; fila < 5 + filtrados.length; fila++) {
    const celda = XLSX.utils.encode_cell({ r: fila, c: 3 });
    if (ws[celda] && typeof ws[celda].v === 'number') ws[celda].z = '"S/ "#,##0.00';
  }

  XLSX.utils.book_append_sheet(libro, ws, 'Pedidos');

  const estados = {};
  filtrados.forEach(function(p) { estados[p.estado] = (estados[p.estado] || 0) + 1; });
  const totalMonto = filtrados.reduce(function(s, p) { return s + Number(p.total); }, 0);
  const wsResumen = XLSX.utils.aoa_to_sheet([
    ['BYTE BAY - Resumen de pedidos'],
    ['Generado: ' + new Date().toLocaleString('es-PE')],
    [],
    ['Indicador', 'Valor'],
    ['Total de pedidos', filtrados.length],
    ['Monto total', totalMonto],
    ...Object.entries(estados).map(function(e) { return ['Pedidos ' + e[0], e[1]]; }),
    ['Pedidos con tracking', filtrados.filter(function(p) { return p.tracking_number; }).length],
    ['Pedidos cancelados', filtrados.filter(function(p) { return p.estado === 'cancelado'; }).length]
  ]);
  wsResumen['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }
  ];
  wsResumen['!cols'] = [{ wch: 32 }, { wch: 16 }];
  const celdaMonto = XLSX.utils.encode_cell({ r: 5, c: 1 });
  if (wsResumen[celdaMonto]) wsResumen[celdaMonto].z = '"S/ "#,##0.00';
  XLSX.utils.book_append_sheet(libro, wsResumen, 'Resumen');

  XLSX.writeFile(libro, 'pedidos-byte-bay-' + hoy + '.xlsx');
  alert('Archivo pedidos-byte-bay-' + hoy + '.xlsx generado correctamente.');
}
document.querySelector('#exportOrders')?.addEventListener('click', exportarPedidos);