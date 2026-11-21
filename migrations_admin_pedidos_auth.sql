-- Byte Bay: RPCs de administración de pedidos (usa Supabase Auth, no token de cliente).
-- Reemplaza la versión anterior basada en p_access_token para el panel admin.

create or replace function public.bb_admin_listar_pedidos()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text;
  v_result jsonb;
begin
  select rol into v_rol from public.personal where id_usuario = auth.uid() and activo;
  if v_rol is null or v_rol not in ('jefe','empleado') then
    return jsonb_build_object('ok', false, 'error', 'SIN_PERMISOS');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', pe.id,
    'numero', pe.numero_pedido,
    'estado', pe.estado,
    'estado_pago', pe.estado_pago,
    'metodo_pago', pe.metodo_pago,
    'total', pe.total,
    'correo_cliente', pe.correo_cliente,
    'creado_en', pe.creado_en,
    'tracking_number', pe.tracking_number,
    'carrier', pe.carrier,
    'tracking_url', pe.tracking_url
  ) order by pe.creado_en desc), '[]'::jsonb)
  into v_result
  from public.pedidos pe;

  return jsonb_build_object('ok', true, 'pedidos', v_result);
end;
$$;

grant execute on function public.bb_admin_listar_pedidos() to authenticated;

create or replace function public.bb_admin_cambiar_estado_pedido(
  p_pedido_id uuid,
  p_nuevo_estado text,
  p_tracking_number text default null,
  p_carrier text default null,
  p_tracking_url text default null,
  p_motivo text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text;
  v_usuario uuid;
  v_pedido record;
  v_estados_validos text[] := array['pendiente','confirmado','preparando','enviado','entregado','cancelado'];
begin
  select rol, id into v_rol, v_usuario from public.personal where id_usuario = auth.uid() and activo;
  if v_rol is null or v_rol not in ('jefe','empleado') then
    return jsonb_build_object('ok', false, 'error', 'SIN_PERMISOS');
  end if;

  if p_nuevo_estado is null or not (p_nuevo_estado = any(v_estados_validos)) then
    return jsonb_build_object('ok', false, 'error', 'ESTADO_INVALIDO');
  end if;

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'PEDIDO_NO_ENCONTRADO');
  end if;

  if v_pedido.estado = p_nuevo_estado and p_tracking_number is null and p_carrier is null then
    return jsonb_build_object('ok', true, 'sin_cambios', true, 'estado', p_nuevo_estado);
  end if;

  update public.pedidos
     set estado = p_nuevo_estado,
         tracking_number = coalesce(nullif(trim(p_tracking_number), ''), tracking_number),
         carrier = coalesce(nullif(trim(p_carrier), ''), carrier),
         tracking_url = coalesce(nullif(trim(p_tracking_url), ''), tracking_url),
         actualizado_por = (select id from public.cuentas_clientes where id_usuario = auth.uid() limit 1),
         actualizado_en = now()
   where id = p_pedido_id;

  insert into public.order_status_logs (
    id_pedido, estado_anterior, estado_nuevo, cambiado_por,
    motivo, tracking_number, carrier
  ) values (
    p_pedido_id, v_pedido.estado, p_nuevo_estado,
    (select id from public.cuentas_clientes where id_usuario = auth.uid() limit 1),
    p_motivo, p_tracking_number, p_carrier
  );

  return jsonb_build_object('ok', true, 'estado_anterior', v_pedido.estado, 'estado_nuevo', p_nuevo_estado);
end;
$$;

grant execute on function public.bb_admin_cambiar_estado_pedido(uuid, text, text, text, text, text) to authenticated;

create or replace function public.bb_admin_listar_logs_pedido(p_pedido_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text;
  v_result jsonb;
begin
  select rol into v_rol from public.personal where id_usuario = auth.uid() and activo;
  if v_rol is null or v_rol not in ('jefe','empleado') then
    return jsonb_build_object('ok', false, 'error', 'SIN_PERMISOS');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', l.id,
    'estado_anterior', l.estado_anterior,
    'estado_nuevo', l.estado_nuevo,
    'motivo', l.motivo,
    'tracking_number', l.tracking_number,
    'carrier', l.carrier,
    'creado_en', l.creado_en
  ) order by l.creado_en desc), '[]'::jsonb)
  into v_result
  from public.order_status_logs l
  where l.id_pedido = p_pedido_id;

  return jsonb_build_object('ok', true, 'logs', v_result);
end;
$$;

grant execute on function public.bb_admin_listar_logs_pedido(uuid) to authenticated;
