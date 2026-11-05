-- Byte Bay: migration delta for audit, account lifecycle, claims, settings,
-- Byte Plus membership, and offer notifications.
-- Apply after the existing Byte Bay schema. This migration is additive and idempotent.
-- Customer authentication is intentionally unchanged; the lockout columns are
-- groundwork only and must not be presented as enforced until auth is updated.

begin;

alter table public.cuentas_clientes
  add column if not exists deleted_at timestamptz,
  add column if not exists estado_cuenta text not null default 'activo',
  add column if not exists login_failed_attempts integer not null default 0,
  add column if not exists lockout_until timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cuentas_clientes_estado_cuenta_check'
  ) then
    alter table public.cuentas_clientes
      add constraint cuentas_clientes_estado_cuenta_check
      check (estado_cuenta in ('activo', 'inactivo', 'anulado'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'cuentas_clientes_login_failed_attempts_check'
  ) then
    alter table public.cuentas_clientes
      add constraint cuentas_clientes_login_failed_attempts_check
      check (login_failed_attempts >= 0);
  end if;
end;
$$;

create index if not exists cuentas_clientes_estado_cuenta_idx
  on public.cuentas_clientes(estado_cuenta, creado_en desc);

create table if not exists public.auditoria_logs (
  id bigint generated always as identity primary key,
  usuario_id text,
  responsable text,
  rol_usuario text,
  accion text not null,
  tabla_afectada text not null,
  registro_id text,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.auditoria_logs add column if not exists responsable text;

create index if not exists auditoria_logs_created_at_idx
  on public.auditoria_logs(created_at desc);
create index if not exists auditoria_logs_accion_created_at_idx
  on public.auditoria_logs(accion, created_at desc);
create index if not exists auditoria_logs_tabla_created_at_idx
  on public.auditoria_logs(tabla_afectada, created_at desc);
create index if not exists auditoria_logs_usuario_created_at_idx
  on public.auditoria_logs(usuario_id, created_at desc);

create or replace function public.completar_metadatos_auditoria()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_headers jsonb;
begin
  v_headers := coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb,
    '{}'::jsonb
  );
  new.user_agent := coalesce(new.user_agent, v_headers ->> 'user-agent');
  return new;
end;
$$;

drop trigger if exists auditoria_logs_metadatos on public.auditoria_logs;
create trigger auditoria_logs_metadatos
before insert on public.auditoria_logs
for each row execute function public.completar_metadatos_auditoria();

create table if not exists public.libro_reclamaciones (
  id bigint generated always as identity primary key,
  codigo_reclamacion text not null unique,
  cliente_nombre text not null,
  cliente_dni_ce text not null,
  cliente_email text not null,
  cliente_telefono text,
  tipo_reclamo text not null,
  categoria_reclamo text not null,
  descripcion_reclamo text not null,
  monto_involucrado numeric(12,2),
  pedido_relacionado_id uuid references public.pedidos(id) on delete set null,
  evidencia_url text,
  estado text not null default 'pendiente',
  respuesta_administracion text,
  fecha_resolucion timestamptz,
  created_at timestamptz not null default now(),
  constraint libro_reclamaciones_tipo_check
    check (tipo_reclamo in ('queja', 'reclamo')),
  constraint libro_reclamaciones_categoria_check
    check (categoria_reclamo in ('servicio', 'producto', 'facturacion', 'entrega')),
  constraint libro_reclamaciones_estado_check
    check (estado in ('pendiente', 'en_revision', 'resuelto')),
  constraint libro_reclamaciones_monto_check
    check (monto_involucrado is null or monto_involucrado >= 0),
  constraint libro_reclamaciones_nombre_check
    check (char_length(btrim(cliente_nombre)) between 2 and 200),
  constraint libro_reclamaciones_documento_check
    check (char_length(btrim(cliente_dni_ce)) between 6 and 20),
  constraint libro_reclamaciones_email_check
    check (cliente_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint libro_reclamaciones_descripcion_check
    check (char_length(btrim(descripcion_reclamo)) between 10 and 10000)
);

create index if not exists libro_reclamaciones_created_at_idx
  on public.libro_reclamaciones(created_at desc);
create index if not exists libro_reclamaciones_estado_fecha_idx
  on public.libro_reclamaciones(estado, created_at desc);
create index if not exists libro_reclamaciones_categoria_fecha_idx
  on public.libro_reclamaciones(categoria_reclamo, created_at desc);
create index if not exists libro_reclamaciones_email_fecha_idx
  on public.libro_reclamaciones(lower(cliente_email), created_at desc);

create table if not exists public.configuracion_sistema (
  id bigint generated always as identity primary key,
  clave varchar(100) not null unique,
  valor text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.suscripciones_byte_plus (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.cuentas_clientes(id) on delete restrict,
  estado text not null default 'activo',
  fecha_inicio timestamptz not null default now(),
  fecha_fin timestamptz,
  beneficios_activos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  constraint suscripciones_byte_plus_estado_check
    check (estado in ('activo', 'expirado', 'cancelado')),
  constraint suscripciones_byte_plus_fechas_check
    check (fecha_fin is null or fecha_fin >= fecha_inicio),
  constraint suscripciones_byte_plus_beneficios_check
    check (jsonb_typeof(beneficios_activos) = 'object')
);

create index if not exists suscripciones_byte_plus_usuario_idx
  on public.suscripciones_byte_plus(usuario_id, fecha_inicio desc);
create index if not exists suscripciones_byte_plus_activas_idx
  on public.suscripciones_byte_plus(usuario_id, fecha_fin)
  where estado = 'activo';
create unique index if not exists suscripciones_byte_plus_una_activa_idx
  on public.suscripciones_byte_plus(usuario_id)
  where estado = 'activo';

create table if not exists public.notificaciones_ofertas (
  id bigint generated always as identity primary key,
  titulo text not null,
  mensaje text not null,
  tipo_emision text not null default 'manual',
  producto_id bigint references public.productos(id) on delete set null,
  descuento_porcentaje numeric(5,2),
  destinatarios text not null default 'todos',
  fecha_envio timestamptz not null default now(),
  fecha_limite timestamptz,
  banner_url text,
  creado_por uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now(),
  constraint notificaciones_ofertas_tipo_check
    check (tipo_emision in ('manual', 'automatica_ia_trigger')),
  constraint notificaciones_ofertas_destinatarios_check
    check (destinatarios in ('todos', 'segmentado_activos', 'byte_plus')),
  constraint notificaciones_ofertas_descuento_check
    check (descuento_porcentaje is null or descuento_porcentaje between 0 and 100),
  constraint notificaciones_ofertas_titulo_check
    check (char_length(btrim(titulo)) between 1 and 200),
  constraint notificaciones_ofertas_mensaje_check
    check (char_length(btrim(mensaje)) between 1 and 5000),
  constraint notificaciones_ofertas_fecha_check
    check (fecha_limite is null or fecha_limite >= fecha_envio)
);

create index if not exists notificaciones_ofertas_fecha_idx
  on public.notificaciones_ofertas(fecha_envio desc);
create index if not exists notificaciones_ofertas_destinatarios_fecha_idx
  on public.notificaciones_ofertas(destinatarios, fecha_envio desc);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'reclamos-evidencias', 'reclamos-evidencias', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'marca-sitio', 'marca-sitio', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Marca del sitio: lectura pública" on storage.objects;
create policy "Marca del sitio: lectura pública"
on storage.objects for select to anon, authenticated
using (bucket_id = 'marca-sitio');

drop policy if exists "Jefe carga marca del sitio" on storage.objects;
create policy "Jefe carga marca del sitio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'marca-sitio'
  and exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol = 'jefe'
  )
);

drop policy if exists "Jefe actualiza marca del sitio" on storage.objects;
create policy "Jefe actualiza marca del sitio"
on storage.objects for update to authenticated
using (
  bucket_id = 'marca-sitio'
  and exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol = 'jefe'
  )
)
with check (
  bucket_id = 'marca-sitio'
  and exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol = 'jefe'
  )
);

