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

const API_URL = "http://127.0.0.1:8000";

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

// ✅ NEW: Hàm phân tích dữ liệu
function analyzeData(data, isCustomer) {
  const churnData = data.churn;
  const depositData = data.deposit;
  const transactionData = data.transaction;
  const appUsageData = data.appUsage;

  // Tính toán tháng này vs tháng trước
  const currentMonth = churnData[11];
  const prevMonth = churnData[10];
  const changePercent = ((currentMonth - prevMonth) / prevMonth * 100).toFixed(1);
  
  // Tính trung bình 3 tháng cuối
  const last3Months = churnData.slice(-3);
  const avg3Months = (last3Months.reduce((a,b) => a+b, 0) / 3).toFixed(1);
  
  // Tính trung bình 3 tháng đầu
  const first3Months = churnData.slice(0, 3);
  const avgFirst3 = (first3Months.reduce((a,b) => a+b, 0) / 3).toFixed(1);
  
  // Tính xu hướng
  const maxChurn = Math.max(...churnData);
  const minChurn = Math.min(...churnData);
  const trend = currentMonth > prevMonth ? "↑ Tăng" : "↓ Giảm";
  
  // Độ ổn định
  const variance = churnData.reduce((sum, val) => sum + Math.pow(val - avg3Months, 2), 0) / churnData.length;
  const stability = variance < 10 ? "Ổn định" : variance < 20 ? "Biến động trung bình" : "Biến động cao";

  // Tính toán deposit
  const depositChange = ((depositData[11] - depositData[10]) / depositData[10] * 100).toFixed(1);
  
  // Tính toán engagement
  const appEngagement = appUsageData.slice(-3).reduce((a,b) => a+b, 0) / 3;
  const appEngagementTrend = appUsageData[11] > appUsageData[0] ? "tăng" : "giảm";

  return {
    currentMonth,
    prevMonth,
    changePercent,
    trend,
    last3Months: avg3Months,
    first3Months: avgFirst3,
    maxChurn,
    minChurn,
    stability,
    depositChange,
    appEngagement: appEngagement.toFixed(1),
    appEngagementTrend,
    yoyChange: (((currentMonth - avgFirst3) / avgFirst3) * 100).toFixed(1)
  };
}

