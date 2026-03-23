import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Scene3D from "./Scene3D";
import "./App.css";

gsap.registerPlugin(ScrollToPlugin);

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
    explanation: "Churn Rate là tỷ lệ khách hàng rời bỏ dịch vụ hàng tháng.",
    keyPoints: [
      "Peak: Tháng 9 với 15.8% - Dấu hiệu có sự cố lớn",
      "Recovery: Từ tháng 10-12 churn giảm",
      "Current: 12.5% - Vẫn cao hơn baseline"
    ],
    solutions: [
      "🎯 Tìm hiểu nguyên nhân spike ở tháng 9",
      "📞 Liên hệ khách hàng đã rời bỏ",
      "💡 Duy trì các biện pháp giữ chân"
    ]
  },
  deposit: {
    title: "💰 Biểu đồ Tiền Gửi",
    explanation: "Tiền gửi trung bình của khách hàng tăng liên tục.",
    keyPoints: [
      "Trend: Tăng liên tục (+58% YoY)",
      "Peak: Tháng 12 với 190 tỷ",
      "Volatility: Ổn định"
    ],
    solutions: [
      "💎 Tạo sản phẩm tiết kiệm lãi suất cao",
      "🎁 Khuyến mãi tháng 12-1",
      "📊 Phân tích tiền gửi vs churn"
    ]
  }
};

function analyzeData(data) {
  const churnData = data.churn;
  const depositData = data.deposit;
  const appUsageData = data.appUsage;

  const currentMonth = churnData[11];
  const prevMonth = churnData[10];
  const changePercent = ((currentMonth - prevMonth) / prevMonth * 100).toFixed(1);
  
  const last3Months = churnData.slice(-3);
  const avg3Months = (last3Months.reduce((a,b) => a+b, 0) / 3).toFixed(1);
  
  const first3Months = churnData.slice(0, 3);
  const avgFirst3 = (first3Months.reduce((a,b) => a+b, 0) / 3).toFixed(1);
  
  const maxChurn = Math.max(...churnData);
  const minChurn = Math.min(...churnData);
  
  const depositChange = ((depositData[11] - depositData[10]) / depositData[10] * 100).toFixed(1);
  
  const appEngagement = appUsageData.slice(-3).reduce((a,b) => a+b, 0) / 3;

  return {
    currentMonth,
    prevMonth,
    changePercent,
    last3Months: avg3Months,
    first3Months: avgFirst3,
    maxChurn,
    minChurn,
    depositChange,
    appEngagement: appEngagement.toFixed(1),
    yoyChange: (((currentMonth - avgFirst3) / avgFirst3) * 100).toFixed(1)
  };
}

function generateInsights(analysis) {
  const insights = [];

  if (analysis.changePercent > 0) {
    insights.push({
      title: "⚠️ Churn tăng so với tháng trước",
      detail: `Churn ${analysis.changePercent}% so với tháng trước.`,
      severity: "high"
    });
  } else {
    insights.push({
      title: "✅ Churn giảm so với tháng trước",
      detail: `Churn giảm ${Math.abs(analysis.changePercent)}%.`,
      severity: "low"
    });
  }

  if (analysis.depositChange > 0) {
    insights.push({
      title: "💰 Tiền gửi tăng",
      detail: `Tiền gửi tháng này tăng ${analysis.depositChange}%.`,
      severity: "low"
    });
  }

  insights.push({
    title: "📊 Chỉ tiêu kinh doanh",
    detail: "Dữ liệu khá ổn định, dễ dự đoán.",
    severity: "medium"
  });

  return insights;
}

function generateSolutions(analysis) {
  const solutions = [];

  if (analysis.currentMonth > 20) {
    solutions.push({
      icon: "🎯",
      title: "Chương trình giữ chân khách hàng VIP",
      description: "Churn > 20% là mức cảnh báo. Hãy tạo chương trình khuyến mãi.",
      priority: "URGENT",
      timeline: "1-2 tuần",
      expectedImpact: "Giảm churn 5-10%"
    });
  }

  if (analysis.changePercent > 10) {
    solutions.push({
      icon: "📞",
      title: "Liên hệ trực tiếp với khách hàng",
      description: "Churn tăng đột ngột. Tiến hành survey.",
      priority: "URGENT",
      timeline: "Ngay lập tức",
      expectedImpact: "Hiểu rõ nguyên nhân"
    });
  }

  if (analysis.appEngagement < 30) {
    solutions.push({
      icon: "📱",
      title: "Cải thiện trải nghiệm ứng dụng",
      description: "Mức sử dụng app thấp. Tối ưu hóa giao diện.",
      priority: "MEDIUM",
      timeline: "2-4 tuần",
      expectedImpact: "Tăng login 20-30%"
    });
  }

  solutions.push({
    icon: "✅",
    title: "Duy trì chiến lược hiện tại",
    description: "Tiếp tục thực hiện các chiến lược hiện tại.",
    priority: "LOW",
    timeline: "Liên tục",
    expectedImpact: "Duy trì tăng trưởng 3-5%"
  });

  return solutions;
}

