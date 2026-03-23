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
    title: "Tỷ Lệ Khách Hàng Rời Bỏ",
    explanation: "Tỷ lệ khách hàng rời bỏ dịch vụ hàng tháng. Biểu đồ cho thấy xu hướng churn tăng từ tháng 1 đến tháng 9, sau đó giảm xuống. Đây là chỉ số quan trọng để đánh giá sự hài lòng của khách hàng.",
    keyPoints: [
      "Đỉnh cao: Tháng 9 với 25% - Dấu hiệu có sự cố lớn hoặc cập nhật không thành công",
      "Phục hồi: Từ tháng 10-12 churn giảm - Các biện pháp giữ chân khách hàng có tác dụng",
      "Hiện tại: 19% - Vẫn cao hơn mục tiêu, cần tiếp tục cải thiện"
    ],
    solutions: [
      "Tìm hiểu nguyên nhân spike ở tháng 9 - Khảo sát khách hàng rời bỏ",
      "Liên hệ khách hàng đã churn để nhận phản hồi và cải thiện dịch vụ",
      "Duy trì các biện pháp giữ chân khách hàng từ tháng 10"
    ]
  },
  deposit: {
    title: "Tổng Tiền Gửi Khách Hàng",
    explanation: "Tiền gửi trung bình của khách hàng tăng từ 120 tỷ (T1) lên 190 tỷ (T12). Điều này cho thấy khách hàng có niềm tin và gửi nhiều tiền hơn. Tuy nhiên, churn lại tăng nên cần kết hợp các chiến lược.",
    keyPoints: [
      "Xu hướng: Tăng liên tục (+58% YoY) - Khách hàng tin tưởng gửi tiền",
      "Đỉnh cao: Tháng 12 với 190 tỷ - Có thể do tiền thưởng mùa lễ",
      "Ổn định: Không biến động lớn - Dễ dự đoán và quản lý"
    ],
    solutions: [
      "Tạo sản phẩm tiết kiệm với lãi suất cao để kích thích gửi tiền",
      "Chương trình khuyến mãi mùa lễ (tháng 12-1) để duy trì mức gửi cao",
      "Cảnh báo: Tiền gửi tăng nhưng churn cũng tăng - Cần tìm giải pháp"
    ]
  },
  products: {
    title: "Tỷ Lệ Sử Dụng Sản Phẩm",
    explanation: "Tỷ lệ khách hàng sử dụng nhiều sản phẩm tăng từ 60% lên 108%. Số liệu trên 100% cho thấy khách hàng sử dụng đa dạng sản phẩm. Đây là tín hiệu tích cực nhưng churn vẫn cao.",
    keyPoints: [
      "Xu hướng: Tăng 80% - Khách hàng sử dụng đa dạng sản phẩm hơn",
      "Tác động: Đa dạng hóa sản phẩm tạo sự gắn bó cao hơn với ngân hàng",
      "Mâu thuẫn: Sản phẩm tăng nhưng churn cũng tăng - Có vấn đề khác"
    ],
    solutions: [
      "Tạo gói combo khi khách hàng mua 2+ sản phẩm (giảm giá 10-15%)",
      "Hướng dẫn khách hàng cách sử dụng đầy đủ các sản phẩm",
      "Phân tích: Sản phẩm nào có churn cao nhất để cải thiện"
    ]
  },
  complaints: {
    title: "Số Lượng Khiếu Nại",
    explanation: "Số lượng khiếu nại biến động từ 18-35 cases/tháng. Spike ở tháng 8 (35 cases) trùng với spike churn ở tháng 9. Điều này cho thấy khiếu nại → r��i bỏ.",
    keyPoints: [
      "Đỉnh cao: Tháng 8 (35 cases) → Tháng 9 churn spike (25%) - Liên hệ rõ",
      "Gần đây: Tháng 11-12 giảm xuống 22-24 - Tình hình đang cải thiện",
      "Tương quan: Khiếu nại nhiều → churn cao - Cần ưu tiên xử lý"
    ],
    solutions: [
      "Thiết lập SLA: Giải quyết khiếu nại trong 24h",
      "Team customer success liên hệ khách hàng có khiếu nại",
      "Phân tích nguyên nhân: Tháng 8 xảy ra sự cố gì?"
    ]
  },
  appUsage: {
    title: "Lượt Sử Dụng Ứng Dụng",
    explanation: "Lượt sử dụng app tăng từ 490 lên 900 (+84%). Nhưng churn vẫn cao - ứng dụng tốt nhưng sản phẩm/dịch vụ không thỏa mãn nhu cầu khách hàng.",
    keyPoints: [
      "Xu hướng: Tăng 84% - Ứng dụng ngày càng được sử dụng",
      "Mâu thuẫn: App usage tăng nhưng churn cũng tăng - Lạ thường",
      "Sâu sắc: UX tốt nhưng sản phẩm/dịch vụ còn vấn đề"
    ],
    solutions: [
      "A/B test: Tính năng nào được sử dụng nhiều nhất?",
      "Gamification: Thêm phần thưởng/điểm khi sử dụng app",
      "Push notification: Gợi ý tính năng dựa trên hành vi người dùng"
    ]
  },
  transaction: {
    title: "Tần Suất Giao Dịch",
    explanation: "Tần suất giao dịch tăng từ 150 lên 300 (+100%). Khách hàng ngày càng sử dụng tính năng giao dịch nhiều hơn. Đây là tín hiệu tích cực về engagement.",
    keyPoints: [
      "Xu hướng: Tăng 100% - Gấp đôi số lượng giao dịch",
      "Ổn định: Tăng liên tục & không biến động - Dễ dự báo",
      "Tích cực: Tần suất giao dịch cao = khách hàng hoạt động"
    ],
    solutions: [
      "Cashback/phần thưởng cho mỗi giao dịch (0.5-1%)",
      "Milestone rewards: Thưởng khi đạt 100, 500, 1000 giao dịch",
      "Bảo mật: Tăng cường bảo mật (2FA, mã hóa) để xây dựng tin tưởng"
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

        <div className="explanation-wrapper">
          <div className="explanation-box">
            <h3>Giải Thích</h3>
            <p className="explanation-text">{info.explanation}</p>

            <h4 className="section-subtitle">Key Points:</h4>
            <ul className="key-points-list">
              {info.keyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>

            <h4 className="section-subtitle">Proposed Solution:</h4>
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
      <span className="kpi-icon"></span>
      <div>
        <p>Tổng Khách Hàng</p>
        <strong>{data.customers.toLocaleString()}</strong>
      </div>
    </div>
    <div className="kpi-item">
      <span className="kpi-icon"></span>
      <div>
        <p>Monthly Turnover Rate</p>
        <strong style={{color: '#ff7200'}}>{data.churn[11]}%</strong>
      </div>
    </div>
    <div className="kpi-item">
      <span className="kpi-icon"></span>
      <div>
        <p>Ending Deposit</p>
        <strong>{data.deposit[11]} Tỷ</strong>
      </div>
    </div>
    <div className="kpi-item">
      <span className="kpi-icon"></span>
      <div>
        <p>Products Used</p>
        <strong>{data.productUsage[11]}%</strong>
      </div>
    </div>
    <div className="kpi-item">
      <span className="kpi-icon"></span>
      <div>
        <p>App Usage</p>
        <strong>{data.appUsage[11]}</strong>
      </div>
    </div>
    <div className="kpi-item">
      <span className="kpi-icon"></span>
      <div>
        <p>Number of Transactions</p>
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
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Load Ionicons script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/ionicons@5.4.0/dist/ionicons.js';
    script.async = true;
    script.noModule = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  
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
      setError("Please enter the customer's name or ID.");
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
      setError("Search error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError("Please enter your email and password.");
      return;
    }
    setError("Demo mode - Login not available");
    setTimeout(() => setError(null), 3000);
  };

  const handleNavClick = (section) => {
    switch(section) {
      case 'service':
        document.querySelector('.kpi-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'design':
        document.querySelector('.chart-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
      default:
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const data = viewCustomer ? customerData : bankData;
  const analysis = analyzeData(data);

  return (
    <div className="main">
      {/* ===== NAVBAR ===== */}
      <nav className="navbar">
        <div className="icon">
          <h2 className="logo"> CUSTOMER DATA ANALYSIS</h2>
        </div>

        <div className="menu">
          <ul>
            <li><a onClick={() => handleNavClick('home')}>HOME</a></li>
            <li><a onClick={() => handleNavClick('about')}>ABOUT</a></li>
            <li><a onClick={() => handleNavClick('service')}>SERVICE</a></li>
            <li><a onClick={() => handleNavClick('design')}>ANALYSIS</a></li>
            <li><a onClick={() => handleNavClick('contact')}>CONTACT</a></li>
          </ul>
        </div>

        <div className="search">
          <input 
            className="srch" 
            type="search" 
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn" onClick={() => setSearchInput(searchQuery)}>Search</button>
        </div>
      </nav>
      

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ===== HERO SECTION (CONTENT) ===== */}
      <section className="content">
        <div className="hero-text">
          <h1>Churn Analysis <br/><span>Customer</span> <br/>Specialist</h1>

          <p className="par">
            Explore detailed data about customer churn rates, 
            predict churn trends, and receive specific solutions 
            to retain customers. A comprehensive analysis tool for 
            your business strategy.
          </p>

          <button className="cn" onClick={() => document.querySelector('.kpi-section')?.scrollIntoView({ behavior: 'smooth' })}>
            DISCOVER NOW
          </button>
        </div>

        {/* ===== LOGIN FORM ===== */}
        <div className="form">
          <h2>Log in here</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="Enter Your Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Enter Your Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            <button className="btn" type="submit">Log in</button>
          </form>

          <p className="link">
            No account yet.<br/>
            <a href="#">Register here</a>
          </p>

          <p className="liw">Log in with</p>

          <div className="icons">
            <a href="#" title="Facebook"><ion-icon name="logo-facebook"></ion-icon></a>
            <a href="#" title="Instagram"><ion-icon name="logo-instagram"></ion-icon></a>
            <a href="#" title="Twitter"><ion-icon name="logo-twitter"></ion-icon></a>
            <a href="#" title="Google"><ion-icon name="logo-google"></ion-icon></a>
            <a href="#" title="Skype"><ion-icon name="logo-skype"></ion-icon></a>
          </div>
        </div>
      </section>

      {/* ===== KPI SECTION ===== */}
      <section className="kpi-section">
        <div className="kpi-header">
          <h2>{viewCustomer ? `${data.name}` : 'Bank Overview'}</h2>
          <p className="kpi-subtitle">Monthly Data </p>
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${!viewCustomer ? 'active' : ''}`}
              onClick={() => setViewCustomer(false)}
            >
              Bank
            </button>
            <button 
              className={`mode-btn ${viewCustomer ? 'active' : ''}`}
              onClick={() => setViewCustomer(true)}
            >
              Customer
            </button>
          </div>
        </div>
        <KPIDisplay data={data} />
      </section>

      {/* ===== SEARCH SECTION ===== */}
      <section className="search-analytics">
        <div className="search-container">
          <h3>Customer Acquisition</h3>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Enter customer ID or name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      </section>

      {/* ===== CHART SECTIONS ===== */}
      <ChartSection 
        chartKey="churn" 
        data={data.churn} 
        title="Chunk Rate" 
        color="#852D49"
        type="line"
      />

      <ChartSection 
        chartKey="deposit" 
        data={data.deposit} 
        title="Deposits" 
        color="#B8472F"
        type="line"
      />

      <ChartSection 
        chartKey="products" 
        data={data.productUsage} 
        title="Products" 
        color="#237098"
        type="line"
      />

      <ChartSection 
        chartKey="complaints" 
        data={data.complaints} 
        title="Complaints" 
        color="#852D49"
        type="bar"
      />

      <ChartSection 
        chartKey="appUsage" 
        data={data.appUsage} 
        title="Use the App" 
        color="#B8472F"
        type="line"
      />

      <ChartSection 
        chartKey="transaction" 
        data={data.transaction} 
        title="Transactions" 
        color="#237098"
        type="line"
      />

      {/* ===== SUMMARY SECTION ===== */}
      <section className="summary-section">
        <div className="summary-container">
          <h2>Summary of the Year</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <h4>Churn Trends</h4>
              <p>Từ <strong>{analysis.first3Months}%</strong> (3T first) → <strong>{analysis.last3Months}%</strong> (3T last)</p>
              <p style={{marginTop: '10px', color: analysis.yoyChange > 0 ? '#ff7200' : '#28a745'}}>
                {analysis.yoyChange > 0 ? 'Increase' : 'Decrease'} <strong>{Math.abs(analysis.yoyChange)}%</strong> compared to last year
              </p>
            </div>

            <div className="summary-card">
              <h4>Deposits</h4>
              <p>Month<strong>{analysis.depositChange > 0 ? '+' : ''}{analysis.depositChange}%</strong> compared to the previous month</p>
              <p style={{marginTop: '10px', fontSize: '12px', color: '#ccc'}}>
                From {defaultBankData.deposit[10]} billion → {defaultBankData.deposit[11]} billion
              </p>
            </div>

            <div className="summary-card">
              <h4>Churn Month</h4>
              <p style={{color: analysis.changePercent > 0 ? '#ff7200' : '#28a745'}}>
                <strong style={{fontSize: '24px'}}>{analysis.currentMonth}%</strong>
              </p>
              <p style={{marginTop: '10px', fontSize: '12px'}}>
                {analysis.changePercent > 0 ? 'Increase' : 'Decrease'} {Math.abs(analysis.changePercent)}% compared to the previous month
              </p>
            </div>

            <div className="summary-card">
              <h4>Churn Range</h4>
              <p>Lowest: <strong>{analysis.minChurn}%</strong> | Highest: <strong>{analysis.maxChurn}%</strong></p>
              <p style={{marginTop: '10px', color: '#ccc', fontSize: '12px'}}>
                Range: {analysis.maxChurn - analysis.minChurn}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <p>Customer Analytics Dashboard </p>
        <p style={{fontSize: '12px', marginTop: '10px'}}>© 2026 PraRoz Analytics. Bảo lưu toàn bộ quyền.</p>
      </footer>
    </div>
  );
}