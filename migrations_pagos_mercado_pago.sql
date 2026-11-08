-- ============================================================
-- BYTE BAY · Pagos automáticos con Mercado Pago Checkout Pro
-- API de órdenes (Orders API) · entorno de pruebas primero
-- Idempotente: se puede ejecutar varias veces.
--
-- Regla de stock:
--   - Al iniciar el checkout se RESERVA stock (no se descuenta).
--   - Al aprobarse el pago se DESCUENTA el stock real.
--   - Al rechazarse, fallar o expirar se LIBERA la reserva.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) Pagos de Mercado Pago
-- ------------------------------------------------------------
create table if not exists public.pagos_mercado_pago (
  id uuid primary key default gen_random_uuid(),
  id_pedido uuid not null unique references public.pedidos(id) on delete cascade,
  proveedor text not null default 'mercado_pago' check (proveedor in ('mercado_pago')),
  mp_order_id text unique,
  mp_status text not null default 'creado',
  mp_status_detail text,
  external_reference text not null unique,
  idempotency_key uuid not null unique default gen_random_uuid(),
  checkout_url text,
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

create index if not exists pagos_mp_estado_idx on public.pagos_mercado_pago (estado, expira_en);
create index if not exists pagos_mp_order_idx on public.pagos_mercado_pago (mp_order_id);
create index if not exists pagos_mp_creado_idx on public.pagos_mercado_pago (creado_en desc);

alter table public.pagos_mercado_pago enable row level security;
revoke all on public.pagos_mercado_pago from public, anon, authenticated;

-- ------------------------------------------------------------
-- 2) Eventos de webhook (idempotencia)
-- ------------------------------------------------------------
create table if not exists public.pagos_eventos_mp (
  id bigint generated always as identity primary key,
  event_key text not null unique,
  tipo text,
  accion text,
  mp_order_id text,
  payload jsonb,
  firma_valida boolean not null default false,
  procesado boolean not null default false,
  error text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists pagos_eventos_mp_order_idx on public.pagos_eventos_mp (mp_order_id);
create index if not exists pagos_eventos_mp_creado_idx on public.pagos_eventos_mp (creado_en desc);

alter table public.pagos_eventos_mp enable row level security;
revoke all on public.pagos_eventos_mp from public, anon, authenticated;

-- ------------------------------------------------------------
-- 3) Reservas de stock
-- ------------------------------------------------------------
create table if not exists public.reservas_stock (
  id bigint generated always as identity primary key,
  id_pedido uuid not null references public.pedidos(id) on delete cascade,
  id_producto bigint not null references public.productos(id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  estado text not null default 'activa'
    check (estado in ('activa','confirmada','liberada')),
  expira_en timestamptz not null default (now() + interval '15 minutes'),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (id_pedido, id_producto)
);

create index if not exists reservas_stock_activas_idx
  on public.reservas_stock (id_producto, expira_en) where estado = 'activa';
create index if not exists reservas_stock_pedido_idx
  on public.reservas_stock (id_pedido);

alter table public.reservas_stock enable row level security;
revoke all on public.reservas_stock from public, anon, authenticated;

-- ------------------------------------------------------------
-- 4) Disponibilidad real = existencias - reservas activas
-- ------------------------------------------------------------
create or replace function public.bb_existencias_disponibles(p_id_producto bigint)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select greatest(
    coalesce((select p.existencias from public.productos p where p.id = p_id_producto), 0)
    - coalesce((
        select sum(r.cantidad)
          from public.reservas_stock r
         where r.id_producto = p_id_producto
           and r.estado = 'activa'
           and r.expira_en > now()
      ), 0),
    0
  )::integer;
$$;

revoke all on function public.bb_existencias_disponibles(bigint) from public;
grant execute on function public.bb_existencias_disponibles(bigint) to anon, authenticated, service_role;

-- El catálogo público muestra el stock disponible (sin reservas activas).
create or replace view public.catalogo_productos as
select
  p.id,
  p.codigo,
  p.nombre,
  p.identificador_url,
  p.descripcion,
  p.marca,
  p.categoria,
  p.url_imagen,
  p.precio as precio_regular,
  coalesce(o.precio_oferta, p.precio) as precio_venta,
  coalesce(round((1 - coalesce(o.precio_oferta, p.precio) / nullif(p.precio, 0)) * 100), 0)::integer as porcentaje_descuento,
  d.disponibles as existencias,
  case when d.disponibles = 0 then 'agotado'
       when d.disponibles <= 5 then 'ultimas_unidades'
       else 'disponible' end as disponibilidad,
  p.calificacion,
  p.fecha_vencimiento
from public.productos p
left join lateral (
  select *
    from public.ofertas_producto o
   where o.id_producto = p.id
     and o.activa
     and o.inicia_en <= now()
     and (o.termina_en is null or o.termina_en > now())
   order by o.precio_oferta
   limit 1
) o on true
cross join lateral (
  select public.bb_existencias_disponibles(p.id) as disponibles
) d
where p.activo;

