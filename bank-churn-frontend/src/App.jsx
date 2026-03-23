import React, { useState, useEffect, useRef } from "react";
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

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

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

const chartExplanations = {
  churn: {
    title: "📈 Biểu đồ Churn Rate",
    explanation: "Tỷ lệ khách hàng rời bỏ dịch vụ hàng tháng. Biểu đồ cho thấy xu hướng churn tăng từ tháng 1 đến tháng 9, sau đó giảm xuống.",
    keyPoints: [
      "🔴 Peak: Tháng 9 với 25% - Dấu hiệu có sự cố lớn hoặc update không thành công",
      "🟢 Recovery: Từ tháng 10-12 churn giảm - Các biện pháp giữ chân khách hàng có tác dụng",
      "⚡ Current: 19% - Vẫn cao hơn baseline, cần tiếp tục cải thiện"
    ],
    solutions: [
      "🎯 Tìm hiểu nguyên nhân spike ở tháng 9",
      "📞 Liên hệ khách hàng đã rời bỏ để hiểu feedback",
      "💡 Duy trì các biện pháp giữ chân từ tháng 10"
    ]
  },
  deposit: {
    title: "💰 Biểu đồ Tiền Gửi",
    explanation: "Tiền gửi trung bình của khách hàng tăng từ 120 tỷ (T1) lên 190 tỷ (T12). Khách hàng có niềm tin gửi tiền.",
    keyPoints: [
      "📈 Trend: Tăng liên tục (+58% YoY) - Khách hàng có niềm tin gửi tiền",
      "🎄 Peak: Tháng 12 với 190 tỷ - Có thể do bonus mùa lễ",
      "📊 Volatility: Ổn định - Dễ dự đoán và quản lý"
    ],
    solutions: [
      "💎 Tạo sản phẩm tiết kiệm lãi suất cao",
      "🎁 Khuyến mãi tháng 12-1 để duy trì mức gửi cao",
      "⚠️ Lưu ý: Tiền gửi tăng nhưng churn cũng tăng"
    ]
  },
  products: {
    title: "📦 Biểu đồ Sản Phẩm Sử Dụng",
    explanation: "Tỷ lệ khách hàng sử dụng nhiều sản phẩm tăng từ 60% lên 108%. Khách hàng ngày càng sử dụng đa dạng sản phẩm.",
    keyPoints: [
      "🔗 Trend: Tăng 80% - Khách hàng sử dụng nhiều sản phẩm hơn",
      "🎯 Implication: Đa dạng hóa sản phẩm tạo sự gắn bó cao hơn",
      "⚠️ Paradox: Sản phẩm tăng nhưng churn cũng tăng"
    ],
    solutions: [
      "🔗 Tạo bundle deal khi khách hàng mua 2+ sản phẩm",
      "📚 Hướng dẫn khách hàng cách sử dụng đầy đủ",
      "🎯 Phân tích: Loại sản phẩm nào có churn cao nhất"
    ]
  },
  complaints: {
    title: "🗣️ Biểu đồ Khiếu Nại",
    explanation: "Số lượng khiếu nại biến động từ 18-35 cases/tháng. Spike ở tháng 8 trùng với spike churn ở tháng 9.",
    keyPoints: [
      "🔴 Peak: Tháng 8 (35 cases) → Tháng 9 churn spike (25%)",
      "✅ Recent: Tháng 11-12 giảm xuống 22-24 - Tình hình cải thiện",
      "🔗 Correlation: Khiếu nại nhiều → churn cao"
    ],
    solutions: [
      "⚡ Thiết lập SLA: Giải quyết khiếu nại trong 24h",
      "📞 Customer success team liên hệ khách hàng có khiếu nại",
      "🎯 Root cause analysis: Tháng 8 xảy ra vấn đề gì"
    ]
  },
  appUsage: {
    title: "📱 Biểu đồ App Usage",
    explanation: "Lượt sử dụng app tăng từ 490 lên 900. Nhưng churn vẫn cao - app tốt nhưng sản phẩm không thỏa mãn.",
    keyPoints: [
      "📈 Trend: Tăng 84% - App ngày càng được sử dụng",
      "⚡ Paradox: App usage tăng nhưng churn cũng tăng",
      "💡 Insight: UX tốt nhưng sản phẩm/dịch vụ còn vấn đề"
    ],
    solutions: [
      "🔍 A/B test: Tính năng nào người dùng dùng nhiều nhất",
      "🎮 Gamification: Thêm rewards/points khi dùng app",
      "🔔 Push notification: Gợi ý dựa trên usage pattern"
    ]
  },
  transaction: {
    title: "💸 Biểu đồ Giao Dịch",
    explanation: "Tần suất giao dịch tăng từ 150 lên 300 (+100%). Khách hàng ngày càng sử dụng tính năng giao dịch.",
    keyPoints: [
      "📊 Trend: Tăng 100% - Gấp đôi số giao dịch",
      "✅ Stability: Tăng liên tục & ổn định - Dễ dự báo",
      "⚡ Positive: Tần suất giao dịch cao = khách hàng active"
    ],
    solutions: [
      "💰 Cashback/rewards cho mỗi giao dịch",
      "🎯 Milestone rewards: Thưởng khi đạt 100, 500, 1000 lần",
      "🔐 Security: Tăng cường bảo mật để xây dựng tin tưởng"
    ]
  }
};

