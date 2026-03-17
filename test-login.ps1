$json = '{\"email\":\"admin@feleti.com\",\"password\":\"admin123\"}'
$response = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -ContentType 'application/json' -Body $json
$response | ConvertTo-Json -Depth 5
