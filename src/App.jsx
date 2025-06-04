import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import projectLogo from '/logo.png';
import './App.css';
import ReportSection from './ReportSection';
import SearchSection from './SearchSection';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import BorrowRequests from './components/BorrowRequests';
import SuperadminDashboard from './components/SuperadminDashboard';
import AdminInventory from './components/AdminInventory';
import Sidebar from './components/Sidebar';
import Logs from './components/Logs';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Token invalid');
          }
          return res.json();
        })
        .then(data => {
          setUser(data);
        })
        .catch(err => {
          console.error('Auth error:', err);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  // Protected route component
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    if (adminOnly && user.role !== 'admin') {
      return <Navigate to="/" />;
    }
    
    return children;
  };

  // Layout wrapper to show sidebar only when logged in and not on login/register
  function AppLayout({ children }) {
    const location = useLocation();
    const hideSidebar = ["/login", "/register"].includes(location.pathname);
    return (
      <div className="app-flex-layout">
        {!hideSidebar && user && (
          <Sidebar role={user.admin_role === 'superadmin' ? 'superadmin' : user.role} />
        )}
        <div className="main-content-area">
          {children}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout>
        <div className="logo-header">
    
          {user && (
            <div className="user-info">
              <span>Welcome, {user.username}</span>
                  {(user.admin_role !== 'admin' && user.admin_role !== 'superadmin' && user.admin_role !== 'Property Custodian') ? (
        <button onClick={handleLogout} className="logout-btn">
            Logout
        </button>
    ) : null}
            </div>
          )}
        </div>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={
            <ProtectedRoute>
              {user?.admin_role === 'superadmin' ? <Navigate to="/superadmin" />
                : user?.role === 'admin' 
                  ? <AdminDashboard handleLogout={handleLogout} /> 
                  : <StudentDashboard handleLogout={handleLogout} />}
            </ProtectedRoute>
          } />
          <Route path="/superadmin" element={
            <ProtectedRoute>
              {user?.admin_role === 'superadmin' ? <SuperadminDashboard handleLogout={handleLogout} /> : <Navigate to="/" />}
            </ProtectedRoute>
          } />
          <Route path="/admin-inventory" element={
            <ProtectedRoute adminOnly>
              <AdminInventory />
            </ProtectedRoute>
          } />
          <Route path="/student-report" element={
            <ProtectedRoute>
              {user?.role === 'student' ? <ReportSection /> : <Navigate to="/" />}
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute>
              <SearchSection />
            </ProtectedRoute>
          } />
          <Route path="/borrow-requests" element={
            <ProtectedRoute adminOnly>
              <BorrowRequests />
            </ProtectedRoute>
          } />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}



export default App;
