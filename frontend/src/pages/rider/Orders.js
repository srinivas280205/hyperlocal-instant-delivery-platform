import { useState, useEffect } from 'react';
import api from '../../services/api';
import { STATUS_COLORS, STATUS_LABELS, formatCurrency, formatDate, getPackageInfo } from '../../utils/helpers';

export default function RiderOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then(res => setOrders(res.data.orders)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header"><h2>My Deliveries</h2></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div>
        : orders.length === 0 ? (
          <div className="empty-state"><p>No deliveries yet</p><p>Go online to start accepting orders</p></div>
        ) : orders.map(order => (
          <div key={order._id} className="order-card">
            <div className="order-card-top">
              <span className="pkg-icon">{getPackageInfo(order.packageType).icon}</span>
              <div className="order-info">
                <p className="tracking-id">{order.trackingId}</p>
                <p className="order-addr">{order.pickup.address.slice(0, 30)}...</p>
                <p className="order-addr">→ {order.dropoff.address.slice(0, 30)}...</p>
                <p className="order-date">{formatDate(order.createdAt)}</p>
              </div>
              <div className="order-right">
                <span className="status-badge" style={{ background: STATUS_COLORS[order.status] }}>
                  {STATUS_LABELS[order.status]}
                </span>
                <strong>{formatCurrency(Math.round(order.price * 0.8))}</strong>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
