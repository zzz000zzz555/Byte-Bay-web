import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const palabras = mensaje.split(/\s+/).filter(palabra => palabra.length >= 3).slice(0, 4)
    let consulta = db.from('catalogo_productos').select('id,nombre,categoria,marca,precio_venta,existencias,disponibilidad,porcentaje_descuento').limit(30)
    if (palabras.length) consulta = consulta.or(palabras.map(palabra => `nombre.ilike.%${palabra}%,categoria.ilike.%${palabra}%,marca.ilike.%${palabra}%`).join(','))
    const { data: catalogo, error: catalogoError } = await consulta
    if (catalogoError) throw new Error('No se pudo consultar el catálogo')
    const productos = catalogo?.length ? catalogo : (await db.from('catalogo_productos').select('id,nombre,categoria,marca,precio_venta,existencias,disponibilidad,porcentaje_descuento').limit(20)).data || []
    const contexto = productos.map(producto => `#${producto.id} | ${producto.nombre} | ${producto.categoria} | ${producto.marca || 'Sin marca'} | S/${producto.precio_venta} | stock ${producto.existencias} | ${producto.disponibilidad} | descuento ${producto.porcentaje_descuento}%`).join('\n')

    const respuesta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash'}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'Eres Asistente Byte, asesor de compras de Byte Bay. Responde siempre en español peruano, de forma amable y breve. No saludes de nuevo: responde directamente la pregunta. Solo usa el catálogo proporcionado: no inventes precio, stock ni características. Recomienda máximo 3 productos, indica nombre y precio. Si preguntan por ofertas y no hay descuento, dilo claramente y luego sugiere productos disponibles de la categoría consultada. Si no existe una coincidencia, dilo y sugiere categoría o búsqueda. No solicites contraseñas, tarjetas, DNI ni datos sensibles.' }] },
        contents: [{ role: 'user', parts: [{ text: `Pregunta del cliente: ${mensaje}\n\nCatálogo disponible:\n${contexto}` }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
      }),
    })
    const resultado = await respuesta.json()
    if (!respuesta.ok) throw new Error(resultado?.error?.message || 'Gemini no pudo responder en este momento')
    const texto = resultado.candidates?.[0]?.content?.parts?.map((parte: { text?: string }) => parte.text || '').join('').trim()
    if (!texto) throw new Error('La IA no devolvió una respuesta')
    const recomendados = productos.filter(producto => Number(producto.existencias) > 0).slice(0, 3)
    const detalleCatalogo = recomendados.length ? `\n\nOpciones disponibles en Byte Bay:\n${recomendados.map(producto => `• ${producto.nombre} — S/${producto.precio_venta} (${producto.existencias} disponibles)`).join('\n')}` : ''
    return Response.json({ respuesta: texto + detalleCatalogo, productos: recomendados }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error.message || 'Error inesperado' }, { status: 400, headers: corsHeaders })
  }
})
