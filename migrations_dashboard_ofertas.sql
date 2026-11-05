-- Byte Bay: dashboard seguro para avisos automáticos de ofertas.
-- Aplicar después de migrations_delta_update.sql.

begin;

create or replace function public.listar_ofertas_automaticas_jefe(p_limite integer default 200)
returns table(
  id bigint,
  producto_id bigint,
  producto text,
  titulo text,
  mensaje text,
  descuento_porcentaje numeric,
  fecha_envio timestamptz,
  fecha_limite timestamptz,
  creado_en timestamptz,
  estado text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then
    raise exception 'Solo el jefe puede consultar las ofertas automáticas';
  end if;

  return query
  select n.id, n.producto_id, coalesce(p.nombre, 'Producto eliminado'),
    n.titulo, n.mensaje, n.descuento_porcentaje, n.fecha_envio, n.fecha_limite,
    n.creado_en,
    case
      when n.fecha_envio > now() then 'programada'
      when n.fecha_limite is not null and n.fecha_limite <= now() then 'finalizada'
      else 'publicada'
    end
  from public.notificaciones_ofertas n
  left join public.productos p on p.id = n.producto_id
  where n.tipo_emision = 'automatica_ia_trigger'
  order by n.creado_en desc
  limit least(greatest(coalesce(p_limite, 200), 1), 500);
end;
$$;

revoke all on function public.listar_ofertas_automaticas_jefe(integer) from public, anon;
grant execute on function public.listar_ofertas_automaticas_jefe(integer) to authenticated;

commit;
notify pgrst, 'reload schema';
