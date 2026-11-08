-- Byte Bay: require and attach an active customer account to Mercado Pago orders.
-- Apply after the base schema and migrations_pagos_mercado_pago.sql.

begin;

create or replace function public.bb_pedido_mercado_pago_requiere_cuenta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id_cuenta bigint;
begin
  if lower(trim(coalesce(new.metodo_pago, ''))) <> 'mercado_pago' then
    return new;
  end if;

  select c.id
    into v_id_cuenta
    from public.cuentas_clientes c
   where c.correo = lower(trim(new.correo_cliente))
     and c.activa
   limit 1;

  if v_id_cuenta is null then
    raise exception 'Se requiere una cuenta Byte Bay activa para comprar'
      using errcode = '23514';
  end if;

  new.id_cuenta_cliente := v_id_cuenta;
  return new;
end;
$$;

revoke all on function public.bb_pedido_mercado_pago_requiere_cuenta() from public, anon, authenticated;

drop trigger if exists pedidos_mercado_pago_requiere_cuenta on public.pedidos;
create trigger pedidos_mercado_pago_requiere_cuenta
before insert on public.pedidos
for each row
execute function public.bb_pedido_mercado_pago_requiere_cuenta();

commit;
