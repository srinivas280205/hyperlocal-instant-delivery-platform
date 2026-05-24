import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const TABS = ['customer', 'rider'];

export default function AdminUsers() {
  const [tab, setTab] = useState('customer');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = (role) => {
    setLoading(true);
    api.get(`/admin/users?role=${role}`).then(res => setUsers(res.data.users)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(tab); }, [tab]);

  const toggleUser = async (userId, current) => {
    try {
      await api.put(`/admin/users/${userId}/toggle`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
      toast.success(current ? 'User disabled' : 'User enabled');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="page">
      <div className="page-header"><h2>User Management</h2></div>

      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'customer' ? '👤 Customers' : '🛵 Riders'}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div>
        : users.map(user => (
          <div key={user._id} className="admin-user-card">
            <div className="user-avatar-sm">{user.name?.charAt(0)}</div>
            <div className="user-details">
              <strong>{user.name}</strong>
              <p>{user.email}</p>
              <p>{user.phone}</p>
              {tab === 'rider' && <p>🛵 {user.vehicleType} • {user.vehicleNumber} • ⭐{user.rating?.toFixed(1)} • {user.totalDeliveries} deliveries</p>}
              <small>{formatDate(user.createdAt)}</small>
            </div>
            <div className="user-actions">
              <span className={`active-badge ${user.isActive ? 'active' : 'inactive'}`}>
                {user.isActive ? '● Active' : '● Inactive'}
              </span>
              <button className="toggle-btn" onClick={() => toggleUser(user._id, user.isActive)}>
                {user.isActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
