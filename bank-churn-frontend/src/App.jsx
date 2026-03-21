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

const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

// ===== DATA MẪU =====
const dataBank = {
  customerTotal: 12450,
  churn: [12,15,18,14,22,19,25,20,23,18,21,19], // %
  deposit: [120,130,125,140,150,155,160,170,165,175,180,190], // Tỷ
  productUsage: [60,68,65,75,80,78,82,88,90,95,100,108], // %
  complaints: [20,25,18,30,28,22,35,30,27,26,24,22], // lần
  appUsage: [500,520,545,600,630,665,710,750,780,820,850,900], // 1k/min
  transaction: [150,170,165,180,200,210,220,230,240,260,280,300], // triệu lượt
};

const dataCustomer = {
  name: "Nguyễn Văn A",
  churn: [9,10,12,14,16,15,18,19,17,18,19,21],
  deposit: [2,2.2,2.1,2.3,2.5,2.7,2.6,2.8,3.0,3.1,3.2,3.4],
  productUsage: [2,2.5,2.7,3,3.2,3.4,3.4,3.7,3.9,4.0,4.2,4.3],
  complaints: [0,1,0,1,1,1,0,1,0,1,0,1],
  appUsage: [12,13,15,14,15,16,17,18,20,21,21,22],
  transaction: [5,5.5,5.7,6,6.4,6.8,7,7.2,7.8,8.0,8.4,8.8],
};

function getTrend(arr) {
  // So sánh 3 tháng gần nhất và 3 tháng trước đó
  const last3 = arr.slice(-3).reduce((a,b)=>a+b,0);
  const prev3 = arr.slice(-6,-3).reduce((a,b)=>a+b,0);
  return {
    trend: last3 - prev3,
    last3, prev3
  };
}

const Card = ({ label, value, badge, up }) => (
  <div className={`card ${up === true ? "up" : up === false ? "down" : ""}`}>
    <div className="card-title">{label}</div>
    <div className="card-value">
      {value}
      {badge && <span className="badge">{badge}</span>}
    </div>
  </div>
);

const DashboardSection = ({
  title, children
}) => (
  <div className="section">
    <h3>{title}</h3>
    <div className="dashboard-grid">{children}</div>
  </div>
);

