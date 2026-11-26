// Interruptor de emergencia de Culqi. Por defecto queda desactivado:
// mientras no haya tokens de producción aprobados, ninguna Edge Function
// relacionada con Culqi procesa solicitudes ni notificaciones.
export function culqiHabilitado(): boolean {
  return (Deno.env.get('CULQI_HABILITADO') ?? 'false').toLowerCase() === 'true'
}
