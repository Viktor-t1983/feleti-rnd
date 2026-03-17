$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YmM0YjQ4Yy1jY2UzLTRhYTQtYTg4ZS0yZjgxMTUwMmY3ZGQiLCJlbWFpbCI6ImFkbWluQGZlbGV0aS5jb20iLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3NzMzMzcyNDksImV4cCI6MTc3MzMzODE0OX0.u9W7P9oeThuMmiEczdwQIqksBiIARWhIJPe9Wec4GEc"
$headers = @{
    Authorization = "Bearer $token"
}

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
