-- Producto temporal para probar el checkout: S/ 3.00 por unidad.
-- Ejecutar en Supabase SQL Editor después del esquema de Byte Bay.
-- El producto es idempotente: volver a ejecutar actualiza el mismo código.

begin;

insert into public.categorias (nombre, identificador_url)
values ('Productos de prueba', 'productos-de-prueba')
on conflict (identificador_url) do update
set nombre = excluded.nombre;

with categoria as (
  select id, nombre
    from public.categorias
   where identificador_url = 'productos-de-prueba'
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
  'TEST-BB-S3-001',
  'Producto de prueba S/ 3',
  'producto-prueba-3-soles',
  'Producto temporal para probar el flujo de compra.',
  'Byte Bay',
  categoria.nombre,
  null,
  3.00,
  3.00,
  20,
  5.0,
  true,
  categoria.id
from categoria
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
