import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { STATUS_COLORS, STATUS_ICONS, STATUS_LABELS, formatCurrency, getPackageInfo, formatDate } from '../../utils/helpers';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import Chat from '../../components/Chat';

const STEPS_ORDER = ['pending', 'accepted', 'picked_up', 'on_the_way', 'delivered'];

const STEP_MESSAGES = {
  pending:    'Looking for a nearby rider...',
  accepted:   'Rider is heading to pickup location',
  picked_up:  'Package collected — on the way!',
  on_the_way: 'Rider is almost there',
  delivered:  'Successfully delivered 🎉',
  cancelled:  'This order was cancelled',
};

export default function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.order))
      .catch(() => toast.error('Order not found'));

    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.emit('join_order_room', id);

    socket.on('order_update', ({ order: updated }) => {
      setOrder(updated);
      toast.success(`Status: ${STATUS_LABELS[updated.status]}`);
      // vibrate on mobile
      if (navigator.vibrate) navigator.vibrate(200);
    });

    socket.on(`rider_location_${order?.rider?._id}`, ({ lat, lng }) => {
      setRiderLocation({ lat, lng });
    });

    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await api.put(`/orders/${id}/cancel`, { reason: 'Cancelled by customer' });
      toast.success('Order cancelled');
      navigate('/customer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel now');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) return toast.error('Enter 4-digit OTP');
    setOtpLoading(true);
    try {
      await api.post(`/orders/${id}/verify-otp`, { otp });
      toast.success('🎉 Delivery confirmed!');
      setOrder(o => ({ ...o, status: 'delivered', otpVerified: true }));
    } catch {
      toast.error('Wrong OTP. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRate = async (rating) => {
    try {
      await api.post(`/orders/${id}/rate`, { rating });
      toast.success('Thanks for rating! ⭐');
      setOrder(o => ({ ...o, rating }));
    } catch {}
  };

  const handleReorder = () => {
    navigate('/customer/book');
    toast('Tip: Set the same locations again!', { icon: '📦' });
  };

  if (!order) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading order...</p>
    </div>
  );

  const stepIndex = STEPS_ORDER.indexOf(order.status);
  const pkgInfo = getPackageInfo(order.packageType);
  const isActive = !['delivered', 'cancelled'].includes(order.status);

  return (
    <div className="page track-page">
      {/* Header is handled by Layout back button */}
      <div className="page-header track-header">
        <div>
          <h2>Track Order</h2>
          <span className="tracking-badge">{order.trackingId}</span>
        </div>
        <span className="status-badge-lg" style={{ background: STATUS_COLORS[order.status] }}>
          {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Map */}
      <LiveTrackingMap
        pickup={order.pickup}
        dropoff={order.dropoff}
        riderLocation={riderLocation || (order.rider?.currentLocation?.lat ? order.rider.currentLocation : null)}
      />

      {/* Status message */}
      <div className="status-message-bar" style={{ borderLeft: `4px solid ${STATUS_COLORS[order.status]}` }}>
        <span className="status-icon-lg">{STATUS_ICONS[order.status]}</span>
        <div>
          <p className="status-msg-text">{STEP_MESSAGES[order.status]}</p>
          {isActive && <small>Est. {order.estimatedTime} min remaining</small>}
          {!isActive && order.status === 'delivered' && <small>{formatDate(order.updatedAt)}</small>}
        </div>
      </div>

      {/* Progress Steps */}
      {order.status !== 'cancelled' && (
        <div className="progress-track">
          {STEPS_ORDER.map((s, i) => (
            <div key={s} className={`progress-node ${i <= stepIndex ? 'done' : ''} ${i === stepIndex ? 'current' : ''}`}>
              <div className="progress-circle">{i < stepIndex ? '✓' : i + 1}</div>
              <span>{STATUS_LABELS[s]}</span>
              {i < STEPS_ORDER.length - 1 && <div className={`progress-line ${i < stepIndex ? 'done' : ''}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Rider Card */}
      {order.rider && (
        <div className="rider-info-card">
          <div className="rider-avatar-circle">🛵</div>
          <div className="rider-details">
            <strong>{order.rider.name}</strong>
            <p>{order.rider.vehicleType} • {order.rider.vehicleNumber}</p>
            <div className="mini-stars">{'⭐'.repeat(Math.round(order.rider.rating || 0))}<span> {order.rider.rating?.toFixed(1) || '0.0'}</span></div>
          </div>
          <div className="rider-actions">
            <a href={`tel:${order.rider.phone}`} className="icon-btn call-icon">📞</a>
          </div>
        </div>
      )}

      {/* OTP Section */}
      {order.status === 'on_the_way' && !order.otpVerified && (
        <div className="otp-card">
          <div className="otp-header">
            <span>🔐</span>
            <div>
              <h3>Your Delivery OTP</h3>
              <p>Share with rider only when they arrive</p>
            </div>
          </div>
          <div className="otp-code">{order.otp}</div>
          <button className="btn-outline" onClick={() => setShowOtp(!showOtp)}>
            {showOtp ? 'Hide Manual Entry' : 'Enter OTP Manually'}
          </button>
          {showOtp && (
            <div className="otp-manual">
              <input
                className="otp-input"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/, ''))}
                maxLength={4}
                type="number"
              />
              <button className="btn-primary" onClick={handleVerifyOtp} disabled={otpLoading}>
                {otpLoading ? 'Verifying...' : 'Confirm Delivery ✓'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Details */}
      <div className="order-detail-card">
        <h3>{pkgInfo.icon} {pkgInfo.label} Package</h3>
        <div className="detail-addr">
          <div className="addr-line">
            <span className="dot green-dot" />
            <div><small>Pickup • {order.pickup.contactName}</small><p>{order.pickup.address}</p></div>
          </div>
          <div className="addr-connector" />
          <div className="addr-line">
            <span className="dot orange-dot" />
            <div><small>Dropoff • {order.dropoff.contactName}</small><p>{order.dropoff.address}</p></div>
          </div>
        </div>
        <div className="order-meta-row">
          <span>💰 {formatCurrency(order.price)}</span>
          <span>📏 {order.distance} km</span>
          <span>💳 {order.paymentMethod?.toUpperCase()}</span>
          <span>{order.deliverySpeed === 'express' ? '⚡ Express' : '🚴 Standard'}</span>
        </div>
      </div>

      {/* Rating after delivery */}
      {order.status === 'delivered' && (
        <div className="rating-card">
          {!order.rating ? (
            <>
              <h3>How was your delivery?</h3>
              <p>Rate {order.rider?.name}</p>
              <div className="star-row">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    className="star-btn-lg"
                    onMouseEnter={() => setHoveredStar(n)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => handleRate(n)}
                  >
                    {n <= (hoveredStar || order.rating || 0) ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="rated-msg">
              <p>You rated this delivery {'⭐'.repeat(order.rating)}</p>
              <small>Thank you for your feedback!</small>
            </div>
          )}
          <button className="btn-secondary mt-12" onClick={handleReorder}>📦 Book Again</button>
        </div>
      )}

      {/* Cancel */}
      {['pending', 'accepted'].includes(order.status) && (
        <button className="btn-danger" onClick={handleCancel}>✕ Cancel Order</button>
      )}

      {/* Chat — only when rider is assigned */}
      {order.rider && isActive && (
        <Chat
          orderId={id}
          socket={socketRef.current}
          otherName={order.rider.name}
        />
      )}
    </div>
  );
}
