import pandas as pd
import numpy as np
import joblib
import os

class ChurnModelService:
    def __init__(self, model_dir="models"):
        """
        Khởi tạo service, load các file .pkl đã lưu từ quá trình train.
        """
        try:
            # Đường dẫn tới các file model
            model_path = os.path.join(model_dir, "best_model.onnx")
            preprocessor_path = os.path.join(model_dir, "preprocessor.pkl")
            threshold_path = os.path.join(model_dir, "optimal_threshold.pkl")

            # Load model và các tham số
            self.model = joblib.load(model_path)
            self.preprocessor = joblib.load(preprocessor_path)
            
            # Nếu không tìm thấy file threshold, dùng mặc định 0.5
            if os.path.exists(threshold_path):
                self.threshold = joblib.load(threshold_path)
            else:
                self.threshold = 0.5
                
            print(f"✅ Đã load thành công model! Ngưỡng dự đoán: {self.threshold:.3f}")
        except FileNotFoundError as e:
            print(f"❌ LỖI: Không tìm thấy file model. Vui lòng kiểm tra lại thư mục '{model_dir}'. Chi tiết: {e}")
            self.model = None

    def _feature_engineering(self, input_dict: dict) -> pd.DataFrame:
        """
        Tạo các biến phái sinh y hệt như lúc train model.
        Thay vì dùng random noise, ta dùng giá trị trung bình để kết quả ổn định.
        """
        df = pd.DataFrame([input_dict])

        # Trích xuất các biến cần thiết
        balance = df['Balance'].iloc[0]
        is_active = df['IsActiveMember'].iloc[0]
        est_salary = df['EstimatedSalary'].iloc[0]
        num_products = df['NumOfProducts'].iloc[0]
        age = df['Age'].iloc[0]

        # 1. AVG_BALANCE_3M: Dùng trung bình của uniform(-0.02, 0.03) là 0.005
        df['AVG_BALANCE_3M'] = balance * (1 + is_active * 0.005)

        # 2. MAX_TRANSACTION_6M: Dùng trung bình của uniform(0.01, 0.1) là 0.055
        df['MAX_TRANSACTION_6M'] = (est_salary * 0.055) * (1 + num_products * 0.1)

        # 3. STDDEV_TRANSACTION_12M: Dùng trung bình của uniform(0.1, 0.3) là 0.2
        # Giả sử max_age trong tập train là khoảng 92
        df['STDDEV_TRANSACTION_12M'] = df['MAX_TRANSACTION_6M'] * (0.2 + (1 - age/92.0) * 0.2)

        return df

    def predict_churn(self, input_data: dict) -> dict:
        """
        Nhận data từ API, dự đoán và trả về kết quả đã format.
        """
        if self.model is None:
            raise RuntimeError("Model chưa được load. Không thể dự đoán.")

        # 1. Biến đổi dữ liệu
        df_features = self._feature_engineering(input_data)

        # Vì trong code train của bạn, best_pipe đã bao gồm ('preprocessor', 'feature_selection', 'classifier')
        # Nên ta chỉ cần truyền thẳng DataFrame vào best_pipe.predict_proba
        
        # 2. Dự đoán xác suất
        churn_score = float(self.model.predict_proba(df_features)[:, 1][0])
        
        # 3. Đánh giá dựa trên optimal_threshold
        will_churn = bool(churn_score >= self.threshold)

        # 4. Phân loại rủi ro và đưa ra hành động (Recommendation)
        if churn_score < 0.3:
            risk_level = "Thấp"
            recommendation = "Khách hàng trung thành. Có thể cross-sell thêm thẻ tín dụng."
        elif churn_score < self.threshold:
            risk_level = "Trung bình"
            recommendation = "Theo dõi thêm. Cân nhắc gửi email nhắc nhở sử dụng app."
        else:
            risk_level = "Cao"
            recommendation = "Nguy cơ rời bỏ rất cao! Gửi SMS tặng voucher giảm phí giao dịch hoặc gọi điện CSKH ngay."

        # Trả về dictionary (sẽ được FastAPI convert thành JSON)
        return {
            "churn_score": round(churn_score, 4),
            "will_churn": will_churn,
            "risk_level": risk_level,
            "recommendation": recommendation,
            "optimal_threshold_used": float(self.threshold)
        }

# Khởi tạo một instance duy nhất để import vào main.py (Singleton pattern)
# Tạo sẵn thư mục 'models' và bỏ 3 file .pkl của bạn vào đó nhé.
churn_service = ChurnModelService(model_dir="models")