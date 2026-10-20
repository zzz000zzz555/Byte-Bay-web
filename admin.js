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
  mostrarSeccion('resumen');
}
function mostrarAcceso(mensaje=''){$('#adminLogin').classList.remove('hidden');$('#adminApp').classList.add('hidden');$('#adminLoginStatus').textContent=mensaje;}
function mostrarSeccion(seccion){
  document.querySelectorAll('[data-admin-section]').forEach(elemento=>elemento.classList.toggle('hidden',elemento.dataset.adminSection!==seccion));
  document.querySelectorAll('[data-admin-tab]').forEach(boton=>boton.classList.toggle('active',boton.dataset.adminTab===seccion));
  if(seccion==='resumen') cargarReportes();
  if(seccion==='productos') cargarCatalogo();
  if(seccion==='inventario'||seccion==='ofertas') cargarOpciones();
  if(seccion==='ofertas') cargarOfertas();
  if(seccion==='movimientos') cargarMovimientos();
  if(seccion==='personal'&&rolPersonal==='jefe') cargarPersonal();
}

$('#adminLoginForm').onsubmit=async event=>{
  event.preventDefault();$('#adminLoginStatus').textContent='Validando credenciales…';
  const {error}=await supabaseClient.auth.signInWithPassword({email:$('#adminEmail').value.trim(),password:$('#adminPassword').value});
  if(error){$('#adminLoginStatus').textContent='Correo o contraseña incorrectos.';return;}
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
async function cargarOfertas(){const lista=$('#adminOffersList');lista.textContent='Cargando ofertas…';await cargarOpciones();const {data,error}=await supabaseClient.rpc('listar_ofertas_personal');if(error){lista.textContent='Ejecuta primero el SQL de pruebas: '+error.message;return;}ofertasRegistradas=data||[];renderizarOfertas();}
function renderizarOfertas(){const texto=$('#offerSearch').value.trim().toLowerCase(),estado=$('#offerStatusFilter').value;const datos=ofertasRegistradas.filter(o=>(!estado||(estado==='activa')===o.activa)&&(!texto||`${o.producto} ${o.nombre}`.toLowerCase().includes(texto)));$('#adminOffersList').innerHTML=datos.length?datos.map(o=>`<article class="admin-list-item"><img src="${escapar(imagenProducto(o.id_producto,o.producto))}" alt="${escapar(o.producto)}"><div><strong>${escapar(o.producto)}</strong><span>${escapar(o.nombre)} · S/ ${Number(o.precio_oferta).toFixed(2)} · ${o.activa?'Activa':'Inactiva'}</span></div></article>`).join(''):'No hay ofertas que coincidan con el filtro.';}
async function cargarMovimientos(){const lista=$('#adminMovementsList');lista.textContent='Cargando movimientos…';await cargarOpciones();const {data,error}=await supabaseClient.rpc('listar_movimientos_inventario_personal');if(error){lista.textContent='Ejecuta primero el SQL de pruebas: '+error.message;return;}movimientosRegistrados=data||[];renderizarMovimientos();}
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
  lista.innerHTML=datos.length?datos.map(p=>`<article class="admin-list-item staff-item"><div><strong>${escapar(`${p.nombres} ${p.apellidos}`)}</strong><span>${escapar(p.correo)} · ${escapar(p.rol)} · <b class="staff-status ${p.activo?'is-active':'is-inactive'}">${p.activo?'Activo':'Anulado'}</b></span>${p.motivo_anulacion?`<small>Motivo: ${escapar(p.motivo_anulacion)}</small>`:''}</div><div class="staff-actions"><button data-edit-staff="${p.id_usuario}">Editar</button><button data-toggle-staff="${p.id_usuario}">${p.activo?'Anular':'Reactivar'}</button><button class="danger" data-delete-staff="${p.id_usuario}">Eliminar</button></div></article>`).join(''):'No hay personas que coincidan con el filtro.';
  lista.querySelectorAll('[data-edit-staff]').forEach(b=>b.onclick=()=>editarPersonal(b.dataset.editStaff));
  lista.querySelectorAll('[data-toggle-staff]').forEach(b=>b.onclick=()=>cambiarEstadoPersonal(b.dataset.toggleStaff));
  lista.querySelectorAll('[data-delete-staff]').forEach(b=>b.onclick=()=>eliminarPersonal(b.dataset.deleteStaff));
}
function editarPersonal(id){const p=personalRegistrado.find(x=>x.id_usuario===id);if(!p)return;$('#staffUserId').value=p.id_usuario;$('#newStaffNames').value=p.nombres;$('#newStaffLastNames').value=p.apellidos;$('#newStaffEmail').value=p.correo;$('#newStaffEmail').readOnly=true;$('#newStaffPassword').required=false;$('#newStaffPasswordLabel').classList.add('hidden');$('#adminStaffHeading').textContent=`Editar: ${p.nombres} ${p.apellidos}`;$('#staffSubmit').textContent='Guardar cambios';$('#staffCancelEdit').classList.remove('hidden');}
function limpiarFormularioPersonal(){const f=$('#adminStaffForm');f.reset();$('#staffUserId').value='';$('#newStaffEmail').readOnly=false;$('#newStaffPassword').required=true;$('#newStaffPasswordLabel').classList.remove('hidden');$('#adminStaffHeading').textContent='Registrar empleado';$('#staffSubmit').textContent='Registrar empleado';$('#staffCancelEdit').classList.add('hidden');}
async function cambiarEstadoPersonal(id){const p=personalRegistrado.find(x=>x.id_usuario===id);if(!p)return;let motivo=null;if(p.activo){motivo=window.prompt('Motivo de la anulación (obligatorio):');if(!motivo?.trim())return;}try{await llamarGestionPersonal('cambiar_estado',{id_usuario:id,activo:!p.activo,motivo_anulacion:motivo?.trim()||null});informar(p.activo?'Personal anulado.':'Personal reactivado.');cargarPersonal();}catch(error){informar(error.message);}}
async function eliminarPersonal(id){const p=personalRegistrado.find(x=>x.id_usuario===id);if(!p||!window.confirm(`¿Eliminar definitivamente a ${p.nombres} ${p.apellidos}? Esta acción no se puede deshacer.`))return;try{await llamarGestionPersonal('eliminar',{id_usuario:id});informar('Personal eliminado.');cargarPersonal();}catch(error){informar(error.message);}}

