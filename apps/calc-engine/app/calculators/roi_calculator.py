from app.models.financial import ROIInput


def calculate_roi(input_data: ROIInput) -> float:
    """
    Рассчитать ROI (Return on Investment)
    
    Формула: ROI = ((Total Return - Investment) / Investment) * 100
    
    Args:
        input_data: Валидированные входные данные
    
    Returns:
        ROI в процентах (float)
    """
    roi = ((input_data.total_return - input_data.investment) / input_data.investment) * 100
    return round(roi, 2)