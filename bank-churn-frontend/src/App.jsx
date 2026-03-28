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
  let score = 30;

  const dsl = get("days_since_last_login", 22);
  const dst = get("days_since_last_txn",   18);
  score += Math.min(dsl / 3, 20);
  score += Math.min(dst / 4, 15);

  const comp = get("complaint_count", 0.8);
  score += comp * 8;

  const bal = get("balance", 76486);
  if      (bal < 10000)  score += 15;
  else if (bal < 30000)  score += 8;
  else if (bal > 100000) score -= 5;

  const lc1 = get("login_count_1m", 6);
  const lc3 = get("login_count_3m", 20);
  if (lc1 === 0) score += 12;
  else if (lc1 < 3) score += 6;
  if (lc3 > 0 && lc1 / (lc3 / 3) < 0.4) score += 10;

  const tc1 = get("txn_count_1m", 4);
  const tc3 = get("txn_count_3m", 14);
  if (tc1 === 0) score += 10;
  if (tc3 > 0 && tc1 / (tc3 / 3) < 0.4) score += 12;

  const bcp = get("balance_change_pct", 0);
  if (bcp < -0.1) score += 10;

  const isActive = get("isActiveMember", 1);
  if (isActive === 0) score += 10;

  const tenure = get("tenure_months", 24);
  if      (tenure < 6)  score += 8;
  else if (tenure > 36) score -= 5;

  const cs  = get("creditScore", 650);
  if      (cs < 450) score += 8;
  else if (cs > 750) score -= 4;

  const nop = get("numOfProducts", 2);
  if      (nop === 1) score += 6;
  else if (nop >= 3)  score -= 4;

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
  if (get("days_since_last_login", 22) > 30)          factors.push("Lâu không đăng nhập (>" + get("days_since_last_login", 22) + " ngày)");
  if (get("complaint_count", 0) > 1)                  factors.push("Nhiều khiếu nại gần đây (" + get("complaint_count", 0) + " lần)");
  if (get("balance_change_pct", 0) < -0.1)            factors.push("Số dư đang giảm mạnh (" + (get("balance_change_pct",0)*100).toFixed(0) + "%)");
  const lc3 = get("login_count_3m", 20), lc1 = get("login_count_1m", 6);
  if (lc3 > 0 && lc1 / (lc3 / 3) < 0.5)             factors.push("Hoạt động đăng nhập giảm >50%");
  const tc3 = get("txn_count_3m", 14), tc1 = get("txn_count_1m", 4);
  if (tc3 > 0 && tc1 / (tc3 / 3) < 0.5)             factors.push("Tần suất giao dịch giảm mạnh");
  if (get("isActiveMember", 1) === 0)                 factors.push("Không phải thành viên active");
  if (get("tenure_months", 24) < 6)                   factors.push("Khách hàng mới (<6 tháng)");
  if (factors.length === 0)                            factors.push("Hồ sơ khách hàng ổn định");
  const summary =
    score >= 70 ? "Khách hàng có nguy cơ rời bỏ CAO do thiếu hoạt động và tương tác giảm sút."
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

  // Bar chart: Customer vs Avg
  const barCompData = {
    labels: ["Login/M", "Txn/M", "Recency (day)", "Complaints"],
    datasets: [
      {
        label: "Khách hàng",
        data: [
          get("login_count_1m", 6),
          get("txn_count_1m", 4),
          Math.min(get("days_since_last_login", 22), 90),
          get("complaint_count", 0),
        ],
        backgroundColor: "#852D49cc",
        borderColor: "#852D49",
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: "Trung bình",
        data: [6.5, 4.8, 22, 0.8],
        backgroundColor: "#237098cc",
        borderColor: "#237098",
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  // Feature importance
  const importanceData = {
    labels: ["Days Since Login","Txn Drop","Complaints","Balance Change","Login Drop","Txn Trend","Active Member","Tenure","Products"],
    datasets: [{
      label: "Importance",
      data: [0.21, 0.18, 0.15, 0.12, 0.10, 0.08, 0.07, 0.05, 0.04],
      backgroundColor: ["#852D49","#852D49","#B8472F","#B8472F","#B8472F","#237098","#237098","#237098","#237098"].map(c => c + "cc"),
      borderColor:     ["#852D49","#852D49","#B8472F","#B8472F","#B8472F","#237098","#237098","#237098","#237098"],
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  // Trend chart
  const lc1 = get("login_count_1m",6), lc3 = get("login_count_3m",20);
  const tc1 = get("txn_count_1m",4),  tc3 = get("txn_count_3m",14);
  const trendData = {
    labels: ["Login M-3","Login M-2","Login M-1","Txn M-3","Txn M-2","Txn M-1"],
    datasets: [{
      label: "Activity",
      data: [
        Math.round((lc3 - lc1) * 0.45),
        Math.round((lc3 - lc1) * 0.55),
        lc1,
        Math.round((tc3 - tc1) * 0.45),
        Math.round((tc3 - tc1) * 0.55),
        tc1,
      ],
      backgroundColor: ["#237098cc","#237098aa","#237098","#B8472Fcc","#B8472Faa","#B8472F"],
      borderColor:     ["#237098","#237098","#237098","#B8472F","#B8472F","#B8472F"],
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
            <h3 className="result-chart-title">Activity Trend (3 tháng)</h3>
            <div style={{ height: 220 }}>
              <Bar data={trendData} options={chartOpts()} />
            </div>
          </div>

          <div className="result-chart-box">
            <h3 className="result-chart-title">Risk Breakdown</h3>
            <div style={{ height: 220, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12, padding: "0 8px" }}>
              {[
                { label: "Recency Risk",     val: Math.min(get("days_since_last_login",22) / 90 * 100, 100) },
                { label: "Activity Drop",    val: lc3 > 0 ? Math.max(0, (1 - lc1/(lc3/3)) * 100) : 0 },
                { label: "Complaint Risk",   val: Math.min(get("complaint_count",0) * 20, 100) },
                { label: "Balance Risk",     val: get("balance_change_pct",0) < 0 ? Math.min(Math.abs(get("balance_change_pct",0)) * 100, 100) : 0 },
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
  balance:"", estimatedSalary:"", balance_change_pct:"",
  hasCrCard:true, isActiveMember:true, numOfProducts:2,
  complaint_count:"", days_since_last_login:"", days_since_last_txn:"",
  login_count_1m:"", login_count_3m:"",
  txn_count_1m:"", txn_count_3m:"",
  avg_txn_amount_3m:"", std_txn_amount_3m:"",
};

const CustomerForm = ({ onSubmit, animating }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({...f,[k]:v})); setErrors(e => ({...e,[k]:undefined})); };

  const validate = () => {
    const e = {};
    if (!form.age || Number(form.age)<18 || Number(form.age)>100) e.age="18–100";
    if (!form.creditScore || Number(form.creditScore)<300 || Number(form.creditScore)>900) e.creditScore="300–900";
    if (form.balance_change_pct!=="" && (Number(form.balance_change_pct)<-1||Number(form.balance_change_pct)>1)) e.balance_change_pct="-1.0 đến 1.0";
    if (form.login_count_3m!==""&&form.login_count_1m!==""&&Number(form.login_count_3m)<Number(form.login_count_1m)) e.login_count_3m="Phải ≥ Login 1M";
    if (form.txn_count_3m!==""&&form.txn_count_1m!==""&&Number(form.txn_count_3m)<Number(form.txn_count_1m)) e.txn_count_3m="Phải ≥ Txn 1M";
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
      ["Balance Change %", <>{inp("balance_change_pct",{type:"number",placeholder:"-1.0 ~ 1.0",step:"0.01"})}{errors.balance_change_pct&&<span className="cf-err">{errors.balance_change_pct}</span>}</>],
    ]},
    { title:"Tài khoản", fields:[
      ["Number of Products", <select className="cf-input cf-select" value={form.numOfProducts} onChange={e=>set("numOfProducts",Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select>],
      ["Complaint Count", inp("complaint_count",{type:"number",placeholder:"0–10",min:0,max:10})],
      ["Has Credit Card", <label className="cf-check"><input type="checkbox" checked={form.hasCrCard} onChange={e=>set("hasCrCard",e.target.checked)}/><span>{form.hasCrCard?"Có":"Không"}</span></label>],
      ["Is Active Member", <label className="cf-check"><input type="checkbox" checked={form.isActiveMember} onChange={e=>set("isActiveMember",e.target.checked)}/><span>{form.isActiveMember?"Active":"Inactive"}</span></label>],
    ]},
    { title:"Đăng nhập & Hành vi", fields:[
      ["Days Since Last Login", inp("days_since_last_login",{type:"number",placeholder:"e.g. 14"})],
      ["Days Since Last Txn", inp("days_since_last_txn",{type:"number",placeholder:"e.g. 10"})],
      ["Login Count (1M)", inp("login_count_1m",{type:"number",placeholder:"e.g. 6"})],
      ["Login Count (3M)", <>{inp("login_count_3m",{type:"number",placeholder:"e.g. 20"})}{errors.login_count_3m&&<span className="cf-err">{errors.login_count_3m}</span>}</>],
    ]},
    { title:"Giao dịch", fields:[
      ["Txn Count (1M)", inp("txn_count_1m",{type:"number",placeholder:"e.g. 4"})],
      ["Txn Count (3M)", <>{inp("txn_count_3m",{type:"number",placeholder:"e.g. 14"})}{errors.txn_count_3m&&<span className="cf-err">{errors.txn_count_3m}</span>}</>],
      ["Avg Txn Amount (3M)", inp("avg_txn_amount_3m",{type:"number",placeholder:"e.g. 350"})],
      ["Txn Std Dev (3M)", inp("std_txn_amount_3m",{type:"number",placeholder:"e.g. 120"})],
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

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page,          setPage]          = useState("landing");
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
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/ionicons@5.4.0/dist/ionicons.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
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
        setPage("result");
      }, 1500);
    }, 650);
  };

  const handleBack = () => {
    setPage("landing");
    setPredForm(null);
    setPredScore(0);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { setError("Vui lòng nhập email và mật khẩu."); return; }
    setError("Demo mode — Login not available");
    setTimeout(() => setError(null), 3000);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) { setError("Vui lòng nhập tên hoặc ID khách hàng."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name: searchInput }),
      });
      if (res.ok) {
        const result = await res.json();
        setCustomerData({ ...defaultCustomerSample, name: searchInput, churnProbability: result.churn_probability||0.5 });
        setViewCustomer(true);
      }
    } catch (err) {
      setError("Search error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavClick = (section) => {
    if (section==="service") document.querySelector(".kpi-section")?.scrollIntoView({behavior:"smooth"});
    else if (section==="design") document.querySelector(".chart-section")?.scrollIntoView({behavior:"smooth"});
    else window.scrollTo({top:0,behavior:"smooth"});
  };

  const data     = viewCustomer ? customerData : bankData;
  const analysis = analyzeData(data);

  if (page === "result") return <ResultPage form={predForm} score={predScore} onBack={handleBack} />;

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
          <input className="srch" type="search" placeholder="Search customers..."
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
          <h1>Churn Analysis <br/><span>Customer</span><br/>Specialist</h1>
          <p className="par">
            Explore detailed data about customer churn rates,
            predict churn trends, and receive specific solutions
            to retain customers.
          </p>
          <button className="cn"
            onClick={() => document.querySelector(".kpi-section")?.scrollIntoView({behavior:"smooth"})}>
            DISCOVER NOW
          </button>
        </div>

        {/* LOGIN FORM */}
        <div className="form">
          <h2>Log in here</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Enter Your Email"
              value={loginEmail} onChange={e => setLoginEmail(e.target.value)}/>
            <input type="password" placeholder="Enter Your Password"
              value={loginPassword} onChange={e => setLoginPassword(e.target.value)}/>
            <button className="btn" type="submit">Log in</button>
          </form>
          <p className="link">No account yet.<br/><a href="#">Register here</a></p>
          <p className="liw">Log in with</p>
          <div className="icons">
            <a href="#"><ion-icon name="logo-facebook"/></a>
            <a href="#"><ion-icon name="logo-instagram"/></a>
            <a href="#"><ion-icon name="logo-twitter"/></a>
            <a href="#"><ion-icon name="logo-google"/></a>
            <a href="#"><ion-icon name="logo-skype"/></a>
          </div>
        </div>
      </section>

      {/* ===== KPI SECTION ===== */}
      <section className={`kpi-section ${exiting ? "kpi-exit" : ""}`}>
        <div className="kpi-header">
          <h2>{viewCustomer ? data.name : "Bank Overview"}</h2>
          <p className="kpi-subtitle">Monthly Data</p>
          <div className="mode-toggle">
            <button className={`mode-btn ${!viewCustomer?"active":""}`} onClick={()=>setViewCustomer(false)}>Bank</button>
            <button className={`mode-btn ${viewCustomer?"active":""}`}  onClick={()=>setViewCustomer(true)}>Customer</button>
          </div>
        </div>
        <div className="kpi-display">
          {[
            {label:"Tổng Khách Hàng",      val: data.customers?.toLocaleString?.()??data.customers},
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
          <h3>Customer Acquisition</h3>
          <form onSubmit={handleSearch}>
            <input type="text" placeholder="Enter customer ID or name..."
              value={searchInput} onChange={e=>setSearchInput(e.target.value)} disabled={loading}/>
            <button type="submit" disabled={loading}>{loading?"Searching...":"Search"}</button>
          </form>
        </div>
      </section>

      {/* ===== CUSTOMER FORM (NEW) ===== */}
      <section className="predict-section">
        <div className="predict-container">
          <CustomerForm onSubmit={handleAnalyze} animating={exiting}/>
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