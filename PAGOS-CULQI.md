# Pagos con Culqi (tarjetas)

Byte Bay cobra con **Culqi Checkout v4** usando cargos con token de tarjeta.
Ninguna clave privada vive en el navegador ni en este repositorio.

## Flujo

1. El cliente inicia sesión con su cuenta Byte Bay (obligatorio).
2. `crear-pago-culqi` valida la sesión, crea el pedido y **reserva** stock por 15 minutos.
3. El navegador abre Culqi Checkout con la clave pública y el monto en céntimos.
4. `cobrar-culqi` crea el cargo en `POST https://api.culqi.com/v2/charges` con la clave privada.
5. Si el cargo es exitoso, `bb_aplicar_estado_culqi` confirma el pedido y **descuenta** el stock.
6. Si se rechaza o expira, la reserva se **libera** y el pedido queda cancelado.
7. `consultar-pago-culqi` reconcilia el estado desde el navegador y `webhook-culqi` lo hace como respaldo.

## Secretos (Supabase → Edge Functions)

| Secreto | Uso |
| --- | --- |
| `CULQI_PRIVATE_KEY` | Cargos y consulta de cargos (solo servidor) |
| `CULQI_PUBLIC_KEY` | Se entrega al navegador para abrir el Checkout |

Configurar con:

```powershell
npx supabase secrets set "CULQI_PRIVATE_KEY=..." "CULQI_PUBLIC_KEY=..." --project-ref <ref> --yes
```

## Funciones desplegadas

- `crear-pago-culqi` (verify_jwt = false)
- `cobrar-culqi` (verify_jwt = false)
- `consultar-pago-culqi` (verify_jwt = false)
- `webhook-culqi` (verify_jwt = false)

## Webhook

Registrar en **CulqiPanel → Eventos → Webhooks** (evento *Cargos*):

```
https://inwugycvtaaceugvtfpv.supabase.co/functions/v1/webhook-culqi
```

El webhook no confía en el cuerpo: vuelve a consultar el cargo con la clave privada,
valida monto/moneda y aplica el estado de forma idempotente.

## Pasar a producción

1. Esperar la aprobación de la cuenta Culqi.
2. En CulqiPanel, registrar el dominio `zzz000zzz555.github.io` como dominio permitido.
3. Reemplazar los secretos de prueba por `sk_live_...` / `pk_live_...`.
4. Registrar el webhook también para el modo producción y hacer una compra real de bajo monto.
5. Rotar la clave `sk_test` que se compartió por chat.

## Pruebas realizadas

- Venta aprobada con `4111 1111 1111 1111` (09/30, 123): pedido `confirmado`, pago `aprobado`, stock 20 → 19, movimiento `-1`.
- Venta rechazada con `4000 0400 0000 0008` (03/30, 295): pedido `cancelado`, pago `rechazado`, reserva liberada, stock intacto.
- Webhook duplicado: primera llamada aplica el estado, segunda responde `duplicate`.
- Los datos de prueba se eliminaron y el stock volvió a 20.
