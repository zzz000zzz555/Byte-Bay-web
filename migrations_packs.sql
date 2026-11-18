
create table if not exists public.packs (
  id bigserial primary key,
  nombre text not null,
  descripcion text,
  precio_especial numeric(12,2) not null,
  stock integer not null default 0,
  inicia_en timestamptz not null default now(),
  termina_en timestamptz,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.pack_items (
  id bigserial primary key,
  id_pack bigint not null references public.packs(id) on delete cascade,
  id_producto bigint not null references public.productos(id) on delete cascade,
  cantidad integer not null default 1,
  unique (id_pack, id_producto)
);

create or replace view public.catalogo_packs as
select p.id, p.nombre, p.descripcion, p.precio_especial, p.stock, p.activo, p.inicia_en, p.termina_en,
  (select coalesce(sum(pi.cantidad * pr.precio),0) from public.pack_items pi join public.productos pr on pr.id=pi.id_producto where pi.id_pack=p.id) as suma_individual
from public.packs p
where p.activo and p.inicia_en <= now() and (p.termina_en is null or p.termina_en > now());

grant select on public.catalogo_packs to anon, authenticated;
