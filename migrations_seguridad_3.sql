-- ============================================================
-- BYTE BAY · Endurecimiento de seguridad — parte 3
-- Defensa en profundidad: aunque todas estas tablas tienen RLS
-- activo, el rol `authenticated` (cualquier cliente con sesión)
-- conservaba SELECT directo. La web no las consulta: todo pasa
-- por RPC SECURITY DEFINER o por las Edge Functions.
-- ============================================================

begin;

revoke select on public.auditoria_logs            from anon, authenticated;
revoke select on public.auditoria_personal        from anon, authenticated;
revoke select on public.configuracion_sistema     from anon, authenticated;
revoke select on public.cuentas_clientes          from anon, authenticated;
revoke select on public.detalles_pedido           from anon, authenticated;
revoke select on public.historial_estados_pedido  from anon, authenticated;
revoke select on public.libro_reclamaciones       from anon, authenticated;
revoke select on public.lotes_inventario          from anon, authenticated;
revoke select on public.movimientos_inventario    from anon, authenticated;
revoke select on public.notificaciones_ofertas    from anon, authenticated;
revoke select on public.pedidos                   from anon, authenticated;
revoke select on public.personal                  from anon, authenticated;
revoke select on public.proveedores               from anon, authenticated;
revoke select on public.suscripciones_byte_plus   from anon, authenticated;

-- Los clientes mantienen únicamente sus propias preferencias,
-- que es lo que usa el flujo de notificaciones.
grant select, insert, update, delete on public.preferencias_notificacion to authenticated;

commit;
