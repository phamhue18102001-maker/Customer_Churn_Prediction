import React, { useState, useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, Tooltip, Legend
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, Tooltip, Legend
);

const App = () => {
  const [view, setView] = useState("overview");
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState(null);

  const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

  // ===== DATA =====
  const churn = [12,15,18,14,22,19,25,20,23,18,21,19];
  const deposit = [120,130,125,140,150,155,160,170,165,175,180,190];
  const usage = [200,230,210,260,280,300,320,340,360,380,400,420];
  const complaints = [20,25,18,30,28,22,35,30,27,26,24,22];


  const transaction = [150,170,165,180,200,210,220,230,240,260,280,300];

  // ===== CALC =====
  const last3 = churn.slice(-3).reduce((a,b)=>a+b,0);
  const prev3 = churn.slice(-6,-3).reduce((a,b)=>a+b,0);
  const churnTrend = last3 - prev3;

  const depositGrowth = ((deposit[11] - deposit[0]) / deposit[0] * 100).toFixed(1);

  const insight = useMemo(()=>{
    return churnTrend > 0
      ? "⚠️ Churn tăng mạnh trong 3 tháng gần đây → cần giữ chân KH ngay"
      : "✅ Churn giảm → chiến lược đang hiệu quả";
  },[churnTrend]);

  // ===== SEARCH =====
  const handleSearch = () => {
    setCustomer({
      name: "Nguyễn Văn A",
      churnRisk: "87%",
      balance: "250 triệu",
      usage: [200,180,150],
      transaction: [120,100,80]
    });
    setView("customer");
  };




  return (
    <div className="app">

      {/* HEADER */}
      <div className="header">
        <h1>🏦 BANK ANALYTICS DASHBOARD</h1>

        <div className="toolbar">
          <button onClick={()=>setView("overview")}>Tổng quan</button>
          <button onClick={()=>setView("customer")}>Khách hàng</button>

          <input
            placeholder="Tìm khách hàng..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>
        </div>
      </div>

      <div className="layout">

        {/* ===== LEFT CONTROL PANEL (1/3) ===== */}
        <div className="sidebar">

          <h3>🔍 Tìm kiếm</h3>
          <input
            placeholder="Nhập tên KH..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />
          <button onClick={handleSearch}>Tìm</button>

          <h3>📊 Bộ lọc</h3>
          <select>
            <option>Tất cả KH</option>
            <option>VIP</option>
            <option>Thường</option>
          </select>

          <select>
            <option>12 tháng</option>
            <option>6 tháng</option>
            <option>3 tháng</option>
          </select>

          <h3>⚙️ Phân tích</h3>
          <button>Churn</button>
          <button>Deposit</button>
          <button>Usage</button>
          <button>Complaint</button>

          <h3>📈 Hiển thị</h3>
          <label><input type="checkbox" defaultChecked /> Churn</label>
          <label><input type="checkbox" defaultChecked /> Deposit</label>
          <label><input type="checkbox" defaultChecked /> Giao dịch</label>

        </div>

        {/* ===== RIGHT DASHBOARD (2/3) ===== */}
        <div className="main">

          {/* ===== OVERVIEW ===== */}
          {view === "overview" && (
            <>
              <h2>📊 TỔNG QUAN NGÂN HÀNG</h2>

              {/* KPI */}
              <div className="kpi">
                <div className="card">👥 12,450 KH</div>
                <div className="card">⚠️ Churn: {churn[11]}%</div>
                <div className="card">💰 Growth: +{depositGrowth}%</div>
                <div className={`card ${churnTrend > 0 ? "down" : "up"}`}>
                  📉 3M Trend: {churnTrend > 0 ? "↑" : "↓"} {churnTrend}
                </div>
              </div>

              {/* ===== CHURN ===== */}
              <div className="section">
                <h3>📉 CHURN ANALYSIS</h3>
                <div className="grid">
                  <div className="chart">
                    <Line data={{
                      labels: months,
                      datasets: [{ data: churn, borderColor: "#ef4444" }]
                    }} />
                  </div>

                  <div className="chart">
                    <Bar data={{
                      labels: months,
                      datasets: [{ data: complaints, backgroundColor: "#f59e0b" }]
                    }} />
                  </div>
                </div>
              </div>

              {/* ===== FINANCE ===== */}
              <div className="section">
                <h3>💰 FINANCIAL FLOW</h3>
                <div className="grid">
                  <div className="chart">
                    <Line data={{
                      labels: months,
                      datasets: [{ data: deposit, borderColor: "#22d3ee" }]
                    }} />
                  </div>

                  <div className="chart">
                    <Line data={{
                      labels: months,
                      datasets: [{ data: transaction, borderColor: "#a78bfa" }]
                    }} />
                  </div>
                </div>
              </div>

              {/* ===== ACTIVITY ===== */}
              <div className="section">
                <h3>📱 CUSTOMER ACTIVITY</h3>
                <div className="grid">
                  <div className="chart">
                    <Line data={{
                      labels: months,
                      datasets: [{ data: usage, borderColor: "#10b981" }]
                    }} />
                  </div>

                  <div className="chart">
                    <Line data={{
                      labels: months,
                      datasets: [{ data: transaction, borderColor: "#f97316" }]
                    }} />
                  </div>
                </div>
              </div>

              {/* INSIGHT */}
              <div className="insight">
                <h3>🔮 AI INSIGHT</h3>
                <p>{insight}</p>
                <p>
                  → Churn {churnTrend > 0 ? "tăng" : "giảm"} so với 3 tháng trước  
                  → Cần điều chỉnh chiến lược giữ chân khách hàng
                </p>
              </div>
            </>
          )}

          {/* ===== CUSTOMER ===== */}
          {view === "customer" && customer && (
            <>
              <h2>👤 CHI TIẾT KHÁCH HÀNG</h2>

              <div className="kpi">
                <div className="card">{customer.name}</div>
                <div className="card">Risk: {customer.churnRisk}</div>
                <div className="card">Balance: {customer.balance}</div>
              </div>

              <div className="grid">
                <div className="chart">
                  <Line data={{
                    labels: ['T-2','T-1','Now'],
                    datasets: [{ data: customer.usage, borderColor: "#22d3ee" }]
                  }} />
                </div>

                <div className="chart">
                  <Line data={{
                    labels: ['T-2','T-1','Now'],
                    datasets: [{ data: customer.transaction, borderColor: "#ef4444" }]
                  }} />
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default App;


