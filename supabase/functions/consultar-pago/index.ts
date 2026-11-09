import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ORDERS_URL = 'https://api.mercadopago.com/v1/orders'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

function normalizeStatus(status: string) {
  switch (status) {
    case 'processed':
      return 'aprobado'
    case 'failed':
    case 'canceled':
      return 'rechazado'
    case 'refunded':
    case 'charged_back':
      return 'reembolsado'
    default:
      return 'pendiente'
  }
}

Deno.serve(async request => {
  const origin = request.headers.get('origin') ?? ''
  const headers = corsHeaders(originAllowed(origin) ? origin : 'null')

  if (request.method === 'OPTIONS') return new Response('ok', { headers })
  if (!originAllowed(origin)) return json({ error: 'Origen no autorizado' }, 403, headers)
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405, headers)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'La función no tiene configurado su acceso al servicio' }, 500, headers)
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return json({ error: 'Solicitud no válida' }, 400, headers)
    }

    const entrada = body as Record<string, unknown>
    const sesionToken = text(entrada.sesion_token)
    const pedidoId = text(entrada.pedido)
    if (!sesionToken || sesionToken.length > 5000) {
      return json({ error: 'Inicia sesión para consultar tu pedido' }, 401, headers)
    }
    if (!UUID.test(pedidoId)) {
      return json({ error: 'Pedido no válido' }, 400, headers)
    }

    const { data: sesion, error: sesionError } = await admin.rpc('bb_validar_sesion', {
      p_access_token: sesionToken
    })
    if (sesionError) {
      console.error('consultar-pago: no se pudo validar la sesión Byte Bay', sesionError)
      return json({ error: 'No se pudo validar tu sesión. Inténtalo nuevamente.' }, 503, headers)
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

    const { data: pedido, error: pedidoError } = await admin
      .from('pedidos')
      .select('id, numero_pedido, total, estado, estado_pago, id_cuenta_cliente')
      .eq('id', pedidoId)
      .eq('id_cuenta_cliente', customerId)
      .maybeSingle()
    if (pedidoError) {
      console.error('consultar-pago: no se pudo cargar el pedido', pedidoError)
      return json({ error: 'No se pudo consultar el pedido' }, 503, headers)
    }
    if (!pedido) {
      return json({ error: 'Pedido no encontrado' }, 404, headers)
    }

    const { data: pago, error: pagoError } = await admin
      .from('pagos_mercado_pago')
      .select('id, estado, mp_status, mp_status_detail, mp_order_id, monto, moneda, expira_en, pagado_en')
      .eq('id_pedido', pedidoId)
      .maybeSingle()
    if (pagoError) {
      console.error('consultar-pago: no se pudo cargar el pago', pagoError)
      return json({ error: 'No se pudo consultar el pago' }, 503, headers)
    }
    if (!pago) {
      return json({ error: 'No encontramos un pago asociado a este pedido' }, 404, headers)
    }

    let estado = text(pago.estado) || 'pendiente'
    let mpStatus = text(pago.mp_status)
    let mpStatusDetail = text(pago.mp_status_detail) || null

    // Respaldo del webhook: si el pago sigue pendiente y ya existe la orden en
    // Mercado Pago, verificamos directamente el estado y aplicamos el resultado.
    // Esto no reemplaza al webhook; solo evita que el cliente vea "pendiente"
    // cuando el pago ya fue aprobado y la notificación aún no llegó.
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (estado === 'pendiente' && pago.mp_order_id && mpToken) {
      try {
        const mpResponse = await fetch(`${MP_ORDERS_URL}/${encodeURIComponent(pago.mp_order_id)}`, {
          headers: { Authorization: `Bearer ${mpToken}` },
          signal: AbortSignal.timeout(8000)
        })
        const orden = await mpResponse.json().catch(() => null) as Record<string, unknown> | null
        if (mpResponse.ok && orden && text(orden.id) === text(pago.mp_order_id)) {
          const status = text(orden.status)
          const statusDetail = text(orden.status_detail) || null
          const externalReference = text(orden.external_reference)
          let coincide = true

          if (status === 'processed' && statusDetail !== 'refunded') {
            const total = Number(orden.total_amount)
            const pagado = orden.total_paid_amount == null ? total : Number(orden.total_paid_amount)
            const moneda = text(orden.currency ?? orden.currency_id).toUpperCase()
            const esperado = Math.round(Number(pago.monto) * 100)
            coincide = Number.isFinite(total) &&
              Number.isFinite(pagado) &&
              Math.round(total * 100) === esperado &&
              Math.round(pagado * 100) === esperado &&
              moneda === String(pago.moneda).toUpperCase()
          }

          if (coincide && externalReference) {
            const { error: aplicarError } = await admin.rpc('bb_aplicar_estado_pago', {
              p_mp_order_id: text(pago.mp_order_id),
              p_mp_status: status,
              p_mp_status_detail: statusDetail,
              p_payload: {
                id: orden.id,
                status,
                status_detail: statusDetail,
                external_reference: externalReference,
                total_amount: orden.total_amount,
                total_paid_amount: orden.total_paid_amount,
                currency: orden.currency ?? orden.currency_id,
                last_updated_date: orden.last_updated_date
              },
              p_external_reference: externalReference
            })
            if (aplicarError) {
              console.error('consultar-pago: no se pudo aplicar el estado de Mercado Pago', aplicarError)
            } else {
              const { data: actualizado } = await admin
                .from('pagos_mercado_pago')
                .select('estado, mp_status, mp_status_detail, pagado_en')
                .eq('id', pago.id)
                .maybeSingle()
              if (actualizado) {
                estado = text(actualizado.estado) || estado
                mpStatus = text(actualizado.mp_status) || mpStatus
                mpStatusDetail = text(actualizado.mp_status_detail) || mpStatusDetail
                pago.pagado_en = actualizado.pagado_en
              }
            }
          } else {
            estado = normalizeStatus(status) === 'aprobado' ? 'revision' : estado
            mpStatus = status || mpStatus
            mpStatusDetail = statusDetail
          }
        }
      } catch (error) {
        console.error('consultar-pago: no se pudo verificar la orden en Mercado Pago', error)
      }
    }

    return json({
      ok: true,
      pedido_id: pedido.id,
      numero_pedido: text(pedido.numero_pedido),
      total: Number(pedido.total),
      moneda: text(pago.moneda) || 'PEN',
      estado,
      estado_pedido: text(pedido.estado),
      estado_pago: text(pedido.estado_pago),
      mp_status: mpStatus || null,
      mp_status_detail: mpStatusDetail,
      expira_en: pago.expira_en,
      pagado_en: pago.pagado_en ?? null
    }, 200, headers)
  } catch (error) {
    console.error('consultar-pago:', error)
    return json({ error: 'No se pudo consultar el pago. Intenta nuevamente.' }, 500, headers)
  }
})
