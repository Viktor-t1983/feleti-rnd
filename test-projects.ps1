# Block 3: Projects CRUD - Final Test

Write-Host "=== BLOCK 3: PROJECTS CRUD ===" -ForegroundColor Cyan

# 1. Login
Write-Host "`n[1] Authentication..."
$body = '{"email":"admin@feleti.com","password":"admin123"}'
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $loginResponse.accessToken
Write-Host "    OK Token obtained"

$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

# 2. List projects
Write-Host "`n[2] Getting projects list..."
$projectsResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/projects' -Method Get -Headers $headers
$projects = $projectsResponse.projects
Write-Host "    OK Projects found: $($projects.Count)"

if ($projects.Count -eq 0) {
    Write-Host "    WARN No projects to test"
    exit 1
}

$projectId = $projects[0].id
Write-Host "    Using project ID: $projectId"

# 3. Get project by ID
Write-Host "`n[3] Getting project by ID..."
$project = Invoke-RestMethod -Uri "http://localhost:3001/api/projects/$projectId" -Method Get -Headers $headers
Write-Host "    OK Project: $($project.name)"

# 4. PDF export
Write-Host "`n[4] PDF export..."
try {
    $pdfResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/projects/$projectId/pdf" -Method Get -Headers $headers -OutFile "test-export.pdf"
    Write-Host "    OK PDF exported (status: $($pdfResponse.StatusCode))"
    if (Test-Path "test-export.pdf") {
        $fileSize = (Get-Item "test-export.pdf").Length
        Write-Host "    File size: $fileSize bytes"
    }
} catch {
    Write-Host "    WARN PDF export failed: $($_.Exception.Response.StatusCode)"
}

# 5. Update project
Write-Host "`n[5] Updating project..."
$updateBody = '{"name":"Updated Test Project","priority":"high"}'
$updated = Invoke-RestMethod -Uri "http://localhost:3001/api/projects/$projectId" -Method Put -Body $updateBody -Headers $headers
Write-Host "    OK Project updated: $($updated.name), priority: $($updated.priority)"

Write-Host "`n=== BLOCK 3: PROJECTS CRUD - COMPLETED ===" -ForegroundColor Green
