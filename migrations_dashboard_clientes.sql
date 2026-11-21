-- ============================================================
-- BYTE BAY · Migración: dashboard operativo, clientes y movimientos
-- Fecha: 2026-11-06
-- Aplicar sobre Supabase (proyecto inwugycvtaaceugvtfpv)
-- Incluye:
--   1. Corrección de triggers/funciones heredadas que rompían pedidos
--   2. Dashboard con KPIs y series por fecha
--   3. Gestión de clientes (listar, resumir, activar/inactivar/anular)
--   4. Movimientos de inventario con filtros y resumen
--   5. Ofertas automáticas visibles para todo el personal
--   6. Endurecimiento de permisos
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. CORRECCIONES CRÍTICAS DE FUNCIONALIDAD
-- ------------------------------------------------------------

-- El trigger heredado usaba columnas en inglés que no existen en pedidos.
-- Se reescribe con el esquema real en español y se enlaza por correo.
create or replace function public.assign_order_customer_account()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.id_cuenta_cliente is null and new.correo_cliente is not null then
    select c.id into new.id_cuenta_cliente
    from public.cuentas_clientes c
    where lower(c.correo) = lower(new.correo_cliente)
    limit 1;
  end if;
  return new;
end;
$$;

-- El trigger heredado escribía en una vista en inglés y leía new.status.
-- El historial correcto ya lo cubre pedidos_registrar_historial_estado.
drop trigger if exists orders_status_history on public.pedidos;
drop function if exists public.record_order_status_change();

-- La sincronización con Google usaba la columna inexistente "activo".
-- Ahora respeta el estado de la cuenta y no reactiva cuentas anuladas.
create or replace function public.sincronizar_cuenta_cliente_google()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id_usuario uuid := auth.uid();
  v_correo text;
  v_meta jsonb;
  v_cuenta public.cuentas_clientes%rowtype;
begin
  if v_id_usuario is null then
    raise exception 'Debes iniciar sesión con Google';
  end if;
  select lower(email), raw_user_meta_data
    into v_correo, v_meta
    from auth.users
   where id = v_id_usuario;
  if v_correo is null then
    raise exception 'Google no devolvió un correo válido';
  end if;

  insert into public.cuentas_clientes(
    id_usuario, correo, nombres, apellidos, nombre_usuario, activa, estado_cuenta
  )
  values (
    v_id_usuario, v_correo,
    nullif(v_meta->>'given_name', ''),
    nullif(v_meta->>'family_name', ''),
    nullif(coalesce(v_meta->>'preferred_username', v_meta->>'name'), ''),
    true, 'activo'
  )
  on conflict (correo) do update set
    id_usuario = excluded.id_usuario,
    nombres = coalesce(public.cuentas_clientes.nombres, excluded.nombres),
    apellidos = coalesce(public.cuentas_clientes.apellidos, excluded.apellidos),
    nombre_usuario = coalesce(public.cuentas_clientes.nombre_usuario, excluded.nombre_usuario),
    actualizado_en = now()
  where public.cuentas_clientes.estado_cuenta = 'activo'
  returning * into v_cuenta;

  if v_cuenta.id is null then
    raise exception 'La cuenta está inactiva o anulada. Contacta a soporte.';
  end if;

  return jsonb_build_object(
    'id', v_cuenta.id,
    'correo', v_cuenta.correo,
    'nombres', v_cuenta.nombres,
    'apellidos', v_cuenta.apellidos,
    'nombre_usuario', v_cuenta.nombre_usuario
  );
end;
$$;

