-- 100 productos nuevos con imágenes locales en img/productos/
begin;
insert into public.marcas (nombre, activa) values
  ($bb$ASUS$bb$, true),
  ($bb$DELL$bb$, true),
  ($bb$HUAWEI$bb$, true),
  ($bb$OPPO$bb$, true),
  ($bb$REALME$bb$, true),
  ($bb$VIVO$bb$, true),
  ($bb$BEATS$bb$, true),
  ($bb$AMAZON$bb$, true),
  ($bb$ANNIBALE COLOMBO$bb$, true),
  ($bb$FURNITURE CO.$bb$, true),
  ($bb$KNOLL$bb$, true),
  ($bb$BATH TRENDS$bb$, true),
  ($bb$CALVIN KLEIN$bb$, true),
  ($bb$CHANEL$bb$, true),
  ($bb$DIOR$bb$, true),
  ($bb$DOLCE & GABBANA$bb$, true),
  ($bb$GUCCI$bb$, true),
  ($bb$ESSENCE$bb$, true),
  ($bb$GLAMOUR BEAUTY$bb$, true),
  ($bb$VELVET TOUCH$bb$, true),
  ($bb$CHIC COSMETICS$bb$, true),
  ($bb$NAIL COUTURE$bb$, true),
  ($bb$PRADA$bb$, true),
  ($bb$NIKE$bb$, true),
  ($bb$PUMA$bb$, true),
  ($bb$MARNI$bb$, true),
  ($bb$FASHIONISTA$bb$, true),
  ($bb$HESHE$bb$, true),
  ($bb$URBAN CHIC$bb$, true),
  ($bb$ELEGANCE COLLECTION$bb$, true),
  ($bb$FASHION TRENDS$bb$, true),
  ($bb$CLASSIC WEAR$bb$, true),
  ($bb$CASUAL COMFORT$bb$, true),
  ($bb$OLAY$bb$, true),
  ($bb$VASELINE$bb$, true)
