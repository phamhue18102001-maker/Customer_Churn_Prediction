import os
from supabase import create_client, Client
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv   # thêm dòng này

load_dotenv()
import uuid

# Load biến môi trường (Nên dùng python-dotenv trong thực tế)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Khởi tạo client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class ChurnPredictionDB:
    @staticmethod
    def save_prediction(input_data: Dict[str, Any], churn_score: float, will_churn: bool, risk_level: str, recommendation: str):
        try:
            record = {
                "id": str(uuid.uuid4()),
                "input_data": input_data,
                "churn_score": round(churn_score, 4),
                "will_churn": will_churn,
                "risk_level": risk_level,
                "recommendation": recommendation,
                "created_at": datetime.now().isoformat()
            }            
            # Ghi vào Supabase
            response = supabase.table("applications").insert(record).execute()
            return response.data
        except Exception as e:
            print(f"Database Error: {e}")
            # Graceful degradation (Yêu cầu B9): Lỗi DB không làm sập API
            return None
        
    @staticmethod
    def get_detail(id: str):
        """Lấy chi tiết một bản ghi theo id"""
        try:
            response = supabase.table("applications").select("*").eq("id", id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Database Error: {e}")
            return None


    @staticmethod
    def get_history(limit: int = 10, offset: int = 0):
        """
        Lấy lịch sử dự đoán có phân trang (Yêu cầu B7)
        """
        try:
            response = supabase.table("applications")\
                .select("*")\
                .order("created_at", desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Database Error: {e}")
            return []