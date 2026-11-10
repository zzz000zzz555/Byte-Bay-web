import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

function validEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
}

Deno.serve(async request => {
  const origin = request.headers.get('origin') ?? ''
  const headers = corsHeaders(originAllowed(origin) ? origin : 'null')

  if (request.method === 'OPTIONS') return new Response('ok', { headers })
  if (!originAllowed(origin)) return json({ error: 'Origen no autorizado' }, 403, headers)
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405, headers)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const publicKey = Deno.env.get('CULQI_PUBLIC_KEY')
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'La función no tiene configurado su acceso al servicio' }, 500, headers)
  }
  if (!publicKey) {
    console.error('crear-pago-culqi: falta CULQI_PUBLIC_KEY en los secretos de Edge Functions')
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
      console.error('crear-pago-culqi: no se pudo validar la sesión Byte Bay', sesionError)
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
      console.error('crear-pago-culqi: no se pudo cargar la cuenta del cliente', cuentaError)
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

    const { data: pedido, error: pedidoError } = await admin.rpc('bb_crear_pedido_culqi', {
      p_articulos: articulos,
      p_cliente: cliente,
      p_cupon: cupon || null,
      p_minutos_reserva: RESERVA_MINUTOS
    })

    if (pedidoError) {
      const mensaje = String(pedidoError.message || '')
      console.error('crear-pago-culqi: bb_crear_pedido_culqi', pedidoError)
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
      await admin.rpc('bb_liberar_pedido_culqi', {
        p_pago_id: pedidoData.pago_id,
        p_motivo: 'total_invalido',
        p_payload: null
      })
      return json({ error: 'El total del pedido no es válido' }, 500, headers)
    }

    const totalCentimos = Math.round(total * 100)

    return json({
      ok: true,
      pedido_id: pedidoData.id_pedido,
      numero_pedido: pedidoData.numero_pedido,
      total,
      total_centimos: totalCentimos,
      moneda: text(pedidoData.moneda) || 'PEN',
      expira_en: pedidoData.expira_en,
      minutos_reserva: RESERVA_MINUTOS,
      public_key: publicKey
    }, 200, headers)
  } catch (error) {
    console.error('crear-pago-culqi:', error)
    return json({ error: 'No se pudo iniciar el pago. Intenta nuevamente.' }, 500, headers)
  }
})
