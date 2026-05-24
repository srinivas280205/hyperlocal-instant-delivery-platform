import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const maxRevenue = Math.max(...(data?.dailyRevenue?.map(d => d.revenue) || [1]));

  return (
    <div className="page">
      <div className="page-header"><h2>Analytics</h2></div>

      <div className="section">
        <h3>Revenue (Last 30 days)</h3>
        <div className="bar-chart">
          {data?.dailyRevenue?.slice(0, 14).reverse().map((day) => (
            <div key={day._id} className="bar-item">
              <div className="bar" style={{ height: `${(day.revenue / maxRevenue) * 100}%` }} title={formatCurrency(day.revenue)} />
              <span className="bar-label">{day._id.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Package Type Popularity</h3>
        {data?.packageStats?.map(pkg => (
          <div key={pkg._id} className="pkg-stat-row">
            <span className="pkg-name">{pkg._id}</span>
            <div className="pkg-bar-wrap">
              <div className="pkg-bar" style={{ width: `${(pkg.count / (data.packageStats[0]?.count || 1)) * 100}%` }} />
            </div>
            <span className="pkg-count">{pkg.count}</span>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Daily Summary</h3>
        {data?.dailyRevenue?.slice(0, 7).map(day => (
          <div key={day._id} className="daily-summary-row">
            <span>{day._id}</span>
            <span>{day.count} orders</span>
            <strong>{formatCurrency(day.revenue)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
