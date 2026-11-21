-- ============================================================================
-- BYTE BAY · DELTA DE PRIVACIDAD, TOKENS Y AUDITORÍA INMUTABLE
-- Versión del aviso: v2.1-2026
--
-- Ejecutar DESPUÉS de:
--   base-datos-beru-completa.sql
--   migrations_seguridad.sql
--   migrations_seguridad_2.sql
--   migrations_seguridad_3.sql
--
-- Este script:
--   1. Crea el estado de consentimiento por cliente/invitado.
--   2. Crea sesiones con access token JWT firmado y refresh token rotatorio.
--   3. Crea el perfil/eventos del motor de recomendaciones.
--   4. Crea audit_consent_logs con cadena SHA-256 y protección append-only.
--   5. Expone RPC SECURITY DEFINER para login, consentimiento y recomendaciones.
--
-- IMPORTANTE: el frontend NUNCA decide por sí solo si la personalización está
-- activa. Toda lectura/escritura pasa por estas RPC y el servidor valida el
-- token y el consentimiento antes de devolver recomendaciones.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 0) Compatibilidad con instalaciones anteriores
-- ----------------------------------------------------------------------------
alter table public.cuentas_clientes
  add column if not exists login_failed_attempts integer not null default 0,
  add column if not exists lockout_until timestamptz,
  add column if not exists ultimo_acceso_en timestamptz;

-- ----------------------------------------------------------------------------
-- 1) Secreto de firma JWT (schema privado, sin acceso para anon/authenticated)
-- ----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.configuracion_seguridad (
  clave text primary key,
  valor text not null,
  actualizado_en timestamptz not null default now()
);

insert into private.configuracion_seguridad (clave, valor)
values (
  'jwt_secret',
  replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
)
on conflict (clave) do nothing;

revoke all on table private.configuracion_seguridad from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2) Sesiones de token
-- ----------------------------------------------------------------------------
create table if not exists public.sesiones_tokens (
  id uuid primary key default gen_random_uuid(),
  customer_id bigint references public.cuentas_clientes(id) on delete cascade,
  guest_id text,
  role text not null default 'cliente'
    check (role in ('cliente', 'invitado', 'admin', 'personal')),
  access_jti uuid not null,
  refresh_token_hash text not null unique,
  user_agent text,
  ip text,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  refresh_expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  constraint sesiones_tokens_identidad_chk
    check (customer_id is not null or guest_id is not null)
);

create index if not exists sesiones_tokens_customer_idx
  on public.sesiones_tokens(customer_id, revoked_at);
create index if not exists sesiones_tokens_guest_idx
  on public.sesiones_tokens(guest_id, revoked_at);
create index if not exists sesiones_tokens_refresh_idx
  on public.sesiones_tokens(refresh_token_hash);

alter table public.sesiones_tokens enable row level security;
revoke all on public.sesiones_tokens from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3) Consentimiento y preferencias
-- ----------------------------------------------------------------------------
create table if not exists public.consentimiento_clientes (
  id uuid primary key default gen_random_uuid(),
  customer_id bigint references public.cuentas_clientes(id) on delete cascade,
  guest_id text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aceptado', 'rechazado', 'desactivado')),
  finalidades jsonb not null default jsonb_build_object(
    'rec_navegacion', false,
    'rec_busquedas', false,
    'rec_carrito_compras', false,
    'ui_secciones', false
  ),
  aviso_version text not null default 'v2.1-2026',
  aceptado_en timestamptz,
  ultima_aceptacion_en timestamptz,
  rechazado_en timestamptz,
  desactivado_en timestamptz,
  operation_id uuid,
  actualizado_en timestamptz not null default now(),
  constraint consentimiento_clientes_identidad_chk
    check (customer_id is not null or guest_id is not null)
);

create unique index if not exists consentimiento_clientes_customer_uidx
  on public.consentimiento_clientes(customer_id)
  where customer_id is not null;
create unique index if not exists consentimiento_clientes_guest_uidx
  on public.consentimiento_clientes(guest_id)
  where guest_id is not null;

alter table public.consentimiento_clientes enable row level security;
revoke all on public.consentimiento_clientes from public, anon, authenticated;

create table if not exists public.preferencias_clientes (
  customer_id bigint primary key references public.cuentas_clientes(id) on delete cascade,
  preferencias jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now()
);

alter table public.preferencias_clientes enable row level security;
revoke all on public.preferencias_clientes from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4) Motor de recomendaciones: eventos + vector de categorías
-- ----------------------------------------------------------------------------
create table if not exists public.recomendacion_eventos (
  id bigint generated always as identity primary key,
  customer_id bigint references public.cuentas_clientes(id) on delete cascade,
  guest_id text,
  token_session_id uuid,
  tipo text not null
    check (tipo in ('VISTA', 'CATEGORIA', 'BUSQUEDA', 'CARRITO')),
  id_producto bigint,
  categoria text,
  termino text,
  creado_en timestamptz not null default now(),
  constraint recomendacion_eventos_identidad_chk
    check (customer_id is not null or guest_id is not null)
);

create index if not exists recomendacion_eventos_customer_idx
  on public.recomendacion_eventos(customer_id, creado_en desc);
create index if not exists recomendacion_eventos_guest_idx
  on public.recomendacion_eventos(guest_id, creado_en desc);

alter table public.recomendacion_eventos enable row level security;
revoke all on public.recomendacion_eventos from public, anon, authenticated;

create table if not exists public.recomendacion_perfiles (
  id uuid primary key default gen_random_uuid(),
  customer_id bigint references public.cuentas_clientes(id) on delete cascade,
  guest_id text,
  vector_categorias jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now(),
  constraint recomendacion_perfiles_identidad_chk
    check (customer_id is not null or guest_id is not null)
);

create unique index if not exists recomendacion_perfiles_customer_uidx
  on public.recomendacion_perfiles(customer_id)
  where customer_id is not null;
create unique index if not exists recomendacion_perfiles_guest_uidx
  on public.recomendacion_perfiles(guest_id)
  where guest_id is not null;

alter table public.recomendacion_perfiles enable row level security;
revoke all on public.recomendacion_perfiles from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5) Auditoría inmutable (append-only + hash encadenado)
-- ----------------------------------------------------------------------------
create table if not exists public.audit_consent_logs (
  id bigint generated always as identity primary key,
  operation_id uuid not null unique,
  customer_id bigint references public.cuentas_clientes(id) on delete set null,
  token_session_id uuid,
  event_type text not null check (event_type in (
    'CONSENTIMIENTO_ACEPTADO',
    'CONSENTIMIENTO_RECHAZADO',
    'PERSONALIZACION_DESACTIVADA',
    'PERSONALIZACION_REACTIVADA',
    'PREFERENCIAS_ACTUALIZADAS',
    'CONSENTIMIENTO_CONSULTADO',
    'TOKEN_SESION_EMITIDO',
    'TOKEN_SESION_REVOCADO',
    'HISTORIAL_LIMPIADO',
    'ERROR_PROCESAMIENTO'
  )),
  previous_state jsonb,
  new_state jsonb,
  created_at timestamptz not null default now(),
  consent_purposes jsonb,
  privacy_notice_version text,
  action_medium text not null check (action_medium in (
    'BANNER_INICIAL',
    'MENU_CONFIGURACION',
    'MODAL_PREFERENCIAS',
    'API_BACKEND'
  )),
  processing_result text not null default 'SUCCESS',
  previous_hash text,
  integrity_hash text
);

create index if not exists audit_consent_logs_customer_idx
  on public.audit_consent_logs(customer_id, created_at desc);
