"""
Тепловой баланс оборудования.
Расчёт тепловых потерь и КПД нагревательного/охладительного оборудования.
"""
from dataclasses import dataclass
import math


@dataclass
class ThermalBalanceInput:
    power_input_kw: float        # Подводимая мощность, кВт
    mass_flow_kg_s: float        # Массовый расход продукта, кг/с
    temp_inlet_c: float          # Температура на входе, °C
    temp_outlet_c: float         # Температура на выходе, °C
    specific_heat_j_kgk: float = 3600.0  # Удельная теплоёмкость, Дж/(кг·К) (мясо: ~3600)
    ambient_temp_c: float = 20.0          # Температура окружающей среды, °C
    insulation_thickness_m: float = 0.05  # Толщина изоляции, м
    insulation_lambda: float = 0.04       # Теплопроводность изоляции, Вт/(м·К) (минвата)
    surface_area_m2: float = 10.0         # Площадь поверхности оборудования, м²


@dataclass
class ThermalBalanceResult:
    useful_power_kw: float      # Полезная тепловая мощность, кВт
    heat_loss_kw: float         # Тепловые потери, кВт
    efficiency_percent: float   # КПД, %
    delta_temp_c: float         # Перепад температур, °C
    recommendation: str


def calculate_thermal_balance(data: ThermalBalanceInput) -> ThermalBalanceResult:
    """
    Тепловой баланс: Q_useful = m * Cp * ΔT
    Потери через изоляцию: Q_loss = λ * A * ΔT_ambient / δ
    """
    delta_t = abs(data.temp_outlet_c - data.temp_inlet_c)
    
    # Полезная тепловая мощность
    q_useful = data.mass_flow_kg_s * data.specific_heat_j_kgk * delta_t / 1000  # кВт
    
    # Тепловые потери через изоляцию
    delta_t_ambient = abs(
        (data.temp_inlet_c + data.temp_outlet_c) / 2 - data.ambient_temp_c
    )
    q_loss = (data.insulation_lambda * data.surface_area_m2 * delta_t_ambient 
              / data.insulation_thickness_m / 1000)  # кВт
    
    # КПД
    efficiency = (q_useful / data.power_input_kw * 100) if data.power_input_kw > 0 else 0
    efficiency = min(efficiency, 99.9)
    
    if efficiency >= 85:
        rec = f"✅ Хороший КПД ({efficiency:.1f}%). Оборудование эффективно."
    elif efficiency >= 70:
        rec = f"⚠️ Удовлетворительный КПД ({efficiency:.1f}%). Проверьте изоляцию."
    else:
        rec = f"❌ Низкий КПД ({efficiency:.1f}%). Требуется улучшение изоляции или снижение потерь."
    
    return ThermalBalanceResult(
        useful_power_kw=round(q_useful, 2),
        heat_loss_kw=round(q_loss, 2),
        efficiency_percent=round(efficiency, 1),
        delta_temp_c=round(delta_t, 1),
        recommendation=rec,
    )
