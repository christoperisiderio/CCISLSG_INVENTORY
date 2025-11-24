import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function AdminClaimRequests() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = 'http://localhost:3001/api/claim-requests';
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClaims(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (claim) => {
    setSelectedClaim(claim);
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedClaim) return;
    await updateClaimStatus('approved');
  };

  const handleReject = async () => {
    if (!selectedClaim) return;
    await updateClaimStatus('rejected');
  };

  const updateClaimStatus = async (newStatus) => {
    setActionLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/claim-requests/${selectedClaim.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSuccess(`Claim request ${newStatus} successfully`);
        setShowModal(false);
        fetchClaims();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update claim');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <div className="loading">Loading claim requests...</div>;
  }

  return (
    <div className="admin-inventory">
      <div className="inventory-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
          <h2>Claim Requests Management</h2>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 12, fontWeight: 600 }}>Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {claims.length === 0 ? (
        <div className="no-items-message">No claim requests found.</div>
      ) : (
        <div className="items-grid">
          {claims.map(claim => (
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
                <p><strong>Student:</strong> {claim.username}</p>
                <p><strong>Student ID:</strong> {claim.student_id}</p>
                <p><strong>Location:</strong> {claim.location}</p>
                {claim.item_description && <p><strong>Item Description:</strong> {claim.item_description}</p>}
                {claim.claim_notes && <p><strong>Claim Notes:</strong> {claim.claim_notes}</p>}
                <p><strong>Requested Date:</strong> {new Date(claim.created_at).toLocaleDateString()}</p>
              </div>
              <div className="item-actions">
                <button 
                  className="edit-button" 
                  onClick={() => handleViewDetails(claim)}
                  style={{ width: '100%' }}
                >
                  View Details & Proof
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedClaim && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <h3>{selectedClaim.item_name} - Claim Request Details</h3>
            
            <div style={{ marginBottom: 20 }}>
              <h4>Claim Information</h4>
              <p><strong>Student Name:</strong> {selectedClaim.username}</p>
              <p><strong>Student ID:</strong> {selectedClaim.student_id}</p>
              <p><strong>Status:</strong> {selectedClaim.status}</p>
              <p><strong>Requested Date:</strong> {new Date(selectedClaim.created_at).toLocaleDateString()}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4>Item Information</h4>
              <p><strong>Item Name:</strong> {selectedClaim.item_name}</p>
              <p><strong>Location Lost:</strong> {selectedClaim.location}</p>
              {selectedClaim.item_description && <p><strong>Description:</strong> {selectedClaim.item_description}</p>}
            </div>

            {selectedClaim.claim_notes && (
              <div style={{ marginBottom: 20 }}>
                <h4>Student's Claim Details</h4>
                <p>{selectedClaim.claim_notes}</p>
              </div>
            )}

            {selectedClaim.photo && (
              <div style={{ marginBottom: 20 }}>
                <h4>Proof Photo (Student ID + Item)</h4>
                <img 
                  src={`http://localhost:3001/uploads/${selectedClaim.photo}`} 
                  alt="Proof"
                  style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, marginBottom: 12 }}
                />
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
              >
                Close
              </button>
              {selectedClaim.status === 'pending' && (
                <>
                  <button 
                    className="auth-button"
                    style={{ background: '#dc3545' }}
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                  <button 
                    className="auth-button"
                    style={{ background: '#28a745' }}
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminClaimRequests;
