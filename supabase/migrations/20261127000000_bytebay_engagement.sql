-- Byte · reacciones globales (like/dislike) y contador de visitas.
-- El navegador solo puede ejecutar estas RPC: las tablas no tienen acceso
-- directo para anon/authenticated. El "visitante" es un id aleatorio local,
-- no un dato personal; permite deduplicar por dispositivo y día.

create table if not exists public.bytebay_reacciones (
  objetivo text not null check (objetivo in ('producto', 'pagina')),
  objetivo_id text not null default '',
  visitante text not null check (
    length(visitante) between 16 and 80 and visitante ~ '^[A-Za-z0-9_-]+$'
  ),
  tipo text not null check (tipo in ('like', 'dislike')),
  creado_en timestamptz not null default now(),
  primary key (objetivo, objetivo_id, visitante)
);

create index if not exists bytebay_reacciones_conteo_idx
  on public.bytebay_reacciones (objetivo, objetivo_id, tipo);

alter table public.bytebay_reacciones enable row level security;
revoke all on public.bytebay_reacciones from public, anon, authenticated;

create table if not exists public.bytebay_vistas_diarias (
  visitante text not null check (
    length(visitante) between 16 and 80 and visitante ~ '^[A-Za-z0-9_-]+$'
  ),
  dia date not null default current_date,
  creado_en timestamptz not null default now(),
  primary key (visitante, dia)
);

alter table public.bytebay_vistas_diarias enable row level security;
revoke all on public.bytebay_vistas_diarias from public, anon, authenticated;

create table if not exists public.bytebay_contador_vistas (
  id smallint primary key check (id = 1),
  total bigint not null default 0,
  actualizado_en timestamptz not null default now()
);

insert into public.bytebay_contador_vistas (id, total)
values (1, 0)
on conflict (id) do nothing;

alter table public.bytebay_contador_vistas enable row level security;
revoke all on public.bytebay_contador_vistas from public, anon, authenticated;

create or replace function public.bb_validar_visitante(p_visitante text)
returns boolean
language sql
immutable
as $function$
  select coalesce(p_visitante, '') ~ '^[A-Za-z0-9_-]{16,80}$';
$function$;

revoke all on function public.bb_validar_visitante(text) from public, anon, authenticated;

