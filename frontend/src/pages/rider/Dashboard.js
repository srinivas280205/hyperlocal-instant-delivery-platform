import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatCurrency, getPackageInfo, STATUS_LABELS } from '../../utils/helpers';
import Chat from '../../components/Chat';

// Countdown timer hook
function useCountdown(seconds, active) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!active) { setLeft(seconds); return; }
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, active, seconds]);
  return left;
}

function RequestCard({ order, onAccept, onIgnore }) {
  const [active, setActive] = useState(true);
  const timeLeft = useCountdown(30, active);

  useEffect(() => {
    if (timeLeft <= 0) { setActive(false); onIgnore(order._id); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const pct = (timeLeft / 30) * 100;
  const color = timeLeft > 15 ? '#22c55e' : timeLeft > 8 ? '#f97316' : '#ef4444';

  return (
    <div className="request-card animated-in">
      {/* Timer ring */}
      <div className="timer-row">
        <div className="timer-ring" style={{ '--pct': `${pct}%`, '--color': color }}>
          <span style={{ color }}>{timeLeft}s</span>
        </div>
        <div className="request-pkg">
          <span className="pkg-icon-lg">{getPackageInfo(order.packageType).icon}</span>
          <div>
            <strong>{getPackageInfo(order.packageType).label}</strong>
            <p>{order.distance} km • ~{order.estimatedTime} min</p>
          </div>
        </div>
        <div className="request-earn">
          <strong>{formatCurrency(Math.round(order.price * 0.8))}</strong>
          <small>Your earnings</small>
        </div>
      </div>

      <div className="request-addrs">
        <div className="req-addr-line">
          <span className="dot green-dot" />
          <p>{order.pickup.address.slice(0, 45)}{order.pickup.address.length > 45 ? '...' : ''}</p>
        </div>
        <div className="req-addr-line">
          <span className="dot orange-dot" />
          <p>{order.dropoff.address.slice(0, 45)}{order.dropoff.address.length > 45 ? '...' : ''}</p>
        </div>
      </div>

      <div className="request-btns">
        <button className="btn-danger-outline" onClick={() => { setActive(false); onIgnore(order._id); }}>
          Ignore
        </button>
        <button className="btn-primary accept-btn" onClick={() => { setActive(false); onAccept(order._id); }}>
          ✓ Accept — {formatCurrency(Math.round(order.price * 0.8))}
        </button>
      </div>
    </div>
  );
}

export default function RiderDashboard() {
  const { user, updateUser } = useAuth();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [available, setAvailable] = useState(user?.isAvailable || false);
  const [stats, setStats] = useState({ deliveries: user?.totalDeliveries || 0, earnings: user?.totalEarnings || 0 });
  const [otpInput, setOtpInput] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (available) {
      api.get('/orders/pending').then(res => setPendingOrders(res.data.orders));
    }
    api.get('/orders/my').then(res => {
      const active = res.data.orders.find(o => ['accepted','picked_up','on_the_way'].includes(o.status));
      setActiveOrder(active || null);
    });

    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.on('new_order', ({ order }) => {
      if (available) {
        setPendingOrders(prev => [order, ...prev]);
        toast('📦 New delivery request!', { icon: '🛵', duration: 4000 });
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    });
    socket.on('order_cancelled', ({ orderId }) => {
      setPendingOrders(prev => prev.filter(o => o._id !== orderId));
      if (activeOrder?._id === orderId) { setActiveOrder(null); toast.error('Order was cancelled by customer'); }
    });
    socket.on('order_update', ({ order }) => {
      if (activeOrder?._id === order._id) setActiveOrder(order);
    });

    if (navigator.geolocation) {
      const watcher = navigator.geolocation.watchPosition(
        pos => socket.emit('update_location', { lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      );
      return () => { socket.disconnect(); navigator.geolocation.clearWatch(watcher); };
    }
    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  const toggleAvailability = async () => {
    try {
      const { data } = await api.put('/auth/availability');
      setAvailable(data.isAvailable);
      updateUser({ ...user, isAvailable: data.isAvailable });
      toast.success(data.isAvailable ? '🟢 You are now Online' : '🔴 You are Offline');
      if (data.isAvailable) api.get('/orders/pending').then(res => setPendingOrders(res.data.orders));
      else setPendingOrders([]);
    } catch { toast.error('Failed to update status'); }
  };

  const acceptOrder = async (orderId) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/accept`);
      setActiveOrder(data.order);
      setPendingOrders(prev => prev.filter(o => o._id !== orderId));
      toast.success('🎉 Order accepted! Head to pickup location.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to accept'); }
  };

  const ignoreOrder = (orderId) => {
    setPendingOrders(prev => prev.filter(o => o._id !== orderId));
  };

  const updateStatus = async (status) => {
    try {
      await api.put(`/orders/${activeOrder._id}/status`, { status });
      if (status === 'delivered') {
        setActiveOrder(null);
        setStats(s => ({ deliveries: s.deliveries + 1, earnings: s.earnings + activeOrder.price * 0.8 }));
        toast.success('🎉 Delivery completed! Great job!');
        setShowOtpInput(false);
        setOtpInput('');
      } else {
        setActiveOrder(o => ({ ...o, status }));
        toast.success(`Status: ${STATUS_LABELS[status]}`);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const handleOtpConfirm = async () => {
    if (otpInput.length < 4) return toast.error('Enter 4-digit OTP from receiver');
    setOtpLoading(true);
    try {
      await api.post(`/orders/${activeOrder._id}/verify-otp`, { otp: otpInput });
      toast.success('OTP verified! Mark as delivered.');
      await updateStatus('delivered');
    } catch {
      toast.error('Wrong OTP. Ask receiver again.');
    } finally { setOtpLoading(false); }
  };

  const openNavigation = (address) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  const NEXT_STATUS = { accepted: 'picked_up', picked_up: 'on_the_way' };
  const STATUS_ACTIONS = { accepted: '📦 Mark Picked Up', picked_up: '🛵 Start Delivery' };

  return (
    <div className="page">
      {/* Header */}
      <div className="rider-header">
        <div>
          <h2>Hi, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="vehicle-info">{user?.vehicleType} • {user?.vehicleNumber}</p>
        </div>
        <button className={`avail-toggle ${available ? 'online' : 'offline'}`} onClick={toggleAvailability}>
          <span className="avail-dot" />
          {available ? 'Online' : 'Offline'}
        </button>
      </div>

      {/* Stats */}
      <div className="rider-stats-row">
        <div className="stat-pill blue">
          <strong>{stats.deliveries}</strong>
          <span>Deliveries</span>
        </div>
        <div className="stat-pill green">
          <strong>{formatCurrency(Math.round(stats.earnings))}</strong>
          <span>Earned</span>
        </div>
        <div className="stat-pill orange">
          <strong>{user?.rating?.toFixed(1) || '0.0'} ⭐</strong>
          <span>Rating</span>
        </div>
      </div>

      {/* Active Delivery */}
      {activeOrder && (
        <div className="active-delivery-card">
          <div className="active-del-header">
            <span>🚀 Active Delivery</span>
            <span className="active-status-tag">{STATUS_LABELS[activeOrder.status]}</span>
          </div>

          <div className="active-del-body">
            <div className="del-addr-line">
              <span className="dot green-dot" />
              <div>
                <small>PICKUP • {activeOrder.pickup.contactName} • {activeOrder.pickup.contactPhone}</small>
                <p>{activeOrder.pickup.address}</p>
                <button className="nav-btn" onClick={() => openNavigation(activeOrder.pickup.address)}>
                  🗺️ Navigate
                </button>
              </div>
            </div>
            <div className="del-addr-line">
              <span className="dot orange-dot" />
              <div>
                <small>DROPOFF • {activeOrder.dropoff.contactName} • {activeOrder.dropoff.contactPhone}</small>
                <p>{activeOrder.dropoff.address}</p>
                <button className="nav-btn" onClick={() => openNavigation(activeOrder.dropoff.address)}>
                  🗺️ Navigate
                </button>
              </div>
            </div>
          </div>

          <div className="active-del-meta">
            <span>{getPackageInfo(activeOrder.packageType).icon} {getPackageInfo(activeOrder.packageType).label}</span>
            <span>📏 {activeOrder.distance} km</span>
            <span>💰 {formatCurrency(Math.round(activeOrder.price * 0.8))}</span>
          </div>

          {/* Call buttons */}
          <div className="call-row">
            {activeOrder.pickup.contactPhone && (
              <a href={`tel:${activeOrder.pickup.contactPhone}`} className="call-chip">
                📞 Call Sender
              </a>
            )}
            {activeOrder.dropoff.contactPhone && (
              <a href={`tel:${activeOrder.dropoff.contactPhone}`} className="call-chip">
                📞 Call Receiver
              </a>
            )}
          </div>

          {/* Status action buttons */}
          {NEXT_STATUS[activeOrder.status] && (
            <button className="btn-primary full-width" onClick={() => updateStatus(NEXT_STATUS[activeOrder.status])}>
              {STATUS_ACTIONS[activeOrder.status]}
            </button>
          )}

          {/* OTP confirm on delivery */}
          {activeOrder.status === 'on_the_way' && (
            <div className="otp-rider-section">
              <p>📋 Ask receiver for their <strong>OTP</strong> to confirm delivery</p>
              <button className="btn-outline" onClick={() => setShowOtpInput(!showOtpInput)}>
                {showOtpInput ? 'Hide OTP Entry' : '🔐 Enter Receiver OTP'}
              </button>
              {showOtpInput && (
                <div className="otp-entry-row">
                  <input
                    className="otp-input"
                    placeholder="4-digit OTP"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/, ''))}
                    maxLength={4}
                    type="number"
                  />
                  <button className="btn-primary" onClick={handleOtpConfirm} disabled={otpLoading}>
                    {otpLoading ? '...' : '✓ Confirm & Deliver'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chat */}
          <Chat
            orderId={activeOrder._id}
            socket={socketRef.current}
            otherName={activeOrder.customer?.name || 'Customer'}
          />
        </div>
      )}

      {/* Pending Requests */}
      {!activeOrder && available && (
        <div className="section">
          <div className="section-header">
            <h3>Nearby Requests</h3>
            <span className="count-badge">{pendingOrders.length}</span>
          </div>
          {pendingOrders.length === 0 ? (
            <div className="empty-state">
              <p>🛵 No requests nearby</p>
              <small>Stay online — requests will appear here</small>
            </div>
          ) : pendingOrders.map(order => (
            <RequestCard
              key={order._id}
              order={order}
              onAccept={acceptOrder}
              onIgnore={ignoreOrder}
            />
          ))}
        </div>
      )}

      {/* Offline notice */}
      {!available && !activeOrder && (
        <div className="offline-card">
          <div className="offline-icon">😴</div>
          <h3>You're Offline</h3>
          <p>Go online to start receiving delivery requests and earn money</p>
          <button className="btn-primary" onClick={toggleAvailability}>Go Online 🟢</button>
        </div>
      )}
    </div>
  );
}
