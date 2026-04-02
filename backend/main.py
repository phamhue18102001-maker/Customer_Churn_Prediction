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
# ========================== PANEL DATA LOADER ==========================
import pandas as pd
from pathlib import Path

# PANEL_ALL: { CustomerId -> [ {snapshot_date, ...fields} ] } — tất cả 12 tháng
# PANEL_LATEST: { CustomerId -> {snapshot mới nhất} } — dùng cho predict đơn
PANEL_ALL: dict | None = None
PANEL_LATEST: dict | None = None

try:
    data_path = Path(__file__).parent.parent / "data/bank_churn_panel_v2.csv"
    df = pd.read_csv(data_path)
    df["snapshot_date"] = pd.to_datetime(df["snapshot_date"])
    df = df.sort_values(["CustomerId", "snapshot_date"])

    # Build PANEL_ALL: group theo CustomerId, giữ list các snapshot theo thứ tự thời gian
    PANEL_ALL = {}
    for cid, group in df.groupby("CustomerId"):
        PANEL_ALL[cid] = group.to_dict("records")

    # Build PANEL_LATEST: lấy snapshot mới nhất của mỗi KH
    df_latest = df.groupby("CustomerId").last().reset_index()
    PANEL_LATEST = df_latest.set_index("CustomerId").to_dict("index")

    print(f"✅ Loaded Panel: {len(PANEL_ALL):,} customers x 12 snapshots")
except Exception as e:
    print(f"⚠️ Không load được panel data: {e}")
    PANEL_ALL = None
    PANEL_LATEST = None
# =======================================================================

