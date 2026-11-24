# Racha de Byte

La mascota de racha vive a la izquierda, se puede arrastrar y tocar, y solo
aparece cuando hay una cuenta de cliente validada. Se oculta al cerrar sesión.

## Base de datos (paso manual)

Aplicar en Supabase la migración:

```
supabase/migrations/20261124000000_bytebay_rachas.sql
```

Crea `public.bytebay_rachas` (RLS activa, sin acceso directo para `anon` ni
`authenticated`) y la función `public.bb_registrar_racha(p_access_token text)`.
La función valida la sesión con `bb_validar_sesion`; el navegador **no envía**
el id del cliente.

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
| 3–6 | Chispa | llama turquesa |
| 7–13 | Brasa | llama cálida + aura |
| 14–29 | Llama | aura, órbita y corona |
| 30+ | Leyenda | aura dorada, corona y alas |

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
