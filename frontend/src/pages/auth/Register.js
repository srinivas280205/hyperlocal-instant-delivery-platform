import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role: 'customer', vehicleType: '', vehicleNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created successfully!');
      if (user.role === 'rider') navigate('/rider');
      else navigate('/customer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="app-logo">🛵</div>
          <h1>QuickDrop</h1>
          <p>Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Register</h2>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Your full name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="your@email.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" placeholder="10-digit phone number" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Min 6 characters" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>I want to</label>
            <div className="role-selector">
              <button type="button"
                className={`role-btn ${form.role === 'customer' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'customer' })}>
                📦 Send Packages
              </button>
              <button type="button"
                className={`role-btn ${form.role === 'rider' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'rider' })}>
                🛵 Deliver Packages
              </button>
            </div>
          </div>
          {form.role === 'rider' && (
            <>
              <div className="form-group">
                <label>Vehicle Type</label>
                <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })} required>
                  <option value="">Select vehicle</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="bicycle">Bicycle</option>
                </select>
              </div>
              <div className="form-group">
                <label>Vehicle Number</label>
                <input type="text" placeholder="e.g. TN01AB1234" value={form.vehicleNumber}
                  onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} />
              </div>
            </>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="auth-link">Already have an account? <Link to="/login">Sign In</Link></p>
        </form>
      </div>
    </div>
  );
}
