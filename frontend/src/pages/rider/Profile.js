import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function RiderProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    vehicleType: user?.vehicleType || '', vehicleNumber: user?.vehicleNumber || '',
  });

  const handleSave = async () => {
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="page">
      <div className="page-header"><h2>Rider Profile</h2></div>

      <div className="profile-card">
        <div className="profile-avatar rider-avatar-badge">🛵</div>
        <h3>{user?.name}</h3>
        <p>{user?.email}</p>
        <div className="rider-vehicle-badge">{user?.vehicleType} • {user?.vehicleNumber}</div>
        <div className="rating-display">⭐ {user?.rating?.toFixed(1) || '0.0'} ({user?.ratingCount || 0} ratings)</div>
      </div>

      <div className="info-card">
        {editing ? (
          <>
            <div className="form-group"><label>Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label>Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="form-group"><label>Vehicle Type</label>
              <select className="form-input" value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="bicycle">Bicycle</option>
              </select>
            </div>
            <div className="form-group"><label>Vehicle Number</label>
              <input className="form-input" value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} /></div>
            <div className="btn-row">
              <button className="btn-primary" onClick={handleSave}>Save</button>
              <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="info-row"><span>Name</span><strong>{user?.name}</strong></div>
            <div className="info-row"><span>Phone</span><strong>{user?.phone}</strong></div>
            <div className="info-row"><span>Vehicle</span><strong>{user?.vehicleType}</strong></div>
            <div className="info-row"><span>Number</span><strong>{user?.vehicleNumber}</strong></div>
            <div className="info-row"><span>Total Deliveries</span><strong>{user?.totalDeliveries || 0}</strong></div>
            <button className="btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
          </>
        )}
      </div>
      <button className="btn-danger" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
    </div>
  );
}
