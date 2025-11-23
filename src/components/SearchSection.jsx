import { useState, useEffect } from 'react';

function SearchSection() {
  const [items, setItems] = useState([]);
  const [reportedItems, setReportedItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItems();
    fetchReportedItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      setItems(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportedItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/reported-items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch reported items');
      setReportedItems(await response.json());
    } catch (err) {
      // ignore
    }
  };

  const filteredInventory = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.location && item.location.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredLost = reportedItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.location && item.location.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="dashboard-container">
      <h1>Search Items</h1>
      <input
        type="text"
        placeholder="Search items by name or location..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', marginBottom: 16, padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
      />
      {loading ? (
        <div className="loading">Loading items...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {/* Inventory Items - Available to Borrow */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#6366f1', marginBottom: 16 }}>📦 Inventory Items (Available to Borrow)</h2>
            {filteredInventory.length > 0 ? (
              <div className="requests-list">
                {filteredInventory.map(item => (
                  <div key={`inv-${item.id}`} className="request-card" style={{ borderLeft: '4px solid #6366f1' }}>
                    <div className="request-header">
                      <h3>{item.name}</h3>
                      <span className="status-badge" style={{ backgroundColor: item.quantity > 0 ? '#10b981' : '#ef4444', color: 'white' }}>
                        {item.quantity > 0 ? `${item.quantity} Available` : 'Out of Stock'}
                      </span>
                    </div>
                    <div className="request-details">
                      <p><strong>Location:</strong> {item.location}</p>
                      <p><strong>Date Added:</strong> {item.date ? new Date(item.date).toLocaleDateString() : '-'}</p>
                      <p><strong>Status:</strong> {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Available'}</p>
                      {item.description && <p><strong>Description:</strong> {item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic' }}>No inventory items available to borrow.</p>
            )}
          </div>

          {/* Lost & Found Items - Available to Claim */}
          <div>
            <h2 style={{ color: '#ec4899', marginBottom: 16 }}>🔍 Lost & Found Items (Available to Claim)</h2>
            {filteredLost.length > 0 ? (
              <div className="requests-list">
                {filteredLost.map(item => (
                  <div key={`lost-${item.id}`} className="request-card" style={{ borderLeft: '4px solid #ec4899' }}>
                    <div className="request-header">
                      <h3>{item.name}</h3>
                      <span className="status-badge" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                        Lost Item
                      </span>
                    </div>
                    <div className="request-details">
                      <p><strong>Location:</strong> {item.location}</p>
                      <p><strong>Date Reported:</strong> {item.date ? new Date(item.date).toLocaleDateString() : '-'}</p>
                      {item.description && <p><strong>Description:</strong> {item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic' }}>No lost and found items currently reported.</p>
            )}
          </div>

          {filteredInventory.length === 0 && filteredLost.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              <p>No items found matching your search.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchSection; 