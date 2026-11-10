do $$
declare
  v_definicion text;
  v_linea_anterior text := 'v_envio := case when v_subtotal >= 299 then 0 else 18 end;';
begin
  select pg_get_functiondef(
    'public.bb_crear_pedido_mp(jsonb,jsonb,text,integer)'::regprocedure
  )
  into v_definicion;

  if position(v_linea_anterior in v_definicion) > 0 then
    execute replace(
      v_definicion,
      v_linea_anterior,
      'v_envio := 0;  -- Envío gratis a todo el Perú.'
    );
  elsif position('v_envio := 0;' in v_definicion) = 0 then
    raise exception 'La función bb_crear_pedido_mp tiene una regla de envío inesperada';
  end if;
end;
$$;
