---
name: Byte Bay
description: Una tienda peruana clara y cercana, inspirada en un mercado fresco contemporáneo.
colors:
  market-ink: "#173c38"
  market-ground: "#f6f7f1"
  market-surface: "#fffefa"
  market-lime: "#dce8c8"
  market-green: "#315d50"
  market-leaf: "#527b53"
  market-coral: "#c94f42"
  market-muted: "#52645d"
  market-line: "#d8e1d6"
typography:
  display:
    fontFamily: "Manrope, Inter, sans-serif"
    fontSize: "clamp(28px, 4vw, 42px)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, Inter, sans-serif"
    fontSize: "clamp(25px, 3vw, 34px)"
    fontWeight: 750
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Inter, DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.45
  body:
    fontFamily: "Inter, DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  accent:
    fontFamily: "Caveat, cursive"
    fontSize: "17px"
    fontWeight: 600
rounded:
  control: "10px"
  card: "16px"
  hero: "24px"
  pill: "999px"
spacing:
  catalog-gap: "16px"
  section: "clamp(38px, 6vw, 68px)"
components:
  button-primary:
    backgroundColor: "{colors.market-ink}"
    textColor: "{colors.market-surface}"
    rounded: "{rounded.control}"
    height: "44px"
  button-primary-hover:
    backgroundColor: "#28564a"
    textColor: "{colors.market-surface}"
    rounded: "{rounded.control}"
  filter-active:
    backgroundColor: "{colors.market-green}"
    textColor: "{colors.market-surface}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.market-surface}"
    textColor: "{colors.market-ink}"
    rounded: "{rounded.card}"
---

# Design System: Byte Bay

## Overview

**Creative North Star: "La estación de productos frescos."**

La tienda toma la claridad y cercanía de un mercado contemporáneo y la adapta a un catálogo real de tecnología, hogar y supermercado. Verde profundo, superficies cálidas, acentos de hoja y coral, y pequeños detalles manuscritos dan identidad sin competir con el producto. Las imágenes, nombres, precios, disponibilidad y acciones de compra conservan una jerarquía directa.

Esta dirección cubre la tienda pública, el checkout, la información legal y los pedidos. El panel de administración mantiene sus estilos propios; no se le aplican estas reglas por extensión.

**Key Characteristics:**
- Paleta botánica y crema, con coral reservado para estados que necesitan atención.
- Catálogo en tarjetas claras, redondeadas y con datos fáciles de comparar.
- Tipografía sans-serif legible con acentos manuscritos puntuales.
- Estados de pago, disponibilidad y reseñas basados en datos confirmados.

## Colors

El verde oscuro sostiene navegación, texto y acciones; el verde hoja y el lima suavizan superficies y filtros. El coral distingue descuentos o estados importantes sin dominar la página.

### Primary
- **Market Ink** (`#173c38`): texto principal, cabecera superior y botones de acción primaria.
- **Market Green** (`#315d50`): filtros activos, enlaces y estados seleccionados.

### Secondary
- **Market Lime** (`#dce8c8`): acciones secundarias y acentos de compra.
- **Market Coral** (`#c94f42`): descuentos y énfasis puntual.

### Neutral
- **Market Ground** (`#f6f7f1`): fondo general de la tienda.
- **Market Surface** (`#fffefa`): tarjetas, formularios y paneles.
- **Market Muted** (`#52645d`): información secundaria.
- **Market Line** (`#d8e1d6`): bordes y separadores.

### Named Rules
**The Verified Data Rule.** Precios, stock, reseñas y aprobación de pagos se muestran únicamente cuando existen en el estado confirmado de la aplicación o del proveedor.

## Typography

- **Display Font:** Manrope (with Inter and sans-serif fallbacks)
- **Body Font:** Inter (with DM Sans and sans-serif fallbacks)
- **Accent Font:** Caveat, self-hosted for small metadata accents

**Character:** Manrope crea una jerarquía compacta en encabezados; Inter conserva lectura cómoda en fichas y documentos. Caveat aparece solo en pequeños acentos, no en instrucciones ni importes.

### Hierarchy
- **Display** (800, `clamp(28px, 4vw, 42px)`, 1.1): título principal y páginas destacadas.
- **Headline** (750, `clamp(25px, 3vw, 34px)`, 1.12): encabezados de catálogo y secciones.
- **Title** (650, 14px, 1.45): nombres de productos y títulos de tarjetas.
- **Body** (400, 14px, 1.65): descripciones, checkout y documentos legales.
- **Label** (600, 12px): filtros, metadatos y controles.
- **Accent** (600, 17px): anotaciones breves de categoría o producto.

### Named Rules
**The Plain-Language Rule.** Instrucciones, errores y datos de pago usan tipografía sans-serif legible; la fuente manuscrita nunca sustituye información operativa.

