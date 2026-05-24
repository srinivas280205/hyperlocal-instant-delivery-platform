import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function RiderEarnings() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then(res => {
      setOrders(res.data.orders.filter(o => o.status === 'delivered'));
    }).finally(() => setLoading(false));
  }, []);

  const totalEarnings = orders.reduce((sum, o) => sum + o.price * 0.8, 0);
  const today = new Date().toDateString();
  const todayEarnings = orders
    .filter(o => new Date(o.createdAt).toDateString() === today)
    .reduce((sum, o) => sum + o.price * 0.8, 0);

  return (
    <div className="page">
      <div className="page-header"><h2>Earnings</h2></div>

      <div className="earnings-summary">
        <div className="earnings-card big">
          <strong>{formatCurrency(Math.round(totalEarnings))}</strong>
          <span>Total Earned</span>
        </div>
        <div className="earnings-row">
          <div className="earnings-card">
            <strong>{formatCurrency(Math.round(todayEarnings))}</strong>
            <span>Today</span>
          </div>
          <div className="earnings-card">
            <strong>{orders.length}</strong>
            <span>Deliveries</span>
          </div>
          <div className="earnings-card">
            <strong>{user?.rating?.toFixed(1) || '0.0'} ⭐</strong>
            <span>Rating</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h3>Delivery History</h3>
        {loading ? <div className="spinner" /> : orders.length === 0 ? (
          <div className="empty-state"><p>No completed deliveries yet</p></div>
        ) : orders.map(order => (
          <div key={order._id} className="earnings-entry">
            <div>
              <p className="tracking-id">{order.trackingId}</p>
              <p className="order-date">{formatDate(order.createdAt)}</p>
              <p>{order.distance} km</p>
            </div>
            <strong className="earn-amount">{formatCurrency(Math.round(order.price * 0.8))}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
