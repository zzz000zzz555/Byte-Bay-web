
-- ============================================================
-- MIGRACION ENTERPRISE: RBAC + CATALOGO + VARIANTES + MEDIA + REVIEWS
-- ============================================================

-- 1) Categorias: jerarquia y atributos sugeridos
alter table public.categorias
  add column if not exists parent_id bigint references public.categorias(id) on delete set null,
  add column if not exists orden integer default 0,
  add column if not exists icono text,
  add column if not exists atributos_sugeridos jsonb default '[]'::jsonb;

-- 2) Roles
create table if not exists public.roles (
  id bigserial primary key,
  nombre text not null unique,
  descripcion text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- 3) Modulos del sistema
create table if not exists public.system_modules (
  id bigserial primary key,
  clave text not null unique,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- 4) Permisos por rol y modulo
create table if not exists public.role_permissions (
  id bigserial primary key,
  id_rol bigint not null references public.roles(id) on delete cascade,
  id_modulo bigint not null references public.system_modules(id) on delete cascade,
  puede_ver boolean not null default false,
  puede_crear boolean not null default false,
  puede_editar boolean not null default false,
  puede_eliminar boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (id_rol, id_modulo)
);

-- 5) Vincular personal a roles (sin borrar rol texto legacy)
alter table public.personal
  add column if not exists id_rol bigint references public.roles(id) on delete set null;

-- 6) Productos: genero, video, especificaciones tecnicas
alter table public.productos
  add column if not exists genero text default 'Mixto',
  add column if not exists video_url text,
  add column if not exists especificaciones jsonb default '{}'::jsonb,
  add column if not exists estado_stock text default 'disponible';

-- 7) Variantes de producto
create table if not exists public.product_variants (
  id bigserial primary key,
  id_producto bigint not null references public.productos(id) on delete cascade,
  sku text unique,
  color text,
  talla text,
  capacidad text,
  modelo text,
  precio numeric(12,2) not null default 0,
  stock integer not null default 0,
  url_imagen text,
  atributos jsonb default '{}'::jsonb,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- 8) Galeria multimedia multi-angulo
create table if not exists public.product_media (
  id bigserial primary key,
  id_producto bigint not null references public.productos(id) on delete cascade,
  id_variante bigint references public.product_variants(id) on delete cascade,
  url text not null,
  tipo text not null default 'imagen' check (tipo in ('imagen','video')),
  angulo text default 'frontal' check (angulo in ('frontal','derecho','izquierdo','posterior','detalle','empaque','otro')),
  orden integer not null default 0,
  es_principal boolean not null default false,
  creado_en timestamptz not null default now()
);

-- 9) Resenas de clientes
create table if not exists public.product_reviews (
  id bigserial primary key,
  id_producto bigint not null references public.productos(id) on delete cascade,
  id_cliente bigint references public.cuentas_clientes(id) on delete set null,
  calificacion integer not null check (calificacion between 1 and 5),
  comentario text,
  verificado boolean not null default false,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- 10) Trigger: desactivar automaticamente cuando stock = 0
create or replace function public.fn_producto_stock_estado()
returns trigger as $$
begin
  if NEW.existencias is not null and NEW.existencias <= 0 then
    NEW.activo := false;
    NEW.estado_stock := 'agotado';
  else
    NEW.estado_stock := 'disponible';
  end if;
  NEW.actualizado_en := now();
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_producto_stock_estado on public.productos;
create trigger trg_producto_stock_estado
before insert or update of existencias on public.productos
for each row execute function public.fn_producto_stock_estado();

-- 11) Seed roles
insert into public.roles (nombre, descripcion) values
  ('Super Admin / Jefe', 'Control total del sistema'),
  ('Gestor de Catalogo', 'Gestion de productos, categorias y marcas'),
  ('Almacenero', 'Gestion de inventario y stock'),
  ('Soporte', 'Atencion al cliente y reclamos')
on conflict (nombre) do nothing;

-- 12) Seed modulos
insert into public.system_modules (clave, nombre, descripcion) values
  ('inventario', 'Inventario', 'Stock, lotes y movimientos'),
  ('productos', 'Productos', 'Catalogo y variantes'),
  ('categorias', 'Categorias', 'Categorias y subcategorias'),
  ('ventas', 'Ventas', 'Pedidos y pagos'),
  ('usuarios', 'Usuarios', 'Clientes y personal'),
  ('reportes', 'Reportes', 'Reportes y exportaciones'),
  ('auditoria', 'Auditoria', 'Logs y trazabilidad')
on conflict (clave) do nothing;

-- 13) Permisos: Super Admin todo true
insert into public.role_permissions (id_rol, id_modulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
select r.id, m.id, true, true, true, true
from public.roles r cross join public.system_modules m
where r.nombre = 'Super Admin / Jefe'
on conflict (id_rol, id_modulo) do update set
  puede_ver = excluded.puede_ver,
  puede_crear = excluded.puede_crear,
  puede_editar = excluded.puede_editar,
  puede_eliminar = excluded.puede_eliminar;

-- 14) Vincular personal existente con rol jefe si coincide
update public.personal p
set id_rol = (select id from public.roles where nombre = 'Super Admin / Jefe')
where p.rol ilike '%jefe%' and p.id_rol is null;

-- 15) Seed product_media desde url_imagen actual (frontal principal)
insert into public.product_media (id_producto, url, tipo, angulo, orden, es_principal)
select p.id, p.url_imagen, 'imagen', 'frontal', 0, true
from public.productos p
where p.url_imagen is not null and p.url_imagen <> ''
  and not exists (select 1 from public.product_media m where m.id_producto = p.id and m.es_principal = true);

-- 16) Genero por defecto segun categoria (heuristica simple)
update public.productos set genero = 'Mixto' where genero is null;

-- 17) Indices
create index if not exists idx_product_variants_producto on public.product_variants(id_producto);
create index if not exists idx_product_media_producto on public.product_media(id_producto);
create index if not exists idx_product_reviews_producto on public.product_reviews(id_producto);
create index if not exists idx_categorias_parent on public.categorias(parent_id);
create index if not exists idx_personal_rol on public.personal(id_rol);

-- 18) Vista catalogo con stock en vivo
create or replace view public.catalogo_productos_v2 as
select p.id, p.codigo, p.nombre, p.identificador_url, p.descripcion, p.marca, p.categoria,
  p.url_imagen, p.video_url, p.genero, p.especificaciones, p.precio as precio_regular,
  coalesce(o.precio_oferta, p.precio) as precio_venta,
  p.existencias, p.activo, p.estado_stock, p.calificacion, p.id_categoria, p.id_marca
from public.productos p
left join lateral (
  select o_1.precio_oferta from public.ofertas_producto o_1
  where o_1.id_producto = p.id and o_1.activa and o_1.inicia_en <= now()
    and (o_1.termina_en is null or o_1.termina_en > now())
  order by o_1.creado_en desc limit 1
) o on true;
