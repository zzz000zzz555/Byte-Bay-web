-- Productos temporales para probar Mercado Pago: cada unidad cuesta S/ 1.00.
-- El envío es gratis, así que el total del pedido es S/ 1.00.
-- Ejecutar después del esquema base de Byte Bay y eliminar estos productos al terminar.

begin;

insert into public.categorias (nombre, identificador_url)
values ('Productos de prueba MP', 'productos-de-prueba-mp')
on conflict (identificador_url) do update
set nombre = excluded.nombre;

with categoria as (
  select id, nombre
    from public.categorias
   where identificador_url = 'productos-de-prueba-mp'
)
insert into public.productos (
  codigo,
  nombre,
  identificador_url,
  descripcion,
  marca,
  categoria,
  url_imagen,
  precio,
  precio_referencia,
  existencias,
  calificacion,
  activo,
  id_categoria
)
select
  producto.codigo,
  producto.nombre,
  producto.identificador_url,
  'Artículo temporal para validar el checkout de Mercado Pago. No corresponde a un producto físico.',
  'Byte Bay',
  categoria.nombre,
  null,
  1.00,
  1.00,
  20,
  5.0,
  true,
  categoria.id
from categoria
cross join (
  values
    ('TEST-MP-S1-01', 'Prueba Mercado Pago 01', 'prueba-mercado-pago-01'),
    ('TEST-MP-S1-02', 'Prueba Mercado Pago 02', 'prueba-mercado-pago-02'),
    ('TEST-MP-S1-03', 'Prueba Mercado Pago 03', 'prueba-mercado-pago-03')
) as producto(codigo, nombre, identificador_url)
on conflict (codigo) do update
set nombre = excluded.nombre,
    identificador_url = excluded.identificador_url,
    descripcion = excluded.descripcion,
    marca = excluded.marca,
    categoria = excluded.categoria,
    url_imagen = excluded.url_imagen,
    precio = excluded.precio,
    precio_referencia = excluded.precio_referencia,
    existencias = excluded.existencias,
    calificacion = excluded.calificacion,
    activo = excluded.activo,
    id_categoria = excluded.id_categoria,
    actualizado_en = now();

commit;
