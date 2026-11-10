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
const digits = (value: unknown) => text(value).replace(/\D/g, '')

type Json = Record<string, unknown>

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

function chargeSucceeded(charge: Json) {
  const state = text(charge.state).toLowerCase()
  const responseCode = text(charge.response_code).toLowerCase()
  const outcome = charge.outcome && typeof charge.outcome === 'object'
    ? charge.outcome as Json
    : {}
  const outcomeType = text(outcome.type).toLowerCase()
  return state === 'exitosa' ||
    responseCode === 'venta_exitosa' ||
    outcomeType === 'venta_exitosa'
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
  if (!privateKey) {
    console.error('cobrar-culqi: falta CULQI_PRIVATE_KEY en los secretos de Edge Functions')
    return json({ error: 'El pago no está configurado todavía. Contacta con la tienda.' }, 500, headers)
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return json({ error: 'Solicitud no válida' }, 400, headers)
    }

    const entrada = body as Json
    const sesionToken = text(entrada.sesion_token).replace(/\\s+/g, '')
    const pedidoId = text(entrada.pedido_id)
    const token = text(entrada.token)

    if (!sesionToken || sesionToken.length > 5000) {
      return json({ error: 'Inicia sesión para completar el pago' }, 401, headers)
    }
    if (!UUID.test(pedidoId)) return json({ error: 'Pedido no válido' }, 400, headers)
    if (!token || token.length > 200) return json({ error: 'Token de tarjeta no válido' }, 400, headers)

    const { data: sesion, error: sesionError } = await admin.rpc('bb_validar_sesion', {
      p_access_token: sesionToken
    })
    if (sesionError) {
      console.error('cobrar-culqi: no se pudo validar la sesión Byte Bay', sesionError)
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
      .select('id, numero_pedido, correo_cliente, total, estado, estado_pago, id_cuenta_cliente, direccion_envio')
      .eq('id', pedidoId)
      .eq('id_cuenta_cliente', customerId)
      .maybeSingle()

    if (pedidoError) {
      console.error('cobrar-culqi: no se pudo cargar el pedido', pedidoError)
      return json({ error: 'No se pudo consultar el pedido' }, 503, headers)
    }
    if (!pedido) return json({ error: 'Pedido no encontrado' }, 404, headers)

    const { data: pago, error: pagoError } = await admin
      .from('pagos_culqi')
      .select('id, estado, monto, moneda, expira_en, idempotency_key, culqi_charge_id')
      .eq('id_pedido', pedidoId)
      .maybeSingle()

    if (pagoError) {
      console.error('cobrar-culqi: no se pudo cargar el pago', pagoError)
      return json({ error: 'No se pudo consultar el pago' }, 503, headers)
    }
    if (!pago) return json({ error: 'No encontramos un pago asociado a este pedido' }, 404, headers)

    if (pago.estado === 'aprobado') {
      return json({
        ok: true,
        estado: 'aprobado',
        numero_pedido: text(pedido.numero_pedido),
        sin_cambios: true
      }, 200, headers)
    }
    if (pago.estado !== 'pendiente') {
      return json({
        error: 'Este intento de pago ya no está vigente. Vuelve a iniciar la compra.',
        estado: pago.estado
      }, 409, headers)
    }
    if (new Date(pago.expira_en).getTime() <= Date.now()) {
      return json({
        error: 'El tiempo para completar el pago terminó. Vuelve a iniciar la compra.',
        estado: 'expirado'
      }, 409, headers)
    }

    const montoCentimos = Math.round(Number(pago.monto) * 100)
    if (!Number.isSafeInteger(montoCentimos) || montoCentimos <= 0) {
      return json({ error: 'El monto del pedido no es válido' }, 500, headers)
    }

    const envio = pedido.direccion_envio && typeof pedido.direccion_envio === 'object'
      ? pedido.direccion_envio as Json
      : {}
    const nombrePartes = text(envio.nombre || pedido.correo_cliente).split(/\s+/).filter(Boolean)
    const telefono = digits(envio.telefono).slice(-9)
    const documento = digits(envio.documento)

    const chargeBody: Json = {
      amount: montoCentimos,
      currency_code: 'PEN',
      email: text(pedido.correo_cliente),
      source_id: token,
      description: `Pedido ${text(pedido.numero_pedido)} · Byte Bay`,
      installments: 0,
      metadata: {
        pedido_id: text(pedido.id),
        numero_pedido: text(pedido.numero_pedido),
        external_reference: text(pedido.id)
      },
      antifraud_details: {
        first_name: nombrePartes[0] || 'Cliente',
        last_name: nombrePartes.slice(1).join(' ') || 'Byte Bay',
        email: text(pedido.correo_cliente),
        address: text(envio.direccion),
        address_city: text(envio.direccion),
        country_code: 'PE',
        phone_number: telefono
      }
    }
    if (documento.length >= 8) chargeBody.antifraud_details = {
      ...(chargeBody.antifraud_details as Json),
      document_number: documento
    }

    let culqiResponse: Response
    try {
      culqiResponse = await fetch(CULQI_CHARGES_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${privateKey}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': text(pago.idempotency_key)
        },
        body: JSON.stringify(chargeBody),
        signal: AbortSignal.timeout(30000)
      })
    } catch (networkError) {
      console.error('cobrar-culqi: no se pudo contactar a Culqi', networkError)
      return json({
        error: 'No pudimos confirmar el cobro. No vuelvas a pagar todavía; intentaremos verificar el estado en unos segundos.',
        codigo: 'AMBIGUO'
      }, 502, headers)
    }

    const culqiData = await culqiResponse.json().catch(() => null) as Json | null

    if (!culqiResponse.ok || !culqiData) {
      const errorData = culqiData ?? {}
      const tipo = text(errorData.type).toLowerCase()
      const mensaje = text(errorData.user_message) ||
        text(errorData.merchant_message) ||
        'El pago no se pudo completar. Revisa los datos de tu tarjeta e inténtalo nuevamente.'

      console.error('cobrar-culqi: Culqi respondió', culqiResponse.status, errorData)

      if (culqiResponse.status === 401 || culqiResponse.status === 403 || tipo === 'authentication_error') {
        await admin.rpc('bb_liberar_pedido_culqi', {
          p_pago_id: pago.id,
          p_motivo: 'error_credenciales',
          p_payload: errorData
        })
        return json({ error: 'El pago no está disponible en este momento. Inténtalo más tarde.' }, 503, headers)
      }

      if (culqiResponse.status >= 500) {
        return json({
          error: 'Culqi no respondió correctamente. No vuelvas a pagar todavía; intentaremos verificar el estado.',
          codigo: 'AMBIGUO'
        }, 502, headers)
      }

      const { error: liberarError } = await admin.rpc('bb_liberar_pedido_culqi', {
        p_pago_id: pago.id,
        p_motivo: 'rechazado',
        p_payload: errorData
      })
      if (liberarError) {
        console.error('cobrar-culqi: no se pudo liberar el pedido rechazado', liberarError)
      }

      return json({
        ok: false,
        estado: 'rechazado',
        error: mensaje,
        codigo: text(errorData.code) || null,
        codigo_rechazo: text(errorData.declined_code) || null
      }, 200, headers)
    }

    const chargeId = text(culqiData.id)
    const source = culqiData.source && typeof culqiData.source === 'object'
      ? culqiData.source as Json
      : {}
    const sourceType = text(source.type) || 'card'
    const amount = Number(culqiData.amount)
    const currency = text(culqiData.currency_code).toUpperCase()

    if (!chargeId) {
      console.error('cobrar-culqi: Culqi devolvió un cargo sin id', culqiData)
      return json({ error: 'Culqi devolvió una respuesta no válida. Intenta nuevamente.' }, 502, headers)
    }

    if (amount !== montoCentimos || (currency && currency !== 'PEN')) {
      console.error('cobrar-culqi: el monto o la moneda del cargo no coinciden', {
        esperado: montoCentimos,
        recibido: amount,
        moneda: currency
      })
      await admin.from('pagos_culqi')
        .update({
          culqi_charge_id: chargeId,
          estado: 'revision',
          observacion: 'El monto o la moneda del cargo no coinciden con el pedido',
          ultimo_payload: safeChargePayload(culqiData),
          actualizado_en: new Date().toISOString()
        })
        .eq('id', pago.id)
      return json({
        error: 'El cobro quedó en revisión. Te contactaremos para confirmarlo.',
        codigo: 'REVISION'
      }, 502, headers)
    }

    if (chargeSucceeded(culqiData)) {
      const { data: aplicado, error: aplicarError } = await admin.rpc('bb_aplicar_estado_culqi', {
        p_charge_id: chargeId,
        p_estado: 'aprobado',
        p_source_type: sourceType,
        p_payload: safeChargePayload(culqiData),
        p_external_reference: text(pedido.id)
      })
      if (aplicarError) {
        console.error('cobrar-culqi: no se pudo aplicar el pago aprobado', aplicarError)
        return json({ error: 'El pago se registró pero no se pudo confirmar el pedido. Te contactaremos.' }, 500, headers)
      }
      return json({
        ok: true,
        estado: text(aplicado?.estado) || 'aprobado',
        numero_pedido: text(pedido.numero_pedido),
        charge_id: chargeId
      }, 200, headers)
    }

    // Cargos pendientes (por ejemplo Yape u otros medios asíncronos).
    const { error: registrarError } = await admin.rpc('bb_registrar_cargo_culqi', {
      p_pago_id: pago.id,
      p_charge_id: chargeId,
      p_source_type: sourceType,
      p_estado: text(culqiData.state) || 'Pendiente',
      p_response_code: text(culqiData.response_code) || null,
      p_payload: safeChargePayload(culqiData)
    })
    if (registrarError) {
      console.error('cobrar-culqi: no se pudo registrar el cargo pendiente', registrarError)
    }

    return json({
      ok: true,
      estado: 'pendiente',
      numero_pedido: text(pedido.numero_pedido),
      charge_id: chargeId
    }, 200, headers)
  } catch (error) {
    console.error('cobrar-culqi:', error)
    return json({ error: 'No se pudo completar el pago. Intenta nuevamente.' }, 500, headers)
  }
})
