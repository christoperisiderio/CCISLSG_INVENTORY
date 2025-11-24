import { useState } from 'react';
import '../Mobile.css';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportIcon from '@mui/icons-material/Report';

export default function MobileApp({ user, handleLogout, currentPage, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);

  if (!user) return null;

  const renderMobileContent = () => {
    switch (currentPage) {
      case 'student':
        return <StudentMobileView user={user} />;
      case 'admin':
        return <AdminMobileView user={user} />;
      case 'superadmin':
        return <SuperadminMobileView user={user} />;
      case 'pending':
        return <PendingMobileView />;
      default:
        return <DashboardMobileView user={user} activeTab={activeTab} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="mobile-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <h1>CCISLSG</h1>
        <div className="mobile-header-right">
          {user.admin_role === 'superadmin' && (
            <span className="mobile-badge">Superadmin</span>
          )}
          {user.role === 'admin' && (
            <span className="mobile-badge">Admin</span>
          )}
          <button 
            className="mobile-logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="mobile-content">
        {renderMobileContent()}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <HomeIcon sx={{ fontSize: 24 }} />
          <span>Home</span>
        </button>
        <button 
          className={`mobile-nav-item ${currentPage === 'search' ? 'active' : ''}`}
          onClick={() => onNavigate('search')}
        >
          <SearchIcon sx={{ fontSize: 24 }} />
          <span>Search</span>
        </button>
        <button 
          className={`mobile-nav-item ${currentPage === 'requests' ? 'active' : ''}`}
          onClick={() => onNavigate('requests')}
        >
          <AssignmentIcon sx={{ fontSize: 24 }} />
          <span>Requests</span>
        </button>
        <button 
          className={`mobile-nav-item ${currentPage === 'report' ? 'active' : ''}`}
          onClick={() => onNavigate('report')}
        >
          <ReportIcon sx={{ fontSize: 24 }} />
          <span>Report</span>
        </button>
      </div>
    </div>
  );
}

function StudentMobileView({ user }) {
  return (
    <>
      <div className="mobile-hero">
        <h1>Welcome back!</h1>
        <p>Browse available items to borrow</p>
      </div>

      <div className="mobile-stats">
        <div className="mobile-stat-card">
          <h3>Borrowed</h3>
          <p className="mobile-stat-value">3</p>
        </div>
        <div className="mobile-stat-card">
          <h3>Pending</h3>
          <p className="mobile-stat-value">1</p>
        </div>
      </div>

      <div className="mobile-card">
        <h2>Quick Search</h2>
        <div className="mobile-search">
          <span>🔎</span>
          <input type="text" placeholder="Search items..." />
        </div>
      </div>

      <div className="mobile-card">
        <h2>Recent Borrows</h2>
        <div className="mobile-list">
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Projector</p>
              <p className="mobile-list-item-meta">Borrowed 2 days ago</p>
            </div>
            <span className="mobile-list-item-badge badge-approved">Active</span>
          </div>
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Laptop Stand</p>
              <p className="mobile-list-item-meta">Borrowed 5 days ago</p>
            </div>
            <span className="mobile-list-item-badge badge-pending">Pending Return</span>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminMobileView({ user }) {
  return (
    <>
      <div className="mobile-hero">
        <h1>Admin Panel</h1>
        <p>Manage inventory and requests</p>
      </div>

      <div className="mobile-stats">
        <div className="mobile-stat-card">
          <h3>Items</h3>
          <p className="mobile-stat-value">24</p>
        </div>
        <div className="mobile-stat-card">
          <h3>Requests</h3>
          <p className="mobile-stat-value">7</p>
        </div>
      </div>

      <div className="mobile-card">
        <h2>Pending Requests</h2>
        <div className="mobile-list">
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Camera Equipment</p>
              <p className="mobile-list-item-meta">From John Doe • Qty: 2</p>
            </div>
            <span className="mobile-list-item-badge badge-pending">Pending</span>
          </div>
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Sound System</p>
              <p className="mobile-list-item-meta">From Jane Smith • Qty: 1</p>
            </div>
            <span className="mobile-list-item-badge badge-pending">Pending</span>
          </div>
        </div>
      </div>

      <button className="mobile-button mobile-button-primary">
        <span>➕</span>
        View All Requests
      </button>
    </>
  );
}

function SuperadminMobileView({ user }) {
  return (
    <>
      <div className="mobile-hero">
        <h1>Superadmin 👑</h1>
        <p>System management and approvals</p>
      </div>

      <div className="mobile-stats">
        <div className="mobile-stat-card">
          <h3>Users</h3>
          <p className="mobile-stat-value">156</p>
        </div>
        <div className="mobile-stat-card">
          <h3>Admins</h3>
          <p className="mobile-stat-value">12</p>
        </div>
      </div>

      <div className="mobile-card">
        <h2>👥 Pending Admin Requests</h2>
        <div className="mobile-list">
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Alex Johnson</p>
              <p className="mobile-list-item-meta">Requested 1 day ago</p>
            </div>
            <span className="mobile-list-item-badge badge-pending">Review</span>
          </div>
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Maria Garcia</p>
              <p className="mobile-list-item-meta">Requested 3 days ago</p>
            </div>
            <span className="mobile-list-item-badge badge-pending">Review</span>
          </div>
        </div>
      </div>

      <button className="mobile-button mobile-button-primary">
        <span>👥</span>
        Manage Admins
      </button>
    </>
  );
}

function PendingMobileView() {
  return (
    <>
      <div className="mobile-empty-state" style={{ marginTop: '60px' }}>
        <div className="mobile-empty-state-icon">∅</div>
        <h3>Pending Approval</h3>
        <p>Your admin request is under review by superadmin</p>
        <p style={{ marginTop: '16px', fontSize: '0.85rem' }}>
          You'll get full access once approved
        </p>
      </div>
    </>
  );
}

function DashboardMobileView({ user, activeTab, setActiveTab }) {
  return (
    <>
      <div className="mobile-hero">
        <h1>Inventory System</h1>
        <p>Welcome to CCISLSG</p>
      </div>

      <div className="mobile-tabs">
        <button 
          className={`mobile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`mobile-tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Items
        </button>
        <button 
          className={`mobile-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="mobile-stats">
          <div className="mobile-stat-card">
            <h3>Total Items</h3>
            <p className="mobile-stat-value">48</p>
          </div>
          <div className="mobile-stat-card">
            <h3>Available</h3>
            <p className="mobile-stat-value">32</p>
          </div>
          <div className="mobile-stat-card">
            <h3>Borrowed</h3>
            <p className="mobile-stat-value">16</p>
          </div>
          <div className="mobile-stat-card">
            <h3>Users</h3>
            <p className="mobile-stat-value">156</p>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="mobile-list">
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Projector</p>
              <p className="mobile-list-item-meta">Available • 3 units</p>
            </div>
            <span className="mobile-list-item-badge badge-approved">In Stock</span>
          </div>
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Laptop</p>
              <p className="mobile-list-item-meta">Available • 5 units</p>
            </div>
            <span className="mobile-list-item-badge badge-approved">In Stock</span>
          </div>
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Camera</p>
              <p className="mobile-list-item-meta">Available • 2 units</p>
            </div>
            <span className="mobile-list-item-badge badge-pending">Low Stock</span>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="mobile-list">
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Projector Borrowed</p>
              <p className="mobile-list-item-meta">by John Doe • 2 hours ago</p>
            </div>
          </div>
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">Camera Returned</p>
              <p className="mobile-list-item-meta">by Jane Smith • 5 hours ago</p>
            </div>
          </div>
          <div className="mobile-list-item">
            <div className="mobile-list-item-left">
              <p className="mobile-list-item-title">New Item Added</p>
              <p className="mobile-list-item-meta">Laptop Stand • 1 day ago</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
