import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory2';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArticleIcon from '@mui/icons-material/Article';
import GetAppIcon from '@mui/icons-material/GetApp';
import SecurityIcon from '@mui/icons-material/Security';

const ORANGE = '#FF8800';
const SIDEBAR_BG = '#23272f';
const ICON_COLOR = '#fff';
const ICON_SIZE = 24;
const ACTIVE_COLOR = '#000'; // black for selected

const navConfig = {
  student: [
    { label: 'Dashboard', to: '/', icon: DashboardIcon },
    { label: 'Search', to: '/search', icon: SearchIcon },
  ],
  admin: [
    { label: 'Dashboard', to: '/', icon: DashboardIcon },
    { label: 'Inventory', to: '/admin-inventory', icon: InventoryIcon },
    { label: 'Borrow Requests', to: '/borrow-requests', icon: AssignmentIcon },
    { label: 'Lost Items', to: '/admin-lost-items', icon: FolderSpecialIcon },
    { label: 'Claim Requests', to: '/admin-claim-requests', icon: CheckCircleIcon },
    { label: 'Logs', to: '/logs', icon: ArticleIcon },
    { label: 'Export Inventory CSV', to: '/export-ccislsg', icon: GetAppIcon, isExport: true },
  ],
  superadmin: [
    { label: 'Admin Requests', to: '/superadmin', icon: SecurityIcon },
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
          const IconComponent = item.icon;
          if (item.isExport) {
            return (
              <a
                key={item.to}
                href="#"
                className={`sidebar-link${isActive ? ' active' : ''}`}
                onClick={handleExport}
                style={{
                  color: isActive ? ACTIVE_COLOR : '#fff',
                  background: isActive ? '#fff2e0' : 'transparent',
                }}
              >
                <IconComponent sx={{ fontSize: ICON_SIZE, color: isActive ? ACTIVE_COLOR : ICON_COLOR }} />
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
              <IconComponent sx={{ fontSize: ICON_SIZE, color: isActive ? ACTIVE_COLOR : ICON_COLOR }} />
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar; 