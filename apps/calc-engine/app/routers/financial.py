from fastapi import APIRouter, HTTPException
from app.models.financial import NPVInput, IRRInput, ROIInput, PaybackInput
from app.calculators.npv_calculator import calculate_npv
from app.calculators.irr_calculator import calculate_irr
from app.calculators.roi_calculator import calculate_roi
from app.calculators.payback_calculator import calculate_payback

router = APIRouter(prefix="/api/financial", tags=["financial"])


@router.post("/npv", response_model=dict)
async def calculate_npv_endpoint(input_data: NPVInput):
    """
    Рассчитать NPV (Чистая приведённая стоимость)
    
    **Пример запроса:**
```json
    {
      "investment": 1000000,
      "cash_flows": [300000, 400000, 500000],
      "discount_rate": 0.10
    }
```
    
    **Возвращает:**
    - npv: значение NPV
    - decision: ACCEPT/REJECT
    - roi_percent: ROI в процентах
    """
    try:
        npv_value = calculate_npv(input_data)
        
        # Рассчитаем также ROI
        total_return = sum(input_data.cash_flows)
        roi_input = ROIInput(investment=input_data.investment, total_return=total_return)
        roi_value = calculate_roi(roi_input)
        
        return {
            "npv": npv_value,
            "decision": "ACCEPT" if npv_value > 0 else "REJECT",
            "roi_percent": roi_value
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/irr", response_model=dict)
async def calculate_irr_endpoint(input_data: IRRInput):
    """
    Рассчитать IRR (Внутренняя норма доходности)
    """
    try:
        irr_value = calculate_irr(input_data)
        
        if irr_value is None:
            raise HTTPException(status_code=400, detail="Cannot calculate IRR for given cash flows")
        
        return {
            "irr": irr_value,
            "decision": "ACCEPT" if irr_value > 10 else "REJECT",  # WACC = 10%
            "note": "IRR compared against WACC of 10%"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/roi", response_model=dict)
async def calculate_roi_endpoint(input_data: ROIInput):
    """
    Рассчитать ROI (Возврат инвестиций)
    """
    try:
        roi_value = calculate_roi(input_data)
        
        return {
            "roi_percent": roi_value,
            "decision": "ACCEPT" if roi_value > 0 else "REJECT"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payback", response_model=dict)
async def calculate_payback_endpoint(input_data: PaybackInput):
    """
    Рассчитать срок окупаемости
    """
    try:
        payback_years = calculate_payback(input_data)
        payback_months = int(payback_years * 12)
        
        return {
            "payback_years": payback_years,
            "payback_months": payback_months,
            "breakeven_year": int(payback_years) + 1,
            "decision": "ACCEPT" if payback_years <= 5 else "CAUTION"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))