// ✅ NEW: Hàm tạo lời giải thích
function generateInsights(analysis, isCustomer) {
  const insights = [];

  // Insight 1: Churn so với tháng trước
  if (analysis.changePercent > 0) {
    insights.push({
      title: "⚠️ Churn tăng so với tháng trước",
      detail: `Churn ${analysis.changePercent}% so với tháng trước (${analysis.prevMonth}% → ${analysis.currentMonth}%). Đây là tín hiệu cảnh báo rằng tình hình khách hàng đang xấu đi.`,
      severity: "high"
    });
  } else {
    insights.push({
      title: "✅ Churn giảm so với tháng trước",
      detail: `Churn giảm ${Math.abs(analysis.changePercent)}% so với tháng trước (${analysis.prevMonth}% → ${analysis.currentMonth}%). Các biện pháp giữ chân khách hàng có hiệu quả.`,
      severity: "low"
    });
  }

  // Insight 2: So sánh 3 tháng
  const comparison = analysis.last3Months - analysis.first3Months;
  if (comparison > 2) {
    insights.push({
      title: "📈 Churn tăng trong năm",
      detail: `Trung bình 3 tháng cuối (${analysis.last3Months}%) cao hơn 3 tháng đầu (${analysis.first3Months}%) lên tới ${comparison.toFixed(1)} điểm. Xu hướng tăng churn là đáng lo ngại.`,
      severity: "high"
    });
  } else if (comparison < -2) {
    insights.push({
      title: "📉 Churn giảm trong năm",
      detail: `Trung bình 3 tháng cuối (${analysis.last3Months}%) thấp hơn 3 tháng đầu (${analysis.first3Months}%) tới ${Math.abs(comparison).toFixed(1)} điểm. Tình hình đang cải thiện.`,
      severity: "low"
    });
  } else {
    insights.push({
      title: "➡️ Churn ổn định trong năm",
      detail: `Churn duy trì ở mức tương đối ổn định: 3T đầu ${analysis.first3Months}% vs 3T cuối ${analysis.last3Months}%. Cần duy trì các chiến lược hiện tại.`,
      severity: "medium"
    });
  }

  // Insight 3: Volatility
  insights.push({
    title: `📊 Độ ổn định: ${analysis.stability}`,
    detail: `Churn dao động từ ${analysis.minChurn}% đến ${analysis.maxChurn}%. ${analysis.stability === 'Ổn định' ? 'Dữ liệu khá ổn định, dễ dự đoán.' : analysis.stability === 'Biến động trung bình' ? 'Có sự biến động nhất định, cần chú ý.' : 'Biến động rất cao, khó kiểm soát.'}`,
    severity: analysis.stability === 'Ổn định' ? 'low' : analysis.stability === 'Biến động trung bình' ? 'medium' : 'high'
  });

  // Insight 4: YoY Growth
  insights.push({
    title: "📅 Tăng trưởng so với năm ngoái",
    detail: `Churn hiện tại (${analysis.currentMonth}%) so với TB 3T đầu năm (${analysis.first3Months}%): ${analysis.yoyChange > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(analysis.yoyChange)}%.`,
    severity: analysis.yoyChange > 0 ? 'high' : 'low'
  });

  // Insight 5: Deposit
  if (analysis.depositChange > 0) {
    insights.push({
      title: "💰 Tiền gửi tăng",
      detail: `Tiền gửi tháng này tăng ${analysis.depositChange}% so với tháng trước. Tính mặt tài chính tích cực mặc dù churn cao.`,
      severity: "low"
    });
  } else {
    insights.push({
      title: "💸 Tiền gửi giảm",
      detail: `Tiền gửi tháng này giảm ${Math.abs(analysis.depositChange)}% so với tháng trước. Kết hợp với churn cao, đây là tín hiệu nguy hiểm.`,
      severity: "high"
    });
  }

  // Insight 6: Engagement
  insights.push({
    title: `📱 Mức độ sử dụng app ${analysis.appEngagementTrend}`,
    detail: `Trung bình 3 tháng cuối: ${analysis.appEngagement} lần/tháng. ${analysis.appEngagementTrend === 'tăng' ? 'Người dùng tích cực sử dụng ứng dụng.' : 'Người dùng ít sử dụng ứng dụng, c��n cải thiện UX.'}`,
    severity: analysis.appEngagementTrend === 'tăng' ? 'low' : 'medium'
  });

  return insights;
}

