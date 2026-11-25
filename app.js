// Mantener la recuperación del personal en el panel, incluso si Auth redirige al sitio.
const parametrosAuth=new URLSearchParams(window.location.search);
const parametrosHashAuth=new URLSearchParams(window.location.hash.slice(1));
let solicitudRecuperacionAdminReciente=false;
try{
  const solicitadaEn=Number(localStorage.getItem('bbAdminPasswordRecoveryRequestedAt'));
  solicitudRecuperacionAdminReciente=solicitadaEn>0&&Date.now()-solicitadaEn<24*60*60*1000;
}catch{}
if(parametrosHashAuth.get('type')==='recovery'||parametrosAuth.get('type')==='recovery'||
  (solicitudRecuperacionAdminReciente&&(parametrosAuth.has('code')||parametrosAuth.has('error_code')))){
  const adminUrl=new URL('admin.html',window.location.href);
  adminUrl.search=window.location.search;
  adminUrl.hash=window.location.hash;
  window.location.replace(adminUrl.href);
}
const ICON_SUN='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>';
const ICON_MOON='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"></path></svg>';
const ICON_HEART_ON='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 21s-7-4.4-9.3-8.3C.9 9.5 2.5 5.5 6 5c2-.3 3.6.8 4.5 2 .9-1.2 2.5-2.3 4.5-2 3.5.5 5.1 4.5 3.3 7.7C19 16.6 12 21 12 21z"></path></svg>';
const ICON_HEART_OFF='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 21s-7-4.4-9.3-8.3C.9 9.5 2.5 5.5 6 5c2-.3 3.6.8 4.5 2 .9-1.2 2.5-2.3 4.5-2 3.5.5 5.1 4.5 3.3 7.7C19 16.6 12 21 12 21z"></path></svg>';
const categories=[
  {name:'Supermercado',count:'33 productos',icon:'<path d="M4 5h2l2 10h10l2-7H7"></path><circle cx="9" cy="19" r="1.4"></circle><circle cx="17" cy="19" r="1.4"></circle>'},
  {name:'Tecnología',count:'46 productos',icon:'<rect x="3" y="5" width="18" height="12" rx="2"></rect><path d="M8 21h8M12 17v4"></path>'},
  {name:'Electrohogar',count:'25 productos',icon:'<path d="M13 3 5 14h6l-1 7 8-11h-6z"></path>'},
  {name:'Hogar',count:'33 productos',icon:'<path d="m3 11 9-7 9 7"></path><path d="M5 10v10h14V10"></path><path d="M10 20v-6h4v6"></path>'},
  {name:'Moda',count:'41 productos',icon:'<path d="M9 4 4 7l2 5 3-1v9h6v-9l3 1 2-5-5-3a3 3 0 0 1-6 0z"></path>'},
  {name:'Belleza',count:'32 productos',icon:'<path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z"></path><path d="M10 14a2 2 0 0 0 2 2"></path>'},
  {name:'Deportes',count:'32 productos',icon:'<path d="M6 7v10M18 7v10M6 12h12"></path><rect x="3" y="7" width="3" height="10" rx="1"></rect><rect x="18" y="7" width="3" height="10" rx="1"></rect>'},
  {name:'Bebés',count:'20 productos',icon:'<path d="M9 3h6"></path><path d="M10 6h4v3h-4z"></path><path d="M8 9h8a4 4 0 0 1 4 4v5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5a4 4 0 0 1 4-4z"></path>'},
  {name:'Mascotas',count:'22 productos',icon:'<circle cx="8" cy="7" r="2"></circle><circle cx="16" cy="7" r="2"></circle><circle cx="5" cy="13" r="2"></circle><circle cx="19" cy="13" r="2"></circle><path d="M12 11c3 0 5 2.5 5 5a3 3 0 0 1-3 3 5 5 0 0 1-4 0 3 3 0 0 1-3-3c0-2.5 2-5 5-5z"></path>'},
  {name:'Juguetes',count:'20 productos',icon:'<rect x="4" y="9" width="7" height="7" rx="1"></rect><rect x="13" y="4" width="7" height="7" rx="1"></rect><path d="M13 13h7v7h-7z"></path>'},
  {name:'Ferretería',count:'20 productos',icon:'<path d="M14 6a4 4 0 0 0 5 5l-8 8a2.8 2.8 0 0 1-4-4z"></path><path d="m15 5 4 4"></path>'},
  {name:'Audio',count:'26 productos',icon:'<path d="M3 9v6h4l5 5V4L7 9H3z"></path><path d="M16 8a5 5 0 0 1 0 8"></path>'},
  {name:'Cocina',count:'29 productos',icon:'<path d="M6 3v6a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V3"></path><path d="M9 12v9"></path><path d="M18 3v18"></path>'},
  {name:'Cuidado',count:'23 productos',icon:'<path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z"></path><path d="M10 14a2 2 0 0 0 2 2"></path>'},
  {name:'Limpieza',count:'22 productos',icon:'<path d="M4 4h16v4H4z"></path><path d="M6 8v12h12V8"></path><path d="M10 12h4"></path>'},
];
const IMAGEN_PRODUCTO_RESPALDO='imagen-producto-predeterminada.svg';
const IMAGEN_CATEGORIA_RESPALDO='imagen-categoria-predeterminada.svg';
const IMAGEN_QR_RESPALDO='yape-qr-pendiente.svg';
const imagenSegura=(url,respaldo=IMAGEN_PRODUCTO_RESPALDO)=>{
  const valor=String(url||'').trim();
  if(!valor) return respaldo;
  const absoluta=/^https?:\/\/[^\s]+$/i;
  const datos=/^data:image\/(png|jpe?g|webp|gif|svg\+xml|avif);base64,[a-z0-9+/=\s]+$/i;
  const relativa=/^(?!\/\/)(?:\.{0,2}\/)?[a-z0-9._\-\/]+\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i;
  const permitida=absoluta.test(valor)||datos.test(valor)||relativa.test(valor);
  return permitida&&!/^(javascript|vbscript):/i.test(valor)?valor:respaldo;
};
const atributoRespaldo=archivo=>`onerror="this.onerror=null;this.src='${archivo}'"`;
// Lectura defensiva de localStorage: un valor corrupto nunca debe detener la tienda.
function leerJSON(clave,fallo){
  try{
    const crudo=localStorage.getItem(clave);
    return crudo==null?fallo:JSON.parse(crudo);
  }catch(error){
    console.warn('Estado local ilegible, se usa valor seguro:',clave);
    try{localStorage.removeItem(clave);}catch(e){}
    return fallo;
  }
}

document.addEventListener('error',evento=>{
  const imagen=evento.target;
  if(imagen.tagName!=='IMG'||imagen.dataset.respaldoAplicado) return;
  imagen.dataset.respaldoAplicado='true';
  if(imagen.classList.contains('yape-qr')) imagen.src=IMAGEN_QR_RESPALDO;
  else if(imagen.closest('.category-card')) imagen.src=IMAGEN_CATEGORIA_RESPALDO;
  else if(imagen.closest('.brand-logo')) imagen.src='byte-bay-logo.png';
  else imagen.src=IMAGEN_PRODUCTO_RESPALDO;
},true);

function actualizarTema(){
  const esNoche=document.documentElement.classList.contains('dark-mode');
  document.querySelectorAll('[data-theme-toggle]').forEach(boton=>{
    boton.setAttribute('aria-label',esNoche?'Activar modo claro':'Activar modo noche');
    boton.title=esNoche?'Cambiar a modo claro':'Cambiar a modo noche';
    boton.querySelector('span').innerHTML=esNoche?ICON_SUN:ICON_MOON;
  });
}
document.querySelectorAll('[data-theme-toggle]').forEach(boton=>boton.addEventListener('click',()=>{
  document.documentElement.classList.toggle('dark-mode');
  try{localStorage.setItem('beruTema',document.documentElement.classList.contains('dark-mode')?'noche':'claro')}catch(e){}
  actualizarTema();
}));
actualizarTema();