alter table public.ofertas_producto
  add column if not exists super_oferta boolean not null default false,
  add column if not exists liquidacion_stock boolean not null default false;

create or replace function public.notificar_oferta_especial()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_producto text;
  v_precio numeric;
  v_regular numeric;
  v_descuento numeric(5,2);
begin
  if not new.activa or not (new.super_oferta or new.liquidacion_stock) then
    return new;
  end if;
  if tg_op = 'UPDATE'
    and old.activa = new.activa
    and old.super_oferta = new.super_oferta
    and old.liquidacion_stock = new.liquidacion_stock then
    return new;
  end if;

  select p.nombre, p.precio into v_producto, v_regular
  from public.productos p where p.id = new.id_producto;
  v_precio := new.precio_oferta;
  v_descuento := case
    when v_regular > 0 then greatest(0, least(100, round((1 - v_precio / v_regular) * 100, 2)))
    else null
  end;

  insert into public.notificaciones_ofertas(
    titulo, mensaje, tipo_emision, producto_id, descuento_porcentaje,
    destinatarios, fecha_envio, fecha_limite
  )
  values (
    case when new.super_oferta then 'Super oferta: ' else 'Liquidación: ' end || v_producto,
    'Oferta especial disponible por tiempo limitado: ' || new.nombre,
    'automatica_ia_trigger', new.id_producto, v_descuento, 'todos',
    new.inicia_en, new.termina_en
  );
  return new;
