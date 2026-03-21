import React, { useState, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, Tooltip, Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, Tooltip, Legend
);

const App = () => {
  const [view, setView] = useState('overview');
  const [segment, setSegment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);


  const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

  // ===== DATA =====
  const churn2025 = [12,15,18,14,22,19,25,20,23,18,21,19];
  const churn2024 = [10,12,14,13,18,16,20,18,19,17,18,16];

  const deposit2025 = [120,130,125,140,150,155,160,170,165,175,180,190];
  const deposit2024 = [100,110,115,120,130,135,140,150,145,155,160,170];

  const complaints = [20,25,18,30,28,22,35,30,27,26,24,22];

  const appUsage = [200,230,210,260,280,300,320,340,360,380,400,420];
  const transaction = [150,170,165,180,200,210,220,230,240,260,280,300];

  // ===== CALC =====
  const growth = ((deposit2025[11] - deposit2024[11]) / deposit2024[11] * 100).toFixed(1);

  const last3 = churn2025.slice(-3);
  const prev3 = churn2025.slice(-6, -3);

  const trendCompare = (last3.reduce((a,b)=>a+b,0) - prev3.reduce((a,b)=>a+b,0)).toFixed(1);

  // ===== CHARTS =====
  const churnChart = {
    labels: months,
    datasets: [
      { label: '2025', data: churn2025, borderColor: '#f43f5e', tension: 0.4 },
      { label: '2024', data: churn2024, borderColor: '#64748b', borderDash: [5,5] }
    ]
  };

  const depositChart = {
    labels: months,
    datasets: [
      { label: '2025', data: deposit2025, borderColor: '#22d3ee' },
      { label: '2024', data: deposit2024, borderColor: '#64748b', borderDash: [5,5] }
    ]
  };



  // ===== SEARCH =====
  const handleSearch = () => {
    setSelectedCustomer({
      name: "Nguyễn Văn A",
      churnRisk: "87%",
      balance: "250 triệu",
      trend: [120,110,90],
      complaints: [1,2,3]
    });
    setView('customer');
  };

  // ===== AI INSIGHT =====
  const insight = useMemo(() => {
    if (trendCompare > 0) {
      return "Churn đang tăng trong 3 tháng gần đây → cần can thiệp sớm.";
    }
    return "Churn đang giảm → chiến lược giữ chân hiệu quả.";
  }, [trendCompare]);

  return (
    <div className="app-container">

      {/* HEADER */}
      <div className="header">
        🏦 FINTECH ANALYTICS PRO
      </div>

      <div className="layout">

        {/* SIDEBAR */}
        <div className="sidebar">
          <button onClick={()=>setView('overview')}>📊 Tổng quan</button>
          <button onClick={()=>setView('customer')}>👤 Khách hàng</button>

          <select value={segment} onChange={(e)=>setSegment(e.target.value)}>
            <option value="all">Tất cả KH</option>
            <option value="vip">VIP</option>
            <option value="normal">Thường</option>
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
              <h2>TỔNG QUAN (12 THÁNG + YOY)</h2>

              {/* KPI */}
              <div className="cards">
                <div className="card">👥 KH: 12,450</div>
                <div className="card">⚠️ Churn: {churn2025[11]}%</div>
                <div className="card">💰 Growth: +{growth}%</div>
                <div className="card">📊 3M Trend: {trendCompare > 0 ? "↑" : "↓"} {trendCompare}</div>
              </div>

              {/* CHARTS */}
              <div className="grid">

                <div className="chart-box">
                  <h3>Churn (YoY)</h3>
                  <Line data={churnChart} />
                </div>

                <div className="chart-box">
                  <h3>Deposit (YoY)</h3>
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
                  <h3>App Usage</h3>
                  <Line data={{
                    labels: months,
                    datasets: [{ data: appUsage, borderColor: '#10b981' }]
                  }} />
                </div>

                <div className="chart-box">
                  <h3>Transaction</h3>
                  <Line data={{
                    labels: months,
                    datasets: [{ data: transaction, borderColor: '#a78bfa' }]
                  }} />
                </div>
              </div>

              {/* AI BOX */}
              <div className="card">
                🔮 AI Insight: {insight}
              </div>
            </>
          )}

          {/* ===== CUSTOMER ===== */}
          {view === 'customer' && selectedCustomer && (
            <>
              <h2>CHI TIẾT KH</h2>

              <div className="cards">
                <div className="card">{selectedCustomer.name}</div>
                <div className="card">Risk: {selectedCustomer.churnRisk}</div>
                <div className="card">Balance: {selectedCustomer.balance}</div>
              </div>

              <div className="chart-box">
                
                <Line data={{
                  labels: ['T-2','T-1','Now'],
                  datasets: [{ data: selectedCustomer.trend, borderColor: '#22d3ee' }]
                }} />
              </div>

              <div className="chart-box">
                <Bar data={{
                  labels: ['T-2','T-1','Now'],
                  datasets: [{ data: selectedCustomer.complaints, backgroundColor: '#f43f5e' }]
                }} />
              </div>

              <div className="card">
                🔮 Nguy cơ cao → cần giữ chân ngay
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default App;

