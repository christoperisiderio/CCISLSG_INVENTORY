import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const actionLabels = {
  borrow: 'Borrowed',
  add_inventory: 'Inventory Added',
  report_lost: 'Lost Item Reported',
};

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/logs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch logs');
      setLogs(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: 700 }}>
      <h1 style={{ color: '#4a90e2', marginBottom: 24 }}>Recent Logs</h1>
      {loading ? (
        <div className="loading">Loading logs...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : logs.length === 0 ? (
        <div style={{ color: '#888', fontStyle: 'italic' }}>No recent activity.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {logs.map((log, idx) => (
            <li key={idx} style={{ marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ fontWeight: 600, color: '#333' }}>{actionLabels[log.action] || log.action}</div>
              <div style={{ fontSize: 14, color: '#555' }}>
                <span><strong>User:</strong> {log.username} ({log.role})</span><br />
                <span><strong>Item:</strong> {log.item_name}</span><br />
                <span><strong>Quantity:</strong> {log.quantity}</span><br />
                <span><strong>Date:</strong> {log.date ? new Date(log.date).toLocaleString() : '-'}</span>
                {log.status && <><br /><span><strong>Status:</strong> {log.status}</span></>}
                {log.return_date && <><br /><span><strong>Return Date:</strong> {log.return_date ? new Date(log.return_date).toLocaleDateString() : '-'}</span></>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Logs; 