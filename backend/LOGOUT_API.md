# Logout & Session Management API

## Overview
The logout system tracks user sessions with token hashing, IP addresses, and user agents. Each login creates a session record, enabling logout on specific devices or all devices simultaneously.

## Database Schema

### user_sessions Table
```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500)
);
```

**Fields:**
- `user_id`: User who owns the session
- `token_hash`: SHA-256 hash of JWT token (never store raw token)
- `login_at`: Timestamp when user logged in
- `logout_at`: Timestamp when user logged out (NULL = still active)
- `ip_address`: Client IP address
- `user_agent`: Browser/device information

---

## API Endpoints

### 1. Logout (Current Device)
**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required (Bearer token)

**Description:** Logout user on current device only.

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

**Response (Success):**
```json
{
  "message": "Logged out successfully"
}
```

**Response (Error):**
```json
{
  "message": "No token provided"
}
```

**Status Codes:**
- `200`: Logout successful
- `400`: Session not found or already logged out
- `403`: No token provided

---

### 2. Get Session History
**Endpoint:** `GET /api/auth/sessions`

**Authentication:** Required (Bearer token)

**Description:** Retrieve user's session history (last 10 sessions).

**Request:**
```bash
curl -X GET http://localhost:3001/api/auth/sessions \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": 42,
    "login_at": "2025-11-23T14:30:00.000Z",
    "logout_at": "2025-11-23T15:45:00.000Z",
    "ip_address": "192.168.1.100",
    "last_activity": "2025-11-23T15:44:55.000Z"
  },
  {
    "id": 41,
    "login_at": "2025-11-23T10:00:00.000Z",
    "logout_at": null,
    "ip_address": "10.0.0.5",
    "last_activity": "2025-11-23T14:25:00.000Z"
  }
]
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

### 3. Logout All Devices
**Endpoint:** `POST /api/auth/logout-all`

**Authentication:** Required (Bearer token)

**Description:** Logout user from ALL active sessions simultaneously (security feature for compromised credentials).

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/logout-all \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "message": "Logged out from all devices",
  "sessionsTerminated": 3
}
```

**Status Codes:**
- `200`: All sessions terminated
- `401`: Unauthorized

---

## Frontend Integration

### Logout on Current Device
```javascript
const handleLogout = async () => {
  try {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Clear local storage
    localStorage.removeItem('token');
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

### Logout from All Devices
```javascript
const handleLogoutAllDevices = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3001/api/auth/logout-all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log(`Logged out from ${data.sessionsTerminated} devices`);
    
    // Clear local storage
    localStorage.removeItem('token');
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout all devices error:', error);
  }
};
```

### Check Session History
```javascript
const fetchSessionHistory = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3001/api/auth/sessions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const sessions = await response.json();
    console.log('Active sessions:', sessions);
  } catch (error) {
    console.error('Fetch sessions error:', error);
  }
};
```

---

## Security Features

1. **Token Hashing**: Raw JWT tokens are never stored in database; only SHA-256 hashes are persisted.
2. **IP Tracking**: Stores client IP for suspicious activity detection.
3. **User-Agent Logging**: Records device/browser information for device management.
4. **Cascade Delete**: Deleting a user automatically purges all related sessions.
5. **Single-Device Logout**: Users can logout specific devices without affecting others.
6. **Panic Logout**: `logout-all` endpoint allows immediate revocation of all sessions.

---

## Database Queries

### View All Sessions for a User
```sql
SELECT id, login_at, logout_at, ip_address, last_activity 
FROM user_sessions 
WHERE user_id = <user_id> 
ORDER BY login_at DESC;
```

### View Active Sessions
```sql
SELECT us.id, u.username, us.login_at, us.ip_address, us.user_agent
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.logout_at IS NULL
ORDER BY us.login_at DESC;
```

### Cleanup Old Logged-Out Sessions (30 days)
```sql
DELETE FROM user_sessions 
WHERE logout_at IS NOT NULL 
AND logout_at < NOW() - INTERVAL '30 days';
```

---

## Notes

- Token expiry is set to **1 day** in JWT; sessions can outlive tokens.
- Consider adding a job to clean up old sessions periodically.
- For frontend, clear `localStorage.getItem('token')` after logout.
- The `logout-all` endpoint is useful for security incidents or password changes.
