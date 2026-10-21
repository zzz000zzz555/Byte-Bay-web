const categories=[
  {name:'Supermercado',count:'2,480 productos',img:'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=300&q=80'},
  {name:'Tecnología',count:'1,250 productos',img:'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=300&q=80'},
  {name:'Electrohogar',count:'860 productos',img:'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=300&q=80'},
  {name:'Hogar',count:'1,720 productos',img:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80'},
  {name:'Moda',count:'3,140 productos',img:'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=300&q=80'},
  {name:'Belleza',count:'920 productos',img:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=300&q=80'},
  {name:'Deportes',count:'690 productos',img:'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=300&q=80'},
  {name:'Bebés',count:'540 productos',img:'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=300&q=80'},
  {name:'Mascotas',count:'380 productos',img:'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=300&q=80'},
  {name:'Juguetes',count:'620 productos',img:'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=300&q=80'},
  {name:'Ferretería',count:'910 productos',img:'https://images.unsplash.com/photo-1581147036324-c3f2d9b2f6aa?auto=format&fit=crop&w=300&q=80'}
];
const IMAGEN_PRODUCTO_RESPALDO='imagen-producto-predeterminada.svg';
const IMAGEN_CATEGORIA_RESPALDO='imagen-categoria-predeterminada.svg';
const IMAGEN_QR_RESPALDO='yape-qr-pendiente.svg';
const imagenSegura=(url,respaldo=IMAGEN_PRODUCTO_RESPALDO)=>url||respaldo;
const atributoRespaldo=archivo=>`onerror="this.onerror=null;this.src='${archivo}'"`;

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
    boton.querySelector('span').textContent=esNoche?'☀':'☾';
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
  {title:'Todo lo que necesitas, más cerca.',description:'Encuentra marcas, novedades y productos para tu día a día.',image:'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1100&q=85',badgeTop:'DESTACADO',badgeValue:'HOY',badgeBottom:'para ti',label:'Compra fácil',cardTitle:'Recíbelo hoy',cardText:'Explora el catálogo Byte Bay'},
  {title:'Tecnología que se adapta a ti.',description:'Descubre equipos y accesorios para estudiar, trabajar y disfrutar.',image:'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1100&q=85',badgeTop:'NUEVO',badgeValue:'VER',badgeBottom:'tecnología',label:'Selección Byte Bay',cardTitle:'Compra inteligente',cardText:'Mira productos disponibles'},
  {title:'Renueva cada rincón de tu hogar.',description:'Ideas prácticas para crear un espacio más cómodo.',image:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1100&q=85',badgeTop:'HOGAR',badgeValue:'TOP',badgeBottom:'selección',label:'Para tu hogar',cardTitle:'Encuentra inspiración',cardText:'Productos para cada ambiente'},
  {title:'Lo mejor para tu compra diaria.',description:'Elige productos que hacen más simple tu rutina.',image:'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1100&q=85',badgeTop:'BYTE',badgeValue:'BAY',badgeBottom:'selección',label:'Compra segura',cardTitle:'Todo en un lugar',cardText:'Revisa el catálogo disponible'},
  {title:'Encuentra tu próxima recomendación.',description:'Explora categorías y descubre favoritos de Byte Bay.',image:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1100&q=85',badgeTop:'NUEVO',badgeValue:'5',badgeBottom:'destacados',label:'Para ti',cardTitle:'Explora sin prisa',cardText:'Tenemos opciones para ti'}
];
let heroSlides=[];
let heroSlideIndex=0;
let heroTimer=null;
function crearSlidesHero(){
  const disponibles=products.filter(producto=>producto.stock>0);
  const ordenados=[...disponibles.filter(producto=>Number(producto.discount)>0),...disponibles.filter(producto=>Number(producto.discount)<=0)];
  // La campaña principal siempre es la primera; los otros cuatro espacios se llenan con el catálogo.
  const seleccion=ordenados.length?[HERO_RESPALDO[0],...ordenados.slice(0,4)]:HERO_RESPALDO;
  return seleccion.map(producto=>{
    if(!producto.id) return producto;
    const esOferta=Number(producto.discount)>0;
    return {id:producto.id,isOffer:esOferta,title:producto.name,description:`${producto.brand} · ${producto.category}. ${esOferta?'Precio especial por tiempo limitado.':'Disponible en el catálogo Byte Bay.'}`,image:imagenSegura(producto.img),badgeTop:esOferta?'AHORRA':'DESTACADO',badgeValue:esOferta?`-${producto.discount}%`:'VER',badgeBottom:esOferta?'de descuento':'producto',label:esOferta?'Oferta activa':'Producto destacado',cardTitle:money(producto.price),cardText:`${producto.stock} disponibles`};
  });
}
function mostrarSlideHero(index){
  if(!heroSlides.length) return;
  heroSlideIndex=(index+heroSlides.length)%heroSlides.length;
  const slide=heroSlides[heroSlideIndex],carrusel=document.querySelector('#heroCarousel');
  if(!carrusel) return;
  carrusel.classList.add('hero-changing');
  setTimeout(()=>{
    document.querySelector('#heroEyebrow').textContent=slide.isOffer?'OFERTA BYTE BAY':'BYTE BAY DESTACADO';
    document.querySelector('#heroTitle').textContent=slide.title;
    document.querySelector('#heroDescription').textContent=slide.description;
    document.querySelector('#heroBadge').innerHTML=`<strong>${slide.badgeTop}</strong><b>${slide.badgeValue}</b><span>${slide.badgeBottom}</span>`;
    const imagen=document.querySelector('#heroImage');imagen.src=imagenSegura(slide.image);imagen.alt=slide.title;
    document.querySelector('#heroCardLabel').textContent=slide.label;
    document.querySelector('#heroCardTitle').textContent=slide.cardTitle;
    document.querySelector('#heroCardText').textContent=slide.cardText;
    const accion=document.querySelector('#heroPrimaryAction');accion.textContent=slide.id?'Ver producto':'Explorar catálogo';accion.onclick=evento=>{if(!slide.id) return;evento.preventDefault();openProductModal(slide.id);};
    document.querySelector('#heroDots').innerHTML=heroSlides.map((_,position)=>`<button type="button" class="hero-dot ${position===heroSlideIndex?'active':''}" data-hero-slide="${position}" aria-label="Mostrar destacado ${position+1}" aria-current="${position===heroSlideIndex}"></button>`).join('');
    document.querySelectorAll('[data-hero-slide]').forEach(boton=>boton.onclick=()=>{mostrarSlideHero(Number(boton.dataset.heroSlide));reiniciarCarruselHero();});
    carrusel.classList.remove('hero-changing');
  },150);
}
function reiniciarCarruselHero(){clearInterval(heroTimer);heroTimer=setInterval(()=>mostrarSlideHero(heroSlideIndex+1),6000);}
function iniciarCarruselHero(){
  heroSlides=crearSlidesHero();heroSlideIndex=0;mostrarSlideHero(0);reiniciarCarruselHero();
}
document.querySelector('#heroPrevious').onclick=()=>{mostrarSlideHero(heroSlideIndex-1);reiniciarCarruselHero();};
document.querySelector('#heroNext').onclick=()=>{mostrarSlideHero(heroSlideIndex+1);reiniciarCarruselHero();};
document.querySelector('#heroCarousel').addEventListener('mouseenter',()=>clearInterval(heroTimer));
document.querySelector('#heroCarousel').addEventListener('mouseleave',reiniciarCarruselHero);

let cart=[];
let start=0;
let discountRate=0;
let shippingValue=18;
let activeCategory='all';
let activeQuery='';
let notificationSubscription=JSON.parse(localStorage.getItem('beruNotifications')||'null');
let activeFilter='all';
let soloOfertas=false;
let lastViewedProduct=null;
const favorites=new Set(JSON.parse(localStorage.getItem('beruFavorites')||'[]'));
const PERSONALIZATION_CONSENT_KEY='byteBayPersonalizationConsent';
const VIEWED_PRODUCTS_KEY='byteBayViewedProducts';
let personalizationConsent=localStorage.getItem(PERSONALIZATION_CONSENT_KEY);

function puedePersonalizar(){return personalizationConsent==='aceptado';}
function historialVistos(){try{return JSON.parse(localStorage.getItem(VIEWED_PRODUCTS_KEY)||'[]');}catch(e){return [];}}
function registrarProductoVisto(id){
  if(!puedePersonalizar()) return;
  const historial=historialVistos().filter(item=>Number(item.id)!==Number(id));
  historial.unshift({id:Number(id),visto_en:Date.now()});
  localStorage.setItem(VIEWED_PRODUCTS_KEY,JSON.stringify(historial.slice(0,12)));
  renderizarPersonalizacion();
}
function tarjetaProducto(producto){return `<article class="product-card ${producto.stock<=0?'sold-out':''}" data-id="${producto.id}" data-category="${producto.category}">${Number(producto.discount)>0?`<span class="discount">-${producto.discount}%</span>`:''}<button class="wish ${favorites.has(producto.id)?'active':''}" data-fav="${producto.id}" aria-label="Guardar producto">${favorites.has(producto.id)?'♥':'♡'}</button><div class="product-image"><img src="${imagenSegura(producto.img)}" alt="${producto.name}" ${atributoRespaldo(IMAGEN_PRODUCTO_RESPALDO)}></div><span class="product-meta">${producto.brand} · ${producto.category}</span><h3>${producto.name}</h3><div class="rating">★★★★★ <span>${producto.rating}</span></div>${Number(producto.discount)>0?`<span class="old-price">${money(producto.old)}</span>`:''}<div class="price-row"><strong class="price">${money(producto.price)}</strong><button class="add" data-id="${producto.id}" aria-label="Agregar al carrito" ${producto.stock<=0?'disabled':''}>${producto.stock<=0?'Agotado':'+'}</button></div><div class="availability ${producto.stock<=0?'unavailable':producto.stock<=5?'low-stock':''}">${producto.stock<=0?'Producto agotado':producto.stock<=5?`Últimas ${producto.stock} unidades`:'Disponible'}</div><div class="installments">Hasta 12 cuotas sin intereses</div></article>`;}
function renderizarPersonalizacion(){
  const recientes=document.querySelector('#recentlyViewedSection'),recomendaciones=document.querySelector('#recommendationsSection');
  if(!recientes||!recomendaciones||!puedePersonalizar()||!products.length){recientes?.classList.add('hidden');recomendaciones?.classList.add('hidden');return;}
  const vistos=historialVistos().map(item=>products.find(producto=>producto.id===Number(item.id))).filter(Boolean);
  recientes.classList.toggle('hidden',!vistos.length);
  document.querySelector('#recentlyViewedGrid').innerHTML=vistos.slice(0,4).map(tarjetaProducto).join('');
  const referencia=vistos[0];
  const idsVistos=new Set(vistos.map(producto=>producto.id));
  const similares=referencia?products.filter(producto=>!idsVistos.has(producto.id)&&producto.stock>0&&(producto.category===referencia.category||producto.brand===referencia.brand)).sort((a,b)=>Number(b.rating)-Number(a.rating)).slice(0,4):[];
  recomendaciones.classList.toggle('hidden',!similares.length);
  document.querySelector('#recommendationsGrid').innerHTML=similares.map(tarjetaProducto).join('');
  bindCards();
}
function configurarConsentimientoPersonalizacion(){
  const aviso=document.querySelector('#personalizationConsent');
  if(!aviso) return;
  aviso.classList.toggle('hidden',Boolean(personalizationConsent));
  document.querySelector('#acceptPersonalization').onclick=()=>{personalizationConsent='aceptado';localStorage.setItem(PERSONALIZATION_CONSENT_KEY,personalizationConsent);aviso.classList.add('hidden');renderizarPersonalizacion();showToast('Personalización activada para este dispositivo.');};
  document.querySelector('#rejectPersonalization').onclick=()=>{personalizationConsent='rechazado';localStorage.setItem(PERSONALIZATION_CONSENT_KEY,personalizationConsent);localStorage.removeItem(VIEWED_PRODUCTS_KEY);aviso.classList.add('hidden');renderizarPersonalizacion();showToast('Seguiremos mostrando el catálogo general.');};
  document.querySelector('#clearViewed').onclick=()=>{localStorage.removeItem(VIEWED_PRODUCTS_KEY);renderizarPersonalizacion();showToast('Historial de productos eliminado.');};
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

async function loadCatalogFromSupabase(){
  if(!supabaseClient) return;
  const {data,error}=await supabaseClient.from('catalogo_productos').select('*').order('id');
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
    img:imagenSegura(product.url_imagen||product.image_url)
  }));
  actualizarOpcionesCategorias();
  renderProducts();
  renderizarPersonalizacion();
  iniciarCarruselHero();
}

async function cargarComentariosProducto(idProducto){
  const lista=document.querySelector('#productCommentsList');
  const resumen=document.querySelector('#commentsSummary');
  lista.textContent='Cargando comentarios...';
  resumen.textContent='Calculando valoraciones…';
  const {data,error}=await supabaseClient.from('comentarios_publicos_productos')
    .select('id,autor,calificacion,comentario,creado_en')
    .eq('id_producto',idProducto).order('creado_en',{ascending:false}).limit(20);
  if(error){lista.textContent='Los comentarios estarán disponibles después de actualizar la base de datos.';resumen.textContent='Reseñas no disponibles';return;}
  const comentarios=data||[];
  const promedio=comentarios.length?comentarios.reduce((total,item)=>total+Number(item.calificacion),0)/comentarios.length:0;
  resumen.innerHTML=comentarios.length?`<strong>${promedio.toFixed(1)}</strong><span aria-label="${promedio.toFixed(1)} de 5 estrellas">${'★'.repeat(Math.round(promedio))}${'☆'.repeat(5-Math.round(promedio))}</span><small>${comentarios.length} ${comentarios.length===1?'reseña':'reseñas'}</small>`:'Aún no hay reseñas';
  lista.innerHTML=comentarios.length?comentarios.map(comentario=>`<article class="product-comment"><header><div><strong>${escapeHtml(comentario.autor)}</strong><small>${new Date(comentario.creado_en).toLocaleDateString('es-PE',{year:'numeric',month:'short',day:'numeric'})}</small></div><span class="product-comment-stars" aria-label="${comentario.calificacion} de 5 estrellas">${'★'.repeat(comentario.calificacion)}${'☆'.repeat(5-comentario.calificacion)}</span></header><p>${escapeHtml(comentario.comentario)}</p></article>`).join(''):'Sé la primera persona en compartir su experiencia con este producto.';
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

document.querySelector('#categoryList').innerHTML=categories.map(c=>`<a class="category-card" href="#" data-category="${c.name}"><div class="cat-image"><img src="${imagenSegura(c.img,IMAGEN_CATEGORIA_RESPALDO)}" alt="${c.name}" ${atributoRespaldo(IMAGEN_CATEGORIA_RESPALDO)}></div><strong>${c.name}</strong><small>${c.count}</small></a>`).join('');

function getVisibleProducts(){
  let list=soloOfertas?products.filter(p=>Number(p.discount)>0):products;
  if(activeCategory!=='all') list=list.filter(p=>p.category===activeCategory);
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
}
function sincronizarFiltrosCatalogo(){
  const categoria=document.querySelector('#catalogCategoryFilter'),precio=document.querySelector('#catalogPriceFilter'),modo=document.querySelector('#catalogOfferFilter');
  if(categoria) categoria.value=activeCategory;
  if(precio) precio.value=['price-low','price-high'].includes(activeFilter)?activeFilter:'';
  if(modo) modo.value=soloOfertas?'ofertas':'catalogo';
}

function renderProducts(list=getVisibleProducts().slice(start,start+12)){
  const visible=list.length?list:[];
  const total=getVisibleProducts().length;
  document.querySelector('#catalogTitle').textContent=soloOfertas?'Ofertas activas':'Catálogo de productos';
  document.querySelector('#productCountLabel').textContent=soloOfertas?`${total} ${total===1?'oferta activa':'ofertas activas'}`:`${total} productos disponibles`;
  const vacio=soloOfertas?`<div class="empty-cart" style="grid-column:1/-1"><span>🏷</span><h3>No hay ofertas activas</h3><p>El personal puede programar descuentos desde Gestión interna → Ofertas. Cuando haya una oferta real, aparecerá aquí automáticamente.</p></div>`:`<div class="empty-cart" style="grid-column:1/-1"><span>▱</span><h3>No hay resultados</h3><p>Prueba otra categoría, cambia el orden de precio o limpia los filtros.</p></div>`;
  document.querySelector('#productGrid').innerHTML=visible.length?visible.map(tarjetaProducto).join(''):vacio;
  bindCards();
  updateProductNav();
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
  button.textContent=favorites.has(id)?'♥':'♡';
  if(activeFilter==='favorites') renderProducts();
}

function addToCart(id){
  const product=products.find(x=>x.id===id);
  if(!product||product.stock<=0){showToast('Este producto está agotado.');return;}
  const found=cart.find(x=>x.id===id);
  if(found&&found.qty>=product.stock){showToast(`Solo quedan ${product.stock} unidades.`);return;}
  found?found.qty++:cart.push({...product,qty:1});
  updateCart();
  showToast();
}

function subtotal(){return cart.reduce((a,x)=>a+x.price*x.qty,0);}
function totalDiscount(){return subtotal()*discountRate;}
function totalShipping(){return subtotal()>=299?0:shippingValue;}
function totalPayable(){return Math.max(subtotal()-totalDiscount()+totalShipping(),0);}
function updateCheckout(){
  document.querySelector('#checkoutSubtotal').textContent=money(subtotal());
  document.querySelector('#checkoutShipping').textContent=money(totalShipping());
  document.querySelector('#checkoutDiscount').textContent=`- ${money(totalDiscount())}`;
  document.querySelector('#checkoutTotal').textContent=money(totalPayable());
}

function updateCart(){
  const count=cart.reduce((a,x)=>a+x.qty,0);
  document.querySelector('#cartCount').textContent=count;
  document.querySelector('#cartTitleCount').textContent=`(${count})`;
  document.querySelector('#cartSubtotal').textContent=money(subtotal());
  document.querySelector('#cartItems').innerHTML=cart.length?cart.map(x=>`<div class="cart-item"><img src="${imagenSegura(x.img)}" alt="${x.name}" ${atributoRespaldo(IMAGEN_PRODUCTO_RESPALDO)}><div><h4>${x.name}</h4><strong>${money(x.price)}</strong><div class="qty"><button onclick="changeQty(${x.id},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${x.id},1)">+</button></div></div><button onclick="removeItem(${x.id})" aria-label="Eliminar">×</button></div>`).join(''):`<div class="empty-cart"><span>▱</span><h3>Tu carrito está vacío</h3><p>Agrega productos y aparecerán aquí.</p></div>`;
  updateCheckout();
}

window.changeQty=(id,n)=>{
  const x=cart.find(item=>item.id===id);
  if(!x) return;
  const product=products.find(item=>item.id===id);
  if(n>0&&product&&x.qty>=product.stock){showToast(`Solo quedan ${product.stock} unidades.`);return;}
  x.qty+=n;
  if(x.qty<=0) cart=cart.filter(item=>item.id!==id);
  updateCart();
};
window.removeItem=id=>{cart=cart.filter(item=>item.id!==id);updateCart();};

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

document.querySelector('.mobile-menu').onclick=()=>{
  document.querySelector('#mainNav').classList.toggle('open');
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
  'Cómo comprar':{title:'Cómo comprar',body:'<ol><li>Busca el producto por nombre, marca o categoría.</li><li>Agrega la cantidad deseada al carrito.</li><li>Presiona <strong>Continuar compra</strong> y revisa tu pedido.</li><li>Completa nombres, documento, dirección, correo y teléfono.</li><li>Escanea el QR de Yape y paga el importe exacto.</li><li>Escribe el código de operación que te muestra Yape.</li><li>Guarda el código <strong>YP-XXXXXXXX</strong> que recibes al registrar el pedido.</li></ol><p>El pedido queda pendiente hasta verificar el pago.</p>'},
  'Medios de pago':{title:'Medios de pago',body:'<p>Actualmente el único medio habilitado es <strong>Yape mediante código QR</strong>.</p><ol><li>Escanea el QR desde la aplicación Yape.</li><li>Verifica que el monto coincida con el total del pedido.</li><li>Realiza el pago.</li><li>Registra el código de operación en Byte Bay.</li></ol><p>No solicitamos número de tarjeta, CVV, clave de Yape ni contraseña bancaria.</p>'},
  'Envíos y devoluciones':{title:'Envíos y devoluciones',body:'<p>Antes de registrar el pedido, confirma que tu dirección incluya calle, número, distrito y ciudad. Conserva tu código de pedido.</p><p>Para consultar un envío, corregir una dirección o reportar un problema, escribe por redes sociales con: nombre del comprador, código <strong>YP-XXXXXXXX</strong> y una explicación breve.</p><p>No envíes fotos de documentos completos ni contraseñas.</p>'},
  'Centro de ayuda':{title:'Centro de ayuda',body:'<p>Elige el caso que necesitas resolver y envíanos estos datos por una red oficial:</p><ul><li><strong>Pedido pendiente:</strong> código YP, nombre y código de operación Yape.</li><li><strong>Problema con producto:</strong> código YP, nombre del producto y fotos claras.</li><li><strong>Cambio de dirección:</strong> código YP y la dirección completa corregida.</li><li><strong>Producto agotado:</strong> nombre o código del producto para revisar alternativas.</li><li><strong>Acceso a cuenta:</strong> correo registrado. Nunca envíes tu contraseña.</li></ul><p>Las cuentas de redes oficiales están enlazadas abajo en el pie de página.</p>'},
  'Contáctanos':{title:'Contáctanos',body:'<p>Escríbenos por cualquiera de nuestras redes oficiales. Incluye tu consulta y, si se trata de una compra, tu código YP.</p><p><a href="https://tiktok.com/@bytebayperu" target="_blank" rel="noopener noreferrer">TikTok</a> · <a href="https://www.instagram.com/bytebayperu?stkn=b2Zlc3c4M2lrcjJw" target="_blank" rel="noopener noreferrer">Instagram</a> · <a href="https://youtube.com/@bytebayperu?si=4nyrzBNYliTeMwbu" target="_blank" rel="noopener noreferrer">YouTube</a> · <a href="https://x.com/bytebayperu" target="_blank" rel="noopener noreferrer">X</a> · <a href="https://www.facebook.com/share/19SYEVhY7c/" target="_blank" rel="noopener noreferrer">Facebook</a>.</p>'},
  'Libro de reclamaciones':{title:'Libro de reclamaciones',body:'<p>Para registrar un reclamo formal debes indicar: nombre completo, documento, correo, descripción del producto o servicio, número de pedido y el detalle de tu reclamo.</p><p>Esta sección quedará habilitada para envío real cuando configuremos el correo oficial del negocio y los datos legales requeridos.</p>'},
  'Privacidad':{title:'Privacidad',body:'<p>Byte Bay usa tu nombre, correo, teléfono, dirección y datos de pedido solo para registrar compras, verificar pagos, gestionar entregas y responder solicitudes.</p><p>Las contraseñas se guardan cifradas. Nunca te pediremos contraseña, clave de Yape, CVV ni código de seguridad por redes sociales.</p>'},
  'Términos':{title:'Términos de uso',body:'<p>Un pedido Yape se registra inicialmente como <strong>pendiente</strong>. Será confirmado después de verificar el pago. El stock y los precios se validan al momento de registrar el pedido.</p><p>El código de operación Yape y el código YP identifican tu compra. Guarda ambos hasta que el pedido sea entregado o resuelto.</p>'}
};
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
  const info=footerInfo[link.textContent.trim()];
  if(!info) return;
  event.preventDefault();openFooterInfo(info);
}));

