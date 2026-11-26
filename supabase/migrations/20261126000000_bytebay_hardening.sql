-- Byte Bay · hardening previo a producción (H-02 a H-04 y cuota de Gemini).
-- Idempotente: se puede volver a ejecutar sin duplicar objetos ni permisos.

-- Helper compartido para políticas de personal interno.
create or replace function public.bb_personal_activo()
returns boolean language sql security definer stable
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo = true
  );
$$;
revoke all on function public.bb_personal_activo() from public, anon;
grant execute on function public.bb_personal_activo() to authenticated, service_role;

-- H-02: la RPC heredada de registro también exige letras, números y símbolo.
create or replace function public.registrar_cuenta_cliente(
  p_correo text,
  p_nombres text default null,
  p_apellidos text default null,
  p_nombre_usuario text default null,
  p_contrasena text default null
)
returns bigint language plpgsql security definer
set search_path = public, extensions
as $$
declare v_id bigint; v_correo text := lower(trim(p_correo));
begin
  if v_correo !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Correo no válido';
  end if;
  if length(coalesce(p_contrasena, '')) < 8
     or p_contrasena !~ '[A-Za-z]'
     or p_contrasena !~ '[0-9]'
     or p_contrasena !~ '[^A-Za-z0-9]' then
    raise exception 'La contraseña debe tener al menos 8 caracteres e incluir letras, números y un símbolo';
  end if;
  insert into public.cuentas_clientes(correo, nombres, apellidos, nombre_usuario, contrasena_hash)
  values(v_correo, nullif(trim(p_nombres), ''), nullif(trim(p_apellidos), ''),
         nullif(trim(p_nombre_usuario), ''), crypt(p_contrasena, gen_salt('bf', 10)))
  returning id into v_id;
  return v_id;
end;
$$;

-- H-03: cupo diario persistente para el asistente (60 consultas por usuario).
create table if not exists public.bb_asistente_cuotas (
  usuario_id uuid not null,
  dia date not null default current_date,
  consultas integer not null default 0,
  primary key (usuario_id, dia)
);
alter table public.bb_asistente_cuotas enable row level security;
revoke all on public.bb_asistente_cuotas from public, anon, authenticated;

create or replace function public.bb_asistente_registrar_consulta(p_usuario_id uuid)
returns jsonb language plpgsql security definer
set search_path = public, extensions
as $$
declare v_consultas integer;
begin
  if p_usuario_id is null then
    raise exception 'Usuario requerido';
  end if;
  insert into public.bb_asistente_cuotas(usuario_id, dia, consultas)
  values (p_usuario_id, current_date, 1)
  on conflict (usuario_id, dia) do update
    set consultas = least(public.bb_asistente_cuotas.consultas + 1, 61)
  returning consultas into v_consultas;
  return jsonb_build_object('consultas', v_consultas, 'permitido', v_consultas <= 60);
end;
$$;
revoke all on function public.bb_asistente_registrar_consulta(uuid) from public, anon;
grant execute on function public.bb_asistente_registrar_consulta(uuid) to service_role;

-- H-04: RLS en tablas que antes quedaron fuera del schema maestro, con
-- lectura pública solo donde corresponde y acceso total al personal activo.
do $$
declare tabla text;
begin
  foreach tabla in array array[
    'roles', 'system_modules', 'role_permissions', 'product_variants',
    'product_media', 'product_reviews', 'packs', 'pack_items',
    'promociones', 'ofertas_especiales', 'site_themes',
    'comentarios_productos', 'ofertas_producto'
  ] loop
    if to_regclass('public.' || tabla) is null then continue; end if;
    execute format('alter table public.%I enable row level security', tabla);
    execute 'drop policy if exists "Personal activo" on public.' || quote_ident(tabla);
    execute 'create policy "Personal activo" on public.' || quote_ident(tabla) ||
            ' for all to authenticated using (public.bb_personal_activo()) with check (public.bb_personal_activo())';

    if tabla in ('product_media', 'product_variants', 'product_reviews', 'pack_items') then
      execute 'drop policy if exists "Lectura publica" on public.' || quote_ident(tabla);
      execute 'create policy "Lectura publica" on public.' || quote_ident(tabla) ||
              ' for select to anon, authenticated using (true)';
    elsif tabla in ('promociones', 'ofertas_especiales', 'packs') then
      execute 'drop policy if exists "Lectura publica" on public.' || quote_ident(tabla);
      execute 'create policy "Lectura publica" on public.' || quote_ident(tabla) ||
              ' for select to anon, authenticated using (activo and inicia_en <= now() and (termina_en is null or termina_en > now()))';
    elsif tabla = 'site_themes' then
      execute 'drop policy if exists "Lectura publica" on public.site_themes';
      execute 'create policy "Lectura publica" on public.site_themes' ||
              ' for select to anon, authenticated using (activo)';
    elsif tabla = 'ofertas_producto' then
      execute 'drop policy if exists "Lectura publica" on public.ofertas_producto';
      execute 'create policy "Lectura publica" on public.ofertas_producto' ||
              ' for select to anon, authenticated using (activa and inicia_en <= now() and (termina_en is null or termina_en > now()))';
    elsif tabla = 'comentarios_productos'
      and exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'comentarios_productos' and column_name = 'estado') then
      execute 'drop policy if exists "Lectura publica" on public.comentarios_productos';
      execute 'create policy "Lectura publica" on public.comentarios_productos' ||
              ' for select to anon, authenticated using (estado = ''publicado'')';
    end if;
  end loop;

  -- Las vistas de catálogo dejan de saltarse RLS.
  if to_regclass('public.catalogo_packs') is not null then
    execute 'alter view public.catalogo_packs set (security_invoker = true)';
  end if;
  if to_regclass('public.catalogo_productos_v2') is not null then
    execute 'alter view public.catalogo_productos_v2 set (security_invoker = true)';
  end if;
end;
$$;

-- El listado de pagos Culqi no debe ser consultable por cualquier cliente.
revoke all on function public.bb_listar_pagos_culqi(integer) from public, anon, authenticated;
grant execute on function public.bb_listar_pagos_culqi(integer) to service_role;
