import pandas as pd
import numpy as np
import joblib
import os
from pathlib import Path

def ensure_models(model_dir: str = "models"):
    """Tạo thư mục models và kiểm tra các file cần thiết."""
    Path(model_dir).mkdir(parents=True, exist_ok=True)
    
    required_files = [
        "randomforest_best_model.pkl",
        "preprocessor.pkl",
        "optimal_threshold.pkl"
    ]
    
    missing = [f for f in required_files if not os.path.exists(os.path.join(model_dir, f))]
    
    if missing:
        print(f"⚠️  Thiếu file: {missing}")
        print("   Vui lòng copy 3 file .pkl từ thư mục train vào thư mục 'models/'")
    else:
        print(f"✅ Tất cả model files đã có trong '{model_dir}'")


class ChurnModelService:
    def __init__(self, model_dir: str = "models"):
        ensure_models(model_dir)
        self.model_dir = model_dir
        
        try:
            model_path = os.path.join(model_dir, "randomforest_best_model.pkl")
            preprocessor_path = os.path.join(model_dir, "preprocessor.pkl")
            threshold_path = os.path.join(model_dir, "optimal_threshold.pkl")

            self.model = joblib.load(model_path)
            self.preprocessor = joblib.load(preprocessor_path)

            self.threshold = joblib.load(threshold_path) if os.path.exists(threshold_path) else 0.5
            
            print(f"✅ Model loaded successfully!")
            print(f"   Threshold: {self.threshold:.4f}")
            print(f"   Pipeline type: {type(self.model)}")
            
        except FileNotFoundError as e:
            print(f"❌ LỖI: Không tìm thấy model. {e}")
            self.model = None
            self.threshold = 0.5

    def _feature_engineering(self, input_dict: dict) -> pd.DataFrame:
        
        df = pd.DataFrame([input_dict])

        # ====================== 1. CÁC BIẾN CƠ BẢN ======================
        df['tenure_group'] = pd.cut(df['Tenure'], 
                                    bins=[0, 3, 6, 12, 24, 60, np.inf],
                                    labels=['New', 'Early', 'Growth', 'Mature', 'Loyal', 'Veteran'])
        df['age_group'] = pd.cut(df['Age'], 
                                 bins=[0, 30, 40, 50, 60, 100],
                                 labels=['Young', 'Adult', 'Mid', 'Senior', 'Elder'])

        # ====================== 2. BALANCE & RATIO ======================
        df['balance_salary_ratio'] = df['Balance'] / (df['EstimatedSalary'] + 1)
        df['credit_utilization'] = df['Balance'] / (df['CreditScore'] * 10 + 1)
        df['avg_balance_per_product'] = df['Balance'] / (df['NumOfProducts'] + 1)

        # ====================== 3. TRANSACTION & VELOCITY ======================
        df['total_txn_amount_L3M'] = df['num_transactions_last_90d'] * df['avg_transaction_amount']
        df['transaction_per_login'] = df['num_transactions_last_90d'] / (df['login_count_last_30d'] + 1)
        df['complaint_rate'] = df['complaint_count_last_12m'] / (df['num_transactions_last_90d'] + 1)

        # ====================== 4. RFM & SCORES ======================
        df['freq_score'] = pd.qcut(df['num_transactions_last_90d'], q=5, labels=[1,2,3,4,5], duplicates='drop')
        df['mon_score']  = pd.qcut(df['avg_transaction_amount'], q=5, labels=[1,2,3,4,5], duplicates='drop')
        recency_proxy = 30 - df['login_count_last_30d'].clip(upper=30)
        df['rec_score'] = pd.qcut(recency_proxy, q=5, labels=[5,4,3,2,1], duplicates='drop')
        df['rfm_score'] = (df['rec_score'].astype(int)*100 + 
                           df['freq_score'].astype(int)*10 + 
                           df['mon_score'].astype(int))

        # ====================== 5. TREND & VOLATILITY (dùng trực tiếp 3 cột đã có) ======================
        df['balance_trend_L3M'] = (df['Balance'] - df['AVG_BALANCE_3M']) / (df['AVG_BALANCE_3M'] + 1)
        df['value_volatility'] = df['STDDEV_TRANSACTION_12M']
        df['cv_transaction'] = df['value_volatility'] / (df['avg_transaction_amount'] + 1)

        # ====================== 6. INTERACTION FEATURES ======================
        df['age_balance_interact'] = df['Age'] * df['Balance']
        df['product_tenure_interact'] = df['NumOfProducts'] * df['Tenure']
        df['product_active_interact'] = df['NumOfProducts'] * df['IsActiveMember']
        df['complaint_active_interact'] = df['complaint_count_last_12m'] * (1 - df['IsActiveMember'])
        df['login_balance_interact'] = df['login_count_last_30d'] * df['Balance']

        return df

    def predict_churn(self, input_data: dict) -> dict:
        if self.model is None:
            raise RuntimeError("Model chưa được load!")

        df_input = self._feature_engineering(input_data)

        churn_probability = float(self.model.predict_proba(df_input)[:, 1][0])

        will_churn = bool(churn_probability >= self.threshold)

        if churn_probability < 0.3:
            risk_level = "Thấp"
            recommendation = "Khách hàng trung thành. Có thể cross-sell thêm sản phẩm."
        elif churn_probability < self.threshold:
            risk_level = "Trung bình"
            recommendation = "Theo dõi thêm. Gửi email nhắc nhở hoặc ưu đãi nhỏ."
        else:
            risk_level = "Cao"
            recommendation = "Nguy cơ rời bỏ rất cao! Gọi CSKH ngay hoặc tặng voucher miễn phí giao dịch."

        return {
            "churn_probability": round(churn_probability, 4),
            "will_churn": will_churn,
            "risk_level": risk_level,
            "recommendation": recommendation,
            "inputBalance": float(input_data.get("Balance", 0)),
            "optimal_threshold_used": float(self.threshold)
        }


# ==================== SINGLETON ====================
churn_service = ChurnModelService(model_dir="models")