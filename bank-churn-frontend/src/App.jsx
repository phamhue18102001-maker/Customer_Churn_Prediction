import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';

// ==========================================
// DỮ LIỆU TỔNG QUAN (GIỮ NGUYÊN ĐỂ VẼ BIỂU ĐỒ)
// ==========================================
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const trendData = [
  { month: 'T1', churn: 120, retained: 800, balance: 4500, complaints: 15 },
  { month: 'T2', churn: 132, retained: 810, balance: 4300, complaints: 18 },
  { month: 'T3', churn: 101, retained: 850, balance: 4600, complaints: 12 },
  { month: 'T4', churn: 145, retained: 840, balance: 4100, complaints: 25 },
  { month: 'T5', churn: 90,  retained: 900, balance: 4800, complaints: 10 },
  { month: 'T6', churn: 85,  retained: 950, balance: 5000, complaints: 8 },
];

const productUsageData = [
  { name: '1 Sản phẩm', value: 4500 },
  { name: '2 Sản phẩm', value: 3200 },
  { name: '3 Sản phẩm', value: 1500 },
  { name: '4+ Sản phẩm', value: 800 },
];

const forecastData = [
  { period: '6 Tháng', expectedChurn: 450, expectedRetention: 4500 },
  { period: '9 Tháng', expectedChurn: 680, expectedRetention: 4200 },
  { period: '12 Tháng', expectedChurn: 890, expectedRetention: 3800 },
];

// Dữ liệu dùng để mô phỏng khi nhập ID tìm kiếm ở Tab Khách Hàng
const mockSearchResult = {
  id: "KH001", name: "Nguyễn Văn A", churn_probability: 0.78, risk_level: "Cao",
  inputBalance: 105000, age: 42, geography: "France", gender: "Nam",
  recommendation: "Gửi ưu đãi cá nhân hóa (tăng lãi suất 0.5%) và liên hệ ngay hotline.",
  services: 2,
  history: [
    { month: 'Tháng -3', deposit: 5000, withdraw: 12000, balance: 110000 },
    { month: 'Tháng -2', deposit: 2000, withdraw: 15000, balance: 97000 },
    { month: 'Tháng -1', deposit: 0,    withdraw: 10000, balance: 105000 },
  ]
};

