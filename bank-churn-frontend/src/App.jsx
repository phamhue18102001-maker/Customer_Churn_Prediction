import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
// --- COMPONENT BIỂU ĐỒ (Tách riêng cho gọn) ---
const ChurnPredictionChart = ({ currentBalance, baseChurnProb }) => {
  const generateProjectionData = () => {
    let data = [];
    let tempBalance = Number(currentBalance) || 0;
    let tempChurn = Number(baseChurnProb) * 100 || 0;
    for (let i = 1; i <= 6; i++) {
      data.push({
        month: `Tháng ${i}`,
        balance: Math.round(tempBalance),
        churnRisk: Math.min(Math.round(tempChurn), 100)
      });
      // Giả lập: Rút 15% số dư/tháng, nguy cơ rời bỏ tăng 8%
      tempBalance = tempBalance * 0.85;
      tempChurn = tempChurn + 8.5;
    }
    return data;
  };
  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-6">
      <h3 className="text-md font-bold text-gray-700 mb-4 text-center">Dự báo xu hướng 6 tháng tới</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={generateProjectionData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis yAxisId="left" fontSize={12} tickFormatter={(value) => `$${value}`} />
          <YAxis yAxisId="right" orientation="right" fontSize={12} tickFormatter={(value) => `${value}%`} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '12px' }}/>
          <Line yAxisId="left" type="monotone" dataKey="balance" stroke="#3b82f6" name="Số dư (USD)" strokeWidth={3} />
          <Line yAxisId="right" type="monotone" dataKey="churnRisk" stroke="#ef4444" name="Nguy cơ rời bỏ (%)" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
// --- COMPONENT CHÍNH ---
export default function App() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  // Hàm điền nhanh dữ liệu (Yêu cầu F11)
  const fillDemoData = () => {
    const demoData = {
      CreditScore: 650, Geography: "France", Gender: "Female", Age: 42,
      Tenure: 5, Balance: 105000, NumOfProducts: 1, HasCrCard: 1,
      IsActiveMember: 0, EstimatedSalary: 85000, login_count_last_30d: 4,
      num_transactions_last_90d: 12, avg_transaction_amount: 500, complaint_count_last_12m: 1
    };
    Object.keys(demoData).forEach(key => setValue(key, demoData[key]));
  };
  // Xử lý gửi API
  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    try {
      // Đổi URL này thành URL Render của bạn sau khi deploy Backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${API_URL}/predict`, data);
      setResult({
        ...response.data,
        inputBalance: data.Balance // Lưu lại số dư để vẽ chart
      });
    } catch (error) {
      setErrorMsg('Lỗi kết nối đến Server. Vui lòng kiểm tra lại Backend.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen p-6 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-900">Hệ thống Dự báo Churn Ngân hàng</h1>
          <p className="text-gray-500 mt-2">Đánh giá rủi ro rời bỏ của khách hàng bằng AI</p>
        </header>
        <div className="grid md:grid-cols-2 gap-8">
          {/* CỘT TRÁI: FORM NHẬP LIỆU */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Thông tin khách hàng</h2>
              <button
                type="button"
                onClick={fillDemoData}
                className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition"
              >
                ⚡ Điền data Demo
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tuổi</label>
                  <input type="number" {...register("Age", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Điểm tín dụng</label>
                  <input type="number" {...register("CreditScore", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số dư (Balance)</label>
                  <input type="number" step="any" {...register("Balance", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lương ước tính</label>
                  <input type="number" step="any" {...register("EstimatedSalary", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số lượng sản phẩm</label>
                  <input type="number" {...register("NumOfProducts", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số lần Login (30 ngày)</label>
                  <input type="number" {...register("login_count_last_30d", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quốc gia</label>
                  <select {...register("Geography")} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="Spain">Spain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giới tính</label>
                  <select {...register("Gender")} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Female">Nữ</option>
                    <option value="Male">Nam</option>
                  </select>
                </div>
              </div>
              {/* Thêm các trường ẩn hoặc mặc định để đủ model (Rút gọn hiển thị) */}
              <input type="hidden" {...register("Tenure")} defaultValue={5} />
              <input type="hidden" {...register("HasCrCard")} defaultValue={1} />
              <input type="hidden" {...register("IsActiveMember")} defaultValue={1} />
              <input type="hidden" {...register("num_transactions_last_90d")} defaultValue={15} />
              <input type="hidden" {...register("avg_transaction_amount")} defaultValue={300} />
              <input type="hidden" {...register("complaint_count_last_12m")} defaultValue={0} />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Đang phân tích...' : 'Phân tích Rủi ro'}
              </button>
            </form>
            {Object.keys(errors).length > 0 && <p className="text-red-500 text-sm mt-2">Vui lòng điền đầy đủ các trường bắt buộc.</p>}
            {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
          </div>
          {/* CỘT PHẢI: KẾT QUẢ & BIỂU ĐỒ */}
          <div className="flex flex-col">
            {!result && !loading && (
              <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 p-6 text-center">
                Nhập thông tin và bấm Phân tích để xem kết quả dự báo, phân loại rủi ro và khuyến nghị hành động.
              </div>
            )}
            {loading && (
              <div className="flex-1 bg-white rounded-2xl shadow-md flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 font-medium">Đang kết nối AI Model...</p>
              </div>
            )}
            {result && !loading && (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex-1">
                <h2 className="text-2xl font-bold mb-4">Kết quả Chẩn đoán</h2>
               
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-gray-50 border">
                    <p className="text-sm text-gray-500">Xác suất rời bỏ</p>
                    <p className={`text-3xl font-black ${result.churn_probability > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                      {(result.churn_probability * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border">
                    <p className="text-sm text-gray-500">Mức độ rủi ro</p>
                    <p className={`text-xl font-bold mt-1 ${
                      result.risk_level === 'Cao' ? 'text-red-600' :
                      result.risk_level === 'Trung bình' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {result.risk_level}
                    </p>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border-l-4 ${
                  result.risk_level === 'Cao' ? 'bg-red-50 border-red-500' :
                  result.risk_level === 'Trung bình' ? 'bg-yellow-50 border-yellow-500' : 'bg-green-50 border-green-500'
                }`}>
                  <p className="font-bold text-gray-800 mb-1">Khuyến nghị từ hệ thống:</p>
                  <p className="text-sm text-gray-700">{result.recommendation}</p>
                </div>
                <ChurnPredictionChart
                  currentBalance={result.inputBalance}
                  baseChurnProb={result.churn_score}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
