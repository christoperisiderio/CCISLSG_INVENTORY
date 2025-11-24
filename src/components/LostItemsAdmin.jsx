import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function LostItemsAdmin() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: '',
    photo: null,
  });

  const [updateData, setUpdateData] = useState({
    status: '',
    claimed_by_user: '',
    claim_notes: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/reported-items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      name: '',
      date: '',
      location: '',
      description: '',
      photo: null,
    });
    setShowAddForm(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setUpdateData({
      status: item.status || 'unclaimed',
      claimed_by_user: item.claimed_by_user || '',
      claim_notes: item.claim_notes || '',
    });
    setShowUpdateForm(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('date', formData.date);
    data.append('location', formData.location);
    data.append('description', formData.description);
    if (formData.photo) {
      data.append('photo', formData.photo);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/reported-items', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data,
      });

      if (response.ok) {
        setSuccess('Lost item reported successfully');
        setShowAddForm(false);
        fetchItems();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to report item');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/reported-items/${selectedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSuccess('Lost item updated successfully');
        setShowUpdateForm(false);
        fetchItems();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update item');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="loading">Loading lost items...</div>;
  }

  return (
    <div className="admin-inventory" style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div className="admin-inventory">
          <div className="inventory-header">
            <div className="header-left">
              <button className="back-button" onClick={handleBack}>
                ← Back
              </button>
              <h2>Lost Items Management</h2>
            </div>
            <button className="add-item-button" onClick={handleAddItem}>
              Report Lost Item
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
            >
              <option value="">All Status</option>
              <option value="unclaimed">Unclaimed</option>
              <option value="claimed">Claimed</option>
              <option value="surrendered">Surrendered to Owner</option>
            </select>
          </div>

          {filteredItems.length === 0 ? (
            <div className="no-items-message">No lost items found.</div>
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
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          background:
                            item.status === 'unclaimed'
                              ? '#fff3cd'
                              : item.status === 'claimed'
                              ? '#d1ecf1'
                              : '#d4edda',
                          color: '#000',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {item.status || 'unclaimed'}
                      </span>
                    </div>
                    <p>Location: {item.location}</p>
                    <p>Date Lost: {new Date(item.date).toLocaleDateString()}</p>
                    {item.description && <p>Description: {item.description}</p>}
                    {item.claimed_by_user && <p>Claimed By: {item.claimed_by_user}</p>}
                    {item.claim_notes && <p>Notes: {item.claim_notes}</p>}
                  </div>
                  <div className="item-actions">
                    <button className="edit-button" onClick={() => handleEditItem(item)}>
                      Update Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(showAddForm || showUpdateForm) && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>{showAddForm ? 'Report Lost Item' : 'Update Lost Item'}</h3>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={showAddForm ? handleSubmitAdd : handleSubmitUpdate}>
                  {showAddForm ? (
                    <>
                      <div className="form-group">
                        <label>Item Name:</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Date Lost:</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Location:</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Description:</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows="3"
                        />
                      </div>
                      <div className="form-group">
                        <label>Photo:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Status:</label>
                        <select
                          value={updateData.status}
                          onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                        >
                          <option value="unclaimed">Unclaimed</option>
                          <option value="claimed">Claimed</option>
                          <option value="surrendered">Surrendered to Owner</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Claimed By (if applicable):</label>
                        <input
                          type="text"
                          value={updateData.claimed_by_user}
                          onChange={(e) => setUpdateData({ ...updateData, claimed_by_user: e.target.value })}
                          placeholder="Student name or ID"
                        />
                      </div>
                      <div className="form-group">
                        <label>Notes:</label>
                        <textarea
                          value={updateData.claim_notes}
                          onChange={(e) => setUpdateData({ ...updateData, claim_notes: e.target.value })}
                          rows="3"
                          placeholder="Any additional notes about the item or claim..."
                        />
                      </div>
                    </>
                  )}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setShowAddForm(false);
                        setShowUpdateForm(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="submit-button" disabled={formLoading}>
                      {formLoading ? 'Saving...' : showAddForm ? 'Report Item' : 'Update Status'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LostItemsAdmin;
