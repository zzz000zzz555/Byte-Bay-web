import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsErrorHeaders, corsHeaders as buildCorsHeaders, originAllowed } from '../_shared/cors.ts'

const CULQI_CHARGES_URL = 'https://api.culqi.com/v2/charges'
const SIGNATURE_HEADERS = ['x-culqi-signature', 'x-signature', 'x-hub-signature-256']
const TIMESTAMP_HEADERS = ['x-culqi-timestamp', 'x-timestamp']

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Vary': 'Origin', ...headers }
  })

const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''

type Json = Record<string, unknown>

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index++) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

function hex(bytes: Uint8Array) {
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('')
}

function base64(bytes: Uint8Array) {
  return btoa([...bytes].map(value => String.fromCharCode(value)).join(''))
}

function parseSignature(header: string) {
  const fields = new Map<string, string>()
  for (const part of header.split(',')) {
    const separator = part.indexOf('=')
    if (separator >= 0) {
      fields.set(part.slice(0, separator).trim().toLowerCase(), part.slice(separator + 1).trim())
    }
  }
  const timestamp = fields.get('t') || fields.get('ts') || ''
  const firmas = [
    fields.get('v1'),
    fields.get('v2'),
    fields.get('sig'),
    fields.get('sha256')
  ].filter((valor): valor is string => Boolean(valor))
  if (!firmas.length && /^[a-f0-9]{64}$/i.test(header.trim())) firmas.push(header.trim())
  return { timestamp, firmas }
}

