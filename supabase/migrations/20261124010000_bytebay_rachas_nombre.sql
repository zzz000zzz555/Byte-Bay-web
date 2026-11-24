-- Byte · nombre elegido por el cliente para su mascota de racha.
-- Se aplica después de 20261124000000_bytebay_rachas.sql; también funciona
-- si esa migración ya estaba aplicada (add column if not exists).

alter table public.bytebay_rachas
  add column if not exists nombre text not null default 'Chispa';

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'bytebay_rachas_nombre_chk'
       and conrelid = 'public.bytebay_rachas'::regclass
  ) then
    alter table public.bytebay_rachas
      add constraint bytebay_rachas_nombre_chk
      check (char_length(btrim(nombre)) between 1 and 24);
  end if;
end;
$$;

-- El registro devuelve también el nombre guardado.
create or replace function public.bb_registrar_racha(p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_customer bigint;
  v_row public.bytebay_rachas%rowtype;
  v_hoy date := current_date;
  v_nuevo boolean := false;
begin
  v_validacion := public.bb_validar_sesion(p_access_token);

  if not coalesce((v_validacion->>'valid')::boolean, false)
     or coalesce(v_validacion->>'role', '') <> 'cliente' then
    return jsonb_build_object('ok', false, 'error', 'SESION_NO_VALIDADA');
  end if;

  v_customer := nullif(v_validacion->>'customer_id', '')::bigint;
  if v_customer is null or v_customer <= 0 then
    return jsonb_build_object('ok', false, 'error', 'CLIENTE_NO_VALIDADO');
  end if;

  select * into v_row
    from public.bytebay_rachas
   where customer_id = v_customer
     for update;

  if not found then
    insert into public.bytebay_rachas (customer_id, dias_racha, mejor_racha, ultima_visita, nombre)
    values (v_customer, 3, 3, v_hoy, 'Chispa')
    returning * into v_row;
    v_nuevo := true;
  elsif v_row.ultima_visita < v_hoy then
    if v_row.ultima_visita = v_hoy - 1 then
      v_row.dias_racha := least(v_row.dias_racha + 1, 3650);
    else
      v_row.dias_racha := 1;
    end if;
    v_row.mejor_racha := greatest(v_row.mejor_racha, v_row.dias_racha);
    v_row.ultima_visita := v_hoy;
    v_row.actualizado_en := now();

    update public.bytebay_rachas
       set dias_racha = v_row.dias_racha,
           mejor_racha = v_row.mejor_racha,
           ultima_visita = v_row.ultima_visita,
           actualizado_en = v_row.actualizado_en
     where customer_id = v_customer;
  end if;

  return jsonb_build_object(
    'ok', true,
    'dias_racha', v_row.dias_racha,
    'mejor_racha', v_row.mejor_racha,
    'nombre', coalesce(nullif(btrim(v_row.nombre), ''), 'Chispa'),
    'es_nuevo', v_nuevo,
    'fecha', v_hoy
  );
end;
$function$;

-- Cambiar el nombre. La sesión se valida en BD: el cliente no envía su id.
create or replace function public.bb_renombrar_racha(
  p_access_token text,
  p_nombre text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_customer bigint;
  v_nombre text;
begin
  v_validacion := public.bb_validar_sesion(p_access_token);

  if not coalesce((v_validacion->>'valid')::boolean, false)
     or coalesce(v_validacion->>'role', '') <> 'cliente' then
    return jsonb_build_object('ok', false, 'error', 'SESION_NO_VALIDADA');
  end if;

  v_customer := nullif(v_validacion->>'customer_id', '')::bigint;
  if v_customer is null or v_customer <= 0 then
    return jsonb_build_object('ok', false, 'error', 'CLIENTE_NO_VALIDADO');
  end if;

  v_nombre := regexp_replace(coalesce(p_nombre, ''), E'[\\000-\\037\\177]', ' ', 'g');
  v_nombre := btrim(regexp_replace(v_nombre, E'\\s+', ' ', 'g'));
  if char_length(v_nombre) < 1 or char_length(v_nombre) > 24 then
    return jsonb_build_object('ok', false, 'error', 'NOMBRE_INVALIDO');
  end if;

  insert into public.bytebay_rachas (customer_id, dias_racha, mejor_racha, ultima_visita, nombre)
  values (v_customer, 3, 3, current_date, v_nombre)
  on conflict (customer_id) do update
     set nombre = excluded.nombre,
         actualizado_en = now()
  returning nombre into v_nombre;

  return jsonb_build_object('ok', true, 'nombre', v_nombre);
end;
$function$;

revoke all on function public.bb_registrar_racha(text) from public;
revoke all on function public.bb_renombrar_racha(text, text) from public;
grant execute on function public.bb_registrar_racha(text) to anon, authenticated;
grant execute on function public.bb_renombrar_racha(text, text) to anon, authenticated;
