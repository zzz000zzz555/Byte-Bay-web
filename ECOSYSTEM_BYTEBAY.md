# Ecosistema multi-mascota de Byte Bay

Byte ya no está solo. El sitio carga un escuadrón opcional con **Pixel** (morado `#B833FF`) y **Nano** (naranja `#FF9F1C`), además de la racha existente. Byte conserva su color celeste `#38FEDC`, su chat, voz, carrito, bolsillo, actividades en reposo y física de paso fijo `1/240 s`.

## Escuadrón

El vestidor incluye el selector **Mostrar en pantalla**:

- `Solo Byte`
- `Byte + Pixel`
- `Escuadrón completo`

El estado se guarda en `localStorage` bajo `bytebay_wardrobe_v1`:

```json
{
  "v": 1,
  "squad": "byte+pixel",
  "byId": {
    "byte":  { "skin": "classic", "hat": "none", "outfit": "none", "visor": "normal", "aura": "none" },
    "pixel": { "skin": "cyber", "hat": "cat", "outfit": "scarf", "visor": "laser", "aura": "stars" },
    "nano":  { "skin": "vip", "hat": "wifi", "outfit": "vest", "visor": "sunglasses", "aura": "binary" }
  },
  "updatedAt": 0
}
```

Las posiciones de Pixel y Nano se guardan por separado en `bytebay_squad_pos_<id>`. En pantallas menores a 480 px las mascotas secundarias se ocultan automáticamente para no tapar la compra.

## Vestidor / Estudio de personalización

Se abre desde **Personalizar** en el encabezado del chat, desde el cierre de Configuración o mediante `window.ByteBaySquad.openWardrobe('pixel')`.

- Pestañas Byte / Pixel / Nano con vista previa interactiva.
- Categorías: skins, sombreros, ropa, visores y auras.
- Botón **Aleatorio** y **Guardar look**.
- Cierre con Escape, backdrop o botón ×; el foco vuelve al control que abrió el modal.
- Capas SVG: `#layer-aura`, `#layer-back`, `#layer-body`, `#layer-outfit`, `#layer-visor`, `#layer-hat`, `#layer-hands` y `#layer-jet`. La vista previa usa IDs con namespace propio para no colisionar con las mascotas vivas.

El look aplicado a Byte se inyecta en su SVG sin recrear los nodos que usan sus animaciones, manos, pelota o física.

## Interacciones

- **High-five** entre Byte y un compañero, con manos, salto y partículas.
- **Pase de pelota** entre Pixel y Nano; Byte solo celebra con burbuja silenciosa, sin pisar su propia física de pelota.
- **Charla** con micro-burbujas de emojis tech.
- **Jetpack** al arrastrar una mascota secundaria rápidamente hacia arriba.
- **Baile** al abrir el carrito o aplicar filtros.
- **Modo escaneo** al buscar productos.

Cada interacción tiene su propio enfriamiento y se suspende durante chat, checkout, consentimiento, modales, pestañas ocultas o encuentros de racha (`bytebay:streak-meet`).

## Arquitectura

- `MascotEntity`: DOM SVG, capas, geometría, render `translate3d`, arrastre, mirada, parpadeo y física de las mascotas secundarias.
- `ByteEntityAdapter`: delega chat, voz, audio, manos y posición en `window.ByteBayCompanion`; Byte mantiene su propio bucle y no se integra dos veces.
- `MascotManager`: estado, escuadrón, persistencia, eventos de tienda y bucle RAF único para Pixel/Nano.
- `SocialDirector`: distancias, enfriamientos, partículas y evento `bytebay:social-interaction`.
- `WardrobeUI`: modal accesible y vista previa con namespaces SVG propios.

## API pública

```js
window.ByteBaySquad.VERSION
window.ByteBaySquad.get('pixel')
window.ByteBaySquad.setSquad('full')
window.ByteBaySquad.setVisible('nano', true)
window.ByteBaySquad.highFive('pixel', 'byte')
window.ByteBaySquad.passBall()
window.ByteBaySquad.emojiChat()
window.ByteBaySquad.abortSocial()
window.ByteBaySquad.getLook('byte')
window.ByteBaySquad.applyLook('byte', look)
window.ByteBaySquad.openWardrobe('nano')
window.ByteBaySquad.closeWardrobe()
window.ByteBayMascots  // alias
```

`window.ByteBayMascot`, `window.ByteBayCompanion` y `window.ByteBayStreak` siguen intactos para compatibilidad.
