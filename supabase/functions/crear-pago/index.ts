import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ORDERS_URL = 'https://api.mercadopago.com/v1/orders'
const RESERVA_MINUTOS = 15

const allowedOrigins = new Set(
  (Deno.env.get('SITE_URL') ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .map(value => {
      try { return new URL(value).origin } catch { return '' }
    })
    .filter(Boolean)
)

function originAllowed(origin: string): boolean {
  if (!origin) return true
  try {
    const url = new URL(origin)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true
    return allowedOrigins.has(url.origin)
  } catch {
    return false
  }
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  }
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
  })

const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const money = (cents: number) => (cents / 100).toFixed(2)
const cents = (value: unknown) => Math.round(Number(value) * 100)

function validEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
}

function sanitizeOrder(order: Record<string, unknown>) {
  return {
    id: order.id,
    status: order.status,
    status_detail: order.status_detail,
    external_reference: order.external_reference,
    total_amount: order.total_amount,
    total_paid_amount: order.total_paid_amount,
    currency: order.currency,
    date_created: order.created_date,
    last_updated_date: order.last_updated_date,
    expiration_time: order.expiration_time,
    checkout_url: order.checkout_url
  }
}

function checkoutUrlIsSafe(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    return host === 'mercadopago.com' ||
      host.endsWith('.mercadopago.com') ||
      host === 'mercadopago.com.pe' ||
      host.endsWith('.mercadopago.com.pe') ||
      host.endsWith('.mercadolibre.com')
  } catch {
    return false
  }
}

function buildMpItems(pedido: Record<string, unknown>) {
  const subtotalCents = cents(pedido.subtotal)
  const descuentoCents = cents(pedido.descuento)
  const envioCents = cents(pedido.envio)
  const totalCents = cents(pedido.total)
  const netoProductosCents = Math.max(subtotalCents - descuentoCents, 0)
  const originales = Array.isArray(pedido.items) ? pedido.items as Record<string, unknown>[] : []
  const items: Array<Record<string, unknown>> = []

  if (originales.length > 0 && subtotalCents > 0) {
    let asignado = 0
    originales.forEach((item, index) => {
      const cantidad = Number(item.cantidad)
      const precioCents = cents(item.precio_unitario)
      if (!Number.isFinite(cantidad) || cantidad < 1 || !Number.isFinite(precioCents)) return

      const brutoCents = precioCents * cantidad
      let lineaCents = index === originales.length - 1
        ? netoProductosCents - asignado
        : Math.round(brutoCents * netoProductosCents / subtotalCents)

      if (lineaCents < 0) lineaCents = 0
      asignado += lineaCents

      const titulo = text(item.titulo) || 'Producto Byte Bay'
      items.push({
        title: cantidad > 1 ? `${titulo} (x${cantidad})` : titulo,
        description: text(item.codigo) ? `Código ${text(item.codigo)}` : 'Producto Byte Bay',
        quantity: 1,
        unit_price: money(lineaCents),
        external_code: text(item.codigo) || undefined
      })
    })
  }

  if (items.length === 0) {
    items.push({
      title: `Pedido ${text(pedido.numero_pedido)}`,
      description: 'Compra en Byte Bay',
      quantity: 1,
      unit_price: money(totalCents)
    })
  } else if (envioCents > 0) {
    items.push({
      title: 'Envío',
      description: 'Costo de entrega',
      quantity: 1,
      unit_price: money(envioCents)
    })
  }

  const suma = items.reduce((acc, item) =>
    acc + cents(item.unit_price) * Number(item.quantity), 0)

  if (suma !== totalCents) {
    const diferencia = totalCents - suma
    const ultimo = items[items.length - 1]
    const nuevo = cents(ultimo.unit_price) + diferencia
    if (nuevo >= 0) {
      ultimo.unit_price = money(nuevo)
    } else {
      return [{
        title: `Pedido ${text(pedido.numero_pedido)}`,
        description: 'Compra en Byte Bay',
        quantity: 1,
        unit_price: money(totalCents)
      }]
    }
  }

  return items
}

