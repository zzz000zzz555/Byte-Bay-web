// Orígenes permitidos para las Edge Functions.
// Fuentes: SITE_URL y ALLOWED_ORIGINS (separadas por coma).
// Si no se configura ninguna, solo se admiten orígenes localhost de desarrollo;
// en producción debe configurarse SITE_URL o ALLOWED_ORIGINS.
// Nunca se devuelve '*': la comparación es exacta contra los orígenes derivados.
const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

function origenConfigurado(valor: string): string | null {
  try {
    const url = new URL(valor)
    const esLocal = HOSTS_LOCALES.has(url.hostname)
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && esLocal)) return null
    return url.origin
  } catch {
    return null
  }
}

function originsConfigurados(): Set<string> {
  const crudo = [Deno.env.get('SITE_URL'), Deno.env.get('ALLOWED_ORIGINS')]
    .filter(Boolean)
    .join(',')
  const origins = crudo
    .split(',')
    .map(valor => valor.trim())
    .filter(Boolean)
    .map(origenConfigurado)
    .filter((valor): valor is string => Boolean(valor))

  return new Set(origins)
}

const ORIGINS_PERMITIDOS = originsConfigurados()
// Sin secrets de origen configurados se admite cualquier puerto local de HTTP;
// en cuanto hay un origen configurado, la lista es exacta.
const MODO_DESARROLLO = ORIGINS_PERMITIDOS.size === 0

export function originAllowed(origin: string): boolean {
  if (!origin) return false
  try {
    const url = new URL(origin)
    // El header Origin del navegador es únicamente el origen: sin ruta, query ni userinfo.
    if (origin.trim().toLowerCase() !== url.origin) return false
    const esLocal = HOSTS_LOCALES.has(url.hostname)
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && esLocal)) return false
    if (MODO_DESARROLLO && esLocal && url.protocol === 'http:') return true
    return ORIGINS_PERMITIDOS.has(url.origin)
  } catch {
    return false
  }
}

// Valida una URL de redirección completa contra la misma whitelist de orígenes.
export function redirectUrlAllowed(value: string): boolean {
  const origin = origenConfigurado(value)
  if (!origin) return false
  if (MODO_DESARROLLO) {
    try {
      const url = new URL(value)
      if (HOSTS_LOCALES.has(url.hostname) && url.protocol === 'http:') return true
    } catch {
      return false
    }
  }
  return ORIGINS_PERMITIDOS.has(origin)
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  }
}

// Para respuestas rechazadas: sin Access-Control-Allow-Origin, solo Vary.
export const corsErrorHeaders: Record<string, string> = { 'Vary': 'Origin' }
