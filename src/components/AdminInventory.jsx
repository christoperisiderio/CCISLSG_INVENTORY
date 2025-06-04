import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const AdminInventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    quantity: '',
    description: '',
    photo: null,
    type: 'CCISLSG' // Default type is always CCISLSG for admin inventory
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [logs, setLogs] = useState([]);

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Create axios instance with auth header
  const createAuthAxios = () => {
    const token = getToken();
    return axios.create({
      baseURL: 'http://localhost:3001',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };

  useEffect(() => {
    fetchItems();
    fetchLogs();
  }, []);

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      setDebugInfo('Fetching items...');
      
      const authAxios = createAuthAxios();
      const response = await authAxios.get('/api/items');
      
      setDebugInfo(`Fetched ${response.data.length} items`);
      setItems(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching items:', err);
      if (err.response && err.response.status === 403) {
        setError('Authentication error. Please log in again.');
        // Redirect to login page or handle authentication error
        // window.location.href = '/login';
      } else {
        setError(`Failed to fetch items: ${err.message}`);
      }
      setDebugInfo(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setLogs(response.data);
    } catch (err) {
      // Optionally handle error
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddItem = () => {
    setFormData({
      name: '',
      date: '',
      location: '',
      quantity: '',
      description: '',
      photo: null,
      type: 'CCISLSG' // Always set to CCISLSG for new items
    });
    setShowAddForm(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      date: item.date,
      location: item.location,
      quantity: item.quantity,
      description: item.description || '',
      photo: null,
      type: 'CCISLSG' // Always set to CCISLSG for edited items
    });
    setShowEditForm(true);
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const authAxios = createAuthAxios();
        await authAxios.delete(`/api/items/${id}`);
        setSuccess('Item deleted successfully');
        fetchItems();
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setError('Authentication error. Please log in again.');
        } else {
          setError(`Failed to delete item: ${err.message}`);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const authAxios = createAuthAxios();
      
      if (showAddForm) {
        await authAxios.post('/api/items', formDataToSend);
        setFormSuccess('Item added successfully');
      } else {
        await authAxios.put(`/api/items/${selectedItem.id}`, formDataToSend);
        setFormSuccess('Item updated successfully');
      }
      setShowAddForm(false);
      setShowEditForm(false);
      fetchItems();
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setFormError('Authentication error. Please log in again.');
      } else {
        setFormError(err.response?.data?.message || `Operation failed: ${err.message}`);
      }
    }
    setFormLoading(false);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to determine item type label
  const getItemTypeLabel = (item) => {
    if (item.type === 'LOST-ITEM') {
      return <span className="item-label lost-item">LOST-ITEM</span>;
    } else {
      return <span className="item-label ccislsg">CCISLSG</span>;
    }
  };

  return (
    <div className="admin-inventory" style={{ display: 'flex', gap: 100 }}>
      <div style={{ flex: 1 }}>
        <div className="admin-inventory">
          <div className="inventory-header">
            <div className="header-left">
              <button className="back-button" onClick={handleBack}>
                ← Back
              </button>
              <h2>Inventory Management</h2>
            </div>
            <button className="add-item-button" onClick={handleAddItem}>
              Add New Item
            </button>
          </div>

          {debugInfo && <div className="debug-info">{debugInfo}</div>}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {loading ? (
            <div className="loading-message">Loading inventory items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="no-items-message">
              {searchQuery ? 'No items match your search criteria.' : 'No items in inventory.'}
            </div>
          ) : (
            <div className="items-grid">
              {filteredItems.map(item => (
                <div key={item.id} className="item-card">
                  {item.photo && (
                    <img src={`http://localhost:3001/uploads/${item.photo}`} alt={item.name} className="item-photo" />
                  )}
                  <div className="item-details">
                    <div className="item-header">
                      <h3>{item.name}</h3>
                      {getItemTypeLabel(item)}
                    </div>
                    <p>Location: {item.location}</p>
                    <p>Quantity (Registered): {item.quantity}</p>
                    <p>Currently Borrowed: {item.total_borrowed || 0}</p>
                    <p>Available: {item.quantity - (item.total_borrowed || 0)}</p>
                    <p>Date: {new Date(item.date).toLocaleDateString()}</p>
                    {item.description && <p>Description: {item.description}</p>}
                  </div>
                  <div className="item-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEditItem(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(showAddForm || showEditForm) && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>{showAddForm ? 'Add New Item' : 'Edit Item'}</h3>
                {formError && <div className="error-message">{formError}</div>}
                {formSuccess && <div className="success-message">{formSuccess}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Name:</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date:</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Location:</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity:</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Photo:</label>
                    <input
                      type="file"
                      onChange={(e) => setFormData({...formData, photo: e.target.files[0]})}
                      accept="image/*"
                    />
                    {selectedItem?.photo && (
                      <div className="current-photo">
                        <p>Current photo:</p>
                        <img src={`http://localhost:3001/uploads/${selectedItem.photo}`} alt="Current" style={{maxWidth: '100px'}} />
                      </div>
                    )}
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setShowAddForm(false);
                        setShowEditForm(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={formLoading}
                    >
                      {formLoading ? 'Saving...' : (showAddForm ? 'Add Item' : 'Update Item')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Logs Sidebar */}
      <div style={{ width: 340, minWidth: 260, background: '#f7faff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 18, height: 'fit-content', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, color: '#4a90e2' }}>Recent Logs</h3>
        {logs.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic' }}>No recent activity.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {logs.map((log, idx) => (
              <li key={idx} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ fontWeight: 600, color: '#333' }}>
                  {log.action === 'borrow' && 'Borrowed'}
                  {log.action === 'add_inventory' && 'Inventory Added'}
                  {log.action === 'report_lost' && 'Lost Item Reported'}
                </div>
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
    </div>
  );
};

export default AdminInventory; 