// ==========================================
// COMPONENT 1: TỔNG QUAN NGÂN HÀNG (SẠCH SẼ, KHÔNG CÓ KH DEMO)
// ==========================================
const BankOverview = () => {
  return (
    <div className="space-y-6">
      {/* KHỐI KPI CHÍNH */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Tổng Khách Hàng", value: "12,450", color: "text-blue-400" },
          { label: "KH Mới (Tháng này)", value: "+840", color: "text-emerald-400" },
          { label: "Tỷ lệ Rời bỏ (Churn)", value: "18.5%", color: "text-rose-400" },
          { label: "Số Khiếu nại", value: "142", color: "text-amber-400" },
          { label: "KH Nguy cơ cao", value: "1,230", color: "text-rose-500" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg shadow-black/20 flex flex-col justify-center items-center text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{kpi.label}</p>
            <p className={`text-3xl font-black mt-2 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Biểu đồ 1 */}
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg shadow-black/20 col-span-2">
          <h3 className="text-slate-200 font-bold mb-4">Biến động KH: Rời bỏ & Ở lại (Theo tháng)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
              <Legend />
              <Bar dataKey="retained" fill="#10b981" name="KH Ở lại" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="churn" stroke="#f43f5e" name="KH Rời bỏ" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ 2 */}
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg shadow-black/20">
          <h3 className="text-slate-200 font-bold mb-4">Tỷ lệ KH theo số Sản phẩm</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={productUsageData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {productUsageData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ 3 */}
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg shadow-black/20 col-span-2">
          <h3 className="text-slate-200 font-bold mb-4">Tổng dòng tiền KH & Số khiếu nại</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis yAxisId="left" stroke="#94a3b8" />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="balance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Tổng dòng tiền ($)" />
              <Line yAxisId="right" type="monotone" dataKey="complaints" stroke="#f59e0b" name="Số khiếu nại" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ 4 */}
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg shadow-black/20">
          <h3 className="text-slate-200 font-bold mb-4">Dự báo Rời bỏ (6-9-12 Tháng)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={forecastData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="period" type="category" stroke="#94a3b8" width={70} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} />
              <Legend />
              <Bar dataKey="expectedChurn" fill="#ef4444" name="Dự kiến Rời bỏ" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENT 2: KHÔNG GIAN TRA CỨU KHÁCH HÀNG
// ==========================================
const CustomerSearchTab = () => {
  const [searchInput, setSearchInput] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    setIsSearching(true);
    // Giả lập gọi API tra cứu (sau này bạn thay bằng axios.get(`/api/customers/${searchInput}`))
    setTimeout(() => {
      setCustomerData(mockSearchResult);
      setIsSearching(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* THANH TÌM KIẾM TO, RÕ RÀNG */}
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-lg shadow-black/20 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Hồ sơ Khách hàng 360°</h2>
        <p className="text-slate-400 mb-6">Nhập mã Khách hàng (CIF) hoặc số điện thoại để phân tích rủi ro</p>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative flex items-center">
          <input 
            type="text" 
            placeholder="Ví dụ: KH001..." 
            className="w-full bg-slate-900 border border-slate-600 rounded-l-xl py-4 pl-6 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-r-xl transition-colors border border-blue-600 flex items-center gap-2 text-lg"
          >
            {isSearching ? 'Đang tải...' : 'Tra cứu'}
          </button>
        </form>
      </div>

      {/* HIỂN THỊ CHI TIẾT KHÁCH HÀNG NẾU TÌM THẤY */}
      {customerData && !isSearching && (
        <div className="grid md:grid-cols-3 gap-6 animate-fadeIn">
          {/* Ô THÔNG TIN KHÁCH HÀNG */}
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg shadow-black/20 col-span-1 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-slate-700 border-4 border-slate-600 flex items-center justify-center text-3xl font-bold text-slate-300 mb-4">
              {customerData.name.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold text-slate-100">{customerData.name}</h2>
            <p className="text-slate-400 mb-2">ID: {customerData.id}</p>
            <p className="text-slate-500 mb-6 text-sm">{customerData.geography} • {customerData.age} tuổi • {customerData.gender}</p>
            
            <div className="w-full space-y-3 text-left mt-auto">
              <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <span className="text-slate-400">Số dư hiện tại</span>
                <span className="font-bold text-slate-100">${customerData.inputBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <span className="text-slate-400">Số dịch vụ đang dùng</span>
                <span className="font-bold text-blue-400">{customerData.services} Dịch vụ</span>
              </div>
            </div>
          </div>

          {/* Ô DỰ ĐOÁN RỜI BỎ (CHURN PREDICTION) */}
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg shadow-black/20 col-span-2 flex flex-col justify-center">
            <h3 className="text-slate-200 font-bold mb-6 text-xl border-b border-slate-700 pb-2">Đánh giá rủi ro rời bỏ (AI Prediction)</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 text-center">
                <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-slate-700">
                  <span className={`text-4xl font-black ${customerData.risk_level === 'Cao' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {(customerData.churn_probability * 100).toFixed(0)}%
                  </span>
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="60" cy="60" r="54" fill="none" stroke={customerData.risk_level === 'Cao' ? '#f43f5e' : '#10b981'} strokeWidth="8" strokeDasharray="339.29" strokeDashoffset={339.29 - (339.29 * customerData.churn_probability)} />
                  </svg>
                </div>
                <p className={`mt-3 font-bold uppercase ${customerData.risk_level === 'Cao' ? 'text-rose-500' : 'text-emerald-500'}`}>Mức độ: {customerData.risk_level}</p>
              </div>
              <div className="flex-1 bg-slate-900/50 p-5 rounded-xl border border-slate-700 w-full">
                <h4 className="text-slate-300 font-semibold mb-2">💡 Giải thích & Khuyến nghị:</h4>
                <p className="text-slate-400 leading-relaxed text-sm">{customerData.recommendation}</p>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-rose-400 text-sm font-semibold">Cảnh báo hệ thống:</p>
                  <p className="text-slate-500 text-sm mt-1">Số tiền gửi tháng qua giảm mạnh, tần suất giao dịch thưa thớt.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CHI TIẾT LỊCH SỬ GIAO DỊCH 3 THÁNG */}
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg shadow-black/20 col-span-1 md:col-span-3 grid md:grid-cols-2 gap-6">
            <div className="w-full">
              <h3 className="text-slate-200 font-bold mb-4">Lịch sử Gửi / Rút tiền (3 Tháng)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={customerData.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} />
                  <Legend />
                  <Bar dataKey="deposit" fill="#10b981" name="Tiền Gửi vào" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdraw" fill="#f43f5e" name="Tiền Rút ra" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full">
              <h3 className="text-slate-200 font-bold mb-4">Biến động Số dư</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={customerData.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis domain={['dataMin - 5000', 'dataMax + 5000']} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} />
                  <Legend />
                  <Line type="monotone" dataKey="balance" stroke="#3b82f6" name="Số dư cuối kỳ" strokeWidth={4} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// COMPONENT CHÍNH (APP SHELL)
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' hoặc 'customer'

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-200 flex">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/50">C</div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide">ChurnGuard</h1>
            <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Analytics Pro</p>
          </div>
        </div>

        <nav className="space-y-3 flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Tổng quan (Dashboard)
          </button>
          
          <button
            onClick={() => setActiveTab('customer')}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'customer' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
            Tra cứu Khách hàng
          </button>
        </nav>
      </div>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b1120]">
        <header className="sticky top-0 z-10 bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">
            {activeTab === 'overview' ? 'Bank Analytics Dashboard' : 'Tra cứu & Phân tích Cá nhân'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {activeTab === 'overview' ? 'Góc nhìn tổng thể về hiệu suất và rủi ro khách hàng' : 'Nhập mã khách hàng để xem chi tiết dự báo rời bỏ'}
          </p>
        </header>

        <main className="p-8">
          {activeTab === 'overview' ? <BankOverview /> : <CustomerSearchTab />}
        </main>
      </div>
    </div>
  );
}