import {
  dashboardMetrics,
  sampleMarketplaceSummary,
  sampleOrderTrend,
  sampleRecentOrders,
  sampleSellerActivity,
} from './demo-data';

function MetricIcon({ kind }: { kind: (typeof dashboardMetrics)[number]['icon'] }) {
  switch (kind) {
    case 'orders':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
    case 'sales':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M17 7.5c0-1.7-1.9-3-4.5-3S8 5.7 8 7.3s1.3 2.6 4.5 3.2 4.5 1.7 4.5 3.5-1.9 3.3-4.5 3.3-4.5-1.3-4.5-3" /></svg>;
    case 'sellers':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.4-3.1 2.3-4.7 5.5-4.7s5.1 1.6 5.5 4.7M16 5.5a3 3 0 0 1 0 5.8M17 14.5c2.2.5 3.4 2 3.6 4.5" /></svg>;
    case 'products':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4.5 7.7 7.5 4.4 7.5-4.4M12 12.1V21" /></svg>;
  }
}

function MetricsGrid() {
  return (
    <section className="kpi-grid" aria-label="Sample dashboard metrics">
      {dashboardMetrics.map((metric) => (
        <article className="kpi-card" key={metric.label}>
          <div className="kpi-topline">
            <span className="kpi-label">{metric.label}</span>
            <span className="kpi-icon"><MetricIcon kind={metric.icon} /></span>
          </div>
          <p className="kpi-value">{metric.value}</p>
          <p className="kpi-note">{metric.note}</p>
        </article>
      ))}
    </section>
  );
}

function OrdersChart() {
  const points = sampleOrderTrend.map((point, index) => {
    const x = 48 + index * 70;
    const maxOrders = Math.max(...sampleOrderTrend.map((item) => item.orders));
    const y = 164 - (point.orders / maxOrders) * 116;
    return { ...point, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${points[0].x},174 ${polyline} ${points[points.length - 1].x},174`;

  return (
    <section className="panel" aria-labelledby="orders-chart-heading">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="orders-chart-heading">Order activity</h2>
          <p className="panel-subtitle">Illustrative monthly demo order counts</p>
        </div>
        <span className="demo-tag">SAMPLE</span>
      </div>
      <div className="chart-wrap">
        <figure
          aria-labelledby="orders-chart-heading"
          aria-describedby="orders-chart-description"
        >
          <svg className="chart-svg" viewBox="0 0 520 210" role="img">
            <title>Sample order activity chart</title>
            <desc id="orders-chart-description">
              Fictional order counts by month from January through July. This is sample data, not live platform activity.
            </desc>
            <defs>
              <linearGradient id="demoChartFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#6969df" stopOpacity=".2" />
                <stop offset="100%" stopColor="#6969df" stopOpacity=".01" />
              </linearGradient>
            </defs>
            {[48, 86, 124, 162].map((y) => (
              <line className="chart-gridline" key={y} x1="42" x2="500" y1={y} y2={y} />
            ))}
            <text className="chart-axis-label" x="8" y="52">80</text>
            <text className="chart-axis-label" x="8" y="90">60</text>
            <text className="chart-axis-label" x="8" y="128">40</text>
            <text className="chart-axis-label" x="8" y="166">20</text>
            <polygon className="chart-area" points={area} />
            <polyline className="chart-line" points={polyline} />
            {points.map((point) => (
              <g key={point.month}>
                <circle className="chart-point" cx={point.x} cy={point.y} r="4" />
                <text className="chart-axis-label" textAnchor="middle" x={point.x} y="196">
                  {point.month}
                </text>
              </g>
            ))}
          </svg>
          <figcaption className="chart-caption">
            <strong>DEMO DATA — NOT CONNECTED TO LIVE SHOPADEMIA SYSTEMS</strong>
            <span>Counts shown are fictional examples only.</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function SellerActivity() {
  return (
    <section className="panel" aria-labelledby="seller-activity-heading">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="seller-activity-heading">Seller activity</h2>
          <p className="panel-subtitle">Illustrative marketplace events</p>
        </div>
        <span className="demo-tag">DEMO</span>
      </div>
      <ul className="activity-list">
        {sampleSellerActivity.map((activity) => (
          <li className="activity-item" key={activity.text}>
            <span className="activity-dot" aria-hidden="true" />
            <div>
              <p>{activity.text}</p>
              <time>{activity.time}</time>
            </div>
          </li>
        ))}
      </ul>
      <p className="activity-note">
        <strong>{sampleMarketplaceSummary.label} · {sampleMarketplaceSummary.title}</strong>
        {sampleMarketplaceSummary.body}
      </p>
    </section>
  );
}

function RecentOrders() {
  return (
    <section className="panel orders-panel" aria-labelledby="recent-orders-heading">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="recent-orders-heading">Recent orders</h2>
          <p className="panel-subtitle">Fictional example rows · no order actions are available</p>
        </div>
        <span className="demo-tag">SAMPLE DATA</span>
      </div>
      <div
        className="table-scroll"
        role="region"
        tabIndex={0}
        aria-label="Scrollable sample orders table"
      >
        <table className="orders-table">
          <caption className="visually-hidden">
            Sample recent orders. These are fictional examples and not live Shopademia records.
          </caption>
          <thead>
            <tr>
              <th scope="col">Reference</th>
              <th scope="col">Sample buyer</th>
              <th scope="col">Example seller</th>
              <th scope="col">Sample date</th>
              <th scope="col">Demo status</th>
            </tr>
          </thead>
          <tbody>
            {sampleRecentOrders.map((order) => (
              <tr key={order.reference}>
                <td>{order.reference}</td>
                <td>{order.buyer}</td>
                <td>{order.seller}</td>
                <td>{order.date}</td>
                <td>
                  <span
                    className={`status-pill${order.status === 'Sample processing' ? ' status-processing' : order.status === 'Demo only' ? ' status-demo' : ''}`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <p>Platform overview</p>
          <h1>Marketplace overview</h1>
        </div>
        <span className="demo-tag">SAMPLE DASHBOARD</span>
      </div>

      <aside className="demo-banner" aria-label="Demo data notice">
        <span className="demo-banner-icon" aria-hidden="true">i</span>
        <div>
          <strong>DEMO DATA — NOT CONNECTED TO LIVE SHOPADEMIA SYSTEMS</strong>
          <p>
            Every metric, chart, order, seller, and activity below is fictional sample content.
            No administrative actions or live platform data are available.
          </p>
        </div>
      </aside>

      <MetricsGrid />

      <div className="dashboard-grid">
        <OrdersChart />
        <SellerActivity />
        <RecentOrders />
      </div>
    </div>
  );
}
