import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type GeminiGenerateContentResponse = {
  error?: { message?: string; code?: number; status?: string }
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

const consultasPorOrigen = new Map<string, { cantidad: number; reiniciaEn: number }>()

function limitarConsulta(request: Request) {
  const origen = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocido'
  const ahora = Date.now(), registro = consultasPorOrigen.get(origen)
  if (!registro || registro.reiniciaEn < ahora) {
    consultasPorOrigen.set(origen, { cantidad: 1, reiniciaEn: ahora + 10 * 60 * 1000 })
    return
  }
  if (registro.cantidad >= 10) throw new Error('Alcanzaste el límite de consultas. Intenta nuevamente en unos minutos.')
  registro.cantidad += 1
}

function limpiarMensaje(valor: unknown) {
  return typeof valor === 'string' ? valor.trim().slice(0, 500) : ''
}

class ErrorGemini extends Error {
  constructor(message: string, readonly status: number, readonly reintentar: boolean = false) {
    super(message)
  }
}

const esperar = (milisegundos: number) => new Promise(resolve => setTimeout(resolve, milisegundos))

// Reintentos con espera exponencial + ruido aleatorio (jitter) para no chocar
// todos los usuarios contra Gemini al mismo tiempo durante un pico de demanda.
function esperaDeReintento(intento: number, cabeceraRetryAfter: string | null) {
  const segundos = Number(cabeceraRetryAfter)
  if (Number.isFinite(segundos) && segundos > 0) return Math.min(segundos * 1000, 3000)
  const base = Math.min(600 * 2 ** intento, 3000)
  return base + Math.floor(Math.random() * 400)
}

const ESTADOS_REINTENTABLES = [408, 429, 500, 502, 503, 504]

async function generarContenidoGemini(apiKey: string, contenido: unknown) {
  const configurados = [
    Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash',
    Deno.env.get('GEMINI_FALLBACK_MODEL') || 'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
  ]
  const modelos = [...new Set(configurados.map(modelo => modelo.replace(/^models\//, '').trim()).filter(Boolean))]
  const intentosPorModelo = 3
  let ultimoError = new Error('Gemini no pudo responder en este momento')
  let ultimoEstado = 503
  let huboLimiteDeUso = false
  let algunModeloRespondio = false

  for (const modelo of modelos) {
    for (let intento = 0; intento < intentosPorModelo; intento++) {
      let respuesta: Response
      try {
        respuesta = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify(contenido),
            signal: AbortSignal.timeout(20000),
          },
        )
      } catch {
        ultimoError = new Error('No se pudo conectar con Gemini')
        ultimoEstado = 503
        if (intento < intentosPorModelo - 1) await esperar(esperaDeReintento(intento, null))
        continue
      }

      let resultado: GeminiGenerateContentResponse
      try {
        resultado = await respuesta.json()
      } catch {
        ultimoError = new Error('Gemini devolvió una respuesta no válida')
        ultimoEstado = 502
        if (intento < intentosPorModelo - 1) await esperar(esperaDeReintento(intento, null))
        continue
      }

      if (respuesta.ok) {
        algunModeloRespondio = true
        return resultado
      }

      ultimoEstado = respuesta.status
      ultimoError = new Error(resultado.error?.message || 'Gemini no pudo responder en este momento')

      // Clave inválida o sin permisos: no tiene sentido reintentar ni cambiar de modelo.
      if (respuesta.status === 401 || respuesta.status === 403) {
        throw new ErrorGemini('La clave de Gemini no es válida o no tiene permisos.', 502)
      }

      // El modelo no existe o no está habilitado para esta clave: pasar al siguiente.
      if (respuesta.status === 404) break

      // 429 = cuota de la API agotada para este modelo. Otro modelo puede tener cuota propia.
      if (respuesta.status === 429) huboLimiteDeUso = true

      if (!ESTADOS_REINTENTABLES.includes(respuesta.status)) {
        throw new ErrorGemini('No se pudo procesar la solicitud con Gemini. Revisa la configuración del asistente.', 502)
      }

      if (intento < intentosPorModelo - 1) {
        await esperar(esperaDeReintento(intento, respuesta.headers.get('retry-after')))
      }
    }
  }

  console.error('Gemini no respondió con los modelos configurados:', ultimoEstado, ultimoError.message)

  if (huboLimiteDeUso) {
    throw new ErrorGemini(
      'El asistente alcanzó su límite de uso de Gemini por ahora. Inténtalo de nuevo en unos minutos.',
      429,
      true,
    )
  }
  if (ESTADOS_REINTENTABLES.includes(ultimoEstado)) {
    throw new ErrorGemini(
      'Gemini está saturado en este momento. Inténtalo de nuevo en unos segundos.',
      503,
      true,
    )
  }
  if (!algunModeloRespondio) {
    throw new ErrorGemini('No se pudo conectar con un modelo disponible de Gemini. Revisa GEMINI_MODEL y GEMINI_FALLBACK_MODEL.', 502)
  }
  throw new ErrorGemini('Gemini no pudo responder en este momento.', 502, true)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    if (request.method !== 'POST') throw new Error('Método no permitido')
    limitarConsulta(request)
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    const urlSupabase = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!apiKey || !urlSupabase || !serviceKey) throw new Error('El asistente aún no está configurado')

    const cuerpo = await request.json()
    const mensaje = limpiarMensaje(cuerpo.mensaje)
    if (!mensaje) throw new Error('Escribe una pregunta para el asistente')

    const db = createClient(urlSupabase, serviceKey)
    const IGNORADAS = new Set(['que', 'con', 'por', 'para', 'los', 'las', 'una', 'uno', 'unos', 'unas', 'del', 'como', 'mas', 'muy', 'hay', 'tienen', 'tienes', 'quiero', 'busco', 'necesito', 'hola', 'buenas', 'precio', 'precios', 'cuesta', 'algo', 'donde', 'esta', 'este', 'estos', 'estas', 'sobre', 'sin', 'sus', 'tambien', 'pero', 'solo', 'todo', 'todos', 'seria', 'podria', 'muestrame'])
    // Se limpian signos, se descartan palabras vacías y se prueban singular/plural.
    const terminos = [...new Set(
      mensaje
        .split(/\s+/)
        .map(palabra => palabra.replace(/[^\p{L}\p{N}]/gu, ''))
        .filter(palabra => palabra.length >= 3 && !IGNORADAS.has(palabra.toLowerCase()))
        .flatMap(palabra => {
          const variantes = [palabra]
          if (/s$/i.test(palabra) && palabra.length > 4) variantes.push(palabra.slice(0, -1))
          return variantes
        }),
    )].slice(0, 6)
    let consulta = db.from('catalogo_productos').select('id,nombre,categoria,marca,precio_venta,existencias,disponibilidad,porcentaje_descuento').limit(30)
    if (terminos.length) consulta = consulta.or(terminos.map(palabra => `nombre.ilike.%${palabra}%,categoria.ilike.%${palabra}%,marca.ilike.%${palabra}%`).join(','))
    const { data: catalogo, error: catalogoError } = await consulta
    if (catalogoError) throw new Error('No se pudo consultar el catálogo')
    const coincidencias = catalogo?.length ? catalogo : []
    const hayCoincidencias = coincidencias.length > 0
    const productos = hayCoincidencias
      ? coincidencias
      : (await db.from('catalogo_productos').select('id,nombre,categoria,marca,precio_venta,existencias,disponibilidad,porcentaje_descuento').limit(20)).data || []
    const listado = productos.map(producto => `#${producto.id} | ${producto.nombre} | ${producto.categoria} | ${producto.marca || 'Sin marca'} | S/${producto.precio_venta} | stock ${producto.existencias} | ${producto.disponibilidad} | descuento ${producto.porcentaje_descuento}%`).join('\n')
    const contexto = hayCoincidencias
      ? listado
      : `SIN COINCIDENCIAS para la búsqueda del cliente. Catálogo general de referencia:\n${listado}`

    const resultado = await generarContenidoGemini(apiKey, {
        systemInstruction: { parts: [{ text: 'Eres Asistente Byte, asesor de compras de Byte Bay. Responde siempre en español peruano, de forma amable y breve. No saludes de nuevo: responde directamente la pregunta. Solo usa el catálogo proporcionado: no inventes precio, stock ni características. Recomienda máximo 3 productos, indica nombre y precio. Si preguntan por ofertas y no hay descuento, dilo claramente y luego sugiere productos disponibles de la categoría consultada. Si no existe una coincidencia, dilo y sugiere categoría o búsqueda. No solicites contraseñas, tarjetas, DNI ni datos sensibles. Devuelve en "ids" los identificadores (#) de los productos que recomiendas, en el mismo orden en que los mencionas. Si no recomiendas ninguno, deja "ids" vacío.' }] },
        contents: [{ role: 'user', parts: [{ text: `Pregunta del cliente: ${mensaje}\n\nCatálogo disponible:\n${contexto}` }] }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              respuesta: { type: 'string' },
              ids: { type: 'array', items: { type: 'integer' } },
            },
            required: ['respuesta', 'ids'],
          },
        },
    })
    const crudo = resultado.candidates?.[0]?.content?.parts?.map((parte: { text?: string }) => parte.text || '').join('').trim()
    if (!crudo) throw new ErrorGemini('La IA no devolvió una respuesta. Inténtalo de nuevo.', 502, true)

    // La IA responde en JSON: texto para el cliente + ids exactos de los productos recomendados.
    let texto = crudo
    let ids: number[] = []
    try {
      const analizado = JSON.parse(crudo)
      if (typeof analizado?.respuesta === 'string' && analizado.respuesta.trim()) texto = analizado.respuesta.trim()
      if (Array.isArray(analizado?.ids)) ids = analizado.ids.map(Number).filter(Number.isFinite)
    } catch {
      // Si el modelo no devolvió JSON válido, se usa el texto tal cual y se buscan los nombres.
    }
    if (!texto) throw new ErrorGemini('La IA no devolvió una respuesta. Inténtalo de nuevo.', 502, true)

    const disponibles = hayCoincidencias ? coincidencias.filter(producto => Number(producto.existencias) > 0) : []
    const porId = new Map(disponibles.map(producto => [Number(producto.id), producto]))
    let recomendados = ids.map(id => porId.get(id)).filter((producto): producto is NonNullable<typeof producto> => Boolean(producto))

    // Respaldo: buscar el nombre exacto respetando límites de palabra (evita que
    // "Zapatillas urbanas 5" coincida dentro de "Zapatillas urbanas 50").
    if (!recomendados.length && disponibles.length) {
      const escapar = (valor: string) => valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      recomendados = disponibles
        .map(producto => ({ producto, posicion: texto.toLowerCase().indexOf(String(producto.nombre).toLowerCase()) }))
        .filter(item => item.posicion >= 0 && new RegExp(`(^|[^\\p{L}\\p{N}])${escapar(item.producto.nombre)}($|[^\\p{L}\\p{N}])`, 'iu').test(texto))
        .sort((a, b) => a.posicion - b.posicion)
        .map(item => item.producto)
    }

    return Response.json({ respuesta: texto, productos: recomendados.slice(0, 3) }, { headers: corsHeaders })
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error inesperado'
    const estado = error instanceof ErrorGemini ? error.status : 400
    const reintentar = error instanceof ErrorGemini ? error.reintentar : false
    return Response.json({ error: mensaje, reintentar }, { status: estado, headers: corsHeaders })
  }
})
