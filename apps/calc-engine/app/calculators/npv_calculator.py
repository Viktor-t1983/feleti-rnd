from app.models.financial import NPVInput


def calculate_npv(input_data: NPVInput) -> float:
    """
    Рассчитать NPV (Net Present Value)
    
    Формула: NPV = Σ(CFt / (1+r)^t) - I0
    где:
        CFt - денежный поток в период t
        r - ставка дисконтирования
        I0 - начальные инвестиции
    
    Args:
        input_data: Валидированные входные данные
    
    Returns:
        NPV значение (float)
    
    Example:
        >>> input_data = NPVInput(
        ...     investment=1000000,
        ...     cash_flows=[300000, 400000, 500000],
        ...     discount_rate=0.10
        ... )
        >>> npv = calculate_npv(input_data)
        >>> print(f"NPV: {npv:.2f}")
        NPV: 200000.00
    """
    npv = -input_data.investment
    
    for year, cash_flow in enumerate(input_data.cash_flows, start=1):
        discounted_value = cash_flow / ((1 + input_data.discount_rate) ** year)
        npv += discounted_value
    
    return round(npv, 2)