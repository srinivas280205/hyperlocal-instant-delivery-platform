import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { STATUS_COLORS, STATUS_ICONS, STATUS_LABELS, formatCurrency, getPackageInfo } from '../../utils/helpers';
import LiveTrackingMap from '../../components/LiveTrackingMap';

const STEPS_ORDER = ['pending', 'accepted', 'picked_up', 'on_the_way', 'delivered'];

export default function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(res => setOrder(res.data.order)).catch(() => toast.error('Order not found'));

    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.emit('join_order_room', id);
    socket.on('order_update', ({ order: updated }) => setOrder(updated));
    socket.on(`rider_location_${order?.rider?._id}`, ({ lat, lng }) => setRiderLocation({ lat, lng }));

    return () => socket.disconnect();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await api.put(`/orders/${id}/cancel`, { reason: 'Cancelled by customer' });
      toast.success('Order cancelled');
      navigate('/customer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await api.post(`/orders/${id}/verify-otp`, { otp });
      toast.success('🎉 Delivery confirmed!');
      setOrder(o => ({ ...o, status: 'delivered', otpVerified: true }));
    } catch {
      toast.error('Invalid OTP');
    }
  };

  const handleRate = async (rating) => {
    try {
      await api.post(`/orders/${id}/rate`, { rating });
      toast.success('Thanks for rating!');
      setOrder(o => ({ ...o, rating }));
    } catch {}
  };

  if (!order) return <div className="loading-screen"><div className="spinner" /><p>Loading order...</p></div>;

  const stepIndex = STEPS_ORDER.indexOf(order.status);
  const pkgInfo = getPackageInfo(order.packageType);

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-btn">←</button>
        <h2>Track Order</h2>
        <span className="tracking-badge">{order.trackingId}</span>
      </div>

      <LiveTrackingMap
        pickup={order.pickup}
        dropoff={order.dropoff}
        riderLocation={riderLocation || order.rider?.currentLocation}
      />

      <div className="status-card" style={{ borderColor: STATUS_COLORS[order.status] }}>
        <span className="status-icon">{STATUS_ICONS[order.status]}</span>
        <div>
          <h3>{STATUS_LABELS[order.status]}</h3>
          <p>~{order.estimatedTime} min estimated</p>
        </div>
        <span className="pkg-badge">{pkgInfo.icon} {pkgInfo.label}</span>
      </div>

      {order.status !== 'cancelled' && order.status !== 'delivered' && (
        <div className="progress-steps">
          {STEPS_ORDER.slice(0, -1).map((s, i) => (
            <div key={s} className={`progress-step ${i <= stepIndex ? 'done' : ''}`}>
              <div className="progress-dot" />
              <span>{STATUS_LABELS[s]}</span>
            </div>
          ))}
        </div>
      )}

      {order.rider && (
        <div className="rider-card">
          <div className="rider-info">
            <div className="rider-avatar">🛵</div>
            <div>
              <strong>{order.rider.name}</strong>
              <p>{order.rider.vehicleType} • {order.rider.vehicleNumber}</p>
              <div className="rating-stars">{'⭐'.repeat(Math.round(order.rider.rating || 0))}</div>
            </div>
          </div>
          <a href={`tel:${order.rider.phone}`} className="call-btn">📞 Call</a>
        </div>
      )}

      <div className="order-details-card">
        <div className="addr-row">
          <span className="addr-dot pickup-dot">●</span>
          <div><small>Pickup</small><p>{order.pickup.address}</p></div>
        </div>
        <div className="addr-row">
          <span className="addr-dot dropoff-dot">●</span>
          <div><small>Dropoff</small><p>{order.dropoff.address}</p></div>
        </div>
        <div className="order-meta">
          <span>{formatCurrency(order.price)}</span>
          <span>{order.distance} km</span>
          <span>{order.paymentMethod.toUpperCase()}</span>
        </div>
      </div>

      {order.status === 'on_the_way' && !order.otpVerified && (
        <div className="otp-section">
          <h3>🔐 Your OTP: <strong>{order.otp}</strong></h3>
          <p>Share this OTP with the rider only when they arrive</p>
          <button className="btn-secondary" onClick={() => setShowOtp(!showOtp)}>
            Verify Delivery Manually
          </button>
          {showOtp && (
            <div className="otp-verify">
              <input className="otp-input" placeholder="Enter OTP" value={otp}
                onChange={e => setOtp(e.target.value)} maxLength={4} />
              <button className="btn-primary" onClick={handleVerifyOtp}>Confirm</button>
            </div>
          )}
        </div>
      )}

      {order.status === 'delivered' && !order.rating && (
        <div className="rating-section">
          <h3>Rate your delivery</h3>
          <div className="star-buttons">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => handleRate(n)} className="star-btn">
                {n <= (order.rating || 0) ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>
      )}

      {['pending', 'accepted'].includes(order.status) && (
        <button className="btn-danger" onClick={handleCancel}>Cancel Order</button>
      )}
    </div>
  );
}
