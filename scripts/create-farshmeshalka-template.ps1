# Script for creating Farahmeshalka 3T template
param([string]$ApiUrl = "http://localhost:3001")

Write-Host "Creating Farahmeshalka 3T Template..."

# Get token
$login = Invoke-RestMethod -Uri "$ApiUrl/api/auth/login" -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"admin@feleti.com","password":"admin123"}'
$TOKEN = $login.accessToken
Write-Host "Token received"

$headers = @{"Authorization"="Bearer $TOKEN"; "Content-Type"="application/json"}

# Use unique short codes (max 20 chars)
$timestamp = Get-Random -Minimum 100000 -Maximum 999999
$EQ_CODE = "FM-VAC-$timestamp"
$PROJ_CODE = "F$timestamp"

Write-Host "Using codes: EQ=$EQ_CODE, PROJ=$PROJ_CODE"

# Create equipment
$eqBody = "{`"code`":`"$EQ_CODE`",`"name`":`"Vacuum Meat Mixer 3T`",`"category`":`"MECHANICAL`",`"description`":`"Vacuum meat mixer for meat processing plants`",`"manufacturer`":`"FELETI`",`"countryOfOrigin`":`"Belarus`"}"
$eq = Invoke-RestMethod -Uri "$ApiUrl/api/knowledge/equipment" -Method POST -Headers $headers -Body $eqBody
$EQ_ID = $eq.id
Write-Host "Equipment created: $EQ_ID"

# Create 8 template blocks
$blocks = @(
    '{"name":"Product and Niche","icon":"","blockType":"TEXT","isRequired":true,"sortOrder":0,"aiEnabled":true,"aiPrompt":"Ask: target client, pain point, competitive advantage. Flag FLAG:yellow:No UTP formulated if no clear competitive advantage."}',
    '{"name":"Market and Competitors","icon":"","blockType":"COMPETITORS","isRequired":true,"sortOrder":1,"aiEnabled":true,"aiPrompt":"Ask: target countries, known competitors, price ranges. Flag FLAG:yellow:No competitor pricing data if prices unknown."}',
    '{"name":"Technical Parameters","icon":"","blockType":"PARAMS_TABLE","isRequired":true,"sortOrder":2,"aiEnabled":true,"aiPrompt":"Ask: load volume, bowl diameter/length, rotation speed, drive power. Flag FLAG:red:Drive power needs calculation if power taken without calculation."}',
    '{"name":"Drive and Transmission","icon":"","blockType":"PARAMS_TABLE","isRequired":true,"sortOrder":3,"aiEnabled":true,"aiPrompt":"Ask: power on existing machine, gearbox load, coupling type. Flag FLAG:red:Gearbox under load - need power reserve."}',
    '{"name":"Vacuum System","icon":"","blockType":"PARAMS_TABLE","isRequired":true,"sortOrder":4,"aiEnabled":true,"aiPrompt":"Ask: pump type, m3/h capacity, shaft seal type. Flag FLAG:red:Seals critical for vacuum if not end-face mechanical seals."}',
    '{"name":"Configurations","icon":"","blockType":"TEXT","isRequired":true,"sortOrder":5,"aiEnabled":true,"aiPrompt":"Ask options: vacuum, weight sensors, water/brine dosing, glycol cooling. Flag FLAG:yellow:Spice dosing separate project."}',
    '{"name":"Financial Model","icon":"","blockType":"PARAMS_TABLE","isRequired":true,"sortOrder":6,"aiEnabled":true,"aiPrompt":"Ask: cost, target price, sales volume year 1-2 and 3-5. Flag FLAG:red:Low margin project risk if margin below 20%."}',
    '{"name":"GO/NO-GO Decision","icon":"","blockType":"GATE_REVIEW","isRequired":true,"sortOrder":7,"aiEnabled":true,"aiPrompt":"Analyze all charter blocks. Recommend NO-GO if red flags open, CONDITIONAL GO if yellow only, GO if all closed."}'
)