create or replace function public.bb_reaccionar(
  p_objetivo text,
  p_objetivo_id text,
  p_tipo text,
  p_visitante text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_objetivo text := lower(btrim(coalesce(p_objetivo, '')));
  v_id text := btrim(coalesce(p_objetivo_id, ''));
  v_tipo text := lower(btrim(coalesce(p_tipo, '')));
  v_visitante text := btrim(coalesce(p_visitante, ''));
  v_actual text;
  v_seleccion text := '';
  v_likes bigint;
  v_dislikes bigint;
begin
  if not public.bb_validar_visitante(v_visitante) then
    return jsonb_build_object('ok', false, 'error', 'VISITANTE_NO_VALIDO');
  end if;

  if v_tipo not in ('like', 'dislike') then
    return jsonb_build_object('ok', false, 'error', 'TIPO_NO_VALIDO');
  end if;

  if v_objetivo = 'pagina' then
    v_id := '';
  elsif v_objetivo = 'producto' then
    if v_id !~ '^[0-9]{1,12}$' then
      return jsonb_build_object('ok', false, 'error', 'PRODUCTO_NO_VALIDO');
    end if;
  else
    return jsonb_build_object('ok', false, 'error', 'OBJETIVO_NO_VALIDO');
  end if;

  select tipo into v_actual
    from public.bytebay_reacciones
   where objetivo = v_objetivo
     and objetivo_id = v_id
     and visitante = v_visitante
     for update;

  if v_actual = v_tipo then
    delete from public.bytebay_reacciones
     where objetivo = v_objetivo
       and objetivo_id = v_id
       and visitante = v_visitante;
  else
    insert into public.bytebay_reacciones (objetivo, objetivo_id, visitante, tipo)
    values (v_objetivo, v_id, v_visitante, v_tipo)
    on conflict (objetivo, objetivo_id, visitante)
    do update set tipo = excluded.tipo, creado_en = now();
    v_seleccion := v_tipo;
  end if;

  select count(*) filter (where tipo = 'like'),
         count(*) filter (where tipo = 'dislike')
    into v_likes, v_dislikes
    from public.bytebay_reacciones
   where objetivo = v_objetivo
     and objetivo_id = v_id;

  return jsonb_build_object(
    'ok', true,
    'likes', v_likes,
    'dislikes', v_dislikes,
    'seleccion', v_seleccion
  );
end;
$function$;

revoke all on function public.bb_reaccionar(text, text, text, text) from public;
grant execute on function public.bb_reaccionar(text, text, text, text) to anon, authenticated;

create or replace function public.bb_registrar_vista(p_visitante text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_visitante text := btrim(coalesce(p_visitante, ''));
  v_nuevo integer;
  v_total bigint;
begin
  if not public.bb_validar_visitante(v_visitante) then
    return jsonb_build_object('ok', false, 'error', 'VISITANTE_NO_VALIDO');
  end if;

  insert into public.bytebay_vistas_diarias (visitante, dia)
  values (v_visitante, current_date)
  on conflict do nothing;
  get diagnostics v_nuevo = row_count;

  if v_nuevo > 0 then
    update public.bytebay_contador_vistas
       set total = total + 1, actualizado_en = now()
     where id = 1
    returning total into v_total;
  else
    select total into v_total
      from public.bytebay_contador_vistas
     where id = 1;
  end if;

  return jsonb_build_object(
    'ok', true,
    'total', coalesce(v_total, 0),
    'contado', v_nuevo > 0,
    'fecha', current_date
  );
end;
$function$;

revoke all on function public.bb_registrar_vista(text) from public;
grant execute on function public.bb_registrar_vista(text) to anon, authenticated;

create or replace function public.bb_estado_reacciones(p_visitante text)
returns jsonb
language plpgsql
security definer
stable
set search_path to 'public', 'extensions'
as $function$
declare
  v_visitante text := btrim(coalesce(p_visitante, ''));
  v_productos jsonb;
  v_mias jsonb;
  v_likes bigint;
  v_dislikes bigint;
  v_total bigint;
begin
  if not public.bb_validar_visitante(v_visitante) then
    return jsonb_build_object('ok', false, 'error', 'VISITANTE_NO_VALIDO');
  end if;

  select coalesce(jsonb_object_agg(x.objetivo_id,
           jsonb_build_object('likes', x.likes, 'dislikes', x.dislikes)), '{}'::jsonb)
    into v_productos
    from (
      select p.id::text as objetivo_id,
             count(r.tipo) filter (where r.tipo = 'like') as likes,
             count(r.tipo) filter (where r.tipo = 'dislike') as dislikes
        from public.productos p
        left join public.bytebay_reacciones r
          on r.objetivo = 'producto'
         and r.objetivo_id = p.id::text
       group by p.id
    ) x;

  select count(*) filter (where tipo = 'like'),
         count(*) filter (where tipo = 'dislike')
    into v_likes, v_dislikes
    from public.bytebay_reacciones
   where objetivo = 'pagina'
     and objetivo_id = '';

  select coalesce(jsonb_object_agg(objetivo || ':' || objetivo_id, tipo), '{}'::jsonb)
    into v_mias
    from public.bytebay_reacciones
   where visitante = v_visitante;

  select total into v_total
    from public.bytebay_contador_vistas
   where id = 1;

  return jsonb_build_object(
    'ok', true,
    'productos', v_productos,
    'pagina', jsonb_build_object('likes', v_likes, 'dislikes', v_dislikes),
    'mias', v_mias,
    'visitas', coalesce(v_total, 0)
  );
end;
$function$;

revoke all on function public.bb_estado_reacciones(text) from public;
grant execute on function public.bb_estado_reacciones(text) to anon, authenticated;
