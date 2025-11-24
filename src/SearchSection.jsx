import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchSection.css';

function SearchSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [claimNotes, setClaimNotes] = useState('');
  const [claimPhoto, setClaimPhoto] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userClaims, setUserClaims] = useState([]);
  const [showClaimsTab, setShowClaimsTab] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchItems();
  }, [sortBy]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

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

  const handleClaimClick = (item) => {
    if (item.status !== 'unclaimed') {
      setError('This item is no longer available for claiming');
      return;
    }
    setSelectedItem(item);
    setClaimNotes('');
    setClaimPhoto(null);
    setStudentId('');
    setError('');
    setSuccess('');
    setShowClaimModal(true);
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    
    if (!studentId.trim()) {
      setError('Student ID is required');
      return;
    }

    if (!claimPhoto) {
      setError('Photo proof is required');
      return;
    }

    setClaimLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('claim_notes', claimNotes);
    formData.append('student_id', studentId);
    formData.append('photo', claimPhoto);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/reported-items/${selectedItem.id}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setShowClaimModal(false);
        fetchItems(); // Refresh items list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to claim item');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setClaimLoading(false);
    }
  };

  const fetchUserClaims = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/claim-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const allClaims = await response.json();
        // Filter for current user's claims
        const myClaims = allClaims.filter(claim => claim.user_id === user?.id);
        setUserClaims(myClaims);
      }
    } catch (error) {
      console.error('Error fetching user claims:', error);
    }
  };

  const handleViewMyClaimsTab = () => {
    setShowClaimsTab(!showClaimsTab);
    if (!showClaimsTab) {
      fetchUserClaims();
    }
  };

  const handleCancelClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to cancel this claim request?')) {
      return;
    }

    setClaimLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/claim-requests/${claimId}/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Claim request cancelled successfully');
        fetchUserClaims(); // Refresh claims list
        fetchItems(); // Refresh items list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to cancel claim');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setClaimLoading(false);
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
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {user?.role === 'student' && (
        <div style={{ marginBottom: 20 }}>
          <button
            className="auth-button"
            onClick={handleViewMyClaimsTab}
            style={{ marginRight: 8 }}
          >
            {showClaimsTab ? '← Back to Search' : `My Claims (${userClaims.length})`}
          </button>
        </div>
      )}
      
      {!showClaimsTab ? (
        <>
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
                {item.description && <p className="item-description">{item.description}</p>}
                <span className={`item-status status-${item.status ? item.status.toLowerCase() : 'unknown'}`}>
                  {item.status || 'Lost'}
                </span>
                {item.claimed_by_user && <p className="item-claimed">Claimed by: {item.claimed_by_user}</p>}
              </div>
              <div className="item-actions">
                {user?.role === 'student' && item.status === 'unclaimed' && (
                  <button 
                    className="claim-button"
                    onClick={() => handleClaimClick(item)}
                  >
                    Claim Item
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-items-message">No information Available</div>
      )}
      </>
      ) : (
        // My Claims Tab
        <div>
          {userClaims.length === 0 ? (
            <div className="no-items-message">You have no claim requests.</div>
          ) : (
            <div className="items-grid">
              {userClaims.map(claim => (
                <div key={claim.id} className="item-card">
                  <div className="item-details">
                    <div className="item-header">
                      <h3>{claim.item_name}</h3>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          background:
                            claim.status === 'pending'
                              ? '#fff3cd'
                              : claim.status === 'approved'
                              ? '#d4edda'
                              : '#f8d7da',
                          color: '#000',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {claim.status}
                      </span>
                    </div>
                    <p><strong>Location:</strong> {claim.location}</p>
                    {claim.item_description && <p><strong>Description:</strong> {claim.item_description}</p>}
                    {claim.claim_notes && <p><strong>Your Notes:</strong> {claim.claim_notes}</p>}
                    <p><strong>Requested:</strong> {new Date(claim.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="item-actions">
                    {claim.status === 'pending' && (
                      <button
                        className="auth-button"
                        style={{ background: '#dc3545', width: '100%' }}
                        onClick={() => handleCancelClaim(claim.id)}
                        disabled={claimLoading}
                      >
                        {claimLoading ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    )}
                    {claim.status === 'approved' && (
                      <div style={{ padding: '10px', background: '#d4edda', borderRadius: 4, textAlign: 'center', color: '#155724' }}>
                        ✓ Approved - Ready to claim
                      </div>
                    )}
                    {claim.status === 'rejected' && (
                      <div style={{ padding: '10px', background: '#f8d7da', borderRadius: 4, textAlign: 'center', color: '#721c24' }}>
                        ✗ Rejected
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showClaimModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Claim Lost Item</h3>
            <p>Item: <strong>{selectedItem.name}</strong></p>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handleSubmitClaim}>
              <div className="form-group">
                <label>Student ID: <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your student ID"
                  required
                />
              </div>
              <div className="form-group">
                <label>Photo Proof (ID + Item): <span style={{color: 'red'}}>*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setClaimPhoto(e.target.files[0])}
                  required
                />
                <small style={{color: '#666', display: 'block', marginTop: '6px'}}>
                  Upload a photo showing your student ID and the lost item as proof
                </small>
              </div>
              <div className="form-group">
                <label>Why are you claiming this item? (optional)</label>
                <textarea
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Describe how you know this is your item, where you lost it, any identifying marks, etc."
                  rows="4"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowClaimModal(false)}
                  disabled={claimLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={claimLoading}
                >
                  {claimLoading ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchSection; 