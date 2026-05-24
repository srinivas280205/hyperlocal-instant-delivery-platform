import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import CustomerHome from './pages/customer/Home';
import BookDelivery from './pages/customer/BookDelivery';
import TrackOrder from './pages/customer/TrackOrder';
import CustomerOrders from './pages/customer/Orders';
import CustomerProfile from './pages/customer/Profile';

import RiderDashboard from './pages/rider/Dashboard';
import RiderOrders from './pages/rider/Orders';
import RiderEarnings from './pages/rider/Earnings';
import RiderProfile from './pages/rider/Profile';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import AdminAnalytics from './pages/admin/Analytics';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'rider') return <Navigate to="/rider" replace />;
  return <Navigate to="/customer" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/customer" element={<ProtectedRoute role="customer"><Layout><CustomerHome /></Layout></ProtectedRoute>} />
          <Route path="/customer/book" element={<ProtectedRoute role="customer"><Layout><BookDelivery /></Layout></ProtectedRoute>} />
          <Route path="/customer/track/:id" element={<ProtectedRoute role="customer"><Layout><TrackOrder /></Layout></ProtectedRoute>} />
          <Route path="/customer/orders" element={<ProtectedRoute role="customer"><Layout><CustomerOrders /></Layout></ProtectedRoute>} />
          <Route path="/customer/profile" element={<ProtectedRoute role="customer"><Layout><CustomerProfile /></Layout></ProtectedRoute>} />

          <Route path="/rider" element={<ProtectedRoute role="rider"><Layout><RiderDashboard /></Layout></ProtectedRoute>} />
          <Route path="/rider/orders" element={<ProtectedRoute role="rider"><Layout><RiderOrders /></Layout></ProtectedRoute>} />
          <Route path="/rider/earnings" element={<ProtectedRoute role="rider"><Layout><RiderEarnings /></Layout></ProtectedRoute>} />
          <Route path="/rider/profile" element={<ProtectedRoute role="rider"><Layout><RiderProfile /></Layout></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute role="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><Layout><AdminUsers /></Layout></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute role="admin"><Layout><AdminOrders /></Layout></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><Layout><AdminAnalytics /></Layout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
