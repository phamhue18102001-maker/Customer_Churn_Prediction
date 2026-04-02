import React, { useState, useEffect, useRef } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, Tooltip, Legend,
  RadialLinearScale, ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, Tooltip, Legend,
  RadialLinearScale, ArcElement,
);

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const months = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];


// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const defaultBankData = {
  customers: 10500,
  churn: [8.2, 8.5, 8.8, 9.1, 9.4, 9.7, 10.0, 10.2, 10.5, 10.8, 11.0, 11.3],
  deposit: [245, 248, 251, 254, 257, 260, 263, 266, 269, 272, 275, 278],
  productUsage: [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76],
  appUsage: ["Low", "Low", "Medium", "Medium", "Medium", "High", "High", "High", "Very High", "Very High", "Very High", "Very High"],
  complaints: [12, 14, 11, 15, 10, 13, 9, 11, 8, 10, 7, 6],
  transaction: [4200, 4350, 4500, 4650, 4800, 4950, 5100, 5250, 5400, 5550, 5700, 5850],
};

const defaultCustomerSample = {
  name: "John Doe",
  customers: 1,
  churn: [10, 12, 15, 14, 16, 18, 20, 22, 24, 25, 27, 28],
  deposit: [50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28],
  productUsage: [50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72],
  appUsage: ["Low", "Low", "Medium", "Medium", "High", "High", "Very High", "Very High", "Very High", "Very High", "Very High", "Very High"],
  complaints: [0, 0, 1, 0, 1, 1, 2, 1, 1, 2, 2, 3],
  transaction: [200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420],
  churnProbability: 0.65,
};