// Firma HMAC-SHA256 con timestamp (formatos t=<Unix>,v1=<hex> o sha256=<hex> +
// cabecera de timestamp). Se exige una antigüedad máxima de 300 s y comparación
// de tiempo constante. Se usa el cuerpo crudo recibido, nunca un JSON reserializado.
async function signatureIsValid(rawBody: string, secret: string, headers: Headers) {
  const signatureHeader = SIGNATURE_HEADERS
    .map(nombre => headers.get(nombre))
    .find(valor => Boolean(valor)) || ''
  if (!signatureHeader) return false

  const parseada = parseSignature(signatureHeader)
  const timestamp = parseada.timestamp ||
    TIMESTAMP_HEADERS.map(nombre => headers.get(nombre)).find(valor => Boolean(valor)) || ''
  if (!/^\d+$/.test(timestamp)) return false
  const segundos = Number(timestamp)
  if (!Number.isSafeInteger(segundos) || Math.abs(Date.now() / 1000 - segundos) > 300) return false

  const recibidas = [...new Set(parseada.firmas
    .map(valor => valor.replace(/^sha256=/i, '').trim())
    .filter(Boolean))]
  if (!recibidas.length) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  // Se aceptan proveedores que firman el cuerpo crudo y los que incluyen el
  // timestamp como prefijo; en ambos casos se exige la ventana de 300 s.
  const mensajes = parseada.timestamp ? [rawBody, `${timestamp}.${rawBody}`] : [rawBody]

  for (const mensaje of mensajes) {
    const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(mensaje)))
    const codificadas = [
      hex(digest),
      base64(digest),
      base64(digest).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    ]
    for (const recibida of recibidas) {
      for (const esperada of codificadas) {
        if (constantTimeEqual(recibida.toLowerCase(), esperada.toLowerCase())) return true
      }
    }
  }
  return false
}

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
  if (origin && !originAllowed(origin)) {
    return json({ error: 'Origen no autorizado' }, 403, corsErrorHeaders)
  }
  // Los webhooks son servidor a servidor y normalmente no envían Origin; en ese
  // caso no se emite ninguna cabecera CORS (nunca '*').
  const cors = origin ? buildCorsHeaders(origin) : {}
  const responder = (body: unknown, status = 200) => json(body, status, cors)
  if (origin && request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return responder({ error: 'Método no permitido' }, 405)

  const webhookSecret = Deno.env.get('CULQI_WEBHOOK_SECRET')
  if (!webhookSecret) {
    return responder({ error: 'Webhook no configurado: falta CULQI_WEBHOOK_SECRET' }, 503)
  }

  const privateKey = Deno.env.get('CULQI_PRIVATE_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!privateKey || !supabaseUrl || !serviceKey) {
    console.error('webhook-culqi: falta configurar uno o más secretos requeridos')
    return responder({ error: 'Webhook no configurado' }, 500)
  }

  const rawBody = await request.text()
  if (!await signatureIsValid(rawBody, webhookSecret, request.headers)) {
    return responder({ error: 'Firma de notificación no válida' }, 401)
  }

  let body: Json | null = null
  try {
    body = JSON.parse(rawBody) as Json | null
  } catch {
    body = null
  }
  if (!body || typeof body !== 'object') {
    return responder({ error: 'Notificación no válida' }, 400)
  }

  const data = body.data && typeof body.data === 'object'
    ? body.data as Json
    : {}
  const chargeId = text(data.id) ||
    text(data.charge_id) ||
    text(body.data_id)

  if (!chargeId.startsWith('chr_')) {
    return responder({ ok: true, ignored: true })
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  try {
    const culqiResponse = await fetch(`${CULQI_CHARGES_URL}/${encodeURIComponent(chargeId)}`, {
      headers: { Authorization: `Bearer ${privateKey}` },
      signal: AbortSignal.timeout(10000)
    })
    const charge = await culqiResponse.json().catch(() => null) as Json | null

    if (!culqiResponse.ok || !charge || text(charge.id) !== chargeId) {
      console.error('webhook-culqi: no se pudo verificar el cargo en Culqi', culqiResponse.status)
      return responder({ error: 'No se pudo verificar el cargo' }, 502)
    }

    const mapeado = mapChargeState(charge)
    const eventKey = text(body.id) || `culqi:${chargeId}:${mapeado.estado}:${text(charge.creation_date)}`

    const { error: insertError } = await admin
      .from('pagos_eventos_culqi')
      .insert({
        event_key: eventKey,
        tipo: text(body.type) || null,
        culqi_charge_id: chargeId,
        payload: {
          id: body.id ?? null,
          type: body.type ?? null,
          creation_date: body.creation_date ?? null,
          charge: safeChargePayload(charge)
        }
      })

    if (insertError?.code === '23505') {
      return responder({ ok: true, duplicate: true })
    }

    const metadata = charge.metadata && typeof charge.metadata === 'object'
      ? charge.metadata as Json
      : {}
    const pedidoId = text(metadata.pedido_id)

    let pago: Json | null = null
    const { data: pagoPorCargo } = await admin
      .from('pagos_culqi')
      .select('id, id_pedido, monto, moneda, estado')
      .eq('culqi_charge_id', chargeId)
      .maybeSingle()
    pago = pagoPorCargo as Json | null

    if (!pago && pedidoId) {
      const { data: pagoPorPedido } = await admin
        .from('pagos_culqi')
        .select('id, id_pedido, monto, moneda, estado')
        .eq('id_pedido', pedidoId)
        .maybeSingle()
      pago = pagoPorPedido as Json | null
    }

    if (!pago) {
      return responder({ ok: true, ignored: true, reason: 'pago_no_encontrado' })
    }

    const esperado = Math.round(Number(pago.monto) * 100)
    const moneda = text(charge.currency_code).toUpperCase()
    if (Number(charge.amount) !== esperado || (moneda && moneda !== 'PEN')) {
      console.error('webhook-culqi: monto o moneda no coinciden', {
        esperado,
        recibido: charge.amount,
        moneda
      })
      await admin.from('pagos_eventos_culqi')
        .update({ error: 'monto_moneda_no_coinciden' })
        .eq('event_key', eventKey)
      return responder({ error: 'El monto del cargo no coincide' }, 400)
    }

    const source = charge.source && typeof charge.source === 'object'
      ? charge.source as Json
      : {}

    const { error: aplicarError } = await admin.rpc('bb_aplicar_estado_culqi', {
      p_charge_id: chargeId,
      p_estado: mapeado.estado,
      p_source_type: text(source.type) || null,
      p_payload: safeChargePayload(charge),
      p_external_reference: pedidoId || null
    })

    if (aplicarError) {
      console.error('webhook-culqi: no se pudo aplicar el estado', aplicarError)
      await admin.from('pagos_eventos_culqi')
        .update({ error: String(aplicarError.message || aplicarError) })
        .eq('event_key', eventKey)
      return responder({ error: 'No se pudo aplicar el estado del cargo' }, 500)
    }

    await admin.from('pagos_eventos_culqi')
      .update({ procesado: true, actualizado_en: new Date().toISOString() })
      .eq('event_key', eventKey)

    return responder({ ok: true, estado: mapeado.estado })
  } catch (error) {
    console.error('webhook-culqi:', error)
    return responder({ error: 'No se pudo procesar la notificación' }, 500)
  }
})
