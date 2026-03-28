import pandas as pd
import numpy as np
import joblib
import os
from pathlib import Path


def ensure_models(model_dir: str = "models"):
    """Kiểm tra các file model cần thiết."""
    Path(model_dir).mkdir(parents=True, exist_ok=True)
    required = [
        "best_model.pkl",           # XGBoost model (export từ notebook cell 11)
        "preprocessor.pkl",         # ColumnTransformer (StandardScaler + OHE)
        "optimal_threshold.pkl"     # float threshold tối ưu (chosen_threshold)
    ]
    missing = [f for f in required if not os.path.exists(os.path.join(model_dir, f))]
    if missing:
        print(f"⚠️  Thiếu file: {missing}")
        print("   Export từ notebook: joblib.dump(bst, 'models/best_model.pkl')")
        print("                       joblib.dump(preprocessor, 'models/preprocessor.pkl')")
        print("                       joblib.dump(chosen_threshold, 'models/optimal_threshold.pkl')")
    else:
        print(f"✅ Model files OK trong '{model_dir}'")


class ChurnModelService:
    """
    Service dự đoán churn dùng XGBoost (bst từ notebook Data_churn_customer).

    Feature engineering tái tạo pipeline từ Bước 3 + 4 của notebook:
      [R] Recency   : days_since_last_login, days_since_last_txn
      [T] Trend     : txn_trend_pct, login_trend_pct
      [D] Drop      : txn_drop_ratio, login_drop_ratio
      [B] Rolling   : txn_count_3m, avg_txn_amount_3m, std_txn_amount_3m,
                      login_count_3m, login_per_day_3m
      Balance       : balance_change_pct, Balance, balance_to_salary
      Profile       : Age, tenure_months, NumOfProducts, IsActiveMember, CreditScore
      Other         : spend_to_income, complaint_count,
                      high_balance_low_txn, complaint_and_inactive
      Categorical   : Gender (→ Gender_Male sau OHE)
    """

    def __init__(self, model_dir: str = "models"):
        ensure_models(model_dir)
        self.model        = None
        self.preprocessor = None
        self.threshold    = 0.5
        self._model_type  = "xgboost"  # XGBoost native (xgb.Booster)

        try:
            self.model = joblib.load(os.path.join(model_dir, "best_model.pkl"))
            self.preprocessor = joblib.load(os.path.join(model_dir, "preprocessor.pkl"))
            t_path = os.path.join(model_dir, "optimal_threshold.pkl")
            self.threshold = float(joblib.load(t_path)) if os.path.exists(t_path) else 0.5
            print(f"✅ XGBoost loaded | threshold={self.threshold:.4f}")
        except FileNotFoundError as e:
            print(f"❌ Không tìm thấy model: {e}")

    # ──────────────────────────────────────────────────────────────────────────
    # FEATURE ENGINEERING — tái tạo Bước 3 + 4 của Data_churn_customer.ipynb
    # Input: raw fields từ PredictRequestSchema
    # Output: DataFrame với đúng feature order mà preprocessor đã fit
    # ──────────────────────────────────────────────────────────────────────────
    def _feature_engineering(self, d: dict) -> pd.DataFrame:
        """
        Tính toán đầy đủ các features giống hệt notebook:
          - Trend %: so sánh tháng M-1 với trung bình 3 tháng
          - Drop ratio: login/txn hiện tại so với avg 3 tháng
          - Rolling: login_per_day_3m = login_count_3m / 90
          - Balance ratio: log1p(Balance) / (EstimatedSalary + 1)
          - Spend to income: avg_txn_amount_3m * txn_count_3m / (EstimatedSalary/4 + 1)
          - Interaction: high_balance_low_txn, complaint_and_inactive
          - Categorical: Gender (preprocessor sẽ OHE)
        """
        df = pd.DataFrame([d])

        # ── [R] Recency (đã là raw input, giữ nguyên) ──────────────
        # days_since_last_login, days_since_last_txn → trực tiếp từ input

        # ── [T] Trend % (magnitude, âm = đang giảm) ────────────────
        avg_login_3m = float(d["login_count_3m"]) / 3.0
        avg_txn_3m   = float(d["txn_count_3m"])   / 3.0

        login_m1 = float(d["login_count_1m"])
        txn_m1   = float(d["txn_count_1m"])

        # % thay đổi: (current - baseline) / (baseline + ε)
        df["login_trend_pct"] = round(
            (login_m1 - avg_login_3m) / (avg_login_3m + 0.5), 4
        )
        df["txn_trend_pct"] = round(
            (txn_m1 - avg_txn_3m) / (avg_txn_3m + 0.5), 4
        )

        # ── [D] Drop ratio (gần 0 = tụt mạnh) ─────────────────────
        df["login_drop_ratio"] = round(
            login_m1 / (avg_login_3m + 0.5), 4
        )
        df["txn_drop_ratio"] = round(
            txn_m1 / (avg_txn_3m + 0.5), 4
        )

        # ── [B] Rolling ─────────────────────────────────────────────
        # login_per_day_3m = login_count_3m / 90 (như notebook Bước 4)
        df["login_per_day_3m"] = round(float(d["login_count_3m"]) / 90.0, 4)
        # txn_count_3m, avg_txn_amount_3m, std_txn_amount_3m → trực tiếp từ input
        # login_count_3m → trực tiếp từ input

        # ── Balance ─────────────────────────────────────────────────
        # balance_change_pct → trực tiếp từ input
        # Balance → trực tiếp từ input

        # balance_to_salary: log1p(Balance) / (EstimatedSalary + 1) như notebook
        df["balance_to_salary"] = round(
            np.log1p(float(d["Balance"])) / (float(d["EstimatedSalary"]) + 1), 4
        )

        # ── Profile ─────────────────────────────────────────────────
        # Age, tenure_months, NumOfProducts, IsActiveMember, CreditScore → từ input

        # ── Other ────────────────────────────────────────────────────
        # spend_to_income = avg_txn_amount_3m * txn_count_3m / (EstimatedSalary/4 + 1)
        df["spend_to_income"] = round(
            float(d["avg_txn_amount_3m"]) * float(d["txn_count_3m"])
            / (float(d["EstimatedSalary"]) / 4.0 + 1),
            4
        )
        df["spend_to_income"] = df["spend_to_income"].clip(0, 10)

        # complaint_count → trực tiếp từ input

        # Interaction features (notebook Bước 3)
        df["high_balance_low_txn"] = int(
            float(d["Balance"]) > 50000 and float(d["txn_count_3m"]) < 3
        )
        df["complaint_and_inactive"] = int(
            int(d["complaint_count"]) > 0 and int(d["IsActiveMember"]) == 0
        )

        # ── Categorical — notebook dùng pd.get_dummies TRƯỚC khi fit preprocessor
        # → preprocessor nhận Gender_Male (int 0/1), KHÔNG nhận chuỗi "Gender"
        df["Gender_Male"] = int(d["Gender"] == "Male")

        # ── data_set — notebook tạo cột này trước khi fit, preprocessor có thể
        # đã học cột này. Gán giá trị "PRED" (hoặc "TRAIN") để tránh missing column.
        df["data_set"] = "TRAIN"

        # ── Sắp xếp đúng thứ tự feature list từ notebook ────────────
        # Thứ tự phải khớp với X_train.columns lúc preprocessor.fit_transform()
        ALL_FEATURES = [
            # [R] Recency
            "days_since_last_login",
            "days_since_last_txn",
            # [T] Trend
            "txn_trend_pct",
            "login_trend_pct",
            # [D] Drop
            "txn_drop_ratio",
            "login_drop_ratio",
            # [B] Rolling
            "txn_count_3m",
            "avg_txn_amount_3m",
            "std_txn_amount_3m",
            "login_count_3m",
            "login_per_day_3m",
            # Balance
            "balance_change_pct",
            "Balance",
            "balance_to_salary",
            # Profile
            "Age",
            "tenure_months",
            "NumOfProducts",
            "IsActiveMember",
            "CreditScore",
            # Other
            "spend_to_income",
            "complaint_count",
            "high_balance_low_txn",
            "complaint_and_inactive",
            # Categorical (đã OHE bằng get_dummies trước fit)
            "Gender_Male",
            # Meta col notebook quên drop trước khi fit preprocessor
            "data_set",
        ]

        return df[ALL_FEATURES]

    # ──────────────────────────────────────────────────────────────────────────
    def predict_churn(self, input_data: dict) -> dict:
        if self.model is None:
            raise RuntimeError("Model chưa được load! Kiểm tra thư mục models/")

        df_feat = self._feature_engineering(input_data)

        # XGBoost native cần xgb.DMatrix
        try:
            import xgboost as xgb
            X_prep = self.preprocessor.transform(df_feat)
            dmat   = xgb.DMatrix(X_prep)
            churn_probability = float(self.model.predict(dmat)[0])
        except Exception as e:
            raise RuntimeError(f"Lỗi khi dự đoán: {e}")

        will_churn = churn_probability >= self.threshold

        # Risk level và recommendation
        if churn_probability < 0.30:
            risk_level     = "Thấp"
            recommendation = "Khách hàng trung thành. Có thể cross-sell sản phẩm mới."
        elif churn_probability < self.threshold:
            risk_level     = "Trung bình"
            recommendation = "Theo dõi thêm. Gửi ưu đãi nhỏ hoặc survey hài lòng."
        else:
            risk_level     = "Cao"
            recommendation = "Nguy cơ rời bỏ rất cao! Gọi CSKH ngay — ưu tiên giữ chân."

        # Warning flags từ behavioral signals
        flags = []
        rec_login = int(input_data.get("days_since_last_login", 0))
        rec_txn   = int(input_data.get("days_since_last_txn", 0))

        if rec_login > 30:
            flags.append(f"không đăng nhập {rec_login} ngày")
        if rec_txn > 45:
            flags.append(f"không giao dịch {rec_txn} ngày")

        drop_ratio = float(df_feat["txn_drop_ratio"].iloc[0])
        if drop_ratio < 0.4:
            flags.append("giao dịch tụt mạnh so với 3 tháng trước")

        trend_pct = float(df_feat["txn_trend_pct"].iloc[0])
        if trend_pct < -0.5:
            flags.append(f"xu hướng giao dịch giảm {abs(trend_pct)*100:.0f}%")

        if int(input_data.get("complaint_count", 0)) > 0 and int(input_data.get("IsActiveMember", 1)) == 0:
            flags.append("có khiếu nại + không phải thành viên active")

        if float(input_data.get("balance_change_pct", 0)) < -0.1:
            flags.append("số dư đang giảm mạnh")

        return {
            "churn_probability"     : round(churn_probability, 4),
            "will_churn"            : bool(will_churn),
            "risk_level"            : risk_level,
            "recommendation"        : recommendation,
            "warning_flags"         : flags,
            "input_balance"         : float(input_data.get("Balance", 0)),
            "txn_drop_ratio"        : round(drop_ratio, 4),
            "txn_trend_pct"         : round(trend_pct, 4),
            "days_since_last_login" : rec_login,
            "optimal_threshold_used": float(self.threshold)
        }


# ── Singleton ──────────────────────────────────────────────────────────────
churn_service = ChurnModelService(model_dir="models")