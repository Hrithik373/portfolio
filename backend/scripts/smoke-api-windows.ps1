# Quick probes against a *running* backend (default npm run dev:server → port 8787).
# Usage: powershell -File backend/scripts/smoke-api-windows.ps1
#        $env:API_PORT = 8791; powershell -File backend/scripts/smoke-api-windows.ps1

$ErrorActionPreference = 'Stop'
$port = if ($env:API_PORT) { $env:API_PORT } else { '8787' }
$base = "http://127.0.0.1:$port"

Write-Host "Probing $base ..." -ForegroundColor Cyan

try {
  $health = Invoke-RestMethod -Uri "$base/api/health" -Method Get
  Write-Host "[health] OK" $health
} catch {
  Write-Host "[health] FAILED — is the backend running? (npm run dev or npm run dev:server)" -ForegroundColor Red
  throw
}

try {
  $tp = Invoke-RestMethod -Uri "$base/api/transcribe-preview" -Method Get
  Write-Host "[transcribe-preview GET] OK" $tp
} catch {
  Write-Host "[transcribe-preview GET] FAILED" -ForegroundColor Red
  throw
}

Write-Host ""
Write-Host "Optional: multipart POST is easier from Node — run: npm run test:api" -ForegroundColor DarkGray
Write-Host "Done." -ForegroundColor Green