// ✅ NEW: Hàm tạo giải pháp
function generateSolutions(analysis, isCustomer) {
  const solutions = [];

  if (analysis.currentMonth > 20) {
    solutions.push({
      icon: "🎯",
      title: "Chương trình giữ chân khách hàng VIP",
      description: "Churn > 20% là mức cảnh báo. Hãy tạo chương trình khuyến mãi cho top 20% khách hàng có giá trị cao nhất.",
      priority: "URGENT",
      timeline: "1-2 tuần",
      expectedImpact: "Giảm churn 5-10%"
    });
  }

  if (analysis.changePercent > 10) {
    solutions.push({
      icon: "📞",
      title: "Liên hệ trực tiếp với khách hàng",
      description: "Churn tăng đột ngột. Tiến hành survey để hiểu nguyên nhân thực sự (giá cả, chất lượng dịch vụ, cạnh tranh, v.v.)",
      priority: "URGENT",
      timeline: "Ngay lập tức",
      expectedImpact: "Hiểu rõ nguyên nhân → điều chỉnh chiến lược"
    });
  }

  if (analysis.depositChange < -5) {
    solutions.push({
      icon: "💳",
      title: "Khuyến mãi lãi suất cao",
      description: "Tiền gửi giảm mạnh. Tăng lãi suất hoặc khuyến mãi gửi tiền để kích thích khách hàng gửi thêm.",
      priority: "HIGH",
      timeline: "1 tuần",
      expectedImpact: "Tăng AUM 3-5%"
    });
  }

  if (analysis.appEngagement < 30) {
    solutions.push({
      icon: "📱",
      title: "Cải thiện trải nghiệm ứng dụng",
      description: "Mức sử dụng app thấp. Tối ưu hóa giao diện, tăng tốc độ, thêm tính năng mới để tăng engagement.",
      priority: "MEDIUM",
      timeline: "2-4 tuần",
      expectedImpact: "Tăng login 20-30%"
    });
  }

  if (analysis.stability.includes("cao")) {
    solutions.push({
      icon: "⚙️",
      title: "Ổn định chỉ tiêu kinh doanh",
      description: "Churn biến động cao. Xây dựng các chỉ tiêu KPI rõ ràng, đặt mục tiêu giảm độ biến động.",
      priority: "MEDIUM",
      timeline: "1-2 tuần",
      expectedImpact: "Giảm độ biến động 30%"
    });
  }

  if (analysis.yoyChange > 5) {
    solutions.push({
      icon: "🔄",
      title: "Rethink chiến lược sản phẩm",
      description: "Churn tăng so với năm ngoái. Xem xét có cần cập nhật sản phẩm, thay đổi định giá, hay mở rộng thị trường.",
      priority: "HIGH",
      timeline: "1 tháng",
      expectedImpact: "Tăng trưởng dài hạn 10-15%"
    });
  } else {
    solutions.push({
      icon: "✅",
      title: "Duy trì chiến lược hiện tại",
      description: "Churn ổn định hoặc giảm so với năm ngoái. Tiếp tục thực hiện các chiến lược hiện tại, tối ưu hóa thêm.",
      priority: "LOW",
      timeline: "Liên tục",
      expectedImpact: "Duy trì tăng trưởng 3-5% hàng tháng"
    });
  }

  // Thêm giải pháp chung
  solutions.push({
    icon: "👥",
    title: "Tăng cường tương tác khách hàng",
    description: "Xây dựng customer journey map, tạo touchpoint hiệu quả tại mỗi giai đoạn (onboarding, activation, retention).",
    priority: "MEDIUM",
    timeline: "2-3 tuần",
    expectedImpact: "Tăng retention rate 5-8%"
  });

  solutions.push({
    icon: "🎁",
    title: "Chương trình loyalty & referral",
    description: "Tạo điểm thưởng, cấp độ thành viên, hoặc khuyến khích khách hàng giới thiệu bạn bè.",
    priority: "MEDIUM",
    timeline: "3-4 tuần",
    expectedImpact: "Tăng customer lifetime value 15-20%"
  });

  return solutions;
}

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

// ✅ NEW: Insight Card Component
const InsightCard = ({ insight }) => (
  <div className={`insight-card insight-${insight.severity}`}>
    <h4>{insight.title}</h4>
    <p>{insight.detail}</p>
  </div>
);

