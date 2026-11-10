import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CULQI_CHARGES_URL = 'https://api.culqi.com/v2/charges'
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

type Json = Record<string, unknown>

function mapChargeState(charge: Json) {
  const state = text(charge.state).toLowerCase()
  const responseCode = text(charge.response_code).toLowerCase()
  const outcome = charge.outcome && typeof charge.outcome === 'object'
    ? charge.outcome as Json
    : {}
  const outcomeType = text(outcome.type).toLowerCase()

  if (state === 'exitosa' || responseCode === 'venta_exitosa' || outcomeType === 'venta_exitosa') {
    return { estado: 'aprobado', state: text(charge.state) || 'Exitosa' }
  }
  if (state === 'reembolsado' || state === 'reversado' || responseCode === 'reembolso_exitoso') {
    return { estado: 'reembolsado', state: text(charge.state) || 'Reembolsado' }
  }
  if (state === 'fallida' || state === 'rechazada' || outcomeType === 'venta_rechazada') {
    return { estado: 'rechazado', state: text(charge.state) || 'Fallida' }
  }
  return { estado: 'pendiente', state: text(charge.state) || 'Pendiente' }
}

function safeChargePayload(charge: Json) {
  return {
    id: charge.id,
    object: charge.object,
    amount: charge.amount,
    currency_code: charge.currency_code,
    email: charge.email,
    description: charge.description,
    state: charge.state,
    response_code: charge.response_code,
    source: charge.source,
    outcome: charge.outcome,
    creation_date: charge.creation_date
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
  const privateKey = Deno.env.get('CULQI_PRIVATE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'La función no tiene configurado su acceso al servicio' }, 500, headers)
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return json({ error: 'Solicitud no válida' }, 400, headers)
    }

    const entrada = body as Json
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
      console.error('consultar-pago-culqi: no se pudo validar la sesión Byte Bay', sesionError)
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
      console.error('consultar-pago-culqi: no se pudo cargar el pedido', pedidoError)
      return json({ error: 'No se pudo consultar el pedido' }, 503, headers)
    }
    if (!pedido) {
      return json({ error: 'Pedido no encontrado' }, 404, headers)
    }

    const { data: pago, error: pagoError } = await admin
      .from('pagos_culqi')
      .select('id, estado, culqi_state, culqi_response_code, culqi_charge_id, monto, moneda, expira_en, pagado_en')
      .eq('id_pedido', pedidoId)
      .maybeSingle()
    if (pagoError) {
      console.error('consultar-pago-culqi: no se pudo cargar el pago', pagoError)
      return json({ error: 'No se pudo consultar el pago' }, 503, headers)
    }
    if (!pago) {
      return json({ error: 'No encontramos un pago asociado a este pedido' }, 404, headers)
    }

    let estado = text(pago.estado) || 'pendiente'
    let culqiState = text(pago.culqi_state)
    let responseCode = text(pago.culqi_response_code)

    // Respaldo del webhook: si sigue pendiente y Culqi ya creó el cargo,
    // verificamos directamente el estado y aplicamos el resultado.
    if (estado === 'pendiente' && pago.culqi_charge_id && privateKey) {
      try {
        const culqiResponse = await fetch(`${CULQI_CHARGES_URL}/${encodeURIComponent(pago.culqi_charge_id)}`, {
          headers: { Authorization: `Bearer ${privateKey}` },
          signal: AbortSignal.timeout(8000)
        })
        const charge = await culqiResponse.json().catch(() => null) as Json | null
        if (culqiResponse.ok && charge && text(charge.id) === text(pago.culqi_charge_id)) {
          const mapeado = mapChargeState(charge)
          const esperado = Math.round(Number(pago.monto) * 100)
          const moneda = text(charge.currency_code).toUpperCase()
          const montoOk = Number(charge.amount) === esperado && (!moneda || moneda === 'PEN')

          if (mapeado.estado !== 'pendiente' && montoOk) {
            const source = charge.source && typeof charge.source === 'object'
              ? charge.source as Json
              : {}
            const { error: aplicarError } = await admin.rpc('bb_aplicar_estado_culqi', {
              p_charge_id: text(pago.culqi_charge_id),
              p_estado: mapeado.estado,
              p_source_type: text(source.type) || null,
              p_payload: safeChargePayload(charge),
              p_external_reference: text(pedido.id)
            })
            if (aplicarError) {
              console.error('consultar-pago-culqi: no se pudo aplicar el estado', aplicarError)
            } else {
              const { data: actualizado } = await admin
                .from('pagos_culqi')
                .select('estado, culqi_state, culqi_response_code, pagado_en')
                .eq('id', pago.id)
                .maybeSingle()
              if (actualizado) {
                estado = text(actualizado.estado) || estado
                culqiState = text(actualizado.culqi_state) || culqiState
                responseCode = text(actualizado.culqi_response_code) || responseCode
                pago.pagado_en = actualizado.pagado_en
              }
            }
          } else {
            culqiState = mapeado.state || culqiState
          }
        }
      } catch (error) {
        console.error('consultar-pago-culqi: no se pudo verificar el cargo en Culqi', error)
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
      culqi_state: culqiState || null,
      culqi_response_code: responseCode || null,
      expira_en: pago.expira_en,
      pagado_en: pago.pagado_en ?? null
    }, 200, headers)
  } catch (error) {
    console.error('consultar-pago-culqi:', error)
    return json({ error: 'No se pudo consultar el pago. Intenta nuevamente.' }, 500, headers)
  }
})
