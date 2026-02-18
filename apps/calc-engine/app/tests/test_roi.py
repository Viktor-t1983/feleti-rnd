import pytest
from app.calculators.roi_calculator import calculate_roi
from app.models.financial import ROIInput


def test_roi_positive():
    """ROI должен быть положительным при прибыли"""
    input_data = ROIInput(
        investment=1000000,
        total_return=1500000
    )
    
    roi_percent = calculate_roi(input_data)
    
    assert roi_percent == 50.0  # (1500k - 1000k) / 1000k * 100


def test_roi_negative():
    """ROI должен быть отрицательным при убытках"""
    input_data = ROIInput(
        investment=1000000,
        total_return=800000
    )
    
    roi_percent = calculate_roi(input_data)
    
    assert roi_percent == -20.0


def test_roi_zero():
    """ROI = 0 при безубыточности"""
    input_data = ROIInput(
        investment=1000000,
        total_return=1000000
    )
    
    roi_percent = calculate_roi(input_data)
    
    assert roi_percent == 0.0