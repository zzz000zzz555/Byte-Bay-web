import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir='D:/PROYECTO DE COMERSIO ELECTRONICO/Beru';
const skillDir='C:/Users/AMD/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations';
const runtimePython='C:/Users/AMD/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const outputPath=path.join(workspaceDir,'output','ppt','presentacion-byte-bay.pptx');
const stagingDir=path.join(workspaceDir,'.codex-finalizer-byte-bay');
const buildDir=path.join(workspaceDir,'.presentation-build');
const {resolvePresentationFont,finalizePresentation}=await import(pathToFileURL(path.join(skillDir,'container_tools','artifact_tool_utils.mjs')).href);
const font=resolvePresentationFont({fontFamily:'Aptos'});
const presentation=Presentation.create({slideSize:{width:1280,height:720}});
const logoPath=path.join(workspaceDir,'byte-bay-logo-transparent.png');
const logoBytes=await fs.readFile(logoPath).then(bytes=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const C={teal:'#103940',ink:'#15343b',lime:'#D9F45B',cream:'#F7F6F0',muted:'#607278',coral:'#F2664F',white:'#FFFFFF',pale:'#EDF5F1'};

function box(slide,x,y,w,h,fill='none',radius=false){return slide.shapes.add({geometry:radius?'roundRect':'rect',position:{left:x,top:y,width:w,height:h},fill, line:{style:'solid',fill:'none',width:0}});}
function text(slide,value,x,y,w,h,size=22,color=C.ink,bold=false,align='left'){
  const shape=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{style:'solid',fill:'none',width:0}});
  shape.text=value;shape.text.style={typeface:font,fontSize:size,color,bold,align,autoFit:'shrinkText'};return shape;
}
function addBrand(slide,num,dark=false){
  slide.images.add({blob:logoBytes,contentType:'image/png',alt:'Logo de Byte Bay',fit:'contain',position:{left:72,top:38,width:115,height:45}});
  text(slide,`BYTE BAY  |  ${String(num).padStart(2,'0')}`,1010,47,198,24,12,dark?C.cream:C.muted,true,'right');
}
function slideBase(num,title,subtitle=''){
  const slide=presentation.slides.add();slide.background.fill=C.cream;addBrand(slide,num);text(slide,title,72,112,980,64,36,C.teal,true);if(subtitle)text(slide,subtitle,72,180,930,36,18,C.muted,false);box(slide,72,225,1136,2,C.lime);return slide;
}
function bullets(slide,items,x,y,w,fs=21){items.forEach((item,i)=>{box(slide,x,y+i*68,13,13,C.lime,true);text(slide,item,x+28,y-7+i*68,w-28,48,fs,C.ink,false);});}

// 1. Portada
{const s=presentation.slides.add();s.background.fill=C.teal;box(s,0,0,1280,14,C.lime);s.images.add({blob:logoBytes,contentType:'image/png',alt:'Logo de Byte Bay',fit:'contain',position:{left:82,top:68,width:190,height:74}});text(s,'Byte Bay',82,205,650,82,54,C.white,true);text(s,'Plataforma de comercio electrónico',82,292,620,42,25,C.lime,true);text(s,'Presentación del proyecto',82,354,520,36,20,'#C6D6D4');text(s,'Compra y vende fácil',82,575,510,34,22,C.white,true);text(s,'Octubre de 2026',82,618,400,24,15,'#C6D6D4');box(s,798,126,360,382,'#173F46',true);text(s,'Una experiencia clara para descubrir, comparar y comprar productos.',845,220,272,170,31,C.white,true);text(s,'Byte Bay reúne catálogo, ofertas, filtros, recomendaciones y gestión interna en una sola web.',845,418,270,116,19,'#C6D6D4');s.speakerNotes.textFrame.setText('Presentación elaborada con base en las funciones implementadas en el proyecto Byte Bay.');}

// 2. Quiénes somos
{const s=slideBase(2,'Quiénes somos','Una propuesta digital pensada para compras cotidianas y decisiones rápidas.');text(s,'Byte Bay',72,270,290,54,38,C.teal,true);text(s,'es una tienda web que conecta a las personas con productos de categorías como tecnología, hogar, supermercado, moda, deportes y belleza.',72,336,500,150,25,C.ink,false);box(s,660,274,445,250,C.teal,true);text(s,'Nuestro punto de partida',706,318,320,32,20,C.lime,true);text(s,'Una web sencilla de usar, con información clara de precio, stock y ofertas.',706,374,320,90,28,C.white,true);s.speakerNotes.textFrame.setText('Contenido basado en las categorías y funciones visibles en Byte Bay.');}

// 3. Necesidad
{const s=slideBase(3,'La necesidad que atendemos','Comprar en línea requiere confianza, información clara y una navegación simple.');text(s,'Problemas frecuentes',72,275,350,35,24,C.teal,true);bullets(s,['Catálogos difíciles de recorrer desde el celular','Ofertas poco claras o productos sin stock','Pocas recomendaciones según el interés del usuario'],72,335,500,19);box(s,720,270,388,245,C.pale,true);text(s,'Respuesta de Byte Bay',760,310,300,32,21,C.teal,true);text(s,'Un catálogo ordenado con filtros, detalle de producto, carrito y recomendaciones que respetan la decisión del usuario.',760,363,292,118,24,C.ink,true);s.speakerNotes.textFrame.setText('Estas necesidades describen el problema que el proyecto busca resolver.');}

