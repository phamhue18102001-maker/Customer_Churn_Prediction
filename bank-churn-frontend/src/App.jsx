import React, { useState, useEffect } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
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

const API_URL = "http://127.0.0.1:8000"; // ← Thay domain thật khi deploy

const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

// Default data (nếu API lỗi)
const defaultBankData = {
  customers: 12450,
  churn: [12,15,18,14,22,19,25,20,23,18,21,19],
  deposit: [120,130,125,140,150,155,160,170,165,175,180,190],
  productUsage: [60,68,65,75,80,78,82,88,90,94,100,108],
  complaints: [20,25,18,30,28,22,35,30,27,26,24,22],
  appUsage: [490,520,545,600,630,665,710,750,780,820,850,900],
  transaction: [150,170,165,180,200,210,220,230,240,260,280,300],
};

const defaultCustomerSample = {
  name: "Nguyễn Văn A",
  churn: [5,4,5,7,7,9,8,9,10,10,13,16],
  deposit: [2,2.4,2.9,3,2.8,3.2,3.3,3.5,3.7,3.8,4,4.2],
  productUsage: [1,1,2,2,2,2,3,3,3,4,4,5],
  complaints: [0,0,0,0,1,0,0,1,0,0,0,1],
  appUsage: [30,31,33,30,32,36,37,37,38,40,40,44],
  transaction: [12,13,13,14,14,16,16,16,17,17,18,19],
};

function getTrend(arr) {
  const last3 = arr.slice(-3).reduce((a,b)=>a+b,0);
  const prev3 = arr.slice(-6,-3).reduce((a,b)=>a+b,0);
  return {trend: last3 - prev3, last3, prev3};
}

const kpiConfigs = (data, isCustomer) => [
  { icon: isCustomer?"🧑":"👥", label: isCustomer?data.name:"Khách hàng", value: isCustomer?"":data.customers.toLocaleString() },
  { icon: "⚠️", label: "Churn tháng này", value: data.churn[11]+"%" },
  { icon: "💰", label: "Tiền gửi cuối kỳ", value: data.deposit[11]+(isCustomer?"":" tỷ") },
  { icon: "📦", label: "SP sử dụng", value: data.productUsage[11]+(isCustomer?"":"%") },
  { icon: "🗣️", label: "Khiếu nại", value: data.complaints[11]},
  { icon: "📱", label: "App Usage", value: data.appUsage[11]},
  { icon: "💸", label: "Giao dịch", value: data.transaction[11]}
];

const Card = ({icon, label, value}) => (
  <div className="kpi-card">
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
  </div>
);

