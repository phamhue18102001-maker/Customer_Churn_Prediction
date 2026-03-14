from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import joblib
import joblib
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from backend.schemas import LoanApplication
from ..utils.model import predict_churn
from ..utils.database import save_prediction, supabase

load_dotenv()
app = FastAPI(title="Bank Churn Predictor", version="1.0")

# B8 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-frontend.vercel.app"],  # thay sau khi deploy
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
async def predict(application: LoanApplication):
    input_dict = application.dict()
    result = predict_churn(input_dict)
    save_prediction(input_dict, result)  # B6 graceful
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)