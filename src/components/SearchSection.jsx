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
        <div className="requests-list">
          {filteredInventory.map(item => (
            <div key={item.id} className="request-card">
              <div className="request-header">
                <h3>{item.name}</h3>
                {item.type === 'LOST-ITEM' && <span className="status-badge status-rejected">LOST-ITEM</span>}
                {item.type === 'CCISLSG' && <span className="status-badge status-approved">CCISLSG</span>}
              </div>
              <div className="request-details">
                <p><strong>Location:</strong> {item.location}</p>
                <p><strong>Date Registered:</strong> {item.date ? new Date(item.date).toLocaleDateString() : '-'}</p>
                {item.quantity !== undefined && <p><strong>Quantity:</strong> {item.quantity}</p>}
                {item.description && <p><strong>Description:</strong> {item.description}</p>}
              </div>
            </div>
          ))}
          {filteredLost.map(item => (
            <div key={item.id} className="request-card">
              <div className="request-header">
                <h3>{item.name}</h3>
                <span className="status-badge status-rejected">LOST-ITEM (Reported)</span>
              </div>
              <div className="request-details">
                <p><strong>Location:</strong> {item.location}</p>
                <p><strong>Date Reported:</strong> {item.date ? new Date(item.date).toLocaleDateString() : '-'}</p>
                {item.description && <p><strong>Description:</strong> {item.description}</p>}
              </div>
            </div>
          ))}
          {filteredInventory.length === 0 && filteredLost.length === 0 && (
            <p>No items found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchSection; 