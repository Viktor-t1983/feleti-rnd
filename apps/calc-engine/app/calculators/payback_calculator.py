from app.models.financial import PaybackInput


def calculate_payback(input_data: PaybackInput) -> float:
    """
    Рассчитать срок окупаемости (Payback Period)
    
    Формула: Payback = Investment / Annual Cash Flow
    
    Args:
        input_data: Валидированные входные данные
    
    Returns:
        Срок окупаемости в годах (float)
    """
    payback_years = input_data.investment / input_data.annual_cash_flow
    return round(payback_years, 2)