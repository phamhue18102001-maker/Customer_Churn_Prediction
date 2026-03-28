from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import joblib
import os

load_dotenv()

from backend.schemas import PredictRequestSchema
from backend.model_service import churn_service
from utils.database import ChurnPredictionDB, supabase

app = FastAPI(
    title="Customer Churn Predictor",
    version="2.0",
    description=(
        "API dự đoán churn với XGBoost + Feature Engineering từ Data_churn_customer. "
        "Input: raw behavioral + demographic fields. "
        "Tự động tính trend%, drop ratio, rolling features, interaction."
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "app"    : "Churn Prediction API v2",
        "model"  : "XGBoost + Panel Feature Engineering",
        "endpoints": {
            "health"    : "/health",
            "predict"   : "POST /predict",
            "history"   : "GET /applications",
            "model_info": "/model-info",
            "docs"      : "/docs"
        }
    }


@app.head("/")
def head_root():
    return {"status": "running"}


@app.get("/health")
def health():
    try:
        supabase.table("applications").select("id").limit(1).execute()
        db_status = "Connected"
    except Exception as e:
        db_status = f"Disconnected: {str(e)[:80]}"

    model_status = "loaded" if churn_service.model is not None else "NOT LOADED"

    return {
        "status"     : "healthy" if model_status == "loaded" else "degraded",
        "model"      : model_status,
        "model_type" : "XGBoost (native Booster)",
        "threshold"  : float(churn_service.threshold),
        "database"   : db_status,
        "environment": os.getenv("ENVIRONMENT", "development")
    }


@app.post("/predict")
async def predict(application: PredictRequestSchema):
    """
    Dự đoán churn cho 1 khách hàng.

    **Input (raw behavioral + demographic fields):**
    - Recency: days_since_last_login, days_since_last_txn
    - Rolling: login_count_3m, login_count_1m, txn_count_3m, txn_count_1m,
               avg_txn_amount_3m, std_txn_amount_3m
    - Profile: CreditScore, Gender, Age, tenure_months, Balance,
               NumOfProducts, HasCrCard, IsActiveMember, EstimatedSalary
    - Other: balance_change_pct, complaint_count

    **Feature engineering tự động bên trong service:**
    login_trend_pct, txn_trend_pct, login_drop_ratio, txn_drop_ratio,
    login_per_day_3m, balance_to_salary, spend_to_income,
    high_balance_low_txn, complaint_and_inactive.

    **Output:** churn_probability, will_churn, risk_level,
    recommendation, warning_flags, txn_drop_ratio, txn_trend_pct.
    """
    input_dict = application.model_dump()

    try:
        result = churn_service.predict_churn(input_dict)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Lưu vào DB
    ChurnPredictionDB.save_prediction(
        input_data    = input_dict,
        churn_score   = result["churn_probability"],
        will_churn    = result["will_churn"],
        risk_level    = result["risk_level"],
        recommendation= result["recommendation"]
    )

    return result


@app.get("/applications")
def get_history(page: int = 1, limit: int = 10):
    """Lấy lịch sử dự đoán (phân trang)."""
    data = ChurnPredictionDB.get_history(page=page, limit=limit)
    return {"data": data, "page": page, "limit": limit, "total_records": len(data)}


@app.get("/applications/{id}")
def get_detail(id: str):
    """Lấy chi tiết 1 bản ghi dự đoán."""
    data = ChurnPredictionDB.get_detail(id)
    if not data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")
    return data


@app.get("/model-info")
def model_info():
    """Thông tin model và feature engineering đang chạy."""
    try:
        threshold = joblib.load("models/optimal_threshold.pkl")
    except Exception:
        threshold = churn_service.threshold

    try:
        config = joblib.load("models/config.pkl")
        auc    = config.get("auc", "N/A")
        n_features = config.get("features_count", 23)
        last_trained = config.get("last_train_date", "N/A")
    except Exception:
        auc = "N/A"
        n_features = 23
        last_trained = "N/A"

    return {
        "model"                : "XGBoost (bst từ Data_churn_customer.ipynb)",
        "raw_input_fields"     : 19,
        "engineered_features"  : n_features,
        "last_trained"         : last_trained,
        "reported_roc_auc"     : auc,
        "feature_groups": [
            "[R] Recency        — days_since_last_login, days_since_last_txn",
            "[T] Trend %        — txn_trend_pct, login_trend_pct (âm = giảm)",
            "[D] Drop Ratio     — txn_drop_ratio, login_drop_ratio (gần 0 = tụt mạnh)",
            "[B] Rolling        — txn_count_3m, avg/std txn_amount_3m, login_per_day_3m",
            "Balance            — balance_change_pct, Balance, balance_to_salary",
            "Profile            — Age, tenure_months, NumOfProducts, IsActiveMember, CreditScore",
            "Ratio              — spend_to_income",
            "Complaint          — complaint_count",
            "Interaction        — high_balance_low_txn, complaint_and_inactive",
            "Categorical        — Gender (OHE bởi preprocessor)",
        ],
        "threshold"            : float(threshold),
        "threshold_method"     : "F2-optimal hoặc Youden-J (chọn từ notebook cell 9)",
        "imbalance_handling"   : "scale_pos_weight = imbalance_ratio × 1.2",
        "cv_strategy"          : "Time-based split (80% tháng đầu train, 20% test)",
        "split_strategy"       : "OOT = tháng cuối, VAL = tháng áp chót, TRAIN = còn lại",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)