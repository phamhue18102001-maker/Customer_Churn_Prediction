# 🏦 Bank Customer Churn Prediction — Retail Banking

> **Dự đoán rời bỏ khách hàng trong ngân hàng bán lẻ bằng Panel Data + XGBoost**

---

## 📌 Tổng quan

Trong ngân hàng bán lẻ, **churn (rời bỏ)** là khi một khách hàng chấm dứt mối quan hệ với ngân hàng — đóng tài khoản, ngừng sử dụng sản phẩm, hoặc chuyển sang đối thủ. Chi phí để giữ một khách hàng cũ thường thấp hơn **5–7 lần** so với chi phí thu hút khách hàng mới, do đó **phát hiện sớm** ai có nguy cơ rời đi là bài toán chiến lược cốt lõi của bộ phận Retention & CRM.

Dự án này xây dựng một hệ thống dự đoán churn theo thời gian thực dựa trên **panel data** (dữ liệu dọc theo thời gian), với mục tiêu:

- Dự báo **6 tháng tới** khách hàng nào có khả năng rời bỏ
- Cung cấp **danh sách ưu tiên can thiệp** có độ chính xác cao cho đội ngũ kinh doanh
- Đảm bảo mô hình **không bị data leakage**, phản ánh đúng điều kiện triển khai thực tế

---

## 🎯 Ý nghĩa biến `will_churn` (Target Variable)

```
will_churn = 1  →  Khách hàng SẼ rời bỏ trong vòng 6 tháng tới
will_churn = 0  →  Khách hàng vẫn ở lại
```

Biến này được xác định tại **mỗi snapshot (mốc thời gian)** dựa trên:

| Điều kiện | Giá trị |
|-----------|---------|
| Khách hàng có `churn_date` và `churn_date ≤ snapshot_date + 6 tháng` | `1` |
| Không có `churn_date` hoặc `churn_date > prediction_cutoff` | `0` |

**Tại sao không dùng biến `Exited` tĩnh?** Vì `Exited` chỉ cho biết khách hàng *đã* rời, không cho biết *khi nào* họ rời. Với panel data, mỗi khách hàng có thể xuất hiện ở nhiều snapshot khác nhau — tại snapshot tháng 6 họ chưa churn, nhưng đến tháng 9 họ có thể đã churn. Biến `will_churn` nắm bắt điều này một cách chính xác theo trục thời gian.

---

## 🏗️ Kiến trúc Pipeline — Tổng quan từng bước

```
[Raw CSV] ──► [Bước 1] ──► [Bước 2] ──► [Bước 3] ──► [Bước 4]
               Tạo KH       Panel       Behavioral    Feature
               & Churn       Data        Signals       Eng.
                 ↓
[Bước 5] ──► [Bước 6] ──► [Bước 7] ──► [Bước 8] ──► [Bước 9] ──► [Bước 10]
  EDA &        Feature      Dataset      Train/Test    XGBoost +    Business
 Validate      Select       Assemble     Split         Training      Output
```

---

## 🔍 Chi tiết từng bước & Lý do thiết kế

### Bước 1 — Tạo Khách Hàng Gốc & Mô phỏng Churn Logic

**Mục đích:** Load dữ liệu gốc từ `Churn_Modelling.csv` và xây dựng **churn risk score** phản ánh đúng logic kinh doanh thực tế.

**Tại sao làm vậy?**
Thay vì gán `churn_date` ngẫu nhiên, bài toán tính điểm rủi ro từ các đặc trưng profile của KH:

| Yếu tố rủi ro | Điểm cộng | Lý do kinh doanh |
|---------------|-----------|-----------------|
| Không phải `IsActiveMember` | +3.0 | KH không hoạt động ít gắn kết nhất |
| Chỉ 1 sản phẩm | +2.0 | Ít sản phẩm = dễ rời hơn |
| `Balance = 0` | +2.0 | Không có tài sản "neo" tại ngân hàng |
| Tuổi < 35 | +1.0 | Thế hệ trẻ dễ thay đổi |
| Tenure < 2 năm | +1.5 | Chưa đủ thời gian gắn kết |
| CreditScore < 500 | +1.0 | Bất ổn tài chính |

Điểm này được biến đổi qua **logistic transform** thành xác suất churn, rồi sampling thực tế. Cách này đảm bảo các feature về sau **có thể giải thích được** tại sao KH churn — tránh tình trạng feature quan trọng nhưng không có mối liên hệ nhân quả.

---

### Bước 2 — Tạo Panel Data (Longitudinal Structure)

**Mục đích:** Chuyển dữ liệu từ dạng "một dòng per KH" sang "nhiều dòng per KH theo thời gian" — còn gọi là **panel data** hay **longitudinal data**.

**Tại sao dùng panel data thay vì cross-section?**
- **Cross-section:** 1 KH = 1 dòng → chỉ biết trạng thái hiện tại, không nắm xu hướng
- **Panel data:** 1 KH × 12 tháng = 12 dòng → model học được **xu hướng thay đổi hành vi** theo thời gian, đây là tín hiệu mạnh nhất cho churn

