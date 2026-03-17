# Debug проектов - полный ответ
$token = Get-Content "D:\projects\feleti-rnd\.test-token"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "=== FULL RESPONSE DEBUG ==="

# Создание
$newProject = @{
    name = "Test Project"
    code = "TEST-001"
    description = "Test description"
} | ConvertTo-Json

try {
    $created = Invoke-RestMethod -Uri "http://localhost:3001/api/projects" -Method Post -Headers $headers -Body $newProject
    Write-Host "Response:"
    $created | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
