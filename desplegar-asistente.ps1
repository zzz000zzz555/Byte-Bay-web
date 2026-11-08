# Despliega la Edge Function del asistente de IA de Byte Bay en Supabase.
# Uso:  .\desplegar-asistente.ps1
# Uso sin abrir navegador:  $env:SUPABASE_ACCESS_TOKEN='sbp_...'; .\desplegar-asistente.ps1

$ErrorActionPreference = 'Stop'
$proyecto = 'inwugycvtaaceugvtfpv'
$funcion  = 'asistente-bytebay'
Set-Location $PSScriptRoot

Write-Host '1/4  Verificando Supabase CLI...' -ForegroundColor Cyan
supabase --version

Write-Host '2/4  Verificando sesion...' -ForegroundColor Cyan
if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Host 'Se abrira el navegador para autorizar el CLI. Inicia sesion con la cuenta duena del proyecto.' -ForegroundColor Yellow
  supabase login
} else {
  Write-Host 'Usando SUPABASE_ACCESS_TOKEN de la sesion.' -ForegroundColor Green
}

Write-Host '3/4  Revisando secretos del proyecto...' -ForegroundColor Cyan
supabase secrets list --project-ref $proyecto

Write-Host "4/4  Desplegando la funcion $funcion..." -ForegroundColor Cyan
supabase functions deploy $funcion --project-ref $proyecto

Write-Host ''
Write-Host 'Listo. La funcion fue desplegada.' -ForegroundColor Green
Write-Host 'Prueba el asistente en la web con Ctrl+F5 para saltar la cache.' -ForegroundColor Green