create index if not exists audit_consent_logs_event_idx
  on public.audit_consent_logs(event_type, created_at desc);

alter table public.audit_consent_logs enable row level security;
revoke all on public.audit_consent_logs from public, anon, authenticated;

-- Hash encadenado. Se serializa con advisory lock para que dos transacciones
-- simultáneas no lean el mismo "último hash".
create or replace function public.bb_audit_hash()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_prev text;
begin
  perform pg_advisory_xact_lock(hashtextextended('bb_audit_consent_logs', 0));

  select integrity_hash into v_prev
  from public.audit_consent_logs
  order by id desc
  limit 1;

  new.previous_hash := coalesce(v_prev, 'GENESIS');
  new.created_at := now();
  new.integrity_hash := encode(digest(
    new.previous_hash || '|' ||
    new.operation_id::text || '|' ||
    coalesce(new.customer_id::text, '') || '|' ||
    coalesce(new.token_session_id::text, '') || '|' ||
    new.event_type || '|' ||
    coalesce(new.previous_state::text, '{}') || '|' ||
    coalesce(new.new_state::text, '{}') || '|' ||
    coalesce(new.consent_purposes::text, '{}') || '|' ||
    coalesce(new.privacy_notice_version, '') || '|' ||
    new.action_medium || '|' ||
    new.processing_result || '|' ||
    to_char(new.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'sha256'
  ), 'hex');

  return new;
end;
$function$;

drop trigger if exists audit_consent_logs_hash on public.audit_consent_logs;
create trigger audit_consent_logs_hash
before insert on public.audit_consent_logs
for each row execute function public.bb_audit_hash();

create or replace function public.bb_audit_solo_insercion()
returns trigger
language plpgsql
as $function$
begin
  raise exception 'audit_consent_logs es inmutable: no se permite UPDATE, DELETE ni TRUNCATE';
end;
$function$;

drop trigger if exists audit_consent_logs_no_update on public.audit_consent_logs;
create trigger audit_consent_logs_no_update
before update or delete on public.audit_consent_logs
for each row execute function public.bb_audit_solo_insercion();

drop trigger if exists audit_consent_logs_no_truncate on public.audit_consent_logs;
create trigger audit_consent_logs_no_truncate
before truncate on public.audit_consent_logs
for each statement execute function public.bb_audit_solo_insercion();

-- ----------------------------------------------------------------------------
-- 6) Utilidades JWT
-- ----------------------------------------------------------------------------
create or replace function public.bb_base64url(p_text text)
returns text
language sql
immutable
as $function$
  select rtrim(
    replace(replace(encode(convert_to(p_text, 'UTF8'), 'base64'), '+', '-'), '/', '_'),
    '='
  );
$function$;

create or replace function public.bb_base64url_bytes(p_data bytea)
returns text
language sql
immutable
as $function$
  select rtrim(
    replace(replace(encode(p_data, 'base64'), '+', '-'), '/', '_'),
    '='
  );
$function$;

create or replace function public.bb_jwt_emitir(
  p_session_id uuid,
  p_customer_id bigint,
  p_role text,
  p_jti uuid,
  p_iat bigint,
  p_exp bigint
)
returns text
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_secret text;
  v_header text;
  v_payload jsonb;
  v_input text;
  v_signature text;
begin
  select valor into v_secret
  from private.configuracion_seguridad
  where clave = 'jwt_secret';

  if v_secret is null then
    raise exception 'JWT secret no configurado';
  end if;

  v_header := public.bb_base64url('{"alg":"HS256","typ":"JWT"}');
  v_payload := jsonb_build_object(
    'iss', 'byte-bay',
    'aud', 'byte-bay-store',
    'sub', coalesce(p_customer_id::text, p_session_id::text),
    'user_id', p_customer_id,
    'role', p_role,
    'session_id', p_session_id,
    'jti', p_jti,
    'iat', p_iat,
    'exp', p_exp
  );
  v_input := v_header || '.' || public.bb_base64url(v_payload::text);
  v_signature := public.bb_base64url_bytes(hmac(v_input, v_secret, 'sha256'));

  return v_input || '.' || v_signature;
end;
$function$;

create or replace function public.bb_jwt_verificar(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_parts text[];
  v_secret text;
  v_expected text;
  v_payload jsonb;
  v_b64 text;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return jsonb_build_object('valid', false, 'reason', 'TOKEN_AUSENTE');
  end if;

  v_parts := string_to_array(p_token, '.');
  if array_length(v_parts, 1) <> 3 then
    return jsonb_build_object('valid', false, 'reason', 'TOKEN_MAL_FORMADO');
  end if;

  select valor into v_secret
  from private.configuracion_seguridad
  where clave = 'jwt_secret';

  if v_secret is null then
    return jsonb_build_object('valid', false, 'reason', 'SECRETO_NO_CONFIGURADO');
  end if;

  v_expected := public.bb_base64url_bytes(
    hmac(v_parts[1] || '.' || v_parts[2], v_secret, 'sha256')
  );

  if v_expected <> v_parts[3] then
    return jsonb_build_object('valid', false, 'reason', 'FIRMA_INVALIDA');
  end if;

  begin
    v_b64 := translate(replace(replace(v_parts[2], '-', '+'), '_', '/'), E'\n', '');
    v_b64 := v_b64 || repeat('=', (4 - (length(v_b64) % 4)) % 4);
    v_payload := convert_from(decode(v_b64, 'base64'), 'UTF8')::jsonb;
  exception when others then
    return jsonb_build_object('valid', false, 'reason', 'PAYLOAD_INVALIDO');
  end;

  if coalesce((v_payload->>'exp')::bigint, 0) <= floor(extract(epoch from now()))::bigint then
    return jsonb_build_object('valid', false, 'reason', 'TOKEN_EXPIRADO');
  end if;

  return jsonb_build_object('valid', true, 'payload', v_payload);
end;
$function$;

-- ----------------------------------------------------------------------------
-- 7) Auditoría helper (idempotente por operation_id)
-- ----------------------------------------------------------------------------
create or replace function public.bb_audit_insert(
  p_operation_id uuid,
  p_customer_id bigint,
  p_token_session_id uuid,
  p_event_type text,
  p_previous_state jsonb,
  p_new_state jsonb,
  p_consent_purposes jsonb,
  p_privacy_notice_version text,
  p_action_medium text,
  p_processing_result text
)
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
begin
  insert into public.audit_consent_logs (
    operation_id, customer_id, token_session_id, event_type,
    previous_state, new_state, consent_purposes, privacy_notice_version,
    action_medium, processing_result
  ) values (
    coalesce(p_operation_id, gen_random_uuid()),
    p_customer_id,
    p_token_session_id,
    p_event_type,
    p_previous_state,
    p_new_state,
    p_consent_purposes,
    coalesce(p_privacy_notice_version, 'v2.1-2026'),
    coalesce(p_action_medium, 'API_BACKEND'),
    coalesce(p_processing_result, 'SUCCESS')
  );
exception when unique_violation then
  -- Idempotencia: la misma operación ya fue registrada.
  null;
end;
$function$;