// 4. Misión
{const s=slideBase(4,'Misión');text(s,'Facilitar compras digitales confiables y cercanas.',72,275,820,70,38,C.teal,true);text(s,'Byte Bay busca ofrecer una experiencia donde las personas encuentren productos, comparen opciones y compren con información clara.',72,372,820,78,23,C.ink,false);box(s,72,505,720,50,C.lime,true);text(s,'Precio, disponibilidad y categorías visibles antes de comprar.',95,516,650,25,18,C.teal,true);s.speakerNotes.textFrame.setText('Misión propuesta para el proyecto Byte Bay.');}

// 5. Visión
{const s=slideBase(5,'Visión');text(s,'Convertir a Byte Bay en una alternativa reconocida para comprar en línea.',72,270,920,72,37,C.teal,true);text(s,'Queremos crecer paso a paso, ampliar el catálogo y fortalecer la confianza de los usuarios con una plataforma útil y responsable.',72,374,860,78,23,C.ink,false);box(s,950,276,158,158,C.teal,true);text(s,'CRECER',972,311,115,24,16,C.lime,true,'center');text(s,'con confianza',970,352,118,46,20,C.white,true,'center');s.speakerNotes.textFrame.setText('Visión propuesta para el proyecto Byte Bay.');}

// 6. Funcionamiento
{const s=slideBase(6,'Cómo funciona la página','El recorrido integra búsqueda, decisión de compra y seguimiento del catálogo.');text(s,'1',92,300,50,48,34,C.coral,true);text(s,'Explorar',155,302,220,36,24,C.teal,true);text(s,'Buscar por texto, categoría o precio.',155,347,220,52,18,C.muted);text(s,'2',454,300,50,48,34,C.coral,true);text(s,'Elegir',517,302,220,36,24,C.teal,true);text(s,'Revisar detalle, stock, precio y oferta.',517,347,220,52,18,C.muted);text(s,'3',816,300,50,48,34,C.coral,true);text(s,'Comprar',879,302,220,36,24,C.teal,true);text(s,'Agregar al carrito y registrar el pedido.',879,347,220,52,18,C.muted);box(s,72,470,1036,2,C.lime);text(s,'El panel administrativo permite gestionar productos, inventario, ofertas y personal.',72,510,1000,32,21,C.ink,true);s.speakerNotes.textFrame.setText('Funciones implementadas en la web y en el panel administrativo del proyecto.');}

// 7. Diferenciación
{const s=slideBase(7,'Qué nos define frente a otras empresas','Byte Bay combina una tienda digital con herramientas prácticas para el usuario y el equipo interno.');bullets(s,['Carrusel de ofertas con productos reales del catálogo','Filtros por categoría y orden de precio','Recomendaciones según productos vistos, con consentimiento','Asistente con IA orientado al catálogo disponible'],72,285,880,20);box(s,975,288,133,190,C.teal,true);text(s,'4',1000,325,84,44,38,C.lime,true,'center');text(s,'funciones clave',991,382,100,52,16,C.white,true,'center');s.speakerNotes.textFrame.setText('Funciones diferenciadoras implementadas o previstas en el proyecto Byte Bay.');}

// 8. Ventajas
{const s=slideBase(8,'Ventajas para los usuarios');text(s,'Una experiencia pensada para dispositivos móviles y computadoras.',72,270,760,44,29,C.teal,true);bullets(s,['Diseño adaptable para pantallas pequeñas y grandes','Productos, precios y stock visibles desde la ficha','Inicio de sesión con correo o Google','Carrito y proceso de compra con Yape como medio de pago','Opciones de personalización que el usuario puede aceptar o rechazar'],72,340,920,19);s.speakerNotes.textFrame.setText('Ventajas derivadas de las funciones incorporadas en la página de Byte Bay.');}

// 9. Retos
{const s=slideBase(9,'Retos de una marca nueva','Reconocer los límites permite planear un crecimiento responsable.');box(s,72,284,470,230,'#FFF0EC',true);text(s,'Hoy',108,320,160,30,21,C.coral,true);bullets(s,['Poco reconocimiento de marca','Catálogo inicial limitado','Confianza por construir'],108,372,350,18);box(s,650,284,458,230,C.pale,true);text(s,'Cómo responder',686,320,240,30,21,C.teal,true);bullets(s,['Información transparente','Atención al cliente','Más productos y alianzas'],686,372,330,18);s.speakerNotes.textFrame.setText('Retos y respuestas propuestos para el crecimiento del proyecto.');}

// 10. Cierre
{const s=slideBase(10,'Próximos pasos','Byte Bay puede consolidarse con mejoras continuas y contacto cercano con sus usuarios.');text(s,'Prioridades del proyecto',72,280,430,35,25,C.teal,true);bullets(s,['Ampliar productos y ofertas verificadas','Dar a conocer la marca mediante redes y campañas','Medir qué buscan los usuarios para mejorar el catálogo'],72,342,670,20);box(s,825,290,283,190,C.teal,true);text(s,'Gracias',869,335,190,45,33,C.white,true,'center');text(s,'Byte Bay\nCompra y vende fácil',858,405,212,60,19,C.lime,true,'center');s.speakerNotes.textFrame.setText('Cierre de la presentación de Byte Bay.');}

await fs.mkdir(stagingDir,{recursive:true});
await fs.mkdir(path.dirname(outputPath),{recursive:true});
const candidatePath=path.join(stagingDir,'candidate.pptx');
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);
await finalizePresentation({workspaceDir,candidatePath,finalPath:outputPath,pythonExecutable:runtimePython,integrityValidatorPath:path.join(skillDir,'container_tools','inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skillDir,'container_tools','inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],explicitTotalSlideCount:10,requiredNativeTableOwnerSlides:[],fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:path.join(stagingDir,'validation.json')});
console.log(outputPath);