end;
$$;

drop trigger if exists ofertas_producto_notificar_especial on public.ofertas_producto;
create trigger ofertas_producto_notificar_especial
after insert or update of activa, super_oferta, liquidacion_stock on public.ofertas_producto
for each row execute function public.notificar_oferta_especial();

alter table public.auditoria_logs enable row level security;
alter table public.libro_reclamaciones enable row level security;
alter table public.configuracion_sistema enable row level security;
alter table public.suscripciones_byte_plus enable row level security;
alter table public.notificaciones_ofertas enable row level security;

revoke all on public.auditoria_logs, public.libro_reclamaciones,
  public.configuracion_sistema, public.suscripciones_byte_plus,
  public.notificaciones_ofertas from anon, authenticated;

create or replace function public.registrar_auditoria_producto()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_accion text;
  v_anterior jsonb;
  v_nuevo jsonb;
  v_id text;
  v_rol text;
  v_responsable text;
begin
  if tg_op = 'INSERT' then
    v_accion := 'REGISTRO_PRODUCTO';
    v_nuevo := to_jsonb(new);
    v_id := new.id::text;
  elsif tg_op = 'UPDATE' then
    if to_jsonb(new) = to_jsonb(old) then
      return new;
    end if;
    v_accion := 'EDICION_PRODUCTO';
    v_anterior := to_jsonb(old);
    v_nuevo := to_jsonb(new);
    v_id := new.id::text;
  else
    v_accion := 'ELIMINACION_PRODUCTO';
    v_anterior := to_jsonb(old);
    v_id := old.id::text;
  end if;

  select p.rol into v_rol
  from public.personal p
  where p.id_usuario = auth.uid() and p.activo;
  select nullif(btrim(concat_ws(' ', p.nombres, p.apellidos)), '')
  into v_responsable
  from public.personal p
  where p.id_usuario = auth.uid() and p.activo;
  if v_responsable is null then
    select u.email into v_responsable from auth.users u where u.id = auth.uid();
  end if;

  insert into public.auditoria_logs(
    usuario_id, responsable, rol_usuario, accion, tabla_afectada, registro_id,
    datos_anteriores, datos_nuevos
  )
  values (
    auth.uid()::text, v_responsable, v_rol, v_accion, 'productos', v_id,
    v_anterior, v_nuevo
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists productos_auditoria_logs on public.productos;
create trigger productos_auditoria_logs
after insert or update or delete on public.productos
for each row execute function public.registrar_auditoria_producto();

create or replace function public.registrar_cambio_estado_cuenta()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.estado_cuenta = 'anulado' and old.estado_cuenta is distinct from new.estado_cuenta then
    new.deleted_at := coalesce(new.deleted_at, now());
    insert into public.auditoria_logs(
      accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos
    )
    values (
      'ELIMINACION_LOGICA_USUARIO', 'cuentas_clientes', new.id::text,
      to_jsonb(old) - 'contrasena_hash',
      to_jsonb(new) - 'contrasena_hash'
    );
  elsif new.estado_cuenta <> 'anulado' then
    new.deleted_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists cuentas_clientes_auditoria_estado on public.cuentas_clientes;
create trigger cuentas_clientes_auditoria_estado
before update of estado_cuenta on public.cuentas_clientes
for each row execute function public.registrar_cambio_estado_cuenta();

create or replace function public.registrar_auditoria_configuracion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rol text;
  v_responsable text;
begin
  select p.rol into v_rol
  from public.personal p
  where p.id_usuario = coalesce(new.updated_by, old.updated_by) and p.activo;
  select nullif(btrim(concat_ws(' ', p.nombres, p.apellidos)), '')
  into v_responsable
  from public.personal p
  where p.id_usuario = coalesce(new.updated_by, old.updated_by) and p.activo;

  insert into public.auditoria_logs(
    usuario_id, responsable, rol_usuario, accion, tabla_afectada, registro_id,
    datos_anteriores, datos_nuevos
  )
  values (
    coalesce(new.updated_by, old.updated_by)::text, v_responsable, v_rol,
    case when tg_op = 'INSERT' then 'CREACION_CONFIGURACION' else 'ACTUALIZACION_CONFIGURACION' end,
    'configuracion_sistema', new.clave,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists configuracion_sistema_auditoria on public.configuracion_sistema;
create trigger configuracion_sistema_auditoria
after insert or update on public.configuracion_sistema
for each row execute function public.registrar_auditoria_configuracion();

create or replace function public.generar_codigo_reclamacion()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.codigo_reclamacion := 'BB-' || to_char(coalesce(new.created_at, now()), 'YYYY')
    || '-' || lpad(new.id::text, 8, '0');
  return new;
end;
$$;

drop trigger if exists libro_reclamaciones_codigo on public.libro_reclamaciones;
create trigger libro_reclamaciones_codigo
before insert on public.libro_reclamaciones
for each row execute function public.generar_codigo_reclamacion();

create or replace function public.actualizar_fecha_resolucion_reclamo()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'resuelto' and old.estado is distinct from new.estado then
    new.fecha_resolucion := coalesce(new.fecha_resolucion, now());
  elsif new.estado <> 'resuelto' then
    new.fecha_resolucion := null;
  end if;
  return new;
end;
$$;

drop trigger if exists libro_reclamaciones_fecha_resolucion on public.libro_reclamaciones;
create trigger libro_reclamaciones_fecha_resolucion
before update of estado on public.libro_reclamaciones
for each row execute function public.actualizar_fecha_resolucion_reclamo();

create or replace function public.enviar_reclamo(
  p_cliente_nombre text,
  p_cliente_dni_ce text,
  p_cliente_email text,
  p_cliente_telefono text,
  p_tipo_reclamo text,
  p_categoria_reclamo text,
  p_descripcion_reclamo text,
  p_monto_involucrado numeric default null,
  p_pedido_relacionado_id text default null,
  p_evidencia_url text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_codigo text;
  v_pedido_id uuid;
begin
  if p_evidencia_url is not null
    and p_evidencia_url !~* '^https://[^[:space:]]+$'
    and p_evidencia_url !~* '^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$' then
    raise exception 'La evidencia debe ser un enlace HTTPS o una ruta de archivo válida';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(lower(btrim(p_cliente_email)), 0));
  if (
    select count(*) from public.libro_reclamaciones r
    where lower(r.cliente_email) = lower(btrim(p_cliente_email))
      and r.created_at >= now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Se alcanzó el límite de reclamaciones por correo. Intenta más tarde.';
  end if;
  if nullif(btrim(p_pedido_relacionado_id), '') is not null then
    select p.id into v_pedido_id
    from public.pedidos p
    where p.numero_pedido = btrim(p_pedido_relacionado_id)
       or p.id::text = btrim(p_pedido_relacionado_id);
    if not found then raise exception 'No encontramos ese número de pedido'; end if;
  end if;

  insert into public.libro_reclamaciones(
    codigo_reclamacion, cliente_nombre, cliente_dni_ce, cliente_email,
    cliente_telefono, tipo_reclamo, categoria_reclamo,
    descripcion_reclamo, monto_involucrado, pedido_relacionado_id, evidencia_url
  )
  values (
    '', btrim(p_cliente_nombre), btrim(p_cliente_dni_ce), lower(btrim(p_cliente_email)),
    nullif(btrim(p_cliente_telefono), ''), p_tipo_reclamo, p_categoria_reclamo,
    btrim(p_descripcion_reclamo), p_monto_involucrado, v_pedido_id, p_evidencia_url
  )
  returning codigo_reclamacion into v_codigo;

  return v_codigo;
end;
$$;

create or replace function public.listar_reclamos_personal(
  p_estado text default null,
  p_categoria text default null,
  p_desde date default null,
  p_hasta date default null,
  p_limite integer default 500
)
returns setof public.libro_reclamaciones
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol in ('jefe', 'empleado')
  ) then
    raise exception 'Sin permiso para consultar reclamaciones';
  end if;

  return query
  select r.*
  from public.libro_reclamaciones r
  where (p_estado is null or r.estado = p_estado)
    and (p_categoria is null or r.categoria_reclamo = p_categoria)
    and (p_desde is null or r.created_at >= p_desde::timestamptz)
    and (p_hasta is null or r.created_at < (p_hasta + 1)::timestamptz)
  order by r.created_at desc
  limit least(greatest(coalesce(p_limite, 500), 1), 1000);
end;
$$;

create or replace function public.responder_reclamo_personal(
  p_id bigint,
  p_estado text,
  p_respuesta text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rol text;
  v_responsable text;
  v_anterior jsonb;
  v_nuevo jsonb;
begin
  select rol into v_rol
  from public.personal
  where id_usuario = auth.uid() and activo;
  if v_rol is null or v_rol not in ('jefe', 'empleado') then
    raise exception 'Sin permiso para responder reclamaciones';
  end if;
  select nullif(btrim(concat_ws(' ', nombres, apellidos)), '')
  into v_responsable
  from public.personal where id_usuario = auth.uid() and activo;
  if p_estado not in ('pendiente', 'en_revision', 'resuelto') then
    raise exception 'Estado de reclamación no válido';
  end if;
  if p_estado = 'resuelto' and nullif(btrim(p_respuesta), '') is null then
    raise exception 'Escribe la respuesta antes de resolver el reclamo';
  end if;

  select to_jsonb(r) into v_anterior
  from public.libro_reclamaciones r where r.id = p_id for update;
  if not found then raise exception 'Reclamación no encontrada'; end if;

  update public.libro_reclamaciones as r
  set estado = p_estado,
      respuesta_administracion = nullif(btrim(p_respuesta), '')
  where id = p_id
  returning to_jsonb(r) into v_nuevo;

  insert into public.auditoria_logs(
    usuario_id, responsable, rol_usuario, accion, tabla_afectada, registro_id,
    datos_anteriores, datos_nuevos
  )
  values (
    auth.uid()::text, v_responsable, v_rol, 'RESPUESTA_RECLAMO', 'libro_reclamaciones',
    p_id::text, v_anterior, v_nuevo
  );
end;
$$;

create or replace function public.listar_auditoria_personal(
  p_desde date default null,
  p_hasta date default null,
  p_accion text default null,
  p_usuario_id text default null,
  p_modulo text default null,
  p_limite integer default 1000
)
returns setof public.auditoria_logs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then
    raise exception 'Solo el jefe puede consultar la auditoría';
  end if;

  return query
  select a.*
  from public.auditoria_logs a
  where (p_desde is null or a.created_at >= p_desde::timestamptz)
    and (p_hasta is null or a.created_at < (p_hasta + 1)::timestamptz)
    and (p_accion is null or a.accion = p_accion)
    and (p_usuario_id is null or a.usuario_id = p_usuario_id)
    and (p_modulo is null or a.tabla_afectada = p_modulo)
  order by a.created_at desc
  limit least(greatest(coalesce(p_limite, 1000), 1), 5000);
end;
$$;

create or replace function public.resumen_ciclo_usuarios_jefe(
  p_desde date default null,
  p_hasta date default null
)
returns table(usuarios_nuevos bigint, solicitudes_baja bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then raise exception 'Solo el jefe puede consultar métricas de usuarios'; end if;

  return query
  select
    (select count(*) from public.cuentas_clientes c
      where (p_desde is null or c.creado_en >= p_desde::timestamptz)
        and (p_hasta is null or c.creado_en < (p_hasta + 1)::timestamptz)),
    (select count(*) from public.cuentas_clientes c
      where c.estado_cuenta = 'anulado'
        and c.deleted_at is not null
        and (p_desde is null or c.deleted_at >= p_desde::timestamptz)
        and (p_hasta is null or c.deleted_at < (p_hasta + 1)::timestamptz));
end;
$$;

create or replace function public.obtener_configuracion_publica()
returns table(clave varchar, valor text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select c.clave, c.valor
  from public.configuracion_sistema c
  where c.clave in (
    'nombre_comercio', 'url_logo', 'favicon', 'lema', 'contacto_soporte',
    'titulo_seo', 'pie_pagina', 'enlaces_institucionales'
  );
$$;

create or replace function public.listar_notificaciones_ofertas_publicas()
returns table(
  id bigint, titulo text, mensaje text, producto_id bigint,
  descuento_porcentaje numeric, fecha_envio timestamptz, fecha_limite timestamptz,
  banner_url text
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select n.id, n.titulo, n.mensaje, n.producto_id,
         n.descuento_porcentaje, n.fecha_envio, n.fecha_limite, n.banner_url
  from public.notificaciones_ofertas n
  where n.destinatarios = 'todos'
    and n.fecha_envio <= now()
    and (n.fecha_limite is null or n.fecha_limite > now())
  order by n.fecha_envio desc
  limit 50;
$$;

create or replace function public.crear_notificacion_jefe(
  p_titulo text,
  p_mensaje text,
  p_fecha_envio timestamptz default now(),
  p_fecha_limite timestamptz default null,
  p_banner_url text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id bigint;
begin
  if not exists (
    select 1 from public.personal where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then raise exception 'Solo el jefe puede emitir notificaciones'; end if;
  if p_banner_url is not null and p_banner_url !~* '^https://[^[:space:]]+$' then
    raise exception 'El banner debe usar una URL HTTPS válida';
  end if;

  insert into public.notificaciones_ofertas(
    titulo, mensaje, tipo_emision, destinatarios, fecha_envio,
    fecha_limite, banner_url, creado_por
  )
  values (
    btrim(p_titulo), btrim(p_mensaje), 'manual', 'todos',
    coalesce(p_fecha_envio, now()), p_fecha_limite, p_banner_url, auth.uid()
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.marcar_oferta_especial_jefe(
  p_id_oferta bigint,
  p_super_oferta boolean,
  p_liquidacion_stock boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then raise exception 'Solo el jefe puede marcar ofertas especiales'; end if;
  update public.ofertas_producto
  set super_oferta = coalesce(p_super_oferta, false),
      liquidacion_stock = coalesce(p_liquidacion_stock, false)
  where id = p_id_oferta;
  if not found then raise exception 'Oferta no encontrada'; end if;
end;
$$;

create or replace function public.guardar_configuracion_sitio_jefe(p_valores jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_entrada record;
  v_claves_permitidas text[] := array[
    'nombre_comercio', 'url_logo', 'favicon', 'lema', 'contacto_soporte',
    'titulo_seo', 'pie_pagina', 'enlaces_institucionales'
  ];
begin
  if not exists (
    select 1 from public.personal where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then raise exception 'Solo el jefe puede cambiar la configuración'; end if;
  if p_valores is null or jsonb_typeof(p_valores) <> 'object' then
    raise exception 'La configuración debe ser un objeto JSON';
  end if;

  for v_entrada in select key, value from jsonb_each(p_valores)
  loop
    if not (v_entrada.key = any(v_claves_permitidas))
      or jsonb_typeof(v_entrada.value) <> 'string' then
      raise exception 'Clave o valor de configuración no permitido';
    end if;
    if v_entrada.key in ('url_logo', 'favicon')
      and v_entrada.value #>> '{}' <> ''
      and v_entrada.value #>> '{}' !~* '^https://[^[:space:]]+$' then
      raise exception 'El logotipo y favicon deben usar URL HTTPS';
    end if;
    if v_entrada.key = 'nombre_comercio'
      and char_length(btrim(v_entrada.value #>> '{}')) not between 1 and 100 then
      raise exception 'El nombre comercial es obligatorio y no debe exceder 100 caracteres';
    end if;
  end loop;

  insert into public.configuracion_sistema(clave, valor, updated_by, updated_at)
  select key, value, auth.uid(), now()
  from jsonb_each_text(p_valores)
  on conflict (clave) do update
  set valor = excluded.valor, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
end;
$$;

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

revoke all on function public.registrar_auditoria_producto() from public, anon, authenticated;
revoke all on function public.completar_metadatos_auditoria() from public, anon, authenticated;
revoke all on function public.registrar_cambio_estado_cuenta() from public, anon, authenticated;
revoke all on function public.registrar_auditoria_configuracion() from public, anon, authenticated;
revoke all on function public.generar_codigo_reclamacion() from public, anon, authenticated;
revoke all on function public.actualizar_fecha_resolucion_reclamo() from public, anon, authenticated;
revoke all on function public.enviar_reclamo(text,text,text,text,text,text,text,numeric,text,text) from public, anon, authenticated;
revoke all on function public.listar_reclamos_personal(text,text,date,date,integer) from public, anon;
revoke all on function public.responder_reclamo_personal(bigint,text,text) from public, anon;
revoke all on function public.listar_auditoria_personal(date,date,text,text,text,integer) from public, anon;
revoke all on function public.resumen_ciclo_usuarios_jefe(date,date) from public, anon;
revoke all on function public.obtener_configuracion_publica() from public;
revoke all on function public.notificar_oferta_especial() from public, anon, authenticated;
revoke all on function public.listar_notificaciones_ofertas_publicas() from public;
revoke all on function public.crear_notificacion_jefe(text,text,timestamptz,timestamptz,text) from public, anon;
revoke all on function public.marcar_oferta_especial_jefe(bigint,boolean,boolean) from public, anon;
revoke all on function public.guardar_configuracion_sitio_jefe(jsonb) from public, anon;
revoke all on function public.listar_ofertas_automaticas_jefe(integer) from public, anon;

grant execute on function public.enviar_reclamo(text,text,text,text,text,text,text,numeric,text,text) to anon, authenticated, service_role;
grant execute on function public.listar_reclamos_personal(text,text,date,date,integer) to authenticated;
grant execute on function public.responder_reclamo_personal(bigint,text,text) to authenticated;
grant execute on function public.listar_auditoria_personal(date,date,text,text,text,integer) to authenticated;
grant execute on function public.resumen_ciclo_usuarios_jefe(date,date) to authenticated;
grant execute on function public.obtener_configuracion_publica() to anon, authenticated;
grant execute on function public.listar_notificaciones_ofertas_publicas() to anon, authenticated;
grant execute on function public.crear_notificacion_jefe(text,text,timestamptz,timestamptz,text) to authenticated;
grant execute on function public.marcar_oferta_especial_jefe(bigint,boolean,boolean) to authenticated;
grant execute on function public.guardar_configuracion_sitio_jefe(jsonb) to authenticated;
grant execute on function public.listar_ofertas_automaticas_jefe(integer) to authenticated;

commit;

notify pgrst, 'reload schema';
