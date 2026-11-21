-- ============================================================
-- BYTE BAY · Endurecimiento de seguridad
-- Aplica sobre el proyecto Supabase inwugycvtaaceugvtfpv
-- Idempotente: se puede ejecutar varias veces sin romper nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1) CRÍTICO: escalamiento de privilegios en asignar_personal
--    Antes: cualquier usuario (incluso anon) podía asignarse rol
--    'jefe'. Ahora exige que quien llama sea jefe activo.
-- ------------------------------------------------------------
create or replace function public.asignar_personal(
  p_id_usuario uuid, p_nombres text, p_apellidos text, p_rol text
) returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not exists (
    select 1 from public.personal
    where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then
    raise exception 'Solo el jefe puede gestionar el personal';
  end if;
  if p_rol not in ('jefe','empleado') then
    raise exception 'Rol no válido';
  end if;
  insert into public.personal(id_usuario,nombres,apellidos,rol)
  values(p_id_usuario,p_nombres,p_apellidos,p_rol)
  on conflict(id_usuario) do update
    set nombres=excluded.nombres, apellidos=excluded.apellidos,
        rol=excluded.rol, activo=true, actualizado_en=now();
end;
$function$;

revoke all on function public.asignar_personal(uuid,text,text,text) from public, anon;
grant execute on function public.asignar_personal(uuid,text,text,text) to authenticated, service_role;

-- ------------------------------------------------------------
-- 2) Login de clientes con bloqueo por fuerza bruta
--    Usa las columnas login_failed_attempts / lockout_until que
--    ya existían pero no se usaban. Mensaje genérico para no
--    revelar si el correo existe.
-- ------------------------------------------------------------
create or replace function public.iniciar_sesion_cliente(
  p_correo text, p_contrasena text
) returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_cuenta public.cuentas_clientes%rowtype;
  v_correo text := lower(trim(coalesce(p_correo,'')));
  v_max_intentos constant integer := 5;
  v_bloqueo constant interval := interval '15 minutes';
  v_intentos integer;
begin
  select * into v_cuenta from public.cuentas_clientes
  where correo = v_correo and activa
  limit 1;

  if not found then
    raise exception 'Correo o contraseña incorrectos';
  end if;

  if v_cuenta.lockout_until is not null and v_cuenta.lockout_until > now() then
    raise exception 'Demasiados intentos fallidos. Intenta de nuevo en % minutos.',
      greatest(1, ceil(extract(epoch from (v_cuenta.lockout_until - now())) / 60)::integer);
  end if;

  if v_cuenta.contrasena_hash is not null
     and v_cuenta.contrasena_hash = crypt(coalesce(p_contrasena,''), v_cuenta.contrasena_hash) then
    update public.cuentas_clientes
      set ultimo_acceso_en = now(), login_failed_attempts = 0, lockout_until = null
      where id = v_cuenta.id;
    return jsonb_build_object(
      'id', v_cuenta.id,
      'correo', v_cuenta.correo,
      'nombres', v_cuenta.nombres,
      'apellidos', v_cuenta.apellidos,
      'nombre_usuario', v_cuenta.nombre_usuario
    );
  end if;

  v_intentos := coalesce(v_cuenta.login_failed_attempts, 0) + 1;
  update public.cuentas_clientes
    set login_failed_attempts = v_intentos,
        lockout_until = case when v_intentos >= v_max_intentos then now() + v_bloqueo else lockout_until end
    where id = v_cuenta.id;

  raise exception 'Correo o contraseña incorrectos';
end;
$function$;

revoke all on function public.iniciar_sesion_cliente(text,text) from public;
grant execute on function public.iniciar_sesion_cliente(text,text) to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 3) Vistas que ignoraban el RLS
--    Las vistas se ejecutan con permisos del dueño (postgres),
--    así que saltaban las políticas. reporte_inventario_lotes
--    exponía proveedores y lotes a cualquiera con la clave
--    pública.
-- ------------------------------------------------------------
alter view public.catalogo_productos set (security_invoker = true);
alter view public.reporte_inventario_lotes set (security_invoker = true);

-- comentarios_publicos_productos se mantiene con permisos del dueño
-- a propósito: solo expone alias del autor, calificación y texto de
-- comentarios ya publicados, y así no hay que abrir cuentas_clientes.

-- ------------------------------------------------------------
-- 4) Permisos mínimos: anon ya no puede escribir nada
--    El navegador solo lee catalogo_productos y los comentarios
--    públicos; todo lo demás pasa por RPC o Edge Functions.
-- ------------------------------------------------------------
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select on public.catalogo_productos             to anon, authenticated;
grant select on public.comentarios_publicos_productos to anon, authenticated;
grant select on public.categorias                     to anon, authenticated;
grant select on public.marcas                         to anon, authenticated;
grant select on public.productos                      to anon, authenticated;
grant select on public.ofertas_producto               to anon, authenticated;
grant select on public.comentarios_productos          to anon, authenticated;

-- authenticated (clientes con sesión) tampoco escribe directo
revoke insert, update, delete, truncate on all tables in schema public from authenticated;
grant select, update on public.perfiles               to authenticated;
grant select, insert, update, delete on public.preferencias_notificacion to authenticated;

