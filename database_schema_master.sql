-- ESQUEMA MAESTRO BYTE BAY
-- Consolida el esquema base existente y la migración aditiva de esta entrega.
-- Para cambios incrementales futuros, mantén migrations_delta_update.sql como fuente de cambios.

-- BASE DE DATOS BERU: ARCHIVO MAESTRO APROBADO
-- Historial de cambios
-- 2026-10-13: Se unificaron los scripts aprobados en un único archivo maestro.
-- 2026-10-13: Se tradujeron al español los alias públicos del catálogo y los parámetros de pedidos.
-- 2026-10-13: Se incorporaron clientes, personal, pedidos, inventario, proveedores, lotes, auditoría y reportes.
-- IMPORTANTE: los cambios nuevos se prueban primero en pruebas-base-datos.sql.
-- Solo después de comprobarlos deben copiarse a este archivo.

-- Estructura en español y catálogo de 300 productos.
-- Ejecutar en Supabase SQL Editor sobre una base nueva.

create extension if not exists pgcrypto;

create table if not exists public.cuentas_clientes (
  id bigint generated always as identity primary key,
  correo text not null unique check (correo = lower(correo)),
  nombres text, apellidos text, nombre_usuario text, contrasena_hash text,
  activa boolean not null default true, creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now()
);

create table if not exists public.productos (
  id bigint generated always as identity primary key, codigo text not null unique,
  nombre text not null, identificador_url text not null unique, descripcion text, marca text,
  categoria text not null, url_imagen text, precio numeric(12,2) not null check(precio>=0),
  precio_referencia numeric(12,2), existencias integer not null default 0 check(existencias>=0),
  calificacion numeric(2,1) check(calificacion between 0 and 5), activo boolean not null default true,
  creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now()
);
alter table public.productos
  add column if not exists marca text,
  add column if not exists categoria text not null default 'Sin categoría';
alter table public.productos add column if not exists fecha_vencimiento date;