function getTrend(arr) {
  const last3 = arr.slice(-3).reduce((a,b)=>a+b,0);
  const prev3 = arr.slice(-6,-3).reduce((a,b)=>a+b,0);
  return {trend: last3 - prev3, last3, prev3};
}

export default function App() {
  const [viewCustomer, setViewCustomer] = useState(false);
  const [bankData, setBankData] = useState(defaultBankData);
  const [customerData, setCustomerData] = useState(defaultCustomerSample);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState({ status: "checking" });
  const [searchInput, setSearchInput] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);

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

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
      setScrollProgress(Math.min(progress, 1));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer.input_data || customer)
      });

      if (!res.ok) throw new Error("Prediction failed");

      const result = await res.json();
      
      setCustomerData({
        ...defaultCustomerSample,
        name: customer.name || "Khách hàng",
        churnProbability: result.churn_probability || 0.5,
        willChurn: result.will_churn || false,
        riskLevel: result.risk_level || "MEDIUM"
      });

      setViewCustomer(true);
      setSearchInput("");
    } catch (err) {
      setError(`Lỗi dự đoán: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const data = viewCustomer ? customerData : bankData;
  const analysis = analyzeData(data);
  const insights = generateInsights(analysis);
  const solutions = generateSolutions(analysis);
  const trend = getTrend(data.churn);
  const kpis = [
    { icon: viewCustomer?"🧑":"👥", label: viewCustomer?data.name:"Khách hàng", value: viewCustomer?"":data.customers.toLocaleString() },
    { icon: "⚠️", label: "Churn tháng này", value: data.churn[11]+"%" },
    { icon: "💰", label: "Tiền gửi cuối kỳ", value: data.deposit[11] },
    { icon: "📦", label: "SP sử dụng", value: data.productUsage[11] },
  ];

  return (
    <div className="app-3d">
      <header className="header-3d">
        <span className="logo">CUSTOMER CHURN</span>
        <div className="header-status">
          <span className={`status-badge ${healthStatus.status === 'healthy' ? 'online' : 'offline'}`}>
            {healthStatus.status === 'healthy' ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
        <span>
          <button className="header-btn" onClick={()=>setViewCustomer(false)}>Ngân hàng</button>
          <button className="header-btn" onClick={()=>setViewCustomer(true)}>Khách hàng</button>
        </span>
      </header>

      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 25], fov: 75 }}>
          <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={75} />
          <Scene3D 
            bankData={bankData}
            customerData={customerData}
            analysis={analysis}
            insights={insights}
            solutions={solutions}
            kpis={kpis}
            trend={trend}
            scrollProgress={scrollProgress}
            viewCustomer={viewCustomer}
          />
        </Canvas>
      </div>

      <div className="sidebar-3d">
        <h3>🔍 Tìm kiếm khách hàng</h3>
        <form onSubmit={handlePredictCustomer}>
          <input 
            placeholder="Tên/ID khách hàng..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !searchInput.trim()}>
            {loading ? "Đang tìm..." : "Tìm"}
          </button>
        </form>

        <div className="side-divider"/>
        
        <h3>⚡ So sánh Churn</h3>
        <div className="trend-box">
          <span>3T gần: <b>{trend.last3}</b></span>
          <span>3T trước: <b>{trend.prev3}</b></span>
          <span>Chênh: <b className={trend.trend<0 ? "good":"bad"}>
            {trend.trend>0?"+":""}{trend.trend}
          </b></span>
        </div>

        <div className="side-divider">
          <h3>📊 KPI Nhanh</h3>
          {kpis.map((k, i) => (
            <div key={i} className="kpi-mini">
              <span>{k.icon}</span>
              <div>
                <p>{k.label}</p>
                <strong>{k.value}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="scroll-hint">
        ⬇️ Cuộn để khám phá
      </div>
    </div>
  );
}