-- Que las tablas futuras nazcan sin permisos para anon
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- ------------------------------------------------------------
-- 5) Políticas de escritura peligrosas en pedidos
--    Permitían insertar pedidos y líneas de pedido arbitrarias
--    sin comprobar propiedad. Ya no se usan: el checkout va por
--    crear_pedido_yape (SECURITY DEFINER).
-- ------------------------------------------------------------
drop policy if exists "Crear pedidos propios" on public.pedidos;
drop policy if exists "Crear detalle de pedido propio" on public.detalles_pedido;

-- ------------------------------------------------------------
-- 6) Checkout: validaciones que faltaban
--    - correo con formato válido
--    - cantidad entre 1 y 20 por línea
--    - código Yape no reutilizable (si viene informado)
-- ------------------------------------------------------------
create or replace function public.crear_pedido_yape(
  p_articulos jsonb, p_cliente jsonb, p_codigo_operacion_yape text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_pedido uuid;
  v_codigo text;
  v_item jsonb;
  v_producto record;
  v_cantidad integer;
  v_subtotal numeric(12,2) := 0;
  v_correo text := lower(trim(coalesce(p_cliente->>'correo','')));
  v_nombre text := trim(coalesce(p_cliente->>'nombre_completo',''));
  v_direccion text := trim(coalesce(p_cliente->>'direccion',''));
  v_telefono text := trim(coalesce(p_cliente->>'telefono',''));
  v_yape text := upper(trim(coalesce(p_codigo_operacion_yape,'')));
begin
  if jsonb_typeof(p_articulos) <> 'array' or jsonb_array_length(p_articulos) = 0 then
    raise exception 'Pedido vacío';
  end if;
  if v_correo !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Correo no válido';
  end if;
  if length(v_nombre) < 3 then
    raise exception 'Nombre del cliente no válido';
  end if;
  if v_yape <> '' and exists (
    select 1 from public.pedidos where codigo_operacion_yape = v_yape
  ) then
    raise exception 'Ese código de operación Yape ya fue registrado';
  end if;

  for v_item in select value from jsonb_array_elements(p_articulos) loop
    v_cantidad := (v_item->>'cantidad')::integer;
    select id,codigo,nombre,precio,existencias into v_producto
      from public.productos
     where id = (v_item->>'id_producto')::bigint and activo
     for update;
    if not found or v_cantidad is null or v_cantidad <= 0 or v_cantidad > 20 then
      raise exception 'Producto o cantidad no válidos';
    end if;
    if v_producto.existencias < v_cantidad then
      raise exception 'Existencias insuficientes para %', v_producto.nombre;
    end if;
    v_subtotal := v_subtotal + v_producto.precio * v_cantidad;
  end loop;

  v_codigo := 'YP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  insert into public.pedidos(
    correo_cliente, metodo_pago, subtotal, envio, descuento, total,
    direccion_envio, notas, estado, estado_pago,
    codigo_operacion_yape, codigo_verificacion
  ) values (
    v_correo,'yape',v_subtotal,0,0,v_subtotal,
    jsonb_build_object('nombre',v_nombre,'direccion',v_direccion,'telefono',v_telefono,'documento',coalesce(p_cliente->>'documento','')),
    'Pago Yape pendiente de verificación','pendiente','pendiente',
    nullif(v_yape,''), v_codigo
  ) returning id into v_pedido;

  for v_item in select value from jsonb_array_elements(p_articulos) loop
    v_cantidad := (v_item->>'cantidad')::integer;
    select id,codigo,nombre,precio into v_producto
      from public.productos where id = (v_item->>'id_producto')::bigint;
    insert into public.detalles_pedido(
      id_pedido,id_producto,nombre_producto,codigo_producto,cantidad,precio_unitario
    ) values (
      v_pedido,v_producto.id,v_producto.nombre,v_producto.codigo,v_cantidad,v_producto.precio
    );
    update public.productos
       set existencias = existencias - v_cantidad, actualizado_en = now()
     where id = v_producto.id;
    insert into public.movimientos_inventario(id_producto,id_pedido,cantidad,motivo,nota)
    values(v_producto.id,v_pedido,-v_cantidad,'venta','Pedido Yape: '||v_codigo);
  end loop;

  return jsonb_build_object(
    'id_pedido',v_pedido,
    'codigo_verificacion',v_codigo,
    'estado_pago','pendiente'
  );
end;
$function$;

revoke all on function public.crear_pedido_yape(jsonb,jsonb,text) from public;
grant execute on function public.crear_pedido_yape(jsonb,jsonb,text) to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 7) Índices de rendimiento para las consultas más usadas
-- ------------------------------------------------------------
create index if not exists idx_pedidos_correo_cliente on public.pedidos (lower(correo_cliente));
create index if not exists idx_pedidos_codigo_yape    on public.pedidos (codigo_operacion_yape);
create index if not exists idx_detalles_pedido_pedido on public.detalles_pedido (id_pedido);
create index if not exists idx_productos_activo       on public.productos (activo) where activo;
create index if not exists idx_movimientos_fecha      on public.movimientos_inventario (creado_en desc);
