@echo off
echo ===== ТЕСТ 1: Прочность вала =====
curl -s -X POST http://localhost:8000/engineering/shaft-strength ^
  -H "Content-Type: application/json" ^
  -d "{\"torque_nm\":500,\"diameter_mm\":50,\"material_yield_mpa\":355,\"safety_factor\":2.0}" ^
  | python -m json.tool

echo.
echo ===== ТЕСТ 2: Тепловой баланс =====
curl -s -X POST http://localhost:8000/engineering/thermal-balance ^
  -H "Content-Type: application/json" ^
  -d "{\"power_input_kw\":100,\"mass_flow_kg_s\":0.5,\"temp_inlet_c\":20,\"temp_outlet_c\":80}" ^
  | python -m json.tool

echo.
echo ===== ТЕСТ 3: Вентиляция =====
curl -s -X POST http://localhost:8000/engineering/ventilation ^
  -H "Content-Type: application/json" ^
  -d "{\"room_volume_m3\":500,\"room_type\":\"production\",\"workers_count\":10}" ^
  | python -m json.tool
