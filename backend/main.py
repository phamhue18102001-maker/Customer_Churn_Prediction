from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import joblib

import os

load_dotenv()

# Import đúng theo cấu trúc hiện tại
from backend.schemas import PredictRequestSchema          # ← schema 75+ features
from backend.model_service import churn_service
from utils.database import ChurnPredictionDB, supabase

app = FastAPI(
    title="Customer Churn Predictor",
    version="1.0",
    description="API dự đoán churn với 75+ engineered features"
)

# B8 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # ← thay domain thật khi deploy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "app": "Churn Prediction API",
        "version": "1.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "history": "/applications",
            "model_info": "/model-info"
        }
    }

# B2 Health check (đã tối ưu)
@app.get("/health")
def health():
    try:
        supabase.table("applications").select("id").limit(1).execute()
        db_status = "Connected"
    except Exception as e:
        print(f"Healthcheck DB Error: {e}")
        db_status = f"Disconnected: {str(e)[:80]}"
        
    return {
        "status": "healthy",
        "model": "loaded",
        "database": db_status,
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# B3 + B4 + B5 Predict (ĐÃ SỬA)
@app.post("/predict")
async def predict(application: PredictRequestSchema):
    input_dict = application.model_dump()           # ← SỬA: .dict() → .model_dump() (Pydantic v2)

    result = churn_service.predict_churn(input_dict)
    
    # Lưu vào DB (đồng bộ key theo model_service hiện tại)
    ChurnPredictionDB.save_prediction(
        input_data=input_dict,
        churn_score=result.get("churn_probability", result.get("churn_score", 0.0)),  # ← an toàn cả 2 key
        will_churn=result["will_churn"],
        risk_level=result["risk_level"],
        recommendation=result["recommendation"]
    )

    return result

# B7 History
@app.get("/applications")
def get_history(page: int = 1, limit: int = 10):
    data = ChurnPredictionDB.get_history(page=page, limit=limit)
    return {"data": data, "page": page, "limit": limit, "total_records": len(data)}

# B10 Detail
@app.get("/applications/{id}")
def get_detail(id: str):
    data = ChurnPredictionDB.get_detail(id)
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    return data

# B11 Model info (ĐÃ CẬP NHẬT)
@app.get("/model-info")
def model_info():
    try:
        threshold = joblib.load("models/optimal_threshold.pkl")
    except:
        threshold = 0.5
    return {
        "model": "RandomForest + Full Feature Engineering (75 features)",
        "features": 75,                                   # ← cập nhật đúng
        "description": "Bao gồm RFM, growth, interaction, velocity, L1M-L12M, etc.",
        "threshold": float(threshold)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
