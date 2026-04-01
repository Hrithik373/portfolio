$h = @{ Authorization = 'Bearer I=X4Ev2yUZt2-eoIHjqiJ^YQ#RM#ePj1' }

Write-Host "`n=== 1. Health Check ===" -ForegroundColor Cyan
Invoke-RestMethod https://portfolio-api-gkcd.onrender.com/api/health | ConvertTo-Json

Write-Host "`n=== 2. Send Test Visitor ===" -ForegroundColor Cyan
$visitor = @{
  page       = 'desktop'
  _fp        = @{
    deviceId = 'test_persist_123'
    webgl     = @{ renderer = 'Test GPU' }
    hardware  = @{ cores = 8; memory = 16 }
    timezone  = @{ timezone = 'Asia/Kolkata' }
  }
  screenWidth  = 1920
  screenHeight = 1080
  language     = 'en-IN'
  referrer     = 'test'
} | ConvertTo-Json -Depth 4
Invoke-RestMethod https://portfolio-api-gkcd.onrender.com/api/visitor -Method POST -ContentType 'application/json' -Body $visitor | ConvertTo-Json

Write-Host "`n=== 3. Verify Visitor Saved ===" -ForegroundColor Cyan
(Invoke-RestMethod https://portfolio-api-gkcd.onrender.com/api/admin/visitors -Headers $h).summary | ConvertTo-Json

Write-Host "`n=== 4. Send Test Email (generates abuse + device data) ===" -ForegroundColor Cyan
$email = @{
  name    = 'Redis Test'
  email   = 'redisTest@gmail.com'
  subject = 'Persistence Test'
  message = 'Testing if data survives Render restart'
} | ConvertTo-Json
try {
  Invoke-RestMethod https://portfolio-api-gkcd.onrender.com/api/send-email -Method POST -ContentType 'application/json' -Body $email | ConvertTo-Json
} catch {
  Write-Host "Status: $($_.Exception.Response.StatusCode.Value__) (expected if SMTP not configured)"
}

Write-Host "`n=== 5. Verify Abuse Data ===" -ForegroundColor Cyan
(Invoke-RestMethod https://portfolio-api-gkcd.onrender.com/api/admin/abuse -Headers $h).summary | ConvertTo-Json

Write-Host "`n=== 6. Verify Device Data ===" -ForegroundColor Cyan
(Invoke-RestMethod https://portfolio-api-gkcd.onrender.com/api/admin/devices -Headers $h).summary | ConvertTo-Json

Write-Host "`n=== 7. Cache Status ===" -ForegroundColor Cyan
Invoke-RestMethod https://portfolio-api-gkcd.onrender.com/api/admin/cache/status -Headers $h | ConvertTo-Json

Write-Host "`n=== ALL DONE ===" -ForegroundColor Green
Write-Host "Note the counts above. Now trigger a Render redeploy, wait 2-3 min, then run test-redis-after-restart.ps1" -ForegroundColor Yellow
