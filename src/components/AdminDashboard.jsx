import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function AdminDashboard({ handleLogout }) {
  const [stats, setStats] = useState({
    totalItems: 0,
    unclaimedItems: 0,
    borrowedItems: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState({ username: '', admin_role: '' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch user info
        const userRes = await fetch('http://localhost:3001/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
          const user = await userRes.json();
          setUserInfo({ username: user.username, admin_role: user.admin_role });
        }
        // Fetch items
        const response = await fetch('http://localhost:3001/api/items', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }
        const items = await response.json();
        // Count items by status
        const unclaimed = items.filter(item => item.status === 'unclaimed').length;
        const borrowed = items.filter(item => item.status === 'borrowed').length;
        // Fetch pending borrow requests
        const requestsResponse = await fetch('http://localhost:3001/api/borrow-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!requestsResponse.ok) {
          throw new Error('Failed to fetch borrow requests');
        }
        const requests = await requestsResponse.json();
        const pending = requests.filter(request => request.status === 'pending').length;
        setStats({
          totalItems: items.length,
          unclaimedItems: unclaimed,
          borrowedItems: borrowed,
          pendingRequests: pending
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      // Create a blob from the CSV data
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory.csv';
      
      // Append to the document, click it, and remove it
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-bg">
      <div className="dashboard-container" style={{ color: 'black' }}>
        <div className="dashboard-header">
          <div>
            <h1 style={{ color: 'black' }}>Admin Dashboard</h1>
            <div style={{ fontSize: 18, marginTop: 4, color: 'black' }}>
              <strong>{userInfo.username}</strong> <span style={{ fontWeight: 400 }}>(Role: {userInfo.admin_role || 'Admin'})</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Items</h3>
            <p className="stat-value">{stats.totalItems}</p>
          </div>
          <div className="stat-card">
            <h3>Unclaimed Items</h3>
            <p className="stat-value">{stats.unclaimedItems}</p>
          </div>
          <div className="stat-card">
            <h3>Borrowed Items</h3>
            <p className="stat-value">{stats.borrowedItems}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Requests</h3>
            <p className="stat-value">{stats.pendingRequests}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard; 