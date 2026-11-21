-- Envio gratis a todo el Peru (S/ 0).
-- Reemplaza la version anterior de bb_crear_pedido_mp.

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

  v_envio := 0;  -- Envio gratis a todo el Peru
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