-- Registro de clientes: estado explícito y mensaje claro ante correo duplicado.
create or replace function public.registrar_cuenta_cliente(
  p_correo text,
  p_nombres text default null,
  p_apellidos text default null,
  p_nombre_usuario text default null,
  p_contrasena text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id bigint;
  v_correo text := lower(trim(p_correo));
begin
  if v_correo !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Correo no válido';
  end if;
  if length(coalesce(p_contrasena, '')) < 8 then
    raise exception 'La contraseña debe tener al menos 8 caracteres';
  end if;

  insert into public.cuentas_clientes(
    correo, nombres, apellidos, nombre_usuario, contrasena_hash, activa, estado_cuenta
  )
  values (
    v_correo,
    nullif(trim(p_nombres), ''),
    nullif(trim(p_apellidos), ''),
    nullif(trim(p_nombre_usuario), ''),
    crypt(p_contrasena, gen_salt('bf', 10)),
    true,
    'activo'
  )
  returning id into v_id;
  return v_id;
exception
  when unique_violation then
    raise exception 'Este correo ya está registrado';
end;
$$;

-- ------------------------------------------------------------
-- 2. COLUMNAS E ÍNDICES DE SOPORTE
-- ------------------------------------------------------------
alter table public.cuentas_clientes
  add column if not exists motivo_estado text;

alter table public.notificaciones_ofertas
  add column if not exists id_oferta bigint references public.ofertas_producto(id) on delete set null;

create index if not exists notificaciones_ofertas_id_oferta_idx
  on public.notificaciones_ofertas(id_oferta);
create index if not exists cuentas_clientes_creado_en_idx
  on public.cuentas_clientes(creado_en desc);
create index if not exists pedidos_correo_cliente_idx
  on public.pedidos(lower(correo_cliente));
create index if not exists pedidos_creado_en_idx
  on public.pedidos(creado_en desc);
create index if not exists movimientos_inventario_creado_en_idx
  on public.movimientos_inventario(creado_en desc);

-- ------------------------------------------------------------
-- 3. AVISOS AUTOMÁTICOS DE OFERTAS
-- ------------------------------------------------------------
-- El aviso se crea, actualiza o elimina según el estado real de la oferta.
-- Se enlaza por id_oferta para evitar duplicados.
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
  v_titulo text;
  v_mensaje text;
begin
  if not new.activa or not (new.super_oferta or new.liquidacion_stock) then
    delete from public.notificaciones_ofertas
     where id_oferta = new.id
       and tipo_emision = 'automatica_ia_trigger';
    return new;
  end if;

  select p.nombre, p.precio
    into v_producto, v_regular
    from public.productos p
   where p.id = new.id_producto;

  v_precio := new.precio_oferta;
  v_descuento := case
    when v_regular > 0 then greatest(0, least(100, round((1 - v_precio / v_regular) * 100, 2)))
    else null
  end;
  v_titulo := case when new.super_oferta then 'Super oferta: ' else 'Liquidación: ' end
              || coalesce(v_producto, 'Producto');
  v_mensaje := 'Oferta especial disponible por tiempo limitado: ' || new.nombre;

  update public.notificaciones_ofertas
     set titulo = v_titulo,
         mensaje = v_mensaje,
         producto_id = new.id_producto,
         descuento_porcentaje = v_descuento,
         fecha_envio = new.inicia_en,
         fecha_limite = new.termina_en
   where id_oferta = new.id
     and tipo_emision = 'automatica_ia_trigger';

  if not found then
    insert into public.notificaciones_ofertas(
      titulo, mensaje, tipo_emision, producto_id, id_oferta,
      descuento_porcentaje, destinatarios, fecha_envio, fecha_limite
    )
    values (
      v_titulo, v_mensaje, 'automatica_ia_trigger', new.id_producto, new.id,
      v_descuento, 'todos', new.inicia_en, new.termina_en
    );
  end if;

  return new;
end;
$$;

-- Listado enriquecido de ofertas para el panel.
drop function if exists public.listar_ofertas_personal();
create function public.listar_ofertas_personal()
returns table(
  id bigint,
  id_producto bigint,
  producto text,
  precio_regular numeric,
  precio_oferta numeric,
  nombre text,
  inicia_en timestamptz,
  termina_en timestamptz,
  activa boolean,
  super_oferta boolean,
  liquidacion_stock boolean,
  estado text,
  aviso_generado boolean
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    o.id,
    o.id_producto,
    p.nombre,
    p.precio,
    o.precio_oferta,
    o.nombre,
    o.inicia_en,
    o.termina_en,
    o.activa,
    o.super_oferta,
    o.liquidacion_stock,
    case
      when not o.activa then 'inactiva'
      when o.inicia_en > now() then 'programada'
      when o.termina_en is not null and o.termina_en <= now() then 'vencida'
      else 'activa'
    end as estado,
    exists (
      select 1 from public.notificaciones_ofertas n
       where n.id_oferta = o.id
         and n.tipo_emision = 'automatica_ia_trigger'
    ) as aviso_generado
  from public.ofertas_producto o
  join public.productos p on p.id = o.id_producto
  where exists (
    select 1 from public.personal pe
     where pe.id_usuario = auth.uid() and pe.activo
  )
  order by o.creado_en desc;
$$;

-- Avisos automáticos visibles para todo el personal activo (solo lectura).
create or replace function public.listar_ofertas_automaticas_personal(p_limite integer default 200)
returns table(
  id bigint,
  id_oferta bigint,
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
     where id_usuario = auth.uid() and activo
  ) then
    raise exception 'Solo el personal activo puede consultar las ofertas automáticas';
  end if;

  return query
  select
    n.id, n.id_oferta, n.producto_id,
    coalesce(p.nombre, 'Producto eliminado'),
    n.titulo, n.mensaje, n.descuento_porcentaje,
    n.fecha_envio, n.fecha_limite, n.creado_en,
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

-- Regenera avisos para ofertas especiales existentes y limpia los obsoletos.
create or replace function public.regenerar_avisos_ofertas_jefe()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_oferta record;
  v_producto text;
  v_regular numeric;
  v_descuento numeric(5,2);
  v_eliminados integer := 0;
  v_creados integer := 0;
begin
  if not exists (
    select 1 from public.personal
     where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then
    raise exception 'Solo el jefe puede regenerar avisos automáticos';
  end if;

  delete from public.notificaciones_ofertas n
   where n.tipo_emision = 'automatica_ia_trigger'
     and n.id_oferta is not null
     and exists (
       select 1 from public.ofertas_producto o
        where o.id = n.id_oferta
          and (not o.activa or not (o.super_oferta or o.liquidacion_stock))
     );
  get diagnostics v_eliminados = row_count;

  for v_oferta in
    select o.*
      from public.ofertas_producto o
     where o.activa
       and (o.super_oferta or o.liquidacion_stock)
       and not exists (
         select 1 from public.notificaciones_ofertas n
          where n.id_oferta = o.id
            and n.tipo_emision = 'automatica_ia_trigger'
       )
  loop
    select p.nombre, p.precio into v_producto, v_regular
      from public.productos p where p.id = v_oferta.id_producto;

    v_descuento := case
      when v_regular > 0 then greatest(0, least(100, round((1 - v_oferta.precio_oferta / v_regular) * 100, 2)))
      else null
    end;

    insert into public.notificaciones_ofertas(
      titulo, mensaje, tipo_emision, producto_id, id_oferta,
      descuento_porcentaje, destinatarios, fecha_envio, fecha_limite
    )
    values (
      case when v_oferta.super_oferta then 'Super oferta: ' else 'Liquidación: ' end
        || coalesce(v_producto, 'Producto'),
      'Oferta especial disponible por tiempo limitado: ' || v_oferta.nombre,
      'automatica_ia_trigger', v_oferta.id_producto, v_oferta.id,
      v_descuento, 'todos', v_oferta.inicia_en, v_oferta.termina_en
    );
    v_creados := v_creados + 1;
  end loop;

  return jsonb_build_object('eliminados', v_eliminados, 'creados', v_creados);
end;
$$;

-- ------------------------------------------------------------
-- 4. DASHBOARD OPERATIVO
-- ------------------------------------------------------------
create or replace function public.dashboard_operativo_personal(
  p_desde date default null,
  p_hasta date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_desde date := coalesce(p_desde, current_date - 29);
  v_hasta date := coalesce(p_hasta, current_date);
  v_es_jefe boolean;
  v_kpis jsonb;
  v_ventas jsonb;
  v_registros jsonb;
  v_top jsonb;
  v_estados jsonb;
  v_avisos jsonb;
begin
  if not exists (
    select 1 from public.personal
     where id_usuario = auth.uid() and activo
  ) then
    raise exception 'Solo el personal activo puede consultar el panel';
  end if;
  if v_desde > v_hasta then
    raise exception 'La fecha inicial no puede ser mayor que la final';
  end if;
  if v_hasta - v_desde > 366 then
    raise exception 'El rango máximo de consulta es de 366 días';
  end if;

  v_es_jefe := exists (
    select 1 from public.personal
     where id_usuario = auth.uid() and activo and rol = 'jefe'
  );

  select jsonb_build_object(
    'ventas_confirmadas', (
      select count(*) from public.pedidos
       where estado_pago = 'aprobado'
         and creado_en >= v_desde and creado_en < (v_hasta + 1)
    ),
    'ingresos_confirmados', case when v_es_jefe then (
      select coalesce(sum(total), 0) from public.pedidos
       where estado_pago = 'aprobado'
         and creado_en >= v_desde and creado_en < (v_hasta + 1)
    ) else null end,
    'ticket_promedio', case when v_es_jefe then (
      select case when count(*) > 0 then round(sum(total) / count(*), 2) else 0 end
        from public.pedidos
       where estado_pago = 'aprobado'
         and creado_en >= v_desde and creado_en < (v_hasta + 1)
    ) else null end,
    'pedidos_pendientes', (
      select count(*) from public.pedidos
       where estado_pago = 'pendiente'
         and creado_en >= v_desde and creado_en < (v_hasta + 1)
    ),
    'pedidos_totales', (
      select count(*) from public.pedidos
       where creado_en >= v_desde and creado_en < (v_hasta + 1)
    ),
    'clientes_nuevos', (
      select count(*) from public.cuentas_clientes
       where creado_en >= v_desde and creado_en < (v_hasta + 1)
    ),
    'clientes_activos', (
      select count(*) from public.cuentas_clientes where estado_cuenta = 'activo'
    ),
    'clientes_anulados', (
      select count(*) from public.cuentas_clientes where estado_cuenta = 'anulado'
    ),
    'ofertas_activas', (
      select count(*) from public.ofertas_producto
       where activa and inicia_en <= now()
         and (termina_en is null or termina_en > now())
    ),
    'avisos_automaticos', (
      select count(*) from public.notificaciones_ofertas
       where tipo_emision = 'automatica_ia_trigger'
    ),
    'productos_bajo_stock', (
      select count(*) from public.productos
       where activo and existencias <= 5
    ),
    'reclamos_pendientes', (
      select count(*) from public.libro_reclamaciones where estado = 'pendiente'
    )
  ) into v_kpis;

  select coalesce(jsonb_agg(jsonb_build_object(
      'fecha', to_char(d::date, 'YYYY-MM-DD'),
      'pedidos', coalesce(x.pedidos, 0),
      'ingresos', case when v_es_jefe then coalesce(x.ingresos, 0) else null end
    ) order by d), '[]'::jsonb)
    into v_ventas
    from generate_series(v_desde::timestamp, v_hasta::timestamp, interval '1 day') d
    left join (
      select creado_en::date as fecha, count(*) as pedidos, sum(total) as ingresos
        from public.pedidos
       where estado_pago = 'aprobado'
         and creado_en >= v_desde and creado_en < (v_hasta + 1)
       group by 1
    ) x on x.fecha = d::date;

  select coalesce(jsonb_agg(jsonb_build_object(
      'fecha', to_char(d::date, 'YYYY-MM-DD'),
      'clientes', coalesce(x.clientes, 0)
    ) order by d), '[]'::jsonb)
    into v_registros
    from generate_series(v_desde::timestamp, v_hasta::timestamp, interval '1 day') d
    left join (
      select creado_en::date as fecha, count(*) as clientes
        from public.cuentas_clientes
       where creado_en >= v_desde and creado_en < (v_hasta + 1)
       group by 1
    ) x on x.fecha = d::date;

  select coalesce(jsonb_agg(item order by (item->>'unidades')::int desc), '[]'::jsonb)
    into v_top
    from (
      select jsonb_build_object(
        'producto', d.nombre_producto,
        'codigo', d.codigo_producto,
        'unidades', sum(d.cantidad),
        'ingresos', case when v_es_jefe then sum(d.total_linea) else null end
      ) as item
        from public.detalles_pedido d
        join public.pedidos p on p.id = d.id_pedido
       where p.estado_pago = 'aprobado'
         and p.creado_en >= v_desde and p.creado_en < (v_hasta + 1)
       group by d.id_producto, d.nombre_producto, d.codigo_producto
       order by sum(d.cantidad) desc
       limit 5
    ) t;

  select coalesce(jsonb_agg(jsonb_build_object(
      'estado', e.estado,
      'cantidad', coalesce(x.cantidad, 0)
    ) order by e.orden), '[]'::jsonb)
    into v_estados
    from (
      select unnest(enum_range(null::public.estado_pedido))::text as estado,
             row_number() over () as orden
    ) e
    left join (
      select estado::text as estado, count(*) as cantidad
        from public.pedidos
       where creado_en >= v_desde and creado_en < (v_hasta + 1)
       group by 1
    ) x on x.estado = e.estado;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', n.id,
      'id_oferta', n.id_oferta,
      'titulo', n.titulo,
      'producto', coalesce(p.nombre, 'Producto eliminado'),
      'descuento', n.descuento_porcentaje,
      'fecha_envio', n.fecha_envio,
      'fecha_limite', n.fecha_limite,
      'estado', case
        when n.fecha_envio > now() then 'programada'
        when n.fecha_limite is not null and n.fecha_limite <= now() then 'finalizada'
        else 'publicada'
      end
    ) order by n.creado_en desc), '[]'::jsonb)
    into v_avisos
    from (
      select * from public.notificaciones_ofertas
       where tipo_emision = 'automatica_ia_trigger'
       order by creado_en desc
       limit 5
    ) n
    left join public.productos p on p.id = n.producto_id;

  return jsonb_build_object(
    'desde', v_desde,
    'hasta', v_hasta,
    'es_jefe', v_es_jefe,
    'kpis', v_kpis,
    'ventas_por_dia', v_ventas,
    'registros_por_dia', v_registros,
    'top_productos', v_top,
    'estados_pedido', v_estados,
    'ofertas_automaticas', v_avisos
  );
end;
$$;

-- ------------------------------------------------------------
-- 5. GESTIÓN DE CLIENTES
-- ------------------------------------------------------------
create or replace function public.listar_clientes_jefe(
  p_busqueda text default null,
  p_estado text default null,
  p_desde date default null,
  p_hasta date default null,
  p_limite integer default 500
)
returns table(
  id bigint,
  correo text,
  nombres text,
  apellidos text,
  nombre_usuario text,
  estado_cuenta text,
  activa boolean,
  motivo_estado text,
  creado_en timestamptz,
  ultimo_acceso_en timestamptz,
  pedidos_total bigint,
  pedidos_aprobados bigint,
  total_gastado numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not exists (
    select 1 from public.personal
     where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then
    raise exception 'Solo el jefe puede consultar clientes';
  end if;
  if p_estado is not null and p_estado not in ('activo', 'inactivo', 'anulado') then
    raise exception 'Estado de cliente no válido';
  end if;

  return query
  select
    c.id, c.correo, c.nombres, c.apellidos, c.nombre_usuario,
    c.estado_cuenta, c.activa, c.motivo_estado, c.creado_en, c.ultimo_acceso_en,
    coalesce(p.pedidos_total, 0),
    coalesce(p.pedidos_aprobados, 0),
    coalesce(p.total_gastado, 0)
  from public.cuentas_clientes c
  left join (
    select
      coalesce(pd.id_cuenta_cliente, c2.id) as id_cuenta,
      count(*) as pedidos_total,
      count(*) filter (where pd.estado_pago = 'aprobado') as pedidos_aprobados,
      coalesce(sum(pd.total) filter (where pd.estado_pago = 'aprobado'), 0) as total_gastado
    from public.pedidos pd
    left join public.cuentas_clientes c2
      on pd.id_cuenta_cliente is null
     and lower(c2.correo) = lower(pd.correo_cliente)
    group by 1
  ) p on p.id_cuenta = c.id
  where (
      p_busqueda is null or btrim(p_busqueda) = ''
      or c.correo ilike '%' || btrim(p_busqueda) || '%'
      or coalesce(c.nombres, '') ilike '%' || btrim(p_busqueda) || '%'
      or coalesce(c.apellidos, '') ilike '%' || btrim(p_busqueda) || '%'
      or coalesce(c.nombre_usuario, '') ilike '%' || btrim(p_busqueda) || '%'
    )
    and (p_estado is null or c.estado_cuenta = p_estado)
    and (p_desde is null or c.creado_en >= p_desde)
    and (p_hasta is null or c.creado_en < (p_hasta + 1))
  order by c.creado_en desc
  limit least(greatest(coalesce(p_limite, 500), 1), 2000);
end;
$$;

create or replace function public.resumen_clientes_jefe(
  p_desde date default null,
  p_hasta date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal
     where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then
    raise exception 'Solo el jefe puede consultar métricas de clientes';
  end if;
  if p_desde is not null and p_hasta is not null and p_desde > p_hasta then
    raise exception 'La fecha inicial no puede ser mayor que la final';
  end if;

  return jsonb_build_object(
    'total', (select count(*) from public.cuentas_clientes),
    'activos', (select count(*) from public.cuentas_clientes where estado_cuenta = 'activo'),
    'inactivos', (select count(*) from public.cuentas_clientes where estado_cuenta = 'inactivo'),
    'anulados', (select count(*) from public.cuentas_clientes where estado_cuenta = 'anulado'),
    'registrados_hoy', (
      select count(*) from public.cuentas_clientes
       where creado_en >= current_date and creado_en < current_date + 1
    ),
    'registrados_periodo', (
      select count(*) from public.cuentas_clientes
       where (p_desde is null or creado_en >= p_desde)
         and (p_hasta is null or creado_en < (p_hasta + 1))
    ),
    'con_pedidos', (
      select count(*) from public.cuentas_clientes c
       where exists (
         select 1 from public.pedidos p
          where p.id_cuenta_cliente = c.id
             or (p.id_cuenta_cliente is null and lower(p.correo_cliente) = lower(c.correo))
       )
    ),
    'sin_pedidos', (
      select count(*) from public.cuentas_clientes c
       where not exists (
         select 1 from public.pedidos p
          where p.id_cuenta_cliente = c.id
             or (p.id_cuenta_cliente is null and lower(p.correo_cliente) = lower(c.correo))
       )
    ),
    'nuevos_7_dias', (
      select count(*) from public.cuentas_clientes
       where creado_en >= current_date - 6 and creado_en < current_date + 1
    ),
    'total_gastado', (
      select coalesce(sum(total), 0) from public.pedidos where estado_pago = 'aprobado'
    )
  );
end;
$$;

create or replace function public.cambiar_estado_cliente_jefe(
  p_id bigint,
  p_estado text,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_anterior text;
  v_responsable text;
  v_rol text;
begin
  if not exists (
    select 1 from public.personal
     where id_usuario = auth.uid() and activo and rol = 'jefe'
  ) then
    raise exception 'Solo el jefe puede cambiar el estado de un cliente';
  end if;
  if p_estado not in ('activo', 'inactivo', 'anulado') then
    raise exception 'Estado de cliente no válido';
  end if;
  if p_estado = 'anulado' and char_length(btrim(coalesce(p_motivo, ''))) < 5 then
    raise exception 'Indica el motivo de la anulación (mínimo 5 caracteres)';
  end if;

  select estado_cuenta into v_anterior
    from public.cuentas_clientes
   where id = p_id
   for update;
  if not found then
    raise exception 'Cliente no encontrado';
  end if;

  select coalesce(nullif(btrim(pe.nombres || ' ' || coalesce(pe.apellidos, '')), ''), pe.correo, 'Jefe'),
         pe.rol
    into v_responsable, v_rol
    from public.personal pe
   where pe.id_usuario = auth.uid() and pe.activo
   limit 1;

  update public.cuentas_clientes
     set estado_cuenta = p_estado,
         activa = (p_estado = 'activo'),
         motivo_estado = case
           when p_estado = 'activo' then null
           else nullif(btrim(coalesce(p_motivo, '')), '')
         end,
         deleted_at = case
           when p_estado = 'anulado' then coalesce(deleted_at, now())
           else null
         end,
         actualizado_en = now()
   where id = p_id;

  insert into public.auditoria_logs(
    usuario_id, responsable, rol_usuario, accion, tabla_afectada,
    registro_id, datos_anteriores, datos_nuevos
  )
  values (
    auth.uid(), v_responsable, v_rol,
    case
      when p_estado = 'activo' and v_anterior is distinct from 'activo' then 'REACTIVACION_CLIENTE'
      when p_estado = 'anulado' then 'ANULACION_CLIENTE'
      when p_estado = 'inactivo' then 'INACTIVACION_CLIENTE'
      else 'ACTUALIZACION_ESTADO_CLIENTE'
    end,
    'cuentas_clientes', p_id::text,
    jsonb_build_object('estado_cuenta', v_anterior),
    jsonb_build_object(
      'estado_cuenta', p_estado,
      'motivo', nullif(btrim(coalesce(p_motivo, '')), '')
    )
  );

  return jsonb_build_object(
    'id', p_id,
    'estado_anterior', v_anterior,
    'estado_nuevo', p_estado
  );
end;
$$;

-- ------------------------------------------------------------
-- 6. MOVIMIENTOS DE INVENTARIO CON FILTROS
-- ------------------------------------------------------------
create or replace function public.listar_movimientos_inventario_filtrado(
  p_desde date default null,
  p_hasta date default null,
  p_motivo text default null,
  p_busqueda text default null,
  p_limite integer default 500
)
returns table(
  id bigint,
  id_producto bigint,
  producto text,
  codigo_producto text,
  id_pedido uuid,
  numero_pedido text,
  cantidad integer,
  motivo text,
  nota text,
  creado_en timestamptz,
  id_lote bigint,
  codigo_lote text
)
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
    raise exception 'Solo el personal activo puede consultar movimientos';
  end if;
  if p_motivo is not null and p_motivo not in ('entrada', 'venta', 'ajuste', 'devolucion') then
    raise exception 'Tipo de movimiento no válido';
  end if;

  return query
  select
    m.id, m.id_producto, p.nombre, p.codigo,
    m.id_pedido, pe.numero_pedido,
    m.cantidad, m.motivo, m.nota, m.creado_en,
    m.id_lote, l.codigo_lote
  from public.movimientos_inventario m
  join public.productos p on p.id = m.id_producto
  left join public.pedidos pe on pe.id = m.id_pedido
  left join public.lotes_inventario l on l.id = m.id_lote
  where (p_desde is null or m.creado_en >= p_desde)
    and (p_hasta is null or m.creado_en < (p_hasta + 1))
    and (p_motivo is null or m.motivo = p_motivo)
    and (
      p_busqueda is null or btrim(p_busqueda) = ''
      or p.nombre ilike '%' || btrim(p_busqueda) || '%'
      or p.codigo ilike '%' || btrim(p_busqueda) || '%'
      or coalesce(m.nota, '') ilike '%' || btrim(p_busqueda) || '%'
      or coalesce(pe.numero_pedido, '') ilike '%' || btrim(p_busqueda) || '%'
      or coalesce(l.codigo_lote, '') ilike '%' || btrim(p_busqueda) || '%'
    )
  order by m.creado_en desc
  limit least(greatest(coalesce(p_limite, 500), 1), 2000);
end;
$$;

create or replace function public.resumen_movimientos_personal(
  p_desde date default null,
  p_hasta date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.personal
     where id_usuario = auth.uid() and activo
  ) then
    raise exception 'Solo el personal activo puede consultar movimientos';
  end if;

  return jsonb_build_object(
    'total', (
      select count(*) from public.movimientos_inventario
       where (p_desde is null or creado_en >= p_desde)
         and (p_hasta is null or creado_en < (p_hasta + 1))
    ),
    'entradas', (
      select count(*) from public.movimientos_inventario
       where motivo = 'entrada'
         and (p_desde is null or creado_en >= p_desde)
         and (p_hasta is null or creado_en < (p_hasta + 1))
    ),
    'ventas', (
      select count(*) from public.movimientos_inventario
       where motivo = 'venta'
         and (p_desde is null or creado_en >= p_desde)
         and (p_hasta is null or creado_en < (p_hasta + 1))
    ),
    'ajustes', (
      select count(*) from public.movimientos_inventario
       where motivo = 'ajuste'
         and (p_desde is null or creado_en >= p_desde)
         and (p_hasta is null or creado_en < (p_hasta + 1))
    ),
    'devoluciones', (
      select count(*) from public.movimientos_inventario
       where motivo = 'devolucion'
         and (p_desde is null or creado_en >= p_desde)
         and (p_hasta is null or creado_en < (p_hasta + 1))
    ),
    'unidades_entrada', (
      select coalesce(sum(cantidad), 0) from public.movimientos_inventario
       where motivo = 'entrada' and cantidad > 0
         and (p_desde is null or creado_en >= p_desde)
         and (p_hasta is null or creado_en < (p_hasta + 1))
    ),
    'unidades_vendidas', (
      select coalesce(abs(sum(cantidad)), 0) from public.movimientos_inventario
       where motivo = 'venta' and cantidad < 0
         and (p_desde is null or creado_en >= p_desde)
         and (p_hasta is null or creado_en < (p_hasta + 1))
    )
  );
end;
$$;

-- ------------------------------------------------------------
-- 7. PERMISOS
-- ------------------------------------------------------------
revoke all on function public.sincronizar_cuenta_cliente_google() from public, anon;
grant execute on function public.sincronizar_cuenta_cliente_google() to authenticated;

revoke all on function public.registrar_cuenta_cliente(text, text, text, text, text) from public;
grant execute on function public.registrar_cuenta_cliente(text, text, text, text, text) to anon, authenticated;

revoke all on function public.listar_ofertas_personal() from public, anon;
grant execute on function public.listar_ofertas_personal() to authenticated;

revoke all on function public.listar_ofertas_automaticas_personal(integer) from public, anon;
grant execute on function public.listar_ofertas_automaticas_personal(integer) to authenticated;

revoke all on function public.regenerar_avisos_ofertas_jefe() from public, anon;
grant execute on function public.regenerar_avisos_ofertas_jefe() to authenticated;

revoke all on function public.dashboard_operativo_personal(date, date) from public, anon;
grant execute on function public.dashboard_operativo_personal(date, date) to authenticated;

revoke all on function public.listar_clientes_jefe(text, text, date, date, integer) from public, anon;
grant execute on function public.listar_clientes_jefe(text, text, date, date, integer) to authenticated;

revoke all on function public.resumen_clientes_jefe(date, date) from public, anon;
grant execute on function public.resumen_clientes_jefe(date, date) to authenticated;

revoke all on function public.cambiar_estado_cliente_jefe(bigint, text, text) from public, anon;
grant execute on function public.cambiar_estado_cliente_jefe(bigint, text, text) to authenticated;

revoke all on function public.listar_movimientos_inventario_filtrado(date, date, text, text, integer) from public, anon;
grant execute on function public.listar_movimientos_inventario_filtrado(date, date, text, text, integer) to authenticated;

revoke all on function public.resumen_movimientos_personal(date, date) from public, anon;
grant execute on function public.resumen_movimientos_personal(date, date) to authenticated;

-- Funciones heredadas que permitían crear cuentas fuera del flujo seguro.
revoke all on function public.register_customer_account(text, text, text, text) from public, anon, authenticated;
revoke all on function public.register_customer_account(text, text, text, text, text) from public, anon, authenticated;

-- Funciones de trigger: no deben ser invocables directamente por la API.
revoke all on function public.assign_order_customer_account() from public, anon, authenticated;
revoke all on function public.notificar_oferta_especial() from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
