#  Customer Churn Prediction - Retail Banking

##  1. Overview
Trong lĩnh vực ngân hàng bán lẻ, việc giữ chân khách hàng (Customer Retention) là yếu tố quan trọng giúp ngân hàng duy trì doanh thu và lợi thế cạnh tranh.

Tuy nhiên, khách hàng không nhất thiết phải đóng tài khoản mới được xem là rời bỏ. Trên thực tế, họ thường:
- Ngừng giao dịch
- Giảm số dư tài khoản
- Không còn sử dụng dịch vụ

 Dự án này xây dựng mô hình Machine Learning để dự đoán khả năng khách hàng rời bỏ (churn) trong 30–90 ngày tới.

---

##  2. Business Objective
- Phát hiện sớm khách hàng có nguy cơ rời bỏ  
- Giảm chi phí thu hút khách hàng mới (CAC)  
- Tăng tỷ lệ giữ chân khách hàng  
- Hỗ trợ chiến lược chăm sóc khách hàng cá nhân hóa  

---

##  3. Problem Definition
Đây là bài toán phân loại nhị phân (Binary Classification):

- `1` → Khách hàng rời bỏ (Churn)  
- `0` → Khách hàng vẫn hoạt động (Stay)  

---

##  4. Target Variable (Exited)

Biến `Exited` là biến quan trọng nhất trong mô hình.

Khách hàng được coi là **churn (Exited = 1)** nếu:
- Không đăng nhập trong 30–90 ngày  
- Số giao dịch giảm mạnh  
- Số dư tài khoản gần về 0  
- Không sử dụng sản phẩm/dịch vụ  
- Có nhiều khiếu nại  

Ngược lại:
- `Exited = 0` → Khách hàng vẫn hoạt động bình thường  

 Đây là biến được xây dựng dựa trên hành vi thực tế của khách hàng.

---

##  5. Dataset Description

### Nhóm nhân khẩu học & tài chính

- CreditScore: Điểm tín dụng

- Age: Tuổi

- EstimatedSalary: Thu nhập

- Balance: Số dư

### Nhóm quan hệ với ngân hàng

- Tenure: Số năm gắn bó

- NumOfProducts: Số sản phẩm sử dụng

- HasCrCard: Có thẻ tín dụng

- IsActiveMember: Có hoạt động hay không

### Nhóm hành vi (RẤT QUAN TRỌNG để dự đoán churn)

- login_count_last_30d: Số lần đăng nhập gần đây

- num_transactions_last_90d: Số giao dịch

- avg_transaction_amount: Giá trị giao dịch trung bình

- complaint_count_last_12m: Số lần khiếu nại

### Đây là nhóm biến quyết định chính đến churn 

### Engineered Features (Behavioral Insights)

Các biến dưới đây được tạo thêm để phản ánh hành vi khách hàng theo thời gian:

- **AVG_BALANCE_3M**: Số dư trung bình trong 3 tháng gần nhất  
  → Giúp phát hiện xu hướng rút tiền (dấu hiệu churn sớm)

- **MAX_TRANSACTION_6M**: Giá trị giao dịch lớn nhất trong 6 tháng  
  → Phản ánh mức độ sử dụng và niềm tin của khách hàng

- **STDDEV_TRANSACTION_12M**: Độ biến động giao dịch trong 12 tháng  
  → Đo lường sự thay đổi hành vi (behavior shift)

Các biến này giúp mô hình hiểu được không chỉ trạng thái hiện tại mà còn xu hướng thay đổi của khách hàng theo thời gian.

### Target
- Exited: 1 = Churn, 0 = Stay  

---

## 6. Project Pipeline

### 1. Data Preprocessing
- Xử lý missing values  
- Encoding (One-Hot Encoding)  
- Scaling (StandardScaler)  

### 2. Exploratory Data Analysis (EDA)
- Phân tích Age vs Churn  
- Phân tích Balance vs Churn  
- Kiểm tra mất cân bằng dữ liệu  

### 3. Modeling
Sử dụng các mô hình:
- Logistic Regression  
- Random Forest  
- XGBoost / LightGBM  

### 4. Evaluation
Các chỉ số đánh giá:
- Confusion Matrix  
- Precision / Recall  
- F1-Score  
- ROC-AUC  

### 5. Hyperparameter Tuning
- GridSearchCV  
- Cross-validation  

### 6. Deployment
- Xây dựng API (Flask / FastAPI)  
- Kết nối frontend  
- Triển khai web app  

---

## 7. Business Impact

### 🔴 High Risk (Nguy cơ cao)
- Có khả năng rời bỏ cao  
➡️ Gửi ưu đãi, chăm sóc trực tiếp  

### 🟡 Medium Risk
- Có dấu hiệu giảm tương tác  
➡️ Gợi ý sản phẩm phù hợp  

### 🟢 Low Risk
- Khách hàng ổn định  
➡️ Upsell dịch vụ  

---

## 8. Key Takeaways
- Churn không chỉ là đóng tài khoản mà là giảm tương tác  
- Dữ liệu hành vi quan trọng nhất trong dự đoán  
- Mô hình giúp ra quyết định kinh doanh, không chỉ dự đoán  

---

## 9. Tech Stack
- Python (Pandas, NumPy, Scikit-learn)  
- XGBoost / LightGBM  
- Matplotlib / Seaborn  
- Flask / FastAPI  
- Git & GitHub  

---

## 10. Future Improvements
- Tích hợp dữ liệu real-time  
- Kết nối hệ thống CRM  
- A/B Testing chiến dịch giữ chân  