const productTemplates={
  Supermercado:[
    ['ALPURA','Leche deslactosada 1L','https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80'],
    ['COCA-COLA','Pack bebidas gaseosas 6 unid.','https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80'],
    ['NESTLE','Cereal integral familiar','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'],
    ['DEL VALLE','Jugo natural surtido','https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80']
  ],
  Tecnología:[
    ['SAMSUNG','Smart TV Crystal UHD 4K','https://images.unsplash.com/photo-1601944179066-29786cb9d32a?auto=format&fit=crop&w=600&q=80'],
    ['APPLE','AirPods Pro USB-C','https://images.unsplash.com/photo-1625758906995-5e8d8d8d7c95?auto=format&fit=crop&w=600&q=80'],
    ['LENOVO','Laptop IdeaPad Slim 3','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80'],
    ['XIAOMI','Smartphone Redmi Note','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80']
  ],
  Electrohogar:[
    ['NINJA','Freidora de aire doble canasta','https://images.unsplash.com/photo-1604908177225-47f5b1b2b5c0?auto=format&fit=crop&w=600&q=80'],
    ['OSTER','Licuadora vaso de vidrio','https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80'],
    ['PANASONIC','Microondas digital 20L','https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=600&q=80'],
    ['PHILIPS','Afeitadora recargable','https://images.unsplash.com/photo-1629198735666-21e8f6d9b8d1?auto=format&fit=crop&w=600&q=80']
  ],
  Hogar:[
    ['MICA','Silla ergonómica premium','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80'],
    ['HOME','Lámpara decorativa','https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'],
    ['TEX HOME','Juego de sábanas king','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=80'],
    ['DECOR','Espejo de pared moderno','https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80']
  ],
  Moda:[
    ['ADIDAS','Zapatillas urbanas','https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    ['NIKE','Polera deportiva dri-fit','https://images.unsplash.com/photo-1503342394124-4802c6f8a1e6?auto=format&fit=crop&w=600&q=80'],
    ['PUMA','Casaca ligera impermeable','https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=600&q=80'],
    ['LEVIS','Jean clásico slim fit','https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80']
  ],
  Belleza:[
    ['LOREAL','Kit de maquillaje profesional','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80'],
    ['REVLON','Secadora iónica','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80'],
    ['NIVEA','Set de cuidado facial','https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80'],
    ['GARNIER','Tratamiento capilar','https://images.unsplash.com/photo-1526947425960-945c6e7283f5?auto=format&fit=crop&w=600&q=80']
  ],
  Deportes:[
    ['SPALDING','Balón de basket oficial','https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=600&q=80'],
    ['NIKE','Mochila deportiva','https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    ['DECATHLON','Mancuernas ajustables','https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'],
    ['JOMA','Polo running transpirable','https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=600&q=80']
  ],
  Bebés:[
    ['FISHER-PRICE','Cubo de actividades','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=600&q=80'],
    ['CHICCO','Silla para bebé','https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=600&q=80'],
    ['AVENT','Biberón anticólicos','https://images.unsplash.com/photo-1512218168359-d607cdb1a5f1?auto=format&fit=crop&w=600&q=80'],
    ['INFANTI','Corral de juego plegable','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80']
  ],
  Mascotas:[
    ['PEDIGREE','Alimento para perros','https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80'],
    ['WHISKAS','Comida para gatos','https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80'],
    ['PETSAFE','Fuente de agua automática','https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=600&q=80'],
    ['TROPICAL','Arena absorbente premium','https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80']
  ],
  Juguetes:[
    ['LEGO','Set de construcción creativo','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80'],
    ['HASBRO','Juego de mesa familiar','https://images.unsplash.com/photo-1494696622107-2b31d4f5856e?auto=format&fit=crop&w=600&q=80'],
    ['BARBIE','Muñeca colección','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80'],
    ['HOT WHEELS','Pista de autos','https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=600&q=80']
  ],
  Ferretería:[
    ['BOSCH','Taladro inalámbrico 18V','https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80'],
    ['STANLEY','Juego de herramientas 65 piezas','https://images.unsplash.com/photo-1581147036324-c3f2d9b2f6aa?auto=format&fit=crop&w=600&q=80'],
    ['TRUPER','Caja de organización','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80'],
    ['DEWALT','Atornillador profesional','https://images.unsplash.com/photo-1581147036324-c3f2d9b2f6aa?auto=format&fit=crop&w=600&q=80']
  ],
  Audio:[
    ['JBL','Parlante Bluetooth portátil','https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80'],
    ['SONY','Audífonos inalámbricos','https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80'],
    ['BOSE','Barra de sonido compacta','https://images.unsplash.com/photo-1518441902117-f0db0f9a8f6e?auto=format&fit=crop&w=600&q=80'],
    ['EDIFIER','Parlante de escritorio','https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=600&q=80']
  ],
  Cocina:[
    ['TEFAL','Sartén antiadherente','https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=600&q=80'],
    ['KITCHENAID','Batidora de mano','https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80'],
    ['CUISINART','Juego de cuchillos','https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80'],
    ['MAGEFESA','Olla a presión','https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80']
  ],
  Limpieza:[
    ['LYSOL','Desinfectante multiuso','https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80'],
    ['SCOTCH-BRITE','Kit de esponjas','https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'],
    ['MR MUSCULO','Limpiador de superficies','https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80'],
    ['CLOROX','Blanqueador líquido','https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80']
  ],
  Cuidado:[
    ['DOVE','Shampoo reparador','https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80'],
    ['H&S','Set anticaspa','https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80'],
    ['NIVEA','Crema corporal hidratante','https://images.unsplash.com/photo-1580870069867-0742f0cdbfb8?auto=format&fit=crop&w=600&q=80'],
    ['GILLETTE','Desodorante corporal','https://images.unsplash.com/photo-1526947425960-945c6e7283f5?auto=format&fit=crop&w=600&q=80']
  ]
};

// El catálogo se carga exclusivamente desde Supabase.
let products=[];
const HERO_RESPALDO=[
  {title:'Explora el catálogo Byte Bay.',description:'Consulta productos, disponibilidad y precios antes de comprar.',image:'byte-bay-logo-transparent.png',badgeTop:'CATÁLOGO',badgeValue:'VER',badgeBottom:'productos',label:'BYTE BAY',cardTitle:'Explora el catálogo',cardText:'Consulta precios y disponibilidad'}
];
let heroSlides=[];
let heroSlideIndex=0;
function crearSlidesHero(){
  const disponibles=products.filter(producto=>producto.stock>0);
  const ordenados=[...disponibles.filter(producto=>Number(producto.discount)>0),...disponibles.filter(producto=>Number(producto.discount)<=0)];
  const seleccion=ordenados.length?ordenados.slice(0,5):HERO_RESPALDO;
  return seleccion.map(producto=>{
    if(!producto.id) return producto;
    const esOferta=Number(producto.discount)>0;
    return {id:producto.id,isOffer:esOferta,title:producto.name,description:`${producto.brand} · ${producto.category}.`,image:imagenSegura(producto.img),badgeTop:esOferta?'OFERTA':'CATÁLOGO',badgeValue:esOferta?`-${producto.discount}%`:'VER',badgeBottom:esOferta?'descuento':'producto',label:esOferta?'Oferta activa':'Producto disponible',cardTitle:money(producto.price),cardText:`${producto.stock} disponibles`};
  });
}
function mostrarSlideHero(index){
  if(!heroSlides.length) return;
  heroSlideIndex=(index+heroSlides.length)%heroSlides.length;
  const slide=heroSlides[heroSlideIndex],carrusel=document.querySelector('#heroCarousel');
  if(!carrusel) return;
  carrusel.classList.add('hero-changing');
  setTimeout(()=>{
    document.querySelector('#heroTitle').textContent=slide.title;
    document.querySelector('#heroDescription').textContent=slide.description;
    document.querySelector('#heroBadge').innerHTML=`<strong>${escapeHtml(slide.badgeTop)}</strong><b>${escapeHtml(slide.badgeValue)}</b><span>${escapeHtml(slide.badgeBottom)}</span>`;
    const imagen=document.querySelector('#heroImage');imagen.src=imagenSegura(slide.image);imagen.alt=slide.title;
    document.querySelector('#heroCardLabel').textContent=slide.label;
    document.querySelector('#heroCardTitle').textContent=slide.cardTitle;
    document.querySelector('#heroCardText').textContent=slide.cardText;
    // CTA principal estable: siempre lleva al catálogo. La navegación a un
    // producto destacado se hace con los puntos y flechas del carrusel.
    const accion=document.querySelector('#heroPrimaryAction');accion.textContent='Explorar catálogo';accion.onclick=null;
    document.querySelector('#heroDots').innerHTML=heroSlides.map((_,position)=>`<button type="button" class="hero-dot ${position===heroSlideIndex?'active':''}" data-hero-slide="${position}" aria-label="Mostrar destacado ${position+1}" aria-current="${position===heroSlideIndex}"></button>`).join('');
    document.querySelectorAll('[data-hero-slide]').forEach(boton=>boton.onclick=()=>mostrarSlideHero(Number(boton.dataset.heroSlide)));
    carrusel.classList.remove('hero-changing');
  },150);
}
function iniciarCarruselHero(){
  heroSlides=crearSlidesHero();heroSlideIndex=0;mostrarSlideHero(0);
}
document.querySelector('#heroPrevious').onclick=()=>mostrarSlideHero(heroSlideIndex-1);
document.querySelector('#heroNext').onclick=()=>mostrarSlideHero(heroSlideIndex+1);

const CART_STORAGE_KEY='bbCart';
function loadSavedCart(){
  try{
    const saved=leerJSON(CART_STORAGE_KEY,[]);
    if(!Array.isArray(saved)) return [];
    const vistos=new Set();
    return saved.filter(item=>{
      if(!(item&&typeof item==='object'&&
        Number.isInteger(Number(item.id))&&Number(item.id)>0&&
        Number.isInteger(Number(item.qty))&&Number(item.qty)>0&&Number(item.qty)<=99&&
        Number.isFinite(Number(item.price))&&Number(item.price)>=0)) return false;
      if(vistos.has(Number(item.id))) return false;
      vistos.add(Number(item.id));
      return true;
    }).map(item=>({
      id:Number(item.id),
      name:typeof item.name==='string'?item.name.slice(0,200):'Producto',
      price:Number(item.price),
      img:imagenSegura(item.img),
      brand:typeof item.brand==='string'?item.brand.slice(0,100):'BYTE BAY',
      category:typeof item.category==='string'?item.category.slice(0,100):'',
      qty:Number(item.qty)
    }));
  }catch(error){
    console.error('No se pudo restaurar el carrito guardado:',error);
    return [];
  }
}
let cart=loadSavedCart();
let start=0;
let discountRate=0;
let activeCoupon=null;
let shippingValue=0;
let activeCategory='all';
let activeBrand='all';
let activeGender='all';
let inStockOnly=false;
let activeQuery='';
let notificationSubscription=leerJSON('beruNotifications',null);
let activeFilter='all';
let soloOfertas=false;
let lastViewedProduct=null;
const favorites=new Set(leerJSON('beruFavorites',[]));
// La personalización y el consentimiento viven en site-privacy.js.
// El modo local solo procesa señales en este dispositivo cuando el usuario lo autoriza.
function puedePersonalizar(){return Boolean(window.BBPrivacy?.personalizacionActiva?.());}
function registrarProductoVisto(id){window.BBPrivacy?.registrarVista?.(Number(id));}
function ratingMarkup(value){
  const rating=Number(value);
  if(!Number.isFinite(rating)||rating<=0) return '<span class="rating-empty">Sin reseñas</span>';
  const visible=Math.min(5,rating);
  return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.2 2 4.2 4.6.5-3.4 3.2.9 4.6L8 11.5l-4.1 2.2.8-4.6L1.3 5.9l4.6-.5L8 1.2Z"></path></svg><span>${visible.toFixed(1)} / 5</span>`;
}
function tarjetaProducto(producto,motivo=''){
  const agotado=Number(producto.stock)<=0;
  const stock=Number(producto.stock)||0;
  const descuento=Number(producto.discount)||0;
  const id=Number(producto.id);
  const categoria=escapeHtml(producto.category||'');
  const nombre=escapeHtml(producto.name||'');
  const marca=escapeHtml(producto.brand||'');
  const calificacion=Number(producto.rating);
  const etiquetaCalificacion=Number.isFinite(calificacion)&&calificacion>0?`Calificación ${Math.min(5,calificacion).toFixed(1)} de 5`:'Sin reseñas';
  return `<article class="product-card ${agotado?'sold-out':''}" data-id="${id}" data-category="${categoria}">${descuento>0?`<span class="discount">-${descuento}%</span>`:''}<button class="wish ${favorites.has(id)?'active':''}" data-fav="${id}" aria-label="Guardar producto">${favorites.has(id)?ICON_HEART_ON:ICON_HEART_OFF}</button><div class="product-image"><img src="${escapeHtml(imagenSegura(producto.img))}" alt="${nombre}" loading="lazy" decoding="async" ${atributoRespaldo(IMAGEN_PRODUCTO_RESPALDO)}></div><span class="product-meta">${marca} · ${categoria}</span><h3>${nombre}</h3>${motivo?`<span class="product-reason">¿Por qué veo este producto? · ${escapeHtml(motivo)}</span>`:''}<div class="rating" aria-label="${etiquetaCalificacion}">${ratingMarkup(producto.rating)}</div>${descuento>0&&Number(producto.old)>Number(producto.price)?`<span class="old-price">${money(Number(producto.old)||0)}</span>`:''}<div class="price-row"><strong class="price">${money(Number(producto.price)||0)}</strong><button class="add" data-id="${id}" aria-label="Agregar al carrito" ${agotado?'disabled':''}>${agotado?'Agotado':'Agregar'}</button></div>${calcularPUM(producto)?`<div class="pum">${calcularPUM(producto)}</div>`:''}<div class="availability ${agotado?'unavailable':stock<=5?'low-stock':''}">${agotado?'Producto agotado':stock<=5?`Últimas ${stock} unidades`:'Disponible'}</div></article>`;
}
function renderizarPersonalizacion(){
  if(window.BBPrivacy?.renderizarRecomendaciones){window.BBPrivacy.renderizarRecomendaciones();return;}
  document.querySelector('#recentlyViewedSection')?.classList.add('hidden');
  document.querySelector('#recommendationsSection')?.classList.add('hidden');
}
function configurarConsentimientoPersonalizacion(){
  // site-privacy.js controla el banner, los modales y la auditoría del consentimiento.
  window.BBPrivacy?.inicializarBanner?.();
}

// Configuración pública de EmailJS. El Public Key y el Template ID se generan
// en tu cuenta de EmailJS; nunca se coloca aquí la contraseña de Gmail.
const EMAILJS_CONFIG={
  publicKey:'SggIN9waFSp_FVjr9',
  serviceId:'service_p99o3u5',
  templateId:'template_m32p81v',
  verificationTemplateId:'template_5spm32r'
};
const emailjsReady=()=>typeof window.emailjs?.send==='function' && !EMAILJS_CONFIG.publicKey.startsWith('PEGA_') && !EMAILJS_CONFIG.templateId.startsWith('PEGA_');
if(emailjsReady()) emailjs.init({publicKey:EMAILJS_CONFIG.publicKey});
const SUPABASE_URL='https://inwugycvtaaceugvtfpv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_5cTHcYI6byM03VSffW0OlQ_JlBB8D9u';
const supabaseReady=()=>typeof window.supabase?.createClient==='function';
const supabaseClient=supabaseReady()?window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY):null;


async function abrirPackModal(id){
  const {data:pack}=await supabaseClient.from('catalogo_packs').select('*').eq('id',id).maybeSingle();
  if(!pack) return;
  const {data:items}=await supabaseClient.from('pack_items').select('id_producto,cantidad').eq('id_pack',id);
  const itemDetails=await Promise.all((items||[]).map(async it=>{
    const {data:prod}=await supabaseClient.from('productos').select('id,nombre,url_imagen,precio').eq('id',it.id_producto).maybeSingle();
    return {nombre:prod?.nombre||'Producto', img:prod?.url_imagen, precio:prod?.precio, cantidad:it.cantidad};
  }));
  // render individual product images in modal gallery
  const gallery=document.querySelector('#modalMediaThumbs');
  if(gallery){
    gallery.style.display='flex';
    gallery.innerHTML=itemDetails.map(it=>`<button type="button" class="coolbox-thumb" title="${escapeHtml(it.nombre)}"><img src="${escapeHtml(imagenSegura(it.img||'imagen-producto-predeterminada.svg'))}" alt="Producto incluido: ${escapeHtml(it.nombre)}" loading="lazy" decoding="async"></button>`).join('');
  }
  lastViewedProduct={id:pack.id, name:pack.nombre, brand:'Byte Bay', category:'Pack', price:Number(pack.precio_especial), old:Number(pack.precio_especial), stock:Number(pack.stock), rating:0, description:pack.descripcion||'Pack combo de productos.', img: (itemDetails[0]?.img||'imagen-producto-predeterminada.svg'), gender:'Mixto', specs:{'Productos incluidos':itemDetails.length+' items','Stock de packs':pack.stock+' unidades'}, videoUrl:''};
  // open modal manually
  document.querySelector('#modalImage').src=imagenSegura(lastViewedProduct.img);
  document.querySelector('#modalBrand').textContent='Pack • Byte Bay';
  document.querySelector('#modalName').textContent=pack.nombre;
  document.querySelector('#modalRating').innerHTML=ratingMarkup(lastViewedProduct.rating);
  document.querySelector('#modalPrice').textContent=money(pack.precio_especial);
  document.querySelector('#modalOld').style.display='none';
  const descEl=document.querySelector('#modalDescription');
  descEl.innerHTML=`<p><strong>¿Qué es?</strong> ${escapeHtml(pack.descripcion||'Pack combo de productos.')}</p><p><strong>Productos incluidos:</strong></p><ul>${itemDetails.map(it=>`<li>${escapeHtml(it.nombre)} x${it.cantidad} - S/ ${Number(it.precio||0).toFixed(2)}</li>`).join('')}</ul>`;
  const specs=document.querySelector('#modalSpecs');
  if(specs) specs.innerHTML=`<div class="modal-specs"><strong>Detalles del pack</strong><dl><dt>Precio especial</dt><dd>S/ ${Number(pack.precio_especial).toFixed(2)}</dd><dt>Stock de packs</dt><dd>${pack.stock} unidades</dd><dt>Productos</dt><dd>${itemDetails.length} items</dd></dl></div>`;
  const avail=document.querySelector('#modalAvailability');
  avail.className='availability '+(pack.stock<=0?'unavailable':pack.stock<=5?'low-stock':'');
  avail.textContent=pack.stock<=0?'Agotado':pack.stock<=5?`Últimas ${pack.stock} unidades`:`Stock en vivo: ${pack.stock} packs`;
  const qty=document.querySelector('#modalQty'); if(qty) qty.value='1';
  document.querySelector('#modalAddToCart').disabled=pack.stock<=0;
  document.querySelector('#modalAddToCart').textContent=pack.stock<=0?'Agotado':'Agregar pack al carrito';
  document.querySelector('#modalAddToCart').onclick=()=>{ for(const it of itemDetails){ const prod=products.find(x=>x.id===it.id); if(prod) addToCart(prod.id, it.cantidad); } closeProductModal(); };
  document.querySelector('#productModal').classList.add('open');
  document.querySelector('#productModal').setAttribute('aria-hidden','false');
}

async function cargarPacksTienda(){
  const grid=document.querySelector('#packsGrid');
  if(!grid||!supabaseClient) return;
  const {data,error}=await supabaseClient.from('catalogo_packs').select('*');
  if(error||!data?.length){grid.innerHTML='';document.querySelector('#packs')?.classList.add('hidden');return;}
  // fetch first item image per pack
  const packsWithImg=await Promise.all(data.map(async p=>{
    const {data:items}=await supabaseClient.from('pack_items').select('id_producto').eq('id_pack',p.id).limit(1);
    let img='imagen-producto-predeterminada.svg';
    if(items?.length){
      if(p.url_imagen) img=p.url_imagen;
      else { const {data:prod}=await supabaseClient.from('productos').select('url_imagen').eq('id',items[0].id_producto).maybeSingle(); if(prod?.url_imagen) img=prod.url_imagen; }
    }
    return {...p,img};
  }));
  grid.innerHTML=packsWithImg.map(p=>{
    const sumaIndividual=Number(p.suma_individual)||0;
    const descuento=sumaIndividual>0?Math.max(0,Math.round((1-Number(p.precio_especial)/sumaIndividual)*100)):0;
    return `<article class="combo-card" data-pack="${p.id}">
      <div class="combo-media">
        <span class="combo-badge">PACK AHORRO</span>
        <span class="combo-discount">-${descuento}%</span>
        <img src="${escapeHtml(imagenSegura(p.img))}" alt="${escapeHtml(p.nombre)}" loading="lazy">
      </div>
      <div class="combo-body">
        <h3 class="combo-title">${escapeHtml(p.nombre)}</h3>
        <div class="combo-prices">
          <span class="combo-old-price">${money(Number(p.suma_individual)||0)}</span>
          <strong class="combo-price">${money(Number(p.precio_especial)||0)}</strong>
        </div>
        <div class="combo-save-row">
          <span class="combo-save">Ahorras ${money((Number(p.suma_individual)||0)-(Number(p.precio_especial)||0))}</span>
          <span class="combo-stock">● ${p.stock} disp.</span>
        </div>
        <button class="combo-cta" data-pack="${p.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> Agregar al carrito</button>
      </div>
    </article>`;
  }).join('');
  grid.querySelectorAll('.combo-card').forEach(card=>{
    card.addEventListener('click',e=>{
      if(e.target.closest('.combo-cta')) return;
      e.stopPropagation();
      const id=Number(card.dataset.pack);
      abrirPackModal(id);
    });
  });
  grid.querySelectorAll('.combo-cta').forEach(b=>b.addEventListener('click',async(e)=>{
    e.stopPropagation();
    const id=Number(b.dataset.pack);
    const {data:items}=await supabaseClient.from('pack_items').select('id_producto,cantidad').eq('id_pack',id);
    if(!items?.length){showToast('Pack sin productos.');return;}
    for(const it of items){
      let prod=products.find(x=>x.id===it.id_producto);
      if(!prod){
        const {data:pp}=await supabaseClient.from('productos').select('id,nombre,url_imagen,precio,existencias').eq('id',it.id_producto).maybeSingle();
        if(pp){ prod={id:pp.id,name:pp.nombre,img:pp.url_imagen,price:Number(pp.precio),stock:Number(pp.existencias)}; products.push(prod); }
      }
      if(prod) addToCart(prod.id, it.cantidad);
    }
    showToast('Pack agregado al carrito.');
  }));
  // add to cart only from modal button
}

async function loadCatalogFromSupabase(){
  if(!supabaseClient) return;
  const grid=document.querySelector('#productGrid');
  if(grid) grid.innerHTML=Array(8).fill('<div class="skeleton-card"><div class="skeleton skeleton-image"></div><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-title" style="width:60%"></div><div class="skeleton skeleton-price"></div></div>').join('');
  const {data,error}=await supabaseClient.from('catalogo_productos').select('*').order('id',{ascending:false});
  if(error){console.error('Supabase catalog:',error);showToast('No se pudo cargar el catálogo desde la base de datos.');return;}
  if(!data?.length){products=[];renderProducts();showToast('El catálogo todavía no tiene productos cargados.');return;}
  products=data.map(product=>({
    id:product.id,
    category:product.categoria||product.category,
    brand:product.marca||product.brand||'BYTE BAY',
    name:product.nombre||product.name,
    old:Number(product.precio_regular),
    price:Number(product.precio_venta),
    discount:Number(product.porcentaje_descuento||0),
    stock:Number(product.existencias||0),
    availability:product.disponibilidad,
    rating:Number(product.calificacion||0).toFixed(1),
    description:product.descripcion||'Consulta las características principales de este producto antes de añadirlo al carrito.',
    shortPresentation:product.short_presentation||'',
    verifiableFeatures:product.verifiable_features||'',
    benefitsSummary:product.benefits_summary||'',
    img:imagenSegura(product.url_imagen||product.image_url),
    videoUrl:product.video_url||'',
    gender:product.genero||'Mixto',
    specs:product.especificaciones||{},
    status:product.estado_stock||'disponible'
  }));
  actualizarOpcionesCategorias();
  renderProducts();
  cargarPacksTienda();
  actualizarContadoresCategorias();
  renderizarPersonalizacion();
  iniciarCarruselHero();
}

async function cargarComentariosProducto(idProducto, filtro='all'){
  const lista=document.querySelector('#productCommentsList');
  const resumen=document.querySelector('#commentsSummary');
  lista.textContent='Cargando comentarios...';
  resumen.textContent='Calculando valoraciones…';
  const {data,error}=await supabaseClient.from('comentarios_publicos_productos')
    .select('id,autor,calificacion,comentario,creado_en')
    .eq('id_producto',idProducto).order('creado_en',{ascending:false}).limit(20);
  if(error){lista.textContent='Los comentarios estarán disponibles después de actualizar la base de datos.';resumen.textContent='Reseñas no disponibles';return;}
  let comentarios=data||[];
  if(filtro==='good') comentarios=comentarios.filter(c=>Number(c.calificacion)>=4);
  if(filtro==='bad') comentarios=comentarios.filter(c=>Number(c.calificacion)<=3);
  const promedio=comentarios.length?comentarios.reduce((total,item)=>total+Number(item.calificacion),0)/comentarios.length:0;
  resumen.innerHTML=comentarios.length?`<strong>${promedio.toFixed(1)}</strong><span aria-label="${promedio.toFixed(1)} de 5 estrellas">${'★'.repeat(Math.round(promedio))}${'☆'.repeat(5-Math.round(promedio))}</span><small>${comentarios.length} ${comentarios.length===1?'reseña':'reseñas'}</small>`:'Aún no hay reseñas';
  lista.innerHTML=comentarios.length?comentarios.map(comentario=>`<article class="product-comment"><header><div><strong>${escapeHtml(comentario.autor)}</strong><small>${new Date(comentario.creado_en).toLocaleDateString('es-PE',{year:'numeric',month:'short',day:'numeric'})}</small></div><span class="product-comment-stars" aria-label="${Number(comentario.calificacion)} de 5 estrellas">${'★'.repeat(Number(comentario.calificacion))}${'☆'.repeat(5-Number(comentario.calificacion))}</span></header><p>${escapeHtml(comentario.comentario)}</p></article>`).join(''):'Sé la primera persona en compartir su experiencia con este producto.';
}

async function sendNotificationEmail({email,wants}){
  if(!emailjsReady()) return {configured:false,reason:'EmailJS no está disponible. Comprueba tu conexión a internet y recarga la página.'};
  const preferences=wants.length?wants.join(', '):'ofertas';
  await emailjs.send(EMAILJS_CONFIG.serviceId,EMAILJS_CONFIG.templateId,{
    to_email:email,
    email,
    name:'Cliente Byte Bay',
    time:new Date().toLocaleString('es-PE',{dateStyle:'long',timeStyle:'short'}),
    preferences,
    subject:'Tu suscripción a Byte Bay está activa',
    message:`Has activado notificaciones de ${preferences}. Recibirás comunicaciones de Byte Bay según tus preferencias.`,
    unsubscribe_url:`${window.location.href.split('#')[0]}#notificaciones`
  });
  return {configured:true};
}

const money=n=>`S/ ${n.toLocaleString('es-PE',{minimumFractionDigits:2})}`;
function animarAgregarCarrito(producto){
  const tarjeta=document.querySelector(`.product-card[data-id="${producto.id}"]`);
  const img=tarjeta?.querySelector('.product-image img');
  const carrito=document.querySelector('#cartButton, .cart-button, [data-action="cart"]');
  if(!img||!carrito) return;
  const rect=img.getBoundingClientRect();
  const cartRect=carrito.getBoundingClientRect();
  const clon=img.cloneNode(true);
  clon.className='fly-to-cart';
  clon.style.left=rect.left+'px';
  clon.style.top=rect.top+'px';
  clon.style.width=rect.width+'px';
  clon.style.height=rect.height+'px';
  document.body.appendChild(clon);
  requestAnimationFrame(()=>{
    clon.style.left=(cartRect.left+cartRect.width/2-15)+'px';
    clon.style.top=(cartRect.top+cartRect.height/2-15)+'px';
    clon.style.width='30px';
    clon.style.height='30px';
    clon.style.opacity='0';
  });
  setTimeout(()=>clon.remove(),650);
}

function calcularPUM(producto){
  const nombre=String(producto.name||'');
  const m=nombre.match(/(\d+(?:[\.,]\d+)?)\s*(kg|g|l|ml|litro|litros)/i);
  if(!m) return '';
  const val=parseFloat(m[1].replace(',','.'));
  const unit=m[2].toLowerCase();
  let baseKg=val;
  if(unit==='g') baseKg=val/1000;
  else if(unit==='ml') baseKg=val/1000;
  else if(unit==='kg'||unit==='l'||unit==='litro'||unit==='litros') baseKg=val;
  if(!baseKg) return '';
  const pum=Number(producto.price)/baseKg;
  const label=(unit==='g'||unit==='kg')?'kg':'litro';
  return `S/ ${pum.toFixed(2)} x ${label}`;
}

document.querySelector('#categoryList').innerHTML=categories.map(c=>`<a class="category-card" href="#" data-category="${escapeHtml(c.name)}"><span class="cat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${c.icon}</svg></span><strong>${escapeHtml(c.name)}</strong><small>${escapeHtml(c.count)}</small></a>`).join('');

function getVisibleProducts(){
  let list=soloOfertas?products.filter(p=>Number(p.discount)>0):products;
  if(activeCategory!=='all') list=list.filter(p=>p.category===activeCategory);
  if(activeBrand!=='all') list=list.filter(p=>p.brand===activeBrand);
  if(activeGender!=='all') list=list.filter(p=>(p.gender||'Mixto')===activeGender);
  if(inStockOnly) list=list.filter(p=>Number(p.stock)>0);
  if(activeQuery) list=list.filter(p=>(p.name+p.brand+p.category).toLowerCase().includes(activeQuery));
  if(activeFilter==='price-low') list=[...list].sort((a,b)=>a.price-b.price);
  if(activeFilter==='price-high') list=[...list].sort((a,b)=>b.price-a.price);
  if(activeFilter==='rating') list=[...list].sort((a,b)=>parseFloat(b.rating)-parseFloat(a.rating));
  if(activeFilter==='favorites') list=list.filter(p=>favorites.has(p.id));
  return list;
}

function actualizarOpcionesCategorias(){
  const selector=document.querySelector('#catalogCategoryFilter');
  if(!selector) return;
  const origen=soloOfertas?products.filter(producto=>Number(producto.discount)>0):products;
  const categoriasDisponibles=[...new Set(origen.map(producto=>producto.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  selector.innerHTML='<option value="all">Todas las categorías</option>'+categoriasDisponibles.map(categoria=>`<option value="${escapeHtml(categoria)}">${escapeHtml(categoria)}</option>`).join('');
  selector.value=activeCategory;
  const brandSelector=document.querySelector('#catalogBrandFilter');
  if(brandSelector){
    const marcasDisponibles=[...new Set(origen.map(producto=>producto.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    brandSelector.innerHTML='<option value="all">Todas las marcas</option>'+marcasDisponibles.map(marca=>`<option value="${escapeHtml(marca)}">${escapeHtml(marca)}</option>`).join('');
    brandSelector.value=activeBrand;
  }
}
function actualizarContadoresCategorias(){
  const contenedor=document.querySelector('#categoryList');
  if(!contenedor) return;
  const conteos={};
  products.forEach(p=>{conteos[p.category]=(conteos[p.category]||0)+1;});
  const ofertas=products.filter(p=>Number(p.discount)>0).length;
  contenedor.innerHTML=categories.map(c=>`<a class="category-card" href="#" data-category="${escapeHtml(c.name)}"><span class="cat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${c.icon}</svg></span><strong>${escapeHtml(c.name)}</strong><small>${conteos[c.name]||0} productos</small></a>`).join('')+`<a class="category-card" href="#" data-category="ofertas"><span class="cat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7"></path><rect x="2" y="7" width="20" height="5"></rect><path d="M12 22V7"></path><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg></span><strong>Ofertas</strong><small>${ofertas} productos</small></a>`;
  // bind click
  contenedor.querySelectorAll('.category-card').forEach(card=>{
    card.onclick=e=>{e.preventDefault();const cat=card.dataset.category;if(cat==='ofertas'){soloOfertas=true;activeCategory='all';}else{soloOfertas=false;activeCategory=cat;}start=0;renderProducts();sincronizarFiltrosCatalogo();};
  });
}
function sincronizarFiltrosCatalogo(){
  const categoria=document.querySelector('#catalogCategoryFilter'),precio=document.querySelector('#catalogPriceFilter'),modo=document.querySelector('#catalogOfferFilter');
  if(categoria) categoria.value=activeCategory;
  const marca=document.querySelector('#catalogBrandFilter'); if(marca) marca.value=activeBrand;
  const genero=document.querySelector('#catalogGenderFilter'); if(genero) genero.value=activeGender;
  const stock=document.querySelector('#catalogInStockOnly'); if(stock) stock.checked=inStockOnly;
  if(precio) precio.value=['price-low','price-high'].includes(activeFilter)?activeFilter:'';
  if(modo) modo.value=soloOfertas?'ofertas':'catalogo';
}

function renderProducts(list=getVisibleProducts().slice(start,start+12)){
  const visible=list.length?list:[];
  const total=getVisibleProducts().length;
  document.querySelector('#catalogTitle').textContent=soloOfertas?'Ofertas activas':'Catálogo de productos';
  document.querySelector('#productCountLabel').textContent=soloOfertas?`${total} ${total===1?'oferta activa':'ofertas activas'}`:`${total} productos disponibles`;
  const vacio=soloOfertas?`<div class="empty-cart" style="grid-column:1/-1"><span>%</span><h3>No hay ofertas activas</h3><p>El personal puede programar descuentos desde Gestión interna → Ofertas. Cuando haya una oferta real, aparecerá aquí automáticamente.</p></div>`:`<div class="empty-cart" style="grid-column:1/-1"><span>▱</span><h3>No hay resultados</h3><p>Prueba otra categoría, cambia el orden de precio o limpia los filtros.</p></div>`;
  document.querySelector('#productGrid').innerHTML=visible.length?visible.map(producto=>tarjetaProducto(producto)).join(''):vacio;
  bindCards();
  updateProductNav();
  window.dispatchEvent(new Event('bb:catalogo-actualizado'));
}

function updateProductNav(){
  const total=getVisibleProducts().length;
  document.querySelector('#prevProducts').disabled=total<=12||start===0;
  document.querySelector('#nextProducts').disabled=total<=12||start+12>=total;
}

function bindCards(){
  document.querySelectorAll('.add').forEach(b=>b.onclick=()=>addToCart(+b.dataset.id));
  document.querySelectorAll('.wish').forEach(b=>b.onclick=()=>toggleFavorite(+b.dataset.fav,b));
  document.querySelectorAll('.product-card').forEach(card=>card.addEventListener('click',e=>{
    if(e.target.closest('.add')||e.target.closest('.wish')) return;
    openProductModal(+card.dataset.id);
  }));
}

function toggleFavorite(id,button){
  if(favorites.has(id)) favorites.delete(id); else favorites.add(id);
  localStorage.setItem('beruFavorites',JSON.stringify([...favorites]));
  button.classList.toggle('active');
  button.innerHTML=favorites.has(id)?ICON_HEART_ON:ICON_HEART_OFF;
  if(activeFilter==='favorites') renderProducts();
}

function addToCart(id,cantidad=1){
  const product=products.find(x=>x.id===id);
  if(!product||product.stock<=0){showToast('Este producto está agotado.');return;}
  const cantidadSegura=Math.max(1,Math.min(Number(cantidad)||1,product.stock));
  const found=cart.find(x=>x.id===id);
  if(found&&found.qty+cantidadSegura>product.stock){showToast(`Solo quedan ${product.stock} unidades.`);return;}
  found?found.qty+=cantidadSegura:cart.push({...product,qty:cantidadSegura});
  const cartSaved=updateCart();
  window.BBPrivacy?.registrarEvento?.('CARRITO',{idProducto:product.id,categoria:product.category});
  const account=leerJSON('beruAccount',null);
  if(!cartSaved){
    showToast('No se pudo guardar el carrito. No recargues ni cierres esta página.');
    if(!account?.verified) openAccountModal();
    return;
  }
  if(!account?.verified){
    showToast('Producto guardado. Crea tu cuenta o inicia sesión para comprar.');
    openAccountModal();
    document.querySelector('#accountStatus').textContent='Tu producto quedó guardado en el carrito. Inicia sesión o crea una cuenta Byte Bay para continuar.';
    return;
  }
  showToast();
  animarAgregarCarrito(product);
}

function subtotal(){return cart.reduce((a,x)=>a+x.price*x.qty,0);}
function totalDiscount(){return subtotal()*discountRate;}
function totalShipping(){return shippingValue;}
function totalPayable(){return Math.max(subtotal()-totalDiscount()+totalShipping(),0);}
function updateCheckout(){
  document.querySelector('#checkoutSubtotal').textContent=money(subtotal());
  document.querySelector('#checkoutShipping').textContent=totalShipping()>0?money(totalShipping()):'Gratis';
  document.querySelector('#checkoutDiscount').textContent=`- ${money(totalDiscount())}`;
  document.querySelector('#checkoutTotal').textContent=money(totalPayable());
}

function updateCart(){
  let saved=true;
  try{localStorage.setItem(CART_STORAGE_KEY,JSON.stringify(cart));}
  catch(error){
    console.error('No se pudo guardar el carrito en este dispositivo:',error);
    saved=false;
  }
  const count=cart.reduce((a,x)=>a+x.qty,0);
  document.querySelector('#cartCount').textContent=count;
  document.querySelector('#cartTitleCount').textContent=`(${count})`;
  document.querySelector('#cartSubtotal').textContent=money(subtotal());
  document.querySelector('#cartItems').innerHTML=cart.length?cart.map(x=>`<div class="cart-item"><img src="${escapeHtml(imagenSegura(x.img))}" alt="Imagen de ${escapeHtml(x.name)}" loading="lazy" decoding="async" ${atributoRespaldo(IMAGEN_PRODUCTO_RESPALDO)}><div><h4>${escapeHtml(x.name)}</h4><strong>${money(Number(x.price)||0)}</strong><div class="qty"><button onclick="changeQty(${Number(x.id)},-1)">−</button><span>${Number(x.qty)||0}</span><button onclick="changeQty(${Number(x.id)},1)">+</button></div></div><button onclick="removeItem(${Number(x.id)})" aria-label="Eliminar">×</button></div>`).join(''):`<div class="empty-cart"><span>▱</span><h3>Tu carrito está vacío</h3><p>Agrega productos y aparecerán aquí.</p></div>`;
  updateCheckout();
  return saved;
}

window.changeQty=(id,n)=>{
  if(!Number.isInteger(Number(id))||!Number.isInteger(n)||Math.abs(n)!==1) return;
  const x=cart.find(item=>item.id===Number(id));
  if(!x) return;
  const product=products.find(item=>item.id===Number(id));
  const stock=Number(product?.stock);
  const maxima=Number.isFinite(stock)&&stock>0?Math.min(stock,99):99;
  if(n>0&&x.qty>=maxima){showToast(`Solo quedan ${maxima} unidades.`);return;}
  x.qty=Math.min(maxima,Math.max(1,Number(x.qty)+n));
  if(!updateCart()) showToast('No se pudo guardar el carrito en este dispositivo.');
};
window.removeItem=id=>{cart=cart.filter(item=>item.id!==id);if(!updateCart()) showToast('No se pudo guardar el carrito en este dispositivo.');};

function toggleCart(open){
  document.querySelector('#cartDrawer').classList.toggle('open',open);
  document.querySelector('#overlay').classList.toggle('open',open);
  document.querySelector('#cartDrawer').setAttribute('aria-hidden',!open);
}

document.querySelector('#cartOpen').onclick=()=>toggleCart(true);
document.querySelector('#cartClose').onclick=()=>toggleCart(false);
document.querySelector('#overlay').onclick=()=>toggleCart(false);

document.querySelector('#departmentsBtn').onclick=()=>{
  document.querySelector('#megaMenu').classList.toggle('open');
};

document.querySelector('#megaMenu').querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();
  activeCategory=a.dataset.category||a.parentElement.querySelector('strong').textContent.trim();
  start=0;
  sincronizarFiltrosCatalogo();
  document.querySelector('#megaMenu').classList.remove('open');
  renderProducts();
  document.querySelector('#ofertas').scrollIntoView({behavior:'smooth'});
}));

document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',e=>{
  e.preventDefault();
  const messages={
    help:'Estamos aquí para ayudarte. Revisa la sección de beneficios o escríbenos desde el formulario de contacto.',
    sell:'Próximamente podrás publicar tus productos en Byte Bay.',
    location:'Zona de entrega actual: Lima, Perú. Próximamente añadiremos más ciudades.',
    account:null
  };
  if(el.dataset.action==='account'){openAccountModal();return;}
  showToast(messages[el.dataset.action]||'Opción seleccionada');
}));

const footerInfo={
  'Quiénes somos':{title:'Quiénes somos',body:'<p>Byte Bay es una tienda digital peruana de productos para hogar, tecnología, supermercado y más. Nuestro objetivo es que puedas comprar desde un solo lugar con información clara del producto, stock y precio.</p><p>El catálogo y el inventario se controlan desde nuestra plataforma para evitar publicar productos agotados o próximos a vencer.</p>'},
  'Trabaja con nosotros':{title:'Trabaja con nosotros',body:'<p>Si deseas formar parte de Byte Bay, envíanos por redes sociales:</p><ol><li>Tu nombre completo.</li><li>Distrito o ciudad.</li><li>Área de interés: ventas, almacén, reparto, atención al cliente o contenido.</li><li>Un medio de contacto.</li></ol><p>No envíes contraseñas, DNI completo ni códigos bancarios por mensaje.</p>'},
  'Sostenibilidad':{title:'Sostenibilidad',body:'<p>Byte Bay controla lotes, proveedores y fechas de vencimiento para reducir desperdicios.</p><ul><li>Productos a 30 días de vencer: descuento de 20%.</li><li>Productos a 21 días de vencer: descuento de 50%.</li><li>Productos a 7 días de vencer: se retiran del catálogo.</li><li>Productos dañados o devueltos: no se ofrecen para venta.</li></ul>'},
  'Cómo comprar':{title:'Cómo comprar',body:'<ol><li>Busca el producto por nombre, marca o categoría.</li><li>Agrega la cantidad deseada al carrito.</li><li>Presiona <strong>Continuar compra</strong> e inicia sesión con tu cuenta Byte Bay.</li><li>Completa nombres, documento, dirección, correo y teléfono.</li><li>Continúa al checkout seguro de Mercado Pago y elige los medios disponibles en tu cuenta.</li><li>Vuelve a Byte Bay: el pedido se confirma solo cuando el proveedor acredita el pago.</li><li>Guarda tu código de pedido <strong>BERU-XXXXXXXX</strong>.</li></ol><p>El stock se reserva por 15 minutos y los pagos pendientes se concilian automáticamente.</p>'},
  'Medios de pago':{title:'Medios de pago',body:'<p>Byte Bay ofrece <strong>Mercado Pago</strong> con los medios que estén habilitados para tu cuenta.</p><ol><li>Continúa al checkout de Mercado Pago.</li><li>Revisa que el monto coincida con el total del pedido.</li><li>Completa el pago únicamente en la página segura del proveedor.</li><li>Byte Bay confirma el pedido cuando el proveedor acredita el pago.</li></ol><p>Byte Bay no solicita ni almacena datos de tarjeta, CVV, claves bancarias ni códigos de aprobación.</p>'},
  'Envíos y devoluciones':{title:'Envíos y devoluciones',body:'<p>El costo de envío vigente aparece en el resumen de checkout antes de pagar. El flujo actual calcula S/ 0.00; cualquier cambio se mostrará antes de confirmar.</p><p>No hay un plazo general de entrega publicado. Para consultar el plazo de tu dirección, corregir un dato o reportar un problema, escríbenos por WhatsApp con tu código de pedido.</p><p>Las solicitudes de cambio, devolución o garantía se atienden según el estado del pedido, la información de la ficha y los derechos que reconoce la normativa peruana. No se ofrece un plazo general de 30 días por cambio de opinión.</p>'},
  'Centro de ayuda':{title:'Centro de ayuda',body:'<p>Para una consulta de pedido, incluye tu código BERU y una explicación breve. Para cambios de dirección, escríbenos antes del despacho. No envíes contraseñas, CVV ni códigos de aprobación de pago.</p><p>Correo: [Completar correo comercial] · WhatsApp: <a href="https://wa.me/51963058461?text=Hola%20Byte-Bay%2C%20vengo%20de%20su%20tienda%20web%20y%20tengo%20una%20consulta." target="_blank" rel="noopener noreferrer">+51 963 058 461</a></p>'},
  'Preguntas frecuentes':{title:'Preguntas frecuentes',body:'<p><strong>¿Cuándo se confirma el pago?</strong></p><p>Cuando Mercado Pago reporta el resultado y Byte Bay actualiza el estado del pedido.</p><p><strong>¿Dónde veo el costo final?</strong></p><p>En el resumen del checkout, antes de confirmar. El flujo actual calcula envío S/ 0.00.</p><p><strong>¿Cómo solicito un cambio o cancelación?</strong></p><p>Contacta a Byte Bay cuanto antes e incluye el código de pedido. La atención depende del estado real del pedido y de las condiciones publicadas.</p>'},
  'Contáctanos':{title:'Contáctanos',body:'<p>Correo comercial: [Completar correo comercial]<br>WhatsApp: <a href="https://wa.me/51963058461?text=Hola%20Byte-Bay%2C%20vengo%20de%20su%20tienda%20web%20y%20tengo%20una%20consulta." target="_blank" rel="noopener noreferrer">+51 963 058 461</a></p><p>También puedes usar las redes oficiales del pie de página. Comparte el código de pedido cuando corresponda; nunca envíes credenciales ni datos de pago.</p>'},
  'Libro de reclamaciones':{title:'Libro de reclamaciones',body:'<p>Usa el formulario del Libro de reclamaciones disponible en esta tienda. Incluye los datos solicitados y describe lo ocurrido con claridad. Para una consulta, usa el WhatsApp publicado por Byte Bay.</p>'},
  'Privacidad':{title:'Privacidad',body:'<p>La política completa explica qué datos se usan, para qué, con qué proveedores y cómo solicitar acceso, rectificación, cancelación u oposición. <a href="#politica-privacidad">Leer política de privacidad</a>.</p>'},
  'Términos':{title:'Términos y condiciones',body:'<p>Los términos describen catálogo, precio, pagos, envíos, cancelaciones y garantías. <a href="#terminos-condiciones">Leer términos y condiciones</a>.</p>'}
};
footerInfo['Contacto y soporte']=footerInfo['Contáctanos'];
function openFooterInfo(info){
  let modal=document.querySelector('#footerInfoModal');
  if(!modal){
    document.body.insertAdjacentHTML('beforeend','<div class="info-modal" id="footerInfoModal" aria-hidden="true"><article><button type="button" aria-label="Cerrar">×</button><h2></h2><div></div></article></div>');
    modal=document.querySelector('#footerInfoModal');
    modal.addEventListener('click',event=>{if(event.target===modal||event.target.tagName==='BUTTON') modal.classList.remove('open');});
  }
  modal.querySelector('h2').textContent=info.title;modal.querySelector('article div').innerHTML=info.body;modal.classList.add('open');
}
document.querySelectorAll('#ayuda a[href="#"]').forEach(link=>link.addEventListener('click',event=>{
  if(link.id==='openClaimsForm') return;
  const info=footerInfo[link.textContent.trim()];
  if(!info) return;
  event.preventDefault();openFooterInfo(info);
}));
// Accesos reutilizables para el panel de configuración del cliente.
window.bbAyuda={
  abrir:openFooterInfo,
  info:footerInfo,
  reclamaciones:()=>document.querySelector('[data-open-claims]')?.click()
};

let accountMode='register';
function openAccountModal(forceLogin=false){
  const cuenta=leerJSON('beruAccount',null);
  if(cuenta?.verified&&!forceLogin){showToast(`Sesión activa: ${cuenta.name||cuenta.email}. Usa “Salir” para cerrar sesión.`);return;}
  setAccountMode(cuenta?.verified||forceLogin?'login':'register');
  document.querySelector('#accountModal').classList.add('open');document.querySelector('#accountModal').setAttribute('aria-hidden','false');
}
function closeAccountModal(){document.querySelector('#accountModal').classList.remove('open');document.querySelector('#accountModal').setAttribute('aria-hidden','true');}
function setAccountBusy(busy,label){
  const submit=document.querySelector('#accountSubmit');
  submit.disabled=busy;
  if(label) submit.textContent=label;
}
function updateAccountHeader(){
  const saved=leerJSON('beruAccount',null);
  const account=document.querySelector('.account');
  if(!account) return;
  account.querySelector('small').textContent=saved?.verified?'Hola, '+(saved.username||saved.name?.split(' ')[0]||'cliente'):'Hola, ingresa';
  account.querySelector('strong').textContent=saved?.verified?'Mi cuenta':'Crear cuenta / Ingresar';
  document.querySelector('#accountLogout').classList.toggle('hidden',!saved?.verified);
  const accesoMovil=document.querySelector('#mobileAccountAccess span'),salidaMovil=document.querySelector('#mobileAccountLogout');
  if(accesoMovil) accesoMovil.textContent=saved?.verified?`Mi cuenta · ${saved.name?.split(' ')[0]||'cliente'}`:'Crear cuenta / Ingresar';
  if(salidaMovil) salidaMovil.classList.toggle('hidden',!saved?.verified);
  window.BBPrivacy?.actualizarSesionUI?.();
  window.dispatchEvent(new Event('bb:account-updated'));
}
function setAccountMode(mode){
  accountMode=mode;
  const form=document.querySelector('#accountForm');
  const isLogin=mode==='login';
  form.querySelector('.account-name-row').classList.toggle('hidden',isLogin);
  document.querySelector('#accountUsername').closest('label').classList.toggle('hidden',isLogin);
  document.querySelector('#accountPassword').autocomplete=isLogin?'current-password':'new-password';
  document.querySelector('#accountTitle').textContent=isLogin?'Iniciar sesión':'Crear una cuenta';
  document.querySelector('#accountSubtitle').textContent=isLogin?'Ingresa con tu correo y contraseña de Byte Bay.':'Registra tus datos para continuar con Byte Bay.';
  document.querySelector('#accountSubmit').textContent=isLogin?'Iniciar sesión':'Crear cuenta';
  document.querySelector('#accountModeToggle').textContent=isLogin?'Crear una cuenta nueva':'Ya tengo una cuenta';
  document.querySelector('#accountStatus').textContent='';
}
document.querySelector('#accountClose').onclick=closeAccountModal;
document.querySelector('#accountModeToggle').onclick=()=>setAccountMode(accountMode==='login'?'register':'login');
document.querySelector('#mobileAccountAccess').onclick=()=>openAccountModal();
document.querySelector('#mobileAccountLogout').onclick=()=>document.querySelector('#accountLogout').click();
document.querySelector('#accountLogout').onclick=async()=>{
  const cuenta=leerJSON('beruAccount',null);
  try{
    if(window.BBPrivacy?.cerrarSesionActual) await window.BBPrivacy.cerrarSesionActual();
    else if(cuenta?.provider==='google'&&supabaseClient) await supabaseClient.auth.signOut();
  }catch(error){
    console.warn('Cierre de sesión:',error);
  }
  // Limpiar todo el estado local independientemente del resultado
  try{localStorage.removeItem('beruAccount');}catch(e){}
  try{localStorage.removeItem('bbSession');}catch(e){}
  try{localStorage.removeItem('bbGuestId');}catch(e){}
  try{localStorage.removeItem('beruNotifications');}catch(e){}
  updateAccountHeader();
  showToast('Sesión cerrada correctamente.');
  // Forzar recarga de la página para limpiar estado residual
  setTimeout(()=>{window.location.reload();},500);
};
async function guardarSesionGoogle(user){
  const esGoogle=user?.app_metadata?.provider==='google'||user?.identities?.some(identidad=>identidad.provider==='google');
  if(!user?.email||!esGoogle) return;
  const meta=user.user_metadata||{};
  // La sesión Google debe verse inmediatamente, incluso si todavía falta ejecutar
  // la sincronización SQL del perfil comercial.
  localStorage.setItem('beruAccount',JSON.stringify({id:user.id,name:`${meta.given_name||''} ${meta.family_name||''}`.trim()||meta.full_name||meta.name||'Cliente',username:meta.preferred_username||meta.name||user.email.split('@')[0],email:user.email,verified:true,provider:'google'}));
  updateAccountHeader();
  const {data,error}=await supabaseClient.rpc('sincronizar_cuenta_cliente_google');
  if(error){console.warn('Perfil Google pendiente de sincronización:',error.message);return;}
  localStorage.setItem('beruAccount',JSON.stringify({id:data?.id||null,name:`${data?.nombres||meta.given_name||''} ${data?.apellidos||meta.family_name||''}`.trim()||meta.full_name||'Cliente',username:data?.nombre_usuario||meta.name||user.email.split('@')[0],email:user.email,verified:true,provider:'google'}));
  updateAccountHeader();
  if(window.BBPrivacy?.sincronizarSesionGoogle){
    const sesionToken=await window.BBPrivacy.sincronizarSesionGoogle();
    if(!sesionToken?.ok) console.warn('Sesión Google sin token de tienda:',sesionToken?.error||sesionToken?.message);
  }
}
async function restaurarSesionGoogle(){
  if(!supabaseClient) return;
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(session?.user) await guardarSesionGoogle(session.user);
}
document.querySelector('#googleSignIn').onclick=async()=>{
  const status=document.querySelector('#accountStatus'),boton=document.querySelector('#googleSignIn');
  if(!supabaseClient){status.textContent='Supabase no está disponible.';return;}
  boton.disabled=true;status.textContent='Redirigiendo a Google…';
  const {error}=await supabaseClient.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}${window.location.pathname}`}});
  if(error){boton.disabled=false;status.textContent=`No se pudo iniciar con Google: ${error.message}`;}
};
if(supabaseClient){
  supabaseClient.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'&&session?.user) setTimeout(()=>guardarSesionGoogle(session.user),0);});
  restaurarSesionGoogle();
}
document.querySelector('#accountForm').onsubmit=async e=>{
  e.preventDefault();
  const email=document.querySelector('#accountEmail').value.trim().toLowerCase();
  const password=document.querySelector('#accountPassword').value;
  const firstName=document.querySelector('#accountFirstName').value.trim();
  const lastName=document.querySelector('#accountLastName').value.trim();
  const username=document.querySelector('#accountUsername').value.trim();
  const status=document.querySelector('#accountStatus');
  if(!supabaseClient){status.textContent='Supabase no está disponible.';return;}
  if(accountMode==='login'){
    if(!email||!password){status.textContent='Escribe tu correo y contraseña.';return;}
    setAccountBusy(true,'Ingresando…');
    let resultado;
    if(window.BBPrivacy?.iniciarSesion){
      resultado=await window.BBPrivacy.iniciarSesion(email,password);
    }else{
      const {data,error}=await supabaseClient.rpc('iniciar_sesion_cliente',{p_correo:email,p_contrasena:password});
      resultado=error?{ok:false,message:'Correo o contraseña incorrectos.'}:{ok:true,cuenta:data,token:false};
    }
    setAccountBusy(false,'Iniciar sesión');
    if(!resultado.ok){status.textContent=resultado.message||'Correo o contraseña incorrectos.';return;}
    if(!resultado.token){
      status.textContent='La cuenta inició sesión, pero la base todavía no tiene activa la sesión segura necesaria para comprar. Actualiza las migraciones de Byte Bay.';
      return;
    }
    const cuenta=resultado.cuenta||{};
    localStorage.setItem('beruAccount',JSON.stringify({id:cuenta.id||null,name:`${cuenta.nombres||''} ${cuenta.apellidos||''}`.trim()||'Cliente',username:cuenta.nombre_usuario||email.split('@')[0],email:cuenta.correo||email,verified:true}));
    updateAccountHeader();
    status.textContent=resultado.token?'Sesión iniciada con token seguro.':'Sesión iniciada correctamente.';
    e.target.reset();
    setTimeout(closeAccountModal,700);
    return;
  }
  if(username&&!/^[A-Za-z0-9._-]{3,30}$/.test(username)){status.textContent='El nombre de usuario solo admite letras, números, punto, guion o guion bajo.';return;}
  if(password.length<8){status.textContent='La contraseña debe tener al menos 8 caracteres.';return;}
  if(!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)||!/[^A-Za-z0-9]/.test(password)){status.textContent='La contraseña debe incluir letras, números y al menos un símbolo.';return;}
  setAccountBusy(true,'Creando…');
  const payload={email,first_name:firstName||null,last_name:lastName||null,username:username||null};
  let registrado;
  if(window.BBPrivacy?.registrarCuenta){
    registrado=await window.BBPrivacy.registrarCuenta({...payload,password});
  }else{
    const {error}=await supabaseClient.rpc('registrar_cuenta_cliente',{p_correo:email,p_nombres:payload.first_name,p_apellidos:payload.last_name,p_nombre_usuario:payload.username,p_contrasena:password});
    registrado=error?{ok:false,error}:{ok:true};
  }
  if(!registrado.ok){
    setAccountBusy(false,'Crear cuenta');
    const error=registrado.error;
    console.error('Supabase simple account:',error);
    status.textContent=error?.code==='23505'?'Este correo ya está registrado.':(error?.code==='42883'||error?.code==='PGRST202'?'Ejecuta las migraciones de columnas en español en Supabase antes de registrar usuarios.':`No se pudo crear la cuenta: ${registrado.message||error?.message||'intenta nuevamente.'}`);
    return;
  }
  let sesionCreada={ok:false};
  if(window.BBPrivacy?.iniciarSesion) sesionCreada=await window.BBPrivacy.iniciarSesion(email,password);
  setAccountBusy(false,'Crear cuenta');
  if(!sesionCreada.ok||!sesionCreada.token){
    e.target.reset();
    setAccountMode('login');
    status.textContent='Cuenta creada. Inicia sesión para continuar. Si el acceso seguro no se habilita, actualiza las migraciones de Byte Bay.';
    return;
  }
  const cuentaCreada=sesionCreada.cuenta||{};
  localStorage.setItem('beruAccount',JSON.stringify({id:cuentaCreada.id||registrado.id||null,name:`${cuentaCreada.nombres||firstName||''} ${cuentaCreada.apellidos||lastName||''}`.trim()||'Cliente',username:cuentaCreada.nombre_usuario||username||email.split('@')[0],email:cuentaCreada.correo||email,verified:true}));
  updateAccountHeader();
  status.textContent='Datos guardados correctamente.';
  showToast('Tu correo fue registrado.');
  e.target.reset();
  setTimeout(closeAccountModal,900);
};

function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}

document.querySelectorAll('[data-category]').forEach(link=>link.addEventListener('click',e=>{
  e.preventDefault();
  activeCategory=link.dataset.category;
  start=0;
  sincronizarFiltrosCatalogo();
  renderProducts();
  window.BBPrivacy?.registrarEvento?.('CATEGORIA',{categoria:link.dataset.category});
  document.querySelector('#ofertas').scrollIntoView({behavior:'smooth'});
}));

document.querySelector('#nextProducts').onclick=()=>{
  const total=getVisibleProducts().length;
  if(total<=12) return;
  start=Math.min(start+12,total-12);
  renderProducts();
};
document.querySelector('#prevProducts').onclick=()=>{
  if(start===0) return;
  start=Math.max(start-12,0);
  renderProducts();
};

document.querySelector('#searchForm').onsubmit=e=>{
  e.preventDefault();
  activeQuery=document.querySelector('#searchInput').value.toLowerCase().trim();
  start=0;
  renderProducts();
  window.BBPrivacy?.registrarEvento?.('BUSQUEDA',{termino:activeQuery,categoria:activeCategory!=='all'?activeCategory:null});
  document.querySelector('#ofertas').scrollIntoView({behavior:'smooth'});
};

document.querySelectorAll('.filter-chip').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.filter-chip').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
  activeFilter=btn.dataset.filter;
  start=0;
  sincronizarFiltrosCatalogo();
  renderProducts();
}));
document.querySelector('#catalogCategoryFilter').addEventListener('change',event=>{activeCategory=event.target.value;start=0;renderProducts();});
document.querySelector('#catalogPriceFilter').addEventListener('change',event=>{activeFilter=event.target.value||'all';document.querySelectorAll('.filter-chip').forEach(chip=>chip.classList.toggle('active',chip.dataset.filter===activeFilter));start=0;renderProducts();});
document.querySelector('#catalogOfferFilter').addEventListener('change',event=>{soloOfertas=event.target.value==='ofertas';activeCategory='all';actualizarOpcionesCategorias();sincronizarFiltrosCatalogo();start=0;renderProducts();});
document.querySelector('#clearCatalogFilters').onclick=()=>{activeCategory='all';activeFilter='all';activeQuery='';soloOfertas=false;document.querySelector('#searchInput').value='';document.querySelectorAll('.filter-chip').forEach(chip=>chip.classList.toggle('active',chip.dataset.filter==='all'));actualizarOpcionesCategorias();sincronizarFiltrosCatalogo();start=0;renderProducts();};

const newsletterForm=document.querySelector('#newsletterForm');
if(newsletterForm) newsletterForm.onsubmit=async e=>{
  e.preventDefault();
  const input=e.target.querySelector('input[type="email"]');
  const button=e.target.querySelector('button');
  const email=input.value.trim();
  if(!email){showToast('Escribe un correo válido para continuar.');input.focus();return;}
  button.disabled=true;
  button.textContent='Enviando...';
  try{
    const result=await sendNotificationEmail({email,wants:['ofertas','novedades']});
    showToast(result.configured?'Revisa tu correo para confirmar la suscripción.':result.reason);
  }catch(error){
    console.error('EmailJS newsletter:',error);
    showToast('No se pudo enviar el correo. Verifica el Template ID y el Public Key.');
  }finally{
    button.disabled=false;
    button.textContent='Quiero recibir ofertas';
  }
  e.target.reset();
};

document.querySelector('#notifyForm').onsubmit=async e=>{
  e.preventDefault();
  const email=document.querySelector('#notifyEmail').value.trim();
  if(!email){
    showToast('Escribe tu correo para activar ofertas');
    document.querySelector('#notifyEmail').focus();
    return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
    showToast('Escribe un correo electrónico válido');
    document.querySelector('#notifyEmail').focus();
    return;
  }
  const wants=[];
  if(document.querySelector('#notifyDeals').checked) wants.push('ofertas');
  if(document.querySelector('#notifyDrops').checked) wants.push('novedades');
  if(document.querySelector('#notifyStock').checked) wants.push('stock');
  const submitButton=e.target.querySelector('button[type="submit"]');
  submitButton.disabled=true;
  submitButton.textContent='Enviando confirmación...';
  let emailResult={configured:false};
  try{
    emailResult=await sendNotificationEmail({email,wants});
  }catch(error){
    console.error('EmailJS:',error);
    showToast('No se pudo enviar el correo. Revisa la configuración de EmailJS.');
  }
  notificationSubscription={email,wants,date:new Date().toISOString(),emailSent:emailResult.configured&&!emailResult.error};
  localStorage.setItem('beruNotifications',JSON.stringify(notificationSubscription));
  window.dispatchEvent(new Event('bb:notifications-updated'));
  showNotificationStatus();
  showToast(emailResult.configured?'Suscripción activa. Revisa tu bandeja de entrada.':'Suscripción guardada. Falta configurar EmailJS para enviar el correo.');
  showStickyNotice(`Suscripción activa: ${email}. Recibirás ${wants.join(', ') || 'ofertas'}.`);
  if('Notification' in window){
    if(Notification.permission==='default') Notification.requestPermission();
    if(Notification.permission==='granted'){
      new Notification('Byte Bay', {body:'Tu suscripción a notificaciones está activa.'});
    }
  }
  e.target.reset();
  document.querySelector('#notifyDeals').checked=true;
  document.querySelector('#notifyDrops').checked=true;
  submitButton.disabled=false;
  submitButton.textContent='Activar notificaciones';
};

function showNotificationStatus(){
  const status=document.querySelector('#notifyStatus');
  if(!notificationSubscription){
    status.textContent='Todavía no activaste notificaciones.';
    return;
  }
  const delivery=notificationSubscription.emailSent?' Confirmación enviada por correo.':' Correo pendiente de configuración.';
  const wants=Array.isArray(notificationSubscription.wants)?notificationSubscription.wants:[];
  status.textContent=`Suscrito con ${notificationSubscription.email}. Recibes: ${wants.join(', ') || 'ofertas'}.${delivery} Puedes cancelar cuando quieras.`;
}

document.querySelector('#notifyCancel').onclick=()=>{
  notificationSubscription=null;
  localStorage.removeItem('beruNotifications');
  window.dispatchEvent(new Event('bb:notifications-updated'));
  showNotificationStatus();
  showToast('Cancelaste las notificaciones');
};

document.querySelector('#notifyClear').onclick=()=>{
  document.querySelector('#notifyEmail').value='';
  document.querySelector('#notifyDeals').checked=true;
  document.querySelector('#notifyDrops').checked=true;
  document.querySelector('#notifyStock').checked=false;
  showToast('Formulario limpiado');
};

document.querySelector('#couponForm').onsubmit=e=>{
  e.preventDefault();
  const code=document.querySelector('#couponInput').value.trim().toUpperCase();
  discountRate=code==='BERU10'||code==='BYTE10'?0.1:code==='HOGAR15'?0.15:0;
  activeCoupon=discountRate?code:null;
  if(discountRate){
    showToast(`Cupón aplicado: ${Math.round(discountRate*100)}% de descuento`);
  }else{
    showToast('Cupón no válido. Prueba BYTE10 o HOGAR15.');
  }
  updateCheckout();
};

const checkoutModal=document.querySelector('#checkoutModal');
const checkoutSection=document.querySelector('#checkout');
const paymentProgress=[...document.querySelectorAll('[data-payment-step]')];
const paymentNext=document.querySelector('#paymentNext');
const paymentProcessing=document.querySelector('#paymentProcessing');

function setPaymentStep(step){
  checkoutModal.dataset.step=step;
  paymentProgress.forEach(item=>item.classList.toggle('active',Number(item.dataset.paymentStep)===step));
  document.querySelector('#paymentMethods').classList.toggle('hidden',step!==1);
  document.querySelector('.checkout-form').classList.toggle('hidden',step!==2);
  document.querySelector('.payment-box').classList.toggle('hidden',step!==2);
  document.querySelector('#couponForm').classList.toggle('hidden',step!==2);
  document.querySelector('.checkout-actions').classList.toggle('hidden',step!==2);
  paymentNext.classList.toggle('hidden',step!==1);
  paymentProcessing.classList.toggle('hidden',step!==3);
  document.querySelector('#walletPanel').classList.toggle('hidden',step!==2);
  if(step===2){
    const account=leerJSON('beruAccount',null);
    const emailInput=document.querySelector('#email');
    emailInput.readOnly=Boolean(account?.verified&&account.email);
    if(emailInput.readOnly) emailInput.value=account.email;
    syncPaymentUI();
  }
}

async function openCheckout(){
  if(!cart.length){showToast('Agrega productos antes de continuar');return;}
  const account=leerJSON('beruAccount',null);
  if(!account?.verified){
    showToast('Para comprar necesitas iniciar sesión o crear una cuenta Byte Bay.');
    openAccountModal();
    return;
  }
  const session=await window.BBPrivacy?.obtenerSesionCliente?.();
  if(!session?.ok){
    if(['SERVICIO_NO_DISPONIBLE','VALIDACION_NO_DISPONIBLE'].includes(session?.error)){
      showToast('No pudimos validar tu sesión ahora. Tu carrito se conservó; inténtalo nuevamente en unos minutos.');
      return;
    }
    showToast('Inicia sesión con tu cuenta Byte Bay para continuar con la compra. Tu carrito se conservó.');
    openAccountModal(true);
    return;
  }
  toggleCart(false);
  document.body.classList.add('checkout-open');
  document.querySelector('#aiAssistantPanel')?.classList.add('hidden');
  checkoutModal.classList.add('open');
  checkoutModal.setAttribute('aria-hidden','false');
  setPaymentStep(1);
}

function closeCheckout(){
  checkoutModal.classList.remove('open');
  checkoutModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('checkout-open');
}

document.querySelector('#openCheckout').onclick=openCheckout;
document.querySelector('#checkoutClose').onclick=closeCheckout;
paymentNext.onclick=()=>setPaymentStep(2);

/* Culqi temporalmente desactivado: no hay tokens de producción aprobados.
   Se fuerza Mercado Pago aunque exista un radio oculto o un valor guardado. */
const CULQI_HABILITADO=false;

function proveedorPagoSeleccionado(){
  if(!CULQI_HABILITADO) return 'mercado_pago';
  return document.querySelector('input[name="paymentProvider"]:checked')?.value||'mercado_pago';
}

function syncPaymentUI(){
  const proveedor=proveedorPagoSeleccionado();
  document.querySelectorAll('#paymentMethods .payment-option').forEach(opcion=>{
    opcion.classList.toggle('active',opcion.querySelector('input')?.value===proveedor);
  });
  document.querySelector('#payNow').textContent='Continuar con Mercado Pago';
  document.querySelector('#walletPanel .panel-title').textContent='Pago protegido por Mercado Pago';
}

document.querySelectorAll('input[name="paymentProvider"]').forEach(opcion=>{
  opcion.addEventListener('change',syncPaymentUI);
});
syncPaymentUI();

let bbCulqiPedido=null;
let bbCulqiProcesando=false;
let bbCulqiCreando=false;
let bbPaymentCreating=false;
let bbPaymentSessionChecking=false;

function culqiDisponible(){
  return Boolean(window.Culqi&&typeof window.Culqi.open==='function');
}

function firmaCarritoCompra(){
  return JSON.stringify(cart.map(item=>[Number(item.id),Number(item.qty)]).sort((a,b)=>a[0]-b[0]));
}

function datosClienteCheckout(){
  return {
    correo:document.querySelector('#email').value.trim().toLowerCase(),
    nombre_completo:document.querySelector('#fullName').value.trim(),
    documento:document.querySelector('#documentId').value.trim(),
    direccion:[
      document.querySelector('#street').value.trim(),
      document.querySelector('#streetNumber').value.trim(),
      document.querySelector('#district').value.trim(),
      document.querySelector('#city').value.trim()
    ].join(', '),
    telefono:document.querySelector('#phone').value.trim()
  };
}

async function consultarEstadoCulqi(pedidoId,sesionToken,intentos=10){
  let ultimo=null;
  for(let i=0;i<intentos;i++){
    try{
      const {data,error}=await supabaseClient.functions.invoke('consultar-pago-culqi',{
        body:{sesion_token:sesionToken,pedido:pedidoId}
      });
      if(!error&&data?.ok){
        ultimo=data;
        if(['aprobado','rechazado','expirado','reembolsado'].includes(data.estado)) break;
      }
    }catch(error){
      console.error('Consulta del pago con Culqi:',error);
    }
    if(i<intentos-1) await new Promise(resolve=>setTimeout(resolve,3000));
  }
  return ultimo;
}

async function consultarEstadoMercadoPago(pedidoId,sesionToken,intentos=4){
  let ultimo=null;
  for(let i=0;i<intentos;i++){
    try{
      const {data,error}=await supabaseClient.functions.invoke('consultar-pago',{
        body:{sesion_token:sesionToken,pedido:pedidoId}
      });
      if(!error&&data?.ok){
        ultimo=data;
        if(['aprobado','rechazado','expirado','reembolsado','revision'].includes(data.estado)) break;
      }else if(error){
        console.error('Consulta del pago con Mercado Pago:',error);
      }
    }catch(error){
      console.error('Consulta del pago con Mercado Pago:',error);
    }
    if(i<intentos-1) await new Promise(resolve=>setTimeout(resolve,2000));
  }
  return ultimo;
}

let bbRetornoMercadoPagoProcesado=false;
window.addEventListener('bb:privacy-updated',async()=>{
  if(bbRetornoMercadoPagoProcesado) return;
  const url=new URL(window.location.href);
  const resultado=url.searchParams.get('pago');
  const pedidoId=url.searchParams.get('pedido');
  if(!resultado||!pedidoId||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pedidoId)) return;
  bbRetornoMercadoPagoProcesado=true;

  let sesion;
  try{
    sesion=await window.BBPrivacy?.obtenerSesionCliente?.();
  }catch(error){
    console.error('Validación de sesión al volver de Mercado Pago:',error);
    bbRetornoMercadoPagoProcesado=false;
    mostrarBannerPago('pendiente','Pago por confirmar','No pudimos consultar tu sesión. Recarga la página para verificar el pago.');
    return;
  }
  if(!sesion?.ok){
    bbRetornoMercadoPagoProcesado=false;
    mostrarBannerPago('pendiente','Pago por confirmar','Inicia sesión con la cuenta usada para comprar para consultar el estado del pedido.');
    return;
  }

  const estado=await consultarEstadoMercadoPago(pedidoId,sesion.access_token);
  if(estado?.estado==='aprobado'){
    vaciarCarritoTrasPago();
    mostrarBannerPago('exito','¡Pago confirmado!',`Tu compra quedó registrada. Pedido ${estado.numero_pedido}.`);
  }else if(['rechazado','expirado'].includes(estado?.estado)){
    mostrarBannerPago('fallo','El pago no se completó','Puedes volver al carrito e intentarlo nuevamente con Mercado Pago.');
  }else if(estado?.estado==='reembolsado'){
    mostrarBannerPago('info','Pago reembolsado',`Mercado Pago registró un reembolso para el pedido ${estado.numero_pedido}.`);
  }else if(estado?.estado==='revision'){
    mostrarBannerPago('pendiente','Pago en revisión','Mercado Pago recibió el pago, pero Byte Bay debe verificarlo antes de confirmar el pedido. No intentes pagarlo otra vez.');
  }else{
    mostrarBannerPago('pendiente','Pago pendiente de confirmación','Mercado Pago todavía no confirma el pago. No vuelvas a pagar; puedes consultar el estado más tarde.');
  }

  url.searchParams.delete('pago');
  url.searchParams.delete('pedido');
  window.history.replaceState({},'',url);
});

function finalizarPagoCulqi(resultado){
  const numero=resultado?.numero_pedido?` Pedido ${resultado.numero_pedido}.`:'';
  if(resultado?.estado==='aprobado'){
    bbCulqiPedido=null;
    vaciarCarritoTrasPago();
    mostrarBannerPago('exito','¡Pago confirmado!',`Tu compra quedó registrada.${numero} Te contactaremos para coordinar la entrega.`);
    closeCheckout();
    return true;
  }
  if(resultado?.estado==='rechazado'||resultado?.estado==='expirado'){
    bbCulqiPedido=null;
    mostrarBannerPago('fallo','El pago no se completó',`Puedes volver a intentarlo desde tu carrito.${numero}`);
    setPaymentStep(2);
    return true;
  }
  if(resultado?.estado==='reembolsado'){
    bbCulqiPedido=null;
    mostrarBannerPago('info','Pago reembolsado',`Culqi registró un reembolso para este pedido.${numero}`);
    setPaymentStep(2);
    return true;
  }
  return false;
}

function abrirCheckoutCulqi(pendiente){
  if(!culqiDisponible()){
    setPaymentStep(2);
    showToast('El formulario de pago aún está cargando. Recarga la página e inténtalo nuevamente.');
    return;
  }
  try{
    window.Culqi.publicKey=pendiente.publicKey;
    window.Culqi.settings({
      title:'Byte Bay',
      currency:'PEN',
      amount:pendiente.totalCentimos,
      description:`Pedido ${pendiente.numeroPedido}`
    });
    window.Culqi.options({
      lang:'es',
      installments:false,
      paymentMethods:{
        tarjeta:true,
        yape:true,
        bancaMovil:false,
        agente:false,
        billetera:false,
        cuotealo:false
      },
      style:{
        logo:'https://zzz000zzz555.github.io/Byte-Bay-web/byte-bay-logo-transparent.png',
        bannerColor:'#0b1220',
        buttonBackground:'#1f6feb',
        menuColor:'#1f6feb',
        linksColor:'#1f6feb',
        buttonText:'Pagar',
        buttonTextColor:'#ffffff',
        priceColor:'#0b1220'
      }
    });
    setPaymentStep(2);
    window.Culqi.open();
  }catch(error){
    console.error('No se pudo abrir Culqi Checkout:',error);
    setPaymentStep(2);
    showToast('No se pudo abrir el formulario de pago. Inténtalo nuevamente.');
  }
}

window.culqi=async function(){
  const pendiente=bbCulqiPedido;
  if(!pendiente||bbCulqiProcesando) return;

  if(window.Culqi?.token?.id){
    const token=window.Culqi.token.id;
    try{window.Culqi.close();}catch(error){console.error('No se pudo cerrar Culqi Checkout:',error);}
    bbCulqiProcesando=true;
    setPaymentStep(3);
    // Refresca el token de sesión antes de cobrar: evita 401 si la sesión
    // se renovó mientras el cliente llenaba los datos de la tarjeta.
    const sesionActual=await window.BBPrivacy?.obtenerSesionCliente?.();
    if(sesionActual?.ok&&sesionActual.access_token){
      pendiente.sesionToken=String(sesionActual.access_token).replace(/\\s+/g,'');
    }
    try{
      const {data,error}=await supabaseClient.functions.invoke('cobrar-culqi',{
        body:{
          sesion_token:pendiente.sesionToken,
          pedido_id:pendiente.pedidoId,
          token
        }
      });

      if(error){
        let detalle='No se pudo completar el pago.';
        let codigo='';
        try{
          const cuerpo=await error.context?.clone()?.json();
          detalle=cuerpo?.error||detalle;
          codigo=cuerpo?.codigo||'';
        }catch(parseError){}
        console.error('Cobro con Culqi:',error);

        if(codigo==='AMBIGUO'){
          showToast('Estamos verificando el pago…');
          const estado=await consultarEstadoCulqi(pendiente.pedidoId,pendiente.sesionToken,6);
          if(estado&&finalizarPagoCulqi(estado)) return;
          mostrarBannerPago('pendiente','Pago pendiente de confirmación','No vuelvas a pagar todavía. Te avisaremos cuando se confirme.');
          setPaymentStep(2);
          return;
        }

        bbCulqiPedido=null;
        setPaymentStep(2);
        showToast(detalle);
        return;
      }

      if(data?.ok===false&&data?.estado==='rechazado'){
        bbCulqiPedido=null;
        setPaymentStep(2);
        mostrarBannerPago('fallo','El pago fue rechazado',data.error||'Revisa los datos en Culqi e inténtalo nuevamente.');
        showToast(data.error||'El pago fue rechazado.');
        return;
      }

      if(data?.ok){
        const estado=await consultarEstadoCulqi(pendiente.pedidoId,pendiente.sesionToken,data.estado==='aprobado'?1:10);
        if(estado&&finalizarPagoCulqi(estado)) return;
        if(!estado&&data.estado==='aprobado'){
          bbCulqiPedido=null;
          vaciarCarritoTrasPago();
          mostrarBannerPago('exito','¡Pago confirmado!',`Tu compra quedó registrada. Pedido ${pendiente.numeroPedido}.`);
          closeCheckout();
          return;
        }
        mostrarBannerPago('pendiente','Pago pendiente de confirmación',`Pedido ${pendiente.numeroPedido}. Te avisaremos cuando se acredite; no vuelvas a pagar.`);
        setPaymentStep(2);
        return;
      }

      setPaymentStep(2);
      showToast('No se pudo completar el pago. Inténtalo nuevamente.');
    }catch(error){
      console.error('Cobro con Culqi:',error);
      setPaymentStep(2);
      showToast('No se pudo completar el pago. Revisa tu conexión e inténtalo nuevamente.');
    }finally{
      bbCulqiProcesando=false;
    }
    return;
  }

  if(window.Culqi?.order){
    try{window.Culqi.close();}
    catch(error){console.error('No se pudo cerrar Culqi Checkout:',error);}
    mostrarBannerPago('pendiente','Pago pendiente de confirmación','Te avisaremos cuando Culqi confirme la operación.');
    setPaymentStep(2);
    return;
  }

  const detalle=window.Culqi?.error?.user_message
    ||window.Culqi?.error?.merchant_message
    ||'No se pudo validar el pago. Revisa los datos en Culqi e inténtalo nuevamente.';
  console.error('Culqi Checkout:',window.Culqi?.error);
  showToast(detalle);
};

document.querySelector('#payNow').onclick=async()=>{
  if(bbPaymentCreating||bbCulqiCreando||bbCulqiProcesando||bbPaymentSessionChecking) return;
  const count=cart.reduce((a,x)=>a+x.qty,0);
  if(!count){
    showToast('Agrega productos antes de pagar');
    return;
  }
  const required=['#fullName','#documentId','#street','#streetNumber','#district','#city','#email','#phone'];
  const missing=required.find(sel=>!document.querySelector(sel).value.trim());
  if(missing){
    showToast('Completa los datos de pago y entrega');
    document.querySelector(missing).focus();
    return;
  }
  const correoCheckout=document.querySelector('#email').value.trim();
  const telefonoCheckout=document.querySelector('#phone').value.replace(/\D/g,'');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correoCheckout)){
    showToast('Ingresa un correo electrónico válido.');
    document.querySelector('#email').focus();
    return;
  }
  if(telefonoCheckout.length<9){
    showToast('Ingresa un teléfono válido de 9 dígitos.');
    document.querySelector('#phone').focus();
    return;
  }
  if(!supabaseClient){
    showToast('No se puede registrar la compra: la BD no está conectada.');
    return;
  }
  const proveedor=proveedorPagoSeleccionado();
  if(proveedor==='culqi'){
    showToast('Culqi está temporalmente desactivado. Paga con Mercado Pago.');
    return;
  }
  bbPaymentSessionChecking=true;
  let sesionCompra;
  try{
    sesionCompra=await window.BBPrivacy?.obtenerSesionCliente?.();
  }catch(error){
    console.error('Validación de sesión al iniciar el pago:',error);
    showToast('No pudimos validar tu sesión. Inténtalo nuevamente.');
    return;
  }finally{
    bbPaymentSessionChecking=false;
  }
  if(!sesionCompra?.ok){
    if(['SERVICIO_NO_DISPONIBLE','VALIDACION_NO_DISPONIBLE'].includes(sesionCompra?.error)){
      showToast('No pudimos validar tu sesión ahora. El carrito y tus datos se conservaron; inténtalo nuevamente.');
      return;
    }
    showToast('Tu sesión no es válida. Inicia sesión con tu cuenta Byte Bay para comprar; tu carrito se conservó.');
    closeCheckout();
    openAccountModal(true);
    return;
  }

  const cliente=datosClienteCheckout();
  const cupon=activeCoupon||'';
  const firma=[
    firmaCarritoCompra(),
    cliente.correo,
    cliente.nombre_completo,
    cliente.documento,
    cliente.direccion,
    cliente.telefono,
    cupon
  ].join('|');

  if(proveedor==='mercado_pago'){
    setPaymentStep(3);
    bbPaymentCreating=true;
    try{
      const {data,error}=await supabaseClient.functions.invoke('crear-pago',{
        body:{
          articulos:cart.map(item=>({id_producto:item.id,cantidad:item.qty})),
          cliente,
          cupon,
          sesion_token:sesionCompra.access_token
        }
      });

      if(error||!data?.ok||!data?.checkout_url){
        let detalle=data?.error||error?.message||'Mercado Pago no pudo iniciar el pago.';
        try{
          const cuerpo=await error?.context?.clone()?.json();
          detalle=cuerpo?.error||detalle;
        }catch(parseError){}
        console.error('Inicio de pago con Mercado Pago:',error||data);
        setPaymentStep(2);
        showToast(detalle);
        return;
      }

      let checkoutUrl;
      try{
        checkoutUrl=new URL(data.checkout_url);
      }catch(error){
        console.error('Mercado Pago devolvió una URL inválida:',error);
        setPaymentStep(2);
        showToast('Mercado Pago devolvió un enlace de pago no válido.');
        return;
      }
      const host=checkoutUrl.hostname.toLowerCase();
      if(checkoutUrl.protocol!=='https:'||![
        'mercadopago.com',
        'mercadopago.com.pe',
        'mercadolibre.com'
      ].some(domain=>host===domain||host.endsWith(`.${domain}`))){
        console.error('Mercado Pago devolvió un dominio de pago no autorizado:',host);
        setPaymentStep(2);
        showToast('No se pudo validar el enlace seguro de Mercado Pago.');
        return;
      }
      window.location.assign(checkoutUrl.href);
    }catch(error){
      console.error('Inicio de pago con Mercado Pago:',error);
      setPaymentStep(2);
      showToast('No se pudo iniciar el pago con Mercado Pago. Inténtalo nuevamente.');
    }finally{
      bbPaymentCreating=false;
    }
    return;
  }

  /* Bloque de Culqi temporalmente desactivado. Restaurar cuando se aprueben los tokens. */
  if(!CULQI_HABILITADO){
    setPaymentStep(2);
    showToast('Culqi está temporalmente desactivado. Paga con Mercado Pago.');
    return;
  }

  if(bbCulqiPedido&&bbCulqiPedido.firma===firma&&Date.now()<bbCulqiPedido.expiraEnMs){
    abrirCheckoutCulqi(bbCulqiPedido);
    return;
  }

  setPaymentStep(3);
  bbCulqiCreando=true;
  try{
    const {data,error}=await supabaseClient.functions.invoke('crear-pago-culqi',{
      body:{
        articulos:cart.map(item=>({id_producto:item.id,cantidad:item.qty})),
        cliente,
        cupon,
        sesion_token:sesionCompra.access_token
      }
    });

    if(error||!data?.pedido_id||!data?.public_key){
      let detalle=data?.error||error?.message||'No se pudo iniciar el pago.';
      try{
        const cuerpo=await error?.context?.clone()?.json();
        detalle=cuerpo?.error||detalle;
      }catch(parseError){}
      console.error('Inicio de pago con Culqi:',error||data);
      setPaymentStep(2);
      showToast(detalle);
      return;
    }

    const expira=Date.parse(data.expira_en);
    bbCulqiPedido={
      pedidoId:data.pedido_id,
      numeroPedido:data.numero_pedido,
      totalCentimos:Number(data.total_centimos),
      publicKey:data.public_key,
      sesionToken:String(sesionCompra.access_token).replace(/\\s+/g,''),
      firma,
      expiraEnMs:Number.isFinite(expira)?expira-10000:Date.now()+10*60*1000
    };
    abrirCheckoutCulqi(bbCulqiPedido);
  }catch(error){
    console.error('Inicio de pago con Culqi:',error);
    setPaymentStep(2);
    showToast('No se pudo iniciar el pago. Revisa tu conexión e inténtalo nuevamente.');
  }finally{
    bbCulqiCreando=false;
  }
};

document.querySelector('#saveCheckout').onclick=()=>showToast('Tu compra quedó guardada para continuar después');

async function openProductModal(id){
  lastViewedProduct=products.find(p=>p.id===id);
  if(!lastViewedProduct) return;
  registrarProductoVisto(id);

  modalImage.src=imagenSegura(lastViewedProduct.img);
  modalImage.onerror=()=>{modalImage.onerror=null;modalImage.src=IMAGEN_PRODUCTO_RESPALDO;};
  modalImage.alt=lastViewedProduct.name;
  // galeria estilo Coolbox: miniaturas verticales + imagen principal + flechas + dots

  const angleLabel=document.querySelector('#modalAngleLabel');
  const mediaContainer=document.querySelector('#modalMediaThumbs');
  const prevBtn=document.querySelector('#galleryPrev');
  const nextBtn=document.querySelector('#galleryNext');
  const dotsContainer=document.querySelector('#galleryDots');
  let galleryImages=[];
  let galleryIndex=0;
  const setMain=(idx)=>{
    if(!galleryImages.length) return;
    galleryIndex=Math.max(0,Math.min(idx,galleryImages.length-1));
    const item=galleryImages[galleryIndex];
    modalImage.src=imagenSegura(item.url);
    modalImage.alt=lastViewedProduct.name;
    if(angleLabel) angleLabel.textContent='Ángulo actual: '+(item.angulo||'Vista Frontal');
    // update active thumb
    mediaContainer.querySelectorAll('.coolbox-thumb').forEach((btn,i)=>btn.classList.toggle('active',i===galleryIndex));
    // dots
    if(dotsContainer){
      dotsContainer.innerHTML=galleryImages.map((_,i)=>`<span class="gallery-dot ${i===galleryIndex?'active':''}"></span>`).join('');
    }
    // arrows visibility
    if(prevBtn) prevBtn.style.display=galleryImages.length>1?'flex':'none';
    if(nextBtn) nextBtn.style.display=galleryImages.length>1?'flex':'none';
  };
  modalImage.src=imagenSegura(lastViewedProduct.img);
  modalImage.onerror=()=>{modalImage.onerror=null;modalImage.src=IMAGEN_PRODUCTO_RESPALDO;};
  modalImage.alt=lastViewedProduct.name;
  if(angleLabel){ angleLabel.style.display='none'; }
  // build unique image list
  const uniqueUrls=new Set();
  const list=[];
  const addImg=(url,angulo='Vista Frontal',tipo='imagen')=>{
    if(!url) return;
    if(uniqueUrls.has(url)) return;
    uniqueUrls.add(url);
    list.push({url,angulo,tipo});
  };
  addImg(lastViewedProduct.img,'Vista Frontal','imagen');
  if(lastViewedProduct.videoUrl) addImg(lastViewedProduct.videoUrl,'Video de presentación','video');
  galleryImages=list;
  if(mediaContainer){
    mediaContainer.innerHTML='';
    // fetch product_media for more angles
    (async()=>{
      if(supabaseClient){
        const {data}=await supabaseClient.from('product_media').select('url,tipo,angulo,orden').eq('id_producto',lastViewedProduct.id).order('orden',{ascending:true});
        (data||[]).forEach(m=>{ if(m.url) addImg(m.url,m.angulo||'Ángulo',m.tipo||'imagen'); });
      }
      galleryImages=[...list];
      // render thumbs
      if(galleryImages.length<=1){ mediaContainer.style.display='none'; if(prevBtn) prevBtn.style.display='none'; if(nextBtn) nextBtn.style.display='none'; if(dotsContainer) dotsContainer.style.display='none'; }
      else { mediaContainer.style.display='flex'; mediaContainer.innerHTML=galleryImages.map((item,i)=>`<button type="button" class="coolbox-thumb ${i===0?'active':''}" data-idx="${i}"><img src="${escapeHtml(imagenSegura(item.url))}" alt="Vista del producto: ${escapeHtml(item.angulo||'imagen')}" loading="lazy" decoding="async"></button>`).join(''); }
      mediaContainer.querySelectorAll('.coolbox-thumb').forEach(btn=>btn.onclick=()=>setMain(Number(btn.dataset.idx)));
      setMain(0);
    })();
  }
  if(prevBtn) prevBtn.onclick=()=>setMain(galleryIndex-1);
  if(nextBtn) nextBtn.onclick=()=>setMain(galleryIndex+1);
  document.querySelector('#modalBrand').textContent=`${lastViewedProduct.brand} · ${lastViewedProduct.category}`;
  document.querySelector('#modalName').textContent=lastViewedProduct.name;
  const enlaceWhatsApp=document.querySelector('#productWhatsApp');
  if(enlaceWhatsApp){
    const mensaje='Hola Byte-Bay, me interesa comprar el producto: '+lastViewedProduct.name+'. ¿Tienen stock?';
    enlaceWhatsApp.href='https://wa.me/51963058461?text='+encodeURIComponent(mensaje);
  }
  document.querySelector('#modalRating').innerHTML=ratingMarkup(lastViewedProduct.rating);
  document.querySelector('#modalPrice').textContent=money(lastViewedProduct.price);
  const pumEl=document.querySelector('#modalPum'); if(pumEl) pumEl.textContent=calcularPUM(lastViewedProduct);
  const modalOld=document.querySelector('#modalOld');
  if(modalOld){
    if(Number(lastViewedProduct.old)>Number(lastViewedProduct.price)){
      modalOld.textContent=money(lastViewedProduct.old);
      modalOld.style.display='';
    } else {
      modalOld.textContent='';
      modalOld.style.display='none';
    }
  }
  const descEl=document.querySelector('#modalDescription');
  if(descEl){
    const blocks=[];
    if(lastViewedProduct.shortPresentation) blocks.push(`<p><strong>¿Qué es?</strong> ${escapeHtml(lastViewedProduct.shortPresentation)}</p>`);
    if(lastViewedProduct.verifiableFeatures) blocks.push(`<p><strong>¿Qué ofrece?</strong> ${escapeHtml(lastViewedProduct.verifiableFeatures)}</p>`);
    if(lastViewedProduct.benefitsSummary) blocks.push(`<p><strong>Beneficios:</strong> ${escapeHtml(lastViewedProduct.benefitsSummary)}</p>`);
    if(!blocks.length) blocks.push(`<p>${escapeHtml(lastViewedProduct.description||'Consulta las características principales de este producto antes de añadirlo al carrito.')}</p>`);
    descEl.innerHTML=blocks.join('');
  }
  let specs=lastViewedProduct.specs||{};
  if(!Object.keys(specs).length){
    specs={'Marca':lastViewedProduct.brand,'Categoría':lastViewedProduct.category,'Género':lastViewedProduct.gender||'Mixto','Stock en vivo':lastViewedProduct.stock+' unidades'};
  }
  const specsHtml=Object.keys(specs).length?`<div class="modal-specs"><strong>Especificaciones técnicas</strong><dl>${Object.entries(specs).map(([k,v])=>`<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('')}</dl>${lastViewedProduct.videoUrl?`<p><a href="${escapeHtml(lastViewedProduct.videoUrl)}" target="_blank" rel="noopener">Ver video de presentación</a></p>`:''}</div>`:'';
  const modalSpecs=document.querySelector('#modalSpecs'); if(modalSpecs) modalSpecs.innerHTML=specsHtml;
  const variantesEl=document.querySelector('#modalVariantes'); if(variantesEl){
    variantesEl.innerHTML='Cargando opciones...';
    if(supabaseClient){
      const {data}=await supabaseClient.from('catalogo_productos').select('id,nombre,precio_venta,url_imagen').eq('marca',lastViewedProduct.brand).eq('categoria',lastViewedProduct.category).neq('id',lastViewedProduct.id).limit(8);
      const vars=data||[];
      if(vars.length){
        variantesEl.innerHTML='<strong>Otras opciones disponibles:</strong><div class="variant-chips">'+vars.map(v=>`<button class="variant-chip" data-id="${v.id}">${escapeHtml(v.nombre)} - S/ ${Number(v.precio_venta).toFixed(2)}</button>`).join('')+'</div>';
        variantesEl.querySelectorAll('.variant-chip').forEach(b=>b.onclick=()=>openProductModal(Number(b.dataset.id)));
      } else variantesEl.innerHTML='';
    } else variantesEl.innerHTML='';
  }
  // size guide button
  const sizeGuideBtn=document.querySelector('#sizeGuideBtn');
  if(sizeGuideBtn){
    const cat=String(lastViewedProduct.category||'').toLowerCase();
    const show=/moda|ropa|calzado|zapatilla/.test(cat);
    sizeGuideBtn.style.display=show?'inline-block':'none';
    sizeGuideBtn.onclick=()=>{const d=document.querySelector('#sizeGuideDialog'); if(d) d.showModal();};
  }
  const disponibilidad=document.querySelector('#modalAvailability');
  disponibilidad.className=`availability ${lastViewedProduct.stock<=0?'unavailable':lastViewedProduct.stock<=5?'low-stock':''}`;
  disponibilidad.textContent=lastViewedProduct.stock<=0?'Producto agotado':lastViewedProduct.stock<=5?`Últimas ${lastViewedProduct.stock} unidades`:'Disponible para entrega';
  const qtyInput=document.querySelector('#modalQty');
  if(qtyInput){qtyInput.value='1';qtyInput.max=lastViewedProduct.stock||1;}
  const syncQty=delta=>{
    if(!qtyInput||!lastViewedProduct) return;
    const next=Math.max(1,Math.min(Number(qtyInput.value||1)+delta,lastViewedProduct.stock||1));
    qtyInput.value=next;
  };
  document.querySelector('#modalQtyMinus')?.addEventListener('click',()=>syncQty(-1),{once:true});
  // bind fresh handlers by replacing nodes to avoid duplicates
  const minus=document.querySelector('#modalQtyMinus'), plus=document.querySelector('#modalQtyPlus');
  if(minus){const m=minus.cloneNode(true);minus.replaceWith(m);m.addEventListener('click',()=>syncQty(-1));}
  if(plus){const pl=plus.cloneNode(true);plus.replaceWith(pl);pl.addEventListener('click',()=>syncQty(1));}
  document.querySelector('#modalAddToCart').disabled=lastViewedProduct.stock<=0;
  document.querySelector('#modalAddToCart').textContent=lastViewedProduct.stock<=0?'Producto agotado':'Agregar al carrito';
  document.querySelector('#modalAddToCart').onclick=()=>{const q=Number(document.querySelector('#modalQty')?.value||1);addToCart(lastViewedProduct.id,q);closeProductModal();};
  const cuenta=leerJSON('beruAccount',null);
  const usaGoogle=cuenta?.provider==='google';
  document.querySelector('#productCommentForm').reset();
  actualizarCalificacionComentario();
  actualizarContadorComentario();
   document.querySelector('#commentStatus').textContent=cuenta?.verified?'Tu cuenta está verificada. La reseña quedará pendiente de revisión.':'Debes iniciar sesión. Las reseñas se publican después de la revisión.';
  cargarComentariosProducto(lastViewedProduct.id);
  document.querySelectorAll('[data-review-filter]').forEach(btn=>{btn.onclick=()=>{document.querySelectorAll('[data-review-filter]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');cargarComentariosProducto(lastViewedProduct.id,btn.dataset.reviewFilter);};});
  document.querySelector('#productModal').classList.add('open');
  document.querySelector('#productModal').setAttribute('aria-hidden','false');
}

document.querySelector('#productCommentForm').onsubmit=async event=>{
  event.preventDefault();
  const cuenta=leerJSON('beruAccount',null);
  const estado=document.querySelector('#commentStatus');
  if(!cuenta?.verified||!cuenta.email){estado.textContent='Inicia sesión como cliente antes de comentar.';return;}
  if(!lastViewedProduct){estado.textContent='No hay un producto seleccionado.';return;}
  if(window.BBPrivacy?.validarParaAccion){
    const sesionValida=await window.BBPrivacy.validarParaAccion();
    if(!sesionValida){estado.textContent='Tu sesión expiró. Vuelve a iniciar sesión para publicar tu reseña.';return;}
  }
  const boton=event.target.querySelector('button[type="submit"]');
  boton.disabled=true;
   const rpc=cuenta.provider==='google'?'guardar_comentario_producto_google':'guardar_comentario_producto_sesion';
   const sesionComentario=await window.BBPrivacy?.obtenerSesionCliente?.();
   const parametros=cuenta.provider==='google'?{p_id_producto:lastViewedProduct.id,p_calificacion:Number(document.querySelector('input[name="commentRating"]:checked').value),p_comentario:document.querySelector('#commentText').value.trim()}:{p_id_producto:lastViewedProduct.id,p_access_token:sesionComentario?.access_token,p_calificacion:Number(document.querySelector('input[name="commentRating"]:checked').value),p_comentario:document.querySelector('#commentText').value.trim()};
  const {error}=await supabaseClient.rpc(rpc,parametros);
  boton.disabled=false;
  if(error){estado.textContent=error.message||'No se pudo guardar el comentario.';return;}
  event.target.reset();
  actualizarCalificacionComentario();
  actualizarContadorComentario();
  estado.textContent='Comentario recibido. Quedó pendiente de revisión.';
};

const textosCalificacion={1:'Muy malo · 1 de 5',2:'Regular · 2 de 5',3:'Aceptable · 3 de 5',4:'Muy bueno · 4 de 5',5:'Excelente · 5 de 5'};
function actualizarCalificacionComentario(){
  const valor=document.querySelector('input[name="commentRating"]:checked')?.value||'5';
  document.querySelector('#commentRatingText').textContent=textosCalificacion[valor];
}
function actualizarContadorComentario(){
  const texto=document.querySelector('#commentText');
  document.querySelector('#commentCounter').textContent=`${texto.value.length} / 2000`;
}
document.querySelectorAll('input[name="commentRating"]').forEach(estrella=>estrella.addEventListener('change',actualizarCalificacionComentario));
document.querySelector('#commentText').addEventListener('input',actualizarContadorComentario);

function closeProductModal(){
  document.querySelector('#productModal').classList.remove('open');
  document.querySelector('#productModal').setAttribute('aria-hidden','true');
}

document.querySelector('#closeProductModal').onclick=closeProductModal;
document.querySelector('#productModal').addEventListener('click',e=>{if(e.target.id==='productModal') closeProductModal();});

function showToast(text='Producto agregado al carrito'){
  const t=document.querySelector('#toast');
  t.textContent=text;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}

function showStickyNotice(text){
  let el=document.querySelector('#stickyNotice');
  if(!el){
    el=document.createElement('div');
    el.id='stickyNotice';
    el.className='sticky-notice';
    document.body.appendChild(el);
  }
  el.textContent=text;
  el.classList.add('show');
  clearTimeout(window.__stickyNoticeTimer);
  window.__stickyNoticeTimer=setTimeout(()=>el.classList.remove('show'),3500);
}

function mostrarBannerPago(estado,titulo,detalle){
  let banner=document.querySelector('#paymentReturnBanner');
  if(!banner){
    banner=document.createElement('section');
    banner.id='paymentReturnBanner';
    banner.className='payment-return-banner';
    banner.setAttribute('role','status');
    banner.setAttribute('aria-live','polite');
    banner.innerHTML='<div class="payment-return-copy"><strong></strong><p></p></div><button type="button" aria-label="Cerrar aviso">×</button>';
    banner.querySelector('button').addEventListener('click',()=>banner.remove());
    document.body.appendChild(banner);
  }
  banner.dataset.estado=estado;
  banner.querySelector('strong').textContent=titulo;
  const texto=banner.querySelector('p');
  texto.textContent=detalle||'';
  texto.hidden=!detalle;
}

function vaciarCarritoTrasPago(){
  try{localStorage.removeItem(CART_STORAGE_KEY);}
  catch(error){console.error('No se pudo limpiar el carrito tras el pago:',error);}
  cart=[];
  const cupon=document.querySelector('#couponInput');
  if(cupon) cupon.value='';
  discountRate=0;
  try{updateCart();}
  catch(error){console.error('No se pudo actualizar el carrito tras el pago:',error);}
}

function configurarAsistenteIA(){
  const panel=document.querySelector('#aiAssistantPanel'),boton=document.querySelector('#aiAssistantToggle'),chat=document.querySelector('#aiChat'),formulario=document.querySelector('#aiAssistantForm'),entrada=document.querySelector('#aiAssistantInput');
  const abrir=()=>{panel.classList.remove('hidden');entrada.focus();};
  boton.onclick=abrir;document.querySelector('#aiAssistantClose').onclick=()=>panel.classList.add('hidden');
  document.querySelector('#settingsAssistantOpen')?.addEventListener('click',()=>{
    document.querySelector('#settingsClose')?.click();
    window.setTimeout(abrir,350);
  });
  const agregarMensaje=(texto,tipo)=>{const mensaje=document.createElement('article');mensaje.className=`ai-message ${tipo}`;mensaje.textContent=texto;chat.appendChild(mensaje);chat.scrollTop=chat.scrollHeight;return mensaje;};
  const agregarProductosRecomendados=productosRecomendados=>{
    const productosValidos=(productosRecomendados||[]).map(item=>products.find(producto=>Number(producto.id)===Number(item.id))).filter(Boolean);
    if(!productosValidos.length) return;
    const contenedor=document.createElement('div');contenedor.className='ai-product-links';
    contenedor.innerHTML=productosValidos.map(producto=>`<button type="button" data-ai-product="${Number(producto.id)}"><img src="${escapeHtml(imagenSegura(producto.img))}" alt="Imagen de ${escapeHtml(producto.name)}" loading="lazy" decoding="async"><span><strong>${escapeHtml(producto.name)}</strong><small>${money(Number(producto.price)||0)} · ${Number(producto.stock)||0} disponibles</small></span><b>Ver →</b></button>`).join('');
    contenedor.querySelectorAll('[data-ai-product]').forEach(botonProducto=>botonProducto.onclick=()=>{panel.classList.add('hidden');openProductModal(Number(botonProducto.dataset.aiProduct));});
    chat.appendChild(contenedor);chat.scrollTop=chat.scrollHeight;
  };
  const consultarAsistente=async mensaje=>{
    const {data,error}=await supabaseClient.functions.invoke('asistente-bytebay',{body:{mensaje}});
    if(error||data?.error){
      let detalle=data?.error||error?.message||'El asistente no pudo responder.';
      let estado=Number(error?.context?.status)||0;
      try{const cuerpo=await error?.context?.clone()?.json();detalle=cuerpo?.error||detalle;if(cuerpo?.reintentar&&!estado) estado=503;}catch(e){}
      const fallo=new Error(detalle);fallo.estado=estado;throw fallo;
    }
    return data;
  };
  const preguntar=async texto=>{
    if(!texto?.trim()) return;
    abrir();agregarMensaje(texto.trim(),'user');entrada.value='';
    const esperando=agregarMensaje('Buscando opciones en Byte Bay…','assistant');
    document.dispatchEvent(new CustomEvent('bytebay:ai-thinking'));
    try{
      if(!supabaseClient) throw new Error('No se pudo conectar con el asistente.');
      let data;
      try{data=await consultarAsistente(texto.trim());}
      catch(error){
        // Reintento silencioso si Gemini está saturado (503) o sin cuota momentánea (429).
        if(![429,503].includes(error.estado)) throw error;
        esperando.textContent='La IA está ocupada, reintentando…';
        await new Promise(resolver=>setTimeout(resolver,1500));
        data=await consultarAsistente(texto.trim());
      }
      esperando.textContent=data.respuesta;
      document.dispatchEvent(new CustomEvent('bytebay:ai-response',{detail:{respuesta:data.respuesta}}));
      agregarProductosRecomendados(data.productos);
    }catch(error){esperando.textContent=`No puedo responder ahora: ${String(error.message||'').replace(/[.\s]+$/,'')}. Intenta nuevamente en unos minutos.`;}
    document.dispatchEvent(new CustomEvent('bytebay:ai-done'));
  };
  formulario.onsubmit=evento=>{evento.preventDefault();preguntar(entrada.value);};
  document.querySelectorAll('[data-ai-question]').forEach(botonSugerencia=>botonSugerencia.onclick=()=>preguntar(botonSugerencia.dataset.aiQuestion));
  document.querySelectorAll('[data-ai-prompt]').forEach(botonPrompt=>botonPrompt.onclick=()=>preguntar(botonPrompt.dataset.aiPrompt));
}

if(notificationSubscription){
  const wantsGuardados=Array.isArray(notificationSubscription.wants)?notificationSubscription.wants:[];
  document.querySelector('#notifyEmail').value=notificationSubscription.email||'';
  document.querySelector('#notifyDeals').checked=wantsGuardados.includes('ofertas');
  document.querySelector('#notifyDrops').checked=wantsGuardados.includes('novedades');
  document.querySelector('#notifyStock').checked=wantsGuardados.includes('stock');
  showStickyNotice(`Suscripción cargada para ${notificationSubscription.email||'tu correo'}`);
}
showNotificationStatus();
updateAccountHeader();
configurarConsentimientoPersonalizacion();
configurarAsistenteIA();
iniciarCarruselHero();
renderProducts();
renderizarPersonalizacion();
if(cart.length){
  if(!updateCart()) showToast('No se pudo guardar el carrito en este dispositivo.');
}
loadCatalogFromSupabase();
if(!supabaseClient){
  showToast('Conexión fallida a la BD.');
}else{
  showToast('Conexión a la BD exitosa.');
}

/* --------------------------------------------------------------------------
   API pública para site-privacy.js. Mantiene una sola fuente de verdad para
   catálogo, tarjetas, carrito y avisos sin duplicar lógica.
   -------------------------------------------------------------------------- */
window.BBStore={
  get products(){return products;},
  get cart(){return cart;},
  client:supabaseClient,
  card:tarjetaProducto,
  bindCards,
  toast:showToast,
  escapeHtml,
  money,
  openAccountModal,
  updateAccountHeader,
  refreshPersonalization:renderizarPersonalizacion,
  addToCart,
};
window.dispatchEvent(new Event('bb:store-ready'));
