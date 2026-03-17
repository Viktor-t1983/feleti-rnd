# Debug проектов
$token = Get-Content "D:\projects\feleti-rnd\.test-token"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "=== DEBUG PROJECTS ==="

# Список
Write-Host "`n1. List projects:"
$projects = Invoke-RestMethod -Uri "http://localhost:3001/api/projects" -Method Get -Headers $headers
Write-Host "Response type: $($projects.GetType().Name)"
Write-Host "Has data: $($projects.data -ne $null)"
if ($projects.data) {
    Write-Host "Data count: $($projects.data.Count)"
}

# Создание
Write-Host "`n2. Create project:"
$newProject = @{
    name = "Test Project"
    code = "TEST-001"
    description = "Test description"
} | ConvertTo-Json

Write-Host "Request body: $newProject"
$created = Invoke-RestMethod -Uri "http://localhost:3001/api/projects" -Method Post -Headers $headers -Body $newProject
Write-Host "Response type: $($created.GetType().Name)"
Write-Host "Has data: $($created.data -ne $null)"
if ($created.data) {
    Write-Host "Data ID: $($created.data.id)"
    Write-Host "Data name: $($created.data.name)"
    $projectId = $created.data.id
    Write-Host "Project ID for next request: $projectId"
}
