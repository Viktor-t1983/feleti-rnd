import pytest
from app.calculators.payback_calculator import calculate_payback
from app.models.financial import PaybackInput


def test_payback_period():
    """Расчёт срока окупаемости"""
    input_data = PaybackInput(
        investment=1000000,
        annual_cash_flow=250000
    )
    
    years = calculate_payback(input_data)
    
    assert years == 4.0  # 1000000 / 250000


def test_payback_fractional():
    """Дробный срок окупаемости"""
    input_data = PaybackInput(
        investment=1000000,
        annual_cash_flow=300000
    )
    
    years = calculate_payback(input_data)
    
    assert abs(years - 3.33) < 0.01  # ~3.33 года


def test_payback_zero_cash_flow():
    """Должен выбросить ошибку при нулевом потоке"""
    with pytest.raises(ValueError):
        PaybackInput(
            investment=1000000,
            annual_cash_flow=0
        )