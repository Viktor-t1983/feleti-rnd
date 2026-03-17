# Сохранение результатов финансовых расчётов в БД

Write-Host "=== Calculations Save Test ===" -ForegroundColor Cyan

# Логин
$body = '{"email":"admin@feleti.com","password":"admin123"}'
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $loginResponse.accessToken
$userId = $loginResponse.user.id

Write-Host "OK Token obtained"
Write-Host "User ID: $userId"

$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

# Получить проекты
$projectsResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/projects' -Method Get -Headers $headers
$projectId = $projectsResponse.projects[0].id
Write-Host "Project ID: $projectId`n"

# 1. Выполнить расчёт NPV через calc-engine
Write-Host "=== 1. Calculating NPV ===" -ForegroundColor Cyan
$npvData = @{
  investment = 1000000
  cash_flows = @(300000, 400000, 500000)
  discount_rate = 0.1
} | ConvertTo-Json

$npvResult = Invoke-RestMethod -Uri 'http://localhost:8000/api/financial/npv' -Method Post -Body $npvData -ContentType 'application/json'
Write-Host "OK NPV: $($npvResult.npv) ($($npvResult.decision))"

# 2. Сохранить расчёт в БД
Write-Host "`n=== 2. Saving to DB ===" -ForegroundColor Cyan
$saveData = @{
  projectId = $projectId
  type = "npv"
  category = "financial"
  inputData = @{
    investment = 1000000
    cash_flows = @(300000, 400000, 500000)
    discount_rate = 0.1
  }
  resultData = @{
    npv = $npvResult.npv
    decision = $npvResult.decision
  }
} | ConvertTo-Json -Depth 10

$saveResult = Invoke-RestMethod -Uri 'http://localhost:3001/api/calculations/save' -Method Post -Body $saveData -Headers $headers
Write-Host "OK Calculation saved!"
Write-Host "ID: $($saveResult.data.id)"
Write-Host "Project: $($saveResult.data.project.name)"
Write-Host "User: $($saveResult.data.executedBy.fullName)"

# 3. Получить расчёты проекта
Write-Host "`n=== 3. Getting project calculations ===" -ForegroundColor Cyan
$calcResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/calculations/projects/$projectId" -Method Get -Headers $headers
Write-Host "OK Found $($calcResponse.total) calculation(s)"
$calcResponse.calculations | ForEach-Object {
  Write-Host "  - ID: $($_.id), Type: $($_.block.code), Status: $($_.status)"
}

# 4. Сохранить ещё один расчёт (IRR)
Write-Host "`n=== 4. Calculating and saving IRR ===" -ForegroundColor Cyan
$irrData = @{
  investment = 1000000
  cash_flows = @(300000, 400000, 500000)
} | ConvertTo-Json

$irrResult = Invoke-RestMethod -Uri 'http://localhost:8000/api/financial/irr' -Method Post -Body $irrData -ContentType 'application/json'
Write-Host "OK IRR: $($irrResult.irr)%"

$irrSaveData = @{
  projectId = $projectId
  type = "irr"
  category = "financial"
  inputData = @{
    investment = 1000000
    cash_flows = @(300000, 400000, 500000)
  }
  resultData = @{
    irr = $irrResult.irr
  }
} | ConvertTo-Json -Depth 10

$irrSaveResult = Invoke-RestMethod -Uri 'http://localhost:3001/api/calculations/save' -Method Post -Body $irrSaveData -Headers $headers
Write-Host "OK IRR saved: $($irrSaveResult.data.id)"

# 5. Финальная сводка
Write-Host "`n=== 5. Final Summary ===" -ForegroundColor Cyan
$finalCalcResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/calculations/projects/$projectId" -Method Get -Headers $headers
Write-Host "Total calculations for project: $($finalCalcResponse.total)"
$finalCalcResponse.calculations | ForEach-Object {
  $value = if ($_.outputs.npv) { $_.outputs.npv } else { "$($_.outputs.irr)%" }
  Write-Host "  - $($_.block.code): $value"
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Green
