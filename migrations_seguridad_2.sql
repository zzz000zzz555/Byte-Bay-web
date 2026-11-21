-- ============================================================
-- BYTE BAY · Endurecimiento de seguridad — parte 2
-- Proyecto Supabase: inwugycvtaaceugvtfpv
-- Idempotente: se puede ejecutar varias veces.
--
-- 1) Crea las RPC de ofertas que faltaban en producción.
-- 2) Deja de conceder EXECUTE a PUBLIC/anon por defecto y
--    publica solo las RPC que el navegador necesita.
-- 3) Quita SELECT a tablas y vistas que el navegador no usa
--    (incluida la vista customer_accounts, que expone hashes).
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1) Ofertas: RPC que admin.js ya invoca pero no existían
-- ------------------------------------------------------------
create or replace function public.guardar_oferta_personal(
  p_id_producto bigint,
  p_nombre text,
  p_precio_oferta numeric,
  p_inicia_en timestamptz,
  p_termina_en timestamptz default null
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if not exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo
  ) then
    raise exception 'No tienes permiso para gestionar ofertas';
  end if;
  if not exists (select 1 from public.productos where id = p_id_producto) then
    raise exception 'Producto no encontrado';
  end if;
  if p_precio_oferta is null or p_precio_oferta < 0 then
    raise exception 'El precio de oferta no puede ser negativo';
  end if;
  if p_inicia_en is null then
    raise exception 'La fecha de inicio es obligatoria';
  end if;
  if p_termina_en is not null and p_termina_en <= p_inicia_en then
    raise exception 'La fecha final debe ser posterior a la inicial';
  end if;

  insert into public.ofertas_producto(
    id_producto, nombre, precio_oferta, inicia_en, termina_en, activa
  ) values (
    p_id_producto, btrim(p_nombre), p_precio_oferta, p_inicia_en, p_termina_en, true
  )
  returning id into v_id;

  insert into public.auditoria_personal(id_usuario, accion, entidad, id_entidad, detalle)
  values (
    auth.uid(), 'crear', 'oferta_producto', v_id::text,
    jsonb_build_object('id_producto', p_id_producto, 'precio_oferta', p_precio_oferta)
  );

  return v_id;
end;
$$;

create or replace function public.listar_ofertas_personal()
returns table(
  id bigint,
  id_producto bigint,
  producto text,
  nombre text,
  precio_oferta numeric,
  inicia_en timestamptz,
  termina_en timestamptz,
  activa boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select o.id, o.id_producto, p.nombre, o.nombre, o.precio_oferta,
         o.inicia_en, o.termina_en, o.activa
  from public.ofertas_producto o
  join public.productos p on p.id = o.id_producto
  where exists (
    select 1 from public.personal pe
    where pe.id_usuario = auth.uid() and pe.activo
  )
  order by o.creado_en desc;
$$;

-- ------------------------------------------------------------
-- 2) Permisos de ejecución de funciones
--    Antes: PUBLIC (y por tanto anon) podía ejecutar todas las
--    RPC SECURITY DEFINER, incluidas las de administración.
--    Ahora: nada por defecto; se publica solo lo que usa la web.
-- ------------------------------------------------------------
revoke all on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;

-- RPC públicas de la tienda (sin sesión)
grant execute on function public.obtener_configuracion_publica() to anon;
grant execute on function public.iniciar_sesion_cliente(text, text) to anon;
grant execute on function public.registrar_cuenta_cliente(text, text, text, text, text) to anon;
grant execute on function public.sincronizar_cuenta_cliente_google() to anon;
grant execute on function public.crear_pedido_yape(jsonb, jsonb, text) to anon;
grant execute on function public.listar_notificaciones_ofertas_publicas() to anon;
grant execute on function public.guardar_comentario_producto(bigint, text, text, smallint, text) to anon;
grant execute on function public.guardar_comentario_producto_google(bigint, smallint, text) to anon;
grant execute on function public.eliminar_comentario_producto(bigint, text, text) to anon;

-- Que las funciones futuras nazcan sin EXECUTE para anon/PUBLIC
alter default privileges in schema public revoke execute on functions from public, anon;

-- ------------------------------------------------------------
-- 3) Tablas y vistas: solo se conserva lo que el navegador lee
--    El catálogo público y los comentarios publicados.
--    Todo lo demás pasa por RPC SECURITY DEFINER.
-- ------------------------------------------------------------
revoke select on public.categorias            from anon, authenticated;
revoke select on public.marcas                from anon, authenticated;
revoke select on public.comentarios_productos from anon, authenticated;

revoke select on public.customer_accounts          from anon, authenticated;
revoke select on public.orders                     from anon, authenticated;
revoke select on public.order_items                from anon, authenticated;
revoke select on public.order_status_history       from anon, authenticated;
revoke select on public.profiles                   from anon, authenticated;
revoke select on public.product_offers             from anon, authenticated;
revoke select on public.inventory_movements        from anon, authenticated;
revoke select on public.notification_preferences   from anon, authenticated;
revoke select on public.reporte_inventario_lotes   from anon, authenticated;

-- El catálogo sigue siendo legible porque la vista es security_invoker
grant select on public.catalogo_productos             to anon, authenticated;
grant select on public.comentarios_publicos_productos to anon, authenticated;
grant select on public.productos                      to anon, authenticated;
grant select on public.ofertas_producto               to anon, authenticated;

commit;
