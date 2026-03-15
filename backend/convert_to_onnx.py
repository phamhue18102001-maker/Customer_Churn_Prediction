import joblib
import os
import numpy as np
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType, StringTensorType
import onnx

# --- PHẦN 1: CẤU HÌNH ĐƯỜNG DẪN ---
# Lấy đường dẫn của chính thư mục 'backend'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Đi ngược ra ngoài 1 cấp (..) rồi vào 'models'
MODEL_IN_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "models", "best_model.pkl"))
MODEL_OUT_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "models", "best_models.onnx"))


def main():
    if not os.path.exists(MODEL_IN_PATH):
        print(f"❌ Không tìm thấy file: {MODEL_IN_PATH}")
        return

    model = joblib.load(MODEL_IN_PATH)
    
    # --- BƯỚC ĐỘT PHÁ: Bắt model tự khai báo những cột nó cần ---
    if hasattr(model, 'feature_names_in_'):
        expected_cols = model.feature_names_in_.tolist()
        print(f"📊 Phát hiện model cần chính xác {len(expected_cols)} cột:")
        print(expected_cols)
    else:
        print("❌ Model của ông không lưu tên cột. Bó tay!")
        return

    # --- TỰ ĐỘNG PHÂN LOẠI CHỮ VÀ SỐ ---
    initial_types = []
    for col in expected_cols:
        # Nếu là cột chữ (ông có thể thêm vào list này nếu có cột chữ khác)
        if col in ['Geography', 'Gender']:
            initial_types.append((col, StringTensorType([None, 1])))
        else:
            # Mặc định các cột còn lại (kể cả cái AVG_BALANCE_3M mới lòi ra) là Số
            initial_types.append((col, FloatTensorType([None, 1])))

    # --- CHUYỂN ĐỔI ---
    try:
        print("\n⚙️ Đang nén mô hình...")
        onnx_model = convert_sklearn(model, initial_types=initial_types, target_opset=12)

        with open(MODEL_OUT_PATH, "wb") as f:
            f.write(onnx_model.SerializeToString())
            
        print(f"🚀 THÀNH CÔNG RỰC RỠ! Đã tạo file: {MODEL_OUT_PATH}")
        print(f"💡 Nhớ update lại API của ông để truyền thêm cái cột bị thiếu nhé!")

    except Exception as e:
        print(f"❌ Lỗi chuyển đổi: {e}")

if __name__ == "__main__":
    main()