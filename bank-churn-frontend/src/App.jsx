import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// --- COMPONENT BIỂU ĐỒ DỰ BÁO 6 THÁNG (GIỮ NGUYÊN) ---
const ChurnPredictionChart = ({ currentBalance, baseChurnProb }) => {
  const generateProjectionData = () => {
    let data = [];
    let tempBalance = Number(currentBalance) || 0;
    let tempChurn = Number(baseChurnProb) || 0;
    for (let i = 1; i <= 6; i++) {
      data.push({
        month: `Tháng ${i}`,
        balance: Math.round(tempBalance),
        churnRisk: Math.min(Math.round(tempChurn), 100)
      });
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
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line yAxisId="left" type="monotone" dataKey="balance" stroke="#3b82f6" name="Số dư (USD)" strokeWidth={3} />
          <Line yAxisId="right" type="monotone" dataKey="churnRisk" stroke="#ef4444" name="Nguy cơ rời bỏ (%)" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- MOCK DATA CHO DEMO (sau này thay bằng API /dashboard và /customers/:id) ---
const mockCustomers = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    churn_probability: 0.78,
    risk_level: "Cao",
    recommendation: "Gửi ưu đãi cá nhân hóa (tăng lãi suất tiết kiệm 0.5%) và liên hệ ngay qua hotline để giữ chân.",
    inputBalance: 105000,
    churn_score: 78,
    age: 42,
    geography: "France",
    journey: [
      { step: "Đăng ký tài khoản", status: "Hoàn thành", date: "01/2024" },
      { step: "Sử dụng sản phẩm", status: "Giảm mạnh", date: "03/2024" },
      { step: "Khiếu nại lần 1", status: "1 lần", date: "06/2024" },
      { step: "Hiện tại", status: "Nguy cơ cao", date: "Hiện tại" }
    ],
    drivers: [
      { feature: "Số lần login thấp", impact: 35 },
      { feature: "Số dư giảm 15%/tháng", impact: 25 },
      { feature: "Khiếu nại gần đây", impact: 20 },
      { feature: "Tuổi & Tenure", impact: 12 }
    ],
    comparison: { peerChurn: 0.22, avgChurn: 0.15, thisBalance: 105000, avgBalance: 82000 },
    segment: "High-Value Low-Engagement"
  },
  {
    id: 2,
    name: "Trần Thị B",
    churn_probability: 0.32,
    risk_level: "Trung bình",
    recommendation: "Tăng tương tác qua email marketing và kiểm tra hoạt động giao dịch.",
    inputBalance: 85000,
    churn_score: 32,
    age: 35,
    geography: "Germany",
    journey: [
      { step: "Đăng ký", status: "Hoàn thành", date: "02/2024" },
      { step: "Sử dụng", status: "Bình thường", date: "04/2024" },
      { step: "Khiếu nại", status: "0 lần", date: "Hiện tại" },
      { step: "Hiện tại", status: "An toàn", date: "Hiện tại" }
    ],
    drivers: [
      { feature: "Số dư ổn định", impact: -15 },
      { feature: "Login đều đặn", impact: -20 },
      { feature: "Không khiếu nại", impact: -25 },
      { feature: "NumOfProducts", impact: -10 }
    ],
    comparison: { peerChurn: 0.22, avgChurn: 0.15, thisBalance: 85000, avgBalance: 82000 },
    segment: "Loyal Mid-Value"
  },
  {
    id: 3,
    name: "Lê Hoàng C",
    churn_probability: 0.65,
    risk_level: "Cao",
    recommendation: "Ưu đãi chuyển đổi sản phẩm và giảm phí giao dịch 3 tháng.",
    inputBalance: 45000,
    churn_score: 65,
    age: 51,
    geography: "Spain",
    journey: [
      { step: "Đăng ký", status: "Hoàn thành", date: "12/2023" },
      { step: "Sử dụng", status: "Rất thấp", date: "02/2024" },
      { step: "Khiếu nại", status: "2 lần", date: "05/2024" },
      { step: "Hiện tại", status: "Nguy cơ cao", date: "Hiện tại" }
    ],
    drivers: [
      { feature: "Số dư giảm mạnh", impact: 40 },
      { feature: "Login thấp", impact: 30 },
      { feature: "Tuổi cao", impact: 18 }
    ],
    comparison: { peerChurn: 0.22, avgChurn: 0.15, thisBalance: 45000, avgBalance: 82000 },
    segment: "Senior At-Risk"
  },
  {
    id: 4,
    name: "Phạm Minh D",
    churn_probability: 0.12,
    risk_level: "Thấp",
    recommendation: "Giữ nguyên chiến lược, chỉ cần theo dõi định kỳ.",
    inputBalance: 220000,
    churn_score: 12,
    age: 28,
    geography: "France",
    journey: [
      { step: "Đăng ký", status: "Hoàn thành", date: "03/2024" },
      { step: "Sử dụng", status: "Cao", date: "Hiện tại" },
      { step: "Khiếu nại", status: "0 lần", date: "Hiện tại" },
      { step: "Hiện tại", status: "An toàn", date: "Hiện tại" }
    ],
    drivers: [
      { feature: "Hoạt động cao", impact: -30 },
      { feature: "Số dư tăng", impact: -25 }
    ],
    comparison: { peerChurn: 0.22, avgChurn: 0.15, thisBalance: 220000, avgBalance: 82000 },
    segment: "Young High-Value"
  }
];

// --- COMPONENT TỔNG QUAN NGÂN HÀNG (Phần 1) ---
const BankOverview = ({ onSelectCustomer }) => {
  const kpis = {
    totalCustomers: 12450,
    churnRate: 18.5,
    lostRevenue: 1250000,
    highRiskCount: 1230
  };

  const timeTrendData = [
    { month: "T1", churnRate: 15.2, lostRevenue: 180000 },
    { month: "T2", churnRate: 16.8, lostRevenue: 210000 },
    { month: "T3", churnRate: 17.5, lostRevenue: 230000 },
    { month: "T4", churnRate: 18.1, lostRevenue: 245000 },
    { month: "T5", churnRate: 19.3, lostRevenue: 265000 },
    { month: "T6", churnRate: 20.7, lostRevenue: 290000 }
  ];

  const ageData = [
    { group: "18-30", count: 3200, churn: 12 },
    { group: "31-45", count: 4800, churn: 19 },
    { group: "46-60", count: 3100, churn: 24 },
    { group: "60+", count: 1350, churn: 28 }
  ];

  const geoData = [
    { name: "France", value: 42, fill: "#3b82f6" },
    { name: "Germany", value: 31, fill: "#eab308" },
    { name: "Spain", value: 27, fill: "#ef4444" }
  ];

  const highRiskAlerts = mockCustomers.filter(c => c.churn_probability > 0.5);

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-sm text-gray-500">Tổng khách hàng</p>
          <p className="text-4xl font-black text-blue-900 mt-2">{kpis.totalCustomers.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-sm text-gray-500">Tỷ lệ churn dự báo</p>
          <p className="text-4xl font-black text-red-600 mt-2">{kpis.churnRate}%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-sm text-gray-500">Doanh thu mất tiềm năng (6 tháng)</p>
          <p className="text-4xl font-black text-red-600 mt-2">${(kpis.lostRevenue / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-sm text-gray-500">KH nguy cơ cao</p>
          <p className="text-4xl font-black text-red-600 mt-2">{kpis.highRiskCount}</p>
        </div>
      </div>

      {/* Biểu đồ tổng quan */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Biểu đồ churn theo thời gian */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border col-span-2">
          <h3 className="text-lg font-bold mb-4">Xu hướng churn & doanh thu mất theo tháng</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" tickFormatter={v => `${v}%`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={v => `$${(v/1000)}k`} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="churnRate" stroke="#ef4444" name="Churn Rate (%)" strokeWidth={3} />
              <Line yAxisId="right" type="monotone" dataKey="lostRevenue" stroke="#3b82f6" name="Doanh thu mất ($)" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ churn theo độ tuổi */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-bold mb-4">Churn theo nhóm tuổi</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="churn" fill="#ef4444" name="Churn (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ theo quốc gia */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border col-span-3 md:col-span-1">
          <h3 className="text-lg font-bold mb-4">Phân bố churn theo quốc gia</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={geoData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                {geoData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert Center */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-bold">Alert Center - KH nguy cơ cao</h3>
          <span className="text-sm text-red-600 font-medium">{highRiskAlerts.length} alert</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {highRiskAlerts.map(customer => (
            <div key={customer.id} className="p-5 border border-red-200 rounded-xl hover:border-red-400 transition flex flex-col">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-lg">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.geography} • {customer.age} tuổi</p>
                </div>
                <div className={`px-4 py-1 rounded-full text-white text-sm font-bold ${customer.churn_probability > 0.7 ? 'bg-red-600' : 'bg-orange-500'}`}>
                  {(customer.churn_probability * 100).toFixed(0)}%
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">{customer.recommendation}</p>
              <button
                onClick={() => onSelectCustomer(customer.id)}
                className="mt-4 text-sm bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg self-start transition"
              >
                Xem chi tiết khách hàng →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT CHI TIẾT KHÁCH HÀNG (Phần 2) ---
const CustomerDetail = ({ customer, onBack }) => {
  const [simBalance, setSimBalance] = useState(customer.inputBalance);
  const [simLogin, setSimLogin] = useState(4);
  const [simChurn, setSimChurn] = useState(customer.churn_probability);

  const runMiniSimulation = () => {
    let newChurn = customer.churn_probability;
    const balanceDrop = (customer.inputBalance - simBalance) / customer.inputBalance;
    if (balanceDrop > 0.15) newChurn += 0.12;
    if (simLogin < 5) newChurn += 0.08;
    setSimChurn(Math.min(Math.max(newChurn, 0), 1));
  };

  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Quay về Tổng quan Ngân hàng
      </button>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">{customer.name}</h2>
          <p className="text-gray-500">{customer.geography} • {customer.age} tuổi • Số dư: ${customer.inputBalance}</p>
        </div>
        <div className={`px-6 py-2 rounded-2xl text-white text-xl font-black ${customer.risk_level === 'Cao' ? 'bg-red-600' : customer.risk_level === 'Trung bình' ? 'bg-yellow-500' : 'bg-green-600'}`}>
          {customer.risk_level}
        </div>
      </div>

      {/* Kết quả chẩn đoán chính (tái sử dụng style cũ) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-white rounded-2xl shadow-sm border">
          <p className="text-sm text-gray-500">Xác suất rời bỏ</p>
          <p className="text-5xl font-black text-red-600">{(customer.churn_probability * 100).toFixed(1)}%</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border">
          <p className="text-sm text-gray-500">Khuyến nghị hệ thống</p>
          <p className="text-sm leading-relaxed mt-3 text-gray-700">{customer.recommendation}</p>
        </div>
      </div>

      {/* Timeline dự báo (chart cũ) */}
      <ChurnPredictionChart currentBalance={customer.inputBalance} baseChurnProb={customer.churn_score} />

      {/* Customer Journey Map */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-6">Customer Journey Map</h3>
        <div className="space-y-8 relative pl-8 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {customer.journey.map((step, idx) => (
            <div key={idx} className="flex gap-4 relative">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold z-10">0{idx + 1}</div>
              <div>
                <p className="font-semibold">{step.step}</p>
                <p className="text-sm text-gray-500">{step.date}</p>
                <p className="text-sm mt-1">{step.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Risk Drivers */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4">Top Risk Drivers (Feature Importance)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={customer.drivers} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="feature" width={140} />
            <Tooltip />
            <Bar dataKey="impact" fill="#ef4444" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Customer Comparison + Segment */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-bold mb-4">Customer Comparison</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Churn của khách này</span>
              <span className="font-bold text-red-600">{(customer.churn_probability * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Churn peer cùng phân khúc</span>
              <span>{(customer.comparison.peerChurn * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Số dư trung bình phân khúc</span>
              <span>${customer.comparison.avgBalance}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col justify-center">
          <h3 className="text-lg font-bold mb-2">Segment Discovery</h3>
          <div className="text-3xl font-black text-blue-700">{customer.segment}</div>
          <p className="text-sm text-gray-500 mt-2">Nhóm khách hàng có giá trị cao nhưng tương tác thấp – cần can thiệp khẩn cấp.</p>
        </div>
      </div>

      {/* Mini Simulation */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4">Mini Simulation: Thử thay đổi thông số</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Số dư mới (USD)</label>
            <input
              type="number"
              value={simBalance}
              onChange={e => setSimBalance(Number(e.target.value))}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Login 30 ngày</label>
            <input
              type="number"
              value={simLogin}
              onChange={e => setSimLogin(Number(e.target.value))}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={runMiniSimulation}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
        >
          Chạy Simulation
        </button>
        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-500">Xác suất churn sau khi thay đổi</p>
          <p className="text-4xl font-black text-red-600 mt-1">{(simChurn * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH (App) ---
export default function App() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [view, setView] = useState('overview'); // 'overview' | 'prediction' | 'detail'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Điền data demo
  const fillDemoData = () => {
    const demoData = {
      CreditScore: 650, Geography: "France", Gender: "Female", Age: 42,
      Tenure: 5, Balance: 105000, NumOfProducts: 1, HasCrCard: 1,
      IsActiveMember: 0, EstimatedSalary: 85000, login_count_last_30d: 4,
      num_transactions_last_90d: 12, avg_transaction_amount: 500, complaint_count_last_12m: 1
    };
    Object.keys(demoData).forEach(key => setValue(key, demoData[key]));
  };

  // Gửi API predict
  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${API_URL}/predict`, data);
      setResult({ ...response.data, inputBalance: data.Balance });
    } catch (error) {
      setErrorMsg('Lỗi kết nối đến Server. Vui lòng kiểm tra Backend.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Chuyển sang view Detail
  const handleSelectCustomer = (id) => {
    const customer = mockCustomers.find(c => c.id === id);
    if (customer) {
      setSelectedCustomer(customer);
      setView('detail');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto flex">
        {/* SIDEBAR NAVIGATION */}
        <div className="w-64 bg-white border-r border-gray-100 p-6 h-screen sticky top-0">
          <div className="mb-10">
            <h1 className="text-2xl font-extrabold text-blue-900">ChurnGuard AI</h1>
            <p className="text-xs text-gray-400 mt-1">BANK DASHBOARD</p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => { setView('overview'); setSelectedCustomer(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${view === 'overview' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}
            >
              📊 Tổng quan Ngân hàng
            </button>
            <button
              onClick={() => { setView('prediction'); setSelectedCustomer(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${view === 'prediction' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}
            >
              🔍 Dự báo Khách hàng Mới
            </button>
          </nav>

          <div className="mt-12 text-xs text-gray-400">DEMO DATA</div>
          <div className="mt-2 text-[10px] text-gray-500">Click Alert Center để xem chi tiết khách hàng</div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 p-8">
          {/* HEADER */}
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-blue-900">
                {view === 'overview' && 'Tổng quan Ngân hàng'}
                {view === 'prediction' && 'Dự báo Rủi ro Cá nhân'}
                {view === 'detail' && 'Chi tiết Khách hàng'}
              </h1>
              <p className="text-gray-500">
                {view === 'overview' && 'KPIs • Biểu đồ • Alert Center'}
                {view === 'prediction' && 'Nhập thông tin → AI dự đoán churn'}
                {view === 'detail' && 'Journey • Drivers • Simulation'}
              </p>
            </div>
            {view === 'prediction' && (
              <button
                onClick={fillDemoData}
                className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full hover:bg-indigo-200 transition"
              >
                ⚡ Điền data Demo
              </button>
            )}
          </header>

          {/* VIEW: TỔNG QUAN */}
          {view === 'overview' && <BankOverview onSelectCustomer={handleSelectCustomer} />}

          {/* VIEW: DỰ BÁO MỚI (GIỮ NGUYÊN CODE CŨ CỦA BẠN) */}
          {view === 'prediction' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* FORM TRÁI */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Thông tin khách hàng</h2>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* ... (giữ nguyên toàn bộ form của bạn, chỉ rút gọn một chút để ngắn) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Tuổi</label><input type="number" {...register("Age", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium mb-1">Điểm tín dụng</label><input type="number" {...register("CreditScore", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium mb-1">Số dư (Balance)</label><input type="number" step="any" {...register("Balance", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium mb-1">Lương ước tính</label><input type="number" step="any" {...register("EstimatedSalary", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium mb-1">Số lượng sản phẩm</label><input type="number" {...register("NumOfProducts", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium mb-1">Login (30 ngày)</label><input type="number" {...register("login_count_last_30d", { required: true })} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500" /></div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Quốc gia</label>
                      <select {...register("Geography")} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
                        <option value="France">France</option><option value="Germany">Germany</option><option value="Spain">Spain</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Giới tính</label>
                      <select {...register("Gender")} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
                        <option value="Female">Nữ</option><option value="Male">Nam</option>
                      </select>
                    </div>
                  </div>
                  {/* hidden fields */}
                  <input type="hidden" {...register("Tenure")} defaultValue={5} />
                  <input type="hidden" {...register("HasCrCard")} defaultValue={1} />
                  <input type="hidden" {...register("IsActiveMember")} defaultValue={1} />
                  <input type="hidden" {...register("num_transactions_last_90d")} defaultValue={15} />
                  <input type="hidden" {...register("avg_transaction_amount")} defaultValue={300} />
                  <input type="hidden" {...register("complaint_count_last_12m")} defaultValue={0} />

                  <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-blue-700 disabled:bg-gray-400">
                    {loading ? 'Đang phân tích...' : 'Phân tích Rủi ro'}
                  </button>
                </form>
                {Object.keys(errors).length > 0 && <p className="text-red-500 text-sm mt-2">Vui lòng điền đầy đủ.</p>}
                {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
              </div>

              {/* KẾT QUẢ PHẢI (prediction view) */}
              <div className="flex flex-col">
                {!result && !loading && (
                  <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 p-8 text-center">
                    Nhập thông tin và bấm Phân tích để xem kết quả
                  </div>
                )}
                {loading && (
                  <div className="flex-1 bg-white rounded-2xl shadow-md flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                        <p className={`text-xl font-bold mt-1 ${result.risk_level === 'Cao' ? 'text-red-600' : result.risk_level === 'Trung bình' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {result.risk_level}
                        </p>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg border-l-4 ${result.risk_level === 'Cao' ? 'bg-red-50 border-red-500' : result.risk_level === 'Trung bình' ? 'bg-yellow-50 border-yellow-500' : 'bg-green-50 border-green-500'}`}>
                      <p className="font-bold text-gray-800 mb-1">Khuyến nghị:</p>
                      <p className="text-sm text-gray-700">{result.recommendation}</p>
                    </div>
                    <ChurnPredictionChart currentBalance={result.inputBalance} baseChurnProb={result.churn_score} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: CHI TIẾT KHÁCH HÀNG */}
          {view === 'detail' && selectedCustomer && (
            <CustomerDetail customer={selectedCustomer} onBack={() => { setView('overview'); setSelectedCustomer(null); }} />
          )}
        </div>
      </div>
    </div>
  );
}