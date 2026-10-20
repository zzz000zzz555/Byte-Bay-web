# Auditoría de normalización de la base de datos Beru

## Resultado general

La estructura actual está parcialmente normalizada. Las entidades transaccionales principales tienen claves correctas, pero existen atributos repetitivos en `productos`, duplicidad entre inventario general e inventario por lotes, y dos modelos de identidad de clientes que no deben mezclarse sin una migración de autenticación.

## Relaciones correctas que se conservan

- `cuentas_clientes (1) -> (N) pedidos` mediante `pedidos.id_cuenta_cliente`.
- `pedidos (1) -> (N) detalles_pedido` mediante `detalles_pedido.id_pedido`.
- `productos (1) -> (N) detalles_pedido` mediante `detalles_pedido.id_producto`.
- `productos (1) -> (N) ofertas_producto`.
- `productos (1) -> (N) movimientos_inventario`.
- `productos (1) -> (N) lotes_inventario`.
- `proveedores (1) -> (N) lotes_inventario`.
- `pedidos (1) -> (N) historial_estados_pedido`.
- `perfiles (1) -> (1) preferencias_notificacion`, cuando las tablas heredadas existen.
- `auth.users (1) -> (0..1) personal`.

## Cambios de normalización aplicados

### Categorías

`productos.categoria` repetía el mismo texto en muchos registros. Se sustituye por `productos.id_categoria`, relacionado con `categorias.id`. La relación es uno a muchos: una categoría contiene muchos productos y cada producto mantiene una categoría principal.

No se crea una relación muchos a muchos porque el proyecto actual solo asigna una categoría a cada producto. Si en el futuro un producto debe aparecer simultáneamente en varias categorías, deberá crearse `productos_categorias(id_producto, id_categoria)` con una clave primaria compuesta.

### Marcas

`productos.marca` también repetía texto. Se sustituye por `productos.id_marca`, relacionado con `marcas.id`. La marca continúa siendo opcional.

### Comentarios de productos

Se crea `comentarios_productos` con relaciones hacia `productos` y `cuentas_clientes`. Un cliente puede comentar muchos productos y un producto puede recibir comentarios de muchos clientes; la tabla de comentarios resuelve esa relación N:M y permite un comentario por cliente y producto.

### Historial de pedidos

Se garantiza la existencia de `historial_estados_pedido` y se añade un disparador para registrar automáticamente el estado inicial y cada cambio posterior.

### Movimientos por lote

Se añade `movimientos_inventario.id_lote`. Es opcional para conservar movimientos históricos que fueron creados antes del inventario por lotes, pero debe informarse en los movimientos nuevos cuando se conozca el lote.

## Duplicados que son intencionales

- `detalles_pedido.nombre_producto`, `codigo_producto` y `precio_unitario` son una fotografía histórica. No deben sustituirse por una consulta al producto actual.
- `pedidos.correo_cliente` y `direccion_envio` conservan los datos utilizados al comprar, aunque el cliente cambie posteriormente su perfil.
- `productos.existencias` es un valor resumido para consultas rápidas. Debe ser mantenido exclusivamente por los disparadores de lotes; no es la fuente de verdad.
- `productos.calificacion` se conserva como valoración de referencia para no perder los valores existentes. El catálogo calcula la valoración pública desde comentarios aprobados cuando existan.

## Problemas que requieren una fase posterior

### Dos modelos de clientes

`perfiles` depende de Supabase Auth, mientras `cuentas_clientes` utiliza `contrasena_hash`. Fusionarlos automáticamente podría impedir el acceso de clientes existentes, porque las credenciales no pueden trasladarse de forma segura a `auth.users` sin un proceso de restablecimiento de contraseña. Por eso se mantienen ambos modelos durante esta migración.

La solución futura recomendada es migrar clientes a Supabase Auth, relacionar una única tabla de perfil mediante UUID y retirar `contrasena_hash` únicamente después de que todos los clientes hayan restablecido su contraseña.

### Vencimiento en productos y lotes

La fecha real de vencimiento pertenece al lote. `productos.fecha_vencimiento` se mantiene temporalmente porque el formulario y los registros antiguos la utilizan. Los productos nuevos deberían registrar vencimientos mediante `lotes_inventario`; después de migrar los productos antiguos a lotes, la columna podrá eliminarse.

## Reglas de eliminación

- Los pedidos eliminan sus detalles e historial en cascada.
- Un producto con lotes no puede eliminarse; debe marcarse como inactivo.
- Al eliminar un producto, sus comentarios y ofertas pueden eliminarse en cascada.
- Al eliminar una cuenta de cliente, sus pedidos conservan la fotografía histórica y sus comentarios se eliminan.
- Una categoría o marca en uso no puede eliminarse; debe marcarse como inactiva.

## Ejecución

1. Ejecutar `pruebas-base-datos.sql` en un entorno de prueba.
2. Revisar el bloque final de comprobaciones y comparar cantidades.
3. Probar catálogo, creación de productos, pedidos, inventario y reportes.
4. Hacer una copia de seguridad antes de ejecutarlo en producción.

