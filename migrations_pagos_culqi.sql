-- ============================================================
-- BYTE BAY · Pagos automáticos con Culqi (tarjetas)
-- Idempotente: se puede ejecutar varias veces.
--
-- Regla de stock (idéntica a Mercado Pago):
--   - Al iniciar el checkout se RESERVA stock (no se descuenta).
--   - Al aprobarse el pago se DESCUENTA el stock real.
--   - Al rechazarse, fallar o expirar se LIBERA la reserva.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) Pagos de Culqi
-- ------------------------------------------------------------
create table if not exists public.pagos_culqi (
  id uuid primary key default gen_random_uuid(),
  id_pedido uuid not null unique references public.pedidos(id) on delete cascade,
  proveedor text not null default 'culqi' check (proveedor in ('culqi')),
  culqi_charge_id text unique,
  culqi_source_type text,
  culqi_state text,
  culqi_response_code text,
  external_reference text not null unique,
  idempotency_key uuid not null unique default gen_random_uuid(),
  monto numeric(12,2) not null check (monto >= 0),
  moneda text not null default 'PEN',
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aprobado','rechazado','expirado','reembolsado','revision')),
  expira_en timestamptz not null default (now() + interval '15 minutes'),
  pagado_en timestamptz,
  observacion text,
  ultimo_payload jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists pagos_culqi_estado_idx on public.pagos_culqi (estado, expira_en);
create index if not exists pagos_culqi_charge_idx on public.pagos_culqi (culqi_charge_id);
create index if not exists pagos_culqi_creado_idx on public.pagos_culqi (creado_en desc);

alter table public.pagos_culqi enable row level security;
revoke all on public.pagos_culqi from public, anon, authenticated;

-- ------------------------------------------------------------
-- 2) Eventos de webhook de Culqi (idempotencia)
-- ------------------------------------------------------------
create table if not exists public.pagos_eventos_culqi (
  id bigint generated always as identity primary key,
  event_key text not null unique,
  tipo text,
  culqi_charge_id text,
  payload jsonb,
  procesado boolean not null default false,
  error text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists pagos_eventos_culqi_charge_idx on public.pagos_eventos_culqi (culqi_charge_id);
create index if not exists pagos_eventos_culqi_creado_idx on public.pagos_eventos_culqi (creado_en desc);

alter table public.pagos_eventos_culqi enable row level security;
revoke all on public.pagos_eventos_culqi from public, anon, authenticated;

-- ------------------------------------------------------------
-- 3) Crear pedido pendiente + reservar stock (sin descontar)
--    La llama únicamente la Edge Function con service_role.
-- ------------------------------------------------------------
create or replace function public.bb_crear_pedido_culqi(
  p_articulos jsonb,
  p_cliente jsonb,
  p_cupon text default null,
  p_minutos_reserva integer default 15
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido uuid;
  v_numero text;
  v_codigo text;
  v_articulos jsonb;
  v_item jsonb;
  v_producto record;
  v_cantidad integer;
  v_subtotal numeric(12,2) := 0;
  v_envio numeric(12,2) := 0;
  v_descuento numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_tasa numeric(5,4) := 0;
  v_cupon text := upper(trim(coalesce(p_cupon, '')));
  v_correo text := lower(trim(coalesce(p_cliente->>'correo', '')));
  v_nombre text := trim(coalesce(p_cliente->>'nombre_completo', ''));
  v_direccion text := trim(coalesce(p_cliente->>'direccion', ''));
  v_telefono text := trim(coalesce(p_cliente->>'telefono', ''));
  v_documento text := trim(coalesce(p_cliente->>'documento', ''));
  v_id_pago uuid;
  v_idempotency uuid := gen_random_uuid();
  v_expira timestamptz := now() + make_interval(mins => greatest(coalesce(p_minutos_reserva, 15), 5));
  v_items jsonb := '[]'::jsonb;
  v_disponible integer;
begin
  if jsonb_typeof(p_articulos) <> 'array' or jsonb_array_length(p_articulos) = 0 then
    raise exception 'Pedido vacío';
  end if;
  if jsonb_array_length(p_articulos) > 100 then
    raise exception 'Demasiados productos en el pedido';
  end if;
  if v_correo !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Correo no válido';
  end if;
  if length(v_nombre) < 3 then
    raise exception 'Nombre del cliente no válido';
  end if;
  if length(v_direccion) < 5 then
    raise exception 'Dirección de entrega no válida';
  end if;

  if v_cupon <> '' then
    if v_cupon in ('BERU10', 'BYTE10') then
      v_tasa := 0.10;
    elsif v_cupon = 'HOGAR15' then
      v_tasa := 0.15;
    else
      raise exception 'Cupón no válido';
    end if;
  end if;

  perform public.bb_liberar_reservas_vencidas();

  -- Normaliza y suma cantidades repetidas del mismo producto.
  select coalesce(
           jsonb_agg(
             jsonb_build_object('id_producto', id_producto, 'cantidad', cantidad)
             order by id_producto
           ),
           '[]'::jsonb
         )
    into v_articulos
    from (
      select (value->>'id_producto')::bigint as id_producto,
             sum(coalesce((value->>'cantidad')::integer, 0)) as cantidad
        from jsonb_array_elements(p_articulos)
       group by (value->>'id_producto')::bigint
    ) s;

  if jsonb_array_length(v_articulos) = 0 then
    raise exception 'Pedido vacío';
  end if;

  -- Bloquea productos en orden estable para evitar interbloqueos.
  for v_item in select value from jsonb_array_elements(v_articulos) loop
    v_cantidad := coalesce((v_item->>'cantidad')::integer, 0);
    if v_cantidad < 1 or v_cantidad > 20 then
      raise exception 'Cantidad no válida';
    end if;

    select p.id, p.codigo, p.nombre, coalesce(o.precio_oferta, p.precio) as precio, p.existencias
      into v_producto
      from public.productos p
      left join lateral (
        select op.precio_oferta
          from public.ofertas_producto op
         where op.id_producto = p.id
           and op.activa
           and op.inicia_en <= now()
           and (op.termina_en is null or op.termina_en > now())
         order by op.precio_oferta
         limit 1
      ) o on true
     where p.id = (v_item->>'id_producto')::bigint
       and p.activo
       for update of p;

    if not found then
      raise exception 'Producto no disponible';
    end if;

    v_disponible := public.bb_existencias_disponibles(v_producto.id);
    if v_disponible < v_cantidad then
      raise exception 'Existencias insuficientes para %', v_producto.nombre;
    end if;

    v_subtotal := v_subtotal + (v_producto.precio * v_cantidad);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id_producto', v_producto.id,
      'codigo', v_producto.codigo,
      'titulo', v_producto.nombre,
      'precio_unitario', v_producto.precio,
      'cantidad', v_cantidad
    ));
  end loop;

  v_envio := 0;  -- Envío gratis a todo el Perú
  v_descuento := round(v_subtotal * v_tasa, 2);
  v_total := greatest(v_subtotal - v_descuento + v_envio, 0);

  v_codigo := 'CQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.pedidos(
    correo_cliente, metodo_pago, subtotal, envio, descuento, total,
    direccion_envio, notas, estado, estado_pago, codigo_verificacion
  ) values (
    v_correo, 'culqi', v_subtotal, v_envio, v_descuento, v_total,
    jsonb_build_object(
      'nombre', v_nombre,
      'direccion', v_direccion,
      'telefono', v_telefono,
      'documento', v_documento
    ),
    'Pago con Culqi (tarjeta)',
    'pendiente', 'pendiente', v_codigo
  ) returning id, numero_pedido into v_pedido, v_numero;

  for v_item in select value from jsonb_array_elements(v_items) loop
    insert into public.detalles_pedido(
      id_pedido, id_producto, nombre_producto, codigo_producto, cantidad, precio_unitario
    ) values (
      v_pedido,
      (v_item->>'id_producto')::bigint,
      v_item->>'titulo',
      v_item->>'codigo',
      (v_item->>'cantidad')::integer,
      (v_item->>'precio_unitario')::numeric
    );
  end loop;

  for v_item in select value from jsonb_array_elements(v_items) loop
    insert into public.reservas_stock(id_pedido, id_producto, cantidad, estado, expira_en)
    values (
      v_pedido,
      (v_item->>'id_producto')::bigint,
      (v_item->>'cantidad')::integer,
      'activa',
      v_expira
    );
  end loop;

  insert into public.pagos_culqi(
    id_pedido, external_reference, idempotency_key, monto, moneda, estado, expira_en
  ) values (
    v_pedido, v_pedido::text, v_idempotency, v_total, 'PEN', 'pendiente', v_expira
  ) returning id into v_id_pago;

  return jsonb_build_object(
    'pago_id', v_id_pago,
    'id_pedido', v_pedido,
    'numero_pedido', v_numero,
    'codigo_verificacion', v_codigo,
    'external_reference', v_pedido::text,
    'idempotency_key', v_idempotency,
    'subtotal', v_subtotal,
    'envio', v_envio,
    'descuento', v_descuento,
    'total', v_total,
    'moneda', 'PEN',
    'expira_en', v_expira,
    'items', v_items
  );
