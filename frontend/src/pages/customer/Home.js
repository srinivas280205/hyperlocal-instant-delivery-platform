import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { STATUS_COLORS, STATUS_ICONS, STATUS_LABELS, formatCurrency, formatDate, getPackageInfo } from '../../utils/helpers';

export default function CustomerHome() {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then(res => {
      setRecentOrders(res.data.orders.slice(0, 3));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeOrders = recentOrders.filter(o => !['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="page">
      <div className="hero-card">
        <h2>Hi, {user?.name?.split(' ')[0]} 👋</h2>
        <p>Where would you like to send something today?</p>
        <Link to="/customer/book" className="btn-primary hero-btn">
          📦 Book a Delivery
        </Link>
      </div>

      <div className="quick-actions">
        <Link to="/customer/book" className="quick-action">
          <span>💊</span><small>Medicine</small>
        </Link>
        <Link to="/customer/book" className="quick-action">
          <span>🍱</span><small>Food</small>
        </Link>
        <Link to="/customer/book" className="quick-action">
          <span>📄</span><small>Documents</small>
        </Link>
        <Link to="/customer/book" className="quick-action">
          <span>🎁</span><small>Gift</small>
        </Link>
      </div>

      {activeOrders.length > 0 && (
        <div className="section">
          <h3>Active Deliveries</h3>
          {activeOrders.map(order => (
            <Link key={order._id} to={`/customer/track/${order._id}`} className="order-card active-order">
              <div className="order-card-top">
                <span className="pkg-icon">{getPackageInfo(order.packageType).icon}</span>
                <div>
                  <p className="tracking-id">{order.trackingId}</p>
                  <p className="order-addr">{order.dropoff.address.slice(0, 35)}...</p>
                </div>
                <span className="status-badge" style={{ background: STATUS_COLORS[order.status] }}>
                  {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="order-card-bottom">
                <span>{formatCurrency(order.price)}</span>
                <span>{order.distance} km</span>
                <span>~{order.estimatedTime} min</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="section">
        <div className="section-header">
          <h3>Recent Orders</h3>
          <Link to="/customer/orders" className="see-all">See all</Link>
        </div>
        {loading ? <div className="skeleton-list" /> : recentOrders.length === 0 ? (
          <div className="empty-state">
            <p>📦 No orders yet. Book your first delivery!</p>
            <Link to="/customer/book" className="btn-primary">Book Now</Link>
          </div>
        ) : recentOrders.map(order => (
          <Link key={order._id} to={`/customer/track/${order._id}`} className="order-card">
            <div className="order-card-top">
              <span className="pkg-icon">{getPackageInfo(order.packageType).icon}</span>
              <div>
                <p className="tracking-id">{order.trackingId}</p>
                <p className="order-addr">{order.dropoff.address.slice(0, 35)}...</p>
              </div>
              <span className="status-badge" style={{ background: STATUS_COLORS[order.status] }}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="order-date">{formatDate(order.createdAt)}</p>
          </Link>
        ))}
      </div>

      <div className="features-section">
        <div className="feature-item">
          <span>⚡</span>
          <div><strong>Express Delivery</strong><p>15-30 minutes</p></div>
        </div>
        <div className="feature-item">
          <span>🔒</span>
          <div><strong>OTP Secured</strong><p>Safe handover</p></div>
        </div>
        <div className="feature-item">
          <span>📍</span>
          <div><strong>Live Tracking</strong><p>Real-time updates</p></div>
        </div>
      </div>
    </div>
  );
}
