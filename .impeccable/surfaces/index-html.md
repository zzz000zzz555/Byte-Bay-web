---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["site-orders.js"]
---

# Byte Bay: tienda, checkout, comprobante y transparencia

## Alcance y modo

La tienda pública y el checkout (Persuade), con seguimiento y resumen imprimible de pedidos, más una sección pública de términos, privacidad y seguridad (Read). Relacionados: `index.html`, `site-orders.js` y `admin.html` (admin fuera de este cambio).

## Audiencia, trabajo y evidencia

Compradores en Perú necesitan encontrar productos de varias categorías, conocer precio, disponibilidad y costo final, pagar, seguir el pedido y entender cómo se tratan sus datos. La evidencia proviene del catálogo, el checkout y estados devueltos por los proveedores; el documento imprimible es un resumen de pedido, no un comprobante tributario.

## Restricciones

Conservar producto, stock, permisos, IDs, filtros, proveedores de pago y comportamiento existente. No simular pagos, inventario, plazos, garantías ni devoluciones. Usar solo datos comerciales confirmados; presentar la identidad legal y los canales entregados para este fin, omitir DNI, CCI, edad y fecha de nacimiento. Español, marca Byte Bay, teclado, contraste AA, movimiento reducido y adaptación móvil. Ningún texto esencial sobre fondos borrosos.

## Dirección: Estación de alimentos frescos, ampliada al catálogo real

La dirección elegida es la estación culinaria de frascos y calendario: vidrio transparente, neblina de salmuera, coral de rábano, verde de eneldo y etiquetas kraft con fechas. La tienda traduce ese lenguaje a una vitrina de productos reales de tecnología, hogar y supermercado: etiquetas ordenan información; no se inventan lotes o fechas para artículos que no los tienen. El vidrio es material funcional en filtros y superficies secundarias, no un dashboard genérico ni un velo sobre texto. El checkout conserva el precio total verificado; el comprobante es un resumen imprimible completo. Los textos legales tienen secciones propias, visibles y enlazables.

## Pendiente

No se definieron plazos de entrega, condiciones comerciales de cambio, reembolso o garantía ni calendario exacto de conservación de datos; no prometerlos. La publicación de estas políticas necesita revisión legal del titular. El costo de envío actual se muestra y confirma en checkout antes del pago.

## Direction contract

THESIS: Byte Bay organiza un catálogo diverso como una vitrina clara de etiquetas reales: encontrar, comparar y comprar no debe sentirse como un dashboard genérico ni una campaña de supermercado.

OWN-WORLD: Vidrio de frasco, neblina clara, coral de rábano y verde de eneldo; etiquetas kraft y marcas de fecha solo donde los datos existan. Tipografía comercial nítida; contraste alto y superficies sólidas bajo todo texto y control. Vidrio y blur solo para navegación/filtros, nunca para contenido esencial. El mismo lenguaje ordena checkout, estados y resumen de pedido sin fingir emisión tributaria.

STORY: Ver un producto destacado con datos reales → explorar la franja de categorías o abrir el catálogo → comparar nombre, disponibilidad y precio → agregar → revisar envío y total → pagar en Culqi o Mercado Pago → mostrar confirmación solo tras estado verificado → consultar e imprimir el resumen. Términos, privacidad, seguridad y reclamaciones deben encontrarse desde el pie de página.

FIRST VIEWPORT: Cabecera compacta con marca, búsqueda, pedidos y carrito; debajo, un bloque breve de producto destacado con foto, nombre, disponibilidad, precio y acción visibles. Una franja de categorías lleva al catálogo, donde los filtros principales siguen a la vista y los controles avanzados quedan disponibles en un desplegable. En móvil, el bloque destacado y la franja de categorías son compactos para que el catálogo empiece dentro del primer desplazamiento; no hay rotación automática ni botones fijos que tapen los productos, y el asistente se abre desde Configuración.

FORM: Estación de alimentos frescos (opción challenger adoptada por la persona, ampliada para todas las categorías sin inventar atributos); seed:c172dd4535505c6c.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
