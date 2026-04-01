$h = @{ Authorization = 'Bearer I=X4Ev2yUZt2-eoIHjqiJ^YQ#RM#ePj1' }

Write-Host "`n=== POST-RESTART PERSISTENCE CHECK ===" -ForegroundColor Yellow

Write-Host "`nVisitors:" -ForegroundColor Cyan
(Invoke-RestMethod https://portfolio-api-gkcd.onrender.com/api/admin/visitors -Headers $h).summary | ConvertTo-Json

Write-Host "`nAbuse:" -ForegroundColor Cyan
(Invoke-RestMethod https://portfolio-api-gkcd.onrender.com/api/admin/abuse -Headers $h).summary | ConvertTo-Json

Write-Host "`nDevices:" -ForegroundColor Cyan
(Invoke-RestMethod https://portfolio-api-gkcd.onrender.com/api/admin/devices -Headers $h).summary | ConvertTo-Json

Write-Host "`nIf counts match pre-restart, Redis persistence is working!" -ForegroundColor Green
