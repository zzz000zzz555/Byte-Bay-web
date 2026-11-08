# Auditoría — Interfaz de cliente (Byte Bay)

Fecha: 2026-11-06
Alcance: tienda pública (`index.html`), estilos y lógica de preferencias del cliente.
Fuera de alcance: panel administrativo (`admin.html`, `admin-*.js/css`) y funciones internas de administración.

---

## 1. Estado previo encontrado

- Tienda en HTML + CSS + JavaScript vanilla (sin framework), con Supabase y EmailJS por CDN.
- La cabecera acumulaba: barra superior promocional, ubicación, cuenta, botón de avisos, botón de tema y carrito; además de un menú móvil aparte.
- El modo oscuro existía con la clave `beruTema` (`noche` / `claro`) y se aplicaba con la clase `dark-mode` en `<html>`.
- Las notificaciones se guardaban en `beruNotifications` (suscripción con `wants: ['ofertas','novedades','stock']`).
- No existía una preferencia de país, región, idioma ni densidad de catálogo.
- Los modales de ayuda, libro de reclamaciones, cuenta, carrito y checkout ya existían y se reutilizan sin duplicarlos.

## 2. Envío gratis — hallazgos y decisión

### Dónde estaba configurado
- **Interfaz:** única aparición en `index.html`, barra superior:
  `Envíos gratis desde S/ 99`.
- **Cálculo real:** `app.js`
  - `let shippingValue = 18;`
  - `function totalShipping(){ return subtotal() >= 299 ? 0 : shippingValue; }`
- **Base de datos / administración:** sin coincidencias de `gratis`, `envio_gratis`, `costo_envio` ni `shipping` en los `.sql` del proyecto. No existe configuración comercial de envío gratis en el panel.

### Contradicción detectada
El mensaje público prometía envío gratis desde **S/ 99**, pero el código lo aplica desde **S/ 299**. Publicar cualquiera de las dos cifras sin confirmación del negocio habría sido inventar una promoción.

### Acción realizada
- Se retiró **solo el mensaje** de la interfaz (barra superior eliminada por completo).
- **No se modificó** la fórmula de envío ni el valor `S/ 18`. Verificado: `S/ 18.00` por debajo de S/ 299 y `S/ 0.00` desde S/ 299.
- No quedan cadenas `gratis` / `envío gratis` en HTML, JS ni CSS de la tienda.

### Pendiente (requiere decisión del negocio)
Elegir una de estas opciones y luego publicarla de forma coherente:
1. Mantener el umbral real de S/ 299 y comunicarlo correctamente.
2. Cambiar el umbral a S/ 99 (implica tocar la regla de negocio).
3. Eliminar el envío gratis y dejar solo la tarifa plana de S/ 18.

## 3. Elementos retirados de la página principal

| Elemento | Motivo |
|---|---|
| Barra superior con `Envíos gratis desde S/ 99` | Promoción contradictoria con el cálculo real |
| Botón de ubicación en cabecera | Reemplazado por país/región dentro del panel |
| Botón de tema en cabecera | Movido a Apariencia dentro del panel |
| Botón de avisos en cabecera | Movido a Notificaciones dentro del panel |
| Enlace de menú `Byte Bay Plus` | Sin destino ni funcionalidad real |
| Bloque `hero-proof` (`4.8 de 5`, `+20 mil compradores`) | Prueba social no verificable |
| Texto `Hasta 12 cuotas sin intereses` (hero y tarjetas) | Promoción no confirmada por el negocio |
| Bloque de newsletter duplicado al final | Repetía la captación ya disponible en Notificaciones |
| Accesos móviles duplicados de cuenta en el menú | La cuenta vive en la cabecera y en el panel |
| Enlaces de promoción a anclas inexistentes (`#tecnologia`, `#hogar`) | Enlaces muertos |

## 4. Componentes nuevos

### `site-settings.css`
- Botón hamburguesa (`#settingsToggle`) y panel lateral (`#settingsDrawer`) con fondo (`#settingsBackdrop`).
- Tarjetas de tema, interruptores, avisos del sistema, enlaces de ayuda y pie con restablecer.
- Tematización oscura completa del panel mediante variables CSS.
- Reglas responsive: panel de `min(430px, 100vw)`, ancho completo en ≤390 px, rejillas de 2→1 columna, navegación rápida con salto de línea, soporte de `safe-area-inset`, `prefers-reduced-motion`.
- Preferencia de columnas del catálogo (`html[data-catalog-cols]`) solo desde 761 px, para no romper la vista móvil de 2 columnas.

### `site-settings.js`
- Clave única de preferencias: `byteBayPreferences`
  (`theme`, `country`, `region`, `language`, `columns`, `notifications`).
