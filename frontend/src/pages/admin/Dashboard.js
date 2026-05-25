import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS, STATUS_ICONS, getPackageInfo } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data);
      setLastRefresh(new Date());
    } catch { toast.error('Failed to refresh'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleForceStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${STATUS_LABELS[status]}`);
      fetchData();
    } catch { toast.error('Failed to update order'); }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Force cancel this order?')) return;
    try {
      await api.put(`/orders/${orderId}/cancel`, { reason: 'Cancelled by admin' });
      toast.success('Order cancelled');
      fetchData();
    } catch { toast.error('Cannot cancel'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading dashboard...</p></div>;

  const statusMap = {};
  data?.ordersByStatus?.forEach(s => { statusMap[s._id] = s.count; });

  const activeCount = (statusMap['pending'] || 0) + (statusMap['accepted'] || 0) +
    (statusMap['picked_up'] || 0) + (statusMap['on_the_way'] || 0);

  return (
    <div className="page admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <small className="refresh-time">Updated {lastRefresh.toLocaleTimeString()}</small>
        </div>
        <div className="admin-header-actions">
          <button
            className={`refresh-toggle ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(a => !a)}
          >
            🔄 {autoRefresh ? 'Auto' : 'Manual'}
          </button>
          <button className="refresh-btn" onClick={fetchData}>⟳ Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card blue">
          <strong>{data?.stats?.totalUsers || 0}</strong><span>Customers</span>
        </div>
        <div className="admin-stat-card orange">
          <strong>{data?.stats?.totalRiders || 0}</strong><span>Riders</span>
        </div>
        <div className="admin-stat-card purple">
          <strong>{data?.stats?.totalOrders || 0}</strong><span>Total Orders</span>
        </div>
        <div className="admin-stat-card green">
          <strong>{formatCurrency(data?.stats?.totalRevenue || 0)}</strong><span>Revenue</span>
        </div>
      </div>

      {/* Live Active Orders Alert */}
      {activeCount > 0 && (
        <div className="live-alert">
          <span className="live-dot" />
          <strong>{activeCount} active {activeCount === 1 ? 'delivery' : 'deliveries'} right now</strong>
        </div>
      )}

      {/* Status Breakdown */}
      <div className="status-breakdown">
        <h3>Orders by Status</h3>
        <div className="status-grid">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="status-count-card" style={{ borderLeft: `4px solid ${STATUS_COLORS[key]}` }}>
              <strong style={{ color: STATUS_COLORS[key] }}>{statusMap[key] || 0}</strong>
              <span>{STATUS_ICONS[key]} {label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders with Admin Controls */}
      <div className="section">
        <h3>Recent Orders</h3>
        {data?.recentOrders?.map(order => (
          <div key={order._id} className="admin-order-card">
            <div className="admin-order-top">
              <span className="pkg-icon">{getPackageInfo(order.packageType).icon}</span>
              <div className="order-info">
                <p className="tracking-id">{order.trackingId}</p>
                <p><strong>{order.customer?.name}</strong> → {order.dropoff?.address?.slice(0, 30)}...</p>
                {order.rider && <p>🛵 Rider: {order.rider?.name}</p>}
                <p className="order-date">{formatDate(order.createdAt)}</p>
              </div>
              <div className="admin-order-right">
                <span className="status-badge" style={{ background: STATUS_COLORS[order.status] }}>
                  {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status]}
                </span>
                <strong>{formatCurrency(order.price)}</strong>
              </div>
            </div>
            {/* Admin action buttons */}
            {!['delivered', 'cancelled'].includes(order.status) && (
              <div className="admin-order-actions">
                {order.status === 'pending' && (
                  <button className="admin-action-btn green" onClick={() => handleForceStatus(order._id, 'accepted')}>
                    Force Accept
                  </button>
                )}
                {order.status === 'accepted' && (
                  <button className="admin-action-btn blue" onClick={() => handleForceStatus(order._id, 'picked_up')}>
                    Mark Picked Up
                  </button>
                )}
                {order.status === 'picked_up' && (
                  <button className="admin-action-btn blue" onClick={() => handleForceStatus(order._id, 'on_the_way')}>
                    Mark On Way
                  </button>
                )}
                {order.status === 'on_the_way' && (
                  <button className="admin-action-btn green" onClick={() => handleForceStatus(order._id, 'delivered')}>
                    Mark Delivered
                  </button>
                )}
                <button className="admin-action-btn red" onClick={() => handleCancelOrder(order._id)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