// ✅ NEW: Solution Card Component
const SolutionCard = ({ solution }) => (
  <div className={`solution-card solution-${solution.priority.toLowerCase()}`}>
    <div className="solution-header">
      <span className="solution-icon">{solution.icon}</span>
      <div>
        <h4>{solution.title}</h4>
        <span className={`priority-badge priority-${solution.priority.toLowerCase()}`}>
          {solution.priority}
        </span>
      </div>
    </div>
    <p>{solution.description}</p>
    <div className="solution-footer">
      <span>⏱️ {solution.timeline}</span>
      <span>💡 {solution.expectedImpact}</span>
    </div>
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
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setHealthStatus(data);
      } catch (err) {
        console.error("Health check failed:", err);
        setHealthStatus({ 
          status: "offline", 
          error: err.message,
          database: "Disconnected"
        });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/applications?page=1&limit=100`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setHistoryData(data.data || []);
      } catch (err) {
        console.error("Error fetching history:", err);
        setHistoryData([defaultCustomerSample]);
      }
    };
    fetchHistory();
  }, []);

  const handlePredictCustomer = async (e) => {
    e.preventDefault();
    
    if (!searchInput.trim()) {
      setError("Vui lòng nhập tên hoặc ID khách hàng");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const customer = historyData.find(h => 
        h.id?.toString() === searchInput || 
        h.name?.toLowerCase().includes(searchInput.toLowerCase())
      );
      
      if (!customer) {
        setError(`Không tìm thấy khách hàng: ${searchInput}`);
        setLoading(false);
        return;
      }

      const predictPayload = customer.input_data || {
        age: 35,
        balance: 500,
        products: 2,
        is_active: 1,
        ...customer
      };

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(predictPayload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `HTTP ${res.status}`);
      }

      const result = await res.json();
      
      setCustomerData({
        ...defaultCustomerSample,
        name: customer.name || "Khách hàng",
        churnProbability: result.churn_probability || result.churn_score || 0.5,
        willChurn: result.will_churn || false,
        riskLevel: result.risk_level || "MEDIUM",
        recommendation: result.recommendation || "Tiếp tục theo dõi"
      });

      setViewCustomer(true);
      setSearchInput("");
    } catch (err) {
      console.error("Error predicting:", err);
      setError(`Lỗi dự đoán: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const data = viewCustomer ? customerData : bankData;
  const trend = getTrend(data.churn);
  const kpis = kpiConfigs(data, viewCustomer);
  const analysis = analyzeData(data, viewCustomer);
  const insights = generateInsights(analysis, viewCustomer);
  const solutions = generateSolutions(analysis, viewCustomer);

  return (
    <div className="app">

      {/* HEADER */}
      <div className="header">
        <span className="logo">🏦 FINTECH ANALYTICS</span>
        <div className="header-status">
          <span className={`status-badge ${healthStatus.status === 'healthy' ? 'online' : 'offline'}`}>
            {healthStatus.status === 'healthy' ? '🟢 Online' : '🔴 Offline'}
          </span>
          <span className="status-db" title={healthStatus.database || 'Unknown'}>
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={loading}
            />
            <datalist id="customer-list">
              {historyData.slice(0, 10).map((h, idx) => (
                <option key={idx} value={h.id || h.name} />
              ))}
            </datalist>
            <button type="submit" disabled={loading || !searchInput.trim()}>
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
              <div className={`risk-box risk-${data.riskLevel?.toLowerCase() || 'medium'}`}>
                <span>📊 Xác suất: {((data.churnProbability || 0) * 100).toFixed(1)}%</span>
                <span>⚠️ Mức rủi ro: {data.riskLevel || 'UNKNOWN'}</span>
                <p>💡 {data.recommendation || 'Không có khuyến nghị'}</p>
              </div>
            </div>
          )}

          {/* History Count */}
          <div className="side-divider">
            <h3>📊 Tổng quan</h3>
            <p style={{color: 'var(--text-secondary)', fontSize: '13px'}}>
              Tổng KH: <b style={{color: 'var(--primary-color)'}}>{historyData.length}</b>
            </p>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <h1 className="main-title">
            {viewCustomer ? `PHÂN TÍCH KHÁCH HÀNG: ${data.name}` : "PHÂN TÍCH NGÂN HÀNG"}
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

          {/* ✅ NEW: INSIGHTS SECTION */}
          <div className="section-divider">
            <h2>📊 Phân tích chi tiết</h2>
            <div className="insights-grid">
              {insights.map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))}
            </div>
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
                  pointRadius: 2.2,
                  borderWidth: 2.5
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
                  pointRadius: 2.2,
                  borderWidth: 2.5
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
                  pointRadius: 2.2,
                  borderWidth: 2.5
                }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
            <div className="chart-box">
              <div className="chart-title">Khiếu nại</div>
              <Bar height={90} data={{
                labels: months,
                datasets: [{ 
                  data: data.complaints, 
                  backgroundColor:"#5A68BA",
                  borderColor:"#5A68BA",
                  borderWidth: 1
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
                  pointRadius: 2.2,
                  borderWidth: 2.5
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
                  pointRadius: 2.2,
                  borderWidth: 2.5
                }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
          </div>

          {/* ✅ NEW: SOLUTIONS SECTION */}
          <div className="section-divider">
            <h2>💡 Giải pháp & Khuyến nghị</h2>
            <div className="solutions-grid">
              {solutions.map((solution, idx) => (
                <SolutionCard key={idx} solution={solution} />
              ))}
            </div>
          </div>

          {/* API Response Info */}
          <div className="api-info">
            <h4>📡 API Connections</h4>
            <p>Status: <strong>{healthStatus.status === 'healthy' ? '✅ Healthy' : '❌ ' + (healthStatus.status || 'Unknown')}</strong></p>
            <p>Model: {healthStatus.model || 'N/A'} | Database: {healthStatus.database || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}