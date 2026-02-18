from pydantic import BaseModel, Field, field_validator
from typing import List


class NPVInput(BaseModel):
    """Входные данные для расчёта NPV"""
    investment: float = Field(gt=0, description="Начальные инвестиции (руб)")
    cash_flows: List[float] = Field(min_length=1, description="Денежные потоки по годам")
    discount_rate: float = Field(ge=0, le=1, description="Ставка дисконтирования (0-1)")
    
    @field_validator('cash_flows')
    @classmethod
    def validate_cash_flows(cls, v):
        if not v:
            raise ValueError("Cash flows cannot be empty")
        return v
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "investment": 1000000,
                "cash_flows": [300000, 400000, 500000],
                "discount_rate": 0.10
            }]
        }
    }


class IRRInput(BaseModel):
    """Входные данные для расчёта IRR"""
    investment: float = Field(gt=0)
    cash_flows: List[float] = Field(min_length=1)
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "investment": 1000000,
                "cash_flows": [300000, 400000, 500000, 600000]
            }]
        }
    }


class ROIInput(BaseModel):
    """Входные данные для расчёта ROI"""
    investment: float = Field(gt=0, description="Инвестиции")
    total_return: float = Field(gt=0, description="Общий возврат")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "investment": 1000000,
                "total_return": 1500000
            }]
        }
    }


class PaybackInput(BaseModel):
    """Данные для расчёта срока окупаемости"""
    investment: float = Field(gt=0)
    annual_cash_flow: float = Field(gt=0, description="Годовой денежный поток")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "investment": 1000000,
                "annual_cash_flow": 250000
            }]
        }
    }