export default function App() {
  const [view, setView] = useState("overview");
  const [search, setSearch] = useState("");
  const [customerData, setCustomerData] = useState(null);

  // TỔNG QUAN NGÂN HÀNG
  const churnTrend = getTrend(dataBank.churn);
  const depositGrowth = ((dataBank.deposit[11] - dataBank.deposit[0]) / dataBank.deposit[0] * 100).toFixed(1);
  const productGrowth = ((dataBank.productUsage[11] - dataBank.productUsage[0]) / dataBank.productUsage[0] * 100).toFixed(1);
  const appGrowth = ((dataBank.appUsage[11] - dataBank.appUsage[0]) / dataBank.appUsage[0] * 100).toFixed(1);
  const txnGrowth = ((dataBank.transaction[11] - dataBank.transaction[0]) / dataBank.transaction[0] * 100).toFixed(1);

  // INSIGHT TỔNG QUAN
  const insight = useMemo(() => {
    let text = "";
    if (churnTrend.trend > 0) text += "⚠️ Sự rời bỏ tăng so với 3 tháng trước.";
    else if (churnTrend.trend < 0) text += "✅ Sự rời bỏ đang giảm dần.";
    else text += "Sự rời bỏ giữ mức ổn định.";
    text += ` Nguồn vốn tăng +${depositGrowth}%. Số KH sử dụng sản phẩm tăng +${productGrowth}%.`;
    return text;
  }, [churnTrend, depositGrowth, productGrowth]);

  // TỔNG QUAN KHÁCH HÀNG CỤ THỂ
  const churnTrendCus = getTrend(dataCustomer.churn);
  const depositGrowthCus = ((dataCustomer.deposit[11] - dataCustomer.deposit[0]) / dataCustomer.deposit[0] * 100).toFixed(1);
  const productGrowthCus = ((dataCustomer.productUsage[11] - dataCustomer.productUsage[0]) / dataCustomer.productUsage[0] * 100).toFixed(1);

  const handleSearch = () => {
    // Giả lập trả về dataCustomer
    setCustomerData(dataCustomer);
    setView('customer');
  };

  return (
    <div className="app">
      {/* HEADER */}
      <div className="header">
        <div className="logo">🏦 Bank360 Analytics</div>
        <div className="toolbar">
          <button className={view==="overview"?"active":""} onClick={()=>setView("overview")}>Tổng quan NH</button>
          <button className={view==="customer"?"active":""} onClick={()=>setView("customer")}>Khách hàng</button>
          <input
            placeholder="Tìm khách hàng..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleSearch()}
          />
          <button onClick={handleSearch}>Tìm</button>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="layout">
        {/* SIDEBAR: 1/3 */}
        <div className="sidebar">
          <h3>🔍 Tìm kiếm khách hàng</h3>
          <input placeholder="Nhập tên KH..." value={search} onChange={e=>setSearch(e.target.value)} />
          <button onClick={handleSearch}>Tìm</button>
          <h3>📊 Phân tích</h3>
          <button onClick={()=>setView("overview")}>Tổng quan ngân hàng</button>
          <button onClick={()=>setView("customer")}>Tổng quan khách hàng</button>
          <h3>⚙️ Bộ lọc</h3>
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
          <h3>📝 Kết quả phân tích</h3>
          <div className="sidebar-result">
            {view==="overview"
              ? insight
              : customerData && (
                  <div>{churnTrendCus.trend > 0 ? "Churn cá nhân tăng" : "Churn giảm hoặc ổn định"}<br />
                  Tăng trưởng nguồn gửi: {depositGrowthCus}%</div>
                )
            }
          </div>
        </div>

        {/*MAIN: 2/3*/}
        <div className="main">
           {/* --- KPI CARD HÀNG 1 --- */}
          <h1 className="main-title">Tổng quan hoạt động ngân hàng</h1>
          <div className="kpi-row">
            <div className="kpi-card">👥 <span className="kpi-label">KH:</span> <span className="kpi-value">12,450</span></div>
            <div className="kpi-card">⚠️ <span className="kpi-label">Churn:</span> <span className="kpi-value">{dataBank.churn[11]}%</span></div>
            <div className="kpi-card">💰 <span className="kpi-label">Tiền gửi:</span> <span className="kpi-value">{dataBank.deposit[11]} tỷ</span></div>
            <div className="kpi-card">📦 <span className="kpi-label">Sản phẩm:</span> <span className="kpi-value">{dataBank.productUsage[11]}%</span></div>
          </div>
          {/* --- KPI HÀNG 2 --- */}
          <div className="kpi-row">
            <div className="kpi-card">📱 <span className="kpi-label">Dùng app:</span> <span className="kpi-value">{dataBank.appUsage[11]}</span></div>
            <div className="kpi-card">💸 <span className="kpi-label">Giao dịch:</span> <span className="kpi-value">{dataBank.transaction[11]}</span></div>
            <div className="kpi-card">🗣 <span className="kpi-label">Khiếu nại:</span> <span className="kpi-value">{dataBank.complaints[11]}</span></div>
          </div>

          {/* --- CHARTS DÒNG 1 --- */}
          <div className="chart-row">
            <div className="chart small">
              <div className="chart-title">Churn (%)</div>
              <Line data={{ labels: months, datasets: [{ data: dataBank.churn, borderColor: "#ef4444" }] }} height={90} options={{ maintainAspectRatio: false }}/>
            </div>
            <div className="chart small">
              <div className="chart-title">Tiền gửi</div>
              <Line data={{ labels: months, datasets: [{ data: dataBank.deposit, borderColor: "#22d3ee" }] }} height={90} options={{ maintainAspectRatio: false }}/>
            </div>
          </div>
          {/* --- CHARTS DÒNG 2 --- */}
          <div className="chart-row">
            <div className="chart small">
              <div className="chart-title">Sử dụng SP</div>
              <Line data={{ labels: months, datasets: [{ data: dataBank.productUsage, borderColor: "#10b981" }] }} height={90} options={{ maintainAspectRatio: false }}/>
            </div>
            <div className="chart small">
              <div className="chart-title">Khiếu nại</div>
              <Bar data={{ labels: months, datasets: [{ data: dataBank.complaints, backgroundColor: "#f59e0b" }] }} height={90} options={{ maintainAspectRatio: false }}/>
            </div>
            <div className="chart small">
              <div className="chart-title">App Usage</div>
              <Line data={{ labels: months, datasets: [{ data: dataBank.appUsage, borderColor: "#6366f1" }] }} height={90} options={{ maintainAspectRatio: false }}/>
            </div>
          </div>
          {/* TỔNG QUAN NGÂN HÀNG */}
          {view==="overview" && (
            <>
              <h2>📊 Tổng quan hoạt động ngân hàng</h2>
              {/* KPI ROW 1: CHURN, DEPOSIT, PRODUCT USAGE */}
              <div className="kpi">
                <Card label="👥 Tổng KH" value={dataBank.customerTotal} />
                <Card label="⚠️ Churn hiện tại" value={dataBank.churn[11]+"%"} up={churnTrend.trend<=0} />
                <Card label="💰 Nguồn tiền gửi" value={dataBank.deposit[11]+" tỷ"} badge={`+${depositGrowth}%`} up={depositGrowth>0} />
                <Card label="📦 Sử dụng SP (%)" value={dataBank.productUsage[11]+"%"} badge={`+${productGrowth}%`} up={productGrowth>0} />
              </div>

              {/* KPI ROW 2: APP & GIAO DỊCH */}
              <div className="kpi">
                <Card label="📱 Dùng app (nghìn phút)" value={dataBank.appUsage[11]} badge={`+${appGrowth}%`} up={appGrowth>0}/>
                <Card label="💸 Số giao dịch" value={dataBank.transaction[11]} badge={`+${txnGrowth}%`} up={txnGrowth>0}/>
                <Card label="🗣 Khiếu nại T12" value={dataBank.complaints[11]} />
                <Card label="3M vs trước "
                  value={churnTrend.last3+" / "+churnTrend.prev3}
                  badge={`${churnTrend.trend>0?"+":"-"}${Math.abs(churnTrend.trend)}`}
                  up={churnTrend.trend<=0}
                />
              </div>

              {/* GRID CHART SECTION */}
              <DashboardSection title="1️⃣ Sự rời bỏ - tiền gửi - sản phẩm">
                {/* Hàng 1: Churn, Deposit, sản phẩm */}
                <div className="row-charts">
                  <div className="chart">
                    <div className="chart-title">Churn (%)</div>
                    <Line height={70} data={{
                      labels: months,
                      datasets: [{label:"Churn",data:dataBank.churn,borderColor:"#ef4444", tension:.3}]
                    }} />
                  </div>
                  <div className="chart">
                    <div className="chart-title">Tiền gửi (tỷ)</div>
                    <Line height={70} data={{
                      labels: months,
                      datasets: [{label:"Deposit",data:dataBank.deposit,borderColor:"#22d3ee", tension:.3}]
                    }} />
                  </div>
                  <div className="chart">
                    <div className="chart-title">Sử dụng sản phẩm (%)</div>
                    <Line height={70} data={{
                      labels: months,
                      datasets: [{label:"Usage",data:dataBank.productUsage,borderColor:"#10b981", tension:.3}]
                    }} />
                  </div>
                </div>
              </DashboardSection>
              <DashboardSection title="2️⃣ Khiếu nại khách hàng">
                <div className="row-charts">
                  <div className="chart">
                    <div className="chart-title">Số khiếu nại</div>
                    <Bar height={70}
                      data={{
                        labels: months,
                        datasets:[{label:"Khiếu nại",data:dataBank.complaints,backgroundColor:"#f59e0b"}]
                      }}
                    />
                  </div>
                </div>
              </DashboardSection>
              <DashboardSection title="3️⃣ App & giao dịch">
                <div className="row-charts">
                  <div className="chart">
                    <div className="chart-title">Tần suất dùng App</div>
                    <Line height={70} data={{
                      labels: months,
                      datasets:[{
                        label:"App Usage",
                        data:dataBank.appUsage,
                        borderColor:"#6366f1", tension:.3
                      }]
                    }} />
                  </div>
                  <div className="chart">
                    <div className="chart-title">Tần suất giao dịch (triệu lượt)</div>
                    <Line height={70} data={{
                      labels: months,
                      datasets:[{
                        label:"Giao dịch",
                        data:dataBank.transaction,
                        borderColor:"#a78bfa", tension:.3
                      }
                      ]
                    }} />
                  </div>
                </div>
              </DashboardSection>
              <div className="insight">
                <h3>🔮 AI Insight</h3>
                <p>{insight}</p>
                <p>Churn [3 tháng] mới: {churnTrend.last3}. Trước đó: {churnTrend.prev3}. <br />
                {churnTrend.trend>0 ? "Cần tăng giữ chân KH" : "Tín hiệu tích cực! Hãy phát huy."}
                </p>
              </div>
            </>
          )}

          {/* TỔNG QUAN KHÁCH HÀNG */}
          {view === 'customer' && customerData && (
            <>
              <h2>👤 Khách hàng - {customerData.name}</h2>

              <div className="kpi">
                <Card label="⚠️ Churn KH" value={customerData.churn[11]+"%"} up={churnTrendCus.trend<=0} />
                <Card label="💰 Tiền gửi hiện tại" value={customerData.deposit[11]+" tỷ"} badge={`+${depositGrowthCus}%`} up={depositGrowthCus>0} />
                <Card label="📦 Dùng sản phẩm" value={customerData.productUsage[11]} badge={`+${productGrowthCus}%`} up={productGrowthCus>0} />
                <Card label="🗣 Khiếu nại 3T" value={customerData.complaints.slice(-3).reduce((a,b)=>a+b,0)} />
              </div>

              {/* Biểu đồ cho KH */}
              <DashboardSection title="Sự rời bỏ & tài chính KH">
                <div className="row-charts">
                  <div className="chart">
                    <div className="chart-title">Churn (%)</div>
                    <Line height={70} data={{
                      labels: months,
                      datasets:[{label:"Churn",data:customerData.churn,borderColor:"#ef4444"}]
                    }}/>
                  </div>
                  <div className="chart">
                    <div className="chart-title">Tiền gửi (tỷ)</div>
                    <Line height={70} data={{
                      labels: months,
                      datasets:[{label:"Tiền gửi",data:customerData.deposit,borderColor:"#22d3ee"}]
                    }}/>
                  </div>
                  <div className="chart">
                    <div className="chart-title">SP sử dụng</div>
                    <Line height={70} data={{
                      labels: months,
                      datasets:[{label:"SP",data:customerData.productUsage,borderColor:"#10b981"}]
                    }}/>
                  </div>
                </div>
              </DashboardSection>
              <DashboardSection title="Hoạt động app & transaction KH">
                <div className="row-charts">
                  <div className="chart">
                    <div className="chart-title">Tần su���t dùng app</div>
                    <Line height={70} data={{
                      labels: months,
                      datasets:[{label:"App",data:customerData.appUsage,borderColor:"#6366f1"}]
                    }}/>
                  </div>
                  <div className="chart">
                    <div className="chart-title">Giao dịch/tháng</div>
                    <Line height={70} data={{
                      labels: months,
                      datasets:[{label:"Txn",data:customerData.transaction,borderColor:"#a78bfa"}]
                    }}/>
                  </div>
                </div>
              </DashboardSection>
              <DashboardSection title="Khiếu nại">
                <div className="row-charts">
                  <div className="chart">
                    <div className="chart-title">Khiếu nại/tháng</div>
                    <Bar height={70}
                      data={{
                        labels: months,
                        datasets: [{label:"Khiếu nại",data:customerData.complaints,backgroundColor:"#f59e0b"}]
                      }}
                    />
                  </div>
                </div>
              </DashboardSection>
            </>
          )}

        </div>
      </div>
    </div>
  );
}