## Layout

El contenido usa un contenedor de hasta 1320px, con márgenes que se reducen en tabletas y móviles. La portada sigue el recorrido producto destacado → franja de categorías → catálogo. El producto destacado usa una composición dividida y datos reales; el catálogo conserva una cuadrícula de tarjetas con imagen, nombre, disponibilidad, precio y acción juntos. Los filtros menos frecuentes se agrupan en un desplegable, mientras los criterios principales permanecen visibles.

La cabecera reúne marca, búsqueda, cuenta, pedidos y carrito. Bajo 600px se distribuye en una fila compacta y una búsqueda de ancho completo. El destacado mantiene texto y producto lado a lado en móvil; categorías y filtros principales se desplazan horizontalmente para conservar el ancho útil. Las preferencias y el acceso al asistente viven en el panel de configuración para no cubrir productos ni acciones fijas en móvil.

La sección de transparencia presenta navegación lateral y documentos en dos columnas sobre 900px; debajo, se transforma en navegación horizontal y contenido de una columna. Los anclajes reservan espacio para la cabecera fija.

## Elevation & Depth

Las superficies de catálogo usan sombras suaves y bordes finos; la elevación aumenta solo al interactuar. El producto destacado cambia solo cuando la persona usa sus controles, sin rotación automática. Los efectos estacionales son opcionales, discretos y se configuran desde el panel de preferencias; `prefers-reduced-motion` impide su reproducción.

### Shadow Vocabulary
- **Surface** (`0 5px 16px rgb(23 60 56 / 4%)`): separación discreta de tarjetas en reposo.
- **Hover** (`0 14px 28px rgb(23 60 56 / 10%)`): énfasis temporal al interactuar con una tarjeta.
- **Overlay** (`0 16px 36px rgb(23 60 56 / 9%)`): separación de menús y superficies elevadas.

## Shapes

Los controles usan radios cercanos a 9–10px; las tarjetas y filtros, entre 13 y 17px; el bloque principal destacado, 24px. Las búsquedas y etiquetas de descuento usan formas de píldora. Los bordes claros definen los límites sin recurrir a contornos pesados.

## Components

### Buttons
- **Primary:** verde tinta, texto claro y radio de 10px; altura mínima táctil de 44px.
- **Hover / Focus:** el hover aclara el verde y eleva el control ligeramente; el foco visible usa un contorno de 3px.
- **Secondary:** superficie clara, borde tenue y texto verde; reservar el coral para avisos y estados importantes.

### Chips
- **Style:** filtros redondeados, sin borde en reposo.
- **State:** el filtro seleccionado usa verde medio y texto claro; los filtros inactivos ganan superficie al pasar el cursor.

### Cards / Containers
- **Catalog:** tarjeta clara con borde fino, radio de 13–17px e imagen dentro de un marco propio.
- **Hover:** elevación leve, sin ocultar ni desplazar los controles de compra.
- **Checkout / Orders:** superficies claras con totales y estados separados de las líneas de producto.

### Inputs / Fields
- **Style:** superficie clara, texto verde oscuro y borde verde pálido; controles compactos de catálogo con radio de 9px.
- **Focus:** borde resaltado y anillo visible coherente con el tema.
- **Placeholder:** contraste suficiente para permanecer legible en ambos temas.

### Navigation
- **Storefront:** cabecera clara con búsqueda prominente y enlaces de categoría; se adapta a una composición compacta en móvil.
- **Legal:** navegación de documentos visible y persistente en escritorio, desplazable horizontalmente en pantallas pequeñas.
- **Dark mode:** sustituye superficies y texto por valores de alto contraste sin cambiar la estructura.

### Transparency Documents
Los términos, privacidad y seguridad comparten una superficie legible, títulos claros, fecha visible y párrafos con longitud moderada. Los anclajes deben dejar sus encabezados visibles bajo la cabecera fija.

## Do's and Don'ts

### Do:
- **Do** mantener visibles producto, precio, disponibilidad y acción principal.
- **Do** distinguir precio, descuento y total con números tabulares cuando se comparan importes.
- **Do** conservar el contraste y el foco visible en temas claro y oscuro.
- **Do** presentar el documento descargable como resumen de pedido, no como boleta tributaria.
- **Do** mantener las políticas precisas y limitadas a condiciones confirmadas.

### Don't:
- **Don't** inventar reseñas, stock, plazos de entrega, descuentos ni aprobación de pago.
- **Don't** pedir ni mostrar contraseñas bancarias, CVV o códigos OTP de Yape.
- **Don't** usar Caveat en contenido legal, errores o datos de transacción.
- **Don't** extender este tema al panel de administración sin una revisión específica de esa superficie.
