import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const bucket = 'reclamos-evidencias'
const maxFileSize = 5 * 1024 * 1024
const mimeExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf'
}
const allowedOrigins = new Set(
  (Deno.env.get('SITE_URL') ?? 'http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .map(value => {
      try { return new URL(value).origin } catch { return '' }
    })
    .filter(Boolean)
)
const value = (form: FormData, key: string) => {
  const field = form.get(key)
  return typeof field === 'string' ? field.trim() : ''
}
const archivoCoincideConTipo = async (archivo: File, tipo: string) => {
  const bytes = new Uint8Array(await archivo.slice(0, 12).arrayBuffer())
  if (tipo === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (tipo === 'image/png') return bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
  if (tipo === 'image/webp') {
    return new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
      new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  }
  if (tipo === 'application/pdf') return new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'
  return false
}

Deno.serve(async request => {
  const origin = request.headers.get('origin') ?? ''
  let originAllowed = origin === ''
  if (origin) {
    try { originAllowed = allowedOrigins.has(new URL(origin).origin) } catch { originAllowed = false }
  }
  const corsHeaders = {
    'Access-Control-Allow-Origin': originAllowed ? (origin || '*') : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  }
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!originAllowed) return Response.json({ error: 'Origen no autorizado' }, { status: 403, headers: corsHeaders })
  if (request.method !== 'POST') return Response.json({ error: 'Método no permitido' }, { status: 405, headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) {
    return Response.json({ error: 'La función no tiene configurado su acceso al servicio' }, { status: 500, headers: corsHeaders })
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      if (body?.action !== 'obtener_evidencia') {
        return Response.json({ error: 'Acción no válida' }, { status: 400, headers: corsHeaders })
      }
      const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
      if (!token) return Response.json({ error: 'Sesión requerida' }, { status: 401, headers: corsHeaders })
      const { data: caller, error: callerError } = await admin.auth.getUser(token)
      if (callerError || !caller.user) return Response.json({ error: 'Sesión no válida' }, { status: 401, headers: corsHeaders })
      const { data: staff, error: staffError } = await admin
        .from('personal')
        .select('rol,activo')
        .eq('id_usuario', caller.user.id)
        .maybeSingle()
      if (staffError) throw staffError
      if (!staff?.activo || !['jefe', 'empleado'].includes(staff.rol)) {
        return Response.json({ error: 'Sin permiso para consultar evidencias' }, { status: 403, headers: corsHeaders })
      }
      const path = typeof body.evidence_path === 'string' ? body.evidence_path : ''
      if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i.test(path)) {
        return Response.json({ error: 'Ruta de evidencia no válida' }, { status: 400, headers: corsHeaders })
      }
      const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 300)
      if (error) throw error
      return Response.json({ signed_url: data.signedUrl }, { headers: corsHeaders })
    }

    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return Response.json({ error: 'Se esperaba un formulario multipart' }, { status: 415, headers: corsHeaders })
    }
    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (contentLength > maxFileSize + 64 * 1024) {
      return Response.json({ error: 'El archivo no debe superar 5 MB' }, { status: 413, headers: corsHeaders })
    }

    const form = await request.formData()
    const nombre = value(form, 'nombre')
    const documento = value(form, 'documento')
    const correo = value(form, 'correo').toLowerCase()
    const telefono = value(form, 'telefono')
    const tipo = value(form, 'tipo')
    const categoria = value(form, 'categoria')
    const descripcion = value(form, 'descripcion')
    const numeroPedido = value(form, 'pedido')
    const montoTexto = value(form, 'monto')
    const archivo = form.get('evidencia')

    if (nombre.length < 2 || nombre.length > 200 ||
      documento.length < 6 || documento.length > 20 ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo) ||
      telefono.length > 30 || numeroPedido.length > 40 ||
      !['queja', 'reclamo'].includes(tipo) ||
      !['servicio', 'producto', 'facturacion', 'entrega'].includes(categoria) ||
      descripcion.length < 10 || descripcion.length > 10000) {
      return Response.json({ error: 'Revisa los datos obligatorios del reclamo' }, { status: 400, headers: corsHeaders })
    }
    const monto = montoTexto ? Number(montoTexto) : null
    if (monto !== null && (!Number.isFinite(monto) || monto < 0)) {
      return Response.json({ error: 'El monto debe ser un número no negativo' }, { status: 400, headers: corsHeaders })
    }

    let evidenciaPath: string | null = null
    if (archivo instanceof File && archivo.name !== '') {
      const extension = mimeExtensions[archivo.type]
      if (!extension || archivo.size < 1 || archivo.size > maxFileSize) {
        return Response.json({ error: 'La evidencia debe ser JPG, PNG, WEBP o PDF y pesar hasta 5 MB' }, { status: 400, headers: corsHeaders })
      }
      if (!await archivoCoincideConTipo(archivo, archivo.type)) {
        return Response.json({ error: 'El contenido del archivo no coincide con su formato declarado' }, { status: 400, headers: corsHeaders })
      }
      evidenciaPath = `${crypto.randomUUID()}.${extension}`
      const { error } = await admin.storage.from(bucket).upload(evidenciaPath, archivo, {
        contentType: archivo.type,
        upsert: false
      })
      if (error) throw error
    } else if (archivo !== null && !(archivo instanceof File && archivo.size === 0)) {
      return Response.json({ error: 'El archivo de evidencia no es válido' }, { status: 400, headers: corsHeaders })
    }

    const { data: codigo, error: insertError } = await admin.rpc('enviar_reclamo', {
      p_cliente_nombre: nombre,
      p_cliente_dni_ce: documento,
      p_cliente_email: correo,
      p_cliente_telefono: telefono || null,
      p_tipo_reclamo: tipo,
      p_categoria_reclamo: categoria,
      p_descripcion_reclamo: descripcion,
      p_monto_involucrado: monto,
      p_pedido_relacionado_id: numeroPedido || null,
      p_evidencia_url: evidenciaPath
    })
    if (insertError) {
      if (evidenciaPath) {
        const { error: cleanupError } = await admin.storage.from(bucket).remove([evidenciaPath])
        if (cleanupError) {
          console.error('No se pudo limpiar la evidencia tras un error de base de datos:', cleanupError)
        }
      }
      if (insertError.message.includes('límite de reclamaciones')) {
        return Response.json({ error: 'Se alcanzó el límite de reclamaciones por correo. Intenta más tarde.' }, { status: 429, headers: corsHeaders })
      }
      if (insertError.message.includes('número de pedido')) {
        return Response.json({ error: 'No encontramos ese número de pedido' }, { status: 400, headers: corsHeaders })
      }
      throw insertError
    }
    return Response.json({ codigo_reclamacion: codigo }, { headers: corsHeaders })
  } catch (error) {
    console.error('Public claims function:', error)
    return Response.json({ error: 'No se pudo procesar la solicitud. Intenta nuevamente.' }, { status: 500, headers: corsHeaders })
  }
})