-- ----------------------------------------------------------------------------
-- 8) Validación de token contra la sesión persistida
-- ----------------------------------------------------------------------------
create or replace function public.bb_validar_token_sesion(p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_verif jsonb;
  v_payload jsonb;
  v_sesion public.sesiones_tokens%rowtype;
begin
  v_verif := public.bb_jwt_verificar(p_access_token);
  if not coalesce((v_verif->>'valid')::boolean, false) then
    return jsonb_build_object(
      'valid', false,
      'reason', coalesce(v_verif->>'reason', 'TOKEN_INVALIDO')
    );
  end if;

  v_payload := v_verif->'payload';

  begin
    select * into v_sesion
    from public.sesiones_tokens
    where id = (v_payload->>'session_id')::uuid
      and access_jti = (v_payload->>'jti')::uuid
    limit 1;
  exception when others then
    return jsonb_build_object('valid', false, 'reason', 'SESION_INVALIDA');
  end;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'SESION_NO_ENCONTRADA');
  end if;
  if v_sesion.revoked_at is not null then
    return jsonb_build_object('valid', false, 'reason', 'SESION_REVOCADA');
  end if;
  if v_sesion.expires_at <= now() then
    return jsonb_build_object('valid', false, 'reason', 'SESION_EXPIRADA');
  end if;
  if v_sesion.customer_id is not null
     and coalesce(v_payload->>'user_id', '') <> v_sesion.customer_id::text then
    return jsonb_build_object('valid', false, 'reason', 'IDENTIDAD_INCONSISTENTE');
  end if;

  return jsonb_build_object(
    'valid', true,
    'session_id', v_sesion.id,
    'customer_id', v_sesion.customer_id,
    'guest_id', v_sesion.guest_id,
    'role', v_sesion.role,
    'exp', floor(extract(epoch from v_sesion.expires_at))::bigint,
    'payload', v_payload
  );
end;
$function$;

create or replace function public.bb_identidad_actual(p_validacion jsonb)
returns jsonb
language sql
immutable
as $function$
  select jsonb_build_object(
    'customer_id', nullif(p_validacion->>'customer_id', '')::bigint,
    'guest_id', nullif(p_validacion->>'guest_id', ''),
    'session_id', nullif(p_validacion->>'session_id', '')::uuid
  );
$function$;

