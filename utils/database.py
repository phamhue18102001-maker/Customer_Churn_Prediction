import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client


load_dotenv()


# ====================== CONFIG ======================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class ChurnPredictionDB:
    """
    Class xử lý toàn bộ tương tác với Supabase (D1-D6)
    - Graceful degradation (B9)
    - Tương thích 100% với schema.sql + SQLAlchemy model
    """

    @staticmethod
    def save_prediction(
        input_data: Dict[str, Any],
        churn_score: float,
        will_churn: bool,
        risk_level: str,
        recommendation: str,
    ) -> Optional[Dict]:
        """
        Lưu kết quả dự đoán (B3 + B5)
        - Để DB tự generate id + created_at + updated_at (trigger)
        - Không cần import uuid, không set timestamp thủ công
        """
        try:
            record = {

                "input_data": input_data,
                "churn_score": round(churn_score, 4),
                "will_churn": will_churn,
                "risk_level": risk_level,
                "recommendation": recommendation,
                # Không truyền id, created_at, updated_at → để server default + trigger xử lý
            }

            response = supabase.table("applications").insert(record).execute()
            return response.data[0] if response.data else None

        except Exception as e:
            print(f"❌ Database Error (save_prediction): {e}")
            return None  # Graceful mode – API vẫn trả về kết quả dự đoán

    @staticmethod
    def get_detail(id: str) -> Optional[Dict]:
        """Lấy chi tiết một bản ghi (B10)"""
        try:
            response = supabase.table("applications").select("*").eq("id", id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"❌ Database Error (get_detail): {e}")
            return None

    @staticmethod
    def count_total() -> int:
        """Đếm tổng số bản ghi trong bảng applications"""
        try:
        # Supabase hỗ trợ count=exact rất nhanh
           result = supabase.table("applications") \
            .select("id", count="exact") \
            .limit(1) \
            .execute()
        
           return result.count if hasattr(result, 'count') and result.count is not None else 0
        except Exception as e:
           print(f"⚠️ Không đếm được total_records: {e}")
           return 0

    @staticmethod
    def get_history(page: int = 1, limit: int = 10) -> List[Dict]:
        """
        Lấy lịch sử có phân trang (B7)
        - page bắt đầu từ 1 (giống API /applications)
        - Sử dụng .range() đúng chuẩn Supabase
        """
        try:
            offset = (page - 1) * limit
            response = (
                supabase.table("applications")
                .select("*")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            return response.data or []
        except Exception as e:
            print(f"❌ Database Error (get_history): {e}")
            return []


