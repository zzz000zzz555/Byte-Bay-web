-- ============================================================
-- BYTE BAY · Migración complementaria: KPI de clientes de hoy
-- Accesible para todo el personal activo (dato operativo, no financiero)
-- ============================================================

create or replace function public.clientes_registrados_hoy_personal()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not exists (
    select 1 from public.personal
     where id_usuario = auth.uid() and activo
  ) then
    raise exception 'Solo el personal activo puede consultar este indicador';
  end if;

  return (
    select count(*)::integer
      from public.cuentas_clientes
     where creado_en >= current_date
       and creado_en < current_date + 1
  );
end;
$$;

revoke all on function public.clientes_registrados_hoy_personal() from public, anon;
grant execute on function public.clientes_registrados_hoy_personal() to authenticated;

notify pgrst, 'reload schema';
