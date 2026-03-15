from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import joblib
import joblib
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from backend.schemas import PredictRequestSchema
from backend.model_service import churn_service
from utils.database import ChurnPredictionDB, supabase

load_dotenv()
app = FastAPI(title="Customer Churn Predictor", version="1.0")

# B8 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # thay sau khi deploy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# B2 Health
@app.get("/health")
def health():
    try:
        supabase.table("applications").select("id").limit(1).execute()
        db_status = "Connected"
    except:
        db_status = "Disconnected (graceful mode)"
    return {"status": "healthy", "model": "loaded", "database": db_status}

# B3 + B4 + B5 Predict
@app.post("/predict")
async def predict(application: PredictRequestSchema):

    input_dict = application.dict()

    result = churn_service.predict_churn(input_dict)

    # lưu vào database
    ChurnPredictionDB.save_prediction(
        input_data=input_dict,
        churn_score=result["churn_score"],
        will_churn=result["will_churn"],
        risk_level=result["risk_level"],
        recommendation=result["recommendation"]
    )

    return result

# B7 History + pagination
@app.get("/applications")
def get_history(page: int = 1, limit: int = 10):
    start = (page - 1) * limit
    data = supabase.table("applications").select("*").order("created_at", desc=True).range(start, start+limit).execute()
    return {"data": data.data, "page": page, "limit": limit}

# B10 Detail
@app.get("/applications/{id}")
def get_detail(id: str):
    data = supabase.table("applications").select("*").eq("id", id).execute()
    if not data.data:
        raise HTTPException(404, "Not found")
    return data.data[0]

# B11 Model info
@app.get("/model-info")
def model_info():
    try:
        threshold = joblib.load("models/optimal_threshold.pkl")
    except:
        threshold = 0.5
    return {
        "model": "RandomForest + Preprocessor",
        "features": 15,
        "threshold": float(threshold)
    }