Mỗi dòng trong panel đại diện cho **1 snapshot** của 1 KH tại 1 thời điểm cụ thể. KH chỉ xuất hiện ở snapshot nếu:
1. Đã join đủ `OBSERVATION_WINDOW_MONTHS` (3 tháng) trước snapshot
2. Chưa churn tại thời điểm đó

```
PANEL_END: 2024-01-01
Snapshot months: 2023-02 → 2024-01 (12 tháng)
Tổng dòng ước tính: 5,000 KH × 12 tháng ≈ 60,000 dòng
```

---

### Bước 3 — Sinh Behavioral Signals

**Mục đích:** Tạo các feature đo lường **hành vi thay đổi** của KH theo thời gian — đây là trái tim của mô hình.

**Nguyên tắc thiết kế (không để leakage):**
- Tất cả feature phải **có sẵn tại thời điểm snapshot** — không dùng dữ liệu tương lai
- Feature đo **sự thay đổi**, không phải giá trị tuyệt đối

Bốn nhóm tín hiệu hành vi:

| Nhóm | Ký hiệu | Ví dụ feature | Ý nghĩa |
|------|---------|--------------|---------|
| **Recency** | [R] | `days_since_last_login` | KH đã "im lặng" bao lâu? |
| **Trend** | [T] | `txn_trend_pct` | Giao dịch đang tăng hay giảm? |
| **Drop** | [D] | `txn_drop_ratio` | Có sụt giảm đột ngột gần đây? |
| **Rolling** | [B] | `avg_txn_amount_3m` | Mức độ hoạt động trung bình 3 tháng |

**Kỹ thuật quan trọng — Decline near churn:** Với KH sắp churn (còn ≤ 60 ngày), hành vi giao dịch và login bị giảm nhân tạo 20–60%. Điều này mô phỏng đúng thực tế: KH thường **im dần** trước khi rời hẳn.

---

### Bước 4 — Feature Engineering Cuối

**Mục đích:** Tạo thêm các **ratio features** và **interaction features** có ý nghĩa kinh doanh rõ ràng.

**Triết lý:** Chỉ giữ feature nếu có thể giải thích được — loại bỏ flag 0/1 thủ công, age group/tenure group (mất thông tin), và feature phức tạp dễ overfit.

| Feature | Công thức | Ý nghĩa kinh doanh |
|---------|-----------|-------------------|
| `balance_to_salary` | `log1p(Balance) / Salary` | Mức độ "neo tài sản" tương đối |
| `spend_to_income` | `avg_txn × txn_count / (Salary/4)` | Cường độ sử dụng dịch vụ |
| `high_balance_low_txn` | Interaction | Có tiền nhưng không dùng → chuẩn bị rút |
| `complaint_and_inactive` | Interaction | Bất mãn + không active → rủi ro cao nhất |

---

### Bước 5 — EDA & Validate Signal

**Mục đích:** Kiểm tra xem feature thực sự **phân biệt được** churn vs non-churn trước khi đưa vào model.

**Tại sao bước này quan trọng?**
Nếu bỏ qua EDA, có thể đưa vào model những feature trông có vẻ hợp lý nhưng thực ra không có signal — gây nhiễu và giảm hiệu năng. Sáu biểu đồ boxplot và correlation ranking giúp xác nhận:
- `days_since_last_login` → median rõ ràng cao hơn ở nhóm churn
- `txn_drop_ratio` → nhóm churn có giá trị thấp hơn (tụt giao dịch)
- Churn rate ổn định theo tháng → không có data drift

---

### Bước 6 — Feature Selection có chủ đích

**Mục đích:** Chọn feature **chủ động** dựa trên ý nghĩa kinh doanh, không phó thác cho thuật toán tự chọn mù quáng.

**Hai bộ lọc tự động:**
1. **Signal filter:** Loại feature có `|corr với target| < 0.015` — quá yếu để có ích
2. **Redundancy filter:** Loại feature có `corr với nhau > 0.92` — giữ cái nào có signal với target cao hơn

Kết quả: ~22 features sau khi lọc, đủ phong phú nhưng không dư thừa.

---

### Bước 7 — Lắp ráp Dataset Final

**Mục đích:** Chuẩn bị dataset sạch cho training với chiến lược chia tập dữ liệu theo thời gian.

**OOT Strategy (Out-Of-Time):**
```
Tháng 1–10   → TRAIN  (học hành vi)
Tháng 11     → VAL    (tune hyperparameters)
Tháng 12     → OOT    (bài kiểm tra thực sự — không được nhìn trong quá trình huấn luyện)
```

Strategie này mô phỏng đúng cách model sẽ hoạt động trong thực tế: học từ quá khứ, dự đoán tương lai.

---

### Bước 8 — Temporal Train/Test Split

