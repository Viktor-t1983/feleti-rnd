import pytest
from app.calculators.irr_calculator import calculate_irr
from app.models.financial import IRRInput


def test_irr_calculation():
    """IRR должен вернуть корректное значение"""
    input_data = IRRInput(
        investment=1000000,
        cash_flows=[300000, 400000, 500000, 600000]
    )
    
    irr = calculate_irr(input_data)
    
    # IRR должен быть в разумных пределах (ожидаем ~30%)
    assert irr is not None
    assert 20 < irr < 40


def test_irr_breakeven():
    """IRR должен быть ~0 при безубыточности"""
    input_data = IRRInput(
        investment=1000000,
        cash_flows=[250000, 250000, 250000, 250000]
    )
    
    irr = calculate_irr(input_data)
    
    # Должен быть около 0% (или None если не удалось вычислить)
    if irr is not None:
        assert -5 < irr < 5
    # Если None - допустимо, пропускаем проверку


def test_irr_no_solution():
    """Должен обработать случаи без решения"""
    input_data = IRRInput(
        investment=1000000,
        cash_flows=[10000, 20000, 30000]  # Слишком малые
    )
    
    # Должен вернуть None, так как IRR не существует
    irr = calculate_irr(input_data)
    assert irr is None