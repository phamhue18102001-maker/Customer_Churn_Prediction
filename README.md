# Dự Án: Dự Đoán Khách Hàng Rời Bỏ (Customer Churn Prediction)
## Lĩnh vực: Ngân hàng bán lẻ (Retail Banking)

## 1. Tổng quan bài toán (Executive Summary)
Trong bối cảnh ngân hàng số tại phát triển mạnh mẽ, việc giữ chân khách hàng (Customer Retention) trở thành yếu tố sống còn. Dự án này tập trung vào việc xây dựng mô hình học máy để dự báo khả năng một khách hàng sẽ ngừng sử dụng dịch vụ dựa trên các dữ liệu về hành vi, giao dịch và nhân khẩu học.

Customer Churn Prediction là bài toán dự đoán khả năng khách hàng sẽ rời bỏ ngân hàng trong một khoảng thời gian nhất định (ví dụ: 30–90 ngày tới).

Thay vì đợi khách hàng đóng tài khoản hoặc ngừng giao dịch, hệ thống sử dụng dữ liệu lịch sử để phát hiện sớm các dấu hiệu rời bỏ và giúp ngân hàng chủ động giữ chân khách hàng.

Ngân hàng phải đối mặt với một thực tế:

Chi phí thu hút khách hàng mới (Customer Acquisition Cost - CAC) thường cao gấp **5–7 lần** so với chi phí giữ chân khách hàng hiện tại.

Nếu không phát hiện sớm dấu hiệu rời bỏ, ngân hàng có thể:

- Mất nguồn vốn huy động
- Mất doanh thu từ phí giao dịch
- Mất khách hàng vào tay đối thủ cạnh tranh

Do đó cần một hệ thống dự đoán khách hàng có nguy cơ rời bỏ.
* Xác định các đặc điểm chính dẫn đến việc khách hàng rời bỏ.
* Xây dựng mô hình phân loại với độ phủ cao để không bỏ sót khách hàng nguy cơ.
* Đề xuất các chiến dịch chăm sóc khách hàng cá nhân hóa.

## 2. Mô tả dữ liệu (Data Dictionary)
Dữ liệu dự kiến bao gồm các nhóm biến chính sau: (dựa vào )

| Tên biến | Mô tả | Loại dữ liệu |
| :--- | :--- | :--- |
| `CustomerId` | Mã định danh duy nhất của khách hàng | Categorical |
| `CreditScore` | Điểm tín dụng nội bộ | Numerical |
| `Age` | Độ tuổi khách hàng | Numerical |
| `Tenure` | Số năm gắn bó với ngân hàng | Numerical |
| `Balance` | Số dư tài khoản hiện tại | Numerical |
| `NumOfProducts` | Số lượng sản phẩm đang sử dụng (Thẻ, Vay, ...) | Numerical |
| `IsActiveMember` | Trạng thái hoạt động (1: Có, 0: Không) | Binary |
| `EstimatedSalary` | Ước tính thu nhập hàng năm | Numerical |
| **`Exited`** | **Biến mục tiêu (1: Churn, 0: Stay)** | **Target** |

## 3. Quy trình thực hiện (Pipeline)

### Bước 1: Tiền xử lý dữ liệu (Data Preprocessing)
* Làm sạch dữ liệu: Xử lý giá trị trống (NULL) và các giá trị ngoại lai (Outliers).
* Mã hóa (Encoding): Chuyển đổi các biến định danh (Gender, Geography) sang dạng số bằng One-Hot Encoding.
* Chuẩn hóa (Scaling): Sử dụng `StandardScaler` để đưa các biến như `Balance`, `Salary` về cùng một thang đo.

### Bước 2: Phân tích khám phá (EDA)
* Trực quan hóa mối quan hệ giữa độ tuổi và tỷ lệ rời bỏ.
* Phân tích sự sụt giảm số dư tài khoản ảnh hưởng thế nào đến quyết định rời đi.
* Kiểm tra sự mất cân bằng dữ liệu (Class Imbalance).

### Bước 3: Huấn luyện mô hình (Modeling) và Đánh giá & Tối ưu
Thử nghiệm các thuật toán phổ biến:
* **Logistic Regression** (Mô hình cơ sở).
* **Random Forest Classifier** (Xử lý tốt các quan hệ phi tuyến).
* **XGBoost / LightGBM** (Tối ưu hiệu năng và độ chính xác).
* Sử dụng **Confusion Matrix**, **F1-Score** và **AUC-ROC** để đánh giá.
* Tối ưu hóa bộ tham số (Hyperparameter Tuning) bằng `GridSearchCV`.
### Bước 4: Triển khai veg ứng dụng web
## 5. Kết luận & Ứng dụng
Mô hình giúp ngân hàng chủ động phân loại khách hàng vào các nhóm rủi ro:
* **Nhóm rủi ro cao:** Gửi ưu đãi phí thường niên hoặc tặng voucher dịch vụ.
* **Nhóm rủi ro thấp:** Đề xuất các sản phẩm tài chính dài hạn (Tiết kiệm, Bảo hiểm).