- Tema `light` / `dark` / `auto` con seguimiento de `prefers-color-scheme`.
- Sincronización con la clave heredada `beruTema` para no romper el resto de la tienda.
- País (Perú), 25 regiones del Perú, idioma `es-PE` y vista del catálogo.
- Sincronización bidireccional con `beruNotifications`.
- Nota de entrega dinámica en el carrito según la región elegida.
- Avisos informativos, de advertencia y de confirmación con caducidad.
- Apertura/cierre accesible: foco al cerrar, trampa de foco, `Escape`, `aria-expanded`, `aria-hidden`, `inert`, bloqueo de scroll.
- Sincronización entre pestañas vía evento `storage` y eventos internos `bb:notifications-updated` / `bb:account-updated`.

### Integración en componentes existentes (sin duplicar)
- `window.bbAyuda` expuesto desde `app.js` para abrir los modales ya existentes de ayuda, FAQ, contacto, privacidad, términos y libro de reclamaciones.
- Se añadió contenido de **Preguntas frecuentes** al objeto de ayuda existente.

## 5. Cambios en archivos existentes

### `index.html`
- Eliminada la barra superior promocional.
- Nueva cabecera: hamburguesa, logo, buscador, cuenta y carrito.
- Nuevo panel de configuración con cuatro categorías (general, apariencia, notificaciones, atención al cliente).
- Eliminados hero-proof, cuotas, newsletter duplicado y enlaces muertos.
- `#cartDeliveryNote` pasa a ser dinámico.
- Versiones de assets: `styles.css?v=21`, `app.js?v=45`, `site-settings.css/js?v=1`.

### `app.js`
- Eliminado el handler del antiguo `.mobile-menu`.
- `#newsletterForm` ahora es opcional (el bloque se retiró).
- Retirado el texto de cuotas de las tarjetas de producto.
- Eventos `bb:notifications-updated` y `bb:account-updated` al cambiar suscripción o cuenta.
- `window.bbAyuda` y contenido de FAQ añadidos.
- **Sin cambios** en `shippingValue`, `totalShipping()` ni en el flujo de carrito/checkout.

## 6. Pruebas realizadas

### Funcionales
- 12 productos cargados; búsqueda `laptop` devuelve 2; limpiar filtros restaura 12.
- Carrito: agregar producto, contador, subtotal y notas correctos.
- Checkout: modal abre con formulario utilizable.
- Envío: `S/ 18.00` con subtotal S/ 99; `S/ 0.00` con subtotal S/ 300 (fórmula intacta).
- Panel: abre/cierra por botón, fondo, `Escape` y cierre correcto de `inert`/backdrop/scroll.
- Tema: claro/oscuro/auto aplica, persiste tras recargar y actualiza `beruTema` y `theme-color`.
- Preferencias: región y columnas persisten tras recarga.
- Notificaciones: suscripción existente se refleja en los interruptores y los cambios se escriben de vuelta.
- Ayuda: FAQ y libro de reclamaciones abren sus modales tras cerrar el panel (foco en `nombre`).
- Cuenta: abre el modal correspondiente desde el panel.
- Restablecer: devuelve tema `auto`, región `Lima`, columnas `auto` y notificaciones por defecto.
- Consola del navegador: **0 errores** en todas las pruebas.

### Responsive (iframes a ancho real)
| Ancho | Desbordamiento horizontal | Columnas de producto | Panel | Observaciones |
|---|---|---|---|---|
| 320 px | 0 | 2 | 320 px, borde a borde | Cierra dentro del viewport, cuerpo con scroll |
| 360 px | 0 | 2 | 360 px, borde a borde | Navegación rápida con salto de línea |
| 390 px | 0 | 2 | 390 px, borde a borde | — |
| 768 px | 0 | 3 | 430 px | Cabecera de escritorio, sin solapamientos |
| 1024 px | 0 | 3 | 430 px | — |
| 1440 px | 0 | 4 (auto) | 430 px | Contenido centrado |

- El panel nunca genera scroll horizontal (`bodyScrollWidth === clientWidth`).
- El botón de cerrar permanece dentro del viewport en todos los anchos.
- La preferencia manual de columnas solo actúa desde 761 px; en móvil se mantienen 2 columnas.

## 7. Riesgos y pendientes

1. **Envío gratis:** falta decisión del negocio sobre el umbral (ver sección 2).
2. **Idioma:** solo existe `es-PE`; no hay traducciones en la tienda, por lo que el selector no cambia textos.
3. **País:** solo Perú; no hay tarifas ni logística para otros países.
4. **Preferencias locales:** se guardan en el dispositivo (`localStorage`), no en la cuenta. Si se requiere sincronización entre dispositivos hay que persistirlas en Supabase.
5. **Contacto/redes:** los canales siguen siendo los enlaces del pie; no se inventaron correos ni teléfonos.
6. **Capturas de pantalla:** la verificación se hizo por DOM y estilos calculados; el entorno no permitió capturas con ventana visible.

## 8. Compatibilidad

- Se conserva la clave `beruTema`, por lo que el panel administrativo y cualquier código previo siguen funcionando.
- No se tocaron `admin.html`, `admin.js`, `admin-dashboard.js`, `admin-pro.js` ni `admin-pro.css`.
- Los modales, carrito, checkout, filtros, favoritos y buscador mantienen su comportamiento original.
