"""
Pydantic models for engineering calculators.
"""
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


# ===== Shaft Strength Models =====
class ShaftStrengthInput(BaseModel):
    torque_nm: float = Field(..., description="Крутящий момент, Н·м", gt=0)
    diameter_mm: float = Field(..., description="Диаметр вала, мм", gt=0)
    material_yield_mpa: float = Field(..., description="Предел текучести материала, МПа", gt=0)
    bending_moment_nm: float = Field(default=0.0, description="Изгибающий момент, Н·м", ge=0)
    axial_force_n: float = Field(default=0.0, description="Осевая сила, Н", ge=0)
    safety_factor: float = Field(default=2.0, description="Требуемый коэффициент запаса", ge=1.0)


class ShaftStrengthResult(BaseModel):
    shear_stress_mpa: float = Field(..., description="Касательное напряжение, МПа")
    normal_stress_mpa: float = Field(..., description="Нормальное напряжение, МПа")
    equivalent_stress_mpa: float = Field(..., description="Эквивалентное напряжение, МПа")
    allowable_stress_mpa: float = Field(..., description="Допускаемое напряжение, МПа")
    safety_factor_actual: float = Field(..., description="Фактический коэффициент запаса")
    is_safe: bool = Field(..., description="Прочность обеспечена")
    recommendation: str = Field(..., description="Рекомендация")


# ===== Thermal Balance Models =====
class ThermalBalanceInput(BaseModel):
    power_input_kw: float = Field(..., description="Подводимая мощность, кВт", gt=0)
    mass_flow_kg_s: float = Field(..., description="Массовый расход продукта, кг/с", gt=0)
    temp_inlet_c: float = Field(..., description="Температура на входе, °C")
    temp_outlet_c: float = Field(..., description="Температура на выходе, °C")
    specific_heat_j_kgk: float = Field(default=3600.0, description="Удельная теплоёмкость, Дж/(кг·К)", gt=0)
    ambient_temp_c: float = Field(default=20.0, description="Температура окружающей среды, °C")
    insulation_thickness_m: float = Field(default=0.05, description="Толщина изоляции, м", gt=0)
    insulation_lambda: float = Field(default=0.04, description="Теплопроводность изоляции, Вт/(м·К)", gt=0)
    surface_area_m2: float = Field(default=10.0, description="Площадь поверхности оборудования, м²", gt=0)


class ThermalBalanceResult(BaseModel):
    useful_power_kw: float = Field(..., description="Полезная тепловая мощность, кВт")
    heat_loss_kw: float = Field(..., description="Тепловые потери, кВт")
    efficiency_percent: float = Field(..., description="КПД, %")
    delta_temp_c: float = Field(..., description="Перепад температур, °C")
    recommendation: str = Field(..., description="Рекомендация")


# ===== Ventilation Models =====
class RoomType(str, Enum):
    PRODUCTION = "production"
    COLD_STORAGE = "cold_storage"
    CUTTING = "cutting"
    PACKAGING = "packaging"


class VentilationInput(BaseModel):
    model_config = ConfigDict(use_enum_values=True)
    
    room_volume_m3: float = Field(..., description="Объём помещения, м³", gt=0)
    room_type: RoomType = Field(..., description="Тип помещения")
    workers_count: int = Field(..., description="Количество работников", ge=0)
    heat_sources_kw: float = Field(default=0.0, description="Тепловыделения от оборудования, кВт", ge=0)
    contaminant_g_s: float = Field(default=0.0, description="Выделение вредных веществ, г/с", ge=0)
    room_temp_c: float = Field(default=16.0, description="Расчётная температура помещения, °C")
    outside_temp_c: float = Field(default=-10.0, description="Расчётная температура снаружи, °C")


class VentilationResult(BaseModel):
    air_exchange_rate: float = Field(..., description="Кратность воздухообмена, 1/ч")
    supply_airflow_m3h: float = Field(..., description="Расход приточного воздуха, м³/ч")
    exhaust_airflow_m3h: float = Field(..., description="Расход вытяжного воздуха, м³/ч")
    fan_power_kw: float = Field(..., description="Мощность вентилятора, кВт")
    heating_power_kw: float = Field(..., description="Мощность калорифера, кВт")
    recommendation: str = Field(..., description="Рекомендация")