export default function App() {
  const [viewCustomer, setViewCustomer] = useState(false);
  const [bankData, setBankData] = useState(defaultBankData);
  const [customerData, setCustomerData] = useState(defaultCustomerSample);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState({ status: "checking" });

  // Fetch health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/health`);
        const data = await res.json();
        setHealthStatus(data);
      } catch (err) {
        setHealthStatus({ status: "offline", error: err.message });
      }
    };
    checkHealth();
  }, []);

  // Fetch bank data
  useEffect(() => {
    const fetchBankData = async () => {
      setLoading(true);
      try {
        // Nếu backend có endpoint /analytics/bank-overview
        // const res = await fetch(`${API_URL}/analytics/bank-overview`);
        // const data = await res.json();
        // setBankData(data);
        
        // Tạm thời dùng default, sau sẽ update khi backend có endpoint
        console.log("Bank data using defaults - awaiting backend endpoint");
      } catch (err) {
        console.error("Error fetching bank data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBankData();
  }, []);

  // Fetch history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/applications?page=1&limit=100`);
        const data = await res.json();
        setHistoryData(data.data || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };
    fetchHistory();
  }, []);

  // Fetch prediction cho customer
  const handlePredictCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const customerId = document.querySelector("input[placeholder='Tên khách hàng...']").value;
      
      // Tìm customer từ history
      const customer = historyData.find(h => h.id === customerId || h.name === customerId);
      
      if (!customer) {
        setError("Khách hàng không tìm thấy");
        return;
      }

      // Call predict API
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer.input_data || customer)
      });

      const result = await res.json();
      
      // Update customer data with prediction result
      setCustomerData({
        ...customerData,
        name: customer.name || "Khách hàng",
        churnProbability: result.churn_probability || result.churn_score,
        riskLevel: result.risk_level,
        recommendation: result.recommendation
      });

      setViewCustomer(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const data = viewCustomer ? customerData : bankData;
  const trend = getTrend(data.churn);
  const kpis = kpiConfigs(data, viewCustomer);

  return (
    <div className="app">

      {/* HEADER */}
      <div className="header">
        <span className="logo">🏦 FINTECH ANALYTICS</span>
        <div className="header-status">
          <span className={`status-badge ${healthStatus.status === 'healthy' ? 'online' : 'offline'}`}>
            {healthStatus.status === 'healthy' ? '🟢 Online' : '🔴 Offline'}
          </span>
          <span className="status-db" title={healthStatus.database}>
            DB: {healthStatus.database?.split(':')[0] || 'Unknown'}
          </span>
        </div>
        <span>
          <button className="header-btn" onClick={()=>setViewCustomer(false)}>Ngân hàng</button>
          <button className="header-btn" onClick={()=>setViewCustomer(true)}>Khách hàng</button>
        </span>
      </div>
      
      {/* ERROR MESSAGE */}
      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>Đóng</button>
        </div>
      )}

      {/* LOADING */}
      {loading && <div className="loading-overlay">Đang tải...</div>}
      
      <div className="layout">
        {/* SIDEBAR */}
        <div className="sidebar">
          <h3>🔍 Tìm kiếm khách hàng</h3>
          <form onSubmit={handlePredictCustomer}>
            <input 
              placeholder="Tên/ID khách hàng..." 
              list="customer-list"
            />
            <datalist id="customer-list">
              {historyData.slice(0, 10).map(h => (
                <option key={h.id} value={h.id || h.name} />
              ))}
            </datalist>
            <button type="submit" disabled={loading}>
              {loading ? "Đang tìm..." : "Tìm"}
            </button>
          </form>

          <div className="side-divider"/>
          
          <h3>🧭 Bộ lọc</h3>
          <select>
            <option>Tất cả</option>
            <option>VIP</option>
            <option>Thường</option>
          </select>
          <select>
            <option>12 tháng</option>
            <option>6 tháng</option>
            <option>3 tháng</option>
          </select>

          <div className="side-divider"/>
          
          <h3>⚡ So sánh Churn</h3>
          <div className="trend-box">
            <span>3T gần: <b>{trend.last3}</b></span>
            <span>3T trước: <b>{trend.prev3}</b></span>
            <span>Chênh: <b className={trend.trend<0 ? "good":"bad"}>
              {trend.trend>0?"+":""}{trend.trend}
            </b></span>
          </div>
          <div className="side-insight">
            {trend.trend > 0
              ? "⚠️ Rời bỏ đang tăng! Hãy giữ chân KH."
              : "✅ Rời bỏ giảm/ổn định."}
          </div>

          {/* Prediction Result */}
          {viewCustomer && data.riskLevel && (
            <div className="side-divider">
              <h3>🎯 Kết quả dự đoán</h3>
              <div className={`risk-box risk-${data.riskLevel.toLowerCase()}`}>
                <span>📊 Xác suất: {(data.churnProbability * 100).toFixed(1)}%</span>
                <span>⚠️ Mức rủi ro: {data.riskLevel}</span>
                <p>💡 {data.recommendation}</p>
              </div>
            </div>
          )}
        </div>

        {/* MAIN */}
        <div className="main">
          <h1 className="main-title">
            {viewCustomer ? `PHÂN TÍCH KHÁCH HÀNG: ${customerData.name}` : "PHÂN TÍCH NGÂN HÀNG"}
          </h1>

          <div className="kpi-row">
            {kpis.slice(0,4).map((k,i) =>
              <Card key={i} icon={k.icon} label={k.label} value={k.value}/> 
            )}
          </div>

          <div className="kpi-row">
            {kpis.slice(4).map((k,i) =>
              <Card key={i} icon={k.icon} label={k.label} value={k.value}/> 
            )}
          </div>

          {/* Chart line: Dòng 1 (churn, deposit) */}
          <div className="chart-row">
            <div className="chart-box">
              <div className="chart-title">Churn (%)</div>
              <Line height={120} data={{
                labels: months,
                datasets: [{ 
                  data: data.churn, 
                  borderColor:"#EA5022", 
                  backgroundColor:"rgba(234, 80, 34, 0.1)", 
                  tension:.3, 
                  pointRadius: 2.2 
                }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
            <div className="chart-box">
              <div className="chart-title">Tiền gửi</div>
              <Line height={120} data={{
                labels: months,
                datasets: [{ 
                  data: data.deposit, 
                  borderColor:"#66C2CC", 
                  backgroundColor:"rgba(102, 194, 204, 0.1)", 
                  tension:.3, 
                  pointRadius: 2.2 
                }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
          </div>

          {/* Chart line/bar: Dòng 2 (Product Usage, Complaints, App Usage) */}
          <div className="chart-row">
            <div className="chart-box">
              <div className="chart-title">SP sử dụng (%)</div>
              <Line height={90} data={{
                labels: months,
                datasets: [{ 
                  data: data.productUsage, 
                  borderColor:"#289F7A", 
                  backgroundColor:"rgba(40, 159, 122, 0.1)", 
                  tension:.3, 
                  pointRadius: 2.2 
                }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
            <div className="chart-box">
              <div className="chart-title">Khiếu nại</div>
              <Bar height={90} data={{
                labels: months,
                datasets: [{ 
                  data: data.complaints, 
                  backgroundColor:"#5A68BA" 
                }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
            <div className="chart-box">
              <div className="chart-title">App Usage</div>
              <Line height={90} data={{
                labels: months,
                datasets: [{ 
                  data: data.appUsage, 
                  borderColor:"#E79EA1", 
                  backgroundColor:"rgba(231, 158, 161, 0.1)", 
                  tension:.3, 
                  pointRadius: 2.2 
                }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
          </div>

          {/* Chart line: Dòng 3 (transaction) */}
          <div className="chart-row">
            <div className="chart-box">
              <div className="chart-title">Tần suất giao dịch</div>
              <Line height={102} data={{
                labels: months,
                datasets: [{ 
                  data: data.transaction, 
                  borderColor:"#1C5A6F", 
                  backgroundColor:"rgba(28, 90, 111, 0.1)", 
                  tension:.3, 
                  pointRadius: 2.2 
                }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
          </div>

          {/* API Response Info */}
          <div className="api-info">
            <h4>📡 API Connections</h4>
            <p>Model: {healthStatus.model} | Database: {healthStatus.database}</p>
          </div>
        </div>
      </div>
    </div>
  );
}