alter view public.catalogo_productos set (security_invoker = true);
grant select on public.catalogo_productos to anon, authenticated;

-- ------------------------------------------------------------
-- 5) Liberar reservas vencidas y marcar pagos expirados
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

  update public.pedidos pe
     set estado = 'cancelado',
         estado_pago = 'rechazado',
         actualizado_en = now()
   where pe.id in (
       select p.id_pedido
         from public.pagos_mercado_pago p
        where p.estado = 'expirado'
     )
     and pe.estado_pago = 'pendiente';

  return v_count;
end;
$$;

revoke all on function public.bb_liberar_reservas_vencidas() from public, anon, authenticated;
grant execute on function public.bb_liberar_reservas_vencidas() to service_role;

-- ------------------------------------------------------------
-- 6) Crear pedido pendiente + reservar stock (sin descontar)
--    La llama únicamente la Edge Function con service_role.
-- ------------------------------------------------------------
create or replace function public.bb_crear_pedido_mp(
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

  v_envio := case when v_subtotal >= 299 then 0 else 18 end;
  v_descuento := round(v_subtotal * v_tasa, 2);
  v_total := greatest(v_subtotal - v_descuento + v_envio, 0);

  v_codigo := 'MP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.pedidos(
    correo_cliente, metodo_pago, subtotal, envio, descuento, total,
    direccion_envio, notas, estado, estado_pago, codigo_verificacion
  ) values (
    v_correo, 'mercado_pago', v_subtotal, v_envio, v_descuento, v_total,
    jsonb_build_object(
      'nombre', v_nombre,
      'direccion', v_direccion,
      'telefono', v_telefono,
      'documento', v_documento
    ),
    'Pago con Mercado Pago (Checkout Pro)',
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

  insert into public.pagos_mercado_pago(
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

revoke all on function public.bb_crear_pedido_mp(jsonb, jsonb, text, integer) from public, anon, authenticated;
grant execute on function public.bb_crear_pedido_mp(jsonb, jsonb, text, integer) to service_role;

-- ------------------------------------------------------------
-- 7) Registrar la orden creada en Mercado Pago
-- ------------------------------------------------------------
create or replace function public.bb_registrar_orden_mp(
  p_pago_id uuid,
  p_mp_order_id text,
  p_checkout_url text,
  p_mp_status text default 'created',
  p_payload jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago public.pagos_mercado_pago%rowtype;
begin
  select * into v_pago
    from public.pagos_mercado_pago
   where id = p_pago_id
   for update;

  if not found then
    raise exception 'Pago no encontrado';
  end if;

  if v_pago.estado <> 'pendiente' then
    return jsonb_build_object('ok', true, 'estado', v_pago.estado, 'sin_cambios', true);
  end if;

  update public.pagos_mercado_pago
     set mp_order_id = p_mp_order_id,
         checkout_url = p_checkout_url,
         mp_status = coalesce(nullif(p_mp_status, ''), mp_status),
         ultimo_payload = p_payload,
         actualizado_en = now()
   where id = p_pago_id;

  return jsonb_build_object('ok', true, 'estado', 'pendiente');
end;
$$;

revoke all on function public.bb_registrar_orden_mp(uuid, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.bb_registrar_orden_mp(uuid, text, text, text, jsonb) to service_role;

-- ------------------------------------------------------------
-- 8) Liberar un pedido si Mercado Pago no pudo crearse
-- ------------------------------------------------------------
create or replace function public.bb_liberar_pedido_mp(
  p_pago_id uuid,
  p_motivo text default 'error_creacion',
  p_payload jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago public.pagos_mercado_pago%rowtype;
begin
  select * into v_pago
    from public.pagos_mercado_pago
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

  update public.pagos_mercado_pago
     set estado = 'rechazado',
         mp_status = p_motivo,
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

revoke all on function public.bb_liberar_pedido_mp(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.bb_liberar_pedido_mp(uuid, text, jsonb) to service_role;

-- ------------------------------------------------------------
-- 9) Aplicar el estado real de la orden de Mercado Pago
--    - processed/accredited  -> aprobado, descuenta stock
--    - failed/canceled       -> rechazado/expirado, libera reservas
--    - refunded/charge_back  -> reembolsado
--    Idempotente ante webhooks duplicados.
-- ------------------------------------------------------------
create or replace function public.bb_aplicar_estado_pago(
  p_mp_order_id text,
  p_mp_status text,
  p_mp_status_detail text default null,
  p_payload jsonb default null,
  p_external_reference text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago public.pagos_mercado_pago%rowtype;
  v_pedido public.pedidos%rowtype;
  v_detalle record;
  v_stock_ok boolean := true;
  v_faltantes text[] := '{}';
  v_estado text;
  v_observacion text;
begin
  select * into v_pago
    from public.pagos_mercado_pago
   where mp_order_id = p_mp_order_id
   for update;

  if not found and p_external_reference is not null then
    select * into v_pago
      from public.pagos_mercado_pago
     where external_reference = p_external_reference
     for update;

    if found then
      update public.pagos_mercado_pago
         set mp_order_id = p_mp_order_id,
             actualizado_en = now()
       where id = v_pago.id;
      v_pago.mp_order_id := p_mp_order_id;
    end if;
  end if;

  if not found then
    raise exception 'Pago no encontrado para la orden %', p_mp_order_id;
  end if;

  select * into v_pedido
    from public.pedidos
   where id = v_pago.id_pedido
   for update;

  if not found then
    raise exception 'Pedido no encontrado';
  end if;

  v_estado := case
    when p_mp_status = 'processed' and coalesce(p_mp_status_detail, '') = 'refunded' then 'reembolsado'
    when p_mp_status = 'processed' then 'aprobado'
    when p_mp_status = 'refunded' then 'reembolsado'
    when p_mp_status = 'charged_back' then 'reembolsado'
    when p_mp_status in ('canceled', 'failed') and coalesce(p_mp_status_detail, '') = 'expired' then 'expirado'
    when p_mp_status in ('failed', 'canceled') then 'rechazado'
    when p_mp_status in ('created', 'processing', 'action_required') then 'pendiente'
    else 'pendiente'
  end;

  if v_estado = 'aprobado' then
    if v_pago.estado in ('aprobado', 'revision') then
      update public.pagos_mercado_pago
         set mp_status = p_mp_status,
             mp_status_detail = p_mp_status_detail,
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
          'Pago Mercado Pago ' || coalesce(p_mp_order_id, '')
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

    update public.pagos_mercado_pago
       set estado = case when v_stock_ok then 'aprobado' else 'revision' end,
           mp_status = p_mp_status,
           mp_status_detail = p_mp_status_detail,
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

        update public.pagos_mercado_pago
           set estado = 'reembolsado',
               mp_status = p_mp_status,
               mp_status_detail = p_mp_status_detail,
               ultimo_payload = p_payload,
               actualizado_en = now()
         where id = v_pago.id;

        return jsonb_build_object('ok', true, 'estado', 'reembolsado');
      end if;

      -- Un evento tardío de fallo no debe revertir un pago ya aprobado.
      update public.pagos_mercado_pago
         set mp_status = p_mp_status,
             mp_status_detail = p_mp_status_detail,
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

    update public.pagos_mercado_pago
       set estado = v_estado,
           mp_status = p_mp_status,
           mp_status_detail = p_mp_status_detail,
           ultimo_payload = p_payload,
           actualizado_en = now()
     where id = v_pago.id;

    return jsonb_build_object('ok', true, 'estado', v_estado);
  end if;

  -- created / processing / action_required: sigue pendiente.
  update public.pagos_mercado_pago
     set mp_status = p_mp_status,
         mp_status_detail = p_mp_status_detail,
         ultimo_payload = p_payload,
         actualizado_en = now()
   where id = v_pago.id;

  return jsonb_build_object('ok', true, 'estado', 'pendiente');
end;
$$;

revoke all on function public.bb_aplicar_estado_pago(text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.bb_aplicar_estado_pago(text, text, text, jsonb, text) to service_role;

-- ------------------------------------------------------------
-- 10) Reconciliación para el panel administrativo
-- ------------------------------------------------------------
create or replace function public.bb_listar_pagos_personal(p_limite integer default 100)
returns table(
  id_pago uuid,
  id_pedido uuid,
  numero_pedido text,
  correo_cliente text,
  estado_pedido text,
  estado_pago text,
  mp_status text,
  mp_status_detail text,
  total numeric,
  moneda text,
  mp_order_id text,
  checkout_url text,
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
    p.mp_status,
    p.mp_status_detail,
    p.monto,
    p.moneda,
    p.mp_order_id,
    p.checkout_url,
    p.observacion,
    p.creado_en,
    p.pagado_en,
    p.expira_en
  from public.pagos_mercado_pago p
  join public.pedidos pe on pe.id = p.id_pedido
  where exists (
    select 1
      from public.personal s
     where s.id_usuario = auth.uid()
       and s.activo
  )
  order by p.creado_en desc
  limit greatest(1, least(coalesce(p_limite, 100), 500));
$$;

revoke all on function public.bb_listar_pagos_personal(integer) from public, anon;
grant execute on function public.bb_listar_pagos_personal(integer) to authenticated, service_role;

-- ------------------------------------------------------------
-- 11) Deshabilitar el flujo manual de Yape
--     El checkout ahora es automático con Mercado Pago.
-- ------------------------------------------------------------
create or replace function public.crear_pedido_yape(
  p_articulos jsonb,
  p_cliente jsonb,
  p_codigo_operacion_yape text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'El pago manual con Yape fue reemplazado por Mercado Pago. Usa el checkout automático.';
end;
$$;

revoke all on function public.crear_pedido_yape(jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.crear_pedido_yape(jsonb, jsonb, text) to service_role;
