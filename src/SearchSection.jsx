import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [sortBy]);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:3001/api/reported-items`;
      if (sortBy === 'name') {
        url += '?sort=name';
      } else if (sortBy === 'date') {
        url += '?sort=date';
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setItems(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:3001/api/reported-items?q=${searchQuery}`;
      if (sortBy === 'name') {
        url += '&sort=name';
      } else if (sortBy === 'date') {
        url += '&sort=date';
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error searching items:', error);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="search-section">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>
      <h2>Search Lost Items</h2>
      
      <div className="search-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>
        
        <div className="sort-controls">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Date Added</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : items.length > 0 ? (
        <div className="items-grid">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-image">
                {item.photo ? (
                  <img src={`http://localhost:3001/uploads/${item.photo}`} alt={item.name} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="item-details">
                <h3>{item.name}</h3>
                <p className="item-date">Found: {new Date(item.date).toLocaleDateString()}</p>
                <p className="item-location">Location: {item.location}</p>
                <span className={`item-status status-${item.status ? item.status.toLowerCase() : 'unknown'}`}>
                  {item.status || 'Lost'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-items-message">No information Available</div>
      )}
    </div>
  );
}

export default SearchSection; 