# Блок 7: Проверка calculations endpoint

# 1. Логин
Write-Host "=== Получение токена ===" -ForegroundColor Cyan
$body = '{"email":"admin@feleti.com","password":"admin123"}'
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $loginResponse.accessToken
Write-Host "OK Token получен: $($token.Substring(0, 30))..."

$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

# 2. Получить список проектов
Write-Host "`n=== Получение списка проектов ===" -ForegroundColor Cyan
$projectsResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/projects' -Method Get -Headers $headers
$projects = $projectsResponse.projects
Write-Host "OK Найдено проектов: $($projects.Count)"

if ($projects.Count -eq 0) {
  Write-Host "ERROR: Нет проектов для теста" -ForegroundColor Red
  exit 1
}

$projectId = $projects[0].id
Write-Host "Используем проект ID: $projectId"

# 3. Сохранить расчёт NPV
Write-Host "`n=== Сохранение расчёта NPV ===" -ForegroundColor Cyan
$npvData = @{
  projectId = $projectId
  type = "npv"
  category = "financial"
  inputData = @{
    investment = 1000000
    rate = 0.1
  }
  resultData = @{
    npv = 71784
    decision = "ACCEPT"
  }
  notes = "Базовый сценарий"
} | ConvertTo-Json -Depth 10

try {
  $saveResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/calculations/execute' -Method Post -Body $npvData -Headers $headers
  Write-Host "OK Расчёт сохранён" -ForegroundColor Green
  Write-Host "ID: $($saveResponse.id)"
  Write-Host "Status: $($saveResponse.status)"
} catch {
  Write-Host "WARN Save failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Получить расчёты проекта
Write-Host "`n=== Получение расчётов проекта ===" -ForegroundColor Cyan
try {
  $calcResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/calculations/projects/$projectId" -Method Get -Headers $headers
  Write-Host "OK Найдено расчётов: $($calcResponse.total)"
  if ($calcResponse.total -gt 0) {
    $calcResponse.calculations | ForEach-Object {
      Write-Host "  - ID: $($_.id), Block: $($_.block.code), Status: $($_.status)"
    }
  }
} catch {
  Write-Host "WARN Get calculations failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. Получить сводку
Write-Host "`n=== Сводка по расчётам ===" -ForegroundColor Cyan
try {
  $statsResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/calculations/stats' -Method Get -Headers $headers
  Write-Host "OK Статистика получена"
  Write-Host "  Total: $($statsResponse.total)"
  Write-Host "  Avg Execution Time: $($statsResponse.avgExecutionTime) ms"
} catch {
  Write-Host "WARN Stats failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== Блок 7: Проверка завершена ===" -ForegroundColor Green
