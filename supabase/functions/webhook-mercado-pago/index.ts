import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ORDERS_URL = 'https://api.mercadopago.com/v1/orders'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })

const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index++) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

async function signatureIsValid(signature: string, requestId: string, dataId: string, secret: string) {
  const fields = new Map<string, string>()
  for (const part of signature.split(',')) {
    const separator = part.indexOf('=')
    if (separator >= 0) {
      fields.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim())
    }
  }
  const timestamp = fields.get('ts') || ''
  const receivedHash = (fields.get('v1') || '').toLowerCase()
  if (!/^\d+$/.test(timestamp) || !/^[a-f0-9]{64}$/.test(receivedHash)) return false

  const normalizedId = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(dataId)
    ? dataId.toLowerCase()
    : dataId
  const manifest = `id:${normalizedId};request-id:${requestId};ts:${timestamp};`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest)))
  const expectedHash = [...digest].map(value => value.toString(16).padStart(2, '0')).join('')
  return constantTimeEqual(receivedHash, expectedHash)
}

function safeOrderPayload(order: Record<string, unknown>) {
  return {
    id: order.id,
    status: order.status,
    status_detail: order.status_detail,
    external_reference: order.external_reference,
    total_amount: order.total_amount,
    total_paid_amount: order.total_paid_amount,
    currency: order.currency ?? order.currency_id,
    last_updated_date: order.last_updated_date
  }
}

Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const secret = Deno.env.get('MP_WEBHOOK_SECRET')
  const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!secret || !mpToken || !supabaseUrl || !serviceKey) {
    console.error('webhook-mercado-pago: falta configurar uno o más secretos requeridos')
    return json({ error: 'Webhook no configurado' }, 500)
  }

  const url = new URL(request.url)
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const data = body?.data && typeof body.data === 'object'
    ? body.data as Record<string, unknown>
    : {}
  const dataId = text(url.searchParams.get('data.id')) || text(data.id)
  const eventType = text(body?.type) || text(url.searchParams.get('type')) || text(url.searchParams.get('topic'))

  if (!['order', 'orders'].includes(eventType.toLowerCase())) return json({ ok: true, ignored: true })
  if (!dataId) return json({ error: 'Notificación sin identificador de orden' }, 400)

  const requestId = request.headers.get('x-request-id') || ''
  const signature = request.headers.get('x-signature') || ''
  if (!requestId || !signature || !(await signatureIsValid(signature, requestId, dataId, secret))) {
    return json({ error: 'Firma de notificación no válida' }, 401)
  }

  const signatureVersion = signature.split(',').map(part => part.trim()).find(part => part.startsWith('v1=')) || ''
  const eventKey = `order:${dataId}:${requestId || signatureVersion}`
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const eventPayload = {
    id: body?.id ?? null,
    type: eventType,
    action: body?.action ?? null,
    data_id: dataId
  }

  const { data: insertedEvent, error: insertError } = await admin
    .from('pagos_eventos_mp')
    .insert({
      event_key: eventKey,
      tipo: eventType,
      accion: text(body?.action) || null,
      mp_order_id: dataId,
      payload: eventPayload,
      firma_valida: true
    })
    .select('id')
    .maybeSingle()

  let eventId = insertedEvent?.id
  if (insertError?.code === '23505') {
    const { data: existingEvent, error: existingError } = await admin
      .from('pagos_eventos_mp')
      .select('id, procesado')
      .eq('event_key', eventKey)
      .maybeSingle()
    if (existingError) {
      console.error('webhook-mercado-pago: no se pudo consultar el evento')
      return json({ error: 'No se pudo registrar la notificación' }, 503)
    }
    if (existingEvent?.procesado) return json({ ok: true, duplicate: true })
    eventId = existingEvent?.id
  } else if (insertError || !eventId) {
    console.error('webhook-mercado-pago: no se pudo registrar el evento', insertError)
    return json({ error: 'No se pudo registrar la notificación' }, 503)
  }
  if (!eventId) return json({ error: 'No se pudo identificar la notificación' }, 503)

  const recordEventError = async (message: string) => {
    if (eventId) {
      await admin
        .from('pagos_eventos_mp')
        .update({ error: message, actualizado_en: new Date().toISOString() })
        .eq('id', eventId)
    }
  }

  let mpResponse: Response
  try {
    mpResponse = await fetch(`${MP_ORDERS_URL}/${encodeURIComponent(dataId)}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
      signal: AbortSignal.timeout(10000)
    })
  } catch (error) {
    console.error('webhook-mercado-pago: no se pudo consultar la orden')
    await recordEventError(error instanceof Error ? error.message : 'Error de conexión')
    return json({ error: 'No se pudo consultar la orden' }, 503)
  }

  const order = await mpResponse.json().catch(() => null) as Record<string, unknown> | null
  if (!mpResponse.ok || !order) {
    console.error('webhook-mercado-pago: Mercado Pago no devolvió la orden', mpResponse.status)
    await recordEventError(`consulta_mp_${mpResponse.status}`)
    return json({ error: 'No se pudo verificar la orden' }, 503)
  }
  if (text(order.id) !== dataId) {
    await recordEventError('identificador_de_orden_no_coincide')
    return json({ ok: true, ignored: true })
  }

  const externalReference = text(order.external_reference)
  if (!externalReference) {
    await recordEventError('external_reference_ausente')
    return json({ ok: true, ignored: true })
  }

  const { data: payment, error: paymentError } = await admin
    .from('pagos_mercado_pago')
    .select('id, monto, moneda, external_reference, mp_order_id')
    .eq('external_reference', externalReference)
    .maybeSingle()
  if (paymentError) {
    console.error('webhook-mercado-pago: no se pudo buscar el pago')
    await recordEventError('consulta_pago_fallida')
    return json({ error: 'No se pudo verificar el pago' }, 503)
  }
  if (!payment) {
    await recordEventError('pago_no_encontrado')
    return json({ ok: true, ignored: true })
  }
  if (payment.mp_order_id && payment.mp_order_id !== dataId) {
    await recordEventError('orden_no_coincide')
    console.error('webhook-mercado-pago: la orden no coincide con el pago registrado')
    return json({ ok: true, ignored: true })
  }

  const status = text(order.status)
  const statusDetail = text(order.status_detail) || null
  if (status === 'processed' && statusDetail !== 'refunded') {
    const total = Number(order.total_amount)
    const paid = order.total_paid_amount == null ? total : Number(order.total_paid_amount)
    const currency = text(order.currency ?? order.currency_id).toUpperCase()
    const expectedCents = Math.round(Number(payment.monto) * 100)
    if (
      !Number.isFinite(total) ||
      !Number.isFinite(paid) ||
      Math.round(total * 100) !== expectedCents ||
      Math.round(paid * 100) !== expectedCents ||
      currency !== String(payment.moneda).toUpperCase()
    ) {
      await recordEventError('monto_o_moneda_no_coincide')
      console.error('webhook-mercado-pago: monto o moneda no coinciden con el pago registrado')
      return json({ ok: true, review: true })
    }
  }

  const safePayload = safeOrderPayload(order)
  const { error: applyError } = await admin.rpc('bb_aplicar_estado_pago', {
    p_mp_order_id: dataId,
    p_mp_status: status,
    p_mp_status_detail: statusDetail,
    p_payload: safePayload,
    p_external_reference: externalReference
  })
  if (applyError) {
    console.error('webhook-mercado-pago: no se pudo aplicar el estado del pago', applyError)
    await recordEventError('actualizacion_pago_fallida')
    return json({ error: 'No se pudo actualizar el estado del pago' }, 503)
  }

  const { error: updateEventError } = await admin
    .from('pagos_eventos_mp')
    .update({
      procesado: true,
      error: null,
      payload: safePayload,
      actualizado_en: new Date().toISOString()
    })
    .eq('id', eventId)
  if (updateEventError) {
    console.error('webhook-mercado-pago: no se pudo marcar el evento como procesado')
    return json({ error: 'No se pudo finalizar la notificación' }, 503)
  }

  return json({ ok: true })
})