let accountMode='register';
function openAccountModal(){
  const cuenta=JSON.parse(localStorage.getItem('beruAccount')||'null');
  if(cuenta?.verified){showToast(`Sesión activa: ${cuenta.name||cuenta.email}. Usa “Salir” para cerrar sesión.`);return;}
  setAccountMode('register');
  document.querySelector('#accountModal').classList.add('open');document.querySelector('#accountModal').setAttribute('aria-hidden','false');
}
function closeAccountModal(){document.querySelector('#accountModal').classList.remove('open');document.querySelector('#accountModal').setAttribute('aria-hidden','true');}
function setAccountBusy(busy,label){
  const submit=document.querySelector('#accountSubmit');
  submit.disabled=busy;
  if(label) submit.textContent=label;
}
function updateAccountHeader(){
  const saved=JSON.parse(localStorage.getItem('beruAccount')||'null');
  const account=document.querySelector('.account');
  if(!account) return;
  account.querySelector('small').textContent=saved?.verified?'Hola, '+(saved.username||saved.name?.split(' ')[0]||'cliente'):'Hola, ingresa';
  account.querySelector('strong').textContent=saved?.verified?'Mi cuenta':'Crear cuenta / Ingresar';
  document.querySelector('#accountLogout').classList.toggle('hidden',!saved?.verified);
  const accesoMovil=document.querySelector('#mobileAccountAccess span'),salidaMovil=document.querySelector('#mobileAccountLogout');
  if(accesoMovil) accesoMovil.textContent=saved?.verified?`Mi cuenta · ${saved.name?.split(' ')[0]||'cliente'}`:'Crear cuenta / Ingresar';
  if(salidaMovil) salidaMovil.classList.toggle('hidden',!saved?.verified);
}
function setAccountMode(mode){
  accountMode=mode;
  const form=document.querySelector('#accountForm');
  const isLogin=mode==='login';
  form.querySelector('.account-name-row').classList.toggle('hidden',isLogin);
  document.querySelector('#accountUsername').closest('label').classList.toggle('hidden',isLogin);
  document.querySelector('#accountPasswordConfirm').closest('label').classList.toggle('hidden',isLogin);
  document.querySelector('#accountPasswordConfirm').required=!isLogin;
  document.querySelector('#accountPassword').autocomplete=isLogin?'current-password':'new-password';
  document.querySelector('#accountTitle').textContent=isLogin?'Iniciar sesión':'Crear una cuenta';
  document.querySelector('#accountSubtitle').textContent=isLogin?'Ingresa con tu correo y contraseña de Byte Bay.':'Registra tus datos para continuar con Byte Bay.';
  document.querySelector('#accountSubmit').textContent=isLogin?'Iniciar sesión':'Crear cuenta';
  document.querySelector('#accountModeToggle').textContent=isLogin?'Crear una cuenta nueva':'Ya tengo una cuenta';
  document.querySelector('#accountStatus').textContent='';
}
document.querySelector('#accountClose').onclick=closeAccountModal;
document.querySelector('#accountModeToggle').onclick=()=>setAccountMode(accountMode==='login'?'register':'login');
document.querySelector('#mobileAccountAccess').onclick=openAccountModal;
document.querySelector('#mobileAccountLogout').onclick=()=>document.querySelector('#accountLogout').click();
document.querySelector('#accountLogout').onclick=async()=>{
  const cuenta=JSON.parse(localStorage.getItem('beruAccount')||'null');
  if(cuenta?.provider==='google'&&supabaseClient) await supabaseClient.auth.signOut();
  localStorage.removeItem('beruAccount');updateAccountHeader();showToast('Sesión cerrada correctamente.');
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
  const passwordConfirm=document.querySelector('#accountPasswordConfirm').value;
  const firstName=document.querySelector('#accountFirstName').value.trim();
  const lastName=document.querySelector('#accountLastName').value.trim();
  const username=document.querySelector('#accountUsername').value.trim();
  const status=document.querySelector('#accountStatus');
  if(!supabaseClient){status.textContent='Supabase no está disponible.';return;}
  if(accountMode==='login'){
    if(!email||!password){status.textContent='Escribe tu correo y contraseña.';return;}
    setAccountBusy(true,'Ingresando…');
    const {data,error}=await supabaseClient.rpc('iniciar_sesion_cliente',{p_correo:email,p_contrasena:password});
    setAccountBusy(false,'Iniciar sesión');
    if(error){status.textContent='Correo o contraseña incorrectos.';return;}
    localStorage.setItem('beruAccount',JSON.stringify({id:data.id,name:`${data.nombres||''} ${data.apellidos||''}`.trim()||'Cliente',username:data.nombre_usuario||email.split('@')[0],email:data.correo,verified:true}));
    updateAccountHeader();status.textContent='Sesión iniciada correctamente.';e.target.reset();setTimeout(closeAccountModal,700);return;
  }
  if(username&&!/^[A-Za-z0-9._-]{3,30}$/.test(username)){status.textContent='El nombre de usuario solo admite letras, números, punto, guion o guion bajo.';return;}
  if(password.length<8){status.textContent='La contraseña debe tener al menos 8 caracteres.';return;}
  if(password!==passwordConfirm){status.textContent='Las contraseñas no coinciden.';return;}
  setAccountBusy(true,'Creando…');
  const payload={email,first_name:firstName||null,last_name:lastName||null,username:username||null};
  const {error}=await supabaseClient.rpc('registrar_cuenta_cliente',{p_correo:email,p_nombres:payload.first_name,p_apellidos:payload.last_name,p_nombre_usuario:payload.username,p_contrasena:password});
  setAccountBusy(false,'Crear cuenta');
  if(error){
    console.error('Supabase simple account:',error);
    status.textContent=error.code==='23505'?'Este correo ya está registrado.':(error.code==='42883'||error.code==='PGRST202'?'Ejecuta las migraciones de columnas en español en Supabase antes de registrar usuarios.':`Supabase: ${error.message}`);
    return;
  }
  localStorage.setItem('beruAccount',JSON.stringify({name:`${firstName} ${lastName}`.trim()||'Cliente',username:username||email.split('@')[0],email,verified:true}));
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

document.querySelector('#newsletterForm').onsubmit=async e=>{
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
  status.textContent=`Suscrito con ${notificationSubscription.email}. Recibes: ${notificationSubscription.wants.join(', ') || 'ofertas'}.${delivery} Puedes cancelar cuando quieras.`;
}

document.querySelector('#notifyCancel').onclick=()=>{
  notificationSubscription=null;
  localStorage.removeItem('beruNotifications');
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
  if(step===2) syncPaymentUI();
}

function openCheckout(){
  if(!cart.length){showToast('Agrega productos antes de continuar');return;}
  toggleCart(false);
  checkoutModal.classList.add('open');
  checkoutModal.setAttribute('aria-hidden','false');
  setPaymentStep(1);
}

function closeCheckout(){
  checkoutModal.classList.remove('open');
  checkoutModal.setAttribute('aria-hidden','true');
}

document.querySelector('#openCheckout').onclick=openCheckout;
document.querySelector('#checkoutClose').onclick=closeCheckout;
paymentNext.onclick=()=>setPaymentStep(2);

function syncPaymentUI(){}

document.querySelector('#payNow').onclick=async()=>{
  const count=cart.reduce((a,x)=>a+x.qty,0);
  const selected='yape';
  if(!count){
    showToast('Agrega productos antes de pagar');
    return;
  }
  const required=['#fullName','#documentId','#address','#email','#phone'];
  required.push('#yapeOperation');
  const missing=required.find(sel=>!document.querySelector(sel).value.trim());
  if(missing){
    showToast('Completa los datos de pago y entrega');
    document.querySelector(missing).focus();
    return;
  }
  if(!supabaseClient){
    showToast('No se puede registrar la compra: la BD no está conectada.');
    return;
  }
  setPaymentStep(3);
  const cliente={
    correo:document.querySelector('#email').value.trim().toLowerCase(),
    nombre_completo:document.querySelector('#fullName').value.trim(),
    documento:document.querySelector('#documentId').value.trim(),
    direccion:document.querySelector('#address').value.trim(),
    telefono:document.querySelector('#phone').value.trim()
  };
  const {data,error}=await supabaseClient.rpc('crear_pedido_yape',{
    p_articulos:cart.map(item=>({id_producto:item.id,cantidad:item.qty})),
    p_cliente:cliente,
    p_codigo_operacion_yape:document.querySelector('#yapeOperation').value.trim()
  });
  if(error){
    console.error('Supabase order:',error);
    setPaymentStep(2);
    showToast(error.message||'No se pudo registrar la compra.');
    return;
  }
  cart=[];
  updateCart();
  await loadCatalogFromSupabase();
  setTimeout(()=>{
    showToast(`Pedido registrado. Código de verificación: ${data.codigo_verificacion}`);
    closeCheckout();
  },900);
};

document.querySelector('#saveCheckout').onclick=()=>showToast('Tu compra quedó guardada para continuar después');

function openProductModal(id){
  lastViewedProduct=products.find(p=>p.id===id);
  if(!lastViewedProduct) return;
  registrarProductoVisto(id);
  document.querySelector('#modalImage').src=imagenSegura(lastViewedProduct.img);
  document.querySelector('#modalImage').onerror=()=>{document.querySelector('#modalImage').onerror=null;document.querySelector('#modalImage').src=IMAGEN_PRODUCTO_RESPALDO;};
  document.querySelector('#modalImage').alt=lastViewedProduct.name;
  document.querySelector('#modalBrand').textContent=`${lastViewedProduct.brand} · ${lastViewedProduct.category}`;
  document.querySelector('#modalName').textContent=lastViewedProduct.name;
  document.querySelector('#modalRating').innerHTML=`★★★★★ <span>${lastViewedProduct.rating}</span>`;
  document.querySelector('#modalPrice').textContent=money(lastViewedProduct.price);
  document.querySelector('#modalOld').textContent=money(lastViewedProduct.old);
  document.querySelector('#modalDescription').textContent=lastViewedProduct.description||'Consulta las características principales de este producto antes de añadirlo al carrito.';
  const disponibilidad=document.querySelector('#modalAvailability');
  disponibilidad.className=`availability ${lastViewedProduct.stock<=0?'unavailable':lastViewedProduct.stock<=5?'low-stock':''}`;
  disponibilidad.textContent=lastViewedProduct.stock<=0?'Producto agotado':lastViewedProduct.stock<=5?`Últimas ${lastViewedProduct.stock} unidades`:'Disponible para entrega';
  document.querySelector('#modalAddToCart').disabled=lastViewedProduct.stock<=0;
  document.querySelector('#modalAddToCart').textContent=lastViewedProduct.stock<=0?'Producto agotado':'Agregar al carrito';
  document.querySelector('#modalAddToCart').onclick=()=>{addToCart(lastViewedProduct.id);closeProductModal();};
  const cuenta=JSON.parse(localStorage.getItem('beruAccount')||'null');
  const usaGoogle=cuenta?.provider==='google';
  const campoContrasena=document.querySelector('#commentPassword');
  campoContrasena.closest('label').classList.toggle('hidden',usaGoogle);
  campoContrasena.required=!usaGoogle;
  document.querySelector('#productCommentForm').reset();
  actualizarCalificacionComentario();
  actualizarContadorComentario();
  document.querySelector('#commentStatus').textContent=cuenta?.verified?(usaGoogle?'Tu cuenta Google está verificada. La reseña quedará pendiente de revisión.':'Confirma tu contraseña para publicar una reseña.'): 'Debes iniciar sesión. Las reseñas se publican después de la revisión.';
  cargarComentariosProducto(lastViewedProduct.id);
  document.querySelector('#productModal').classList.add('open');
  document.querySelector('#productModal').setAttribute('aria-hidden','false');
}

document.querySelector('#productCommentForm').onsubmit=async event=>{
  event.preventDefault();
  const cuenta=JSON.parse(localStorage.getItem('beruAccount')||'null');
  const estado=document.querySelector('#commentStatus');
  if(!cuenta?.verified||!cuenta.email){estado.textContent='Inicia sesión como cliente antes de comentar.';return;}
  if(!lastViewedProduct){estado.textContent='No hay un producto seleccionado.';return;}
  const boton=event.target.querySelector('button[type="submit"]');
  boton.disabled=true;
  const rpc=cuenta.provider==='google'?'guardar_comentario_producto_google':'guardar_comentario_producto';
  const parametros=cuenta.provider==='google'?{p_id_producto:lastViewedProduct.id,p_calificacion:Number(document.querySelector('input[name="commentRating"]:checked').value),p_comentario:document.querySelector('#commentText').value.trim()}:{p_id_producto:lastViewedProduct.id,p_correo:cuenta.email,p_contrasena:document.querySelector('#commentPassword').value,p_calificacion:Number(document.querySelector('input[name="commentRating"]:checked').value),p_comentario:document.querySelector('#commentText').value.trim()};
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

function configurarAsistenteIA(){
  const panel=document.querySelector('#aiAssistantPanel'),boton=document.querySelector('#aiAssistantToggle'),chat=document.querySelector('#aiChat'),formulario=document.querySelector('#aiAssistantForm'),entrada=document.querySelector('#aiAssistantInput');
  const abrir=()=>{panel.classList.remove('hidden');entrada.focus();};
  boton.onclick=abrir;document.querySelector('#aiAssistantClose').onclick=()=>panel.classList.add('hidden');
  const agregarMensaje=(texto,tipo)=>{const mensaje=document.createElement('article');mensaje.className=`ai-message ${tipo}`;mensaje.textContent=texto;chat.appendChild(mensaje);chat.scrollTop=chat.scrollHeight;return mensaje;};
  const agregarProductosRecomendados=productosRecomendados=>{
    const productosValidos=(productosRecomendados||[]).map(item=>products.find(producto=>Number(producto.id)===Number(item.id))).filter(Boolean);
    if(!productosValidos.length) return;
    const contenedor=document.createElement('div');contenedor.className='ai-product-links';
    contenedor.innerHTML=productosValidos.map(producto=>`<button type="button" data-ai-product="${producto.id}"><img src="${imagenSegura(producto.img)}" alt=""><span><strong>${escapeHtml(producto.name)}</strong><small>${money(producto.price)} · ${producto.stock} disponibles</small></span><b>Ver →</b></button>`).join('');
    contenedor.querySelectorAll('[data-ai-product]').forEach(botonProducto=>botonProducto.onclick=()=>{panel.classList.add('hidden');openProductModal(Number(botonProducto.dataset.aiProduct));});
    chat.appendChild(contenedor);chat.scrollTop=chat.scrollHeight;
  };
  const preguntar=async texto=>{
    if(!texto?.trim()) return;
    abrir();agregarMensaje(texto.trim(),'user');entrada.value='';
    const esperando=agregarMensaje('Buscando opciones en Byte Bay…','assistant');
    try{
      if(!supabaseClient) throw new Error('No se pudo conectar con el asistente.');
      const {data,error}=await supabaseClient.functions.invoke('asistente-bytebay',{body:{mensaje:texto.trim()}});
      if(error||data?.error){let detalle=data?.error||error?.message||'El asistente no pudo responder.';try{const cuerpo=await error?.context?.clone()?.json();detalle=cuerpo?.error||detalle;}catch(e){}throw new Error(detalle);}
      esperando.textContent=data.respuesta;
      agregarProductosRecomendados(data.productos);
    }catch(error){esperando.textContent=`No puedo responder ahora: ${error.message}. Intenta nuevamente.`;}
  };
  formulario.onsubmit=evento=>{evento.preventDefault();preguntar(entrada.value);};
  document.querySelectorAll('[data-ai-question]').forEach(botonSugerencia=>botonSugerencia.onclick=()=>preguntar(botonSugerencia.dataset.aiQuestion));
}

let remaining=8*3600+42*60+18;
setInterval(()=>{
  remaining=remaining>0?remaining-1:9*3600;
  document.querySelector('#hours').textContent=String(Math.floor(remaining/3600)).padStart(2,'0');
  document.querySelector('#minutes').textContent=String(Math.floor(remaining%3600/60)).padStart(2,'0');
  document.querySelector('#seconds').textContent=String(remaining%60).padStart(2,'0');
},1000);

if(notificationSubscription){
  document.querySelector('#notifyEmail').value=notificationSubscription.email;
  document.querySelector('#notifyDeals').checked=notificationSubscription.wants.includes('ofertas');
  document.querySelector('#notifyDrops').checked=notificationSubscription.wants.includes('novedades');
  document.querySelector('#notifyStock').checked=notificationSubscription.wants.includes('stock');
  showStickyNotice(`Suscripción cargada para ${notificationSubscription.email}`);
}
showNotificationStatus();
updateAccountHeader();
configurarConsentimientoPersonalizacion();
configurarAsistenteIA();
iniciarCarruselHero();
renderProducts();
renderizarPersonalizacion();
loadCatalogFromSupabase();
if(!supabaseClient){
  showToast('Conexión fallida a la BD.');
}else{
  showToast('Conexión a la BD exitosa.');
}
