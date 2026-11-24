-- Byte · racha de visitas por cliente.
-- El cliente NO envía su id: la sesión se valida dentro de la base de datos.
-- Regla acordada: alta con 3 días; visita al día siguiente suma 1;
-- si se pierde un día, la racha vuelve a 1.

create table if not exists public.bytebay_rachas (
  customer_id bigint primary key references public.cuentas_clientes(id) on delete cascade,
  dias_racha integer not null default 3 check (dias_racha between 1 and 3650),
  mejor_racha integer not null default 3 check (mejor_racha between 1 and 3650),
  ultima_visita date not null default current_date,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.bytebay_rachas enable row level security;
revoke all on public.bytebay_rachas from public, anon, authenticated;

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
    insert into public.bytebay_rachas (customer_id, dias_racha, mejor_racha, ultima_visita)
    values (v_customer, 3, 3, v_hoy)
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
    'es_nuevo', v_nuevo,
    'fecha', v_hoy
  );
end;
$function$;

revoke all on function public.bb_registrar_racha(text) from public;
grant execute on function public.bb_registrar_racha(text) to anon, authenticated;
