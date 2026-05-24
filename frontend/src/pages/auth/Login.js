import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'rider') navigate('/rider');
      else navigate('/customer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          <p>Hyperlocal Instant Delivery</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Sign In</h2>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="auth-link">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
          <div className="demo-accounts">
            <p>Demo accounts:</p>
            <button type="button" className="demo-btn" onClick={() => setForm({ email: 'admin@quickdrop.com', password: 'admin123' })}>Admin</button>
            <button type="button" className="demo-btn" onClick={() => setForm({ email: 'rider@quickdrop.com', password: 'rider123' })}>Rider</button>
            <button type="button" className="demo-btn" onClick={() => setForm({ email: 'user@quickdrop.com', password: 'user123' })}>Customer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
