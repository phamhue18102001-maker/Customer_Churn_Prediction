import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Dữ liệu tổng quan (đã tối ưu màu đẹp hơn)
  const monthlyChurn = {
    labels: ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'],
    datasets: [
      { label: 'Rời bỏ (%)', data: [12,15,18,14,22,19,25,20,23,18,21,19], borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.15)', tension: 0.4, fill: true },
      { label: 'Ở lại (%)', data: [88,85,82,86,78,81,75,80,77,82,79,81], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', tension: 0.4, fill: true }
    ]
  };

  const productUsage = {
    labels: ['Gửi tiết kiệm', 'Vay tín chấp', 'Thẻ tín dụng', 'Internet Banking', 'Mobile Banking'],
    datasets: [{ label: '% Khách hàng', data: [45,32,28,65,80], backgroundColor: ['#22d3ee','#a78bfa','#ec4899','#f59e0b','#10b981'] }]
  };

  const retention = {
    labels: ['6 tháng', '9 tháng', '12 tháng'],
    datasets: [{ label: 'Tỷ lệ ở lại (%)', data: [92,85,78], backgroundColor: '#10b981', borderRadius: 12 }]
  };

  const moneyTrend = {
    labels: ['T1','T2','T3','T4','T5','T6'],
    datasets: [{ label: 'Triệu VND', data: [85,92,78,95,88,72], borderColor: '#22d3ee', borderWidth: 5, tension: 0.4 }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#e2e8f0', font: { size: 14 } } },
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } }
    }
  };

  // Tìm khách hàng
  const handleSearch = () => {
    if (searchTerm.toLowerCase().includes('nguyễn') || searchTerm.toLowerCase().includes('a')) {
      setSelectedCustomer({
        name: 'Nguyễn Văn A',
        id: 'KH-2025001',
        balance: '245.8 triệu',
        churnRisk: '87%',
        services: ['Gửi tiết kiệm 6 tháng', 'Thẻ tín dụng', 'Mobile Banking'],
        withdrawLastMonth: '45 triệu',
        moneyTrend: [120, 135, 118], // dữ liệu cho chart cá nhân
      });
    } else {
      alert('Không tìm thấy khách hàng! Hãy thử "Nguyễn Văn A"');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1428] via-[#0f1f3d] to-[#0a1428] p-8 font-inter">
      <div className="max-w-[1480px] mx-auto glass rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#0f1f3d] to-[#1a2338] px-10 py-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-2xl flex items-center justify-center text-5xl shadow-xl">🏦</div>
            <div>
              <h1 className="text-5xl font-bold text-white tracking-tighter title-glow">ChurnGuard</h1>
              <p className="text-cyan-300 -mt-1">Bank Analytics Pro</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-10 p-10">

          {/* ==================== LEFT: THANH TÁC VỤ (sidebar) ==================== */}
          <div className="xl:w-96 space-y-8">
            {/* SEARCH */}
            <div className="glass rounded-3xl p-7">
              <input
                type="text"
                placeholder="🔍 Tìm kiếm khách hàng (ví dụ: Nguyễn Văn A)"
                className="w-full bg-[#111827] border border-slate-600 rounded-2xl px-6 py-5 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="mt-5 w-full bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-bold py-4 rounded-2xl text-lg shadow-lg">
                TÌM KIẾM
              </button>
            </div>

            {/* 6 METRIC CARDS - VIỀN + BÓNG ĐẸP */}
            <div className="space-y-5">
              {[
                { icon: "👥", label: "Tổng KH", value: "12.450", change: "+2.1%", color: "text-emerald-400" },
                { icon: "🚀", label: "KH mới tháng này", value: "+840", change: "+5.4%", color: "text-sky-400" },
                { icon: "⚠️", label: "Tỷ lệ rời bỏ", value: "18.5%", change: "+0.8%", color: "text-red-400" },
                { icon: "📋", label: "Khiếu nại", value: "142", change: "-1.2%", color: "text-amber-400" },
                { icon: "🛡️", label: "KH nguy cơ cao", value: "1.230", change: "+3.5%", color: "text-red-400" },
                { icon: "📈", label: "Tăng trưởng giữ chân", value: "81.5%", change: "+1.2%", color: "text-emerald-400" },
              ].map((item, i) => (
                <div key={i} className="metric-card flex gap-6 p-7 rounded-3xl border border-slate-700 shadow-xl hover:border-cyan-400">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-4xl">{item.icon}</div>
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">{item.label}</p>
                    <p className={`text-4xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                    <p className={`text-sm mt-2 flex items-center gap-1 ${item.color}`}>{item.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================== RIGHT: BIỂU ĐỒ + CHI TIẾT KH ==================== */}
          <div className="flex-1 space-y-10">
            <div>
              <h2 className="text-5xl font-bold text-white tracking-tighter title-glow">TỔNG QUAN RỜI BỎ KHÁCH HÀNG</h2>
              <p className="text-slate-400 text-2xl">Ngân hàng • Tháng 3/2025</p>
            </div>

            {/* GRID 2x2 BIỂU ĐỒ - ĐẸP & ĐỀU */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="chart-box p-8 rounded-3xl">
                <h3 className="text-xl font-semibold mb-6 text-white">Rời bỏ &amp; Giữ chân theo tháng</h3>
                <div className="h-80"><Line data={monthlyChurn} options={chartOptions} /></div>
              </div>

              <div className="chart-box p-8 rounded-3xl">
                <h3 className="text-xl font-semibold mb-6 text-white">% KH theo sản phẩm sử dụng</h3>
                <div className="h-80"><Bar data={productUsage} options={chartOptions} /></div>
              </div>

              <div className="chart-box p-8 rounded-3xl">
                <h3 className="text-xl font-semibold mb-6 text-white">Tỷ lệ giữ chân theo kỳ hạn</h3>
                <div className="h-80"><Bar data={retention} options={{...chartOptions, indexAxis: 'y'}} /></div>
              </div>

              <div className="chart-box p-8 rounded-3xl">
                <h3 className="text-xl font-semibold mb-6 text-white">Số tiền gửi trung bình (triệu VND)</h3>
                <div className="h-80"><Line data={moneyTrend} options={chartOptions} /></div>
              </div>
            </div>

            {/* CHI TIẾT KHÁCH HÀNG (đẹp hơn, có chart riêng) */}
            {selectedCustomer && (
              <div className="chart-box p-10 rounded-3xl border-t-4 border-cyan-400">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-4xl font-bold text-white">{selectedCustomer.name}</h3>
                    <p className="text-cyan-400 text-2xl">ID: {selectedCustomer.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-7xl font-bold text-red-400">{selectedCustomer.churnRisk}</p>
                    <p className="text-red-400">NGUY CƠ RỜI BỎ</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="metric-card p-8 rounded-3xl">
                    <p className="text-slate-400">Số dư hiện tại</p>
                    <p className="text-5xl font-bold text-sky-400 mt-3">{selectedCustomer.balance}</p>
                  </div>
                  <div className="metric-card p-8 rounded-3xl">
                    <p className="text-slate-400">Rút tháng trước</p>
                    <p className="text-5xl font-bold text-red-400 mt-3">{selectedCustomer.withdrawLastMonth}</p>
                  </div>
                  <div className="metric-card p-8 rounded-3xl">
                    <p className="text-slate-400">Dịch vụ đang dùng</p>
                    <ul className="mt-5 space-y-3 text-emerald-300">
                      {selectedCustomer.services.map((s, i) => (
                        <li key={i} className="flex items-center gap-2">• {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Chart tiền gửi 3 tháng của KH */}
                <div className="mb-12">
                  <h4 className="text-xl font-semibold mb-6 text-white">Số tiền gửi 3 tháng gần nhất</h4>
                  <div className="h-72 bg-[#111827] rounded-3xl p-6">
                    <Line
                      data={{
                        labels: ['Tháng trước', 'Tháng này-1', 'Tháng này'],
                        datasets: [{ label: 'Triệu VND', data: selectedCustomer.moneyTrend, borderColor: '#22d3ee', borderWidth: 6, tension: 0.4 }]
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>

                {/* Ô DỰ ĐOÁN RIÊNG - có giải thích */}
                <div className="prediction-box p-10 rounded-3xl border border-red-500/30 bg-gradient-to-br from-[#1a2338] to-red-900/10">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl">🔮</span>
                    <div>
                      <p className="uppercase text-red-400 text-sm tracking-widest">DỰ ĐOÁN AI</p>
                      <p className="text-3xl font-bold text-white">NGUY CƠ RỜI BỎ CAO</p>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Nguyên nhân: Số dư giảm 28% trong 3 tháng • Rút tiền lớn • Có 2 khiếu nại gần đây.<br />
                    <span className="text-emerald-400 font-medium">Khuyến nghị: Gọi tư vấn cá nhân hóa trong 48 giờ tới để giữ chân khách hàng.</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;