$blockCount = 0
foreach ($blockJson in $blocks) {
    try {
        $block = Invoke-RestMethod -Uri "$ApiUrl/api/charter/templates/$EQ_ID/blocks" -Method POST -Headers $headers -Body $blockJson
        Write-Host "Block created: $($block.data.name)"
        $blockCount++
    } catch {
        Write-Host "Block error: $_" -ForegroundColor Red
    }
}

# Create project
$projBody = "{`"name`":`"Vacuum Meat Mixer 3T`",`"code`":`"$PROJ_CODE`",`"description`":`"2-blade vacuum meat mixer 3000kg for CIS meat plants`",`"equipmentTypeId`":`"$EQ_ID`"}"
$proj = Invoke-RestMethod -Uri "$ApiUrl/api/projects" -Method POST -Headers $headers -Body $projBody
$PROJECT_ID = $proj.id
Write-Host "Project created: $PROJECT_ID"

if (-not $PROJECT_ID) {
    Write-Host "ERROR: Could not get project ID" -ForegroundColor Red
    exit 1
}

# Get charter
$charter = Invoke-RestMethod -Uri "$ApiUrl/api/projects/$PROJECT_ID/charter" -Headers $headers
$blocksCount = $charter.data.blocks.Count
Write-Host "Charter blocks: $blocksCount"

# Fill block 0 - Product
$b0 = $charter.data.blocks | Where-Object { $_.templateBlock.sortOrder -eq 0 }
if ($b0) {
    $b0Data = '{"data":{"product":"Vacuum meat mixer 2-blade 3000kg","client":"Medium/large meat plant","pain":"No large volume analog from CIS manufacturer. Europe expensive, China quality questionable","utp":"Local Belarus manufacturer, service spare parts language. FELETI experience on 1.5t","productivity":"1-3 cycles/hour","status":"done"}}'
    Invoke-RestMethod -Uri "$ApiUrl/api/projects/$PROJECT_ID/blocks/$($b0.id)" -Method PUT -Headers $headers -Body $b0Data | Out-Null
    Write-Host "Block 0 (Product) filled"
}

# Fill block 2 - Technical params
$b2 = $charter.data.blocks | Where-Object { $_.templateBlock.sortOrder -eq 2 }
if ($b2) {
    $b2Data = '{"data":{"loadKg":3000,"chamberVolumeLiters":4000,"bladeDiameterMm":600,"bladeCount":16,"shaftDiameterMm":130,"maxRpm":40,"drivePowerKw":45,"driveCount":2,"vacuumBar":-0.8,"vacuumPumpM3h":90,"sealType":"End-face mechanical","totalPowerKw":120,"lengthMm":5000,"weightKg":5500,"minCeilingMm":5000,"status":"done"}}'
    Invoke-RestMethod -Uri "$ApiUrl/api/projects/$PROJECT_ID/blocks/$($b2.id)" -Method PUT -Headers $headers -Body $b2Data | Out-Null
    Write-Host "Block 2 (Technical) filled"
}

# Fill block 6 - Financial
$b6 = $charter.data.blocks | Where-Object { $_.templateBlock.sortOrder -eq 6 }
if ($b6) {
    $b6Data = '{"data":{"costUsd":87000,"priceUsd":155000,"marginPercent":44,"salesYear1":3,"salesYear3":5,"developmentCostUsd":100000,"paybackYears":2,"status":"done"}}'
    Invoke-RestMethod -Uri "$ApiUrl/api/projects/$PROJECT_ID/blocks/$($b6.id)" -Method PUT -Headers $headers -Body $b6Data | Out-Null
    Write-Host "Block 6 (Financial) filled"
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "TEMPLATE AND PROJECT CREATED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Equipment ID: $EQ_ID"
Write-Host "Project ID: $PROJECT_ID"
Write-Host "Blocks in template: $blockCount"
Write-Host "Blocks in charter: $blocksCount"
Write-Host "URL: http://localhost:8080/projects/$PROJECT_ID/charter"