end;
$$;

revoke all on function public.bb_crear_pedido_culqi(jsonb, jsonb, text, integer) from public, anon, authenticated;
grant execute on function public.bb_crear_pedido_culqi(jsonb, jsonb, text, integer) to service_role;

-- ------------------------------------------------------------
-- 4) Registrar el cargo creado en Culqi
-- ------------------------------------------------------------
create or replace function public.bb_registrar_cargo_culqi(
  p_pago_id uuid,
  p_charge_id text,
  p_source_type text default null,
  p_estado text default 'pendiente',
  p_response_code text default null,
  p_payload jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago public.pagos_culqi%rowtype;
begin
  select * into v_pago
    from public.pagos_culqi
   where id = p_pago_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Pago no encontrado');
  end if;

  update public.pagos_culqi
     set culqi_charge_id = coalesce(nullif(p_charge_id, ''), culqi_charge_id),
         culqi_source_type = coalesce(nullif(p_source_type, ''), culqi_source_type),
         culqi_state = coalesce(nullif(p_estado, ''), culqi_state),
         culqi_response_code = coalesce(nullif(p_response_code, ''), culqi_response_code),
         ultimo_payload = coalesce(p_payload, ultimo_payload),
         actualizado_en = now()
   where id = p_pago_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.bb_registrar_cargo_culqi(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.bb_registrar_cargo_culqi(uuid, text, text, text, text, jsonb) to service_role;

-- ------------------------------------------------------------
-- 5) Liberar un pedido si Culqi rechazó el cargo o no pudo crearse
-- ------------------------------------------------------------
create or replace function public.bb_liberar_pedido_culqi(
  p_pago_id uuid,
  p_motivo text default 'error_creacion',
  p_payload jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago public.pagos_culqi%rowtype;
begin
  select * into v_pago
    from public.pagos_culqi
   where id = p_pago_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Pago no encontrado');
  end if;

  if v_pago.estado <> 'pendiente' then
    return jsonb_build_object('ok', true, 'estado', v_pago.estado, 'sin_cambios', true);
  end if;

  update public.reservas_stock
     set estado = 'liberada',
         actualizado_en = now()
   where id_pedido = v_pago.id_pedido
     and estado = 'activa';

  update public.pagos_culqi
     set estado = 'rechazado',
         culqi_state = p_motivo,
         ultimo_payload = coalesce(p_payload, ultimo_payload),
         actualizado_en = now()
   where id = p_pago_id;

  update public.pedidos
     set estado = 'cancelado',
         estado_pago = 'rechazado',
         actualizado_en = now()
   where id = v_pago.id_pedido
     and estado_pago = 'pendiente';

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.bb_liberar_pedido_culqi(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.bb_liberar_pedido_culqi(uuid, text, jsonb) to service_role;

-- ------------------------------------------------------------
-- 6) Aplicar el estado real del cargo de Culqi
--    - aprobado              -> confirma pedido, descuenta stock
--    - rechazado/expirado    -> libera reservas
--    - reembolsado           -> marca reembolso
--    Idempotente ante webhooks duplicados.
-- ------------------------------------------------------------
create or replace function public.bb_aplicar_estado_culqi(
  p_charge_id text,
  p_estado text,
  p_source_type text default null,
  p_payload jsonb default null,
  p_external_reference text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago public.pagos_culqi%rowtype;
  v_detalle record;
  v_stock_ok boolean := true;
  v_faltantes text[] := '{}';
  v_estado text;
  v_observacion text;
begin
  v_estado := case lower(coalesce(p_estado, ''))
    when 'aprobado' then 'aprobado'
    when 'exitosa' then 'aprobado'
    when 'venta_exitosa' then 'aprobado'
    when 'rechazado' then 'rechazado'
    when 'expirado' then 'expirado'
    when 'reembolsado' then 'reembolsado'
    else 'pendiente'
  end;

  select * into v_pago
    from public.pagos_culqi
   where culqi_charge_id = p_charge_id
   for update;

  if not found and p_external_reference is not null then
    select * into v_pago
      from public.pagos_culqi
     where external_reference = p_external_reference
     for update;

    if found then
      update public.pagos_culqi
         set culqi_charge_id = p_charge_id,
             actualizado_en = now()
       where id = v_pago.id;
      v_pago.culqi_charge_id := p_charge_id;
    end if;
  end if;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Pago no encontrado');
  end if;

  perform 1 from public.pedidos where id = v_pago.id_pedido for update;

  if v_estado = 'aprobado' then
    if v_pago.estado in ('aprobado', 'revision') then
      update public.pagos_culqi
         set culqi_state = 'Exitosa',
             culqi_source_type = coalesce(nullif(p_source_type, ''), culqi_source_type),
             ultimo_payload = p_payload,
             actualizado_en = now()
       where id = v_pago.id;
      return jsonb_build_object('ok', true, 'estado', v_pago.estado, 'sin_cambios', true);
    end if;

    -- Bloquea y valida todo el stock primero: un pago aprobado no debe dejar
    -- una venta parcial si el inventario cambió mientras el cliente pagaba.
    for v_detalle in
      select d.id_producto,
             min(d.nombre_producto) as nombre_producto,
             sum(d.cantidad)::integer as cantidad
        from public.detalles_pedido d
       where d.id_pedido = v_pago.id_pedido
         and d.id_producto is not null
       group by d.id_producto
       order by d.id_producto
    loop
      perform 1
         from public.productos
        where id = v_detalle.id_producto
        for update;

      if not found then
        v_stock_ok := false;
        v_faltantes := array_append(v_faltantes, v_detalle.nombre_producto);
        continue;
      end if;

      if (select existencias from public.productos where id = v_detalle.id_producto) < v_detalle.cantidad then
        v_stock_ok := false;
        v_faltantes := array_append(v_faltantes, v_detalle.nombre_producto);
      end if;
    end loop;

    if v_stock_ok then
      for v_detalle in
        select d.id_producto,
               sum(d.cantidad)::integer as cantidad
          from public.detalles_pedido d
         where d.id_pedido = v_pago.id_pedido
           and d.id_producto is not null
         group by d.id_producto
         order by d.id_producto
      loop
        update public.productos
           set existencias = existencias - v_detalle.cantidad,
               actualizado_en = now()
         where id = v_detalle.id_producto;

        insert into public.movimientos_inventario(
          id_producto, id_pedido, cantidad, motivo, nota
        ) values (
          v_detalle.id_producto, v_pago.id_pedido, -v_detalle.cantidad, 'venta',
          'Pago Culqi ' || coalesce(p_charge_id, '')
        );

        update public.reservas_stock
           set estado = 'confirmada',
               actualizado_en = now()
         where id_pedido = v_pago.id_pedido
           and id_producto = v_detalle.id_producto
           and estado = 'activa';
      end loop;
    end if;

    -- Las reservas restantes de este pedido ya no bloquean stock.
    update public.reservas_stock
       set estado = 'confirmada',
           actualizado_en = now()
     where id_pedido = v_pago.id_pedido
       and estado = 'activa'
       and id_producto in (
         select id_producto
           from public.detalles_pedido
          where id_pedido = v_pago.id_pedido
            and id_producto is not null
       );

    update public.reservas_stock
       set estado = 'liberada',
           actualizado_en = now()
     where id_pedido = v_pago.id_pedido
       and estado = 'activa';

    v_observacion := case
      when v_stock_ok then null
      else 'Pago aprobado con stock insuficiente: ' || array_to_string(v_faltantes, ', ')
    end;

    update public.pedidos
       set estado_pago = 'aprobado',
           estado = 'confirmado',
           notas = case
             when v_stock_ok then notas
             else concat_ws(' · ', nullif(notas, ''), v_observacion)
           end,
           actualizado_en = now()
     where id = v_pago.id_pedido;

    update public.pagos_culqi
       set estado = case when v_stock_ok then 'aprobado' else 'revision' end,
           culqi_state = 'Exitosa',
           culqi_source_type = coalesce(nullif(p_source_type, ''), culqi_source_type),
           pagado_en = coalesce(pagado_en, now()),
           observacion = v_observacion,
           ultimo_payload = p_payload,
           actualizado_en = now()
     where id = v_pago.id;

    return jsonb_build_object(
      'ok', true,
      'estado', case when v_stock_ok then 'aprobado' else 'revision' end,
      'faltantes', to_jsonb(v_faltantes)
    );
  end if;

  if v_estado in ('rechazado', 'expirado', 'reembolsado') then
    if v_pago.estado = 'aprobado' then
      if v_estado = 'reembolsado' then
        update public.pedidos
           set estado_pago = 'reembolsado',
               estado = 'cancelado',
               actualizado_en = now()
         where id = v_pago.id_pedido;

        update public.pagos_culqi
           set estado = 'reembolsado',
               culqi_state = 'Reembolsado',
               ultimo_payload = p_payload,
               actualizado_en = now()
         where id = v_pago.id;

        return jsonb_build_object('ok', true, 'estado', 'reembolsado');
      end if;

      -- Un evento tardío de fallo no debe revertir un pago ya aprobado.
      update public.pagos_culqi
         set culqi_state = coalesce(nullif(p_estado, ''), culqi_state),
             ultimo_payload = p_payload,
             actualizado_en = now()
       where id = v_pago.id;

      return jsonb_build_object('ok', true, 'estado', 'aprobado', 'sin_cambios', true);
    end if;

    update public.reservas_stock
       set estado = 'liberada',
           actualizado_en = now()
     where id_pedido = v_pago.id_pedido
       and estado = 'activa';

    update public.pedidos
       set estado = 'cancelado',
           estado_pago = case when v_estado = 'reembolsado' then 'reembolsado' else 'rechazado' end,
           actualizado_en = now()
     where id = v_pago.id_pedido
       and estado_pago in ('pendiente', 'rechazado');

    update public.pagos_culqi
       set estado = v_estado,
           culqi_state = coalesce(nullif(p_estado, ''), culqi_state),
           culqi_source_type = coalesce(nullif(p_source_type, ''), culqi_source_type),
           ultimo_payload = p_payload,
           actualizado_en = now()
     where id = v_pago.id;

    return jsonb_build_object('ok', true, 'estado', v_estado);
  end if;

  -- Pendiente: solo se actualiza la información del cargo.
  update public.pagos_culqi
     set culqi_state = coalesce(nullif(p_estado, ''), culqi_state),
         culqi_source_type = coalesce(nullif(p_source_type, ''), culqi_source_type),
         ultimo_payload = p_payload,
         actualizado_en = now()
   where id = v_pago.id;

  return jsonb_build_object('ok', true, 'estado', 'pendiente');
end;
$$;

revoke all on function public.bb_aplicar_estado_culqi(text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.bb_aplicar_estado_culqi(text, text, text, jsonb, text) to service_role;

-- ------------------------------------------------------------
-- 7) Liberar reservas vencidas (Mercado Pago + Culqi)
-- ------------------------------------------------------------
create or replace function public.bb_liberar_reservas_vencidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  with liberadas as (
    update public.reservas_stock
       set estado = 'liberada',
           actualizado_en = now()
     where estado = 'activa'
       and expira_en <= now()
     returning id_pedido
  )
  select count(*) into v_count from liberadas;

  update public.pagos_mercado_pago p
     set estado = 'expirado',
         mp_status = coalesce(nullif(p.mp_status, ''), 'expired'),
         actualizado_en = now()
   where p.estado = 'pendiente'
     and p.expira_en <= now()
     and not exists (
       select 1
         from public.reservas_stock r
        where r.id_pedido = p.id_pedido
          and r.estado = 'activa'
     );

  update public.pagos_culqi p
     set estado = 'expirado',
         culqi_state = coalesce(nullif(p.culqi_state, ''), 'Expirado'),
         actualizado_en = now()
   where p.estado = 'pendiente'
     and p.expira_en <= now()
     and not exists (
       select 1
         from public.reservas_stock r
        where r.id_pedido = p.id_pedido
          and r.estado = 'activa'
     );

  update public.pedidos pe
     set estado = 'cancelado',
         estado_pago = 'rechazado',
         actualizado_en = now()
   where pe.id in (
       select p.id_pedido
         from public.pagos_mercado_pago p
        where p.estado = 'expirado'
       union
       select p.id_pedido
         from public.pagos_culqi p
        where p.estado = 'expirado'
     )
     and pe.estado_pago = 'pendiente';

  return v_count;
end;
$$;

revoke all on function public.bb_liberar_reservas_vencidas() from public, anon, authenticated;
grant execute on function public.bb_liberar_reservas_vencidas() to service_role;

-- ------------------------------------------------------------
-- 8) Reconciliación para el panel administrativo
-- ------------------------------------------------------------
create or replace function public.bb_listar_pagos_culqi(p_limite integer default 100)
returns table(
  id_pago uuid,
  id_pedido uuid,
  numero_pedido text,
  correo_cliente text,
  estado_pedido text,
  estado_pago text,
  culqi_state text,
  culqi_response_code text,
  total numeric,
  moneda text,
  culqi_charge_id text,
  observacion text,
  creado_en timestamptz,
  pagado_en timestamptz,
  expira_en timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    pe.id,
    pe.numero_pedido,
    pe.correo_cliente,
    pe.estado,
    pe.estado_pago,
    p.culqi_state,
    p.culqi_response_code,
    p.monto,
    p.moneda,
    p.culqi_charge_id,
    p.observacion,
    p.creado_en,
    p.pagado_en,
    p.expira_en
  from public.pagos_culqi p
  join public.pedidos pe on pe.id = p.id_pedido
  order by p.creado_en desc
  limit greatest(coalesce(p_limite, 100), 1);
$$;

revoke all on function public.bb_listar_pagos_culqi(integer) from public, anon;
grant execute on function public.bb_listar_pagos_culqi(integer) to authenticated, service_role;

-- ------------------------------------------------------------
-- 9) Programar la liberación automática de reservas vencidas
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'bb-liberar-reservas-vencidas') then
      perform cron.schedule(
        'bb-liberar-reservas-vencidas',
        '*/5 * * * *',
        $cron$select public.bb_liberar_reservas_vencidas();$cron$
      );
    end if;
  end if;
end;
$$;