**Mục đích:** Chia tập train/test theo thời gian (không phải random).

**Tại sao KHÔNG dùng random split?**
Với panel data, random split gây ra **temporal leakage**: cùng 1 KH vừa xuất hiện ở train (tháng 6) vừa ở test (tháng 3) → model học được "identity" của KH thay vì hành vi thực sự → AUC ảo cao, nhưng triển khai thực tế thất bại.

```
80% tháng đầu → X_train, y_train
20% tháng cuối → X_test,  y_test
```

Pipeline `ColumnTransformer` đảm bảo StandardScaler được `fit` trên train và chỉ `transform` trên test — không để thông tin test "rò" vào quá trình chuẩn hóa.

---

### Bước 9 — Training XGBoost + Threshold Tuning

**Mục đích:** Train model phân loại và tìm ngưỡng quyết định tối ưu cho bài toán kinh doanh.

**Xử lý class imbalance:**
Thay vì oversample (SMOTE) làm tăng dữ liệu giả, dùng `scale_pos_weight = n_stay / n_churn × 1.2` — tham số nội tại của XGBoost cho phép model chú ý nhiều hơn đến class thiểu số (churn).

**Tại sao không dùng threshold 0.5?**
Với dữ liệu mất cân bằng (~15% churn), ngưỡng 0.5 sẽ bỏ sót phần lớn KH churn. Hai phương pháp tìm ngưỡng tối ưu:

| Phương pháp | Công thức | Ưu tiên |
|-------------|-----------|---------|
| **F2-optimal** | 5·P·R / (4P + R) | Recall > Precision (bắt nhiều churn hơn) |
| **Youden-J** | max(TPR − FPR) | Cân bằng sensitivity & specificity |

---

### Bước 10 — Business Output & Feature Importance

**Mục đích:** Chuyển kết quả model thành **hành động kinh doanh cụ thể**.

**Triết lý output:** Không hỏi "ai sẽ churn?" — mà hỏi **"top X% nào có nguy cơ cao nhất cần can thiệp ngay?"**

```
Top 10% KH theo churn_proba
→ Danh sách ưu tiên gọi điện / gửi ưu đãi
→ Đo Lift = churn_rate_trong_nhóm / churn_rate_tổng_thể
→ Lift > 3x = model có giá trị thực tiễn cao
```

Feature Importance (gain) xác nhận các tín hiệu churn chính:
- `days_since_last_login` — recency là tín hiệu số 1
- `txn_drop_ratio` — sụt giảm giao dịch đột ngột
- `txn_trend_pct` — xu hướng âm

---

## 🔗 Sơ đồ liên kết các bước

```
Bước 1 → tạo nền tảng dữ liệu có logic nhân quả
    └──► Bước 2 khai thác chiều thời gian → panel (60k dòng)
              └──► Bước 3 thêm tín hiệu hành vi động (thay đổi theo thời gian)
                       └──► Bước 4 xây thêm ratio & interaction từ hành vi đó
                                └──► Bước 5 xác nhận tín hiệu trước khi lọc
                                         └──► Bước 6 chọn feature chất lượng
                                                  └──► Bước 7 assemble & OOT split
                                                           └──► Bước 8 temporal split (chống leakage)
                                                                    └──► Bước 9 train + threshold
                                                                             └──► Bước 10 → action
```

Mỗi bước là một lớp bảo vệ chống lại một dạng sai lầm phổ biến:
- Bước 1–2: tránh target không có tính giải thích
- Bước 3–4: tránh feature tĩnh, vô hồn
- Bước 5–6: tránh noise và feature trùng lặp
- Bước 7–8: tránh temporal leakage
- Bước 9: tránh threshold ngây thơ (0.5)
- Bước 10: tránh output không có giá trị hành động

---

## ⚙️ Cấu hình chính

| Tham số | Giá trị | Ý nghĩa |
|---------|---------|---------|
| `PREDICTION_WINDOW_MONTHS` | 6 | Dự báo 6 tháng tới |
| `OBSERVATION_WINDOW_MONTHS` | 3 | Rolling feature 3 tháng gần nhất |
| `N_SNAPSHOTS` | 12 | 12 mốc thời gian (tháng) |
| `N_CUSTOMERS` | 5,000 | Số KH mô phỏng |
| `PANEL_END` | 2024-01-01 | Ngày kết thúc panel |

---

## 📦 Dependencies

```
pandas, numpy, matplotlib, seaborn
scikit-learn (Pipeline, ColumnTransformer, StandardScaler, OneHotEncoder)
xgboost
joblib
```

---

## 📁 Outputs

| File | Mô tả |
|------|-------|
| `bank_churn_panel_v2.csv` | Dataset panel đã sạch, sẵn sàng train |
| `top_churn_risk_customers.csv` | Danh sách KH rủi ro cao nhất để can thiệp |
| `churn_model.pkl` | Mô hình XGBoost đã train (nếu lưu) |