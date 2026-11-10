# Pagos con Mercado Pago

El checkout ofrece Mercado Pago como opción principal y Culqi como alternativa.
El cliente paga en el checkout alojado de Mercado Pago; Byte Bay no recibe ni
almacena datos de tarjeta. Un pedido solo se confirma después de verificar el
estado de la orden con Mercado Pago o recibir su webhook.

## Flujo

1. `crear-pago` valida la sesión Byte Bay, crea el pedido y reserva inventario.
2. La función solicita una orden en `POST https://api.mercadopago.com/v1/orders`
   y devuelve el enlace HTTPS de checkout.
3. El cliente completa el pago directamente en Mercado Pago.
4. `webhook-mercado-pago` verifica la orden con la API y aplica su resultado.
   Al regresar al sitio, `consultar-pago` también verifica el estado.
5. Solo una orden pagada y validada por monto y moneda confirma el pedido y
   descuenta el inventario; un rechazo o vencimiento libera la reserva.

## Configuración en Supabase

Secretos requeridos en Edge Functions:

- `MP_ACCESS_TOKEN`: token privado del vendedor.
- `MP_WEBHOOK_SECRET`: firma del webhook.
- `SITE_URL`: URL pública completa de la tienda, incluido `/Byte-Bay-web`,
  para que Mercado Pago regrese a la página correcta.

Funciones:

- `crear-pago`
- `consultar-pago`
- `webhook-mercado-pago`

Configura en Mercado Pago el webhook de órdenes para:

```
https://inwugycvtaaceugvtfpv.supabase.co/functions/v1/webhook-mercado-pago
```

La cuenta de Mercado Pago debe estar habilitada para recibir pagos y el token
debe corresponder al entorno deseado. Las pruebas usan credenciales y medios de
prueba oficiales; un pago real requiere credenciales de producción y aprobación
de la cuenta.
