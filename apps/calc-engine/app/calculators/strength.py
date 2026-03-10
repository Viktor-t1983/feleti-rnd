"""
Расчёт прочности валов для мясоперерабатывающего оборудования.
Методика по ГОСТ 21354-87.
"""
from dataclasses import dataclass
from typing import Optional
import math


@dataclass
class ShaftStrengthInput:
    torque_nm: float          # Крутящий момент, Н·м
    diameter_mm: float        # Диаметр вала, мм
    material_yield_mpa: float # Предел текучести материала, МПа (сталь 45: 355, сталь 40Х: 785)
    bending_moment_nm: float = 0.0  # Изгибающий момент, Н·м
    axial_force_n: float = 0.0      # Осевая сила, Н
    safety_factor: float = 2.0      # Требуемый коэффициент запаса


@dataclass  
class ShaftStrengthResult:
    shear_stress_mpa: float       # Касательное напряжение, МПа
    normal_stress_mpa: float      # Нормальное напряжение, МПа
    equivalent_stress_mpa: float  # Эквивалентное напряжение, МПа
    allowable_stress_mpa: float   # Допускаемое напряжение, МПа
    safety_factor_actual: float   # Фактический коэффициент запаса
    is_safe: bool                 # Прочность обеспечена
    recommendation: str           # Рекомендация


def calculate_shaft_strength(data: ShaftStrengthInput) -> ShaftStrengthResult:
    """
    Расчёт вала на прочность по 3-й теории прочности (Мизес).
    """
    d = data.diameter_mm / 1000  # м
    
    # Момент сопротивления сечения
    W_p = math.pi * d**3 / 16   # полярный (кручение)
    W   = math.pi * d**3 / 32   # осевой (изгиб)
    A   = math.pi * d**2 / 4    # площадь сечения
    
    # Напряжения
    tau   = (data.torque_nm / W_p) / 1e6          # МПа — касательное от кручения
    sigma_b = (data.bending_moment_nm / W) / 1e6  # МПа — от изгиба
    sigma_a = (data.axial_force_n / A) / 1e6       # МПа — от осевой силы
    sigma   = sigma_b + sigma_a                    # суммарное нормальное
    
    # Эквивалентное напряжение (Мизес)
    sigma_eq = math.sqrt(sigma**2 + 3 * tau**2)
    
    # Допускаемое напряжение
    sigma_allow = data.material_yield_mpa / data.safety_factor
    
    # Фактический запас прочности
    safety = data.material_yield_mpa / sigma_eq if sigma_eq > 0 else float('inf')
    is_safe = sigma_eq <= sigma_allow
    
    if is_safe:
        rec = f"✅ Вал прочный. Запас прочности {safety:.2f} (требуется {data.safety_factor})"
    else:
        # Рекомендовать минимальный диаметр
        d_min = (16 * data.torque_nm / (math.pi * sigma_allow * 1e6))**(1/3) * 1000
        rec = f"❌ Недостаточная прочность! Минимальный диаметр: {d_min:.1f} мм"
    
    return ShaftStrengthResult(
        shear_stress_mpa=round(tau, 2),
        normal_stress_mpa=round(sigma, 2),
        equivalent_stress_mpa=round(sigma_eq, 2),
        allowable_stress_mpa=round(sigma_allow, 2),
        safety_factor_actual=round(safety, 2),
        is_safe=is_safe,
        recommendation=rec,
    )