function analyzeData(data) {
  const churnData = data.churn;
  const depositData = data.deposit;
  const currentMonth = churnData[11];
  const prevMonth = churnData[10];
  const changePercent = ((currentMonth - prevMonth) / prevMonth * 100).toFixed(1);
  
  const last3 = churnData.slice(-3).reduce((a,b)=>a+b,0) / 3;
  const first3 = churnData.slice(0,3).reduce((a,b)=>a+b,0) / 3;
  
  return {
    currentMonth,
    prevMonth,
    changePercent,
    last3Months: last3.toFixed(1),
    first3Months: first3.toFixed(1),
    maxChurn: Math.max(...churnData),
    minChurn: Math.min(...churnData),
    depositChange: ((depositData[11] - depositData[10]) / depositData[10] * 100).toFixed(1),
    yoyChange: (((currentMonth - first3) / first3) * 100).toFixed(1)
  };
}

const ChartSection = ({ chartKey, data, title, color, type = "line" }) => {
  const ref = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const info = chartExplanations[chartKey];

  const chartData = {
    labels: months,
    datasets: [{
      data: data,
      borderColor: color,
      backgroundColor: `${color}20`,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: color,
      borderWidth: 3,
      fill: true,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true, mode: 'index' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div ref={ref} className={`chart-section ${isVisible ? 'visible' : ''}`}>
      <div className="section-container">
        {/* Left: Chart */}
        <div className="chart-wrapper">
          <div className="chart-box">
            <h2 className="chart-main-title">{info.title}</h2>
            <div className="chart-container">
              {type === "line" ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <Bar data={chartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Right: Explanation */}
        <div className="explanation-wrapper">
          <div className="explanation-box">
            <h3>💡 Giải thích</h3>
            <p className="explanation-text">{info.explanation}</p>

            <h4 className="section-subtitle">🔑 Các điểm chính:</h4>
            <ul className="key-points-list">
              {info.keyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>

            <h4 className="section-subtitle">✨ Giải pháp đề xuất:</h4>
            <ul className="solutions-list">
              {info.solutions.map((solution, idx) => (
                <li key={idx}>{solution}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPIDisplay = ({ data }) => (
  <div className="kpi-display">
    <div className="kpi-item">
      <span className="kpi-icon">👥</span>
      <div>
        <p>Tổng khách hàng</p>
        <strong>{data.customers.toLocaleString()}</strong>
      </div>
    </div>
    <div className="kpi-item">
      <span className="kpi-icon">⚠️</span>
      <div>
        <p>Churn tháng này</p>
        <strong style={{color: '#EA5022'}}>{data.churn[11]}%</strong>
      </div>
    </div>
    <div className="kpi-item">
      <span className="kpi-icon">💰</span>
      <div>
        <p>Tiền gửi cuối kỳ</p>
        <strong>{data.deposit[11]} tỷ</strong>
      </div>
    </div>
    <div className="kpi-item">
      <span className="kpi-icon">📦</span>
      <div>
        <p>SP sử dụng</p>
        <strong>{data.productUsage[11]}%</strong>
      </div>
    </div>
    <div className="kpi-item">
      <span className="kpi-icon">📱</span>
      <div>
        <p>App Usage</p>
        <strong>{data.appUsage[11]}</strong>
      </div>
    </div>
    <div className="kpi-item">
      <span className="kpi-icon">💸</span>
      <div>
        <p>Giao dịch</p>
        <strong>{data.transaction[11]}</strong>
      </div>
    </div>
  </div>
);

export default function App() {
  const [viewCustomer, setViewCustomer] = useState(false);
  const [bankData, setBankData] = useState(defaultBankData);
  const [customerData, setCustomerData] = useState(defaultCustomerSample);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState({ status: "checking" });
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/health`);
        if (res.ok) {
          const data = await res.json();
          setHealthStatus(data);
        }
      } catch (err) {
        setHealthStatus({ status: "offline" });
      }
    };
    checkHealth();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setError("Nhập tên hoặc ID khách hàng");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchInput })
      });

      if (res.ok) {
        const result = await res.json();
        setCustomerData({
          ...defaultCustomerSample,
          name: searchInput,
          churnProbability: result.churn_probability || 0.5
        });
        setViewCustomer(true);
      }
    } catch (err) {
      setError("Lỗi tìm kiếm: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const data = viewCustomer ? customerData : bankData;
  const analysis = analyzeData(data);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1 className="logo">💳 CUSTOMER CHURN ANALYTICS</h1>
          <span className={`status-badge ${healthStatus.status === 'healthy' ? 'online' : 'offline'}`}>
            {healthStatus.status === 'healthy' ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
        <div className="header-controls">
          <button 
            className={`mode-btn ${!viewCustomer ? 'active' : ''}`}
            onClick={() => setViewCustomer(false)}
          >
            🏦 Ngân hàng
          </button>
          <button 
            className={`mode-btn ${viewCustomer ? 'active' : ''}`}
            onClick={() => setViewCustomer(true)}
          >
            👤 Khách hàng
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Search Section */}
      <section className="search-section">
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Tìm khách hàng theo ID hoặc tên..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? '🔍 Đang tìm...' : '🔍 Tìm'}
            </button>
          </form>
        </div>
      </section>

      {/* KPI Section */}
      <section className="kpi-section">
        <div className="kpi-header">
          <h2>{viewCustomer ? `${data.name}` : 'Tổng quan Ngân hàng'}</h2>
          <p className="kpi-subtitle">Dữ liệu tháng {months[11]}</p>
        </div>
        <KPIDisplay data={data} />
      </section>

      {/* Chart Sections */}
      <ChartSection 
        chartKey="churn" 
        data={data.churn} 
        title="Churn Rate" 
        color="#EA5022"
        type="line"
      />

      <ChartSection 
        chartKey="deposit" 
        data={data.deposit} 
        title="Tiền Gửi" 
        color="#66C2CC"
        type="line"
      />

      <ChartSection 
        chartKey="products" 
        data={data.productUsage} 
        title="Sản phẩm" 
        color="#289F7A"
        type="line"
      />

      <ChartSection 
        chartKey="complaints" 
        data={data.complaints} 
        title="Khiếu nại" 
        color="#5A68BA"
        type="bar"
      />

      <ChartSection 
        chartKey="appUsage" 
        data={data.appUsage} 
        title="App Usage" 
        color="#E79EA1"
        type="line"
      />

      <ChartSection 
        chartKey="transaction" 
        data={data.transaction} 
        title="Giao dịch" 
        color="#1C5A6F"
        type="line"
      />

      {/* Summary Section */}
      <section className="summary-section">
        <div className="summary-container">
          <h2>📊 Tóm tắt năm</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <h4>📈 Xu hướng Churn</h4>
              <p>Từ <strong>{analysis.first3Months}%</strong> (3T đầu) → <strong>{analysis.last3Months}%</strong> (3T cuối)</p>
              <p style={{marginTop: '10px', color: analysis.yoyChange > 0 ? '#EA5022' : '#289F7A'}}>
                {analysis.yoyChange > 0 ? '⬆️ Tăng' : '⬇️ Giảm'} <strong>{Math.abs(analysis.yoyChange)}%</strong> so với năm ngoái
              </p>
            </div>

            <div className="summary-card">
              <h4>💰 Tiền gửi</h4>
              <p>Tháng này <strong>{analysis.depositChange > 0 ? '+' : ''}{analysis.depositChange}%</strong> so với tháng trước</p>
              <p style={{marginTop: '10px', fontSize: '12px', color: '#80deea'}}>
                Từ {defaultBankData.deposit[10]} tỷ → {defaultBankData.deposit[11]} tỷ
              </p>
            </div>

            <div className="summary-card">
              <h4>⚠️ Churn tháng này</h4>
              <p style={{color: analysis.changePercent > 0 ? '#EA5022' : '#289F7A'}}>
                <strong style={{fontSize: '24px'}}>{analysis.currentMonth}%</strong>
              </p>
              <p style={{marginTop: '10px', fontSize: '12px'}}>
                {analysis.changePercent > 0 ? '⬆️ Tăng' : '⬇️ Giảm'} {Math.abs(analysis.changePercent)}% so với tháng trước
              </p>
            </div>

            <div className="summary-card">
              <h4>📊 Range Churn</h4>
              <p>Min: <strong>{analysis.minChurn}%</strong> | Max: <strong>{analysis.maxChurn}%</strong></p>
              <p style={{marginTop: '10px', color: '#80deea', fontSize: '12px'}}>
                Volatility: {analysis.maxChurn - analysis.minChurn}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>🚀 Customer Churn Analytics Dashboard | Data as of {months[11]}</p>
      </footer>
    </div>
  );
}