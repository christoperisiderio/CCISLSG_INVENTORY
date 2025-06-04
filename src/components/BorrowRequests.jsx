import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BorrowRequests.css';

function BorrowRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [status, setStatus] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [returnedQuantity, setReturnedQuantity] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/borrow-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch borrow requests');
      }
      
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setStatus(request.status);
    setReturnDate(request.return_date ? new Date(request.return_date).toISOString().split('T')[0] : '');
    setNotes(request.notes || '');
    setReturnedQuantity('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    
    try {
      const token = localStorage.getItem('token');
      const body = {
        status,
        return_date: returnDate || null,
        notes
      };
      if (status === 'returned') {
        body.returned_quantity = returnedQuantity;
      }
      const response = await fetch(`http://localhost:3001/api/borrow-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update borrow request');
      }
      
      // Refresh the requests list
      fetchRequests();
      
      // Close the modal
      setSelectedRequest(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'returned':
        return 'status-returned';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="loading">Loading borrow requests...</div>;
  }

  return (
    <div className="borrow-requests-container" style={{ color: 'black' }}>
      <button className="back-button" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h1 style={{ color: 'black' }}>Manage Borrow Requests</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {requests.length === 0 ? (
        <p>No borrow requests found.</p>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table" style={{ color: 'black' }}>
            <thead>
              <tr>
                <th style={{ color: 'black' }}>Item</th>
                <th style={{ color: 'black' }}>Student</th>
                <th style={{ color: 'black' }}>Student ID</th>
                <th style={{ color: 'black' }}>Quantity</th>
                <th style={{ color: 'black' }}>Request Date</th>
                <th style={{ color: 'black' }}>Status</th>
                <th style={{ color: 'black' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id}>
                  <td style={{ color: 'black' }}>{request.item_name}</td>
                  <td style={{ color: 'black' }}>{request.username}</td>
                  <td style={{ color: 'black' }}>{request.student_id}</td>
                  <td style={{ color: 'black' }}>{request.quantity || 1}</td>
                  <td style={{ color: 'black' }}>{new Date(request.request_date).toLocaleDateString()}</td>
                  <td style={{ color: 'black' }}>
                    <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td style={{ color: 'black' }}>
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewDetails(request)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Request Details</h2>
            <div className="request-details">
              <p><strong>Item:</strong> {selectedRequest.item_name}</p>
              <p><strong>Student:</strong> {selectedRequest.username}</p>
              <p><strong>Student ID:</strong> {selectedRequest.student_id}</p>
              <p><strong>Email:</strong> {selectedRequest.email}</p>
              <p><strong>Quantity:</strong> {selectedRequest.quantity || 1}</p>
              <p><strong>Purpose:</strong> {selectedRequest.purpose || 'Not specified'}</p>
              <p><strong>Request Date:</strong> {new Date(selectedRequest.request_date).toLocaleDateString()}</p>
              <p><strong>Current Status:</strong> {selectedRequest.status}</p>
              {selectedRequest.return_date && (
                <p><strong>Return Date:</strong> {new Date(selectedRequest.return_date).toLocaleDateString()}</p>
              )}
              {selectedRequest.notes && <p><strong>Notes:</strong> {selectedRequest.notes}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Update Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="returned">Returned</option>
              </select>
            </div>
            
            {status === 'returned' && (
              <div className="form-group">
                <label htmlFor="returnedQuantity">Returned Quantity</label>
                <input
                  type="number"
                  id="returnedQuantity"
                  min="1"
                  max={selectedRequest.quantity || 1}
                  value={returnedQuantity}
                  onChange={e => setReturnedQuantity(e.target.value)}
                  placeholder={`Max: ${selectedRequest.quantity || 1}`}
                  required
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="returnDate">Return Date</label>
              <input
                type="date"
                id="returnDate"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
              ></textarea>
            </div>
            
            <div className="modal-actions">
              <button 
                className="update-btn"
                onClick={handleUpdateStatus}
              >
                Update Request
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setSelectedRequest(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BorrowRequests; 