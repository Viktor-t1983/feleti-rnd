import numpy as np
from scipy.optimize import newton
from app.models.financial import IRRInput


def calculate_irr(input_data: IRRInput) -> float:
    """
    Рассчитать IRR (Internal Rate of Return)
    
    IRR - это ставка дисконтирования при которой NPV = 0
    
    Args:
        input_data: Валидированные входные данные
    
    Returns:
        IRR в процентах (float) или None если не удалось найти решение
    """
    # Функция NPV(r) для заданных потоков
    def npv_func(rate):
        npv = -input_data.investment
        for year, cash_flow in enumerate(input_data.cash_flows, start=1):
            npv += cash_flow / ((1 + rate) ** year)
        return npv
    
    try:
        # Начальное предположение: 0.1 (10%)
        irr = newton(npv_func, x0=0.1, maxiter=100)
        # Конвертируем в проценты
        irr_percent = irr * 100
        return round(irr_percent, 2)
    except (RuntimeError, ValueError):
        # Если не удалось найти корень
        return None