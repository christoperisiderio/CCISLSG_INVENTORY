// ReportSection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ReportSection() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    photo: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Fetch user info to determine role
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const user = await response.json();
          setUserRole(user.role);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchUser();
  }, []);

  const handleBack = () => {
    navigate(-1); // This will go back to the previous route
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoSubmit = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const formPayload = new FormData();
    formPayload.append('name', formData.name);
    formPayload.append('date', formData.date);
    formPayload.append('location', formData.location);
    if (formData.photo) {
      formPayload.append('photo', formData.photo);
    }

    try {
      const token = localStorage.getItem('token');
      // Auto-detect endpoint based on user role
      const endpoint = userRole === 'student'
        ? 'http://localhost:3001/api/reported-items'
        : 'http://localhost:3001/api/items';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formPayload,
      });

      if (!response.ok) {
        throw new Error('Failed to report item');
      }

      setSuccess('Lost item reported successfully!');
      setFormData({ name: '', date: '', location: '', photo: null });
      setTimeout(() => navigate('/search'), 1200);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-section">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>
      <h2>Report Lost Item</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="error-message" style={{color: 'green'}}>{success}</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>
            Item Name:
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter item name" 
              style={{ backgroundColor: "white", color: "black", border: "1px solid gray", padding: "5px" }}
              required
            />
        </label>
        <label>
          When (Date Found):
          <input 
            type="date" 
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            style={{ backgroundColor: "white", color: "black", border: "1px solid gray", padding: "5px" }}
          />
        </label>
        <label>
          Where (Location):
          <input 
            type="text" 
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Enter location where item was found" 
            required
            style={{ backgroundColor: "white", color: "black", border: "1px solid gray", padding: "5px" }}
          />
        </label>
        <div className="photo-upload">
          <label className="photo-button">
            Submit Photo
            <input 
              type="file" 
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSubmit}
              style={{ display: 'none' }}
            />
          </label>
          {formData.photo && (
            <span className="photo-name">{formData.photo.name}</span>
          )}
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}

export default ReportSection;
