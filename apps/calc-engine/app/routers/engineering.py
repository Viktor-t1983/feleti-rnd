"""
Engineering calculators API endpoints.
"""
from fastapi import APIRouter, HTTPException
from app.models.engineering import (
    ShaftStrengthInput, ShaftStrengthResult,
    ThermalBalanceInput, ThermalBalanceResult,
    VentilationInput, VentilationResult, RoomType
)
from app.calculators.strength import calculate_shaft_strength
from app.calculators.thermal import calculate_thermal_balance
from app.calculators.ventilation import calculate_ventilation

router = APIRouter(prefix="/engineering", tags=["engineering"])


@router.post("/shaft-strength", response_model=dict)
async def shaft_strength_endpoint(data: ShaftStrengthInput):
    """
    Расчёт прочности вала по ГОСТ 21354-87.
    
    **Пример запроса:**
    ```json
    {
        "torque_nm": 500,
        "diameter_mm": 50,
        "material_yield_mpa": 355,
        "safety_factor": 2.0
    }
    ```
    
    **Возвращает:**
    - shear_stress_mpa: касательное напряжение
    - normal_stress_mpa: нормальное напряжение
    - equivalent_stress_mpa: эквивалентное напряжение по Мизесу
    - safety_factor_actual: фактический запас прочности
    - is_safe: прочность обеспечена
    - recommendation: рекомендация
    """
    try:
        result = calculate_shaft_strength(data)
        return {
            "success": True,
            "data": {
                "shear_stress_mpa": result.shear_stress_mpa,
                "normal_stress_mpa": result.normal_stress_mpa,
                "equivalent_stress_mpa": result.equivalent_stress_mpa,
                "allowable_stress_mpa": result.allowable_stress_mpa,
                "safety_factor_actual": result.safety_factor_actual,
                "is_safe": result.is_safe,
                "recommendation": result.recommendation
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/thermal-balance", response_model=dict)
async def thermal_balance_endpoint(data: ThermalBalanceInput):
    """
    Тепловой баланс оборудования.
    
    **Пример запроса:**
    ```json
    {
        "power_input_kw": 100,
        "mass_flow_kg_s": 0.5,
        "temp_inlet_c": 20,
        "temp_outlet_c": 80
    }
    ```
    
    **Возвращает:**
    - useful_power_kw: полезная тепловая мощность
    - heat_loss_kw: тепловые потери
    - efficiency_percent: КПД
    - recommendation: рекомендация
    """
    try:
        result = calculate_thermal_balance(data)
        return {
            "success": True,
            "data": {
                "useful_power_kw": result.useful_power_kw,
                "heat_loss_kw": result.heat_loss_kw,
                "efficiency_percent": result.efficiency_percent,
                "delta_temp_c": result.delta_temp_c,
                "recommendation": result.recommendation
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/ventilation", response_model=dict)
async def ventilation_endpoint(data: VentilationInput):
    """
    Расчёт систем вентиляции по СП 60.13330.2020.
    
    **Пример запроса:**
    ```json
    {
        "room_volume_m3": 500,
        "room_type": "production",
        "workers_count": 10
    }
    ```
    
    **Возвращает:**
    - air_exchange_rate: кратность воздухообмена
    - supply_airflow_m3h: расход приточного воздуха
    - fan_power_kw: мощность вентилятора
    - heating_power_kw: мощность калорифера
    - recommendation: рекомендация
    """
    try:
        result = calculate_ventilation(data)
        return {
            "success": True,
            "data": {
                "air_exchange_rate": result.air_exchange_rate,
                "supply_airflow_m3h": result.supply_airflow_m3h,
                "exhaust_airflow_m3h": result.exhaust_airflow_m3h,
                "fan_power_kw": result.fan_power_kw,
                "heating_power_kw": result.heating_power_kw,
                "recommendation": result.recommendation
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
