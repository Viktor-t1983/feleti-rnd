# Get fresh token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@feleti.com","password":"admin123"}'
$token = $loginResponse.accessToken
$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "Token: $token"
Write-Host ""

Write-Host "Testing /api/calculations/stats..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/calculations/stats" -Method Get -Headers $headers
    Write-Host "Success: $($response | ConvertTo-Json -Depth 5)"
} catch {
    Write-Host "Error: $_"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}

Write-Host ""
Write-Host "Testing /api/calculations/blocks..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/calculations/blocks" -Method Get -Headers $headers
    Write-Host "Success: $($response | ConvertTo-Json -Depth 5)"
} catch {
    Write-Host "Error: $_"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
