# Block 5: Engineering Calculations

Write-Host "=== BLOCK 5: ENGINEERING CALCULATIONS ===" -ForegroundColor Cyan

# 1. Shaft Strength
Write-Host "`n[1] Shaft Strength Calculation..."
$shaftBody = '{"torque_nm":500,"diameter_mm":50,"material_yield_mpa":355,"safety_factor":2.0}'
$shaftResponse = Invoke-RestMethod -Uri 'http://localhost:8000/engineering/shaft-strength' -Method Post -Body $shaftBody -ContentType 'application/json'
$data = $shaftResponse.data
Write-Host "    Shear stress: $($data.shear_stress_mpa) MPa"
Write-Host "    Equivalent stress: $($data.equivalent_stress_mpa) MPa"
Write-Host "    Safety factor: $($data.safety_factor_actual)"
Write-Host "    Is safe: $($data.is_safe)"

# 2. Thermal Balance
Write-Host "`n[2] Thermal Balance Calculation..."
$thermalBody = '{"power_input_kw":100,"mass_flow_kg_s":0.5,"temp_inlet_c":20,"temp_outlet_c":80}'
$thermalResponse = Invoke-RestMethod -Uri 'http://localhost:8000/engineering/thermal-balance' -Method Post -Body $thermalBody -ContentType 'application/json'
$data = $thermalResponse.data
Write-Host "    Useful power: $($data.useful_power_kw) kW"
Write-Host "    Heat loss: $($data.heat_loss_kw) kW"
Write-Host "    Efficiency: $($data.efficiency_percent)%"

# 3. Ventilation
Write-Host "`n[3] Ventilation Calculation..."
$ventBody = '{"room_volume_m3":500,"room_type":"production","workers_count":10}'
$ventResponse = Invoke-RestMethod -Uri 'http://localhost:8000/engineering/ventilation' -Method Post -Body $ventBody -ContentType 'application/json'
$data = $ventResponse.data
Write-Host "    Air exchange rate: $($data.air_exchange_rate)"
Write-Host "    Supply airflow: $($data.supply_airflow_m3h) m³/h"
Write-Host "    Fan power: $($data.fan_power_kw) kW"

Write-Host "`n=== BLOCK 5: ENGINEERING CALCULATIONS - COMPLETED ===" -ForegroundColor Green
