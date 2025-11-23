import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const ORANGE = '#FF8800';
const SIDEBAR_BG = '#23272f';
const ICON_SIZE = 22;
const ACTIVE_COLOR = '#000'; // black for selected

const navConfig = {
  student: [
    { label: 'Dashboard', to: '/', icon: '🏠' },
    { label: 'Search', to: '/search', icon: '🔍' },
    { label: 'Report Lost Item', to: '/student-report', icon: '📝' },
  ],
  admin: [
    { label: 'Dashboard', to: '/', icon: '🏠' },
    { label: 'Inventory', to: '/admin-inventory', icon: '📦' },
    { label: 'Borrow Requests', to: '/borrow-requests', icon: '📄' },
    { label: 'Logs', to: '/logs', icon: '📜' },
    { label: 'Export Inventory CSV', to: '/export-ccislsg', icon: '⬇️', isExport: true },
  ],
  superadmin: [
    { label: 'Admin Requests', to: '/superadmin', icon: '🛡️' },
  ],
};

function Sidebar({ role }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navItems = navConfig[role] || [];

  const handleExport = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/export-ccislsg', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to export CSV');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ccislsg_inventory.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  return (
    <aside
      className={`sidebar${collapsed ? ' collapsed' : ''}`}
      style={{ background: SIDEBAR_BG }}
    >
      <div className="sidebar-header">
        <button
          className="collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '»' : '«'}
        </button>
        {!collapsed && <span className="sidebar-title">CCISLSG</span>}
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isDashboard = item.to === '/';
          const isActive = isDashboard
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to) && item.to !== '/';
          if (item.isExport) {
            return (
              <a
                key={item.to}
                href="#"
                className={`sidebar-link${isActive ? ' active' : ''}`}
                onClick={handleExport}
                style={{
                  color: isActive ? 'ACTIVE_COLOR' : '#fff',
                  background: isActive ? '#fff2e0' : 'transparent',
                }}
              >
                <span className="sidebar-icon" style={{ fontSize: ICON_SIZE }}>{item.icon}</span>
                {!collapsed && <span className="sidebar-label">{item.label}</span>}
              </a>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link${isActive ? ' active' : ''}`}
              style={{
                color: isActive ? ACTIVE_COLOR : '#fff',
                background: isActive ? '#fff2e0' : 'transparent',
              }}
            >
              <span className="sidebar-icon" style={{ fontSize: ICON_SIZE }}>{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar; 