import React, { useState } from "react";
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

const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
const bankData = {
  customers: 12450,
  churn: [12,15,18,14,22,19,25,20,23,18,21,19],
  deposit: [120,130,125,140,150,155,160,170,165,175,180,190],
  productUsage: [60,68,65,75,80,78,82,88,90,94,100,108],
  complaints: [20,25,18,30,28,22,35,30,27,26,24,22],
  appUsage: [490,520,545,600,630,665,710,750,780,820,850,900],
  transaction: [150,170,165,180,200,210,220,230,240,260,280,300],
};
const customerSample = {
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
const kpiConfigs = (data,isCustomer) => [
  { icon: isCustomer?"🧑":"👥", label: isCustomer?data.name:"Khách hàng", value: isCustomer?"":data.customers.toLocaleString() },
  { icon: "⚠️", label: "Churn tháng này", value: data.churn[11]+"%" },
  { icon: "💰", label: "Tiền gửi cuối kỳ", value: data.deposit[11]+(isCustomer?"":" tỷ") },
  { icon: "📦", label: "SP sử dụng", value: data.productUsage[11]+(isCustomer?"":"%") },
  { icon: "🗣️", label: "Khiếu nại", value: data.complaints[11]},
  { icon: "📱", label: "App Usage", value: data.appUsage[11]},
  { icon: "💸", label: "Giao dịch", value: data.transaction[11]}
];

const Card = ({icon,label,value}) => (
  <div className="kpi-card">
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
  </div>
);

export default function App() {
  const [viewCustomer, setViewCustomer] = useState(false);
  const data = viewCustomer ? customerSample : bankData;
  const trend = getTrend(data.churn);

  // KPI card chia 2 hàng 4-3
  const kpis = kpiConfigs(data, viewCustomer);
  return (
    <div className="app">

      <div className="header">
        <span className="logo">🏦 FINTECH ANALYTICS</span>
        <span>
          <button className="header-btn" onClick={()=>setViewCustomer(false)}>Ngân hàng</button>
          <button className="header-btn" onClick={()=>setViewCustomer(true)}>Khách hàng</button>
        </span>
      </div>
      
      <div className="layout">
        {/* SIDEBAR */}
        <div className="sidebar">
          <h3>🔍 Tìm kiếm khách hàng</h3>
          <input placeholder="Tên khách hàng..." />
          <button>Tìm</button>
          <div className="side-divider"/>
          <h3>🧭 Bộ lọc</h3>
          <select><option>Tất cả</option><option>VIP</option><option>Thường</option></select>
          <select><option>12 tháng</option><option>6 tháng</option><option>3 tháng</option></select>
          <div className="side-divider"/>
          <h3>⚡ So sánh Churn</h3>
          <div className="trend-box">
            <span>3T gần: <b>{trend.last3}</b></span>
            <span>3T trước: <b>{trend.prev3}</b></span>
            <span>Chênh: <b className={trend.trend<0 ? "good":"bad"}>{trend.trend>0?"+":""}{trend.trend}</b></span>
          </div>
          <div className="side-insight">
            {trend.trend > 0
              ? "⚠️ Rời bỏ đang tăng! Hãy giữ chân KH."
              : "✅ Rời bỏ giảm/ổn định."}
          </div>
        </div>
        {/* MAIN */}
        <div className="main">
          <h1 className="main-title">
            {viewCustomer ? `PHÂN TÍCH KHÁCH HÀNG: ${customerSample.name}` : "PHÂN TÍCH NGÂN HÀNG"}
          </h1>
          <div className="kpi-row">{kpis.slice(0,4).map((k,i) =>
            <Card key={i} icon={k.icon} label={k.label} value={k.value}/> )}</div>
          <div className="kpi-row">{kpis.slice(4).map((k,i) =>
            <Card key={i} icon={k.icon} label={k.label} value={k.value}/> )}</div>

          {/* Chart line: Dòng 1 (churn, deposit) */}
          <div className="chart-row">
            <div className="chart-box">
              <div className="chart-title">Churn (%)</div>
              <Line height={120} data={{
                labels: months,
                datasets: [{ data: data.churn, borderColor:"#ef4444", backgroundColor:"#ef444433", tension:.3, pointRadius: 2.2 }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
            <div className="chart-box">
              <div className="chart-title">Tiền gửi</div>
              <Line height={120} data={{
                labels: months,
                datasets: [{ data: data.deposit, borderColor:"#22d3ee", backgroundColor:"#22d3ee22", tension:.3, pointRadius: 2.2 }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
          </div>
          {/* Chart line/bar: Dòng 2 (Product Usage, Complaints, App Usage) */}
          <div className="chart-row">
            <div className="chart-box">
              <div className="chart-title">SP sử dụng (%)</div>
              <Line height={90} data={{
                labels: months,
                datasets: [{ data: data.productUsage, borderColor:"#10b981", backgroundColor:"#10b98133", tension:.3, pointRadius: 2.2 }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
            <div className="chart-box">
              <div className="chart-title">Khiếu nại</div>
              <Bar height={90} data={{
                labels: months,
                datasets: [{ data: data.complaints, backgroundColor:"#f59e0b" }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
            <div className="chart-box">
              <div className="chart-title">App Usage</div>
              <Line height={90} data={{
                labels: months,
                datasets: [{ data: data.appUsage, borderColor:"#a78bfa", backgroundColor:"#a78bfa33", tension:.3, pointRadius: 2.2 }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
          </div>
          {/* Chart line: Dòng 3 (transaction) */}
          <div className="chart-row">
            <div className="chart-box">
              <div className="chart-title">Tần suất giao dịch</div>
              <Line height={102} data={{
                labels: months,
                datasets: [{ data: data.transaction, borderColor:"#38b6ff", backgroundColor:"#38b6ff18", tension:.3, pointRadius: 2.2 }]
              }} options={{ plugins:{legend:{display:false}}, maintainAspectRatio:false }}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}