$('#adminProductForm').onsubmit=async event=>{event.preventDefault();const valor=id=>$('#'+id).value.trim();const {error}=await supabaseClient.rpc('guardar_producto_personal',{p_id:valor('adminProductId')?Number(valor('adminProductId')):null,p_codigo:valor('adminProductCode'),p_nombre:valor('adminProductName'),p_categoria:valor('adminProductCategory'),p_marca:valor('adminProductBrand')||null,p_precio:Number(valor('adminProductPrice')),p_existencias:Number(valor('adminProductStock')),p_url_imagen:valor('adminProductImage')||null,p_descripcion:null,p_fecha_vencimiento:valor('adminProductExpiry')||null});if(error)return informar(error.message);informar('Producto guardado.');event.target.reset();$('#adminProductId').value='';$('#adminProductHeading').textContent='Nuevo producto';mostrarVistaPrevia('#adminProductPreview','#adminProductPreviewEmpty');cargarCatalogo();};
$('#adminProviderForm').onsubmit=async event=>{event.preventDefault();const valor=id=>$('#'+id).value.trim();const {error}=await supabaseClient.rpc('guardar_proveedor_personal',{p_id:null,p_razon_social:valor('providerName'),p_documento:valor('providerDocument')||null,p_contacto_nombre:null,p_correo:valor('providerEmail')||null,p_telefono:valor('providerPhone')||null,p_direccion:null,p_notas:null});if(error)return informar(error.message);informar('Proveedor guardado.');event.target.reset();cargarOpciones();};
$('#adminLotForm').onsubmit=async event=>{event.preventDefault();const valor=id=>$('#'+id).value.trim(),estado=valor('lotStatus');const {error}=await supabaseClient.rpc('registrar_lote_personal',{p_id_producto:Number(valor('lotProduct')),p_id_proveedor:valor('lotProvider')?Number(valor('lotProvider')):null,p_codigo_lote:valor('lotCode'),p_cantidad:Number(valor('lotQuantity')),p_costo_unitario:valor('lotCost')?Number(valor('lotCost')):null,p_fecha_vencimiento:valor('lotExpiry')||null,p_estado:estado,p_motivo_danio:estado==='daniado'?valor('lotNote'):null,p_observacion:estado!=='daniado'?valor('lotNote'):null});if(error)return informar(error.message);informar('Lote registrado.');event.target.reset();cargarReportes();};
$('#adminOfferForm').onsubmit=async event=>{event.preventDefault();const valor=id=>$('#'+id).value.trim();const {error}=await supabaseClient.rpc('guardar_oferta_personal',{p_id_producto:Number(valor('offerProduct')),p_nombre:valor('offerName'),p_precio_oferta:Number(valor('offerPrice')),p_inicia_en:new Date(valor('offerStart')).toISOString(),p_termina_en:valor('offerEnd')?new Date(valor('offerEnd')).toISOString():null});if(error)return informar(error.message);informar('Oferta guardada.');event.target.reset();cargarOfertas();};
$('#adminStaffForm').onsubmit=async event=>{event.preventDefault();const id=$('#staffUserId').value;const datos={nombres:$('#newStaffNames').value.trim(),apellidos:$('#newStaffLastNames').value.trim(),correo:$('#newStaffEmail').value.trim().toLowerCase()};try{const data=await llamarGestionPersonal(id?'actualizar':'registrar_empleado',id?{...datos,id_usuario:id}:{...datos,contrasena:$('#newStaffPassword').value});informar(id?'Datos del personal actualizados.':`Empleado registrado: ${data.correo}. Entrégale su contraseña inicial de forma privada.`);limpiarFormularioPersonal();cargarPersonal();}catch(error){informar(error.message);}};
$('#adminRefreshReports').onclick=cargarReportes;$('#adminRefreshCatalog').onclick=cargarCatalogo;$('#adminRefreshMovements').onclick=cargarMovimientos;$('#adminRefreshStaff').onclick=cargarPersonal;$('#staffCancelEdit').onclick=limpiarFormularioPersonal;
$('#adminProductImage').addEventListener('input',event=>mostrarVistaPrevia('#adminProductPreview','#adminProductPreviewEmpty',event.target.value.trim()));
$('#offerProduct').addEventListener('change',event=>mostrarVistaPrevia('#offerProductPreview','#offerProductPreviewEmpty',imagenProducto(event.target.value)));
$('#productSearch').addEventListener('input',renderizarCatalogo);$('#productCategoryFilter').addEventListener('change',renderizarCatalogo);
$('#inventorySearch').addEventListener('input',renderizarInventario);$('#inventoryStatusFilter').addEventListener('change',renderizarInventario);
$('#offerSearch').addEventListener('input',renderizarOfertas);$('#offerStatusFilter').addEventListener('change',renderizarOfertas);
$('#movementSearch').addEventListener('input',renderizarMovimientos);$('#movementTypeFilter').addEventListener('change',renderizarMovimientos);
$('#staffSearch').addEventListener('input',renderizarPersonal);$('#staffStatusFilter').addEventListener('change',renderizarPersonal);
validarSesion();
