import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const ADMIN_ROLES = [
  'Property Custodian',
  'Director for Talents',
  'Graphics',
  'Technical',
  // Add more roles as needed
];

function SuperadminDashboard({ handleLogout }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [roleModal, setRoleModal] = useState({ open: false, userId: null });
  const [selectedRole, setSelectedRole] = useState(ADMIN_ROLES[0]);
  const [customRole, setCustomRole] = useState('');
  const [admins, setAdmins] = useState([]);
  const [editModal, setEditModal] = useState({ open: false, admin: null });
  const [editRole, setEditRole] = useState(ADMIN_ROLES[0]);
  const [editCustomRole, setEditCustomRole] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchAdmins();
    // eslint-disable-next-line
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch admin requests');
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admins/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setAdmins(await response.json());
      }
    } catch (err) {
      // ignore
    }
  };

  const handleApprove = (id) => {
    setRoleModal({ open: true, userId: id });
    setSelectedRole(ADMIN_ROLES[0]);
    setCustomRole('');
  };

  const handleConfirmApprove = async () => {
    setActionMessage('');
    setError('');
    const admin_role = customRole.trim() ? customRole.trim() : selectedRole;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin-requests/${roleModal.userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'approve', admin_role })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update request');
      setActionMessage(data.message);
      setRoleModal({ open: false, userId: null });
      fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (id) => {
    setActionMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reject' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update request');
      setActionMessage(data.message);
      fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (admin) => {
    setEditModal({ open: true, admin });
    setEditRole(admin.admin_role || ADMIN_ROLES[0]);
    setEditCustomRole('');
  };

  const handleEditRole = async () => {
    const admin_role = editCustomRole.trim() ? editCustomRole.trim() : editRole;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admins/${editModal.admin.id}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_role })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update admin role');
      setActionMessage(data.message);
      setEditModal({ open: false, admin: null });
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading admin requests...</div>;
  }

  return (
    <div className="dashboard-bg superadmin-bg">
      <div className="superadmin-nav">
        <div className="superadmin-logo">
          <span>CCISLSG Superadmin</span>
        </div>
        <div style={{marginTop: 24}}>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div className="dashboard-container superadmin-content">
        <div className="dashboard-header">
          <h1>Pending Admin Requests</h1>
        </div>
        {error && <div className="error-message">{error}</div>}
        {actionMessage && <div className="success-message" style={{color: 'green'}}>{actionMessage}</div>}
        <div className="requests-container">
          {requests.length === 0 ? (
            <div className="no-items-message">No pending admin requests.</div>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Student ID</th>
                  <th>Requested At</th>
                  <th>Assigned Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td>{req.username}</td>
                    <td>{req.email}</td>
                    <td>{req.student_id || '-'}</td>
                    <td>{new Date(req.created_at).toLocaleString()}</td>
                    <td>{req.admin_role || '-'}</td>
                    <td>
                      <button className="update-btn" onClick={() => handleApprove(req.id)}>Approve</button>
                      <button className="cancel-btn" onClick={() => handleReject(req.id)}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="requests-container" style={{marginTop: 32, color: 'black'}}>
          <h2 style={{color: 'black'}}>Current Admins</h2>
          {admins.length === 0 ? (
            <div className="no-items-message">No admins found.</div>
          ) : (
            <table className="requests-table" style={{color: 'black'}}>
              <thead>
                <tr>
                  <th style={{color: 'black'}}>Username</th>
                  <th style={{color: 'black'}}>Email</th>
                  <th style={{color: 'black'}}>Admin Role</th>
                  <th style={{color: 'black'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id}>
                    <td style={{color: 'black'}}>{admin.username}</td>
                    <td style={{color: 'black'}}>{admin.email}</td>
                    <td style={{color: 'black'}}>{admin.admin_role || '-'}</td>
                    <td style={{color: 'black'}}>
                      <button className="update-btn" onClick={() => openEditModal(admin)}>Edit Role</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {editModal.open && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Edit Admin Role</h2>
              <div className="form-group">
                <label>Select a role:</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                  {ADMIN_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Or enter a custom role:</label>
                <input
                  type="text"
                  value={editCustomRole}
                  onChange={e => setEditCustomRole(e.target.value)}
                  placeholder="Custom admin role"
                />
              </div>
              <div className="modal-actions">
                <button className="update-btn" onClick={handleEditRole}>Save</button>
                <button className="cancel-btn" onClick={() => setEditModal({ open: false, admin: null })}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {roleModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Assign Admin Role</h2>
            <div className="form-group">
              <label>Select a role:</label>
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                {ADMIN_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Or enter a custom role:</label>
              <input
                type="text"
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
                placeholder="Custom admin role"
              />
            </div>
            <div className="modal-actions">
              <button className="update-btn" onClick={handleConfirmApprove}>Confirm</button>
              <button className="cancel-btn" onClick={() => setRoleModal({ open: false, userId: null })}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperadminDashboard; 