from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Any
from uuid import UUID as PyUUID
from datetime import datetime
# ════════════════════════════════════════════════════════════════
class PredictRequestSchema(BaseModel):

    # ── Static / Demographics ─────────────────────────────────────
    CreditScore: float = Field(..., ge=300, le=850,
                               description="Điểm tín dụng (300–850)")
    Gender: str        = Field(..., description="Male hoặc Female")
    Age: float         = Field(..., ge=18, le=100,
                               description="Tuổi khách hàng")
    Balance: float     = Field(..., ge=0,
                               description="Số dư tài khoản hiện tại")
    NumOfProducts: int = Field(..., ge=1, le=4,
                               description="Số sản phẩm đang sử dụng")
    HasCrCard: int     = Field(..., ge=0, le=1,
                               description="Có thẻ tín dụng (0/1)")
    IsActiveMember: int= Field(..., ge=0, le=1,
                               description="Là thành viên active (0/1)")
    EstimatedSalary: float = Field(..., ge=0,
                                   description="Thu nhập ước tính")

    # ── Behavioral — Tenure ───────────────────────────────────────
    tenure_months: float = Field(..., ge=0,
                                  description="Số tháng là khách hàng (continuous, từ notebook)")

    # ── Behavioral — Recency [R] ──────────────────────────────────
    days_since_last_login: int = Field(..., ge=0, le=365,
                                       description="Số ngày kể từ lần đăng nhập cuối")
    days_since_last_txn: int   = Field(..., ge=0, le=365,
                                       description="Số ngày kể từ giao dịch cuối")

    # ── Behavioral — Login Rolling [B] ────────────────────────────
    login_count_3m: float = Field(..., ge=0,
                                   description="Số lần đăng nhập cộng dồn 3 tháng (sau EWM smoothing)")
    login_count_1m: float = Field(..., ge=0,
                                   description="Số lần đăng nhập tháng gần nhất (M-1)")

    # ── Behavioral — Transaction Rolling [B] ──────────────────────
    txn_count_3m: float      = Field(..., ge=0,
                                      description="Số giao dịch cộng dồn 3 tháng")
    txn_count_1m: float      = Field(..., ge=0,
                                      description="Số giao dịch tháng gần nhất (M-1)")
    avg_txn_amount_3m: float = Field(..., ge=0,
                                      description="Giá trị giao dịch trung bình 3 tháng")
    std_txn_amount_3m: float = Field(..., ge=0,
                                      description="Độ lệch chuẩn giá trị giao dịch 3 tháng")

    # ── Behavioral — Balance trend ────────────────────────────────
    balance_change_pct: float = Field(..., ge=-1.0, le=1.0,
                                      description="% thay đổi số dư so với 3 tháng trước "
                                                  "(âm = đang rút tiền)")

    # ── Behavioral — Complaints ───────────────────────────────────
    complaint_count: int = Field(..., ge=0, le=10,
                                 description="Số lần khiếu nại trong 3 tháng gần nhất")

    # ── Validators ───────────────────────────────────────────────
    @field_validator("Gender")
    @classmethod
    def gender_valid(cls, v: str) -> str:
        if v not in ("Male", "Female"):
            raise ValueError("Gender phải là 'Male' hoặc 'Female'")
        return v

    @field_validator("login_count_3m")
    @classmethod
    def login_3m_gte_1m(cls, v, info):
        lm = info.data.get("login_count_1m", 0)
        if v < lm:
            raise ValueError("login_count_3m phải >= login_count_1m")
        return v

    @field_validator("txn_count_3m")
    @classmethod
    def txn_3m_gte_1m(cls, v, info):
        tm = info.data.get("txn_count_1m", 0)
        if v < tm:
            raise ValueError("txn_count_3m phải >= txn_count_1m")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "CreditScore": 620,
                "Gender": "Male",
                "Age": 38,
                "Balance": 75000.0,
                "NumOfProducts": 1,
                "HasCrCard": 1,
                "IsActiveMember": 0,
                "EstimatedSalary": 60000.0,
                "tenure_months": 18.0,
                "days_since_last_login": 45,
                "days_since_last_txn": 52,
                "login_count_3m": 6.5,
                "login_count_1m": 2.0,
                "txn_count_3m": 5.2,
                "txn_count_1m": 1.0,
                "avg_txn_amount_3m": 350.0,
                "std_txn_amount_3m": 120.0,
                "balance_change_pct": -0.12,
                "complaint_count": 1
            }
        }
    )


# ════════════════════════════════════════════════════════════════
# OUTPUT SCHEMA — Trả về từ DB qua /applications
# ════════════════════════════════════════════════════════════════
class ApplicationResponseSchema(BaseModel):
    id: PyUUID
    input_data: dict[str, Any]
    churn_score: float
    will_churn: bool
    risk_level: str
    recommendation: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)