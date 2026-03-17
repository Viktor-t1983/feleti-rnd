# Test calculations API
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3001/api"

# Login
Write-Host "=== Login ==="
$loginBody = '{"email":"admin@feleti.com","password":"admin123"}'

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginResponse.accessToken
Write-Host "Token: $token"
Write-Host ""

# Get projects
Write-Host "=== Get Projects ==="
$headers = @{
    Authorization = "Bearer $token"
}
$projects = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Get -Headers $headers
$projectId = $projects.projects[0].id
Write-Host "Project ID: $projectId"
Write-Host "Project Name: $($projects.projects[0].name)"
Write-Host ""

# Save NPV calculation
Write-Host "=== Save NPV Calculation ==="
$npvData = @{
    projectId = $projectId
    type = "npv"
    category = "FINANCIAL"
    inputData = @{
        investment = 1000000
        rate = 0.1
        cashFlows = @(300000, 400000, 500000, 600000)
    }
    resultData = @{
        npv = 71784
        decision = "ACCEPT"
    }
    notes = "Базовый сценарий"
} | ConvertTo-Json -Depth 10

$saveResponse = Invoke-RestMethod -Uri "$baseUrl/calculations/save" -Method Post -ContentType "application/json" -Body $npvData -Headers $headers
Write-Host "Saved calculation ID: $($saveResponse.data.id)"
Write-Host ""

# Save engineering calculation
Write-Host "=== Save Shaft Strength Calculation ==="
$engData = @{
    projectId = $projectId
    type = "shaft_strength"
    category = "ENGINEERING"
    inputData = @{
        diameter = 50
        torque = 1000
        material = "steel"
    }
    resultData = @{
        stress = 250
        safety_factor = 2.5
    }
    notes = "Расчёт вала"
} | ConvertTo-Json -Depth 10

$engResponse = Invoke-RestMethod -Uri "$baseUrl/calculations/save" -Method Post -ContentType "application/json" -Body $engData -Headers $headers
Write-Host "Saved engineering calculation ID: $($engResponse.data.id)"
Write-Host ""

# Get project calculations
Write-Host "=== Get Project Calculations ==="
$calculations = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/calculations" -Method Get -Headers $headers
Write-Host "Total calculations: $($calculations.data.Count)"
foreach ($calc in $calculations.data) {
    Write-Host "  - $($calc.type) ($($calc.category)): $($calc.id)"
}
Write-Host ""

# Get summary
Write-Host "=== Get Calculation Summary ==="
$summary = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/calculations/summary" -Method Get -Headers $headers
Write-Host "Summary:"
Write-Host "  Total: $($summary.data.total)"
Write-Host "  Financial: $($summary.data.financial)"
Write-Host "  Engineering: $($summary.data.engineering)"
Write-Host "  By Type: $($summary.data.byType | ConvertTo-Json -Compress)"
Write-Host ""

# Get calculation by ID
Write-Host "=== Get Calculation by ID ==="
$calcId = $saveResponse.data.id
$calc = Invoke-RestMethod -Uri "$baseUrl/calculations/$calcId" -Method Get -Headers $headers
Write-Host "Calculation Details:"
Write-Host "  ID: $($calc.data.id)"
Write-Host "  Type: $($calc.data.type)"
Write-Host "  Notes: $($calc.data.notes)"
Write-Host ""

Write-Host "=== All tests passed! ==="