-- Compatibilidad con bases que ya normalizaron las categorías y marcas.
create table if not exists public.categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  identificador_url text not null unique,
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create table if not exists public.marcas (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.productos
  add column if not exists id_categoria bigint,
  add column if not exists id_marca bigint;

update public.productos p
set categoria = c.nombre
from public.categorias c
where p.id_categoria = c.id
  and (p.categoria is null or p.categoria = 'Sin categoría');
update public.productos p
set marca = m.nombre
from public.marcas m
where p.id_marca = m.id and p.marca is null;

insert into public.categorias(nombre, identificador_url)
select distinct on (slug) nombre, slug
from (
  select btrim(categoria) nombre,
    lower(trim(both '-' from regexp_replace(
      translate(btrim(categoria), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'),
      '[^a-zA-Z0-9]+', '-', 'g'
    ))) slug
  from public.productos
  where nullif(btrim(categoria), '') is not null
) origen
order by slug, nombre
on conflict (identificador_url) do nothing;

insert into public.marcas(nombre)
select distinct btrim(marca)
from public.productos
where nullif(btrim(marca), '') is not null
on conflict (nombre) do nothing;

insert into public.categorias(nombre, identificador_url)
values (
  'Sin categoría',
  'sin-categoria'
)
on conflict (identificador_url) do nothing;

update public.productos p
set id_categoria = c.id
from public.categorias c
where p.id_categoria is null
  and c.identificador_url = lower(trim(both '-' from regexp_replace(
    translate(btrim(p.categoria), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'),
    '[^a-zA-Z0-9]+', '-', 'g'
  )));
update public.productos p
set id_marca = m.id
from public.marcas m
where p.id_marca is null and m.nombre = btrim(p.marca);

alter table public.productos alter column id_categoria set not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'productos_id_categoria_fk'
  ) then
    alter table public.productos add constraint productos_id_categoria_fk
      foreign key (id_categoria) references public.categorias(id) on delete restrict;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'productos_id_marca_fk'
  ) then
    alter table public.productos add constraint productos_id_marca_fk
      foreign key (id_marca) references public.marcas(id) on delete restrict;
  end if;
end;
$$;

alter table public.categorias enable row level security;
alter table public.marcas enable row level security;
drop policy if exists "Categorias activas publicas" on public.categorias;
create policy "Categorias activas publicas" on public.categorias for select using (activa);
drop policy if exists "Marcas activas publicas" on public.marcas;
create policy "Marcas activas publicas" on public.marcas for select using (activa);
grant select on public.categorias, public.marcas to anon, authenticated;

create table if not exists public.ofertas_producto (
  id bigint generated always as identity primary key, id_producto bigint not null references public.productos(id) on delete cascade,
  nombre text not null, precio_oferta numeric(12,2) not null check(precio_oferta>=0), inicia_en timestamptz not null default now(),
  termina_en timestamptz, limite_existencias integer, activa boolean not null default true, creado_en timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(), id_cuenta_cliente bigint references public.cuentas_clientes(id) on delete set null,
  correo_cliente text not null, numero_pedido text not null unique default ('BERU-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  estado text not null default 'pendiente' check(estado in('pendiente','confirmado','preparando','enviado','entregado','cancelado')),
  estado_pago text not null default 'pendiente' check(estado_pago in('pendiente','aprobado','rechazado','reembolsado')),
  metodo_pago text not null, subtotal numeric(12,2) not null default 0, envio numeric(12,2) not null default 0,
  descuento numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  direccion_envio jsonb not null default '{}'::jsonb, notas text, creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now()
);

create table if not exists public.detalles_pedido (
  id bigint generated always as identity primary key, id_pedido uuid not null references public.pedidos(id) on delete cascade,
  id_producto bigint references public.productos(id) on delete set null, nombre_producto text not null, codigo_producto text,
  cantidad integer not null check(cantidad>0), precio_unitario numeric(12,2) not null check(precio_unitario>=0),
  total_linea numeric(12,2) generated always as(cantidad*precio_unitario) stored, creado_en timestamptz not null default now()
);

create table if not exists public.movimientos_inventario (
  id bigint generated always as identity primary key, id_producto bigint not null references public.productos(id),
  id_pedido uuid references public.pedidos(id) on delete set null, cantidad integer not null check(cantidad<>0),
  motivo text not null check(motivo in('entrada','venta','ajuste','devolucion')), nota text, creado_en timestamptz not null default now()
);

-- Personal interno: sus credenciales viven en Supabase Auth; el rol vive aquí.
create table if not exists public.personal (
  id_usuario uuid primary key references auth.users(id) on delete cascade,
  nombres text not null, apellidos text not null,
  rol text not null check (rol in ('jefe','empleado')),
  activo boolean not null default true, creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now()
);

create index if not exists productos_categoria_idx on public.productos(categoria);
create index if not exists productos_id_categoria_idx on public.productos(id_categoria);
create index if not exists productos_id_marca_idx on public.productos(id_marca);
create index if not exists productos_activos_idx on public.productos(activo);
create index if not exists productos_vencimiento_idx on public.productos(fecha_vencimiento) where activo and fecha_vencimiento is not null;
create index if not exists pedidos_cliente_idx on public.pedidos(id_cuenta_cliente,creado_en desc);

create or replace function public.registrar_cuenta_cliente(p_correo text,p_nombres text default null,p_apellidos text default null,p_nombre_usuario text default null,p_contrasena text default null)
returns bigint language plpgsql security definer set search_path=public,extensions as $$
declare v_id bigint; v_correo text:=lower(trim(p_correo));
begin
  if v_correo !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'Correo no válido'; end if;
  if length(coalesce(p_contrasena,''))<8 then raise exception 'La contraseña debe tener al menos 8 caracteres'; end if;
  insert into public.cuentas_clientes(correo,nombres,apellidos,nombre_usuario,contrasena_hash)
  values(v_correo,nullif(trim(p_nombres),''),nullif(trim(p_apellidos),''),nullif(trim(p_nombre_usuario),''),crypt(p_contrasena,gen_salt('bf',10))) returning id into v_id;
  return v_id;
end; $$;

alter table public.cuentas_clientes enable row level security;
alter table public.productos enable row level security;
alter table public.ofertas_producto enable row level security;
alter table public.pedidos enable row level security;
alter table public.detalles_pedido enable row level security;
alter table public.movimientos_inventario enable row level security;
alter table public.personal enable row level security;
drop policy if exists "Productos activos públicos" on public.productos;
create policy "Productos activos públicos" on public.productos for select using(activo);
drop policy if exists "Personal ve su propio perfil" on public.personal;
create policy "Personal ve su propio perfil" on public.personal for select using(auth.uid()=id_usuario);
revoke all on function public.registrar_cuenta_cliente(text,text,text,text,text) from public;
grant execute on function public.registrar_cuenta_cliente(text,text,text,text,text) to anon,authenticated;

drop view if exists public.catalogo_productos;
create view public.catalogo_productos as
select p.id,p.codigo,p.nombre,p.identificador_url,p.descripcion,p.marca,p.categoria,p.url_imagen,
p.precio as precio_regular,coalesce(o.precio_oferta,p.precio) as precio_venta,
coalesce(round((1-coalesce(o.precio_oferta,p.precio)/nullif(p.precio,0))*100),0)::integer as porcentaje_descuento,
p.existencias,case when p.existencias=0 then 'agotado' when p.existencias<=5 then 'ultimas_unidades' else 'disponible' end as disponibilidad,p.calificacion,p.fecha_vencimiento
from public.productos p left join lateral(select * from public.ofertas_producto o where o.id_producto=p.id and o.activa and o.inicia_en<=now() and(o.termina_en is null or o.termina_en>now()) order by o.precio_oferta limit 1)o on true where p.activo;
grant select on public.catalogo_productos to anon,authenticated;

-- Ejecuta esta función desde SQL Editor para asignar rol a un usuario creado en Auth.
create or replace function public.asignar_personal(p_id_usuario uuid,p_nombres text,p_apellidos text,p_rol text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_rol not in ('jefe','empleado') then raise exception 'Rol no válido'; end if;
  insert into public.personal(id_usuario,nombres,apellidos,rol) values(p_id_usuario,p_nombres,p_apellidos,p_rol)
  on conflict(id_usuario) do update set nombres=excluded.nombres,apellidos=excluded.apellidos,rol=excluded.rol,activo=true,actualizado_en=now();
end; $$;

create or replace function public.mi_rol_personal()
returns text language sql security definer set search_path=public stable as $$
  select rol from public.personal where id_usuario=auth.uid() and activo limit 1;
$$;

create or replace function public.guardar_producto_personal(p_id bigint,p_codigo text,p_nombre text,p_categoria text,p_marca text,p_precio numeric,p_existencias integer,p_url_imagen text default null,p_descripcion text default null)
returns bigint language plpgsql security definer set search_path=public as $$
declare v_rol text; v_id bigint;
begin
  select rol into v_rol from public.personal where id_usuario=auth.uid() and activo;
  if v_rol not in ('jefe','empleado') then raise exception 'No tienes permiso para gestionar productos'; end if;
  if p_precio<0 or p_existencias<0 then raise exception 'Precio o existencias no válidos'; end if;
  if p_id is null then
    insert into public.productos(codigo,nombre,identificador_url,categoria,marca,precio,existencias,url_imagen,descripcion)
    values(p_codigo,p_nombre,lower(regexp_replace(p_nombre||'-'||p_codigo,'[^a-zA-Z0-9]+','-','g')),p_categoria,p_marca,p_precio,p_existencias,p_url_imagen,p_descripcion) returning id into v_id;
  else
    update public.productos set codigo=p_codigo,nombre=p_nombre,categoria=p_categoria,marca=p_marca,precio=p_precio,existencias=p_existencias,url_imagen=p_url_imagen,descripcion=p_descripcion,actualizado_en=now() where id=p_id returning id into v_id;
  end if;
  return v_id;
end; $$;

revoke all on function public.asignar_personal(uuid,text,text,text) from public;
revoke all on function public.mi_rol_personal() from public;
revoke all on function public.guardar_producto_personal(bigint,text,text,text,text,numeric,integer,text,text) from public;
grant execute on function public.mi_rol_personal() to authenticated;
grant execute on function public.guardar_producto_personal(bigint,text,text,text,text,numeric,integer,text,text) to authenticated;

-- Los 300 productos que usa la página: 15 categorías, 20 productos por categoría.
insert into public.categorias(nombre, identificador_url)
values
 ('Supermercado','supermercado'),('Tecnología','tecnologia'),('Electrohogar','electrohogar'),
 ('Hogar','hogar'),('Moda','moda'),('Belleza','belleza'),('Deportes','deportes'),
 ('Bebés','bebes'),('Mascotas','mascotas'),('Juguetes','juguetes'),
 ('Ferretería','ferreteria'),('Audio','audio'),('Cocina','cocina'),
 ('Limpieza','limpieza'),('Cuidado','cuidado')
on conflict (identificador_url) do nothing;

insert into public.marcas(nombre)
values
 ('ALPURA'),('SAMSUNG'),('NINJA'),('MICA'),('ADIDAS'),('LOREAL'),
 ('SPALDING'),('FISHER-PRICE'),('PEDIGREE'),('LEGO'),('BOSCH'),
 ('JBL'),('TEFAL'),('LYSOL'),('DOVE')
on conflict (nombre) do nothing;

with datos as (
 select n,
 (array['Supermercado','Tecnología','Electrohogar','Hogar','Moda','Belleza','Deportes','Bebés','Mascotas','Juguetes','Ferretería','Audio','Cocina','Limpieza','Cuidado'])[(n-1)%15+1] categoria,
 (array['ALPURA','SAMSUNG','NINJA','MICA','ADIDAS','LOREAL','SPALDING','FISHER-PRICE','PEDIGREE','LEGO','BOSCH','JBL','TEFAL','LYSOL','DOVE'])[(n-1)%15+1] marca,
 (array['Leche deslactosada 1L','Smart TV Crystal UHD 4K','Freidora de aire doble canasta','Silla ergonómica premium','Zapatillas urbanas','Kit de maquillaje profesional','Balón de basket oficial','Cubo de actividades','Alimento para perros','Set de construcción creativo','Taladro inalámbrico 18V','Parlante Bluetooth portátil','Sartén antiadherente','Desinfectante multiuso','Shampoo reparador'])[(n-1)%15+1] base_nombre,
 (array['https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80','https://images.unsplash.com/photo-1601944179066-29786cb9d32a?auto=format&fit=crop&w=600&q=80','https://images.unsplash.com/photo-1604908177225-47f5b1b2b5c0?auto=format&fit=crop&w=600&q=80','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80','https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'])[(n-1)%5+1] imagen
 from generate_series(1,300)n
)
insert into public.productos(codigo,nombre,identificador_url,descripcion,marca,categoria,url_imagen,precio,precio_referencia,existencias,calificacion,activo,id_categoria,id_marca)
select 'BERU-'||lpad(d.n::text,4,'0'),d.base_nombre||' '||d.n,lower(regexp_replace(d.base_nombre||'-'||d.n,'[^a-zA-Z0-9]+','-','g')),'Producto del catálogo Byte Bay.',d.marca,d.categoria,d.imagen,
(79+(d.n%25)*18+(d.n%7)*11+(d.n%5)*7)::numeric,greatest(round((79+(d.n%25)*18+(d.n%7)*11+(d.n%5)*7)/(1-(18+(d.n%23))/100.0)),(79+(d.n%25)*18+(d.n%7)*11+(d.n%5)*7)+40)::numeric,10,round((4.1+(d.n%9)*0.1)::numeric,1),true,c.id,m.id
from datos d
join public.categorias c on c.identificador_url = lower(trim(both '-' from regexp_replace(
  translate(btrim(d.categoria), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'),
  '[^a-zA-Z0-9]+', '-', 'g'
)))
join public.marcas m on m.nombre = d.marca
on conflict(codigo) do update set
  nombre=excluded.nombre,marca=excluded.marca,categoria=excluded.categoria,
  id_categoria=excluded.id_categoria,id_marca=excluded.id_marca,
  url_imagen=excluded.url_imagen,precio=excluded.precio,
  precio_referencia=excluded.precio_referencia,activo=true;

select count(*) as productos_activos from public.productos where activo;

-- ============================================================================
-- 2026-10-13: PROVEEDORES, LOTES, AUDITORÍA E HISTORIAL (scripts consolidados)
-- ============================================================================

create table if not exists public.proveedores (
  id bigint generated always as identity primary key,
  razon_social text not null,documento text unique,contacto_nombre text,correo text,
  telefono text,direccion text,notas text,activo boolean not null default true,
  creado_en timestamptz not null default now(),actualizado_en timestamptz not null default now()
);

create table if not exists public.lotes_inventario (
  id bigint generated always as identity primary key,
  id_producto bigint not null references public.productos(id) on delete restrict,
  id_proveedor bigint references public.proveedores(id) on delete set null,
  codigo_lote text not null,cantidad_recibida integer not null check(cantidad_recibida>0),
  existencias_actuales integer not null check(existencias_actuales>=0),
  costo_unitario numeric(12,2) check(costo_unitario>=0),fecha_vencimiento date,
  estado text not null default 'disponible' check(estado in('disponible','daniado','agotado','vencido','devuelto')),
  motivo_danio text,observacion text,creado_por uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now(),actualizado_en timestamptz not null default now(),
  unique(id_producto,codigo_lote)
);

create table if not exists public.auditoria_personal (
  id bigint generated always as identity primary key,
  id_usuario uuid references auth.users(id) on delete set null,
  accion text not null,entidad text not null,id_entidad text,
  detalle jsonb not null default '{}'::jsonb,creado_en timestamptz not null default now()
);

create table if not exists public.historial_estados_pedido (
  id bigint generated always as identity primary key,
  id_pedido uuid not null references public.pedidos(id) on delete cascade,
  estado text not null,nota text,cambiado_en timestamptz not null default now()
);

create index if not exists lotes_producto_idx on public.lotes_inventario(id_producto);
create index if not exists lotes_proveedor_idx on public.lotes_inventario(id_proveedor);
create index if not exists lotes_vencimiento_idx on public.lotes_inventario(fecha_vencimiento) where estado='disponible';
create index if not exists auditoria_personal_fecha_idx on public.auditoria_personal(creado_en desc);
create index if not exists historial_pedido_idx on public.historial_estados_pedido(id_pedido,cambiado_en desc);

alter table public.proveedores enable row level security;
alter table public.lotes_inventario enable row level security;
alter table public.auditoria_personal enable row level security;
alter table public.historial_estados_pedido enable row level security;

create or replace function public.sincronizar_existencias_producto_desde_lotes(p_id_producto bigint)
returns void language plpgsql security definer set search_path=public as $$
declare v_existencias integer;
begin
  select coalesce(sum(existencias_actuales),0)::integer into v_existencias
  from public.lotes_inventario where id_producto=p_id_producto and estado='disponible'
    and(fecha_vencimiento is null or fecha_vencimiento>current_date+7);
  update public.productos set existencias=v_existencias,activo=(v_existencias>0),actualizado_en=now()
  where id=p_id_producto;
end; $$;

create or replace function public.al_cambiar_lote_sincronizar_existencias()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='DELETE' then perform public.sincronizar_existencias_producto_desde_lotes(old.id_producto); return old; end if;
  perform public.sincronizar_existencias_producto_desde_lotes(new.id_producto);
  if tg_op='UPDATE' and new.id_producto is distinct from old.id_producto then
    perform public.sincronizar_existencias_producto_desde_lotes(old.id_producto);
  end if;
  return new;
end; $$;
drop trigger if exists lotes_sincronizar_existencias on public.lotes_inventario;
create trigger lotes_sincronizar_existencias after insert or update or delete on public.lotes_inventario
for each row execute function public.al_cambiar_lote_sincronizar_existencias();

create or replace function public.registrar_historial_estado_pedido()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' or new.estado is distinct from old.estado then
    insert into public.historial_estados_pedido(id_pedido,estado,nota)
    values(new.id,new.estado,case when tg_op='INSERT' then 'Estado inicial' else 'Cambio de estado' end);
  end if;
  return new;
end; $$;
drop trigger if exists pedidos_registrar_historial_estado on public.pedidos;
create trigger pedidos_registrar_historial_estado after insert or update of estado on public.pedidos
for each row execute function public.registrar_historial_estado_pedido();

-- ============================================================================
-- 2026-10-13: FUNCIONES APROBADAS USADAS POR LA APLICACIÓN
-- ============================================================================

create or replace function public.iniciar_sesion_cliente(p_correo text,p_contrasena text)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_cuenta public.cuentas_clientes%rowtype;
begin
  select * into v_cuenta from public.cuentas_clientes
  where correo=lower(trim(p_correo)) and activa and contrasena_hash=crypt(p_contrasena,contrasena_hash) limit 1;
  if not found then raise exception 'Correo o contraseña incorrectos'; end if;
  update public.cuentas_clientes set actualizado_en=now() where id=v_cuenta.id;
  return jsonb_build_object('id',v_cuenta.id,'correo',v_cuenta.correo,'nombres',v_cuenta.nombres,'apellidos',v_cuenta.apellidos,'nombre_usuario',v_cuenta.nombre_usuario);
end; $$;

create or replace function public.guardar_proveedor_personal(
 p_id bigint,p_razon_social text,p_documento text default null,p_contacto_nombre text default null,
 p_correo text default null,p_telefono text default null,p_direccion text default null,p_notas text default null
) returns bigint language plpgsql security definer set search_path=public as $$
declare v_id bigint;
begin
  if not exists(select 1 from public.personal where id_usuario=auth.uid() and activo) then raise exception 'Sin permiso'; end if;
  if p_id is null then
    insert into public.proveedores(razon_social,documento,contacto_nombre,correo,telefono,direccion,notas)
    values(trim(p_razon_social),nullif(trim(p_documento),''),nullif(trim(p_contacto_nombre),''),nullif(lower(trim(p_correo)),''),nullif(trim(p_telefono),''),nullif(trim(p_direccion),''),nullif(trim(p_notas),'')) returning id into v_id;
  else
    update public.proveedores set razon_social=trim(p_razon_social),documento=nullif(trim(p_documento),''),contacto_nombre=nullif(trim(p_contacto_nombre),''),correo=nullif(lower(trim(p_correo)),''),telefono=nullif(trim(p_telefono),''),direccion=nullif(trim(p_direccion),''),notas=nullif(trim(p_notas),''),actualizado_en=now() where id=p_id returning id into v_id;
  end if;
  return v_id;
end; $$;

create or replace function public.registrar_lote_personal(
 p_id_producto bigint,p_id_proveedor bigint,p_codigo_lote text,p_cantidad integer,p_costo_unitario numeric default null,
 p_fecha_vencimiento date default null,p_estado text default 'disponible',p_motivo_danio text default null,p_observacion text default null
) returns bigint language plpgsql security definer set search_path=public as $$
declare v_id bigint;
begin
  if not exists(select 1 from public.personal where id_usuario=auth.uid() and activo) then raise exception 'Sin permiso'; end if;
  insert into public.lotes_inventario(id_producto,id_proveedor,codigo_lote,cantidad_recibida,existencias_actuales,costo_unitario,fecha_vencimiento,estado,motivo_danio,observacion,creado_por)
  values(p_id_producto,p_id_proveedor,trim(p_codigo_lote),p_cantidad,p_cantidad,p_costo_unitario,p_fecha_vencimiento,p_estado,nullif(trim(p_motivo_danio),''),nullif(trim(p_observacion),''),auth.uid()) returning id into v_id;
  return v_id;
end; $$;

create or replace view public.reporte_inventario_lotes as
select l.id,l.codigo_lote,p.codigo codigo_producto,p.nombre producto,pr.razon_social proveedor,
l.cantidad_recibida,l.existencias_actuales,l.estado,l.fecha_vencimiento,l.motivo_danio,l.creado_en,
case when l.fecha_vencimiento is null then null else l.fecha_vencimiento-current_date end dias_para_vencer
from public.lotes_inventario l join public.productos p on p.id=l.id_producto
left join public.proveedores pr on pr.id=l.id_proveedor;

create or replace function public.listar_productos_inventario_personal()
returns table(id bigint,codigo text,nombre text) language sql security definer set search_path=public stable as $$
select p.id,p.codigo,p.nombre from public.productos p where exists(select 1 from public.personal pe where pe.id_usuario=auth.uid() and pe.activo) order by p.nombre $$;
create or replace function public.listar_proveedores_personal()
returns table(id bigint,razon_social text,documento text) language sql security definer set search_path=public stable as $$
select p.id,p.razon_social,p.documento from public.proveedores p where p.activo and exists(select 1 from public.personal pe where pe.id_usuario=auth.uid() and pe.activo) order by p.razon_social $$;
create or replace function public.listar_reporte_lotes_personal()
returns table(id bigint,codigo_lote text,codigo_producto text,producto text,proveedor text,existencias_actuales integer,estado text,fecha_vencimiento date,dias_para_vencer integer)
language sql security definer set search_path=public stable as $$
select r.id,r.codigo_lote,r.codigo_producto,r.producto,r.proveedor,r.existencias_actuales,r.estado,r.fecha_vencimiento,r.dias_para_vencer from public.reporte_inventario_lotes r
where exists(select 1 from public.personal p where p.id_usuario=auth.uid() and p.activo) order by r.fecha_vencimiento nulls last,r.id desc $$;

alter table public.pedidos add column if not exists codigo_operacion_yape text;
alter table public.pedidos add column if not exists codigo_verificacion text;
create unique index if not exists pedidos_codigo_verificacion_unico on public.pedidos(codigo_verificacion) where codigo_verificacion is not null;

drop function if exists public.guardar_producto_personal(bigint,text,text,text,text,numeric,integer,text,text);
create or replace function public.guardar_producto_personal(
 p_id bigint,p_codigo text,p_nombre text,p_categoria text,p_marca text,p_precio numeric,p_existencias integer,
 p_url_imagen text default null,p_descripcion text default null,p_fecha_vencimiento date default null
) returns bigint language plpgsql security definer set search_path=public as $$
declare
  v_id bigint;
  v_id_categoria bigint;
  v_id_marca bigint;
  v_slug_categoria text;
  v_activo boolean;
begin
  if not exists(select 1 from public.personal where id_usuario=auth.uid() and activo) then raise exception 'Sin permiso'; end if;
  if nullif(btrim(p_categoria), '') is null then raise exception 'La categoría es obligatoria'; end if;
  v_slug_categoria := lower(trim(both '-' from regexp_replace(
    translate(btrim(p_categoria), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'),
    '[^a-zA-Z0-9]+', '-', 'g'
  )));
  insert into public.categorias(nombre, identificador_url)
  values (btrim(p_categoria), v_slug_categoria)
  on conflict (identificador_url) do update
  set activa = true, actualizado_en = now()
  returning id into v_id_categoria;

  if nullif(btrim(p_marca), '') is not null then
    insert into public.marcas(nombre) values (btrim(p_marca))
    on conflict (nombre) do update set activa = true, actualizado_en = now()
    returning id into v_id_marca;
  end if;

  v_activo:=p_fecha_vencimiento is null or p_fecha_vencimiento>current_date+7;
  if p_id is null then
    insert into public.productos(codigo,nombre,identificador_url,categoria,marca,precio,existencias,url_imagen,descripcion,fecha_vencimiento,activo,id_categoria,id_marca)
    values(p_codigo,p_nombre,lower(regexp_replace(p_nombre||'-'||p_codigo,'[^a-zA-Z0-9]+','-','g')),p_categoria,p_marca,p_precio,p_existencias,p_url_imagen,p_descripcion,p_fecha_vencimiento,v_activo,v_id_categoria,v_id_marca) returning id into v_id;
  else
    update public.productos set codigo=p_codigo,nombre=p_nombre,categoria=p_categoria,marca=p_marca,precio=p_precio,existencias=p_existencias,url_imagen=p_url_imagen,descripcion=p_descripcion,fecha_vencimiento=p_fecha_vencimiento,activo=v_activo,id_categoria=v_id_categoria,id_marca=v_id_marca,actualizado_en=now() where id=p_id returning id into v_id;
  end if;
  return v_id;
end; $$;

drop function if exists public.crear_pedido_yape(jsonb,jsonb,text);
create function public.crear_pedido_yape(p_articulos jsonb,p_cliente jsonb,p_codigo_operacion_yape text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_pedido uuid;v_codigo text;v_item jsonb;v_producto record;v_cantidad integer;v_subtotal numeric(12,2):=0;
v_correo text:=lower(trim(coalesce(p_cliente->>'correo','')));v_nombre text:=trim(coalesce(p_cliente->>'nombre_completo',''));
v_direccion text:=trim(coalesce(p_cliente->>'direccion',''));v_telefono text:=trim(coalesce(p_cliente->>'telefono',''));
begin
  if jsonb_typeof(p_articulos)<>'array' or jsonb_array_length(p_articulos)=0 then raise exception 'Pedido vacío'; end if;
  for v_item in select value from jsonb_array_elements(p_articulos) loop
    v_cantidad:=(v_item->>'cantidad')::integer;
    select id,codigo,nombre,precio,existencias into v_producto from public.productos where id=(v_item->>'id_producto')::bigint and activo for update;
    if not found or v_cantidad<=0 then raise exception 'Producto o cantidad no válidos'; end if;
    if v_producto.existencias<v_cantidad then raise exception 'Existencias insuficientes para %',v_producto.nombre; end if;
    v_subtotal:=v_subtotal+v_producto.precio*v_cantidad;
  end loop;
  v_codigo:='YP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.pedidos(correo_cliente,metodo_pago,subtotal,envio,descuento,total,direccion_envio,notas,estado,estado_pago,codigo_operacion_yape,codigo_verificacion)
  values(v_correo,'yape',v_subtotal,0,0,v_subtotal,jsonb_build_object('nombre',v_nombre,'direccion',v_direccion,'telefono',v_telefono,'documento',coalesce(p_cliente->>'documento','')),'Pago Yape pendiente de verificación','pendiente','pendiente',upper(trim(p_codigo_operacion_yape)),v_codigo) returning id into v_pedido;
  for v_item in select value from jsonb_array_elements(p_articulos) loop
    v_cantidad:=(v_item->>'cantidad')::integer;
    select id,codigo,nombre,precio into v_producto from public.productos where id=(v_item->>'id_producto')::bigint;
    insert into public.detalles_pedido(id_pedido,id_producto,nombre_producto,codigo_producto,cantidad,precio_unitario) values(v_pedido,v_producto.id,v_producto.nombre,v_producto.codigo,v_cantidad,v_producto.precio);
    update public.productos set existencias=existencias-v_cantidad,actualizado_en=now() where id=v_producto.id;
    insert into public.movimientos_inventario(id_producto,id_pedido,cantidad,motivo,nota) values(v_producto.id,v_pedido,-v_cantidad,'venta','Pedido Yape: '||v_codigo);
  end loop;
  return jsonb_build_object('id_pedido',v_pedido,'codigo_verificacion',v_codigo,'estado_pago','pendiente');
end; $$;

create or replace function public.resumen_reportes_jefe()
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.personal where id_usuario=auth.uid() and activo and rol='jefe') then raise exception 'Solo el jefe puede consultar reportes'; end if;
  return jsonb_build_object('pedidos_pendientes',(select count(*) from public.pedidos where estado_pago='pendiente'),'ventas_confirmadas',(select count(*) from public.pedidos where estado_pago='aprobado'),'importe_ventas_confirmadas',(select coalesce(sum(total),0) from public.pedidos where estado_pago='aprobado'),'lotes_vencidos',(select count(*) from public.lotes_inventario where estado='vencido' or fecha_vencimiento<current_date),'lotes_daniados',(select count(*) from public.lotes_inventario where estado='daniado'),'lotes_por_vencer',(select count(*) from public.lotes_inventario where estado='disponible' and fecha_vencimiento between current_date and current_date+30),'productos_en_oferta',(select count(*) from public.catalogo_productos where porcentaje_descuento>0),'acciones_personal_hoy',(select count(*) from public.auditoria_personal where creado_en>=date_trunc('day',now())));
end; $$;

revoke all on function public.iniciar_sesion_cliente(text,text) from public;
grant execute on function public.iniciar_sesion_cliente(text,text) to anon,authenticated;
grant execute on function public.guardar_proveedor_personal(bigint,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.registrar_lote_personal(bigint,bigint,text,integer,numeric,date,text,text,text) to authenticated;
grant execute on function public.listar_productos_inventario_personal() to authenticated;
grant execute on function public.listar_proveedores_personal() to authenticated;
grant execute on function public.listar_reporte_lotes_personal() to authenticated;
grant execute on function public.guardar_producto_personal(bigint,text,text,text,text,numeric,integer,text,text,date) to authenticated;
grant execute on function public.crear_pedido_yape(jsonb,jsonb,text) to anon,authenticated;
grant execute on function public.resumen_reportes_jefe() to authenticated;

-- 2026-10-20: INICIO DE SESIÓN DE CLIENTES CON GOOGLE
-- El proveedor Google se configura en Supabase Auth; aquí solo se enlaza el
-- usuario autenticado con el perfil comercial y sus comentarios.
alter table public.cuentas_clientes
  add column if not exists id_usuario uuid unique references auth.users(id) on delete set null;
create index if not exists cuentas_clientes_id_usuario_idx
  on public.cuentas_clientes(id_usuario) where id_usuario is not null;

create or replace function public.sincronizar_cuenta_cliente_google()
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare
  v_id_usuario uuid:=auth.uid();
  v_correo text;
  v_meta jsonb;
  v_cuenta public.cuentas_clientes%rowtype;
begin
  if v_id_usuario is null then raise exception 'Debes iniciar sesión con Google'; end if;
  select lower(email),raw_user_meta_data into v_correo,v_meta from auth.users where id=v_id_usuario;
  if v_correo is null then raise exception 'Google no devolvió un correo válido'; end if;
  insert into public.cuentas_clientes(id_usuario,correo,nombres,apellidos,nombre_usuario,activa)
  values(v_id_usuario,v_correo,nullif(v_meta->>'given_name',''),nullif(v_meta->>'family_name',''),nullif(coalesce(v_meta->>'preferred_username',v_meta->>'name'),''),true)
  on conflict(correo) do update set
    id_usuario=excluded.id_usuario,
    nombres=coalesce(public.cuentas_clientes.nombres,excluded.nombres),
    apellidos=coalesce(public.cuentas_clientes.apellidos,excluded.apellidos),
    nombre_usuario=coalesce(public.cuentas_clientes.nombre_usuario,excluded.nombre_usuario),
    activo=true,actualizado_en=now()
  returning * into v_cuenta;
  return jsonb_build_object('id',v_cuenta.id,'correo',v_cuenta.correo,'nombres',v_cuenta.nombres,'apellidos',v_cuenta.apellidos,'nombre_usuario',v_cuenta.nombre_usuario);
end;
$$;

create or replace function public.guardar_comentario_producto_google(
  p_id_producto bigint,p_calificacion smallint,p_comentario text
) returns bigint language plpgsql security definer set search_path=public as $$
declare v_id_cuenta bigint; v_id_comentario bigint;
begin
  select id into v_id_cuenta from public.cuentas_clientes where id_usuario=auth.uid() and activa;
  if v_id_cuenta is null then raise exception 'Inicia sesión con Google antes de comentar'; end if;
  if not exists(select 1 from public.productos where id=p_id_producto and activo) then raise exception 'Producto no encontrado'; end if;
  if p_calificacion not between 1 and 5 then raise exception 'La calificación debe estar entre 1 y 5'; end if;
  if char_length(btrim(coalesce(p_comentario,''))) not between 3 and 2000 then raise exception 'El comentario debe tener entre 3 y 2000 caracteres'; end if;
  insert into public.comentarios_productos(id_producto,id_cuenta_cliente,calificacion,comentario,estado)
  values(p_id_producto,v_id_cuenta,p_calificacion,btrim(p_comentario),'pendiente')
  on conflict(id_producto,id_cuenta_cliente) do update set calificacion=excluded.calificacion,comentario=excluded.comentario,estado='pendiente',actualizado_en=now()
  returning id into v_id_comentario;
  return v_id_comentario;
end;
$$;

revoke all on function public.sincronizar_cuenta_cliente_google() from public;
revoke all on function public.guardar_comentario_producto_google(bigint,smallint,text) from public;
grant execute on function public.sincronizar_cuenta_cliente_google() to authenticated;
grant execute on function public.guardar_comentario_producto_google(bigint,smallint,text) to authenticated;

-- INICIO DE LA MIGRACIÓN DELTA
-- Byte Bay: migration delta for audit, account lifecycle, claims, settings,
-- Byte Plus membership, and offer notifications.
-- Apply after the existing Byte Bay schema. This migration is additive and idempotent.
-- Customer authentication is intentionally unchanged; the lockout columns are
-- groundwork only and must not be presented as enforced until auth is updated.

begin;

alter table public.cuentas_clientes
  add column if not exists deleted_at timestamptz,
  add column if not exists estado_cuenta text not null default 'activo',
  add column if not exists login_failed_attempts integer not null default 0,
  add column if not exists lockout_until timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cuentas_clientes_estado_cuenta_check'
  ) then
    alter table public.cuentas_clientes
      add constraint cuentas_clientes_estado_cuenta_check
      check (estado_cuenta in ('activo', 'inactivo', 'anulado'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'cuentas_clientes_login_failed_attempts_check'
  ) then
    alter table public.cuentas_clientes
      add constraint cuentas_clientes_login_failed_attempts_check
      check (login_failed_attempts >= 0);
  end if;
end;
$$;

create index if not exists cuentas_clientes_estado_cuenta_idx
  on public.cuentas_clientes(estado_cuenta, creado_en desc);

create table if not exists public.auditoria_logs (
  id bigint generated always as identity primary key,
  usuario_id text,
  responsable text,
  rol_usuario text,
  accion text not null,
  tabla_afectada text not null,
  registro_id text,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.auditoria_logs add column if not exists responsable text;

create index if not exists auditoria_logs_created_at_idx
  on public.auditoria_logs(created_at desc);
create index if not exists auditoria_logs_accion_created_at_idx
  on public.auditoria_logs(accion, created_at desc);
create index if not exists auditoria_logs_tabla_created_at_idx
  on public.auditoria_logs(tabla_afectada, created_at desc);
create index if not exists auditoria_logs_usuario_created_at_idx
  on public.auditoria_logs(usuario_id, created_at desc);

create or replace function public.completar_metadatos_auditoria()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_headers jsonb;
begin
  v_headers := coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb,
    '{}'::jsonb
  );
  new.user_agent := coalesce(new.user_agent, v_headers ->> 'user-agent');
  return new;
end;
$$;

drop trigger if exists auditoria_logs_metadatos on public.auditoria_logs;
create trigger auditoria_logs_metadatos
before insert on public.auditoria_logs
for each row execute function public.completar_metadatos_auditoria();

create table if not exists public.libro_reclamaciones (
  id bigint generated always as identity primary key,
  codigo_reclamacion text not null unique,
  cliente_nombre text not null,
  cliente_dni_ce text not null,
  cliente_email text not null,
  cliente_telefono text,
  tipo_reclamo text not null,
  categoria_reclamo text not null,
  descripcion_reclamo text not null,
  monto_involucrado numeric(12,2),
  pedido_relacionado_id uuid references public.pedidos(id) on delete set null,
  evidencia_url text,
  estado text not null default 'pendiente',
  respuesta_administracion text,
  fecha_resolucion timestamptz,
  created_at timestamptz not null default now(),
  constraint libro_reclamaciones_tipo_check
    check (tipo_reclamo in ('queja', 'reclamo')),
  constraint libro_reclamaciones_categoria_check
    check (categoria_reclamo in ('servicio', 'producto', 'facturacion', 'entrega')),
  constraint libro_reclamaciones_estado_check
    check (estado in ('pendiente', 'en_revision', 'resuelto')),
  constraint libro_reclamaciones_monto_check
    check (monto_involucrado is null or monto_involucrado >= 0),
  constraint libro_reclamaciones_nombre_check
    check (char_length(btrim(cliente_nombre)) between 2 and 200),
  constraint libro_reclamaciones_documento_check
    check (char_length(btrim(cliente_dni_ce)) between 6 and 20),
  constraint libro_reclamaciones_email_check
    check (cliente_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint libro_reclamaciones_descripcion_check
    check (char_length(btrim(descripcion_reclamo)) between 10 and 10000)
);

create index if not exists libro_reclamaciones_created_at_idx
  on public.libro_reclamaciones(created_at desc);
create index if not exists libro_reclamaciones_estado_fecha_idx
  on public.libro_reclamaciones(estado, created_at desc);
create index if not exists libro_reclamaciones_categoria_fecha_idx
  on public.libro_reclamaciones(categoria_reclamo, created_at desc);
create index if not exists libro_reclamaciones_email_fecha_idx
  on public.libro_reclamaciones(lower(cliente_email), created_at desc);

create table if not exists public.configuracion_sistema (
  id bigint generated always as identity primary key,
  clave varchar(100) not null unique,
  valor text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.suscripciones_byte_plus (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.cuentas_clientes(id) on delete restrict,
  estado text not null default 'activo',
  fecha_inicio timestamptz not null default now(),
  fecha_fin timestamptz,
  beneficios_activos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  constraint suscripciones_byte_plus_estado_check
    check (estado in ('activo', 'expirado', 'cancelado')),
  constraint suscripciones_byte_plus_fechas_check
    check (fecha_fin is null or fecha_fin >= fecha_inicio),
  constraint suscripciones_byte_plus_beneficios_check
    check (jsonb_typeof(beneficios_activos) = 'object')
);

create index if not exists suscripciones_byte_plus_usuario_idx
  on public.suscripciones_byte_plus(usuario_id, fecha_inicio desc);
create index if not exists suscripciones_byte_plus_activas_idx
  on public.suscripciones_byte_plus(usuario_id, fecha_fin)
  where estado = 'activo';
create unique index if not exists suscripciones_byte_plus_una_activa_idx
  on public.suscripciones_byte_plus(usuario_id)
  where estado = 'activo';

create table if not exists public.notificaciones_ofertas (
  id bigint generated always as identity primary key,
  titulo text not null,
  mensaje text not null,
  tipo_emision text not null default 'manual',
  producto_id bigint references public.productos(id) on delete set null,
  descuento_porcentaje numeric(5,2),
  destinatarios text not null default 'todos',
  fecha_envio timestamptz not null default now(),
  fecha_limite timestamptz,
  banner_url text,
  creado_por uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now(),
  constraint notificaciones_ofertas_tipo_check
    check (tipo_emision in ('manual', 'automatica_ia_trigger')),
  constraint notificaciones_ofertas_destinatarios_check
    check (destinatarios in ('todos', 'segmentado_activos', 'byte_plus')),
  constraint notificaciones_ofertas_descuento_check
    check (descuento_porcentaje is null or descuento_porcentaje between 0 and 100),
  constraint notificaciones_ofertas_titulo_check
    check (char_length(btrim(titulo)) between 1 and 200),
  constraint notificaciones_ofertas_mensaje_check
    check (char_length(btrim(mensaje)) between 1 and 5000),
  constraint notificaciones_ofertas_fecha_check
    check (fecha_limite is null or fecha_limite >= fecha_envio)
);

create index if not exists notificaciones_ofertas_fecha_idx
  on public.notificaciones_ofertas(fecha_envio desc);
create index if not exists notificaciones_ofertas_destinatarios_fecha_idx
  on public.notificaciones_ofertas(destinatarios, fecha_envio desc);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'reclamos-evidencias', 'reclamos-evidencias', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'marca-sitio', 'marca-sitio', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Marca del sitio: lectura pública" on storage.objects;
create policy "Marca del sitio: lectura pública"
on storage.objects for select to anon, authenticated
using (bucket_id = 'marca-sitio');

drop policy if exists "Jefe carga marca del sitio" on storage.objects;
create policy "Jefe carga marca del sitio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'marca-sitio'
  and exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol = 'jefe'
  )
);

drop policy if exists "Jefe actualiza marca del sitio" on storage.objects;
create policy "Jefe actualiza marca del sitio"
on storage.objects for update to authenticated
using (
  bucket_id = 'marca-sitio'
  and exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol = 'jefe'
  )
)
with check (
  bucket_id = 'marca-sitio'
  and exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol = 'jefe'
  )
);

alter table public.ofertas_producto
  add column if not exists super_oferta boolean not null default false,
  add column if not exists liquidacion_stock boolean not null default false;

create or replace function public.notificar_oferta_especial()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_producto text;
  v_precio numeric;
  v_regular numeric;
  v_descuento numeric(5,2);
begin
  if not new.activa or not (new.super_oferta or new.liquidacion_stock) then
    return new;
  end if;
  if tg_op = 'UPDATE'
    and old.activa = new.activa
    and old.super_oferta = new.super_oferta
    and old.liquidacion_stock = new.liquidacion_stock then
    return new;
  end if;

  select p.nombre, p.precio into v_producto, v_regular
  from public.productos p where p.id = new.id_producto;
  v_precio := new.precio_oferta;
  v_descuento := case
    when v_regular > 0 then greatest(0, least(100, round((1 - v_precio / v_regular) * 100, 2)))
    else null
  end;

  insert into public.notificaciones_ofertas(
    titulo, mensaje, tipo_emision, producto_id, descuento_porcentaje,
    destinatarios, fecha_envio, fecha_limite
  )
  values (
    case when new.super_oferta then 'Super oferta: ' else 'Liquidación: ' end || v_producto,
    'Oferta especial disponible por tiempo limitado: ' || new.nombre,
    'automatica_ia_trigger', new.id_producto, v_descuento, 'todos',
    new.inicia_en, new.termina_en
  );
  return new;
end;
$$;

drop trigger if exists ofertas_producto_notificar_especial on public.ofertas_producto;
create trigger ofertas_producto_notificar_especial
after insert or update of activa, super_oferta, liquidacion_stock on public.ofertas_producto
for each row execute function public.notificar_oferta_especial();

alter table public.auditoria_logs enable row level security;
alter table public.libro_reclamaciones enable row level security;
alter table public.configuracion_sistema enable row level security;
alter table public.suscripciones_byte_plus enable row level security;
alter table public.notificaciones_ofertas enable row level security;

revoke all on public.auditoria_logs, public.libro_reclamaciones,
  public.configuracion_sistema, public.suscripciones_byte_plus,
  public.notificaciones_ofertas from anon, authenticated;

create or replace function public.registrar_auditoria_producto()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_accion text;
  v_anterior jsonb;
  v_nuevo jsonb;
  v_id text;
  v_rol text;
  v_responsable text;
begin
  if tg_op = 'INSERT' then
    v_accion := 'REGISTRO_PRODUCTO';
    v_nuevo := to_jsonb(new);
    v_id := new.id::text;
  elsif tg_op = 'UPDATE' then
    if to_jsonb(new) = to_jsonb(old) then
      return new;
    end if;
    v_accion := 'EDICION_PRODUCTO';
    v_anterior := to_jsonb(old);
    v_nuevo := to_jsonb(new);
    v_id := new.id::text;
  else
    v_accion := 'ELIMINACION_PRODUCTO';
    v_anterior := to_jsonb(old);
    v_id := old.id::text;
  end if;

  select p.rol into v_rol
  from public.personal p
  where p.id_usuario = auth.uid() and p.activo;
  select nullif(btrim(concat_ws(' ', p.nombres, p.apellidos)), '')
  into v_responsable
  from public.personal p
  where p.id_usuario = auth.uid() and p.activo;
  if v_responsable is null then
    select u.email into v_responsable from auth.users u where u.id = auth.uid();
  end if;

  insert into public.auditoria_logs(
    usuario_id, responsable, rol_usuario, accion, tabla_afectada, registro_id,
    datos_anteriores, datos_nuevos
  )
  values (
    auth.uid()::text, v_responsable, v_rol, v_accion, 'productos', v_id,
    v_anterior, v_nuevo
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists productos_auditoria_logs on public.productos;
create trigger productos_auditoria_logs
after insert or update or delete on public.productos
for each row execute function public.registrar_auditoria_producto();

create or replace function public.registrar_cambio_estado_cuenta()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.estado_cuenta = 'anulado' and old.estado_cuenta is distinct from new.estado_cuenta then
    new.deleted_at := coalesce(new.deleted_at, now());
    insert into public.auditoria_logs(
      accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos
    )
    values (
      'ELIMINACION_LOGICA_USUARIO', 'cuentas_clientes', new.id::text,
      to_jsonb(old) - 'contrasena_hash',
      to_jsonb(new) - 'contrasena_hash'
    );
  elsif new.estado_cuenta <> 'anulado' then
    new.deleted_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists cuentas_clientes_auditoria_estado on public.cuentas_clientes;
create trigger cuentas_clientes_auditoria_estado
before update of estado_cuenta on public.cuentas_clientes
for each row execute function public.registrar_cambio_estado_cuenta();

create or replace function public.registrar_auditoria_configuracion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rol text;
  v_responsable text;
begin
  select p.rol into v_rol
  from public.personal p
  where p.id_usuario = coalesce(new.updated_by, old.updated_by) and p.activo;
  select nullif(btrim(concat_ws(' ', p.nombres, p.apellidos)), '')
  into v_responsable
  from public.personal p
  where p.id_usuario = coalesce(new.updated_by, old.updated_by) and p.activo;

  insert into public.auditoria_logs(
    usuario_id, responsable, rol_usuario, accion, tabla_afectada, registro_id,
    datos_anteriores, datos_nuevos
  )
  values (
    coalesce(new.updated_by, old.updated_by)::text, v_responsable, v_rol,
    case when tg_op = 'INSERT' then 'CREACION_CONFIGURACION' else 'ACTUALIZACION_CONFIGURACION' end,
    'configuracion_sistema', new.clave,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists configuracion_sistema_auditoria on public.configuracion_sistema;
create trigger configuracion_sistema_auditoria
after insert or update on public.configuracion_sistema
for each row execute function public.registrar_auditoria_configuracion();

create or replace function public.generar_codigo_reclamacion()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.codigo_reclamacion := 'BB-' || to_char(coalesce(new.created_at, now()), 'YYYY')
    || '-' || lpad(new.id::text, 8, '0');
  return new;
end;
$$;

drop trigger if exists libro_reclamaciones_codigo on public.libro_reclamaciones;
create trigger libro_reclamaciones_codigo
before insert on public.libro_reclamaciones
for each row execute function public.generar_codigo_reclamacion();

create or replace function public.actualizar_fecha_resolucion_reclamo()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'resuelto' and old.estado is distinct from new.estado then
    new.fecha_resolucion := coalesce(new.fecha_resolucion, now());
  elsif new.estado <> 'resuelto' then
    new.fecha_resolucion := null;
  end if;
  return new;
end;
$$;

drop trigger if exists libro_reclamaciones_fecha_resolucion on public.libro_reclamaciones;
create trigger libro_reclamaciones_fecha_resolucion
before update of estado on public.libro_reclamaciones
for each row execute function public.actualizar_fecha_resolucion_reclamo();

create or replace function public.enviar_reclamo(
  p_cliente_nombre text,
  p_cliente_dni_ce text,
  p_cliente_email text,
  p_cliente_telefono text,
  p_tipo_reclamo text,
  p_categoria_reclamo text,
  p_descripcion_reclamo text,
  p_monto_involucrado numeric default null,
  p_pedido_relacionado_id text default null,
  p_evidencia_url text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_codigo text;
  v_pedido_id uuid;
begin
  if p_evidencia_url is not null
    and p_evidencia_url !~* '^https://[^[:space:]]+$'
    and p_evidencia_url !~* '^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$' then
    raise exception 'La evidencia debe ser un enlace HTTPS o una ruta de archivo válida';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(lower(btrim(p_cliente_email)), 0));
  if (
    select count(*) from public.libro_reclamaciones r
    where lower(r.cliente_email) = lower(btrim(p_cliente_email))
      and r.created_at >= now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Se alcanzó el límite de reclamaciones por correo. Intenta más tarde.';
  end if;
  if nullif(btrim(p_pedido_relacionado_id), '') is not null then
    select p.id into v_pedido_id
    from public.pedidos p
    where p.numero_pedido = btrim(p_pedido_relacionado_id)
       or p.id::text = btrim(p_pedido_relacionado_id);
    if not found then raise exception 'No encontramos ese número de pedido'; end if;
  end if;

  insert into public.libro_reclamaciones(
    codigo_reclamacion, cliente_nombre, cliente_dni_ce, cliente_email,
    cliente_telefono, tipo_reclamo, categoria_reclamo,
    descripcion_reclamo, monto_involucrado, pedido_relacionado_id, evidencia_url
  )
  values (
    '', btrim(p_cliente_nombre), btrim(p_cliente_dni_ce), lower(btrim(p_cliente_email)),
    nullif(btrim(p_cliente_telefono), ''), p_tipo_reclamo, p_categoria_reclamo,
    btrim(p_descripcion_reclamo), p_monto_involucrado, v_pedido_id, p_evidencia_url
  )
  returning codigo_reclamacion into v_codigo;

  return v_codigo;
end;
$$;

create or replace function public.listar_reclamos_personal(
  p_estado text default null,
  p_categoria text default null,
  p_desde date default null,
  p_hasta date default null,
  p_limite integer default 500
)
returns setof public.libro_reclamaciones
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol in ('jefe', 'empleado')
  ) then
    raise exception 'Sin permiso para consultar reclamaciones';
  end if;

  return query
  select r.*
  from public.libro_reclamaciones r
  where (p_estado is null or r.estado = p_estado)
    and (p_categoria is null or r.categoria_reclamo = p_categoria)
    and (p_desde is null or r.created_at >= p_desde::timestamptz)
    and (p_hasta is null or r.created_at < (p_hasta + 1)::timestamptz)
  order by r.created_at desc
  limit least(greatest(coalesce(p_limite, 500), 1), 1000);
end;
$$;

create or replace function public.responder_reclamo_personal(
  p_id bigint,
  p_estado text,
  p_respuesta text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rol text;
  v_responsable text;
  v_anterior jsonb;
  v_nuevo jsonb;
begin
  select rol into v_rol
  from public.personal
  where id_usuario = auth.uid() and activo;
  if v_rol is null or v_rol not in ('jefe', 'empleado') then
    raise exception 'Sin permiso para responder reclamaciones';
  end if;
  select nullif(btrim(concat_ws(' ', nombres, apellidos)), '')
  into v_responsable
  from public.personal where id_usuario = auth.uid() and activo;
  if p_estado not in ('pendiente', 'en_revision', 'resuelto') then
    raise exception 'Estado de reclamación no válido';
  end if;
  if p_estado = 'resuelto' and nullif(btrim(p_respuesta), '') is null then
    raise exception 'Escribe la respuesta antes de resolver el reclamo';
  end if;

  select to_jsonb(r) into v_anterior
  from public.libro_reclamaciones r where r.id = p_id for update;
  if not found then raise exception 'Reclamación no encontrada'; end if;

  update public.libro_reclamaciones as r
  set estado = p_estado,
      respuesta_administracion = nullif(btrim(p_respuesta), '')
  where id = p_id
  returning to_jsonb(r) into v_nuevo;

  insert into public.auditoria_logs(
    usuario_id, responsable, rol_usuario, accion, tabla_afectada, registro_id,
    datos_anteriores, datos_nuevos
  )
  values (
    auth.uid()::text, v_responsable, v_rol, 'RESPUESTA_RECLAMO', 'libro_reclamaciones',
    p_id::text, v_anterior, v_nuevo
  );
end;
$$;

create or replace function public.listar_auditoria_personal(
  p_desde date default null,
  p_hasta date default null,
  p_accion text default null,
  p_usuario_id text default null,
  p_modulo text default null,
  p_limite integer default 1000
)
returns setof public.auditoria_logs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then
    raise exception 'Solo el jefe puede consultar la auditoría';
  end if;

  return query
  select a.*
  from public.auditoria_logs a
  where (p_desde is null or a.created_at >= p_desde::timestamptz)
    and (p_hasta is null or a.created_at < (p_hasta + 1)::timestamptz)
    and (p_accion is null or a.accion = p_accion)
    and (p_usuario_id is null or a.usuario_id = p_usuario_id)
    and (p_modulo is null or a.tabla_afectada = p_modulo)
  order by a.created_at desc
  limit least(greatest(coalesce(p_limite, 1000), 1), 5000);
end;
$$;

create or replace function public.resumen_ciclo_usuarios_jefe(
  p_desde date default null,
  p_hasta date default null
)
returns table(usuarios_nuevos bigint, solicitudes_baja bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then raise exception 'Solo el jefe puede consultar métricas de usuarios'; end if;

  return query
  select
    (select count(*) from public.cuentas_clientes c
      where (p_desde is null or c.creado_en >= p_desde::timestamptz)
        and (p_hasta is null or c.creado_en < (p_hasta + 1)::timestamptz)),
    (select count(*) from public.cuentas_clientes c
      where c.estado_cuenta = 'anulado'
        and c.deleted_at is not null
        and (p_desde is null or c.deleted_at >= p_desde::timestamptz)
        and (p_hasta is null or c.deleted_at < (p_hasta + 1)::timestamptz));
end;
$$;

create or replace function public.obtener_configuracion_publica()
returns table(clave varchar, valor text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select c.clave, c.valor
  from public.configuracion_sistema c
  where c.clave in (
    'nombre_comercio', 'url_logo', 'favicon', 'lema', 'contacto_soporte',
    'titulo_seo', 'pie_pagina', 'enlaces_institucionales'
  );
$$;

create or replace function public.listar_notificaciones_ofertas_publicas()
returns table(
  id bigint, titulo text, mensaje text, producto_id bigint,
  descuento_porcentaje numeric, fecha_envio timestamptz, fecha_limite timestamptz,
  banner_url text
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select n.id, n.titulo, n.mensaje, n.producto_id,
         n.descuento_porcentaje, n.fecha_envio, n.fecha_limite, n.banner_url
  from public.notificaciones_ofertas n
  where n.destinatarios = 'todos'
    and n.fecha_envio <= now()
    and (n.fecha_limite is null or n.fecha_limite > now())
  order by n.fecha_envio desc
  limit 50;
$$;

create or replace function public.crear_notificacion_jefe(
  p_titulo text,
  p_mensaje text,
  p_fecha_envio timestamptz default now(),
  p_fecha_limite timestamptz default null,
  p_banner_url text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id bigint;
begin
  if not exists (
    select 1 from public.personal where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then raise exception 'Solo el jefe puede emitir notificaciones'; end if;
  if p_banner_url is not null and p_banner_url !~* '^https://[^[:space:]]+$' then
    raise exception 'El banner debe usar una URL HTTPS válida';
  end if;

  insert into public.notificaciones_ofertas(
    titulo, mensaje, tipo_emision, destinatarios, fecha_envio,
    fecha_limite, banner_url, creado_por
  )
  values (
    btrim(p_titulo), btrim(p_mensaje), 'manual', 'todos',
    coalesce(p_fecha_envio, now()), p_fecha_limite, p_banner_url, auth.uid()
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.marcar_oferta_especial_jefe(
  p_id_oferta bigint,
  p_super_oferta boolean,
  p_liquidacion_stock boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then raise exception 'Solo el jefe puede marcar ofertas especiales'; end if;
  update public.ofertas_producto
  set super_oferta = coalesce(p_super_oferta, false),
      liquidacion_stock = coalesce(p_liquidacion_stock, false)
  where id = p_id_oferta;
  if not found then raise exception 'Oferta no encontrada'; end if;
end;
$$;

create or replace function public.guardar_configuracion_sitio_jefe(p_valores jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_entrada record;
  v_claves_permitidas text[] := array[
    'nombre_comercio', 'url_logo', 'favicon', 'lema', 'contacto_soporte',
    'titulo_seo', 'pie_pagina', 'enlaces_institucionales'
  ];
begin
  if not exists (
    select 1 from public.personal where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then raise exception 'Solo el jefe puede cambiar la configuración'; end if;
  if p_valores is null or jsonb_typeof(p_valores) <> 'object' then
    raise exception 'La configuración debe ser un objeto JSON';
  end if;

  for v_entrada in select key, value from jsonb_each(p_valores)
  loop
    if not (v_entrada.key = any(v_claves_permitidas))
      or jsonb_typeof(v_entrada.value) <> 'string' then
      raise exception 'Clave o valor de configuración no permitido';
    end if;
    if v_entrada.key in ('url_logo', 'favicon')
      and v_entrada.value #>> '{}' <> ''
      and v_entrada.value #>> '{}' !~* '^https://[^[:space:]]+$' then
      raise exception 'El logotipo y favicon deben usar URL HTTPS';
    end if;
    if v_entrada.key = 'nombre_comercio'
      and char_length(btrim(v_entrada.value #>> '{}')) not between 1 and 100 then
      raise exception 'El nombre comercial es obligatorio y no debe exceder 100 caracteres';
    end if;
  end loop;

  insert into public.configuracion_sistema(clave, valor, updated_by, updated_at)
  select key, value, auth.uid(), now()
  from jsonb_each_text(p_valores)
  on conflict (clave) do update
  set valor = excluded.valor, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.listar_ofertas_automaticas_jefe(p_limite integer default 200)
returns table(
  id bigint,
  producto_id bigint,
  producto text,
  titulo text,
  mensaje text,
  descuento_porcentaje numeric,
  fecha_envio timestamptz,
  fecha_limite timestamptz,
  creado_en timestamptz,
  estado text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then
    raise exception 'Solo el jefe puede consultar las ofertas automáticas';
  end if;

  return query
  select n.id, n.producto_id, coalesce(p.nombre, 'Producto eliminado'),
    n.titulo, n.mensaje, n.descuento_porcentaje, n.fecha_envio, n.fecha_limite,
    n.creado_en,
    case
      when n.fecha_envio > now() then 'programada'
      when n.fecha_limite is not null and n.fecha_limite <= now() then 'finalizada'
      else 'publicada'
    end
  from public.notificaciones_ofertas n
  left join public.productos p on p.id = n.producto_id
  where n.tipo_emision = 'automatica_ia_trigger'
  order by n.creado_en desc
  limit least(greatest(coalesce(p_limite, 200), 1), 500);
end;
$$;

revoke all on function public.registrar_auditoria_producto() from public, anon, authenticated;
revoke all on function public.completar_metadatos_auditoria() from public, anon, authenticated;
revoke all on function public.registrar_cambio_estado_cuenta() from public, anon, authenticated;
revoke all on function public.registrar_auditoria_configuracion() from public, anon, authenticated;
revoke all on function public.generar_codigo_reclamacion() from public, anon, authenticated;
revoke all on function public.actualizar_fecha_resolucion_reclamo() from public, anon, authenticated;
revoke all on function public.enviar_reclamo(text,text,text,text,text,text,text,numeric,text,text) from public, anon, authenticated;
revoke all on function public.listar_reclamos_personal(text,text,date,date,integer) from public, anon;
revoke all on function public.responder_reclamo_personal(bigint,text,text) from public, anon;
revoke all on function public.listar_auditoria_personal(date,date,text,text,text,integer) from public, anon;
revoke all on function public.resumen_ciclo_usuarios_jefe(date,date) from public, anon;
revoke all on function public.obtener_configuracion_publica() from public;
revoke all on function public.notificar_oferta_especial() from public, anon, authenticated;
revoke all on function public.listar_notificaciones_ofertas_publicas() from public;
revoke all on function public.crear_notificacion_jefe(text,text,timestamptz,timestamptz,text) from public, anon;
revoke all on function public.marcar_oferta_especial_jefe(bigint,boolean,boolean) from public, anon;
revoke all on function public.guardar_configuracion_sitio_jefe(jsonb) from public, anon;
revoke all on function public.listar_ofertas_automaticas_jefe(integer) from public, anon;

grant execute on function public.enviar_reclamo(text,text,text,text,text,text,text,numeric,text,text) to anon, authenticated, service_role;
grant execute on function public.listar_reclamos_personal(text,text,date,date,integer) to authenticated;
grant execute on function public.responder_reclamo_personal(bigint,text,text) to authenticated;
grant execute on function public.listar_auditoria_personal(date,date,text,text,text,integer) to authenticated;
grant execute on function public.resumen_ciclo_usuarios_jefe(date,date) to authenticated;
grant execute on function public.obtener_configuracion_publica() to anon, authenticated;
grant execute on function public.listar_notificaciones_ofertas_publicas() to anon, authenticated;
grant execute on function public.crear_notificacion_jefe(text,text,timestamptz,timestamptz,text) to authenticated;
grant execute on function public.marcar_oferta_especial_jefe(bigint,boolean,boolean) to authenticated;
grant execute on function public.guardar_configuracion_sitio_jefe(jsonb) to authenticated;
grant execute on function public.listar_ofertas_automaticas_jefe(integer) to authenticated;

commit;

notify pgrst, 'reload schema';
