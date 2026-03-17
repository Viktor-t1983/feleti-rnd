# Получение токена для тестов
$body = @{
    email = "admin@feleti.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -ContentType "application/json" -Body $body
$token = $response.accessToken

# Сохраняем токен в файл для использования в других скриптах
$token | Out-File -FilePath "D:\projects\feleti-rnd\.test-token" -Encoding utf8
Write-Host "Token saved to .test-token"
Write-Host "Token: $($token.Substring(0,40))..."
