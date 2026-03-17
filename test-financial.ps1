# Block 4: Financial Calculations

Write-Host "=== BLOCK 4: FINANCIAL CALCULATIONS ===" -ForegroundColor Cyan

# 1. NPV Calculation
Write-Host "`n[1] NPV Calculation..."
$npvBody = '{"investment":1000000,"cash_flows":[300000,400000,500000],"discount_rate":0.1}'
$npvResponse = Invoke-RestMethod -Uri 'http://localhost:8000/api/financial/npv' -Method Post -Body $npvBody -ContentType 'application/json'
Write-Host "    NPV: $($npvResponse.npv)"
Write-Host "    Decision: $($npvResponse.decision)"

# 2. IRR Calculation
Write-Host "`n[2] IRR Calculation..."
$irrBody = '{"investment":1000000,"cash_flows":[300000,400000,500000]}'
$irrResponse = Invoke-RestMethod -Uri 'http://localhost:8000/api/financial/irr' -Method Post -Body $irrBody -ContentType 'application/json'
Write-Host "    IRR: $($irrResponse.irr)%"

# 3. ROI Calculation
Write-Host "`n[3] ROI Calculation..."
$roiBody = '{"investment":1000000,"total_return":1400000}'
$roiResponse = Invoke-RestMethod -Uri 'http://localhost:8000/api/financial/roi' -Method Post -Body $roiBody -ContentType 'application/json'
Write-Host "    ROI: $($roiResponse.roi_percent)%"

# 4. Payback Period
Write-Host "`n[4] Payback Period Calculation..."
$paybackBody = '{"investment":1000000,"annual_cash_flow":400000}'
$paybackResponse = Invoke-RestMethod -Uri 'http://localhost:8000/api/financial/payback' -Method Post -Body $paybackBody -ContentType 'application/json'
Write-Host "    Payback: $($paybackResponse.payback_years) years"

Write-Host "`n=== BLOCK 4: FINANCIAL CALCULATIONS - COMPLETED ===" -ForegroundColor Green
