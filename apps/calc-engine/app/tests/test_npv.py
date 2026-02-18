import pytest
from app.calculators.npv_calculator import calculate_npv
from app.models.financial import NPVInput


def test_npv_positive_with_good_cash_flows():
    """NPV должен быть положительным при хороших денежных потоках"""
    input_data = NPVInput(
        investment=1000000,
        cash_flows=[300000, 400000, 500000, 600000],
        discount_rate=0.10
    )
    
    npv = calculate_npv(input_data)
    
    assert npv > 0
    # Проверяем примерное значение (рассчитанное: ~388,771)
    assert 380000 < npv < 400000


def test_npv_negative_with_poor_cash_flows():
    """NPV должен быть отрицательным при слабых потоках"""
    input_data = NPVInput(
        investment=1000000,
        cash_flows=[50000, 60000, 70000],
        discount_rate=0.10
    )
    
    npv = calculate_npv(input_data)
    assert npv < 0


def test_npv_zero_discount_rate():
    """NPV = сумма потоков - инвестиции при ставке 0%"""
    input_data = NPVInput(
        investment=1000000,
        cash_flows=[300000, 400000, 500000],
        discount_rate=0.0
    )
    
    npv = calculate_npv(input_data)
    assert npv == 200000  # 1200000 - 1000000


def test_npv_invalid_discount_rate():
    """Должен выбросить ValueError при некорректной ставке"""
    with pytest.raises(ValueError):
        NPVInput(
            investment=1000000,
            cash_flows=[300000],
            discount_rate=1.5  # > 100%!
        )


def test_npv_empty_cash_flows():
    """Должен требовать хотя бы один денежный поток"""
    with pytest.raises(ValueError):
        NPVInput(
            investment=1000000,
            cash_flows=[],
            discount_rate=0.10
        )


def test_npv_negative_investment():
    """Инвестиции должны быть положительными"""
    with pytest.raises(ValueError):
        NPVInput(
            investment=-1000000,
            cash_flows=[300000],
            discount_rate=0.10
        )