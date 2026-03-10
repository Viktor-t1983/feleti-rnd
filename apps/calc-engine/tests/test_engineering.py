"""
Tests for engineering calculators.
"""
import pytest
from app.calculators.strength import ShaftStrengthInput, calculate_shaft_strength
from app.calculators.thermal import ThermalBalanceInput, calculate_thermal_balance
from app.calculators.ventilation import VentilationInput, RoomType, calculate_ventilation


class TestShaftStrength:
    def test_safe_shaft(self):
        """Вал диаметром 50мм при моменте 500 Нм — должен быть прочным"""
        result = calculate_shaft_strength(ShaftStrengthInput(
            torque_nm=500,
            diameter_mm=50,
            material_yield_mpa=355,  # Сталь 45
            safety_factor=2.0
        ))
        assert result.is_safe == True
        assert result.safety_factor_actual >= 2.0
        assert result.shear_stress_mpa > 0

    def test_unsafe_shaft(self):
        """Тонкий вал при большом моменте — должен быть непрочным"""
        result = calculate_shaft_strength(ShaftStrengthInput(
            torque_nm=5000,
            diameter_mm=20,
            material_yield_mpa=355,
            safety_factor=2.0
        ))
        assert result.is_safe == False

    def test_with_bending(self):
        """Вал с изгибом и кручением"""
        result = calculate_shaft_strength(ShaftStrengthInput(
            torque_nm=300,
            diameter_mm=40,
            material_yield_mpa=785,  # Сталь 40Х
            bending_moment_nm=200,
            safety_factor=2.5
        ))
        assert result.equivalent_stress_mpa > result.shear_stress_mpa


class TestThermalBalance:
    def test_good_efficiency(self):
        """Варочный котёл с хорошим КПД"""
        result = calculate_thermal_balance(ThermalBalanceInput(
            power_input_kw=100,
            mass_flow_kg_s=0.5,
            temp_inlet_c=20,
            temp_outlet_c=80,
            specific_heat_j_kgk=3600,
        ))
        assert result.efficiency_percent > 0
        assert result.useful_power_kw > 0
        assert result.delta_temp_c == 60

    def test_heat_loss(self):
        """Проверка расчёта тепловых потерь"""
        result = calculate_thermal_balance(ThermalBalanceInput(
            power_input_kw=50,
            mass_flow_kg_s=0.2,
            temp_inlet_c=0,
            temp_outlet_c=60,
            surface_area_m2=20,
        ))
        assert result.heat_loss_kw >= 0


class TestVentilation:
    def test_production_room(self):
        """Производственный цех 500 м³"""
        result = calculate_ventilation(VentilationInput(
            room_volume_m3=500,
            room_type=RoomType.PRODUCTION,
            workers_count=10,
        ))
        assert result.supply_airflow_m3h >= 500 * 4  # минимум по кратности
        assert result.fan_power_kw > 0
        assert result.air_exchange_rate >= 4

    def test_cold_storage(self):
        """Холодильная камера"""
        result = calculate_ventilation(VentilationInput(
            room_volume_m3=200,
            room_type=RoomType.COLD_STORAGE,
            workers_count=2,
            room_temp_c=4,
        ))
        assert result.air_exchange_rate >= 6

    def test_with_heat_sources(self):
        """Цех с оборудованием — воздухообмен выше"""
        result_no_heat = calculate_ventilation(VentilationInput(
            room_volume_m3=300,
            room_type=RoomType.CUTTING,
            workers_count=5,
            heat_sources_kw=0,
        ))
        result_with_heat = calculate_ventilation(VentilationInput(
            room_volume_m3=300,
            room_type=RoomType.CUTTING,
            workers_count=5,
            heat_sources_kw=50,
        ))
        assert result_with_heat.supply_airflow_m3h >= result_no_heat.supply_airflow_m3h
