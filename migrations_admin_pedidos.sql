-- Byte Bay: rastreo logístico + auditoría de cambios de estado de pedidos.
-- Adapta el spec a nuestro stack (Supabase/PostgreSQL + JS).

-- 1) Campos de tracking en pedidos
alter table public.pedidos
  add column if not exists tracking_number text,
  add column if not exists carrier text,
  add column if not exists tracking_url text,
  add column if not exists fecha_estimada_entrega timestamptz,
  add column if not exists actualizado_por bigint references public.cuentas_clientes(id) on delete set null;

-- 2) Tabla de auditoría de cambios de estado
create table if not exists public.order_status_logs (
  id bigint generated always as identity primary key,
  id_pedido uuid not null references public.pedidos(id) on delete cascade,
  estado_anterior text not null,
  estado_nuevo text not null,
  cambiado_por bigint references public.cuentas_clientes(id) on delete set null,
  motivo text,
  tracking_number text,
  carrier text,
  ip_address text,
  creado_en timestamptz not null default now()
);

create index if not exists order_status_logs_pedido_idx on public.order_status_logs (id_pedido, creado_en desc);
create index if not exists order_status_logs_creado_idx on public.order_status_logs (creado_en desc);

alter table public.order_status_logs enable row level security;
revoke all on public.order_status_logs from public, anon, authenticated;

-- 3) RPC: cambiar estado de pedido (solo admin/staff) con auditoría
create or replace function public.bb_cambiar_estado_pedido(
  p_access_token text,
  p_pedido_id uuid,
  p_nuevo_estado text,
  p_tracking_number text default null,
  p_carrier text default null,
  p_tracking_url text default null,
  p_motivo text default null,
  p_ip_address text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sesion jsonb;
  v_cliente bigint;
  v_rol text;
  v_pedido record;
  v_estados_validos text[] := array['pendiente','confirmado','preparando','enviado','entregado','cancelado'];
begin
  v_sesion := public.bb_validar_sesion(p_access_token);
  if not coalesce((v_sesion->>'valid')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', 'SESION_INVALIDA');
  end if;
  v_cliente := (v_sesion->>'customer_id')::bigint;

  -- Verificar que el usuario sea admin/staff
  select rol into v_rol from public.cuentas_clientes where id = v_cliente and activa = true;
  if v_rol is null or v_rol not in ('admin','staff','administrador') then
    return jsonb_build_object('ok', false, 'error', 'SIN_PERMISOS');
  end if;

  if p_nuevo_estado is null or not (p_nuevo_estado = any(v_estados_validos)) then
    return jsonb_build_object('ok', false, 'error', 'ESTADO_INVALIDO');
  end if;

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'PEDIDO_NO_ENCONTRADO');
  end if;

  if v_pedido.estado = p_nuevo_estado then
    return jsonb_build_object('ok', true, 'sin_cambios', true, 'estado', p_nuevo_estado);
  end if;

  -- Actualizar pedido
  update public.pedidos
     set estado = p_nuevo_estado,
         tracking_number = coalesce(nullif(trim(p_tracking_number), ''), tracking_number),
         carrier = coalesce(nullif(trim(p_carrier), ''), carrier),
         tracking_url = coalesce(nullif(trim(p_tracking_url), ''), tracking_url),
         actualizado_por = v_cliente,
         actualizado_en = now()
   where id = p_pedido_id;

  -- Registrar auditoría
  insert into public.order_status_logs (
    id_pedido, estado_anterior, estado_nuevo, cambiado_por,
    motivo, tracking_number, carrier, ip_address
  ) values (
    p_pedido_id, v_pedido.estado, p_nuevo_estado, v_cliente,
    p_motivo, p_tracking_number, p_carrier, p_ip_address
  );

  return jsonb_build_object(
    'ok', true,
    'estado_anterior', v_pedido.estado,
    'estado_nuevo', p_nuevo_estado
  );
end;
$$;

revoke all on function public.bb_cambiar_estado_pedido(text, uuid, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.bb_cambiar_estado_pedido(text, uuid, text, text, text, text, text, text) to service_role, anon, authenticated;

-- 4) RPC: listar logs de un pedido (admin)
create or replace function public.bb_listar_logs_pedido(
  p_access_token text,
  p_pedido_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sesion jsonb;
  v_cliente bigint;
  v_rol text;
  v_result jsonb;
begin
  v_sesion := public.bb_validar_sesion(p_access_token);
  if not coalesce((v_sesion->>'valid')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', 'SESION_INVALIDA');
  end if;
  v_cliente := (v_sesion->>'customer_id')::bigint;

  select rol into v_rol from public.cuentas_clientes where id = v_cliente and activa = true;
  if v_rol is null or v_rol not in ('admin','staff','administrador') then
    return jsonb_build_object('ok', false, 'error', 'SIN_PERMISOS');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', l.id,
    'estado_anterior', l.estado_anterior,
    'estado_nuevo', l.estado_nuevo,
    'cambiado_por', l.cambiado_por,
    'motivo', l.motivo,
    'tracking_number', l.tracking_number,
    'carrier', l.carrier,
    'ip_address', l.ip_address,
    'creado_en', l.creado_en
  ) order by l.creado_en desc), '[]'::jsonb)
  into v_result
  from public.order_status_logs l
  where l.id_pedido = p_pedido_id;

  return jsonb_build_object('ok', true, 'logs', v_result);
end;
$$;

revoke all on function public.bb_listar_logs_pedido(text, uuid) from public, anon, authenticated;
grant execute on function public.bb_listar_logs_pedido(text, uuid) to service_role, anon, authenticated;

-- 5) Actualizar bb_listar_pedidos_cliente para incluir tracking
create or replace function public.bb_listar_pedidos_cliente(p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sesion jsonb;
  v_cliente bigint;
  v_result jsonb;
begin
  v_sesion := public.bb_validar_sesion(p_access_token);
  if not coalesce((v_sesion->>'valid')::boolean, false) or coalesce(v_sesion->>'role','') <> 'cliente' then
    return jsonb_build_object('ok', false, 'error', 'SESION_INVALIDA');
  end if;
  v_cliente := (v_sesion->>'customer_id')::bigint;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', pe.id,
    'numero', pe.numero_pedido,
    'estado', pe.estado,
    'estado_pago', pe.estado_pago,
    'metodo_pago', pe.metodo_pago,
    'subtotal', pe.subtotal,
    'envio', pe.envio,
    'descuento', pe.descuento,
    'total', pe.total,
    'creado_en', pe.creado_en,
    'actualizado_en', pe.actualizado_en,
    'tracking_number', pe.tracking_number,
    'carrier', pe.carrier,
    'tracking_url', pe.tracking_url,
    'fecha_estimada_entrega', pe.fecha_estimada_entrega,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre', d.nombre_producto,
        'codigo', d.codigo_producto,
        'cantidad', d.cantidad,
        'precio', d.precio_unitario
      ) order by d.id)
      from public.detalles_pedido d where d.id_pedido = pe.id
    ), '[]'::jsonb)
  ) order by pe.creado_en desc), '[]'::jsonb)
  into v_result
  from public.pedidos pe
  where pe.id_cuenta_cliente = v_cliente;

  return jsonb_build_object('ok', true, 'pedidos', v_result);
end;
$$;

revoke all on function public.bb_listar_pedidos_cliente(text) from public, anon, authenticated;
grant execute on function public.bb_listar_pedidos_cliente(text) to service_role, anon, authenticated;