on conflict (nombre) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-100$bb$, $bb$Alimento para gatos (1 kg)$bb$, $bb$alimento-para-gatos-1-kg$bb$, $bb$Alimento para gatos (1 kg) con nutrientes balanceados para la alimentación diaria de tu mascota.$bb$, $bb$img/productos/alimento-para-gatos-1-kg.webp$bb$, 24.9, 48, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIDA NATURAL$bb$)
where c.id = 12
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-099$bb$, $bb$Alimento para perros (1 kg)$bb$, $bb$alimento-para-perros-1-kg$bb$, $bb$Alimento para perros (1 kg) con nutrientes balanceados para la alimentación diaria de tu mascota.$bb$, $bb$img/productos/alimento-para-perros-1-kg.webp$bb$, 29.9, 41, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$PEDIGREE$bb$)
where c.id = 12
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-098$bb$, $bb$Caja de pañuelos faciales$bb$, $bb$caja-de-panuelos-faciales$bb$, $bb$Caja de pañuelos faciales práctico y absorbente, ideal para el aseo diario del hogar.$bb$, $bb$img/productos/caja-de-panuelos-faciales.webp$bb$, 6.9, 34, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$LYSOL$bb$)
where c.id = 11
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-097$bb$, $bb$Loción corporal y facial Vaseline Men$bb$, $bb$locion-corporal-y-facial-vaseline-men$bb$, $bb$Loción corporal y facial Vaseline Men para el cuidado personal, con fórmula suave y de rápida absorción.$bb$, $bb$img/productos/locion-corporal-y-facial-vaseline-men.webp$bb$, 29.9, 27, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VASELINE$bb$)
where c.id = 5
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-096$bb$, $bb$Gel de ducha Olay con manteca de karité$bb$, $bb$gel-de-ducha-olay-con-manteca-de-karite$bb$, $bb$Gel de ducha Olay con manteca de karité para el cuidado personal, con fórmula suave y de rápida absorción.$bb$, $bb$img/productos/gel-de-ducha-olay-con-manteca-de-karite.webp$bb$, 34.9, 20, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$OLAY$bb$)
where c.id = 5
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-095$bb$, $bb$Plumillas para bádminton$bb$, $bb$plumillas-para-badminton$bb$, $bb$Plumillas para bádminton de material resistente, diseñado para entrenamientos y competencias.$bb$, $bb$img/productos/plumillas-para-badminton.webp$bb$, 16.9, 73, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ACTIVEGO$bb$)
where c.id = 6
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-094$bb$, $bb$Pelotas de golf (12 unidades)$bb$, $bb$pelotas-de-golf-12-unidades$bb$, $bb$Pelotas de golf (12 unidades) de material resistente, diseñado para entrenamientos y competencias.$bb$, $bb$img/productos/pelotas-de-golf-12-unidades.webp$bb$, 29.9, 66, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ACTIVEGO$bb$)
where c.id = 6
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-093$bb$, $bb$Bate de críquet$bb$, $bb$bate-de-criquet$bb$, $bb$Bate de críquet de material resistente, diseñado para entrenamientos y competencias.$bb$, $bb$img/productos/bate-de-criquet.webp$bb$, 84.9, 59, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ACTIVEGO$bb$)
where c.id = 6
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-092$bb$, $bb$Pelota de béisbol$bb$, $bb$pelota-de-beisbol$bb$, $bb$Pelota de béisbol de material resistente, diseñado para entrenamientos y competencias.$bb$, $bb$img/productos/pelota-de-beisbol.webp$bb$, 24.9, 52, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ACTIVEGO$bb$)
where c.id = 6
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-091$bb$, $bb$Guante de béisbol$bb$, $bb$guante-de-beisbol$bb$, $bb$Guante de béisbol de material resistente, diseñado para entrenamientos y competencias.$bb$, $bb$img/productos/guante-de-beisbol.webp$bb$, 69.9, 45, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ACTIVEGO$bb$)
where c.id = 6
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-090$bb$, $bb$Pelotas de tenis (3 unidades)$bb$, $bb$pelotas-de-tenis-3-unidades$bb$, $bb$Pelotas de tenis (3 unidades) de material resistente, diseñado para entrenamientos y competencias.$bb$, $bb$img/productos/pelotas-de-tenis-3-unidades.webp$bb$, 19.9, 38, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ACTIVEGO$bb$)
where c.id = 6
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-089$bb$, $bb$Raqueta de tenis$bb$, $bb$raqueta-de-tenis$bb$, $bb$Raqueta de tenis de material resistente, diseñado para entrenamientos y competencias.$bb$, $bb$img/productos/raqueta-de-tenis.webp$bb$, 139.9, 31, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ACTIVEGO$bb$)
where c.id = 6
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-088$bb$, $bb$Balón de vóley$bb$, $bb$balon-de-voley$bb$, $bb$Balón de vóley de material resistente, diseñado para entrenamientos y competencias.$bb$, $bb$img/productos/balon-de-voley.webp$bb$, 34.9, 24, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ACTIVEGO$bb$)
where c.id = 6
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-087$bb$, $bb$Balón de fútbol$bb$, $bb$balon-de-futbol$bb$, $bb$Balón de fútbol de material resistente, diseñado para entrenamientos y competencias.$bb$, $bb$img/productos/balon-de-futbol.webp$bb$, 49.9, 17, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ADIDAS$bb$)
where c.id = 6
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-086$bb$, $bb$Balón de básquetbol$bb$, $bb$balon-de-basquetbol$bb$, $bb$Balón de básquetbol de material resistente, diseñado para entrenamientos y competencias.$bb$, $bb$img/productos/balon-de-basquetbol.webp$bb$, 39.9, 70, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$SPALDING$bb$)
where c.id = 6
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-085$bb$, $bb$Fresas frescas (500 g)$bb$, $bb$fresas-frescas-500-g$bb$, $bb$Fresas frescas (500 g) seleccionado por su frescura y calidad. Producto de consumo diario.$bb$, $bb$img/productos/fresas-frescas-500-g.webp$bb$, 10.9, 63, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIDA NATURAL$bb$)
where c.id = 14
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-084$bb$, $bb$Arroz extra (1 kg)$bb$, $bb$arroz-extra-1-kg$bb$, $bb$Arroz extra (1 kg) seleccionado por su frescura y calidad. Producto de consumo diario.$bb$, $bb$img/productos/arroz-extra-1-kg.webp$bb$, 16.9, 56, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIDA NATURAL$bb$)
where c.id = 14
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-083$bb$, $bb$Leche entera (1 L)$bb$, $bb$leche-entera-1-l$bb$, $bb$Leche entera (1 L) seleccionado por su frescura y calidad. Producto de consumo diario.$bb$, $bb$img/productos/leche-entera-1-l.webp$bb$, 9.9, 49, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ALPURA$bb$)
where c.id = 14
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-082$bb$, $bb$Miel de abeja (500 g)$bb$, $bb$miel-de-abeja-500-g$bb$, $bb$Miel de abeja (500 g) seleccionado por su frescura y calidad. Producto de consumo diario.$bb$, $bb$img/productos/miel-de-abeja-500-g.webp$bb$, 19.9, 42, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIDA NATURAL$bb$)
where c.id = 14
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-081$bb$, $bb$Huevos blancos (12 unidades)$bb$, $bb$huevos-blancos-12-unidades$bb$, $bb$Huevos blancos (12 unidades) seleccionado por su frescura y calidad. Producto de consumo diario.$bb$, $bb$img/productos/huevos-blancos-12-unidades.webp$bb$, 7.9, 35, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIDA NATURAL$bb$)
where c.id = 14
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-080$bb$, $bb$Pepino fresco (1 kg)$bb$, $bb$pepino-fresco-1-kg$bb$, $bb$Pepino fresco (1 kg) seleccionado por su frescura y calidad. Producto de consumo diario.$bb$, $bb$img/productos/pepino-fresco-1-kg.webp$bb$, 4.9, 28, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIDA NATURAL$bb$)
where c.id = 14
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-079$bb$, $bb$Aceite vegetal (1 L)$bb$, $bb$aceite-vegetal-1-l$bb$, $bb$Aceite vegetal (1 L) seleccionado por su frescura y calidad. Producto de consumo diario.$bb$, $bb$img/productos/aceite-vegetal-1-l.webp$bb$, 13.9, 21, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIDA NATURAL$bb$)
where c.id = 14
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-078$bb$, $bb$Pechuga de pollo (1 kg)$bb$, $bb$pechuga-de-pollo-1-kg$bb$, $bb$Pechuga de pollo (1 kg) seleccionado por su frescura y calidad. Producto de consumo diario.$bb$, $bb$img/productos/pechuga-de-pollo-1-kg.webp$bb$, 29.9, 74, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIDA NATURAL$bb$)
where c.id = 14
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-077$bb$, $bb$Bistec de res (500 g)$bb$, $bb$bistec-de-res-500-g$bb$, $bb$Bistec de res (500 g) seleccionado por su frescura y calidad. Producto de consumo diario.$bb$, $bb$img/productos/bistec-de-res-500-g.webp$bb$, 34.9, 67, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIDA NATURAL$bb$)
where c.id = 14
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-076$bb$, $bb$Manzana roja (1 kg)$bb$, $bb$manzana-roja-1-kg$bb$, $bb$Manzana roja (1 kg) seleccionado por su frescura y calidad. Producto de consumo diario.$bb$, $bb$img/productos/manzana-roja-1-kg.webp$bb$, 5.9, 60, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIDA NATURAL$bb$)
where c.id = 14
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-075$bb$, $bb$Camisa manga corta para hombre$bb$, $bb$camisa-manga-corta-para-hombre$bb$, $bb$Camisa manga corta para hombre confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/camisa-manga-corta-para-hombre.webp$bb$, 54.9, 53, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$CASUAL COMFORT$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-074$bb$, $bb$Camisa a cuadros para hombre$bb$, $bb$camisa-a-cuadros-para-hombre$bb$, $bb$Camisa a cuadros para hombre confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/camisa-a-cuadros-para-hombre.webp$bb$, 99.9, 46, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$CLASSIC WEAR$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-073$bb$, $bb$Camisa cuadros azul y negro para hombre$bb$, $bb$camisa-cuadros-azul-y-negro-para-hombre$bb$, $bb$Camisa cuadros azul y negro para hombre confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/camisa-cuadros-azul-y-negro-para-hombre.webp$bb$, 84.9, 39, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$FASHION TRENDS$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-072$bb$, $bb$Bolso de mano negro para mujer$bb$, $bb$bolso-de-mano-negro-para-mujer$bb$, $bb$Bolso de mano negro para mujer confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/bolso-de-mano-negro-para-mujer.webp$bb$, 169.9, 32, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ELEGANCE COLLECTION$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-071$bb$, $bb$Mochila de cuero sintético blanca$bb$, $bb$mochila-de-cuero-sintetico-blanca$bb$, $bb$Mochila de cuero sintético blanca confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/mochila-de-cuero-sintetico-blanca.webp$bb$, 109.9, 25, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$URBAN CHIC$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-070$bb$, $bb$Bolso de cuero Heshe para mujer$bb$, $bb$bolso-de-cuero-heshe-para-mujer$bb$, $bb$Bolso de cuero Heshe para mujer confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/bolso-de-cuero-heshe-para-mujer.webp$bb$, 359.9, 18, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$HESHE$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-069$bb$, $bb$Bolso de mano azul para mujer$bb$, $bb$bolso-de-mano-azul-para-mujer$bb$, $bb$Bolso de mano azul para mujer confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/bolso-de-mano-azul-para-mujer.webp$bb$, 139.9, 71, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$FASHIONISTA$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-068$bb$, $bb$Traje rojo y negro Marni$bb$, $bb$traje-rojo-y-negro-marni$bb$, $bb$Traje rojo y negro Marni confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/traje-rojo-y-negro-marni.webp$bb$, 499.9, 64, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$MARNI$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-067$bb$, $bb$Vestido escocés para mujer$bb$, $bb$vestido-escoces-para-mujer$bb$, $bb$Vestido escocés para mujer confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/vestido-escoces-para-mujer.webp$bb$, 109.9, 57, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$URBAN STYLE$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-066$bb$, $bb$Vestido gris para mujer$bb$, $bb$vestido-gris-para-mujer$bb$, $bb$Vestido gris para mujer confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/vestido-gris-para-mujer.webp$bb$, 99.9, 50, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$URBAN STYLE$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-065$bb$, $bb$Vestido de verano para mujer$bb$, $bb$vestido-de-verano-para-mujer$bb$, $bb$Vestido de verano para mujer confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/vestido-de-verano-para-mujer.webp$bb$, 54.9, 43, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$URBAN STYLE$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-064$bb$, $bb$Vestido azul para mujer$bb$, $bb$vestido-azul-para-mujer$bb$, $bb$Vestido azul para mujer confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/vestido-azul-para-mujer.webp$bb$, 84.9, 36, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$URBAN STYLE$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-063$bb$, $bb$Vestido corto plisado$bb$, $bb$vestido-corto-plisado$bb$, $bb$Vestido corto plisado confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/vestido-corto-plisado.webp$bb$, 139.9, 29, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$URBAN STYLE$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-062$bb$, $bb$Conjunto de corsé con falda negra$bb$, $bb$conjunto-de-corse-con-falda-negra$bb$, $bb$Conjunto de corsé con falda negra confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/conjunto-de-corse-con-falda-negra.webp$bb$, 219.9, 22, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$URBAN STYLE$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-061$bb$, $bb$Conjunto de corsé de cuero con falda$bb$, $bb$conjunto-de-corse-de-cuero-con-falda$bb$, $bb$Conjunto de corsé de cuero con falda confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/conjunto-de-corse-de-cuero-con-falda.webp$bb$, 249.9, 15, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$URBAN STYLE$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-060$bb$, $bb$Vestido largo negro para mujer$bb$, $bb$vestido-largo-negro-para-mujer$bb$, $bb$Vestido largo negro para mujer confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/vestido-largo-negro-para-mujer.webp$bb$, 359.9, 68, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$URBAN STYLE$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-059$bb$, $bb$Zapatillas Puma Future Rider$bb$, $bb$zapatillas-puma-future-rider$bb$, $bb$Zapatillas Puma Future Rider confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/zapatillas-puma-future-rider.webp$bb$, 249.9, 61, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$PUMA$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-058$bb$, $bb$Zapatillas Nike Air Jordan 1 rojo y negro$bb$, $bb$zapatillas-nike-air-jordan-1-rojo-y-negro$bb$, $bb$Zapatillas Nike Air Jordan 1 rojo y negro confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/zapatillas-nike-air-jordan-1-rojo-y-negro.webp$bb$, 419.9, 54, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$NIKE$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-057$bb$, $bb$Bolso Prada para mujer$bb$, $bb$bolso-prada-para-mujer$bb$, $bb$Bolso Prada para mujer confeccionado con materiales de calidad y corte cómodo, ideal para completar tu estilo.$bb$, $bb$img/productos/bolso-prada-para-mujer.webp$bb$, 1699.9, 47, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$PRADA$bb$)
where c.id = 13
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-056$bb$, $bb$Esmalte de uñas rojo$bb$, $bb$esmalte-de-unas-rojo$bb$, $bb$Esmalte de uñas rojo de textura ligera y larga duración, ideal para el cuidado y realce de tu belleza natural.$bb$, $bb$img/productos/esmalte-de-unas-rojo.webp$bb$, 24.9, 40, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$NAIL COUTURE$bb$)
where c.id = 3
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-055$bb$, $bb$Labial rojo de larga duración$bb$, $bb$labial-rojo-de-larga-duracion$bb$, $bb$Labial rojo de larga duración de textura ligera y larga duración, ideal para el cuidado y realce de tu belleza natural.$bb$, $bb$img/productos/labial-rojo-de-larga-duracion.webp$bb$, 34.9, 33, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$CHIC COSMETICS$bb$)
where c.id = 3
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-054$bb$, $bb$Polvo compacto facial$bb$, $bb$polvo-compacto-facial$bb$, $bb$Polvo compacto facial de textura ligera y larga duración, ideal para el cuidado y realce de tu belleza natural.$bb$, $bb$img/productos/polvo-compacto-facial.webp$bb$, 39.9, 26, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VELVET TOUCH$bb$)
where c.id = 3
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-053$bb$, $bb$Paleta de sombras con espejo$bb$, $bb$paleta-de-sombras-con-espejo$bb$, $bb$Paleta de sombras con espejo de textura ligera y larga duración, ideal para el cuidado y realce de tu belleza natural.$bb$, $bb$img/productos/paleta-de-sombras-con-espejo.webp$bb$, 54.9, 19, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$GLAMOUR BEAUTY$bb$)
where c.id = 3
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-052$bb$, $bb$Máscara de pestañas Essence Lash Princess$bb$, $bb$mascara-de-pestanas-essence-lash-princess$bb$, $bb$Máscara de pestañas Essence Lash Princess de textura ligera y larga duración, ideal para el cuidado y realce de tu belleza natural.$bb$, $bb$img/productos/mascara-de-pestanas-essence-lash-princess.webp$bb$, 29.9, 72, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ESSENCE$bb$)
where c.id = 3
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-051$bb$, $bb$Perfume Gucci Bloom Eau de Parfum 100 ml$bb$, $bb$perfume-gucci-bloom-eau-de-parfum-100-ml$bb$, $bb$Perfume Gucci Bloom Eau de Parfum 100 ml de textura ligera y larga duración, ideal para el cuidado y realce de tu belleza natural.$bb$, $bb$img/productos/perfume-gucci-bloom-eau-de-parfum-100-ml.webp$bb$, 219.9, 65, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$GUCCI$bb$)
where c.id = 3
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-050$bb$, $bb$Perfume Dolce & Gabbana Dolce Shine 75 ml$bb$, $bb$perfume-dolce-gabbana-dolce-shine-75-ml$bb$, $bb$Perfume Dolce & Gabbana Dolce Shine 75 ml de textura ligera y larga duración, ideal para el cuidado y realce de tu belleza natural.$bb$, $bb$img/productos/perfume-dolce-gabbana-dolce-shine-75-ml.webp$bb$, 199.9, 58, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$DOLCE & GABBANA$bb$)
where c.id = 3
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-049$bb$, $bb$Perfume Dior J'adore Eau de Parfum 100 ml$bb$, $bb$perfume-dior-jadore-eau-de-parfum-100-ml$bb$, $bb$Perfume Dior J'adore Eau de Parfum 100 ml de textura ligera y larga duración, ideal para el cuidado y realce de tu belleza natural.$bb$, $bb$img/productos/perfume-dior-jadore-eau-de-parfum-100-ml.webp$bb$, 249.9, 51, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$DIOR$bb$)
where c.id = 3
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-048$bb$, $bb$Perfume Chanel Coco Noir Eau de Parfum 100 ml$bb$, $bb$perfume-chanel-coco-noir-eau-de-parfum-100-ml$bb$, $bb$Perfume Chanel Coco Noir Eau de Parfum 100 ml de textura ligera y larga duración, ideal para el cuidado y realce de tu belleza natural.$bb$, $bb$img/productos/perfume-chanel-coco-noir-eau-de-parfum-100-ml.webp$bb$, 359.9, 44, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$CHANEL$bb$)
where c.id = 3
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-047$bb$, $bb$Perfume Calvin Klein CK One 100 ml$bb$, $bb$perfume-calvin-klein-ck-one-100-ml$bb$, $bb$Perfume Calvin Klein CK One 100 ml de textura ligera y larga duración, ideal para el cuidado y realce de tu belleza natural.$bb$, $bb$img/productos/perfume-calvin-klein-ck-one-100-ml.webp$bb$, 139.9, 37, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$CALVIN KLEIN$bb$)
where c.id = 3
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-046$bb$, $bb$Lámpara de mesa$bb$, $bb$lampara-de-mesa$bb$, $bb$Lámpara de mesa con diseño moderno y materiales resistentes, ideal para renovar y organizar tus espacios.$bb$, $bb$img/productos/lampara-de-mesa.webp$bb$, 139.9, 30, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$BERU HOME$bb$)
where c.id = 9
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-045$bb$, $bb$Maceta decorativa$bb$, $bb$maceta-decorativa$bb$, $bb$Maceta decorativa con diseño moderno y materiales resistentes, ideal para renovar y organizar tus espacios.$bb$, $bb$img/productos/maceta-decorativa.webp$bb$, 39.9, 23, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$BERU HOME$bb$)
where c.id = 9
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-044$bb$, $bb$Planta decorativa para sala$bb$, $bb$planta-decorativa-para-sala$bb$, $bb$Planta decorativa para sala con diseño moderno y materiales resistentes, ideal para renovar y organizar tus espacios.$bb$, $bb$img/productos/planta-decorativa-para-sala.webp$bb$, 109.9, 16, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$BERU HOME$bb$)
where c.id = 9
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-043$bb$, $bb$Marco de fotos árbol genealógico$bb$, $bb$marco-de-fotos-arbol-genealogico$bb$, $bb$Marco de fotos árbol genealógico con diseño moderno y materiales resistentes, ideal para renovar y organizar tus espacios.$bb$, $bb$img/productos/marco-de-fotos-arbol-genealogico.webp$bb$, 84.9, 69, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$BERU HOME$bb$)
where c.id = 9
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-042$bb$, $bb$Columpio decorativo para interior$bb$, $bb$columpio-decorativo-para-interior$bb$, $bb$Columpio decorativo para interior con diseño moderno y materiales resistentes, ideal para renovar y organizar tus espacios.$bb$, $bb$img/productos/columpio-decorativo-para-interior.webp$bb$, 169.9, 62, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$BERU HOME$bb$)
where c.id = 9
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-041$bb$, $bb$Mueble de baño con lavamanos y espejo$bb$, $bb$mueble-de-bano-con-lavamanos-y-espejo$bb$, $bb$Mueble de baño con lavamanos y espejo con diseño moderno y materiales resistentes, ideal para renovar y organizar tus espacios.$bb$, $bb$img/productos/mueble-de-bano-con-lavamanos-y-espejo.webp$bb$, 2199.9, 55, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$BATH TRENDS$bb$)
where c.id = 9
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-040$bb$, $bb$Silla ejecutiva Knoll Saarinen$bb$, $bb$silla-ejecutiva-knoll-saarinen$bb$, $bb$Silla ejecutiva Knoll Saarinen con diseño moderno y materiales resistentes, ideal para renovar y organizar tus espacios.$bb$, $bb$img/productos/silla-ejecutiva-knoll-saarinen.webp$bb$, 1399.9, 48, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$KNOLL$bb$)
where c.id = 9
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-039$bb$, $bb$Velador de cerezo africano$bb$, $bb$velador-de-cerezo-africano$bb$, $bb$Velador de cerezo africano con diseño moderno y materiales resistentes, ideal para renovar y organizar tus espacios.$bb$, $bb$img/productos/velador-de-cerezo-africano.webp$bb$, 839.9, 41, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$FURNITURE CO.$bb$)
where c.id = 9
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-038$bb$, $bb$Cama de madera Annibale Colombo$bb$, $bb$cama-de-madera-annibale-colombo$bb$, $bb$Cama de madera Annibale Colombo con diseño moderno y materiales resistentes, ideal para renovar y organizar tus espacios.$bb$, $bb$img/productos/cama-de-madera-annibale-colombo.webp$bb$, 5299.9, 34, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ANNIBALE COLOMBO$bb$)
where c.id = 9
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-037$bb$, $bb$Sofá de tres cuerpos Annibale Colombo$bb$, $bb$sofa-de-tres-cuerpos-annibale-colombo$bb$, $bb$Sofá de tres cuerpos Annibale Colombo con diseño moderno y materiales resistentes, ideal para renovar y organizar tus espacios.$bb$, $bb$img/productos/sofa-de-tres-cuerpos-annibale-colombo.webp$bb$, 5999.9, 27, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ANNIBALE COLOMBO$bb$)
where c.id = 9
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-036$bb$, $bb$Espátula ranurada$bb$, $bb$espatula-ranurada$bb$, $bb$Espátula ranurada de material resistente y fácil limpieza, diseñado para el uso diario en la cocina.$bb$, $bb$img/productos/espatula-ranurada.webp$bb$, 24.9, 20, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$HomePro$bb$)
where c.id = 4
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-035$bb$, $bb$Colador de malla fina$bb$, $bb$colador-de-malla-fina$bb$, $bb$Colador de malla fina de material resistente y fácil limpieza, diseñado para el uso diario en la cocina.$bb$, $bb$img/productos/colador-de-malla-fina.webp$bb$, 29.9, 73, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$HomePro$bb$)
where c.id = 4
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-034$bb$, $bb$Rodillo de madera$bb$, $bb$rodillo-de-madera$bb$, $bb$Rodillo de madera de material resistente y fácil limpieza, diseñado para el uso diario en la cocina.$bb$, $bb$img/productos/rodillo-de-madera.webp$bb$, 34.9, 66, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$HomePro$bb$)
where c.id = 4
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-033$bb$, $bb$Especiero de cocina$bb$, $bb$especiero-de-cocina$bb$, $bb$Especiero de cocina de material resistente y fácil limpieza, diseñado para el uso diario en la cocina.$bb$, $bb$img/productos/especiero-de-cocina.webp$bb$, 54.9, 59, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$HomePro$bb$)
where c.id = 4
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-032$bb$, $bb$Olla de acero con tapa de vidrio$bb$, $bb$olla-de-acero-con-tapa-de-vidrio$bb$, $bb$Olla de acero con tapa de vidrio de material resistente y fácil limpieza, diseñado para el uso diario en la cocina.$bb$, $bb$img/productos/olla-de-acero-con-tapa-de-vidrio.webp$bb$, 109.9, 52, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$TEFAL$bb$)
where c.id = 4
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-031$bb$, $bb$Sartén antiadherente$bb$, $bb$sarten-antiadherente$bb$, $bb$Sartén antiadherente de material resistente y fácil limpieza, diseñado para el uso diario en la cocina.$bb$, $bb$img/productos/sarten-antiadherente.webp$bb$, 69.9, 45, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$TEFAL$bb$)
where c.id = 4
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-030$bb$, $bb$Cuchillo de chef$bb$, $bb$cuchillo-de-chef$bb$, $bb$Cuchillo de chef de material resistente y fácil limpieza, diseñado para el uso diario en la cocina.$bb$, $bb$img/productos/cuchillo-de-chef.webp$bb$, 39.9, 38, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$TEFAL$bb$)
where c.id = 4
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-029$bb$, $bb$Tabla de picar$bb$, $bb$tabla-de-picar$bb$, $bb$Tabla de picar de material resistente y fácil limpieza, diseñado para el uso diario en la cocina.$bb$, $bb$img/productos/tabla-de-picar.webp$bb$, 34.9, 31, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$HomePro$bb$)
where c.id = 4
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-028$bb$, $bb$Wok de acero al carbono$bb$, $bb$wok-de-acero-al-carbono$bb$, $bb$Wok de acero al carbono de material resistente y fácil limpieza, diseñado para el uso diario en la cocina.$bb$, $bb$img/productos/wok-de-acero-al-carbono.webp$bb$, 84.9, 24, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$TEFAL$bb$)
where c.id = 4
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-027$bb$, $bb$Batidora de mano$bb$, $bb$batidora-de-mano$bb$, $bb$Batidora de mano de uso doméstico, eficiente y fácil de limpiar. Ideal para simplificar las tareas de la cocina.$bb$, $bb$img/productos/batidora-de-mano.webp$bb$, 99.9, 17, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$NINJA$bb$)
where c.id = 7
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-026$bb$, $bb$Licuadora de vaso$bb$, $bb$licuadora-de-vaso$bb$, $bb$Licuadora de vaso de uso doméstico, eficiente y fácil de limpiar. Ideal para simplificar las tareas de la cocina.$bb$, $bb$img/productos/licuadora-de-vaso.webp$bb$, 109.9, 70, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$NINJA$bb$)
where c.id = 7
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-025$bb$, $bb$Cocina eléctrica de dos hornillas$bb$, $bb$cocina-electrica-de-dos-hornillas$bb$, $bb$Cocina eléctrica de dos hornillas de uso doméstico, eficiente y fácil de limpiar. Ideal para simplificar las tareas de la cocina.$bb$, $bb$img/productos/cocina-electrica-de-dos-hornillas.webp$bb$, 139.9, 63, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$BOSCH$bb$)
where c.id = 7
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-024$bb$, $bb$Horno microondas$bb$, $bb$horno-microondas$bb$, $bb$Horno microondas de uso doméstico, eficiente y fácil de limpiar. Ideal para simplificar las tareas de la cocina.$bb$, $bb$img/productos/horno-microondas.webp$bb$, 249.9, 56, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$BOSCH$bb$)
where c.id = 7
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-023$bb$, $bb$Parlante inteligente Amazon Echo Plus$bb$, $bb$parlante-inteligente-amazon-echo-plus$bb$, $bb$Parlante inteligente Amazon Echo Plus con sonido de alta fidelidad, conexión estable y diseño cómodo para el uso diario. Garantía de 12 meses.$bb$, $bb$img/productos/parlante-inteligente-amazon-echo-plus.webp$bb$, 279.9, 49, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$AMAZON$bb$)
where c.id = 1
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-022$bb$, $bb$Audífonos Beats Flex Inalámbricos$bb$, $bb$audifonos-beats-flex-inalambricos$bb$, $bb$Audífonos Beats Flex Inalámbricos con sonido de alta fidelidad, conexión estable y diseño cómodo para el uso diario. Garantía de 12 meses.$bb$, $bb$img/productos/audifonos-beats-flex-inalambricos.webp$bb$, 139.9, 42, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$BEATS$bb$)
where c.id = 1
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-021$bb$, $bb$Parlante inteligente Apple HomePod Mini Gris$bb$, $bb$parlante-inteligente-apple-homepod-mini-gris$bb$, $bb$Parlante inteligente Apple HomePod Mini Gris con sonido de alta fidelidad, conexión estable y diseño cómodo para el uso diario. Garantía de 12 meses.$bb$, $bb$img/productos/parlante-inteligente-apple-homepod-mini-gris.webp$bb$, 279.9, 35, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$APPLE$bb$)
where c.id = 1
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-020$bb$, $bb$Audífonos inalámbricos Apple AirPods$bb$, $bb$audifonos-inalambricos-apple-airpods$bb$, $bb$Audífonos inalámbricos Apple AirPods con sonido de alta fidelidad, conexión estable y diseño cómodo para el uso diario. Garantía de 12 meses.$bb$, $bb$img/productos/audifonos-inalambricos-apple-airpods.webp$bb$, 359.9, 28, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$APPLE$bb$)
where c.id = 1
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-019$bb$, $bb$Audífonos Apple AirPods Max Plata$bb$, $bb$audifonos-apple-airpods-max-plata$bb$, $bb$Audífonos Apple AirPods Max Plata con sonido de alta fidelidad, conexión estable y diseño cómodo para el uso diario. Garantía de 12 meses.$bb$, $bb$img/productos/audifonos-apple-airpods-max-plata.webp$bb$, 1499.9, 21, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$APPLE$bb$)
where c.id = 1
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-018$bb$, $bb$Batería MagSafe para iPhone$bb$, $bb$bateria-magsafe-para-iphone$bb$, $bb$Batería MagSafe para iPhone con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/bateria-magsafe-para-iphone.webp$bb$, 279.9, 74, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$APPLE$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-017$bb$, $bb$Cargador Apple para iPhone$bb$, $bb$cargador-apple-para-iphone$bb$, $bb$Cargador Apple para iPhone con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/cargador-apple-para-iphone.webp$bb$, 54.9, 67, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$APPLE$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-016$bb$, $bb$Tablet Samsung Galaxy Tab Blanca$bb$, $bb$tablet-samsung-galaxy-tab-blanca$bb$, $bb$Tablet Samsung Galaxy Tab Blanca con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/tablet-samsung-galaxy-tab-blanca.webp$bb$, 979.9, 60, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$SAMSUNG$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-015$bb$, $bb$Tablet Apple iPad Mini 2021 Starlight$bb$, $bb$tablet-apple-ipad-mini-2021-starlight$bb$, $bb$Tablet Apple iPad Mini 2021 Starlight con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/tablet-apple-ipad-mini-2021-starlight.webp$bb$, 1399.9, 53, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$APPLE$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-014$bb$, $bb$Vivo V9$bb$, $bb$vivo-v9$bb$, $bb$Vivo V9 con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/vivo-v9.webp$bb$, 839.9, 46, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$VIVO$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-013$bb$, $bb$Realme C35$bb$, $bb$realme-c35$bb$, $bb$Realme C35 con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/realme-c35.webp$bb$, 419.9, 39, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$REALME$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-012$bb$, $bb$Oppo F19 Pro Plus$bb$, $bb$oppo-f19-pro-plus$bb$, $bb$Oppo F19 Pro Plus con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/oppo-f19-pro-plus.webp$bb$, 1099.9, 32, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$OPPO$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-011$bb$, $bb$Oppo A57$bb$, $bb$oppo-a57$bb$, $bb$Oppo A57 con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/oppo-a57.webp$bb$, 699.9, 25, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$OPPO$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-010$bb$, $bb$Samsung Galaxy S7$bb$, $bb$samsung-galaxy-s7$bb$, $bb$Samsung Galaxy S7 con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/samsung-galaxy-s7.webp$bb$, 839.9, 18, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$SAMSUNG$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-009$bb$, $bb$Samsung Galaxy S10$bb$, $bb$samsung-galaxy-s10$bb$, $bb$Samsung Galaxy S10 con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/samsung-galaxy-s10.webp$bb$, 1999.9, 71, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$SAMSUNG$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-008$bb$, $bb$iPhone X 64 GB$bb$, $bb$iphone-x-64-gb$bb$, $bb$iPhone X 64 GB con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/iphone-x-64-gb.webp$bb$, 2499.9, 64, 4.9, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$APPLE$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-007$bb$, $bb$Laptop Huawei MateBook X Pro$bb$, $bb$laptop-huawei-matebook-x-pro$bb$, $bb$Laptop Huawei MateBook X Pro con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/laptop-huawei-matebook-x-pro.webp$bb$, 3899.9, 57, 4.8, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$HUAWEI$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-006$bb$, $bb$Laptop Dell XPS 13 9300$bb$, $bb$laptop-dell-xps-13-9300$bb$, $bb$Laptop Dell XPS 13 9300 con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/laptop-dell-xps-13-9300.webp$bb$, 4199.9, 50, 4.7, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$DELL$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-005$bb$, $bb$Laptop Lenovo Yoga 920$bb$, $bb$laptop-lenovo-yoga-920$bb$, $bb$Laptop Lenovo Yoga 920 con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/laptop-lenovo-yoga-920.webp$bb$, 3099.9, 43, 4.6, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$LENOVO$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-004$bb$, $bb$Tablet Samsung Galaxy Tab S8+ Gris$bb$, $bb$tablet-samsung-galaxy-tab-s8-gris$bb$, $bb$Tablet Samsung Galaxy Tab S8+ Gris con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/tablet-samsung-galaxy-tab-s8-gris.webp$bb$, 1699.9, 36, 4.5, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$SAMSUNG$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-003$bb$, $bb$Laptop Asus Zenbook Pro Duo de doble pantalla$bb$, $bb$laptop-asus-zenbook-pro-duo-de-doble-pantalla$bb$, $bb$Laptop Asus Zenbook Pro Duo de doble pantalla con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/laptop-asus-zenbook-pro-duo-de-doble-pantalla.webp$bb$, 4999.9, 29, 4.4, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$ASUS$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-002$bb$, $bb$iPhone 13 Pro 128 GB$bb$, $bb$iphone-13-pro-128-gb$bb$, $bb$iPhone 13 Pro 128 GB con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/iphone-13-pro-128-gb.webp$bb$, 3099.9, 22, 4.3, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$APPLE$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
insert into public.productos (codigo,nombre,identificador_url,descripcion,url_imagen,precio,existencias,calificacion,activo,id_categoria,id_marca,marca,categoria)
select $bb$BB-NEW-001$bb$, $bb$Laptop Apple MacBook Pro 14" Gris Espacial$bb$, $bb$laptop-apple-macbook-pro-14-gris-espacial$bb$, $bb$Laptop Apple MacBook Pro 14" Gris Espacial con pantalla de alta definición y rendimiento fluido para trabajo, estudios y entretenimiento. Incluye cargador y garantía de 12 meses.$bb$, $bb$img/productos/laptop-apple-macbook-pro-14-gris-espacial.webp$bb$, 5599.9, 15, 4.2, true, c.id, m.id, m.nombre, c.nombre
from public.categorias c join public.marcas m on lower(m.nombre) = lower($bb$APPLE$bb$)
where c.id = 15
on conflict (identificador_url) do nothing;
commit;
