import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import projectLogo from '/logo.png';
import './App.css';
import MobileApp from './components/MobileApp';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobilePage, setMobilePage] = useState('dashboard');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            // Token is invalid or expired
            throw new Error('Token invalid or expired');
          }
          return res.json();
        })
        .then(data => {
          setUser(data);
        })
        .catch(err => {
          console.error('Auth error:', err);
          // Clear invalid token
          localStorage.removeItem('token');
          setUser(null);
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

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      // Call backend logout endpoint
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage regardless of backend response
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  // Protected route component
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    if (adminOnly && (user.role !== 'admin' && user.role !== 'superadmin')) {
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
          <Sidebar role={user.role === 'superadmin' ? 'superadmin' : user.role} />
        )}
        <div className="main-content-area">
          {children}
        </div>
      </div>
    );
  }

  return (
    <Router>
      {isMobile && user ? (
        <MobileApp 
          user={user} 
          handleLogout={handleLogout}
          currentPage={mobilePage}
          onNavigate={setMobilePage}
        />
      ) : (
        <AppLayout>
          {/* <div className="logo-header">
      
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
          </div> */}
          <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={
            <ProtectedRoute>
              {user?.role === 'superadmin' ? <SuperadminDashboard handleLogout={handleLogout} />
                : user?.role === 'admin' 
                  ? <AdminDashboard handleLogout={handleLogout} />
                : user?.role === 'pending_admin'
                  ? <div style={{ padding: '40px', textAlign: 'center' }}>
                      <h2>Pending Approval</h2>
                      <p>Your admin request is pending approval from a superadmin.</p>
                      <p>You will have full access once approved.</p>
                      <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}>
                        Logout
                      </button>
                    </div>
                  : <StudentDashboard handleLogout={handleLogout} />}
            </ProtectedRoute>
          } />
          <Route path="/superadmin" element={
            <ProtectedRoute>
              {user?.role === 'superadmin' ? <SuperadminDashboard handleLogout={handleLogout} /> : <Navigate to="/" />}
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
      )}
    </Router>
  );
}



export default App;
