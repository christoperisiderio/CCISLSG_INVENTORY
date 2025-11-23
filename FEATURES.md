# CCISLSG Inventory System - Features Documentation

## Core Features (Initial Scope)

### ✅ 1. Inventory Item Overview and Search Bar
**Status**: Implemented
**Location**: 
- Backend: `GET /api/items` - Fetches all items
- Frontend: `AdminInventory.jsx` - Admin inventory management
- Frontend: `StudentDashboard.jsx` - Student item search

**Features**:
- Display all inventory items with details (name, location, quantity, date)
- Search by item name or location
- Filter available items for borrowing (quantity > 0)
- Pagination support for large inventories
- Item status indication (available, maintenance, damaged)

---

### ✅ 2. Item Borrowing Form and Return Form
**Status**: Implemented
**Location**:
- Backend: `POST /api/items/{id}/borrow` - Create borrow request
- Backend: `PATCH /api/borrow-requests/{id}` - Update borrow request status
- Frontend: `StudentDashboard.jsx` - Borrow form modal
- Frontend: `BorrowRequests.jsx` - Admin approval/rejection

**Features**:
- Student borrow form with:
  - Item selection
  - Quantity selection
  - Purpose of usage
  - Additional notes
- Admin borrow request review:
  - View request details
  - Approve/reject requests
  - Set return dates
  - Track borrowed items
- Return functionality:
  - Mark items as returned
  - Track return dates
  - Partial return support

---

### ✅ 3. Borrowable Items Overview and Search Bar
**Status**: Implemented
**Location**:
- Frontend: `StudentDashboard.jsx` - "Available Items to Borrow" section
- Backend: Filtered in `GET /api/items` (quantity > 0)

**Features**:
- Display only available items (quantity > 0)
- Real-time search by name or location
- Show item location and quantity
- Borrow button for each item
- Status indicators (available, maintenance, damaged)

---

### ✅ 4. Borrowed Items History
**Status**: Implemented
**Location**:
- Backend: `GET /api/my-borrow-requests` - Fetch user's borrow history
- Frontend: `StudentDashboard.jsx` - "My Borrow Requests" section
- Frontend: `BorrowRequests.jsx` - Admin view of all borrow requests

**Features**:
- View all borrowing requests with status
- Status tracking: pending, approved, rejected, returned, partial
- Request and return dates
- Item quantity and notes
- Notification badges for new requests

---

### ✅ 5. User Login and Authentication
**Status**: Implemented
**Location**:
- Backend: `POST /api/auth/login` - User authentication
- Backend: Middleware: `verifyToken` - JWT verification
- Frontend: `Login.jsx` - Login form
- Frontend: `App.jsx` - Auth state management

**Features**:
- Email/Username and password login
- JWT token generation (24-hour expiry)
- Token storage in localStorage
- Protected routes verification
- Session tracking with IP and user agent
- Token hashing for security

---

### ✅ 6. End User Registration
**Status**: Implemented
**Location**:
- Backend: `POST /api/auth/register` - User registration
- Backend: `POST /api/auth/request-admin` - Request admin access
- Frontend: `Register.jsx` - Registration form

**Features**:
- User registration with:
  - Username
  - Email
  - Password (bcrypt hashed, 10 salt rounds)
  - Student ID
  - User role selection (student/admin request)
- Admin role request workflow
- Email validation
- Duplicate username/email prevention
- Password security requirements

---

## Added Features (Extended Scope)

### ✅ 7. Lost and Found Item Search Bar (with category and description)
**Status**: Implemented
**Location**:
- Backend: `GET /api/reported-items` - Fetch lost items
- Frontend: `SearchSection.jsx` - Lost and found search interface

**Features**:
- Search lost items by:
  - Item name
  - Location
  - Category (implied through item type)
- View detailed descriptions
- Date filters (when item was lost)
- Status filters (unclaimed, claimed)
- Item card layout with all details
- Sort options (newest first, oldest first)

---

### ✅ 8. Lost and Found Item Claiming Form
**Status**: Implemented
**Location**:
- Backend: `POST /api/reported-items/{id}/claim` - Claim lost item
- Frontend: `SearchSection.jsx` - Modal form for claiming items

**Features**:
- Claim form for students:
  - Select item to claim
  - Provide proof/description of ownership
  - Contact information
  - Additional notes
- Admin approval workflow for claims
- Claim status tracking
- Item handover documentation

---

### ✅ 9. Lost and Found Item Overview
**Status**: Implemented
**Location**:
- Backend: `GET /api/reported-items` - Fetch all lost items
- Frontend: `SearchSection.jsx` - Display lost and found items
- Frontend: `ReportSection.jsx` - Report lost items

