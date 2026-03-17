# Скрипт для обновления блоков устава на русский язык
param(
    [string]$ApiUrl = "http://localhost:3001",
    [string]$Email = "admin@feleti.com",
    [string]$Password = "admin123"
)

Write-Host "Обновление блоков устава на русский язык..." -ForegroundColor Cyan

# Получаем токен
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
$loginResp = Invoke-RestMethod -Uri "$ApiUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$TOKEN = $loginResp.accessToken
Write-Host "Авторизация успешна" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

# ID оборудования и проекта
$EQ_ID = "2ff4d8bf-a02b-406a-b624-c671c103f39f"
$PROJECT_ID = "b85a08d4-1e59-4bdf-80ae-428eecc3aefe"

# Переименовываем блоки шаблона
Write-Host "`nПереименование блоков шаблона..." -ForegroundColor Yellow
$blocks = Invoke-RestMethod -Uri "$ApiUrl/api/charter/templates/$EQ_ID/blocks" -Headers $headers

$names = @(
    'Продукт и ниша',
    'Рынок и конкуренты',
    'Технические параметры',
    'Привод и трансмиссия',
    'Вакуумная система',
    'Комплектации',
    'Финансовая модель',
    'Решение GO/NO-GO'
)

foreach ($block in $blocks.data) {
    $name = $names[$block.sortOrder]
    Invoke-RestMethod -Uri "$ApiUrl/api/charter/template-blocks/$($block.id)" -Method PUT -Headers $headers -Body (@{ name = $name } | ConvertTo-Json -Compress) | Out-Null
    Write-Host "  ✅ [$($block.sortOrder)] $name" -ForegroundColor Green
}

# Обновляем данные блоков проекта
Write-Host "`nОбновление данных блоков проекта..." -ForegroundColor Yellow

$charter = Invoke-RestMethod -Uri "$ApiUrl/api/projects/$PROJECT_ID/charter" -Headers $headers

# Блок 0 - Продукт и ниша
$b0 = $charter.data.blocks | Where-Object { $_.templateBlock.sortOrder -eq 0 }
$b0Data = @{
    data = @{
        product = 'Вакуумная фаршмешалка 2-лопастная 3000 кг'
        client = 'Мясокомбинат средний/крупный'
        pain = 'Нет аналога большого объема от производителя СНГ. Европа дорого, Китай - качество под вопросом'
        utp = 'Локальный производитель Беларусь, сервис, запчасти, язык. Опыт FELETI на 1.5т'
        productivity = '1-3 цикла/час'
        status = 'done'
    }
} | ConvertTo-Json -Compress -Depth 5

Invoke-RestMethod -Uri "$ApiUrl/api/projects/$PROJECT_ID/blocks/$($b0.id)" -Method PUT -Headers $headers -Body $b0Data | Out-Null
Write-Host "  ✅ [0] Продукт и ниша" -ForegroundColor Green

# Блок 2 - Технические параметры
$b2 = $charter.data.blocks | Where-Object { $_.templateBlock.sortOrder -eq 2 }
$b2Data = @{
    data = @{
        loadKg = 3000
        chamberVolumeLiters = 4000
        bladeDiameterMm = 600
        bladeCount = 16
        shaftDiameterMm = 130
        maxRpm = 40
        drivePowerKw = 45
        driveCount = 2
        vacuumBar = -0.8
        vacuumPumpM3h = 90
        sealType = 'Торцевое механическое'
        totalPowerKw = 120
        lengthMm = 5000
        weightKg = 5500
        minCeilingMm = 5000
        status = 'done'
    }
} | ConvertTo-Json -Compress -Depth 5

Invoke-RestMethod -Uri "$ApiUrl/api/projects/$PROJECT_ID/blocks/$($b2.id)" -Method PUT -Headers $headers -Body $b2Data | Out-Null
Write-Host "  ✅ [2] Технические параметры" -ForegroundColor Green

# Блок 6 - Финансовая модель
$b6 = $charter.data.blocks | Where-Object { $_.templateBlock.sortOrder -eq 6 }
$b6Data = @{
    data = @{
        costUsd = 87000
        priceUsd = 155000
        marginPercent = 44
        salesYear1 = 3
        salesYear3 = 5
        developmentCostUsd = 100000
        paybackYears = 2
        status = 'done'
    }
} | ConvertTo-Json -Compress -Depth 5

Invoke-RestMethod -Uri "$ApiUrl/api/projects/$PROJECT_ID/blocks/$($b6.id)" -Method PUT -Headers $headers -Body $b6Data | Out-Null
Write-Host "  ✅ [6] Финансовая модель" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "ВСЕ БЛОКИ ОБНОВЛЕНЫ НА РУССКИЙ!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "URL: http://localhost:8080/projects/$PROJECT_ID/charter"
