$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YmM0YjQ4Yy1jY2UzLTRhYTQtYTg4ZS0yZjgxMTUwMmY3ZGQiLCJlbWFpbCI6ImFkbWluQGZlbGV0aS5jb20iLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3NzMzMzcyNDksImV4cCI6MTc3MzMzODE0OX0.u9W7P9oeThuMmiEczdwQIqksBiIARWhIJPe9Wec4GEc"
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
    Write-Host "Success!"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
