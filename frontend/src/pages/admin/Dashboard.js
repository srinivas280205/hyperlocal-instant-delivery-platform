import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS, getPackageInfo } from '../../utils/helpers';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading dashboard...</p></div>;

  const statusMap = {};
  data?.ordersByStatus?.forEach(s => { statusMap[s._id] = s.count; });

  return (
    <div className="page">
      <div className="page-header"><h2>Admin Dashboard</h2></div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card blue">
          <strong>{data?.stats?.totalUsers || 0}</strong>
          <span>Total Customers</span>
        </div>
        <div className="admin-stat-card orange">
          <strong>{data?.stats?.totalRiders || 0}</strong>
          <span>Total Riders</span>
        </div>
        <div className="admin-stat-card purple">
          <strong>{data?.stats?.totalOrders || 0}</strong>
          <span>Total Orders</span>
        </div>
        <div className="admin-stat-card green">
          <strong>{formatCurrency(data?.stats?.totalRevenue || 0)}</strong>
          <span>Revenue</span>
        </div>
      </div>

      <div className="status-breakdown">
        <h3>Orders by Status</h3>
        <div className="status-grid">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="status-count" style={{ borderLeft: `4px solid ${STATUS_COLORS[key]}` }}>
              <strong>{statusMap[key] || 0}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Recent Orders</h3>
        {data?.recentOrders?.map(order => (
          <div key={order._id} className="admin-order-row">
            <span className="pkg-icon">{getPackageInfo(order.packageType).icon}</span>
            <div className="order-info">
              <p className="tracking-id">{order.trackingId}</p>
              <p>{order.customer?.name} → {order.dropoff?.address?.slice(0, 25)}...</p>
              <p className="order-date">{formatDate(order.createdAt)}</p>
            </div>
            <div className="order-right">
              <span className="status-badge" style={{ background: STATUS_COLORS[order.status] }}>
                {STATUS_LABELS[order.status]}
              </span>
              <strong>{formatCurrency(order.price)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
