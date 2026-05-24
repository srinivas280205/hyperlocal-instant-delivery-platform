import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CustomerProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page">
      <div className="page-header"><h2>Profile</h2></div>

      <div className="profile-card">
        <div className="profile-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <h3>{user?.name}</h3>
        <p>{user?.email}</p>
        <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
      </div>

      <div className="info-card">
        {editing ? (
          <>
            <div className="form-group"><label>Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label>Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="form-group"><label>Address</label>
              <input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="btn-row">
              <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="info-row"><span>Name</span><strong>{user?.name}</strong></div>
            <div className="info-row"><span>Email</span><strong>{user?.email}</strong></div>
            <div className="info-row"><span>Phone</span><strong>{user?.phone}</strong></div>
            <div className="info-row"><span>Address</span><strong>{user?.address || 'Not set'}</strong></div>
            <button className="btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
          </>
        )}
      </div>

      <button className="btn-danger" onClick={handleLogout}>Logout</button>
    </div>
  );
}
