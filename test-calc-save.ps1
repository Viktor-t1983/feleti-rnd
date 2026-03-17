# Проверка API calculations

# Логин
$body = '{"email":"admin@feleti.com","password":"admin123"}'
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $loginResponse.accessToken

$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

# Получить проекты
$projectsResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/projects' -Method Get -Headers $headers
$projectId = $projectsResponse.projects[0].id
Write-Host "Project ID: $projectId"

# Попытка выполнить расчёт через существующий endpoint calc-engine
Write-Host "`n=== Financial NPV via calc-engine ==="
$npvData = @{
  investment = 1000000
  cash_flows = @(300000, 400000, 500000)
  discount_rate = 0.1
} | ConvertTo-Json

try {
  $result = Invoke-RestMethod -Uri 'http://localhost:8000/api/financial/npv' -Method Post -Body $npvData -ContentType 'application/json'
  Write-Host "OK NPV calculated: $($result.npv)"
  
  # Теперь сохраняем результат в БД через API
  Write-Host "`n=== Save to DB ==="
  $saveData = @{
    projectId = $projectId
    blockCode = "FINANCIAL_NPV"
    inputs = @{
      investment = 1000000
      cash_flows = @(300000, 400000, 500000)
      discount_rate = 0.1
    }
    executedBy = $loginResponse.user.id
  } | ConvertTo-Json -Depth 10
  
  $saveResult = Invoke-RestMethod -Uri 'http://localhost:3001/api/calculations/execute' -Method Post -Body $saveData -Headers $headers
  Write-Host "OK Calculation saved: $($saveResult.id)"
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  Write-Host "Response: $($_.ErrorDetails.Message)"
}