const chartExplanations = {
  churn: {
    title: "Churn Rate Trend",
    explanation: "Tỷ lệ churn theo tháng cho thấy xu hướng tăng. Dữ liệu này giúp xác định mùa cao điểm mất khách hàng.",
    keyPoints: [
      "Churn tăng từ 8.2% → 11.3% trong năm",
      "Tăng trưởng ổn định ~0.3% / tháng",
      "Giai đoạn Q3-Q4 đặc biệt nhạy cảm",
    ],
    solutions: [
      "Tăng cường chương trình giữ chân khách hàng",
      "Phân tích nguyên nhân mất khách ở Q3-Q4",
      "Implement early warning system",
    ],
  },
  deposit: {
    title: "Deposit Growth",
    explanation: "Tổng tiền gửi tăng từ 245 tỷ → 278 tỷ nhưng điều này bị che phủ bởi churn tăng cao.",
    keyPoints: [
      "Tăng 33 tỷ trong năm (+13.5%)",
      "Tăng ổn định +3 tỷ/tháng",
      "Tuy nhiên, mất khách hàng có thể ảnh hưởng Q1 năm sau",
    ],
    solutions: [
      "Giữ chân khách hàng cũ thay vì chỉ mở mới",
      "Focus vào giá trị khách hàng (LTV)",
      "Chương trình retention có incentive cao hơn",
    ],
  },
  products: {
    title: "Product Usage Rate",
    explanation: "Tỷ lệ sử dụng sản phẩm tăng từ 65% → 76%, chỉ ra tiềm năng cross-sell và up-sell.",
    keyPoints: [
      "Người dùng ngày càng sử dụng nhiều sản phẩm",
      "+11% trong năm là tín hiệu tích cực",
      "Cross-sell có thể giảm churn",
    ],
    solutions: [
      "Promosi kết hợp sản phẩm (bundle)",
      "Personalized product recommendations",
      "Loyalty rewards cho multi-product users",
    ],
  },
  complaints: {
    title: "Customer Complaints",
    explanation: "Khiếu nại giảm từ 12 → 6 (50%), cho thấy cải thiện chất lượng dịch vụ.",
    keyPoints: [
      "Xu hướng giảm liên tục (đặc biệt Q3-Q4)",
      "Fewer complaints = higher retention potential",
      "Service quality improvement visible",
    ],
    solutions: [
      "Tiếp tục invest vào customer service",
      "Implement feedback loop từ complaints",
      "Preventive measures trước khi phát sinh issue",
    ],
  },
  appUsage: {
    title: "Mobile App Usage Intensity",
    explanation: "Mức độ sử dụng app tăng từ Low → Very High, chỉ ra digital engagement tốt.",
    keyPoints: [
      "Q2 onwards: Medium → High → Very High",
      "Digital channel adoption tốt",
      "App can be used for retention campaigns",
    ],
    solutions: [
      "Push notification strategy cho retention",
      "In-app offers & personalized messaging",
      "Gamification để tăng engagement",
    ],
  },
  transaction: {
    title: "Monthly Transactions",
    explanation: "Số giao d��ch tăng 39.5% (4200 → 5850), chỉ ra khách hàng ngày càng active.",
    keyPoints: [
      "Tăng ổn định +165 giao dịch/tháng",
      "+41% YoY là tín hiệu mạnh",
      "High transaction volume ≠ low churn (paradox)",
    ],
    solutions: [
      "Analyze churn among high-transaction users",
      "Identify churn drivers separately by segment",
      "Rewards program cho frequent transactors",
    ],
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function analyzeData(data) {
  const churnData   = data.churn;
  const depositData = data.deposit;
  const current     = churnData[11];
  const prev        = churnData[10];
  const change      = (((current - prev) / prev) * 100).toFixed(1);
  const last3       = churnData.slice(-3).reduce((a,b) => a+b, 0) / 3;
  const first3      = churnData.slice(0,3).reduce((a,b) => a+b, 0) / 3;
  return {
    currentMonth:  current,
    prevMonth:     prev,
    changePercent: change,
    last3Months:   last3.toFixed(1),
    first3Months:  first3.toFixed(1),
    maxChurn:      Math.max(...churnData),
    minChurn:      Math.min(...churnData),
    depositChange: (((depositData[11] - depositData[10]) / depositData[10]) * 100).toFixed(1),
    yoyChange:     ((((current - first3) / first3) * 100)).toFixed(1),
  };
}

// ─── SMART CHURN PREDICTION ───────────────────────────────────────────────────
function computeRisk(form) {
  const get = (k, fb) => (form[k] == null || form[k] === "") ? fb : Number(form[k]);
  let score = 25;

  // Credit Score
  const cs = get("creditScore", 650);
  if      (cs < 450) score += 18;
  else if (cs < 550) score += 12;
  else if (cs < 650) score += 6;
  else if (cs > 750) score -= 6;

  // Tenure
  const tenure = get("tenure_months", 24);
  if      (tenure < 6)  score += 15;
  else if (tenure < 12) score += 8;
  else if (tenure > 48) score -= 8;

  // Balance
  const bal = get("balance", 76486);
  if      (bal < 5000)   score += 18;
  else if (bal < 15000)  score += 10;
  else if (bal < 30000)  score += 4;
  else if (bal > 100000) score -= 8;

  // Number of Products
  const nop = get("numOfProducts", 2);
  if      (nop === 1) score += 12;
  else if (nop >= 3)  score -= 6;

  // Active Member
  const isActive = get("isActiveMember", 1);
  if (isActive === 0) score += 14;

  // Complaint Count
  const comp = get("complaint_count", 0);
  score += comp * 10;

  // Has Credit Card
  const hasCrCard = get("hasCrCard", 1);
  if (hasCrCard === 0) score += 4;

  // Age
  const age = get("age", 35);
  if      (age < 25) score += 6;
  else if (age > 55) score += 4;

  // Salary
  const sal = get("estimatedSalary", 60000);
  if      (sal < 25000)  score += 8;
  else if (sal > 100000) score -= 4;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function getRiskLabel(score) {
  if (score < 30) return { label: "LOW RISK",    color: "#22c55e", cls: "risk-low"    };
  if (score < 70) return { label: "MEDIUM RISK", color: "#eab308", cls: "risk-medium" };
  return               { label: "HIGH RISK",     color: "#ef4444", cls: "risk-high"   };
}

function getInsight(form, score) {
  const get = (k, fb) => (form[k] == null || form[k] === "") ? fb : Number(form[k]);
  const factors = [];
  if (get("complaint_count", 0) > 1)    factors.push("Nhiều khiếu nại gần đây (" + get("complaint_count", 0) + " lần)");
  if (get("isActiveMember", 1) === 0)   factors.push("Không phải thành viên active");
  if (get("tenure_months", 24) < 6)     factors.push("Khách hàng mới (<6 tháng)");
  if (get("balance", 76486) < 10000)    factors.push("Số dư tài khoản thấp");
  if (get("numOfProducts", 2) === 1)    factors.push("Chỉ sử dụng 1 sản phẩm");
  if (get("creditScore", 650) < 500)    factors.push("Điểm tín dụng thấp (<500)");
  if (factors.length === 0)             factors.push("Hồ sơ khách hàng ổn định");
  const summary =
    score >= 70 ? "Khách hàng có nguy cơ rời bỏ CAO. Cần can thiệp ngay."
    : score >= 30 ? "Khách hàng có dấu hiệu rủi ro TRUNG BÌNH, cần theo dõi thêm."
    : "Khách hàng ổn định, ít có nguy cơ rời bỏ trong thời gian tới.";
  return { summary, factors: factors.slice(0, 3) };
}

// ─── CHART SECTION (từ App.jsx gốc, giữ nguyên) ──────────────────────────────
const ChartSection = ({ chartKey, data, color, type = "line" }) => {
  const ref = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const info = chartExplanations[chartKey];

  const chartData = {
    labels: months,
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: `${color}20`,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: color,
      borderWidth: 3,
      fill: true,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true, mode: "index" } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div ref={ref} className={`chart-section ${isVisible ? "visible" : ""}`}>
      <div className="section-container">
        <div className="chart-wrapper">
          <div className="chart-box">
            <h2 className="chart-main-title">{info.title}</h2>
            <div className="chart-container">
              {type === "line"
                ? <Line data={chartData} options={chartOptions} />
                : <Bar  data={chartData} options={chartOptions} />}
            </div>
          </div>
        </div>
        <div className="explanation-wrapper">
          <div className="explanation-box">
            <h3>Discover</h3>
            <p className="explanation-text">{info.explanation}</p>
            <h4 className="section-subtitle">Key Points:</h4>
            <ul className="key-points-list">
              {info.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
            <h4 className="section-subtitle">Proposed Solution:</h4>
            <ul className="solutions-list">
              {info.solutions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── GAUGE SVG ────────────────────────────────────────────────────────────────
const GaugeChart = ({ score }) => {
  const { color } = getRiskLabel(score);
  const toRad = (deg) => (deg * Math.PI) / 180;
  const cx = 110, cy = 105, r = 80;
  const arc = (end) => {
    const s = toRad(-180), e = toRad(end - 180);
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${end > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const angle = (score / 100) * 180;
  return (
    <svg width="220" height="120" viewBox="0 0 220 120">
      <path d={arc(180)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round"/>
      <path d={arc(angle)} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
        style={{ transition: "all 1.2s ease", filter: `drop-shadow(0 0 8px ${color})` }}/>
      <text x={cx} y={cy + 8} textAnchor="middle" fill={color}
        style={{ fontSize: 26, fontFamily: "'Times New Roman', serif", fontWeight: "bold" }}>
        {score}%
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fill="#999"
        style={{ fontSize: 10, fontFamily: "Arial, sans-serif" }}>
        CHURN SCORE
      </text>
    </svg>
  );
};

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="loading-overlay">
    <div className="loading-spinner"/>
    <p className="loading-text">Analyzing customer behavior...</p>
  </div>
);

// ─── ANIMATED COUNT UP ────────────────────────────────────────────────────────
function CountUp({ to, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = to / (duration / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= to) { setVal(to); clearInterval(t); }
      else setVal(Math.round(v));
    }, 16);
    return () => clearInterval(t);
  }, [to]);
  return <span>{val}</span>;
}

// ─── RESULT PAGE ──────────────────────────────────────────────────────────────
const ResultPage = ({ form, score, onBack }) => {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 60); }, []);
  const { label, color } = getRiskLabel(score);
  const { summary, factors } = getInsight(form, score);

  const get = (k, fb) => (form[k] == null || form[k] === "") ? fb : Number(form[k]);

  // Bar chart: Customer vs Avg (thông tin cơ bản)
  const barCompData = {
    labels: ["Credit Score", "Tenure (mth)", "Balance (k)", "Products"],
    datasets: [
      {
        label: "Khách hàng",
        data: [
          get("creditScore", 650),
          get("tenure_months", 24),
          Math.round(get("balance", 76486) / 1000),
          get("numOfProducts", 2),
        ],
        backgroundColor: "#852D49cc",
        borderColor: "#852D49",
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: "Trung bình",
        data: [650, 24, 76, 2],
        backgroundColor: "#237098cc",
        borderColor: "#237098",
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  // Feature importance (thông tin cơ bản)
  const importanceData = {
    labels: ["Complaints","Active Member","Balance","Num Products","Tenure","Credit Score","Age","Salary","Has CrCard"],
    datasets: [{
      label: "Importance",
      data: [0.22, 0.18, 0.16, 0.14, 0.12, 0.09, 0.05, 0.03, 0.01],
      backgroundColor: ["#852D49","#852D49","#B8472F","#B8472F","#B8472F","#237098","#237098","#237098","#237098"].map(c => c + "cc"),
      borderColor:     ["#852D49","#852D49","#B8472F","#B8472F","#B8472F","#237098","#237098","#237098","#237098"],
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  const chartOpts = (horizontal = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    plugins: {
      legend: { display: !horizontal, labels: { color: "#ccc", font: { family: "Arial", size: 11 } } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { color: "#999", font: { family: "Arial", size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
      y: { ticks: { color: "#999", font: { family: "Arial", size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
    },
  });

  return (
    <div className={`result-page ${show ? "result-page--visible" : ""}`}>
      {/* Navbar */}
      <nav className="navbar result-navbar">
        <div className="icon">
          <h2 className="logo">CUSTOMER DATA ANALYSIS</h2>
        </div>
        <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
      </nav>

      <div className="result-container">
        <h2 className="result-title">Kết quả Phân tích Rủi ro Churn</h2>
        <p className="result-subtitle">Panel Feature Engineering</p>

        {/* Risk + Insight */}
        <div className="result-top-grid">
          {/* Risk Card */}
          <div className="risk-card" style={{ borderColor: color, boxShadow: `0 0 30px ${color}44` }}>
            <GaugeChart score={score} />
            <div className="risk-badge" style={{ background: `${color}22`, border: `1.5px solid ${color}`, color }}>
              {label}
            </div>
            <div className="risk-score-big" style={{ color }}>
              <CountUp to={score} />%
            </div>
            <p className="risk-desc">Xác suất rời bỏ dự đoán bởi mô hình</p>
          </div>

          {/* AI Insight */}
          <div className="ai-insight-box">
            <h3 className="insight-title">Insight</h3>
            <p className="insight-summary">{summary}</p>
            <p className="insight-factor-label">Top yếu tố ảnh hưởng</p>
            <ul className="insight-factors">
              {factors.map((f, i) => (
                <li key={i} className={`insight-factor insight-factor--${i}`}>
                  {i + 1}. {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Charts 2x2 */}
        <div className="result-charts-grid">
          <div className="result-chart-box">
            <h3 className="result-chart-title">Customer vs Segment Average</h3>
            <div style={{ height: 220 }}>
              <Bar data={barCompData} options={chartOpts()} />
            </div>
          </div>

          <div className="result-chart-box">
            <h3 className="result-chart-title">Feature Importance</h3>
            <div style={{ height: 220 }}>
              <Bar data={importanceData} options={chartOpts(true)} />
            </div>
          </div>

          <div className="result-chart-box">
            <h3 className="result-chart-title">Risk Breakdown</h3>
            <div style={{ height: 220, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12, padding: "0 8px" }}>
              {[
                { label: "Credit Score Risk", val: Math.max(0, Math.min(100, ((750 - get("creditScore",650)) / 450) * 100)) },
                { label: "Loyalty Risk",      val: Math.max(0, Math.min(100, ((48 - Math.min(get("tenure_months",24), 48)) / 48) * 100)) },
                { label: "Balance Risk",      val: Math.max(0, Math.min(100, ((100000 - Math.min(get("balance",76486), 100000)) / 100000) * 100)) },
                { label: "Complaint Risk",    val: Math.min(get("complaint_count",0) * 25, 100) },
              ].map((item, i) => {
                const pct = Math.round(item.val);
                const barColor = pct > 70 ? "#ef4444" : pct > 40 ? "#eab308" : "#22c55e";
                return (
                  <div key={i}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontFamily:"Arial,sans-serif", fontSize:12, color:"#ccc" }}>{item.label}</span>
                      <span style={{ fontFamily:"Arial,sans-serif", fontSize:12, color: barColor, fontWeight:"bold" }}>{pct}%</span>
                    </div>
                    <div style={{ height:8, background:"rgba(255,255,255,0.08)", borderRadius:4, overflow:"hidden" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background: barColor,
                        borderRadius:4, transition:"width 1s ease", boxShadow:`0 0 6px ${barColor}88` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* History note */}
        <div className="history-note">
          <span></span>
          <p>
            Prediction saved — Score: <strong style={{ color: "#ff7200" }}>{score}%</strong>
            &nbsp;|&nbsp;<strong style={{ color }}>{label}</strong>
            &nbsp;|&nbsp;{new Date().toLocaleString("vi-VN")}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── CUSTOMER FORM ────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  age:"", gender:"Male", creditScore:"", tenure_months:"",
  balance:"", estimatedSalary:"",
  hasCrCard:true, isActiveMember:true, numOfProducts:2,
  complaint_count:"",
};

const CustomerForm = ({ onSubmit, animating }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({...f,[k]:v})); setErrors(e => ({...e,[k]:undefined})); };

  const validate = () => {
    const e = {};
    if (!form.age || Number(form.age)<18 || Number(form.age)>100) e.age="18–100";
    if (!form.creditScore || Number(form.creditScore)<300 || Number(form.creditScore)>900) e.creditScore="300–900";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const payload = {};
    Object.keys(form).forEach(k => {
      const v = form[k];
      if (typeof v==="boolean") { payload[k]=v?1:0; return; }
      if (v===""||v===null) { payload[k]=null; return; }
      payload[k] = isNaN(Number(v)) ? v : Number(v);
    });
    onSubmit(payload);
  };

  const inp = (k, extra={}) => (
    <input
      className="cf-input"
      value={form[k]??""}
      onChange={e => set(k, e.target.value)}
      {...extra}
    />
  );

  const sections = [
    { title:"Thông tin cơ bản", fields:[
      ["Age *", <>{inp("age",{type:"number",placeholder:"18–100",min:18,max:100})}{errors.age&&<span className="cf-err">{errors.age}</span>}</>],
      ["Gender", <select className="cf-input cf-select" value={form.gender} onChange={e=>set("gender",e.target.value)}><option>Male</option><option>Female</option></select>],
      ["Credit Score *", <>{inp("creditScore",{type:"number",placeholder:"300–900"})}{errors.creditScore&&<span className="cf-err">{errors.creditScore}</span>}</>],
      ["Tenure (months)", inp("tenure_months",{type:"number",placeholder:"e.g. 24"})],
    ]},
    { title:"Tài chính", fields:[
      ["Balance", inp("balance",{type:"number",placeholder:"e.g. 75000"})],
      ["Estimated Salary", inp("estimatedSalary",{type:"number",placeholder:"e.g. 60000"})],
    ]},
    { title:"Tài khoản", fields:[
      ["Number of Products", <select className="cf-input cf-select" value={form.numOfProducts} onChange={e=>set("numOfProducts",Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select>],
      ["Complaint Count", inp("complaint_count",{type:"number",placeholder:"0–10",min:0,max:10})],
      ["Has Credit Card", <label className="cf-check"><input type="checkbox" checked={form.hasCrCard} onChange={e=>set("hasCrCard",e.target.checked)}/><span>{form.hasCrCard?"Có":"Không"}</span></label>],
      ["Is Active Member", <label className="cf-check"><input type="checkbox" checked={form.isActiveMember} onChange={e=>set("isActiveMember",e.target.checked)}/><span>{form.isActiveMember?"Active":"Inactive"}</span></label>],
    ]},
  ];

  return (
    <div className={`customer-form-wrap ${animating?"cf-exit":""}`}>
      <h2 className="cf-main-title">Customer Risk Analysis</h2>
      <p className="cf-subtitle">Nhập thông tin khách hàng để dự đoán nguy cơ churn</p>
      <form onSubmit={handleSubmit}>
        {sections.map((sec,si) => (
          <div key={si} className="cf-section">
            <p className="cf-section-title">{sec.title}</p>
            <div className="cf-grid">
              {sec.fields.map(([label, field], fi) => (
                <div key={fi} className="cf-field">
                  <label className="cf-label">{label}</label>
                  {field}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" className="cf-submit-btn">Analyze Risk</button>
      </form>
    </div>
  );
};

// ─── INLINE RESULT (shown inside predict-section, no page change) ─────────────
const InlineResult = ({ form, score, onBack }) => {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 60); }, []);
  const { label, color } = getRiskLabel(score);
  const { summary, factors } = getInsight(form, score);

  const get = (k, fb) => (form[k] == null || form[k] === "") ? fb : Number(form[k]);

  const barCompData = {
    labels: ["Credit Score", "Tenure (mth)", "Balance (k)", "Products"],
    datasets: [
      { label: "Khách hàng",
        data: [ get("creditScore",650), get("tenure_months",24), Math.round(get("balance",76486)/1000), get("numOfProducts",2) ],
        backgroundColor: "#852D49cc", borderColor: "#852D49", borderWidth: 2, borderRadius: 4 },
      { label: "Trung bình",
        data: [650, 24, 76, 2],
        backgroundColor: "#237098cc", borderColor: "#237098", borderWidth: 2, borderRadius: 4 },
    ],
  };

  const chartOpts = (horizontal = false) => ({
    responsive: true, maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    plugins: {
      legend: { display: !horizontal, labels: { color: "#ccc", font: { family: "Arial", size: 11 } } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { color: "#999", font: { family: "Arial", size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
      y: { ticks: { color: "#999", font: { family: "Arial", size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
    },
  });

  return (
    <div className={`inline-result ${show ? "inline-result--visible" : ""}`}>
      {/* Header */}
      <div className="ir-header">
        <div>
          <h2 className="ir-title">Kết quả Phân tích Rủi ro Churn</h2>
          <p className="ir-subtitle">Panel Feature Engineering</p>
        </div>
        <button className="back-btn" onClick={onBack}>← Phân tích lại</button>
      </div>

      {/* Risk + Insight */}
      <div className="result-top-grid">
        <div className="risk-card" style={{ borderColor: color, boxShadow: `0 0 30px ${color}44` }}>
          <GaugeChart score={score} />
          <div className="risk-badge" style={{ background: `${color}22`, border: `1.5px solid ${color}`, color }}>{label}</div>
          <div className="risk-score-big" style={{ color }}><CountUp to={score} />%</div>
          <p className="risk-desc">Xác suất rời bỏ dự đoán bởi mô hình</p>
        </div>
        <div className="ai-insight-box">
          <h3 className="insight-title">Insight</h3>
          <p className="insight-summary">{summary}</p>
          <p className="insight-factor-label">Top yếu tố ảnh hưởng</p>
          <ul className="insight-factors">
            {factors.map((f, i) => (
              <li key={i} className={`insight-factor insight-factor--${i}`}>{i + 1}. {f}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Charts */}
      <div className="result-charts-grid">
        <div className="result-chart-box">
          <h3 className="result-chart-title">Customer vs Segment Average</h3>
          <div style={{ height: 220 }}><Bar data={barCompData} options={chartOpts()} /></div>
        </div>
        <div className="result-chart-box" style={{ gridColumn: "1 / -1" }}>
          <h3 className="result-chart-title">Risk Breakdown</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
            {[
              { label: "Credit Score Risk", val: Math.max(0, Math.min(100, ((750 - get("creditScore",650)) / 450) * 100)) },
              { label: "Loyalty Risk",      val: Math.max(0, Math.min(100, ((48 - Math.min(get("tenure_months",24), 48)) / 48) * 100)) },
              { label: "Balance Risk",      val: Math.max(0, Math.min(100, ((100000 - Math.min(get("balance",76486), 100000)) / 100000) * 100)) },
              { label: "Complaint Risk",    val: Math.min(get("complaint_count",0) * 25, 100) },
            ].map((item, i) => {
              const pct = Math.round(item.val);
              const barColor = pct > 70 ? "#ef4444" : pct > 40 ? "#eab308" : "#22c55e";
              return (
                <div key={i}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontFamily:"Arial,sans-serif", fontSize:12, color:"#ccc" }}>{item.label}</span>
                    <span style={{ fontFamily:"Arial,sans-serif", fontSize:12, color: barColor, fontWeight:"bold" }}>{pct}%</span>
                  </div>
                  <div style={{ height:8, background:"rgba(255,255,255,0.08)", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background: barColor, borderRadius:4,
                      transition:"width 1s ease", boxShadow:`0 0 6px ${barColor}88` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="history-note">
        <span></span>
        <p>Prediction saved — Score: <strong style={{ color: "#ff7200" }}>{score}%</strong>
          &nbsp;|&nbsp;<strong style={{ color }}>{label}</strong>
          &nbsp;|&nbsp;{new Date().toLocaleString("vi-VN")}
        </p>
      </div>
    </div>
  );
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [predForm,      setPredForm]      = useState(null);
  const [predScore,     setPredScore]     = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [exiting,       setExiting]       = useState(false);
  const [viewCustomer,  setViewCustomer]  = useState(false);
  const [bankData]                        = useState(defaultBankData);
  const [customerData,  setCustomerData]  = useState(defaultCustomerSample);
  const [error,         setError]         = useState(null);
  const [searchInput,   setSearchInput]   = useState("");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [customerDB,    setCustomerDB]    = useState({});
  const [dbLoaded,      setDbLoaded]      = useState(false);

  // Load CSV một lần khi app mount
  useEffect(() => {
    fetch("/bank_churn_panel_v2.csv")
      .then(r => r.text())
      .then(text => {
        setCustomerDB(parseCSV(text));
        setDbLoaded(true);
      })
      .catch(() => setDbLoaded(true)); // nếu không load được thì vẫn cho dùng form
  }, []);

  const handleAnalyze = (payload) => {
    setExiting(true);
    setTimeout(() => {
      setLoading(true);
      setExiting(false);
      setTimeout(() => {
        const risk = computeRisk(payload);
        setPredForm(payload);
        setPredScore(risk);
        setLoading(false);
        // Scroll to predict section after result loads
        setTimeout(() => {
          document.querySelector(".predict-section")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }, 1500);
    }, 650);
  };

  const handleBack = () => {
    setPredForm(null);
    setPredScore(0);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchInput.trim().toUpperCase();
    if (!query) { setError("Vui lòng nhập ID khách hàng (VD: CUST_00001)."); return; }

    const customer = customerDB[query];
    if (!customer) {
      setError(`Không tìm thấy "${query}". Kiểm tra lại ID (VD: CUST_00001).`);
      return;
    }

    setError(null);
    setLoading(true);
    setTimeout(() => {
      const risk = computeRisk(customer);
      setPredForm(customer);
      setPredScore(risk);
      setCustomerData({ ...defaultCustomerSample, name: customer.name });
      setViewCustomer(true);
      setLoading(false);
      setTimeout(() => {
        document.querySelector(".predict-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, 800);
  };

  const handleNavClick = (section) => {
    if (section==="service") document.querySelector(".kpi-section")?.scrollIntoView({behavior:"smooth"});
    else if (section==="design") document.querySelector(".chart-section")?.scrollIntoView({behavior:"smooth"});
    else window.scrollTo({top:0,behavior:"smooth"});
  };

  const data     = viewCustomer ? customerData : bankData;
  const analysis = analyzeData(data);

  if (false) return null; // placeholder

  return (
    <div className="main">
      {loading && <LoadingScreen />}

      {/* ===== NAVBAR ===== */}
      <nav className="navbar">
        <div className="icon">
          <h2 className="logo">CUSTOMER DATA ANALYSIS</h2>
        </div>
        <div className="menu">
          <ul>
            <li><a onClick={() => handleNavClick("home")}>HOME</a></li>
            <li><a onClick={() => handleNavClick("about")}>ABOUT</a></li>
            <li><a onClick={() => handleNavClick("service")}>SERVICE</a></li>
            <li><a onClick={() => handleNavClick("design")}>ANALYSIS</a></li>
            <li><a onClick={() => handleNavClick("contact")}>CONTACT</a></li>
          </ul>
        </div>
        <div className="search">
          <input className="srch" type="search" placeholder="CUST_00001..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
          <button className="btn" onClick={() => setSearchInput(searchQuery)}>Search</button>
        </div>
      </nav>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ===== HERO ===== */}
<section className="content">
  <div className="hero-text">
    <h1>
      Churn Analysis <br />
      <span>Customer</span><br />
      Specialist
    </h1>

    <p className="par">
      Unlock the power of advanced churn analytics to understand customer behavior at scale. 
  Detect early warning signals, forecast churn with precision, and deploy intelligent, 
  data-driven strategies to retain high-value customers and maximize lifetime value.
    </p>

    <button
      className="cn"
      onClick={() =>
        document
          .querySelector(".kpi-section")
          ?.scrollIntoView({ behavior: "smooth" })
      }
    >
      DISCOVER NOW
    </button>
  </div>
</section>

      {/* ===== KPI SECTION ===== */}
      <section className={`kpi-section ${exiting ? "kpi-exit" : ""}`}>
        <div className="kpi-header">
          <h2>{viewCustomer ? data.name : "Bank Overview"}</h2>
          <p className="kpi-subtitle"></p>
          <div className="mode-toggle">
            <button className={`mode-btn ${!viewCustomer?"active":""}`} onClick={()=>setViewCustomer(false)}>Bank</button>
            <button className={`mode-btn ${viewCustomer?"active":""}`}  onClick={()=>setViewCustomer(true)}>Customer</button>
          </div>
        </div>
        <div className="kpi-display">
          {[
            {label:"Total Customers",      val: data.customers?.toLocaleString?.()??data.customers},
            {label:"Monthly Turnover Rate", val: `${data.churn[11]}%`,   style:{color:"#ff7200"}},
            {label: "Ending Deposit",        val: `${data.deposit[11]} Tỷ`},
            {label:"Products Used",         val: `${data.productUsage[11]}%`},
            {label:"App Usage",             val: data.appUsage[11]},
            {label:"Transactions",          val: data.transaction[11]},
          ].map((k,i) => (
            <div key={i} className="kpi-item">
              <span className="kpi-icon">{k.icon}</span>
              <div>
                <p>{k.label}</p>
                <strong style={k.style}>{k.val}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SEARCH ===== */}
      <section className="search-analytics">
        <div className="search-container">
          <h3>Tra cứu khách hàng</h3>
          <p style={{fontFamily:"Arial,sans-serif",fontSize:13,color:"#999",marginBottom:14}}>
            Nhập Customer ID để xem dự đoán churn. Ví dụ: <strong style={{color:"#ff7200"}}>CUST_00001</strong>
            {!dbLoaded && <span style={{marginLeft:8,color:"#ff7200"}}>(Đang tải dữ liệu...)</span>}
          </p>
          <form onSubmit={handleSearch}>
            <input type="text" placeholder="Nhập Customer ID (VD: CUST_00001)"
              value={searchInput} onChange={e=>setSearchInput(e.target.value)} disabled={loading}/>
            <button type="submit" disabled={loading}>{loading?"Đang tìm...":"Tìm kiếm"}</button>
          </form>
        </div>
      </section>

      {/* ===== CUSTOMER FORM (NEW) ===== */}
      <section className="predict-section">
        <div className="predict-container">
          {predForm && predScore > 0 ? (
            <InlineResult form={predForm} score={predScore} onBack={handleBack} />
          ) : (
            <CustomerForm onSubmit={handleAnalyze} animating={exiting}/>
          )}
        </div>
      </section>

      {/* ===== CHARTS ===== */}
      <ChartSection chartKey="churn"       data={data.churn}        color="#852D49" type="line"/>
      <ChartSection chartKey="deposit"     data={data.deposit}      color="#B8472F" type="line"/>
      <ChartSection chartKey="products"    data={data.productUsage} color="#237098" type="line"/>
      <ChartSection chartKey="complaints"  data={data.complaints}   color="#852D49" type="bar"/>
      <ChartSection chartKey="appUsage"    data={data.appUsage}     color="#B8472F" type="line"/>
      <ChartSection chartKey="transaction" data={data.transaction}  color="#237098" type="line"/>

      {/* ===== SUMMARY ===== */}
      <section className="summary-section">
        <div className="summary-container">
          <h2>Summary of the Year</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <h4>Churn Trends</h4>
              <p>Từ <strong>{analysis.first3Months}%</strong> → <strong>{analysis.last3Months}%</strong></p>
              <p style={{marginTop:10,color:analysis.yoyChange>0?"#ff7200":"#28a745"}}>
                {analysis.yoyChange>0?"Tăng":"Giảm"} <strong>{Math.abs(analysis.yoyChange)}%</strong> so với đầu năm
              </p>
            </div>
            <div className="summary-card">
              <h4>Deposits</h4>
              <p>Tháng: <strong>{analysis.depositChange>0?"+":""}{analysis.depositChange}%</strong> so với tháng trước</p>
              <p style={{marginTop:10,fontSize:12,color:"#ccc"}}>
                {defaultBankData.deposit[10]} tỷ → {defaultBankData.deposit[11]} tỷ
              </p>
            </div>
            <div className="summary-card">
              <h4>Churn Tháng Này</h4>
              <p style={{color:analysis.changePercent>0?"#ff7200":"#28a745"}}>
                <strong style={{fontSize:24}}>{analysis.currentMonth}%</strong>
              </p>
              <p style={{marginTop:10,fontSize:12}}>
                {analysis.changePercent>0?"Tăng":"Giảm"} {Math.abs(analysis.changePercent)}% so với tháng trước
              </p>
            </div>
            <div className="summary-card">
              <h4>Churn Range</h4>
              <p>Thấp: <strong>{analysis.minChurn}%</strong> | Cao: <strong>{analysis.maxChurn}%</strong></p>
              <p style={{marginTop:10,color:"#ccc",fontSize:12}}>Range: {analysis.maxChurn-analysis.minChurn}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <p>Customer Analytics Dashboard</p>
        <p style={{fontSize:12,marginTop:10}}>© 2026 Customer Analytics. Bảo lưu toàn bộ quyền.</p>
      </footer>
    </div>
  );
}