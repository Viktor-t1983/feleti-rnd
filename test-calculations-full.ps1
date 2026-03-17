# Get fresh token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@feleti.com","password":"admin123"}'
$token = $loginResponse.accessToken

$projectId = "a370d4ff-bab3-49a2-8d27-800a16288412"
$headers = @{
    Authorization = "Bearer $token"
}

$json = '{
  "projectId": "' + $projectId + '",
  "type": "npv",
  "category": "FINANCIAL",
  "inputData": {"investment": 1000000, "rate": 0.1},
  "resultData": {"npv": 71784, "decision": "ACCEPT"},
  "notes": "Base scenario"
}'

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/calculations/save" -Method Post -ContentType "application/json" -Body $json -Headers $headers
    Write-Host "=== Success! Calculation saved ==="
    Write-Host "ID: $($response.data.id)"
    Write-Host "Type: $($response.data.type)"
    Write-Host "Category: $($response.data.category)"
    Write-Host "Project: $($response.data.project.name)"
    Write-Host ""
    
    # Get calculations
    $calcs = Invoke-RestMethod -Uri "http://localhost:3001/api/projects/$projectId/calculations" -Method Get -Headers $headers
    Write-Host "=== Project Calculations ==="
    Write-Host "Total: $($calcs.data.Count)"
    foreach ($c in $calcs.data) {
        Write-Host "  - $($c.type) ($($c.category)): $($c.id)"
    }
    Write-Host ""
    
    # Get summary
    $summary = Invoke-RestMethod -Uri "http://localhost:3001/api/projects/$projectId/calculations/summary" -Method Get -Headers $headers
    Write-Host "=== Calculation Summary ==="
    Write-Host "Total: $($summary.data.total)"
    Write-Host "Financial: $($summary.data.financial)"
    Write-Host "Engineering: $($summary.data.engineering)"
    Write-Host "By Type: $($summary.data.byType | ConvertTo-Json -Compress)"
    
} catch {
    Write-Host "Error: $_"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
