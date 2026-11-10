import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CULQI_CHARGES_URL = 'https://api.culqi.com/v2/charges'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
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
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const privateKey = Deno.env.get('CULQI_PRIVATE_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!privateKey || !supabaseUrl || !serviceKey) {
    console.error('webhook-culqi: falta configurar uno o más secretos requeridos')
    return json({ error: 'Webhook no configurado' }, 500)
  }

  const body = await request.json().catch(() => null) as Json | null
  if (!body || typeof body !== 'object') {
    return json({ error: 'Notificación no válida' }, 400)
  }

  const data = body.data && typeof body.data === 'object'
    ? body.data as Json
    : {}
  const chargeId = text(data.id) ||
    text(data.charge_id) ||
    text(body.data_id)

  if (!chargeId.startsWith('chr_')) {
    return json({ ok: true, ignored: true })
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
      return json({ error: 'No se pudo verificar el cargo' }, 502)
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
      return json({ ok: true, duplicate: true })
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
      return json({ ok: true, ignored: true, reason: 'pago_no_encontrado' })
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
      return json({ error: 'El monto del cargo no coincide' }, 400)
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
      return json({ error: 'No se pudo aplicar el estado del cargo' }, 500)
    }

    await admin.from('pagos_eventos_culqi')
      .update({ procesado: true, actualizado_en: new Date().toISOString() })
      .eq('event_key', eventKey)

    return json({ ok: true, estado: mapeado.estado })
  } catch (error) {
    console.error('webhook-culqi:', error)
    return json({ error: 'No se pudo procesar la notificación' }, 500)
  }
})