@app.get("/")
def root():
    return {
        "app": "Churn Prediction API v2",
        "model": "XGBoost + Panel Feature Engineering",
        "endpoints": {
            "health": "/health",
            "predict": "POST /predict",
            "predict_by_customer_id": "GET /predict_by_customer_id/{customer_id}",
            "customer_timeline": "GET /customer/{customer_id}  ← 12 tháng + prediction mỗi tháng",
            "history": "GET /applications",
            "model_info": "/model-info",
            "docs": "/docs"
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

@app.get("/predict_by_customer_id/{customer_id}")
async def predict_by_customer_id(customer_id: str):
    """Dự đoán churn cho snapshot MỚI NHẤT của khách hàng."""
    if PANEL_LATEST is None:
        raise HTTPException(status_code=503, detail="Panel data chưa load")

    if customer_id not in PANEL_LATEST:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy CustomerId: {customer_id}")

    row = PANEL_LATEST[customer_id]

    input_dict = {
    "days_since_last_txn": int(row.get("days_since_last_txn", 0)),
    "days_since_last_login": int(row.get("days_since_last_login", row.get("days_since_last_txn", 0))),  # fallback
    
    "txn_count_3m": int(row.get("txn_count_3m", 0)),
    "txn_count_1m": int(row.get("txn_count_1m", 0)),
    "login_count_3m": int(row.get("login_count_3m", 0)),
    "login_count_1m": int(row.get("login_count_1m", 0)),
    
    "avg_txn_amount_3m": float(row.get("avg_txn_amount_3m", 0)),
    "std_txn_amount_3m": float(row.get("std_txn_amount_3m", 0)),
    
    "CreditScore": float(row.get("CreditScore", 0)),
    "Gender": "Male" if row.get("Gender_Male", False) else "Female",
    "Age": float(row.get("Age", 0)),
    "tenure_months": float(row.get("tenure_months", 0)),
    "Balance": float(row.get("Balance", 0)),
    "NumOfProducts": int(row.get("NumOfProducts", 1)),
    "HasCrCard": bool(row.get("HasCrCard", 1)),
    "IsActiveMember": bool(row.get("IsActiveMember", 0)),
    "EstimatedSalary": float(row.get("EstimatedSalary", row.get("spend_to_income", 0) * 10000)),
    
    "balance_change_pct": float(row.get("balance_change_pct", 0)),
    "complaint_count": int(row.get("complaint_count", 0)),
}

    try:
        result = churn_service.predict_churn(input_dict)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    ChurnPredictionDB.save_prediction(
        input_data=input_dict,
        churn_score=result["churn_probability"],
        will_churn=result["will_churn"],
        risk_level=result["risk_level"],
        recommendation=result["recommendation"]
    )

    snapshot_date = row.get("snapshot_date")
    return {
        **result,
        "customer_id": customer_id,
        "snapshot_date": str(snapshot_date) if snapshot_date else None,
        "data_source": "panel_latest_csv",
        "note": "Snapshot mới nhất từ bank_churn_panel_v2.csv"
    }


@app.get("/customer/{customer_id}")
async def get_customer_timeline(customer_id: str):
    """
    Trả về toàn bộ 12 tháng của 1 khách hàng kèm churn prediction cho từng tháng.

    Response:
    - customer_id
    - total_snapshots: số tháng có dữ liệu (thường = 12)
    - actual_churn: nhãn thực tế (will_churn của snapshot cuối)
    - timeline: list 12 phần tử, mỗi phần tử gồm:
        - snapshot_date
        - features: các feature của tháng đó
        - prediction: churn_probability, will_churn, risk_level từ model
    """
    if PANEL_ALL is None:
        raise HTTPException(status_code=503, detail="Panel data chưa load")

    if customer_id not in PANEL_ALL:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy CustomerId: {customer_id}")

    snapshots = PANEL_ALL[customer_id]
    timeline = []

    for row in snapshots:
        # Map từ panel columns → input_dict cho model
        input_dict = {
            "days_since_last_txn": int(row.get("days_since_last_txn", 0)),
            "days_since_last_login": int(row.get("days_since_last_login", row.get("days_since_last_txn", 0))),  # fallback
    
            "txn_count_3m": int(row.get("txn_count_3m", 0)),
            "txn_count_1m": int(row.get("txn_count_1m", 0)),
            "login_count_3m": int(row.get("login_count_3m", 0)),
            "login_count_1m": int(row.get("login_count_1m", 0)),
    
            "avg_txn_amount_3m": float(row.get("avg_txn_amount_3m", 0)),
            "std_txn_amount_3m": float(row.get("std_txn_amount_3m", 0)),
    
            "CreditScore": float(row.get("CreditScore", 0)),
            "Gender": "Male" if row.get("Gender_Male", False) else "Female",
            "Age": float(row.get("Age", 0)),
            "tenure_months": float(row.get("tenure_months", 0)),
            "Balance": float(row.get("Balance", 0)),
            "NumOfProducts": int(row.get("NumOfProducts", 1)),
            "HasCrCard": bool(row.get("HasCrCard", 1)),
            "IsActiveMember": bool(row.get("IsActiveMember", 0)),
            "EstimatedSalary": float(row.get("EstimatedSalary", row.get("spend_to_income", 0) * 10000)),
    
            "balance_change_pct": float(row.get("balance_change_pct", 0)),
            "complaint_count": int(row.get("complaint_count", 0)),
}

        try:
            pred = churn_service.predict_churn(input_dict)
        except RuntimeError as e:
            pred = {"error": str(e)}

        snap_date = row.get("snapshot_date")
        timeline.append({
            "snapshot_date": str(snap_date)[:10] if snap_date else None,
            "features": {
                "days_since_last_txn": row.get("days_since_last_txn"),
                "txn_count_3m":        row.get("txn_count_3m"),
                "txn_trend_pct":       row.get("txn_trend_pct"),
                "txn_drop_ratio":      row.get("txn_drop_ratio"),
                "login_drop_ratio":    row.get("login_drop_ratio"),
                "login_per_day_3m":    row.get("login_per_day_3m"),
                "balance_change_pct":  row.get("balance_change_pct"),
                "complaint_count":     row.get("complaint_count"),
                "tenure_months":       row.get("tenure_months"),
                "NumOfProducts":       row.get("NumOfProducts"),
                "IsActiveMember":      row.get("IsActiveMember"),
                "spend_to_income":     row.get("spend_to_income"),
                "Age":                 row.get("Age"),
                "data_set":            row.get("data_set"),
            },
            "prediction": {
                "churn_probability": pred.get("churn_probability"),
                "will_churn":        pred.get("will_churn"),
                "risk_level":        pred.get("risk_level"),
                "recommendation":    pred.get("recommendation"),
                "warning_flags":     pred.get("warning_flags", []),
            } if "error" not in pred else {"error": pred["error"]},
            "actual_will_churn": int(row.get("will_churn", -1)),
        })

    last_row = snapshots[-1]
    return {
        "customer_id":     customer_id,
        "total_snapshots": len(timeline),
        "actual_churn":    int(last_row.get("will_churn", -1)),
        "gender":          "Male" if last_row.get("Gender_Male", False) else "Female",
        "age":             float(last_row.get("Age", 0)),
        "timeline":        timeline,
    }

@app.get("/applications")
def get_history(page: int = 1, limit: int = 10):
    """Lấy lịch sử dự đoán (phân trang)."""
    data = ChurnPredictionDB.get_history(page=page, limit=limit)
    total = ChurnPredictionDB.count_total()
    return {"data": data, "page": page, "limit": limit, "total_records": total,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 0,
        "has_next": page * limit < total}


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