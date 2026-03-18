from pydantic import BaseModel, ConfigDict, Field
from typing import Any
from uuid import UUID as PyUUID
from datetime import datetime

class PredictRequestSchema(BaseModel):
    CreditScore: float = Field(..., ge=300, le=850)
    Geography: str = Field(..., description="France, Spain, or Germany")
    Gender: str = Field(..., description="Male or Female")
    Age: float = Field(..., ge=18, le=120) 
    Tenure: float = Field(..., ge=0, le=50) # Tăng lên 50 năm nếu cần
    Balance: float = Field(..., ge=0)
    NumOfProducts: int = Field(..., ge=1, le=4)
    HasCrCard: int = Field(..., ge=0, le=1)
    IsActiveMember: int = Field(..., ge=0, le=1)
    EstimatedSalary: float = Field(..., ge=0)

    # Các trường bổ sung cũ (đã có trong schema trước)
    login_count_last_30d: int = Field(..., ge=0)
    num_transactions_last_90d: int = Field(..., ge=0)
    avg_transaction_amount: float = Field(..., ge=0)
    complaint_count_last_12m: int = Field(..., ge=0)
    AVG_BALANCE_3M: float = Field(..., ge=0, description="Số dư trung bình 3 tháng")
    MAX_TRANSACTION_6M: float = Field(..., ge=0, description="Giao dịch lớn nhất 6 tháng")
    STDDEV_TRANSACTION_12M: float = Field(..., ge=0, description="Độ lệch chuẩn giao dịch 12 tháng")

    # === TẤT CẢ CÁC CỘT MỚI TỪ FEATURE ENGINEERING ===
    tenure_days: float = Field(..., ge=0)
    tenure_months: float = Field(..., ge=0)
    recency_days: int = Field(..., ge=0)
    tenure_group: str = Field(..., description="Nhóm kỳ hạn (category)")
    age_group: str = Field(..., description="Nhóm tuổi (category)")
    balance_salary_ratio: float = Field(..., ge=0)
    credit_utilization: float = Field(..., ge=0)
    balance_trend_L3M: float = Field(...)  # có thể âm
    total_txn_amount_L3M: float = Field(..., ge=0)
    avg_ticket_size_L3M: float = Field(..., ge=0)
    product_penetration: float = Field(..., ge=0)
    cross_sell_index: int = Field(..., ge=0)
    active_months_L3M: int = Field(..., ge=0)
    activity_ratio_L3M: float = Field(..., ge=0)
    is_dormant: int = Field(..., ge=0, le=1)
    event_diversity: float = Field(..., ge=0)

    # RFM & Transaction aggregates (L1M/L3M/L6M/L12M)
    count_L1M: int = Field(..., ge=0)
    sum_L1M: float = Field(..., ge=0)
    avg_L1M: float = Field(..., ge=0)
    max_L1M: float = Field(..., ge=0)
    std_L1M: float = Field(..., ge=0)
    cv_L1M: float = Field(..., ge=0)
    velocity_L1M: float = Field(..., ge=0)

    count_L3M: int = Field(..., ge=0)
    sum_L3M: float = Field(..., ge=0)
    avg_L3M: float = Field(..., ge=0)
    max_L3M: float = Field(..., ge=0)
    std_L3M: float = Field(..., ge=0)
    cv_L3M: float = Field(..., ge=0)
    velocity_L3M: float = Field(..., ge=0)

    count_L6M: int = Field(..., ge=0)
    sum_L6M: float = Field(..., ge=0)
    avg_L6M: float = Field(..., ge=0)
    max_L6M: float = Field(..., ge=0)
    std_L6M: float = Field(..., ge=0)
    cv_L6M: float = Field(..., ge=0)
    velocity_L6M: float = Field(..., ge=0)

    count_L12M: int = Field(..., ge=0)
    sum_L12M: float = Field(..., ge=0)
    avg_L12M: float = Field(..., ge=0)
    max_L12M: float = Field(..., ge=0)
    std_L12M: float = Field(..., ge=0)
    cv_L12M: float = Field(..., ge=0)
    velocity_L12M: float = Field(..., ge=0)

    # RFM scores
    freq_score: int = Field(..., ge=1, le=5, description="Điểm tần suất (1-5)")
    mon_score: int = Field(..., ge=1, le=5, description="Điểm tiền (1-5)")
    rec_score: int = Field(..., ge=1, le=5, description="Điểm gần đây (1-5)")
    rfm_score: int = Field(..., ge=0, description="Tổng điểm hoặc mã RFM")

    # Growth & Ratio metrics
    sum_growth_L3M_vs_L6M: float = Field(...)           # có thể âm
    count_growth_L3M_vs_L1M: float = Field(...)         # có thể âm
    inflow_outflow_ratio: float = Field(..., ge=0)
    positive_event_ratio: float = Field(..., ge=0, le=1)
    product_tenure_ratio: float = Field(..., ge=0)
    value_volatility: float = Field(..., ge=0)

    # Interaction & Derived features
    z_score_balance: float = Field(...)                 # có thể âm
    age_balance_interact: float = Field(...)
    product_active_interact: int = Field(..., ge=0)
    complaint_tenure_interact: float = Field(...)
    login_balance_interact: float = Field(...)


# 2. Schema cho Output (Trả về từ DB qua API /applications) -> KHÔNG THAY ĐỔI
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