Deno.serve(async request => {
  const origin = request.headers.get('origin') ?? ''
  const headers = corsHeaders(originAllowed(origin) ? origin : 'null')

  if (request.method === 'OPTIONS') return new Response('ok', { headers })
  if (!originAllowed(origin)) return json({ error: 'Origen no autorizado' }, 403, headers)
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405, headers)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'La función no tiene configurado su acceso al servicio' }, 500, headers)
  }
  if (!mpToken) {
    console.error('crear-pago: falta MP_ACCESS_TOKEN en los secretos de Edge Functions')
    return json({ error: 'El pago no está configurado todavía. Contacta con la tienda.' }, 500, headers)
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return json({ error: 'Solicitud no válida' }, 400, headers)
    }

    const entrada = body as Record<string, unknown>
    const sesionToken = text(entrada.sesion_token)
    if (!sesionToken || sesionToken.length > 5000) {
      return json({ error: 'Inicia sesión con una cuenta Byte Bay para comprar' }, 401, headers)
    }

    const { data: sesion, error: sesionError } = await admin.rpc('bb_validar_sesion', {
      p_access_token: sesionToken
    })
    if (sesionError) {
      console.error('crear-pago: no se pudo validar la sesión Byte Bay', sesionError)
      return json({ error: 'No se pudo validar tu cuenta. Inténtalo nuevamente.' }, 503, headers)
    }

    const customerId = Number(sesion?.customer_id)
    if (
      sesion?.valid !== true ||
      sesion?.role !== 'cliente' ||
      !Number.isSafeInteger(customerId) ||
      customerId <= 0
    ) {
      return json({ error: 'Tu sesión de Byte Bay no es válida. Inicia sesión nuevamente.' }, 401, headers)
    }

    const { data: cuentaCliente, error: cuentaError } = await admin
      .from('cuentas_clientes')
      .select('id, correo')
      .eq('id', customerId)
      .eq('activa', true)
      .maybeSingle()
    if (cuentaError) {
      console.error('crear-pago: no se pudo cargar la cuenta del cliente', cuentaError)
      return json({ error: 'No se pudo verificar tu cuenta. Inténtalo nuevamente.' }, 503, headers)
    }
    if (!cuentaCliente) {
      return json({ error: 'No encontramos una cuenta Byte Bay activa para esta sesión.' }, 401, headers)
    }

    const articulosRaw = Array.isArray(entrada.articulos) ? entrada.articulos : []
    if (articulosRaw.length === 0) return json({ error: 'El carrito está vacío' }, 400, headers)
    if (articulosRaw.length > 100) return json({ error: 'Demasiados productos en el pedido' }, 400, headers)

    const mapa = new Map<number, number>()
    for (const item of articulosRaw) {
      const fila = item as Record<string, unknown>
      const id = Number(fila?.id_producto)
      const cantidad = Number(fila?.cantidad)
      if (!Number.isInteger(id) || id <= 0) {
        return json({ error: 'Producto no válido en el carrito' }, 400, headers)
      }
      if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) {
        return json({ error: 'Cantidad no válida en el carrito' }, 400, headers)
      }
      mapa.set(id, (mapa.get(id) ?? 0) + cantidad)
    }

    if ([...mapa.values()].some(cantidad => cantidad > 20)) {
      return json({ error: 'La cantidad por producto no puede superar 20 unidades' }, 400, headers)
    }

    const clienteRaw = (entrada.cliente ?? {}) as Record<string, unknown>
    const cliente = {
      correo: text(clienteRaw.correo).toLowerCase(),
      nombre_completo: text(clienteRaw.nombre_completo),
      documento: text(clienteRaw.documento),
      direccion: text(clienteRaw.direccion),
      telefono: text(clienteRaw.telefono)
    }

    if (!validEmail(cliente.correo)) return json({ error: 'Correo no válido' }, 400, headers)
    if (cliente.correo !== cuentaCliente.correo) {
      return json({ error: 'El correo de compra debe coincidir con el de tu cuenta Byte Bay.' }, 403, headers)
    }
    if (cliente.nombre_completo.length < 3 || cliente.nombre_completo.length > 200) {
      return json({ error: 'Nombre del cliente no válido' }, 400, headers)
    }
    if (cliente.direccion.length < 5 || cliente.direccion.length > 300) {
      return json({ error: 'Dirección de entrega no válida' }, 400, headers)
    }
    if (cliente.documento.length > 20 || cliente.telefono.length > 30) {
      return json({ error: 'Documento o teléfono no válido' }, 400, headers)
    }

    const cupon = text(entrada.cupon).toUpperCase().slice(0, 20)
    if (cupon && !['BERU10', 'BYTE10', 'HOGAR15'].includes(cupon)) {
      return json({ error: 'Cupón no válido' }, 400, headers)
    }

    const articulos = [...mapa.entries()].map(([id_producto, cantidad]) => ({ id_producto, cantidad }))

    const { data: pedido, error: pedidoError } = await admin.rpc('bb_crear_pedido_mp', {
      p_articulos: articulos,
      p_cliente: cliente,
      p_cupon: cupon || null,
      p_minutos_reserva: RESERVA_MINUTOS
    })

    if (pedidoError) {
      const mensaje = String(pedidoError.message || '')
      console.error('crear-pago: bb_crear_pedido_mp', pedidoError)
      if (/Existencias insuficientes/i.test(mensaje)) {
        return json({ error: mensaje }, 409, headers)
      }
      if (/Cupón no válido|Correo no válido|Nombre del cliente|Dirección de entrega|Cantidad no válida|Producto no disponible|Pedido vacío/i.test(mensaje)) {
        return json({ error: mensaje }, 400, headers)
      }
      return json({ error: 'No se pudo registrar el pedido. Intenta nuevamente.' }, 500, headers)
    }

    if (!pedido || typeof pedido !== 'object') {
      return json({ error: 'No se pudo registrar el pedido. Intenta nuevamente.' }, 500, headers)
    }

    const pedidoData = pedido as Record<string, unknown>
    const total = Number(pedidoData.total)
    if (!Number.isFinite(total) || total <= 0) {
      await admin.rpc('bb_liberar_pedido_mp', {
        p_pago_id: pedidoData.pago_id,
        p_motivo: 'total_invalido',
        p_payload: null
      })
      return json({ error: 'El total del pedido no es válido' }, 500, headers)
    }

    const items = buildMpItems(pedidoData)

    const nombrePartes = cliente.nombre_completo.split(/\s+/).filter(Boolean)
    const payer: Record<string, unknown> = {
      email: cliente.correo,
      first_name: nombrePartes[0] || 'Cliente',
      last_name: nombrePartes.slice(1).join(' ') || 'Byte Bay'
    }

    const documento = cliente.documento.replace(/\D/g, '')
    if (documento.length === 8) {
      payer.identification = { type: 'DNI', number: documento }
    } else if (documento.length >= 9 && documento.length <= 12) {
      payer.identification = { type: 'CE', number: documento }
    }

    let telefono = cliente.telefono.replace(/\D/g, '')
    if (telefono.startsWith('51') && telefono.length > 9) telefono = telefono.slice(2)
    telefono = telefono.slice(-9)
    if (telefono.length === 9) payer.phone = { area_code: '51', number: telefono }

    const siteUrl = (Deno.env.get('SITE_URL') ?? '')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '')

    const config: Record<string, unknown> = {}
    if (/^https:\/\//i.test(siteUrl)) {
      const pedidoId = encodeURIComponent(text(pedidoData.id_pedido))
      config.online = {
        success_url: `${siteUrl}/?pago=exito&pedido=${pedidoId}`,
        failure_url: `${siteUrl}/?pago=fallo&pedido=${pedidoId}`,
        pending_url: `${siteUrl}/?pago=pendiente&pedido=${pedidoId}`,
        auto_return: 'approved'
      }
    }

    const orderBody: Record<string, unknown> = {
      type: 'online',
      processing_mode: 'manual',
      capture_mode: 'automatic_async',
      external_reference: text(pedidoData.external_reference),
      total_amount: money(cents(pedidoData.total)),
      description: `Pedido ${text(pedidoData.numero_pedido)} · Byte Bay`,
      payer,
      items,
      expiration_time: 'PT15M',
      config
    }

    const mpResponse = await fetch(MP_ORDERS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': text(pedidoData.idempotency_key)
      },
      body: JSON.stringify(orderBody)
    })

    const mpData = await mpResponse.json().catch(() => null) as Record<string, unknown> | null

    if (!mpResponse.ok || !mpData) {
      console.error('crear-pago: Mercado Pago respondió', mpResponse.status, mpData)
      await admin.rpc('bb_liberar_pedido_mp', {
        p_pago_id: pedidoData.pago_id,
        p_motivo: `error_mp_${mpResponse.status}`,
        p_payload: mpData ? sanitizeOrder(mpData) : null
      })
      return json({
        error: 'Mercado Pago no pudo iniciar el pago. Revisa tus datos e intenta nuevamente.'
      }, 502, headers)
    }

    const checkoutUrl = text(mpData.checkout_url)
    const mpOrderId = text(mpData.id)

    if (!mpOrderId || !checkoutUrl || !checkoutUrlIsSafe(checkoutUrl)) {
      console.error('crear-pago: respuesta de Mercado Pago sin checkout_url válido', mpData)
      await admin.rpc('bb_liberar_pedido_mp', {
        p_pago_id: pedidoData.pago_id,
        p_motivo: 'checkout_url_invalido',
        p_payload: sanitizeOrder(mpData)
      })
      return json({ error: 'Mercado Pago devolvió una respuesta no válida. Intenta nuevamente.' }, 502, headers)
    }

    const payload = sanitizeOrder(mpData)
    const { error: registrarError } = await admin.rpc('bb_registrar_orden_mp', {
      p_pago_id: pedidoData.pago_id,
      p_mp_order_id: mpOrderId,
      p_checkout_url: checkoutUrl,
      p_mp_status: text(mpData.status) || 'created',
      p_payload: payload
    })

    if (registrarError) {
      // El webhook puede recuperar la relación por external_reference.
      console.error('crear-pago: no se pudo registrar la orden MP', registrarError)
    }

    return json({
      ok: true,
      pedido_id: pedidoData.id_pedido,
      numero_pedido: pedidoData.numero_pedido,
      total: Number(pedidoData.total),
      moneda: text(pedidoData.moneda) || 'PEN',
      checkout_url: checkoutUrl,
      expira_en: pedidoData.expira_en,
      minutos_reserva: RESERVA_MINUTOS
    }, 200, headers)
  } catch (error) {
    console.error('crear-pago:', error)
    return json({ error: 'No se pudo iniciar el pago. Intenta nuevamente.' }, 500, headers)
  }
})
