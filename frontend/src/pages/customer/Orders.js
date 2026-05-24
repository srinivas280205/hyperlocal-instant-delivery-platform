import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { STATUS_COLORS, STATUS_LABELS, STATUS_ICONS, formatCurrency, formatDate, getPackageInfo } from '../../utils/helpers';

const FILTERS = ['all', 'pending', 'on_the_way', 'delivered', 'cancelled'];

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then(res => setOrders(res.data.orders)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="page">
      <div className="page-header"><h2>My Orders</h2></div>

      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div>
        : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No orders found</p>
            <Link to="/customer/book" className="btn-primary">Book a Delivery</Link>
          </div>
        ) : filtered.map(order => (
          <Link key={order._id} to={`/customer/track/${order._id}`} className="order-card">
            <div className="order-card-top">
              <span className="pkg-icon">{getPackageInfo(order.packageType).icon}</span>
              <div className="order-info">
                <p className="tracking-id">{order.trackingId}</p>
                <p className="order-addr">{order.dropoff.address.slice(0, 40)}...</p>
                <p className="order-date">{formatDate(order.createdAt)}</p>
              </div>
              <div className="order-right">
                <span className="status-badge" style={{ background: STATUS_COLORS[order.status] }}>
                  {STATUS_ICONS[order.status]}
                </span>
                <strong>{formatCurrency(order.price)}</strong>
              </div>
            </div>
            <div className="status-text" style={{ color: STATUS_COLORS[order.status] }}>
              {STATUS_LABELS[order.status]}
            </div>
          </Link>
        ))}
    </div>
  );
}
