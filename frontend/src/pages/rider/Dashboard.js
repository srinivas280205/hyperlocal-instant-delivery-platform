import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatCurrency, getPackageInfo } from '../../utils/helpers';

export default function RiderDashboard() {
  const { user, updateUser } = useAuth();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [available, setAvailable] = useState(user?.isAvailable || false);
  const [stats, setStats] = useState({ deliveries: user?.totalDeliveries || 0, earnings: user?.totalEarnings || 0 });
  const socketRef = useRef(null);

  useEffect(() => {
    if (available) {
      api.get('/orders/pending').then(res => setPendingOrders(res.data.orders));
    }

    api.get('/orders/my').then(res => {
      const active = res.data.orders.find(o => ['accepted', 'picked_up', 'on_the_way'].includes(o.status));
      setActiveOrder(active || null);
    });

    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.on('new_order', ({ order }) => {
      if (available) {
        setPendingOrders(prev => [order, ...prev]);
        toast('📦 New delivery request nearby!', { icon: '🛵' });
      }
    });

    socket.on('order_cancelled', ({ orderId }) => {
      setPendingOrders(prev => prev.filter(o => o._id !== orderId));
      if (activeOrder?._id === orderId) { setActiveOrder(null); toast.error('Order was cancelled'); }
    });

    if (navigator.geolocation) {
      const watcher = navigator.geolocation.watchPosition(
        (pos) => socket.emit('update_location', { lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      );
      return () => { socket.disconnect(); navigator.geolocation.clearWatch(watcher); };
    }
    return () => socket.disconnect();
  }, [available]);

  const toggleAvailability = async () => {
    try {
      const { data } = await api.put('/auth/availability');
      setAvailable(data.isAvailable);
      updateUser({ ...user, isAvailable: data.isAvailable });
      toast.success(data.isAvailable ? '🟢 You are now online' : '🔴 You are now offline');
      if (data.isAvailable) api.get('/orders/pending').then(res => setPendingOrders(res.data.orders));
      else setPendingOrders([]);
    } catch { toast.error('Failed to update status'); }
  };

  const acceptOrder = async (orderId) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/accept`);
      setActiveOrder(data.order);
      setPendingOrders(prev => prev.filter(o => o._id !== orderId));
      toast.success('Order accepted!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to accept'); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      if (status === 'delivered') {
        setActiveOrder(null);
        setStats(s => ({ deliveries: s.deliveries + 1, earnings: s.earnings + (activeOrder.price * 0.8) }));
        toast.success('🎉 Delivery completed!');
      } else {
        setActiveOrder(o => ({ ...o, status }));
        toast.success('Status updated');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  const NEXT_STATUS = { accepted: 'picked_up', picked_up: 'on_the_way', on_the_way: 'delivered' };
  const STATUS_ACTIONS = { accepted: '📦 Mark Picked Up', picked_up: '🛵 On The Way', on_the_way: '✅ Mark Delivered' };

  return (
    <div className="page">
      <div className="rider-header">
        <div>
          <h2>Hi, {user?.name?.split(' ')[0]} 👋</h2>
          <p>{user?.vehicleType} • {user?.vehicleNumber}</p>
        </div>
        <button className={`availability-toggle ${available ? 'online' : 'offline'}`} onClick={toggleAvailability}>
          {available ? '🟢 Online' : '🔴 Offline'}
        </button>
      </div>

      <div className="rider-stats">
        <div className="stat-card">
          <strong>{stats.deliveries}</strong><span>Deliveries</span>
        </div>
        <div className="stat-card">
          <strong>{formatCurrency(Math.round(stats.earnings))}</strong><span>Earned</span>
        </div>
        <div className="stat-card">
          <strong>{user?.rating?.toFixed(1) || '0.0'}</strong><span>Rating ⭐</span>
        </div>
      </div>

      {activeOrder && (
        <div className="active-delivery-card">
          <h3>🛵 Active Delivery</h3>
          <div className="delivery-info">
            <p><strong>{getPackageInfo(activeOrder.packageType).icon} {activeOrder.packageType}</strong></p>
            <p>📍 {activeOrder.pickup.address}</p>
            <p>🏠 {activeOrder.dropoff.address}</p>
            <p>{activeOrder.distance} km • {formatCurrency(activeOrder.price)}</p>
            {activeOrder.pickup.contactPhone && (
              <a href={`tel:${activeOrder.pickup.contactPhone}`} className="call-btn">📞 Call Sender</a>
            )}
            {activeOrder.dropoff.contactPhone && (
              <a href={`tel:${activeOrder.dropoff.contactPhone}`} className="call-btn">📞 Call Receiver</a>
            )}
          </div>
          {NEXT_STATUS[activeOrder.status] && (
            <button className="btn-primary" onClick={() => updateStatus(activeOrder._id, NEXT_STATUS[activeOrder.status])}>
              {STATUS_ACTIONS[activeOrder.status]}
            </button>
          )}
          {activeOrder.status === 'on_the_way' && (
            <div className="otp-display">
              <p>Ask receiver for OTP to confirm delivery</p>
            </div>
          )}
        </div>
      )}

      {!activeOrder && available && (
        <div className="section">
          <h3>Nearby Requests ({pendingOrders.length})</h3>
          {pendingOrders.length === 0 ? (
            <div className="empty-state"><p>No delivery requests nearby</p><p>Stay online to receive requests</p></div>
          ) : pendingOrders.map(order => (
            <div key={order._id} className="request-card">
              <div className="request-top">
                <span className="pkg-icon">{getPackageInfo(order.packageType).icon}</span>
                <div>
                  <p><strong>{order.distance} km away</strong></p>
                  <p>{order.pickup.address.slice(0, 30)}...</p>
                  <p>→ {order.dropoff.address.slice(0, 30)}...</p>
                </div>
                <div className="request-earn">
                  <strong>{formatCurrency(Math.round(order.price * 0.8))}</strong>
                  <small>~{order.estimatedTime}min</small>
                </div>
              </div>
              <button className="btn-primary" onClick={() => acceptOrder(order._id)}>Accept</button>
            </div>
          ))}
        </div>
      )}

      {!available && (
        <div className="offline-notice">
          <p>You are offline. Go online to start receiving delivery requests.</p>
          <button className="btn-primary" onClick={toggleAvailability}>Go Online</button>
        </div>
      )}
    </div>
  );
}
