"""
Tests for Calc Engine Calculators

Run with: PYTHONPATH=./app pytest tests/
"""
import pytest

from app.calculators.irr_calculator import calculate_irr
from app.calculators.npv_calculator import calculate_npv
from app.calculators.payback_calculator import calculate_payback
from app.calculators.roi_calculator import calculate_roi


class TestNPVCalculator:
    """Tests for NPV Calculator"""

    def test_npv_positive_return(self):
        """Test NPV with positive cash flows"""
        cash_flows = [-1000, 300, 400, 400, 300]  # Initial investment + returns
        rate = 0.1  # 10% discount rate

        result = calculate_npv(cash_flows, rate)

        assert isinstance(result, dict)
        assert 'npv' in result
        assert result['npv'] > 0  # Positive NPV means profitable

    def test_npv_negative_return(self):
        """Test NPV with negative cash flows"""
        cash_flows = [-1000, 100, 100, 100, 100]  # Low returns
        rate = 0.2  # 20% discount rate

        result = calculate_npv(cash_flows, rate)

        assert isinstance(result, dict)
        assert 'npv' in result
        assert result['npv'] < 0  # Negative NPV

    def test_npv_zero_rate(self):
        """Test NPV with zero discount rate"""
        cash_flows = [-1000, 500, 500, 500]
        rate = 0.0

        result = calculate_npv(cash_flows, rate)

        assert isinstance(result, dict)
        assert 'npv' in result
        # Without discounting, NPV is just sum of cash flows
        expected_npv = sum(cash_flows)
        assert abs(result['npv'] - expected_npv) < 0.01

    def test_npv_empty_cash_flows(self):
        """Test NPV with empty cash flows"""
        cash_flows = []
        rate = 0.1

        result = calculate_npv(cash_flows, rate)

        assert isinstance(result, dict)
        assert 'npv' in result
        assert result['npv'] == 0


class TestIRRCalculator:
    """Tests for IRR Calculator"""

    def test_irr_positive(self):
        """Test IRR calculation with positive return"""
        cash_flows = [-1000, 300, 400, 400, 300]

        result = calculate_irr(cash_flows)

        assert isinstance(result, dict)
        assert 'irr' in result
        assert result['irr'] is not None
        assert result['irr'] > 0  # Positive IRR

    def test_irr_negative(self):
        """Test IRR with unprofitable investment"""
        cash_flows = [-1000, 100, 100, 100]

        result = calculate_irr(cash_flows)

        assert isinstance(result, dict)
        assert 'irr' in result

    def test_irr_single_period(self):
        """Test IRR with single period"""
        cash_flows = [-100, 110]  # 10% return

        result = calculate_irr(cash_flows)

        assert isinstance(result, dict)
        assert 'irr' in result
        if result['irr'] is not None:
            assert abs(result['irr'] - 0.10) < 0.01  # ~10%

    def test_irr_insufficient_data(self):
        """Test IRR with insufficient cash flows"""
        cash_flows = [-1000]  # Only initial investment

        result = calculate_irr(cash_flows)

        assert isinstance(result, dict)
        assert 'irr' in result
        # Should handle gracefully


class TestROICalculator:
    """Tests for ROI Calculator"""

    def test_roi_basic(self):
        """Test basic ROI calculation"""
        investment = 1000
        returns = 1200

        result = calculate_roi(investment, returns)

        assert isinstance(result, dict)
        assert 'roi' in result
        expected_roi = (returns - investment) / investment * 100
        assert abs(result['roi'] - expected_roi) < 0.01

    def test_roi_zero_investment(self):
        """Test ROI with zero investment"""
        investment = 0
        returns = 100

        result = calculate_roi(investment, returns)

        assert isinstance(result, dict)
        # Should handle division by zero

    def test_roi_loss(self):
        """Test ROI with loss"""
        investment = 1000
        returns = 800

        result = calculate_roi(investment, returns)

        assert isinstance(result, dict)
        assert 'roi' in result
        assert result['roi'] < 0  # Negative ROI

    def test_roi_break_even(self):
        """Test ROI break even"""
        investment = 1000
        returns = 1000

        result = calculate_roi(investment, returns)

        assert isinstance(result, dict)
        assert 'roi' in result
        assert abs(result['roi']) < 0.01  # Zero ROI


class TestPaybackCalculator:
    """Tests for Payback Period Calculator"""

    def test_payback_normal(self):
        """Test normal payback calculation"""
        initial_investment = 1000
        cash_flows = [300, 400, 400, 300]

        result = calculate_payback(initial_investment, cash_flows)

        assert isinstance(result, dict)
        assert 'payback_period' in result
        assert result['payback_period'] is not None
        assert result['payback_period'] > 0

    def test_payback_exact(self):
        """Test payback at exact period"""
        initial_investment = 1000
        cash_flows = [500, 500, 100]

        result = calculate_payback(initial_investment, cash_flows)

        assert isinstance(result, dict)
        assert 'payback_period' in result
        assert result['payback_period'] == 2.0  # Exact at period 2

    def test_payback_never(self):
        """Test when investment is never recovered"""
        initial_investment = 1000
        cash_flows = [100, 100, 100]

        result = calculate_payback(initial_investment, cash_flows)

        assert isinstance(result, dict)
        assert 'payback_period' in result
        # Should indicate payback not achieved

    def test_payback_immediate(self):
        """Test immediate payback"""
        initial_investment = 100
        cash_flows = [1000, 100]

        result = calculate_payback(initial_investment, cash_flows)

        assert isinstance(result, dict)
        assert 'payback_period' in result
        assert result['payback_period'] <= 1.0


@pytest.mark.skip(reason="Placeholder tests - replace with real engineering calculator tests when module is implemented")
class TestEngineeringCalculations:
    """
    Placeholder tests for Engineering-specific calculations.

    TODO: Replace with real tests for actual engineering calculators from app.calculators.engineering
    when the module is implemented. These tests currently verify basic physics formulas as examples.
    """

    def test_thermal_balance_basic(self):
        """Placeholder: Basic thermal balance calculation (heat_input * efficiency)"""
        # NOTE: This is a placeholder test. Replace with actual ThermalBalanceCalculator test.
        heat_input = 1000  # kW
        efficiency = 0.85  # 85%

        heat_output = heat_input * efficiency

        assert heat_output == 850
        assert heat_output < heat_input  # Efficiency < 1

    def test_shaft_stress_calculation(self):
        """Placeholder: Shaft stress calculation (Force / Area)"""
        # NOTE: This is a placeholder test. Replace with actual ShaftStressCalculator test.
        force = 10000  # N
        diameter = 0.05  # m (50mm)
        area = 3.14159 * (diameter / 2) ** 2

        stress = force / area

        assert stress > 0
        assert isinstance(stress, float)

    def test_ventilation_airflow(self):
        """Placeholder: Ventilation airflow calculation (Volume * air_changes)"""
        # NOTE: This is a placeholder test. Replace with actual VentilationCalculator test.
        room_volume = 100  # m³
        air_changes_per_hour = 6

        airflow = room_volume * air_changes_per_hour

        assert airflow == 600  # m³/h


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
