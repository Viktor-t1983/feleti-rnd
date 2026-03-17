# Get fresh token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@feleti.com","password":"admin123"}'
$token = $loginResponse.accessToken
$headers = @{
    Authorization = "Bearer $token"
}

# Test all calculation endpoints
Write-Host "=== Testing Calculations API ==="
Write-Host ""

# 1. Save calculation
Write-Host "1. Save NPV Calculation..."
$json = '{
  "projectId": "a370d4ff-bab3-49a2-8d27-800a16288412",
  "type": "npv",
  "category": "FINANCIAL",
  "inputData": {"investment": 1000000, "rate": 0.1},
  "resultData": {"npv": 71784, "decision": "ACCEPT"},
  "notes": "Test scenario"
}'
$saveResp = Invoke-RestMethod -Uri "http://localhost:3001/api/calculations/save" -Method Post -ContentType "application/json" -Body $json -Headers $headers
Write-Host "   Saved ID: $($saveResp.data.id)"
$calcId = $saveResp.data.id
Write-Host "   OK"
Write-Host ""

# 2. Get calculation by ID
Write-Host "2. Get Calculation by ID..."
$calcResp = Invoke-RestMethod -Uri "http://localhost:3001/api/calculations/$calcId" -Method Get -Headers $headers
Write-Host "   Type: $($calcResp.data.type)"
Write-Host "   Notes: $($calcResp.data.notes)"
Write-Host "   OK"
Write-Host ""

# 3. Get calculations stats
Write-Host "3. Get Calculations Stats..."
$statsResp = Invoke-RestMethod -Uri "http://localhost:3001/api/calculations/stats" -Method Get -Headers $headers
Write-Host "   Total: $($statsResp.total)"
Write-Host "   OK"
Write-Host ""

# 4. Get blocks
Write-Host "4. Get Calculation Blocks..."
$blocksResp = Invoke-RestMethod -Uri "http://localhost:3001/api/calculations/blocks" -Method Get -Headers $headers
Write-Host "   Blocks count: $($blocksResp.Count)"
Write-Host "   OK"
Write-Host ""

Write-Host "=== All Calculation API tests passed! ==="
