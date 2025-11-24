import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import NotificationsIcon from '@mui/icons-material/Notifications';

function StudentDashboard({ handleLogout }) {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [reportedItems, setReportedItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [borrowNotes, setBorrowNotes] = useState('');
  const [borrowQuantity, setBorrowQuantity] = useState(1);
  const [borrowPurpose, setBorrowPurpose] = useState('');
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowError, setBorrowError] = useState('');
  const [borrowSuccess, setBorrowSuccess] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchMyRequests();
    fetchItems();
    fetchReportedItems();
    fetchNotifications();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-borrow-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch borrow requests');
      const requests = await response.json();
      setMyRequests(requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/items', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      // Filter for items with quantity > 0 (available items)
      const availableItems = data.filter(item => item.quantity > 0);
      setItems(availableItems);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchReportedItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/reported-items', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch reported items');
      const data = await response.json();
      setReportedItems(data);
    } catch (err) {
      console.error('Error fetching reported items:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setNotifications(await response.json());
      }
    } catch (err) {
      // ignore
    }
  };

  const markNotificationRead = async (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    // Optionally, send a PATCH to backend to mark as read
  };

  const handleBorrow = (item) => {
    setSelectedItem(item);
    setBorrowNotes('');
    setBorrowError('');
    setBorrowSuccess('');
  };

  const confirmBorrow = async () => {
    if (!selectedItem) return;
    setBorrowLoading(true);
    setBorrowError('');
    setBorrowSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/items/${selectedItem.id}/borrow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: borrowNotes,
          quantity: borrowQuantity,
          purpose: borrowPurpose
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to borrow item');
      }
      setBorrowSuccess('Borrow request submitted!');
      fetchMyRequests();
      fetchItems();
      setTimeout(() => setSelectedItem(null), 1200);
    } catch (err) {
      setBorrowError(err.message);
      if (err.message.includes('Only') && err.message.includes('items are available')) {
        const availableQuantity = parseInt(err.message.match(/Only (\d+) items are available/)[1]);
        setBorrowQuantity(availableQuantity);
      }
    } finally {
      setBorrowLoading(false);
    }
  };

  // Show all available items (quantity > 0)
  const filteredItems = items.filter(item =>
    (item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(search.toLowerCase()))) &&
    (item.quantity > 0)
  );

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <button
              className="notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }}
              aria-label="Notifications"
            >
              <NotificationsIcon sx={{ fontSize: 28, color: '#4a90e2' }} />
              {notifications.some(n => !n.is_read) && (
                <span style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, background: 'green', borderRadius: '50%', display: 'inline-block', border: '2px solid white' }}></span>
              )}
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: 36, background: 'white', color: 'black', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', minWidth: 260, zIndex: 10 }}>
                <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 600 }}>Notifications</div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 12 }}>No notifications.</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      style={{ padding: 12, background: n.is_read ? 'white' : '#e8f5e9', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      <span>{n.message}</span>
                      {!n.is_read && <span style={{ marginLeft: 8, color: 'green', fontWeight: 700 }}>(new)</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="requests-container">
        <h2>My Borrow Requests</h2>
        {myRequests.length === 0 ? (
          <p>You haven't made any borrow requests yet.</p>
        ) : (
          <div className="requests-list">
            {myRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>{request.item_name}</h3>
                  <span className={`status-badge ${request.status}`} style={request.status === 'approved' ? { background: '#e8f5e9', color: '#2e7d32' } : request.status === 'partial' ? { background: '#fffde7', color: '#fbc02d' } : {}}>
                    {request.status === 'partial' ? 'Partial Returned' : request.status}
                  </span>
                </div>
                <div className="request-details">
                  <p><strong>Request Date:</strong> {new Date(request.request_date).toLocaleDateString()}</p>
                  {request.return_date && (
                    <p><strong>Return Date:</strong> {new Date(request.return_date).toLocaleDateString()}</p>
                  )}
                  <p><strong>Quantity Borrowed:</strong> {request.quantity || 1}</p>
                  {request.status === 'partial' && (
                    <p style={{color:'#fbc02d'}}><strong>Partially Returned</strong></p>
                  )}
                  {request.notes && <p><strong>Notes:</strong> {request.notes}</p>}
                </div>
                <div style={{marginTop: 10}}>
                  <button className="auth-button" onClick={() => setSelectedItem(request)} disabled>
                    View Details Only
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="requests-container">
        <h2>Available Items to Borrow</h2>
        <input
          type="text"
          placeholder="Search items by name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: 16, padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
        />
        <div className="requests-list">
          {filteredItems.length === 0 ? (
            <p>No items available for borrowing.</p>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="request-card">
                <div className="request-header">
                  <h3>{item.name}</h3>
                  {item.available > 0 ? (
                    <span className="status-badge status-pending">{item.status}</span>
                  ) : (
                    <span className="status-badge" style={{background: '#e0e0e0', color: '#666'}}>unavailable</span>
                  )}
                </div>
                <div className="request-details">
                  <p><strong>Location:</strong> {item.location}</p>
                  <p><strong>Date Registered:</strong> {item.date ? new Date(item.date).toLocaleDateString() : '-'}</p>
                  {item.available !== undefined && <p><strong>Available Quantity:</strong> {item.available}</p>}
                </div>
                {item.available > 0 ? (
                  <button className="auth-button" style={{marginTop: 10}} onClick={() => handleBorrow(item)}>
                    Borrow
                  </button>
                ) : (
                  <div style={{marginTop: 10, color: '#666', fontStyle: 'italic'}}>
                    Out of Stock
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Borrow Item: {selectedItem.name}</h2>
            <div className="request-details">
              <p><strong>Location:</strong> {selectedItem.location}</p>
              <p><strong>Date Registered:</strong> {selectedItem.date ? new Date(selectedItem.date).toLocaleDateString() : '-'}</p>
              {selectedItem.available !== undefined && <p><strong>Available Quantity:</strong> {selectedItem.available}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="borrowQuantity">Quantity</label>
              <input
                id="borrowQuantity"
                type="number"
                min="1"
                max={selectedItem.available || 1}
                value={borrowQuantity}
                onChange={e => setBorrowQuantity(Number(e.target.value))}
                style={{width: '100%'}}
              />
              <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
                Available quantity: {selectedItem.available || 1}
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="borrowPurpose">Purpose of Usage</label>
              <textarea
                id="borrowPurpose"
                value={borrowPurpose}
                onChange={e => setBorrowPurpose(e.target.value)}
                rows="2"
                style={{width: '100%'}}
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="borrowNotes">Notes (optional)</label>
              <textarea
                id="borrowNotes"
                value={borrowNotes}
                onChange={e => setBorrowNotes(e.target.value)}
                rows="3"
                style={{width: '100%'}}
              ></textarea>
            </div>
            {borrowError && <div className="error-message">{borrowError}</div>}
            {borrowSuccess && <div className="error-message" style={{color: 'green'}}>{borrowSuccess}</div>}
            <div className="modal-actions">
              <button className="update-btn" onClick={confirmBorrow} disabled={borrowLoading}>
                {borrowLoading ? 'Requesting...' : 'Confirm Borrow'}
              </button>
              <button className="cancel-btn" onClick={() => setSelectedItem(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard; 