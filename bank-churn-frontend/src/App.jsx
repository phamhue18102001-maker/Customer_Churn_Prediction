import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const App = () => {
  const [view, setView] = useState('overview');
  const [year, setYear] = useState('2025');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // ===== 12 MONTHS =====
  const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

  // ===== DATA 2025 =====
  const churn2025 = [12,15,18,14,22,19,25,20,23,18,21,19];
  const churn2024 = [10,12,14,13,18,16,20,18,19,17,18,16];

  const deposit2025 = [120,130,125,140,150,155,160,170,165,175,180,190];
  const deposit2024 = [100,110,115,120,130,135,140,150,145,155,160,170];

  const complaints = [20,25,18,30,28,22,35,30,27,26,24,22];

  const appUsage = [200,230,210,260,280,300,320,340,360,380,400,420];
  const transactionFreq = [150,170,165,180,200,210,220,230,240,260,280,300];

  // ===== CHARTS =====
  const churnChart = {
    labels: months,
    datasets: [
      {
        label: '2025',
        data: churn2025,
        borderColor: '#f43f5e',
        tension: 0.4
      },
      {
        label: '2024',
        data: churn2024,
        borderColor: '#94a3b8',
        borderDash: [5,5],
        tension: 0.4
      }
    ]
  };

  const depositChart = {
    labels: months,
    datasets: [
      {
        label: '2025',
        data: deposit2025,
        borderColor: '#22d3ee',
        tension: 0.4
      },
      {
        label: '2024',
        data: deposit2024,
        borderColor: '#64748b',
        borderDash: [5,5],
        tension: 0.4
      }
    ]
  };

  const growth = ((deposit2025[11] - deposit2024[11]) / deposit2024[11] * 100).toFixed(1);

  // ===== SEARCH =====
  const handleSearch = () => {
    if (searchTerm.toLowerCase().includes('a')) {
      setSelectedCustomer({
        name: "Nguyễn Văn A",
        churnRisk: "87%",
        balance: "250 triệu",
        trend: [120, 110, 90]
      });
      setView('customer');
    }
  };

  return (
    <div className="app-container">

      {/* HEADER */}
      <div className="header">
        🏦 BANK ANALYTICS PRO (12 MONTHS)
      </div>

      <div className="layout">

        {/* SIDEBAR */}
        <div className="sidebar">
          <button onClick={() => setView('overview')}>📊 Tổng quan</button>
          <button onClick={() => setView('customer')}>👤 Khách hàng</button>

          <select value={year} onChange={(e)=>setYear(e.target.value)}>
            <option>2025</option>
            <option>2024</option>
          </select>

          <input
            placeholder="Tìm khách hàng..."
            value={searchTerm}
            onChange={(e)=>setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch}>Tìm</button>
        </div>

        {/* MAIN */}
        <div className="main">

          {/* ===== OVERVIEW ===== */}
          {view === 'overview' && (
            <>
              <h2>TỔNG QUAN NGÂN HÀNG (12 THÁNG)</h2>

              {/* KPI CARDS */}
              <div className="cards">
                <div className="card">👥 KH: 12,450 ↑</div>
                <div className="card">⚠️ Churn: 18.5%</div>
                <div className="card">💰 Tăng trưởng vốn: +{growth}%</div>
                <div className="card">📈 Giao dịch: +12%</div>
              </div>

              {/* CHARTS */}
              <div className="grid">

                <div className="chart-box">
                  <h3>Rời bỏ KH (So sánh năm)</h3>
                  <Line data={churnChart} />
                </div>

                <div className="chart-box">
                  <h3>Tiền gửi (YoY)</h3>
                  <Line data={depositChart} />
                </div>

                <div className="chart-box">
                  <h3>Khiếu nại</h3>
                  <Bar data={{
                    labels: months,
                    datasets: [{ data: complaints, backgroundColor: '#f59e0b' }]
                  }} />
                </div>

                <div className="chart-box">
                  <h3>Tần suất App</h3>
                  <Line data={{
                    labels: months,
                    datasets: [{ data: appUsage, borderColor: '#10b981' }]
                  }} />
                </div>

                <div className="chart-box">
                  <h3>Tần suất giao dịch</h3>
                  <Line data={{
                    labels: months,
                    datasets: [{ data: transactionFreq, borderColor: '#a78bfa' }]
                  }} />
                </div>

              </div>
            </>
          )}

          {/* ===== CUSTOMER ===== */}
          {view === 'customer' && selectedCustomer && (
            <>
              <h2>CHI TIẾT KHÁCH HÀNG</h2>

              <div className="cards">
                <div className="card">{selectedCustomer.name}</div>
                <div className="card">Nguy cơ: {selectedCustomer.churnRisk}</div>
                <div className="card">Số dư: {selectedCustomer.balance}</div>
              </div>

              <div className="chart-box">
                <h3>Xu hướng tiền</h3>
                <Line data={{
                  labels: ['T-2','T-1','Hiện tại'],
                  datasets: [{
                    data: selectedCustomer.trend,
                    borderColor: '#22d3ee'
                  }]
                }} />
              </div>

              <div className="card">
                🔮 Khuyến nghị: Chăm sóc KH ngay trong 48h
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default App;