**Features**:
- View all lost/found items with:
  - Item name and description
  - Location where found/lost
  - Date reported
  - Photo (if available)
  - Item status (unclaimed, claimed, pending)
  - Contact information of reporter
- Filter options:
  - By status (unclaimed, claimed)
  - By date range
  - By location
- Report new lost item form:
  - Item name
  - Description
  - Location
  - Date lost
  - Photo upload
  - Contact details

---

### 🔄 10. Inventory Item QR Code Scanner (Competitive Pressure)
**Status**: In Progress / Partial Implementation
**Location**: Ready for implementation
**Suggested Location**: `components/QRScanner.jsx`

**Proposed Features**:
- QR code generation for each inventory item
- Mobile-optimized QR scanner
- One-tap borrowing via QR code
- Quick item lookup
- Real-time inventory updates

**Implementation Notes**:
- Would require: `qrcode.react` npm package for generation
- Would require: `react-qr-code-reader` for scanning
- Mobile app wrapper already in place
- Touch-optimized interface ready

---

## System Architecture

### Database Schema
- **users** - User accounts with roles
- **items** - Inventory items
- **borrow_requests** - Borrowing transaction log
- **reported_items** - Lost and found items
- **user_sessions** - Session tracking for security
- **notifications** - User notifications
- **logs** - System activity logging

### Authentication Flow
1. User registers or logs in
2. System validates credentials
3. JWT token generated and stored
4. Session created with IP tracking
5. Token sent with each request
6. Token verified on protected routes

### Role-Based Access Control (RBAC)
- **Student**: Can borrow, report lost items, search
- **Admin**: Can manage inventory, approve requests, view logs
- **Superadmin**: Can manage admins, system-wide oversight
- **Pending Admin**: Waiting for approval

### Key Endpoints Summary

#### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Current user info
- `GET /api/auth/sessions` - User sessions
- `POST /api/auth/logout-all` - Emergency logout

#### Inventory
- `GET /api/items` - List all items
- `POST /api/items` - Add item (admin)
- `PUT /api/items/{id}` - Edit item (admin)
- `DELETE /api/items/{id}` - Delete item (admin)
- `POST /api/items/{id}/borrow` - Borrow item (student)

#### Borrowing
- `GET /api/my-borrow-requests` - User's requests
- `GET /api/borrow-requests` - All requests (admin)
- `PATCH /api/borrow-requests/{id}` - Update request (admin)

#### Lost & Found
- `GET /api/reported-items` - List lost items
- `POST /api/reported-items` - Report lost item
- `POST /api/reported-items/{id}/claim` - Claim item

#### Admin Functions
- `GET /api/pending-admins` - Pending admin requests
- `POST /api/approve-admin` - Approve admin (superadmin)
- `GET /api/logs` - System logs

---

## Feature Completeness Chart

| Feature | Status | Implementation | Testing |
|---------|--------|-----------------|---------|
| Inventory Overview & Search | ✅ Complete | Full | ✓ |
| Item Borrowing Form | ✅ Complete | Full | ✓ |
| Item Return Form | ✅ Complete | Full | ✓ |
| Borrowable Items Overview | ✅ Complete | Full | ✓ |
| Borrow History | ✅ Complete | Full | ✓ |
| User Login | ✅ Complete | Full | ✓ |
| User Registration | ✅ Complete | Full | ✓ |
| Lost & Found Search | ✅ Complete | Full | ✓ |
| Lost Item Claiming | ✅ Complete | Full | ✓ |
| Lost & Found Overview | ✅ Complete | Full | ✓ |
| QR Code Scanner | 🔄 Partial | Ready | - |

---

## Mobile Support

All features are fully responsive with dedicated mobile UI:
- Mobile app wrapper (`MobileApp.jsx`)
- Touch-optimized interface
- Bottom navigation for easy access
- Swipe-friendly forms
- Mobile-optimized search

---

## Security Features

✅ JWT Authentication with 24-hour expiry
✅ Password hashing with bcrypt (10 salt rounds)
✅ Token hashing for session storage
✅ CORS protection
✅ Protected API endpoints
✅ Session tracking (IP, user agent)
✅ Role-based access control
✅ Logout with session invalidation
✅ Emergency logout (logout all devices)

---

## Future Enhancements

- QR code scanner for quick borrowing
- Email notifications
- SMS alerts
- Advanced analytics dashboard
- Barcode scanning
- Mobile app (React Native)
- Real-time inventory updates (WebSocket)
- Advanced reporting and analytics
- Item damage reporting
- Automatic return reminders
