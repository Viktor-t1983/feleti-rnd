"""
Расчёт систем вентиляции производственных помещений.
По СП 60.13330.2020 и ГОСТ 12.1.005-88.
"""
from dataclasses import dataclass
from enum import Enum


class RoomType(str, Enum):
    PRODUCTION = "production"      # Производственное
    COLD_STORAGE = "cold_storage"  # Холодильная камера
    CUTTING = "cutting"            # Разделочный цех
    PACKAGING = "packaging"        # Упаковочный цех


@dataclass
class VentilationInput:
    room_volume_m3: float          # Объём помещения, м³
    room_type: RoomType            # Тип помещения
    workers_count: int             # Количество работников
    heat_sources_kw: float = 0.0   # Тепловыделения от оборудования, кВт
    contaminant_g_s: float = 0.0   # Выделение вредных веществ, г/с
    room_temp_c: float = 16.0      # Расчётная температура помещения, °C
    outside_temp_c: float = -10.0  # Расчётная температура снаружи, °C


@dataclass
class VentilationResult:
    air_exchange_rate: float       # Кратность воздухообмена, 1/ч
    supply_airflow_m3h: float      # Расход приточного воздуха, м³/ч
    exhaust_airflow_m3h: float     # Расход вытяжного воздуха, м³/ч
    fan_power_kw: float            # Мощность вентилятора, кВт
    heating_power_kw: float        # Мощность калорифера (подогрев), кВт
    recommendation: str


# Нормы кратности воздухообмена по типу помещения (1/ч)
AIR_EXCHANGE_NORMS = {
    RoomType.PRODUCTION: 4,
    RoomType.COLD_STORAGE: 6,
    RoomType.CUTTING: 5,
    RoomType.PACKAGING: 3,
}

# Расход воздуха на 1 работника, м³/ч
AIR_PER_WORKER = 60


def calculate_ventilation(data: VentilationInput) -> VentilationResult:
    """
    Расчёт воздухообмена по кратности и санитарным нормам.
    Берём максимум из двух методов.
    """
    norm_rate = AIR_EXCHANGE_NORMS.get(data.room_type, 4)
    
    # Метод 1: по кратности воздухообмена
    q_by_norm = data.room_volume_m3 * norm_rate
    
    # Метод 2: по санитарным нормам (на работника)
    q_by_workers = data.workers_count * AIR_PER_WORKER
    
    # Метод 3: по тепловыделениям
    q_by_heat = 0.0
    if data.heat_sources_kw > 0:
        # Q = W / (ρ * Cp * ΔT), ρ=1.2 кг/м³, Cp=1.005 кДж/(кг·К)
        delta_t = max(data.room_temp_c - data.outside_temp_c, 5)
        q_by_heat = (data.heat_sources_kw * 3600) / (1.2 * 1.005 * delta_t)
    
    # Принимаем максимальное значение
    supply = max(q_by_norm, q_by_workers, q_by_heat)
    exhaust = supply * 0.95  # вытяжка чуть меньше притока (подпор)
    
    actual_rate = supply / data.room_volume_m3
    
    # Мощность вентилятора (0.3 кВт на 1000 м³/ч — типовое)
    fan_power = supply / 1000 * 0.3
    
    # Мощность калорифера для подогрева воздуха
    heating = 0.0
    if data.outside_temp_c < data.room_temp_c:
        delta_heat = data.room_temp_c - data.outside_temp_c
        heating = supply * 1.2 * 1.005 * delta_heat / 3600  # кВт
    
    rec = (
        f"✅ Воздухообмен: {supply:.0f} м³/ч "
        f"(кратность {actual_rate:.1f}/ч, норма {norm_rate}/ч). "
        f"Вентилятор: {fan_power:.2f} кВт."
    )
    
    return VentilationResult(
        air_exchange_rate=round(actual_rate, 2),
        supply_airflow_m3h=round(supply, 0),
        exhaust_airflow_m3h=round(exhaust, 0),
        fan_power_kw=round(fan_power, 3),
        heating_power_kw=round(heating, 2),
        recommendation=rec,
    )
