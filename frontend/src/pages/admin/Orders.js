import { useState, useEffect } from 'react';
import api from '../../services/api';
import { STATUS_COLORS, STATUS_LABELS, formatCurrency, formatDate, getPackageInfo } from '../../utils/helpers';

const STATUS_TABS = ['all', 'pending', 'accepted', 'on_the_way', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = filter === 'all' ? `?page=${page}` : `?status=${filter}&page=${page}`;
    api.get(`/admin/orders${params}`)
      .then(res => { setOrders(res.data.orders); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  }, [filter, page]);

  return (
    <div className="page">
      <div className="page-header"><h2>All Orders ({total})</h2></div>

      <div className="filter-tabs scrollable">
        {STATUS_TABS.map(s => (
          <button key={s} className={`filter-tab ${filter === s ? 'active' : ''}`}
            onClick={() => { setFilter(s); setPage(1); }}>
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div>
        : orders.map(order => (
          <div key={order._id} className="admin-order-row detailed">
            <span className="pkg-icon">{getPackageInfo(order.packageType).icon}</span>
            <div className="order-info">
              <p className="tracking-id">{order.trackingId}</p>
              <p>📍 {order.pickup.address.slice(0, 30)}...</p>
              <p>🏠 {order.dropoff.address.slice(0, 30)}...</p>
              <p>👤 {order.customer?.name} | 🛵 {order.rider?.name || 'Unassigned'}</p>
              <p className="order-date">{formatDate(order.createdAt)}</p>
            </div>
            <div className="order-right">
              <span className="status-badge" style={{ background: STATUS_COLORS[order.status] }}>
                {STATUS_LABELS[order.status]}
              </span>
              <strong>{formatCurrency(order.price)}</strong>
              <small>{order.distance} km</small>
            </div>
          </div>
        ))}

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span>Page {page}</span>
        <button disabled={orders.length < 20} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  );
}
