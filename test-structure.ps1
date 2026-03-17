# Проверка структуры ответа
$token = Get-Content "D:\projects\feleti-rnd\.test-token"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$uniqueCode = "TEST-" + [System.Guid]::NewGuid().ToString().Substring(0,8)
$newProject = @{
    name = "Test"
    code = $uniqueCode
    description = "Test"
} | ConvertTo-Json

Write-Host "Creating project with code: $uniqueCode"
$created = Invoke-RestMethod -Uri "http://localhost:3001/api/projects" -Method Post -Headers $headers -Body $newProject

Write-Host "Response type: $($created.GetType().FullName)"
Write-Host "Response properties:"
$created.PSObject.Properties | ForEach-Object { Write-Host "  - $($_.Name)" }

# Пробуем доступ к полям
Write-Host "`nDirect access:"
Write-Host "created.data = $($created.data)"
Write-Host "created.id = $($created.id)"
Write-Host "created.name = $($created.name)"

# Convert to JSON and back
$json = $created | ConvertTo-Json -Depth 5
Write-Host "`nAs JSON: $json"
