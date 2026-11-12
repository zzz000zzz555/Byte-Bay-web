
create or replace function public.actualizar_producto_extra_personal(
  p_id bigint,
  p_video_url text default null,
  p_genero text default null,
  p_short_presentation text default null,
  p_verifiable_features text default null,
  p_benefits_summary text default null,
  p_especificaciones jsonb default null
) returns void language plpgsql security definer set search_path to public as $$
begin
  if not exists(select 1 from public.personal where id_usuario=auth.uid() and activo) then raise exception 'Sin permiso'; end if;
  update public.productos set
    video_url = coalesce(p_video_url, video_url),
    genero = coalesce(p_genero, genero),
    short_presentation = coalesce(p_short_presentation, short_presentation),
    verifiable_features = coalesce(p_verifiable_features, verifiable_features),
    benefits_summary = coalesce(p_benefits_summary, benefits_summary),
    especificaciones = coalesce(p_especificaciones, especificaciones),
    actualizado_en = now()
  where id = p_id;
end;
$$;

create or replace function public.guardar_media_producto_personal(
  p_id_producto bigint,
  p_items jsonb
) returns void language plpgsql security definer set search_path to public as $$
declare
  item jsonb;
begin
  if not exists(select 1 from public.personal where id_usuario=auth.uid() and activo) then raise exception 'Sin permiso'; end if;
  delete from public.product_media where id_producto = p_id_producto;
  for item in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    insert into public.product_media (id_producto, url, tipo, angulo, orden, es_principal)
    values (
      p_id_producto,
      item->>'url',
      coalesce(item->>'tipo','imagen'),
      coalesce(item->>'angulo','frontal'),
      coalesce((item->>'orden')::int,0),
      coalesce((item->>'es_principal')::boolean,false)
    );
  end loop;
end;
$$;