-- ----------------------------------------------------------------------------
-- 9) Creación / renovación / revocación de sesiones
-- ----------------------------------------------------------------------------
create or replace function public.bb_crear_sesion(
  p_customer_id bigint,
  p_guest_id text,
  p_role text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_session_id uuid := gen_random_uuid();
  v_jti uuid := gen_random_uuid();
  v_refresh text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_expires_at timestamptz := now() + interval '15 minutes';
  v_refresh_expires_at timestamptz := now() + interval '30 days';
  v_access text;
begin
  insert into public.sesiones_tokens (
    id, customer_id, guest_id, role, access_jti, refresh_token_hash,
    user_agent, expires_at, refresh_expires_at
  ) values (
    v_session_id, p_customer_id, p_guest_id, p_role, v_jti,
    encode(digest(v_refresh, 'sha256'), 'hex'),
    p_user_agent, v_expires_at, v_refresh_expires_at
  );

  v_access := public.bb_jwt_emitir(
    v_session_id,
    p_customer_id,
    p_role,
    v_jti,
    floor(extract(epoch from now()))::bigint,
    floor(extract(epoch from v_expires_at))::bigint
  );

  perform public.bb_audit_insert(
    gen_random_uuid(),
    p_customer_id,
    v_session_id,
    'TOKEN_SESION_EMITIDO',
    null,
    jsonb_build_object(
      'session_id', v_session_id,
      'role', p_role,
      'expira_en', v_expires_at,
      'refresh_expira_en', v_refresh_expires_at
    ),
    '{"rec_navegacion":false,"rec_busquedas":false,"rec_carrito_compras":false,"ui_secciones":false}'::jsonb,
    'v2.1-2026',
    'API_BACKEND',
    'SUCCESS'
  );

  return jsonb_build_object(
    'access_token', v_access,
    'refresh_token', v_refresh,
    'token_type', 'Bearer',
    'expires_in', 900,
    'expires_at', v_expires_at,
    'refresh_expires_at', v_refresh_expires_at,
    'session_id', v_session_id,
    'role', p_role,
    'customer_id', p_customer_id,
    'guest_id', p_guest_id
  );
end;
$function$;

create or replace function public.bb_emitir_sesion_invitado(
  p_guest_id text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_guest text := nullif(trim(coalesce(p_guest_id, '')), '');
begin
  if v_guest is null or length(v_guest) > 120 then
    v_guest := 'inv_' || replace(gen_random_uuid()::text, '-', '');
  end if;

  return public.bb_crear_sesion(null, v_guest, 'invitado', p_user_agent);
end;
$function$;

create or replace function public.bb_registrar_cuenta_cliente(
  p_correo text,
  p_nombres text default null,
  p_apellidos text default null,
  p_nombre_usuario text default null,
  p_contrasena text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_id bigint;
begin
  if length(coalesce(p_contrasena, '')) < 8
     or p_contrasena !~ '[A-Za-z]'
     or p_contrasena !~ '[0-9]'
     or p_contrasena !~ '[^A-Za-z0-9]' then
    raise exception 'La contraseña debe tener al menos 8 caracteres e incluir letras, números y un símbolo';
  end if;

  v_id := public.registrar_cuenta_cliente(
    p_correo, p_nombres, p_apellidos, p_nombre_usuario, p_contrasena
  );

  return jsonb_build_object('id', v_id);
end;
$function$;

create or replace function public.bb_iniciar_sesion_cliente(
  p_correo text,
  p_contrasena text,
  p_guest_id text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_cuenta jsonb;
  v_customer_id bigint;
  v_sesion jsonb;
  v_consentimiento jsonb;
begin
  v_cuenta := public.iniciar_sesion_cliente(p_correo, p_contrasena);
  v_customer_id := (v_cuenta->>'id')::bigint;

  -- Invitado -> cuenta: solo se hereda una decisión NEGATIVA (rechazado o
  -- desactivado) para no volver a preguntar. Una aceptación de invitado NUNCA
  -- se convierte en aceptación de la cuenta: iniciar sesión jamás activa la
  -- personalización por sí solo. Los eventos de invitado tampoco se mezclan.
  if nullif(trim(coalesce(p_guest_id, '')), '') is not null then
    update public.consentimiento_clientes
       set customer_id = v_customer_id,
           guest_id = null,
           actualizado_en = now()
     where guest_id = p_guest_id
       and estado in ('rechazado', 'desactivado')
       and not exists (
         select 1 from public.consentimiento_clientes
         where customer_id = v_customer_id
       );
  end if;

  v_sesion := public.bb_crear_sesion(v_customer_id, null, 'cliente', p_user_agent);
  v_consentimiento := public.bb_obtener_consentimiento(
    v_sesion->>'access_token', false, 'API_BACKEND'
  );

  return v_sesion || jsonb_build_object(
    'cuenta', v_cuenta,
    'consentimiento', v_consentimiento
  );
end;
$function$;

create or replace function public.bb_emitir_sesion_google(
  p_guest_id text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $function$
declare
  v_uid uuid := auth.uid();
  v_correo text;
  v_cuenta public.cuentas_clientes%rowtype;
  v_sesion jsonb;
  v_consentimiento jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'SESION_GOOGLE_REQUERIDA');
  end if;

  select lower(email) into v_correo from auth.users where id = v_uid;
  if v_correo is null then
    return jsonb_build_object('ok', false, 'error', 'CORREO_GOOGLE_AUSENTE');
  end if;

  select * into v_cuenta
  from public.cuentas_clientes
  where correo = v_correo and activa
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'CUENTA_NO_SINCRONIZADA');
  end if;

  -- Igual que el login con contraseña: solo se hereda una decisión negativa.
  -- Iniciar sesión con Google nunca activa la personalización por sí mismo.
  if nullif(trim(coalesce(p_guest_id, '')), '') is not null then
    update public.consentimiento_clientes
       set customer_id = v_cuenta.id,
           guest_id = null,
           actualizado_en = now()
     where guest_id = p_guest_id
       and estado in ('rechazado', 'desactivado')
       and not exists (
         select 1 from public.consentimiento_clientes where customer_id = v_cuenta.id
       );
  end if;

  v_sesion := public.bb_crear_sesion(v_cuenta.id, null, 'cliente', p_user_agent);
  v_consentimiento := public.bb_obtener_consentimiento(
    v_sesion->>'access_token', false, 'API_BACKEND'
  );

  return v_sesion || jsonb_build_object(
    'cuenta', jsonb_build_object(
      'id', v_cuenta.id,
      'correo', v_cuenta.correo,
      'nombres', v_cuenta.nombres,
      'apellidos', v_cuenta.apellidos,
      'nombre_usuario', v_cuenta.nombre_usuario
    ),
    'consentimiento', v_consentimiento
  );
end;
$function$;

create or replace function public.bb_refrescar_sesion(p_refresh_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_sesion public.sesiones_tokens%rowtype;
  v_jti uuid := gen_random_uuid();
  v_refresh text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_expires_at timestamptz := now() + interval '15 minutes';
  v_access text;
begin
  if p_refresh_token is null or length(trim(p_refresh_token)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'REFRESH_AUSENTE');
  end if;

  select * into v_sesion
  from public.sesiones_tokens
  where refresh_token_hash = encode(digest(p_refresh_token, 'sha256'), 'hex')
    and revoked_at is null
    and refresh_expires_at > now()
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'REFRESH_INVALIDO');
  end if;

  update public.sesiones_tokens
     set access_jti = v_jti,
         refresh_token_hash = encode(digest(v_refresh, 'sha256'), 'hex'),
         expires_at = v_expires_at,
         last_used_at = now()
   where id = v_sesion.id;

  v_access := public.bb_jwt_emitir(
    v_sesion.id,
    v_sesion.customer_id,
    v_sesion.role,
    v_jti,
    floor(extract(epoch from now()))::bigint,
    floor(extract(epoch from v_expires_at))::bigint
  );

  return jsonb_build_object(
    'ok', true,
    'access_token', v_access,
    'refresh_token', v_refresh,
    'token_type', 'Bearer',
    'expires_in', 900,
    'expires_at', v_expires_at,
    'session_id', v_sesion.id,
    'role', v_sesion.role,
    'customer_id', v_sesion.customer_id,
    'guest_id', v_sesion.guest_id
  );
end;
$function$;

create or replace function public.bb_validar_sesion(p_access_token text)
returns jsonb
language sql
security definer
set search_path to 'public', 'extensions'
as $function$
  select public.bb_validar_token_sesion(p_access_token);
$function$;

create or replace function public.bb_revocar_sesion_actual(p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_identidad jsonb;
begin
  v_validacion := public.bb_validar_token_sesion(p_access_token);
  if not coalesce((v_validacion->>'valid')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', v_validacion->>'reason');
  end if;

  v_identidad := public.bb_identidad_actual(v_validacion);

  update public.sesiones_tokens
     set revoked_at = now(),
         revoked_reason = 'LOGOUT_CLIENTE'
   where id = (v_identidad->>'session_id')::uuid
     and revoked_at is null;

  perform public.bb_audit_insert(
    gen_random_uuid(),
    (v_identidad->>'customer_id')::bigint,
    (v_identidad->>'session_id')::uuid,
    'TOKEN_SESION_REVOCADO',
    jsonb_build_object('sesion_activa', true),
    jsonb_build_object('sesion_activa', false, 'motivo', 'LOGOUT_CLIENTE'),
    null, 'v2.1-2026', 'API_BACKEND', 'SUCCESS'
  );

  return jsonb_build_object('ok', true);
end;
$function$;

create or replace function public.bb_revocar_sesiones_cliente(p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_identidad jsonb;
  v_sesion record;
  v_total integer := 0;
begin
  v_validacion := public.bb_validar_token_sesion(p_access_token);
  if not coalesce((v_validacion->>'valid')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', v_validacion->>'reason');
  end if;

  v_identidad := public.bb_identidad_actual(v_validacion);
  if (v_identidad->>'customer_id') is null then
    return jsonb_build_object('ok', false, 'error', 'CUENTA_REQUERIDA');
  end if;

  for v_sesion in
    select id from public.sesiones_tokens
    where customer_id = (v_identidad->>'customer_id')::bigint
      and revoked_at is null
  loop
    update public.sesiones_tokens
       set revoked_at = now(),
           revoked_reason = 'LOGOUT_TODOS_LOS_DISPOSITIVOS'
     where id = v_sesion.id;

    perform public.bb_audit_insert(
      gen_random_uuid(),
      (v_identidad->>'customer_id')::bigint,
      v_sesion.id,
      'TOKEN_SESION_REVOCADO',
      jsonb_build_object('sesion_activa', true),
      jsonb_build_object('sesion_activa', false, 'motivo', 'LOGOUT_TODOS_LOS_DISPOSITIVOS'),
      null, 'v2.1-2026', 'API_BACKEND', 'SUCCESS'
    );

    v_total := v_total + 1;
  end loop;

  return jsonb_build_object('ok', true, 'sesiones_revocadas', v_total);
end;
$function$;

-- ----------------------------------------------------------------------------
-- 10) Consentimiento
-- ----------------------------------------------------------------------------
create or replace function public.bb_obtener_consentimiento(
  p_access_token text,
  p_registrar_consulta boolean default false,
  p_action_medium text default 'MENU_CONFIGURACION'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_identidad jsonb;
  v_consentimiento public.consentimiento_clientes%rowtype;
  v_default jsonb := '{"rec_navegacion":false,"rec_busquedas":false,"rec_carrito_compras":false,"ui_secciones":false}'::jsonb;
  v_result jsonb;
begin
  v_validacion := public.bb_validar_token_sesion(p_access_token);
  if not coalesce((v_validacion->>'valid')::boolean, false) then
    return jsonb_build_object(
      'ok', false,
      'error', coalesce(v_validacion->>'reason', 'TOKEN_INVALIDO'),
      'estado', 'pendiente',
      'finalidades', v_default
    );
  end if;

  v_identidad := public.bb_identidad_actual(v_validacion);

  if (v_identidad->>'customer_id') is not null then
    select * into v_consentimiento
    from public.consentimiento_clientes
    where customer_id = (v_identidad->>'customer_id')::bigint
    limit 1;
  else
    select * into v_consentimiento
    from public.consentimiento_clientes
    where guest_id = v_identidad->>'guest_id'
    limit 1;
  end if;

  v_result := jsonb_build_object(
    'ok', true,
    'estado', coalesce(v_consentimiento.estado, 'pendiente'),
    'finalidades', coalesce(v_consentimiento.finalidades, v_default),
    'aviso_version', coalesce(v_consentimiento.aviso_version, 'v2.1-2026'),
    'aceptado_en', v_consentimiento.aceptado_en,
    'ultima_aceptacion_en', v_consentimiento.ultima_aceptacion_en,
    'rechazado_en', v_consentimiento.rechazado_en,
    'desactivado_en', v_consentimiento.desactivado_en,
    'actualizado_en', v_consentimiento.actualizado_en,
    'operation_id', v_consentimiento.operation_id,
    'session_id', v_identidad->>'session_id',
    'customer_id', v_identidad->>'customer_id',
    'guest_id', v_identidad->>'guest_id'
  );

  if p_registrar_consulta then
    perform public.bb_audit_insert(
      gen_random_uuid(),
      (v_identidad->>'customer_id')::bigint,
      (v_identidad->>'session_id')::uuid,
      'CONSENTIMIENTO_CONSULTADO',
      v_result,
      v_result,
      coalesce(v_consentimiento.finalidades, v_default),
      coalesce(v_consentimiento.aviso_version, 'v2.1-2026'),
      case when p_action_medium in ('BANNER_INICIAL','MENU_CONFIGURACION','MODAL_PREFERENCIAS','API_BACKEND')
           then p_action_medium else 'MENU_CONFIGURACION' end,
      'SUCCESS'
    );
  end if;

  return v_result;
end;
$function$;

create or replace function public.bb_guardar_consentimiento(
  p_access_token text,
  p_operation_id uuid,
  p_event_type text,
  p_decision text,
  p_purposes jsonb,
  p_action_medium text,
  p_privacy_notice_version text default 'v2.1-2026'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_identidad jsonb;
  v_prev public.consentimiento_clientes%rowtype;
  v_previous_state jsonb;
  v_new_state jsonb;
  v_purposes jsonb;
  v_estado text;
  v_existing public.audit_consent_logs%rowtype;
  v_customer_id bigint;
  v_guest_id text;
  v_session_id uuid;
  v_aceptado_en timestamptz;
  v_ultima_aceptacion_en timestamptz;
  v_rechazado_en timestamptz;
  v_desactivado_en timestamptz;
begin
  p_operation_id := coalesce(p_operation_id, gen_random_uuid());

  -- Idempotencia real: si el operation_id ya existe, no se duplica auditoría.
  select * into v_existing
  from public.audit_consent_logs
  where operation_id = p_operation_id
  limit 1;

  if found then
    return jsonb_build_object(
      'ok', true,
      'idempotente', true,
      'operation_id', p_operation_id,
      'event_type', v_existing.event_type,
      'estado', coalesce(v_existing.new_state->>'estado', 'pendiente'),
      'finalidades', coalesce(v_existing.new_state->'finalidades', '{}'::jsonb),
      'aviso_version', v_existing.privacy_notice_version,
      'aceptado_en', v_existing.new_state->>'aceptado_en',
      'actualizado_en', v_existing.new_state->>'actualizado_en'
    );
  end if;

  v_validacion := public.bb_validar_token_sesion(p_access_token);
  if not coalesce((v_validacion->>'valid')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', coalesce(v_validacion->>'reason', 'TOKEN_INVALIDO'));
  end if;

  if p_action_medium not in ('BANNER_INICIAL','MENU_CONFIGURACION','MODAL_PREFERENCIAS','API_BACKEND') then
    raise exception 'Medio de acción no permitido';
  end if;

  if p_event_type not in (
    'CONSENTIMIENTO_ACEPTADO',
    'CONSENTIMIENTO_RECHAZADO',
    'PERSONALIZACION_DESACTIVADA',
    'PERSONALIZACION_REACTIVADA',
    'PREFERENCIAS_ACTUALIZADAS'
  ) then
    raise exception 'Evento de consentimiento no permitido';
  end if;

  v_identidad := public.bb_identidad_actual(v_validacion);
  v_customer_id := (v_identidad->>'customer_id')::bigint;
  v_guest_id := v_identidad->>'guest_id';
  v_session_id := (v_identidad->>'session_id')::uuid;

  if v_customer_id is not null then
    select * into v_prev
    from public.consentimiento_clientes
    where customer_id = v_customer_id
    limit 1;
  else
    select * into v_prev
    from public.consentimiento_clientes
    where guest_id = v_guest_id
    limit 1;
  end if;

  v_previous_state := jsonb_build_object(
    'estado', coalesce(v_prev.estado, 'pendiente'),
    'finalidades', coalesce(v_prev.finalidades, '{"rec_navegacion":false,"rec_busquedas":false,"rec_carrito_compras":false,"ui_secciones":false}'::jsonb),
    'aceptado_en', v_prev.aceptado_en,
    'ultima_aceptacion_en', v_prev.ultima_aceptacion_en,
    'actualizado_en', v_prev.actualizado_en
  );

  v_purposes := jsonb_build_object(
    'rec_navegacion', coalesce((p_purposes->>'rec_navegacion')::boolean, false),
    'rec_busquedas', coalesce((p_purposes->>'rec_busquedas')::boolean, false),
    'rec_carrito_compras', coalesce((p_purposes->>'rec_carrito_compras')::boolean, false),
    'ui_secciones', coalesce((p_purposes->>'ui_secciones')::boolean, false)
  );

  if p_event_type = 'PERSONALIZACION_DESACTIVADA' or p_decision = 'desactivado' then
    v_purposes := '{"rec_navegacion":false,"rec_busquedas":false,"rec_carrito_compras":false,"ui_secciones":false}'::jsonb;
    v_estado := 'desactivado';
  elsif p_event_type = 'CONSENTIMIENTO_RECHAZADO' or p_decision = 'rechazado' then
    v_purposes := '{"rec_navegacion":false,"rec_busquedas":false,"rec_carrito_compras":false,"ui_secciones":false}'::jsonb;
    v_estado := 'rechazado';
  elsif p_decision = 'aceptado' or p_decision = 'personalizado' then
    if (v_purposes->>'rec_navegacion')::boolean
       or (v_purposes->>'rec_busquedas')::boolean
       or (v_purposes->>'rec_carrito_compras')::boolean
       or (v_purposes->>'ui_secciones')::boolean then
      v_estado := 'aceptado';
    else
      v_estado := 'rechazado';
    end if;
  elsif p_decision = 'configurar' then
    -- Guardar preferencias sin activar: conserva la situación anterior y nunca
    -- convierte una configuración en una aceptación.
    v_estado := coalesce(nullif(v_prev.estado, ''), 'pendiente');
    if v_estado = 'aceptado'
       and not (
         (v_purposes->>'rec_navegacion')::boolean
         or (v_purposes->>'rec_busquedas')::boolean
         or (v_purposes->>'rec_carrito_compras')::boolean
         or (v_purposes->>'ui_secciones')::boolean
       ) then
      v_estado := 'desactivado';
    end if;
  else
    raise exception 'Decisión de consentimiento no válida';
  end if;

  v_aceptado_en := v_prev.aceptado_en;
  v_ultima_aceptacion_en := v_prev.ultima_aceptacion_en;
  v_rechazado_en := v_prev.rechazado_en;
  v_desactivado_en := v_prev.desactivado_en;

  if v_estado = 'aceptado' then
    v_aceptado_en := coalesce(v_aceptado_en, now());
    v_ultima_aceptacion_en := now();
    v_rechazado_en := null;
    v_desactivado_en := null;
  elsif v_estado = 'rechazado' then
    v_rechazado_en := now();
  elsif v_estado = 'desactivado' then
    v_desactivado_en := now();
  end if;

  if v_customer_id is not null then
    update public.consentimiento_clientes
       set estado = v_estado,
           finalidades = v_purposes,
           aviso_version = coalesce(p_privacy_notice_version, 'v2.1-2026'),
           aceptado_en = v_aceptado_en,
           ultima_aceptacion_en = v_ultima_aceptacion_en,
           rechazado_en = v_rechazado_en,
           desactivado_en = v_desactivado_en,
           operation_id = p_operation_id,
           actualizado_en = now()
     where customer_id = v_customer_id;

    if not found then
      insert into public.consentimiento_clientes (
        customer_id, estado, finalidades, aviso_version,
        aceptado_en, ultima_aceptacion_en, rechazado_en, desactivado_en,
        operation_id
      ) values (
        v_customer_id, v_estado, v_purposes, coalesce(p_privacy_notice_version, 'v2.1-2026'),
        v_aceptado_en, v_ultima_aceptacion_en, v_rechazado_en, v_desactivado_en,
        p_operation_id
      );
    end if;
  else
    update public.consentimiento_clientes
       set estado = v_estado,
           finalidades = v_purposes,
           aviso_version = coalesce(p_privacy_notice_version, 'v2.1-2026'),
           aceptado_en = v_aceptado_en,
           ultima_aceptacion_en = v_ultima_aceptacion_en,
           rechazado_en = v_rechazado_en,
           desactivado_en = v_desactivado_en,
           operation_id = p_operation_id,
           actualizado_en = now()
     where guest_id = v_guest_id;

    if not found then
      insert into public.consentimiento_clientes (
        guest_id, estado, finalidades, aviso_version,
        aceptado_en, ultima_aceptacion_en, rechazado_en, desactivado_en,
        operation_id
      ) values (
        v_guest_id, v_estado, v_purposes, coalesce(p_privacy_notice_version, 'v2.1-2026'),
        v_aceptado_en, v_ultima_aceptacion_en, v_rechazado_en, v_desactivado_en,
        p_operation_id
      );
    end if;
  end if;

  -- Efecto real de la desactivación/rechazo: se borran vectores y eventos.
  if v_estado <> 'aceptado' then
    if v_customer_id is not null then
      delete from public.recomendacion_eventos where customer_id = v_customer_id;
      delete from public.recomendacion_perfiles where customer_id = v_customer_id;
    else
      delete from public.recomendacion_eventos where guest_id = v_guest_id;
      delete from public.recomendacion_perfiles where guest_id = v_guest_id;
    end if;
  end if;

  v_new_state := jsonb_build_object(
    'estado', v_estado,
    'finalidades', v_purposes,
    'aceptado_en', v_aceptado_en,
    'ultima_aceptacion_en', v_ultima_aceptacion_en,
    'rechazado_en', v_rechazado_en,
    'desactivado_en', v_desactivado_en,
    'actualizado_en', now()
  );

  perform public.bb_audit_insert(
    p_operation_id,
    v_customer_id,
    v_session_id,
    p_event_type,
    v_previous_state,
    v_new_state,
    v_purposes,
    coalesce(p_privacy_notice_version, 'v2.1-2026'),
    p_action_medium,
    'SUCCESS'
  );

  return jsonb_build_object(
    'ok', true,
    'operation_id', p_operation_id,
    'event_type', p_event_type,
    'estado', v_estado,
    'finalidades', v_purposes,
    'aviso_version', coalesce(p_privacy_notice_version, 'v2.1-2026'),
    'aceptado_en', v_aceptado_en,
    'ultima_aceptacion_en', v_ultima_aceptacion_en,
    'rechazado_en', v_rechazado_en,
    'desactivado_en', v_desactivado_en,
    'actualizado_en', now(),
    'previous_state', v_previous_state,
    'new_state', v_new_state,
    'session_id', v_session_id,
    'customer_id', v_customer_id,
    'guest_id', v_guest_id
  );
exception when others then
  perform public.bb_audit_insert(
    coalesce(p_operation_id, gen_random_uuid()),
    v_customer_id,
    v_session_id,
    'ERROR_PROCESAMIENTO',
    v_previous_state,
    null,
    p_purposes,
    coalesce(p_privacy_notice_version, 'v2.1-2026'),
    case when p_action_medium in ('BANNER_INICIAL','MENU_CONFIGURACION','MODAL_PREFERENCIAS','API_BACKEND')
         then p_action_medium else 'API_BACKEND' end,
    'ERROR: ' || sqlerrm
  );
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$function$;

-- ----------------------------------------------------------------------------
-- 11) Recomendaciones (backend autoritativo)
-- ----------------------------------------------------------------------------
create or replace function public.bb_registrar_evento_recomendacion(
  p_access_token text,
  p_tipo text,
  p_id_producto bigint default null,
  p_categoria text default null,
  p_termino text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_identidad jsonb;
  v_consentimiento public.consentimiento_clientes%rowtype;
  v_customer_id bigint;
  v_guest_id text;
  v_purpose text;
  v_vector jsonb;
begin
  v_validacion := public.bb_validar_token_sesion(p_access_token);
  if not coalesce((v_validacion->>'valid')::boolean, false) then
    return jsonb_build_object('ok', false, 'permitido', false, 'error', v_validacion->>'reason');
  end if;

  v_identidad := public.bb_identidad_actual(v_validacion);
  v_customer_id := (v_identidad->>'customer_id')::bigint;
  v_guest_id := v_identidad->>'guest_id';

  if v_customer_id is not null then
    select * into v_consentimiento from public.consentimiento_clientes
    where customer_id = v_customer_id limit 1;
  else
    select * into v_consentimiento from public.consentimiento_clientes
    where guest_id = v_guest_id limit 1;
  end if;

  if coalesce(v_consentimiento.estado, 'pendiente') <> 'aceptado' then
    return jsonb_build_object('ok', true, 'permitido', false, 'motivo', 'CONSENTIMIENTO_NO_ACTIVO');
  end if;

  v_purpose := case p_tipo
    when 'VISTA' then 'rec_navegacion'
    when 'CATEGORIA' then 'rec_navegacion'
    when 'BUSQUEDA' then 'rec_busquedas'
    when 'CARRITO' then 'rec_carrito_compras'
    else null
  end;

  if v_purpose is null
     or not coalesce((v_consentimiento.finalidades->>v_purpose)::boolean, false) then
    return jsonb_build_object('ok', true, 'permitido', false, 'motivo', 'FINALIDAD_NO_AUTORIZADA');
  end if;

  insert into public.recomendacion_eventos (
    customer_id, guest_id, token_session_id, tipo, id_producto, categoria, termino
  ) values (
    v_customer_id, v_guest_id, (v_identidad->>'session_id')::uuid,
    p_tipo, p_id_producto, left(nullif(trim(p_categoria), ''), 120),
    left(nullif(trim(p_termino), ''), 200)
  );

  -- Vector de categorías para poder borrarlo de inmediato al desactivar.
  select coalesce(jsonb_object_agg(categoria, total), '{}'::jsonb)
    into v_vector
  from (
    select categoria, count(*)::integer as total
    from public.recomendacion_eventos
    where categoria is not null
      and creado_en > now() - interval '180 days'
      and (
        (v_customer_id is not null and customer_id = v_customer_id)
        or (v_customer_id is null and guest_id = v_guest_id)
      )
    group by categoria
    order by total desc
    limit 25
  ) q;

  if v_customer_id is not null then
    update public.recomendacion_perfiles
       set vector_categorias = v_vector, actualizado_en = now()
     where customer_id = v_customer_id;
    if not found then
      insert into public.recomendacion_perfiles (customer_id, vector_categorias)
      values (v_customer_id, v_vector);
    end if;
  else
    update public.recomendacion_perfiles
       set vector_categorias = v_vector, actualizado_en = now()
     where guest_id = v_guest_id;
    if not found then
      insert into public.recomendacion_perfiles (guest_id, vector_categorias)
      values (v_guest_id, v_vector);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'permitido', true);
end;
$function$;

create or replace function public.bb_obtener_recomendaciones(
  p_access_token text,
  p_limite integer default 8
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_identidad jsonb;
  v_consentimiento public.consentimiento_clientes%rowtype;
  v_customer_id bigint;
  v_guest_id text;
  v_limite integer := greatest(1, least(coalesce(p_limite, 8), 24));
  v_tipos text[] := array[]::text[];
  v_items jsonb := '[]'::jsonb;
  v_intereses jsonb := '[]'::jsonb;
  v_vistos jsonb := '[]'::jsonb;
  v_vistos_ids bigint[] := array[]::bigint[];
begin
  v_validacion := public.bb_validar_token_sesion(p_access_token);
  if not coalesce((v_validacion->>'valid')::boolean, false) then
    return jsonb_build_object(
      'ok', false,
      'error', coalesce(v_validacion->>'reason', 'TOKEN_INVALIDO'),
      'modo', 'general',
      'items', v_items,
      'intereses', v_intereses,
      'vistos', v_vistos
    );
  end if;

  v_identidad := public.bb_identidad_actual(v_validacion);
  v_customer_id := (v_identidad->>'customer_id')::bigint;
  v_guest_id := v_identidad->>'guest_id';

  if v_customer_id is not null then
    select * into v_consentimiento from public.consentimiento_clientes
    where customer_id = v_customer_id limit 1;
  else
    select * into v_consentimiento from public.consentimiento_clientes
    where guest_id = v_guest_id limit 1;
  end if;

  if coalesce(v_consentimiento.estado, 'pendiente') = 'aceptado' then
    if coalesce((v_consentimiento.finalidades->>'rec_navegacion')::boolean, false) then
      v_tipos := array_append(v_tipos, 'VISTA', 'CATEGORIA');
    end if;
    if coalesce((v_consentimiento.finalidades->>'rec_busquedas')::boolean, false) then
      v_tipos := array_append(v_tipos, 'BUSQUEDA');
    end if;
    if coalesce((v_consentimiento.finalidades->>'rec_carrito_compras')::boolean, false) then
      v_tipos := array_append(v_tipos, 'CARRITO');
    end if;
  end if;

  if array_length(v_tipos, 1) is null then
    -- Modo general: nunca usa historial individual.
    select coalesce(jsonb_agg(item order by orden), '[]'::jsonb)
      into v_items
    from (
      select jsonb_build_object(
               'id_producto', p.id,
               'motivo', 'Popular en Byte Bay',
               'puntaje', coalesce(p.calificacion, 0)
             ) as item,
             row_number() over (order by coalesce(p.calificacion, 0) desc, p.id desc) as orden
      from public.catalogo_productos p
      order by coalesce(p.calificacion, 0) desc, p.id desc
      limit v_limite
    ) q;

    return jsonb_build_object(
      'ok', true,
      'modo', 'general',
      'items', v_items,
      'intereses', v_intereses,
      'vistos', v_vistos,
      'finalidades', coalesce(v_consentimiento.finalidades, '{}'::jsonb)
    );
  end if;

  select coalesce(array_agg(distinct id_producto), array[]::bigint[])
    into v_vistos_ids
  from public.recomendacion_eventos
  where id_producto is not null
    and tipo = any(v_tipos)
    and creado_en > now() - interval '180 days'
    and (
      (v_customer_id is not null and customer_id = v_customer_id)
      or (v_customer_id is null and guest_id = v_guest_id)
    );

  select coalesce(jsonb_agg(jsonb_build_object('id_producto', id_producto) order by creado_en desc), '[]'::jsonb)
    into v_vistos
  from (
    select distinct on (id_producto) id_producto, creado_en
    from public.recomendacion_eventos
    where id_producto is not null
      and tipo = any(v_tipos)
      and creado_en > now() - interval '180 days'
      and (
        (v_customer_id is not null and customer_id = v_customer_id)
        or (v_customer_id is null and guest_id = v_guest_id)
      )
    order by id_producto, creado_en desc
    limit 8
  ) q;

  select coalesce(jsonb_agg(jsonb_build_object('categoria', categoria, 'peso', total) order by total desc), '[]'::jsonb)
    into v_intereses
  from (
    select categoria, count(*)::integer as total
    from public.recomendacion_eventos
    where categoria is not null
      and tipo = any(v_tipos)
      and creado_en > now() - interval '180 days'
      and (
        (v_customer_id is not null and customer_id = v_customer_id)
        or (v_customer_id is null and guest_id = v_guest_id)
      )
    group by categoria
    order by total desc
    limit 8
  ) q;

  with intereses as (
    select categoria, count(*)::integer as total
    from public.recomendacion_eventos
    where categoria is not null
      and tipo = any(v_tipos)
      and creado_en > now() - interval '180 days'
      and (
        (v_customer_id is not null and customer_id = v_customer_id)
        or (v_customer_id is null and guest_id = v_guest_id)
      )
    group by categoria
    order by total desc
    limit 4
  )
  select coalesce(jsonb_agg(item order by orden), '[]'::jsonb)
    into v_items
  from (
    select jsonb_build_object(
             'id_producto', p.id,
             'motivo', case
               when i.categoria is not null then 'Porque viste productos de ' || p.categoria
               when p.marca is not null then 'Porque te interesó ' || p.marca
               else 'Popular en Byte Bay'
             end,
             'puntaje', case when i.categoria is not null then 100 + coalesce(i.total, 0) else coalesce(p.calificacion, 0) end
           ) as item,
           row_number() over (
             order by (i.categoria is not null) desc,
                      coalesce(i.total, 0) desc,
                      coalesce(p.calificacion, 0) desc,
                      p.id desc
           ) as orden
    from public.catalogo_productos p
    left join intereses i on i.categoria = p.categoria
    where not (p.id = any(v_vistos_ids))
    order by (i.categoria is not null) desc,
             coalesce(i.total, 0) desc,
             coalesce(p.calificacion, 0) desc,
             p.id desc
    limit v_limite
  ) q;

  return jsonb_build_object(
    'ok', true,
    'modo', 'personalizado',
    'items', v_items,
    'intereses', v_intereses,
    'vistos', v_vistos,
    'finalidades', coalesce(v_consentimiento.finalidades, '{}'::jsonb)
  );
end;
$function$;

create or replace function public.bb_limpiar_historial(p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_identidad jsonb;
  v_customer_id bigint;
  v_guest_id text;
  v_prev jsonb;
begin
  v_validacion := public.bb_validar_token_sesion(p_access_token);
  if not coalesce((v_validacion->>'valid')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', v_validacion->>'reason');
  end if;

  v_identidad := public.bb_identidad_actual(v_validacion);
  v_customer_id := (v_identidad->>'customer_id')::bigint;
  v_guest_id := v_identidad->>'guest_id';

  select coalesce(jsonb_agg(jsonb_build_object('categoria', categoria, 'peso', total)), '[]'::jsonb)
    into v_prev
  from (
    select categoria, count(*)::integer as total
    from public.recomendacion_eventos
    where categoria is not null
      and (
        (v_customer_id is not null and customer_id = v_customer_id)
        or (v_customer_id is null and guest_id = v_guest_id)
      )
    group by categoria
  ) q;

  if v_customer_id is not null then
    delete from public.recomendacion_eventos where customer_id = v_customer_id;
    delete from public.recomendacion_perfiles where customer_id = v_customer_id;
  else
    delete from public.recomendacion_eventos where guest_id = v_guest_id;
    delete from public.recomendacion_perfiles where guest_id = v_guest_id;
  end if;

  perform public.bb_audit_insert(
    gen_random_uuid(),
    v_customer_id,
    (v_identidad->>'session_id')::uuid,
    'HISTORIAL_LIMPIADO',
    jsonb_build_object('intereses', v_prev),
    jsonb_build_object('intereses', '[]'::jsonb),
    null, 'v2.1-2026', 'MENU_CONFIGURACION', 'SUCCESS'
  );

  return jsonb_build_object('ok', true, 'intereses', '[]'::jsonb);
end;
$function$;

-- ----------------------------------------------------------------------------
-- 12) Preferencias y comprobante
-- ----------------------------------------------------------------------------
create or replace function public.bb_sincronizar_preferencias(
  p_access_token text,
  p_preferencias jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_identidad jsonb;
  v_customer_id bigint;
begin
  v_validacion := public.bb_validar_token_sesion(p_access_token);
  if not coalesce((v_validacion->>'valid')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', v_validacion->>'reason');
  end if;

  v_identidad := public.bb_identidad_actual(v_validacion);
  v_customer_id := (v_identidad->>'customer_id')::bigint;

  if v_customer_id is null then
    return jsonb_build_object('ok', false, 'error', 'CUENTA_REQUERIDA');
  end if;

  insert into public.preferencias_clientes (customer_id, preferencias, actualizado_en)
  values (v_customer_id, coalesce(p_preferencias, '{}'::jsonb), now())
  on conflict (customer_id) do update
    set preferencias = excluded.preferencias,
        actualizado_en = now();

  -- No se toca consentimiento_clientes: sincronizar preferencias jamás activa
  -- la personalización ni el algoritmo de recomendaciones.
  return jsonb_build_object('ok', true);
end;
$function$;

create or replace function public.bb_comprobante_consentimiento(p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_validacion jsonb;
  v_identidad jsonb;
  v_consentimiento jsonb;
  v_eventos jsonb;
  v_customer_id bigint;
  v_guest_id text;
begin
  v_validacion := public.bb_validar_token_sesion(p_access_token);
  if not coalesce((v_validacion->>'valid')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', v_validacion->>'reason');
  end if;

  v_consentimiento := public.bb_obtener_consentimiento(p_access_token, false, 'API_BACKEND');
  v_identidad := public.bb_identidad_actual(v_validacion);
  v_customer_id := (v_identidad->>'customer_id')::bigint;
  v_guest_id := v_identidad->>'guest_id';

  select coalesce(jsonb_agg(jsonb_build_object(
           'operation_id', operation_id,
           'event_type', event_type,
           'created_at', created_at,
           'previous_state', previous_state,
           'new_state', new_state,
           'consent_purposes', consent_purposes,
           'privacy_notice_version', privacy_notice_version,
           'action_medium', action_medium,
           'processing_result', processing_result,
           'integrity_hash', integrity_hash
         ) order by created_at desc), '[]'::jsonb)
    into v_eventos
  from (
    select *
    from public.audit_consent_logs
    where (v_customer_id is not null and customer_id = v_customer_id)
       or (v_customer_id is null and customer_id is null and token_session_id in (
            select id from public.sesiones_tokens where guest_id = v_guest_id
          ))
    order by created_at desc
    limit 100
  ) q;

  return jsonb_build_object(
    'ok', true,
    'comprobante', jsonb_build_object(
      'consentimiento', v_consentimiento,
      'eventos', v_eventos,
      'generado_en', now(),
      'aviso_version', 'v2.1-2026',
      'entidad', 'Byte Bay'
    ),
    'consentimiento', v_consentimiento,
    'eventos', v_eventos,
    'generado_en', now(),
    'aviso_version', 'v2.1-2026',
    'entidad', 'Byte Bay'
  );
end;
$function$;

-- ----------------------------------------------------------------------------
-- 13) Permisos RPC
-- ----------------------------------------------------------------------------
revoke all on function public.bb_base64url(text) from public, anon, authenticated;
revoke all on function public.bb_base64url_bytes(bytea) from public, anon, authenticated;
revoke all on function public.bb_jwt_emitir(uuid,bigint,text,uuid,bigint,bigint) from public, anon, authenticated;
revoke all on function public.bb_jwt_verificar(text) from public, anon, authenticated;
revoke all on function public.bb_audit_hash() from public, anon, authenticated;
revoke all on function public.bb_audit_solo_insercion() from public, anon, authenticated;
revoke all on function public.bb_audit_insert(uuid,bigint,uuid,text,jsonb,jsonb,jsonb,text,text,text) from public, anon, authenticated;
revoke all on function public.bb_validar_token_sesion(text) from public, anon, authenticated;
revoke all on function public.bb_identidad_actual(jsonb) from public, anon, authenticated;
revoke all on function public.bb_crear_sesion(bigint,text,text,text) from public, anon, authenticated;

revoke all on function public.bb_emitir_sesion_invitado(text,text) from public;
revoke all on function public.bb_iniciar_sesion_cliente(text,text,text,text) from public;
revoke all on function public.bb_emitir_sesion_google(text,text) from public;
revoke all on function public.bb_registrar_cuenta_cliente(text,text,text,text,text) from public;
revoke all on function public.bb_refrescar_sesion(text) from public;
revoke all on function public.bb_validar_sesion(text) from public;
revoke all on function public.bb_revocar_sesion_actual(text) from public;
revoke all on function public.bb_revocar_sesiones_cliente(text) from public;
revoke all on function public.bb_obtener_consentimiento(text,boolean,text) from public;
revoke all on function public.bb_guardar_consentimiento(text,uuid,text,text,jsonb,text,text) from public;
revoke all on function public.bb_registrar_evento_recomendacion(text,text,bigint,text,text) from public;
revoke all on function public.bb_obtener_recomendaciones(text,integer) from public;
revoke all on function public.bb_limpiar_historial(text) from public;
revoke all on function public.bb_sincronizar_preferencias(text,jsonb) from public;
revoke all on function public.bb_comprobante_consentimiento(text) from public;

grant execute on function public.bb_emitir_sesion_invitado(text,text) to anon, authenticated;
grant execute on function public.bb_iniciar_sesion_cliente(text,text,text,text) to anon, authenticated;
grant execute on function public.bb_emitir_sesion_google(text,text) to authenticated;
grant execute on function public.bb_registrar_cuenta_cliente(text,text,text,text,text) to anon, authenticated;
grant execute on function public.bb_refrescar_sesion(text) to anon, authenticated;
grant execute on function public.bb_validar_sesion(text) to anon, authenticated;
grant execute on function public.bb_revocar_sesion_actual(text) to anon, authenticated;
grant execute on function public.bb_revocar_sesiones_cliente(text) to anon, authenticated;
grant execute on function public.bb_obtener_consentimiento(text,boolean,text) to anon, authenticated;
grant execute on function public.bb_guardar_consentimiento(text,uuid,text,text,jsonb,text,text) to anon, authenticated;
grant execute on function public.bb_registrar_evento_recomendacion(text,text,bigint,text,text) to anon, authenticated;
grant execute on function public.bb_obtener_recomendaciones(text,integer) to anon, authenticated;
grant execute on function public.bb_limpiar_historial(text) to anon, authenticated;
grant execute on function public.bb_sincronizar_preferencias(text,jsonb) to anon, authenticated;
grant execute on function public.bb_comprobante_consentimiento(text) to anon, authenticated;

commit;

-- ============================================================================
-- VERIFICACIÓN RÁPIDA (ejecutar manualmente después del commit)
-- ============================================================================
-- select event_type, action_medium, processing_result, created_at, integrity_hash
-- from public.audit_consent_logs order by id desc limit 20;
--
-- select * from public.consentimiento_clientes;
-- select id, customer_id, guest_id, role, expires_at, revoked_at from public.sesiones_tokens;
--
-- Prueba de inmutabilidad (debe fallar):
-- update public.audit_consent_logs set processing_result = 'ALTERADO' where id = 1;
-- delete from public.audit_consent_logs where id = 1;
-- truncate public.audit_consent_logs;
