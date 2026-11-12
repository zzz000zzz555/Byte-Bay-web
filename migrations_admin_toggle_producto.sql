
create or replace function public.cambiar_estado_producto_personal(p_id bigint, p_activo boolean)
returns void language plpgsql security definer set search_path to public as $$
begin
  if not exists(select 1 from public.personal where id_usuario=auth.uid() and activo) then raise exception 'Sin permiso'; end if;
  update public.productos set activo = p_activo, actualizado_en = now() where id = p_id;
end;
$$;
