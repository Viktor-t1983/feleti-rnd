$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YmM0YjQ4Yy1jY2UzLTRhYTQtYTg4ZS0yZjgxMTUwMmY3ZGQiLCJlbWFpbCI6ImFkbWluQGZlbGV0aS5jb20iLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3NzMzMzcxOTIsImV4cCI6MTc3MzMzODA5Mn0.kHLwG2b_oFY-_6YaOfmoQ0bUdHynCrqFv1kFLlwAXVg"
$headers = @{
    Authorization = "Bearer $token"
}
try {
    $projects = Invoke-RestMethod -Uri "http://localhost:3001/api/projects" -Method Get -Headers $headers
    Write-Host "Full response:"
    $projects | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
