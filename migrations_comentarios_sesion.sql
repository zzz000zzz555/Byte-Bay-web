-- Byte Bay: guardar comentario usando sesión (sin pedir contraseña de nuevo)
create or replace function public.guardar_comentario_producto_sesion(
  p_id_producto bigint,
  p_access_token text,
  p_calificacion smallint,
  p_comentario text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sesion jsonb;
  v_id_cuenta bigint;
  v_id_comentario bigint;
begin
  v_sesion := public.bb_validar_sesion(p_access_token);
  if not coalesce((v_sesion->>'valid')::boolean, false) or coalesce(v_sesion->>'role','') <> 'cliente' then
    raise exception 'Sesión de cliente inválida';
  end if;
  v_id_cuenta := (v_sesion->>'customer_id')::bigint;

  if not exists(select 1 from public.productos where id=p_id_producto and activo) then
    raise exception 'Producto no encontrado';
  end if;
  if p_calificacion not between 1 and 5 then
    raise exception 'La calificación debe estar entre 1 y 5';
  end if;
  if char_length(btrim(coalesce(p_comentario,''))) not between 3 and 2000 then
    raise exception 'El comentario debe tener entre 3 y 2000 caracteres';
  end if;

  insert into public.comentarios_productos(id_producto,id_cuenta_cliente,calificacion,comentario,estado)
  values (p_id_producto,v_id_cuenta,p_calificacion,btrim(p_comentario),'pendiente')
  on conflict(id_producto,id_cuenta_cliente) do update
    set calificacion=excluded.calificacion,comentario=excluded.comentario,
        estado='pendiente',actualizado_en=now()
  returning id into v_id_comentario;
  return v_id_comentario;
end;
$$;

revoke all on function public.guardar_comentario_producto_sesion(bigint,text,smallint,text) from public, anon, authenticated;
grant execute on function public.guardar_comentario_producto_sesion(bigint,text,smallint,text) to service_role, anon, authenticated;
