-- Byte Bay: listar pedidos del cliente autenticado para rastreo.
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
