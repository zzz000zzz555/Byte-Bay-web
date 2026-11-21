
create table if not exists public.promociones (
  id bigserial primary key,
  nombre text not null,
  tipo text not null check (tipo in ('envio_gratis','cupon','regalo','campana')),
  condicion text,
  valor numeric(12,2) default 0,
  monto_minimo numeric(12,2) default 0,
  stock integer default 0,
  inicia_en timestamptz not null default now(),
  termina_en timestamptz,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists public.ofertas_especiales (
  id bigserial primary key,
  id_producto bigint references public.productos(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('flash','2x1','2da_50','precio_especial')),
  precio_oferta numeric(12,2),
  stock integer default 0,
  inicia_en timestamptz not null default now(),
  termina_en timestamptz,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

grant select on public.promociones to anon, authenticated;
grant select on public.ofertas_especiales to anon, authenticated;
