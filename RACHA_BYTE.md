# Racha de Byte

La mascota de racha vive a la izquierda, se puede arrastrar y tocar, y solo
aparece cuando hay una cuenta de cliente validada. Se oculta al cerrar sesión.

## Base de datos (paso manual)

Aplicar en Supabase las dos migraciones, en este orden:

```
supabase/migrations/20261124000000_bytebay_rachas.sql
supabase/migrations/20261124010000_bytebay_rachas_nombre.sql
```

Crean `public.bytebay_rachas` (RLS activa, sin acceso directo para `anon` ni
`authenticated`), la columna `nombre` y las funciones
`bb_registrar_racha(p_access_token text)` y
`bb_renombrar_racha(p_access_token text, p_nombre text)`.
Ambas validan la sesión con `bb_validar_sesion`; el navegador **no envía** el id
del cliente. El nombre se limpia en cliente y en BD (máximo 24 caracteres).

Reglas de la racha:

- Alta: **3 días** (`es_nuevo = true`).
- Visita al día siguiente: `días + 1`.
- Si se pierde un día o más: vuelve a **1 día**.
- `mejor_racha` conserva el máximo histórico.

## Cliente

`streak-companion.js` llama a `BBPrivacy.obtenerSesionCliente()` y, si hay
sesión, ejecuta el RPC. El resultado se guarda en caché local por cliente para
suavizar recargas. Si el RPC aún no está aplicado o no hay red, se usa la caché
local aplicando la misma regla de días; sin cuenta, la mascota no aparece.

Niveles visuales (ítems SVG dentro de la mascota):

| Días | Nivel | Rasgos |
| --- | --- | --- |
| 3–6 | Chispa | llama ámbar, cara y placa con nombre |
| 7–13 | Brasa | llama cálida + doble aura |
| 14–29 | Llama | aura, órbita y corona |
| 30+ | Leyenda | gema, aura dorada, corona y alas |

## Nombre de la racha

La placa bajo la llama muestra siempre el nombre y los días. El botón ✎ abre un
editor; `Guardar` llama a `bb_renombrar_racha` y actualiza Supabase. Si el RPC
todavía no está aplicado o falla la red, se mantiene el nombre en la caché local
y se avisa al usuario. Doble toque en la mascota también muestra el editor entre
sus mensajes.

## Fluidez

Ambos motores usan `requestAnimationFrame` sin tope artificial y un acumulador
de paso fijo de **1/240 s** (máximo 8 subpasos por fotograma). La física es por
tanto idéntica en pantallas de 60, 120, 144, 240 o más Hz; el límite real lo
pone el monitor y el navegador. El tamaño se mide solo al iniciar/redimensionar,
para no forzar `layout` en cada fotograma; solo se escriben
`transform`/variables CSS.

## Encuentro entre mascotas

Al acercar la racha a Byte (o arrastrar Byte hacia ella) se dispara
`bytebay:streak-meet`: ambas hacen un saludo coreografiado, aparecen partículas
entre las dos y Byte muestra el número de días. Tiene 5.5 s de enfriamiento.

## Prueba sin cuenta

Solo desde la consola del navegador, para validar la interfaz:

```js
ByteBayStreak.preview(30) // muestra el nivel Leyenda
ByteBayStreak.hide()
```

El modo de prueba no sustituye a la sesión: al recargar, la racha vuelve a
depender de la cuenta.
