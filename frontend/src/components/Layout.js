import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_LINKS = {
  customer: [
    { to: '/customer', label: 'Home', icon: '🏠' },
    { to: '/customer/book', label: 'Send', icon: '📦' },
    { to: '/customer/orders', label: 'Orders', icon: '📋' },
    { to: '/customer/profile', label: 'Profile', icon: '👤' },
  ],
  rider: [
    { to: '/rider', label: 'Dashboard', icon: '🏠' },
    { to: '/rider/orders', label: 'Requests', icon: '📋' },
    { to: '/rider/earnings', label: 'Earnings', icon: '💰' },
    { to: '/rider/profile', label: 'Profile', icon: '👤' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: '📊' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/orders', label: 'Orders', icon: '📋' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = NAV_LINKS[user?.role] || [];

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="app-name">🛵 QuickDrop</span>
        </div>
        <div className="top-bar-right">
          <span className="user-name">{user?.name}</span>
          <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>
      <main className="main-content">{children}</main>
      <nav className="bottom-nav">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-item ${location.pathname === link.to ? 'active' : ''}`}
          >
            <span className="nav-icon">{link.icon}</span>
            <span className="nav-label">{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
