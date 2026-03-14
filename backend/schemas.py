from pydantic import BaseModel, ConfigDict, Field
from typing import Any
from uuid import UUID as PyUUID
from datetime import datetime

# 1. Schema cho Input (Frontend gửi lên /predict) -> ĐÁP ỨNG YÊU CẦU B4
class PredictRequestSchema(BaseModel):
    # Dùng Field để validate min/max theo đúng Requirement B4
    CreditScore: float = Field(..., ge=300, le=850, description="Điểm tín dụng")
    Age: int = Field(..., ge=18, le=100)
    Tenure: int = Field(..., ge=0, le=10)
    Balance: float = Field(..., ge=0)
    NumOfProducts: int = Field(..., ge=1, le=4)
    HasCrCard: int = Field(..., ge=0, le=1)
    IsActiveMember: int = Field(..., ge=0, le=1)
    EstimatedSalary: float = Field(..., ge=0)
    login_count_last_30d: int = Field(..., ge=0)
    num_transactions_last_90d: int = Field(..., ge=0)
    avg_transaction_amount: float = Field(..., ge=0)
    complaint_count_last_12m: int = Field(..., ge=0)

# 2. Schema cho Output (Trả về từ DB qua API /applications)
class ApplicationResponseSchema(BaseModel):
    id: PyUUID
    input_data: dict[str, Any]
    churn_score: float
    will_churn: bool
    risk_level: str
    recommendation: str
    created_at: datetime
    updated_at: datetime

    # Pydantic v2: thay cho orm_mode
    model_config = ConfigDict(from_attributes=True)
