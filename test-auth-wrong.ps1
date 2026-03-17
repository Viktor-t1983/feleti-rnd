# Тест аутентификации с неверным паролем
$body = @{
    email = "admin@feleti.com"
    password = "WRONG_PASSWORD"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    Write-Host "ERROR: Should have failed!"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Expected: 401 Unauthorized"
}
