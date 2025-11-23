# Item Types Architecture

## Overview

The CCISLSG Inventory Management System supports **two distinct item types** to serve different user needs:

1. **Inventory Items** - Assets available for borrowing
2. **Lost & Found Items** - Items reported as lost/found for claiming

## Item Type Comparison

| Aspect | Inventory Items | Lost & Found Items |
|--------|-----------------|-------------------|
| **Purpose** | Borrowable assets | Lost/unclaimed items |
| **Database Table** | `items` | `reported_items` |
| **API Endpoints** | `GET /api/items` | `GET /api/reported-items` |
| **Created By** | Admin/Superadmin | Any authenticated user |
| **Key Fields** | name, quantity, status, location | name, location, user_id |
| **Status Field** | available, unavailable, maintenance, damaged | N/A (implied: unclaimed) |
| **Frontend Display** | StudentDashboard → "Available Items to Borrow" | SearchSection → "Lost & Found Items" |
| **User Action** | Borrow request | Claim request (future) |

---

## 1. Inventory Items (For Borrowing)

### Database Schema

```sql
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 0,
  date DATE,
  location VARCHAR(255),
  photo VARCHAR(255),
  status VARCHAR(50) DEFAULT 'available',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);
```

### Valid Status Values

- **available** - Item is ready to borrow (default)
- **unavailable** - Item exists but cannot be borrowed
- **maintenance** - Item is under maintenance, cannot be borrowed
- **damaged** - Item is damaged, cannot be borrowed

### Creation & Management

**Who can create:** Admins and Superadmins only
- Route: `POST /api/items` (protected by `isAdmin` middleware)
- Admin Interface: `AdminInventory.jsx` component
- Fields in form:
  - Item Name (required)
  - Quantity (required)
  - Location (required)
  - Status (dropdown: available/unavailable/maintenance/damaged)
  - Photo (optional)
  - Description (optional)

### Sample Inventory Items

The system includes 10 pre-populated inventory items:

1. Projector (5 units) - Building A
2. Laptop Stand (12 units) - Building B
3. Microphone Set (3 units) - Building C
4. Camera (2 units) - Building A
5. Sound System (4 units) - Building D
6. Tripod (8 units) - Building A
7. Whiteboard (15 units) - Building B
8. USB-C Hub (20 units) - Building A
9. Portable Charger (10 units) - Building C
10. Extension Cable Reel (6 units) - Building B

### Borrowing Process

**Student Flow:**

1. Student views "Available Items to Borrow" in StudentDashboard
2. Only items with `quantity > 0` are displayed
3. Student selects an item → opens borrow modal
4. Student specifies:
   - Quantity to borrow
   - Purpose of borrowing
   - Additional notes
5. Student submits borrow request
6. Request goes to `POST /api/items/:id/borrow`

**Backend Validation:**

```javascript
// Item must exist
if (!item) return 400 "Item not found"

// Item must be available (not maintenance/damaged)
if (item.status === 'maintenance' || item.status === 'damaged') 
  return 400 "Item is currently [status]"

// Item must have sufficient quantity
if (item.quantity <= 0) 
  return 400 "Item is not available"

// Check user already has active borrow request for this item
if (existingRequest?.status === 'pending') 
  return 400 "Already have pending request for this item"
```

### API Endpoints - Inventory Items

#### List all items
```
GET /api/items
Headers: Authorization: Bearer <token>
Response: Array of items
```

#### Search items
```
GET /api/items/search?query=<search_term>
Headers: Authorization: Bearer <token>
```

#### Create new item (Admin only)
```
POST /api/items
Headers: Authorization: Bearer <token>
Body: FormData with name, quantity, location, status, photo
```

#### Update item (Admin only)
```
PUT /api/items/:id
Headers: Authorization: Bearer <token>
Body: FormData with updated fields
```

#### Delete item (Admin only)
```
DELETE /api/items/:id
Headers: Authorization: Bearer <token>
```

#### Update item status (Admin only)
```
PATCH /api/items/:id/status
Headers: Authorization: Bearer <token>
Body: { status: "available|unavailable|maintenance|damaged" }
```

#### Create borrow request (Students)
```
POST /api/items/:id/borrow
Headers: Authorization: Bearer <token>
Body: {
  quantity: number,
  purpose: string,
  notes: string
}
Response: { id, status: "pending" }
```

---

## 2. Lost & Found Items

### Database Schema

```sql
CREATE TABLE reported_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  photo VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users(id)
);
```

### Creation & Management

**Who can create:** Any authenticated user
- Route: `POST /api/reported-items`
- Frontend: ReportSection component
- User can report any lost/found item
- Auto-tracked: user_id, creation timestamp

### Claiming Process (Future)

Currently, lost & found items are **searchable and viewable** by all users. The claiming mechanism is planned for future implementation.

**Planned Flow:**
1. User finds matching lost item in "Lost & Found Items"
2. User clicks "Claim Item"
3. Claim request created with status: pending
4. Original reporter notified
5. Reporter approves or denies claim
6. If approved, item marked as claimed

### API Endpoints - Lost & Found Items

#### List all reported items
```
GET /api/reported-items
Headers: Authorization: Bearer <token>
Response: Array of reported items
```

#### Report a lost/found item (Any user)
```
POST /api/reported-items
Headers: Authorization: Bearer <token>
Body: FormData with name, date, location, photo, description
```

#### Delete reported item
```
DELETE /api/reported-items/:id
Headers: Authorization: Bearer <token>
```

---

## 3. Frontend Components

### StudentDashboard.jsx
- **Purpose:** Show inventory items available to borrow
- **Displays:** Items with `quantity > 0` from `items` table
- **Section Title:** "Available Items to Borrow"
- **Badge Color:** Green (#10b981)
- **Actions:** 
  - Click to borrow
  - View quantity available
  - Check status

### SearchSection.jsx
- **Purpose:** Unified search for both item types
- **Section 1:** Inventory Items
  - Title: "📦 Inventory Items (Available to Borrow)"
  - Border: Blue left border (#6366f1)
  - Shows: All items with quantity > 0
  - Displays: Location, Status, Date Added
  
- **Section 2:** Lost & Found Items
  - Title: "🔍 Lost & Found Items (Available to Claim)"
  - Border: Pink left border (#ec4899)
  - Shows: All reported items
  - Displays: Location, Date Reported, Reporter

### ReportSection.jsx (Planned)
- **Purpose:** Allow users to report lost/found items
- **Form Fields:**
  - Item Name (required)
  - Date (required)
  - Location (required)
  - Photo (optional)
  - Description (optional)

---

## 4. Visual Distinction

### Color Coding

**Inventory Items:**
- Primary Color: Indigo (#6366f1)
- Badge: Green (#10b981) when available
- Badge: Red (#ef4444) when out of stock
- Left Border: Blue (#6366f1)

**Lost & Found Items:**
- Primary Color: Pink (#ec4899)
- Badge: Amber (#f59e0b) for "Lost Item"
- Left Border: Pink (#ec4899)

### Icon Indicators

**Inventory Items:** 📦 (package)
**Lost & Found:** 🔍 (magnifying glass)

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    STUDENT USER                         │
└────────────────┬──────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        v                 v
┌──────────────────┐  ┌──────────────────┐
│   Dashboard      │  │   Search Page    │
│ "Borrow Items"   │  │  "Find Items"    │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
    ┌────┴─────────────────────┴────┐
    │                               │
    v                               v
GET /api/items              GET /api/items + GET /api/reported-items
query: quantity > 0         Display both item types separately
    │                               │
    v                               v
┌─────────────────┐         ┌──────────────────┐
│  Items Table    │         │  Items Table +   │
│ (Inventory)     │         │  Reported Items  │
└────────┬────────┘         └──────────────────┘
         │
    POST /api/items/:id/borrow
         │
    ┌────v──────────────────┐
    │ Borrow Requests Table │
    │ (pending/approved)    │
    └───────────────────────┘
```

---

## 6. Database Relationships

```sql
-- Inventory Items
items (id) ──→ borrow_requests (item_id)
items (created_by) ──→ users (id)

-- Lost & Found Items
reported_items (user_id) ──→ users (id)

-- Borrow Tracking
borrow_requests (user_id) ──→ users (id)
borrow_requests (item_id) ──→ items (id)
```

---

## 7. Quick Reference: Item Type Selection

**Use Inventory Items (`items` table) when:**
- ✅ Creating equipment/assets to be borrowed
- ✅ Tracking quantity and stock levels
- ✅ Managing status (maintenance, damaged, etc.)
- ✅ Admin-created items only

**Use Lost & Found Items (`reported_items` table) when:**
- ✅ User reports a lost or found item
- ✅ No quantity tracking needed
- ✅ Any authenticated user can create
- ✅ Items are for claiming, not borrowing

---

## 8. Integration Checklist

- ✅ Database tables created and linked
- ✅ API endpoints for both item types
- ✅ Frontend components display both types
- ✅ StudentDashboard shows inventory items
- ✅ SearchSection shows both types with clear distinction
- ✅ Admin interface for inventory management
- ✅ 10 sample inventory items populated
- ⏳ Claim functionality for lost & found (planned)
- ⏳ Reporting interface UI (ReportSection component)

---

## 9. Future Enhancements

1. **Claim System for Lost & Found**
   - Claim request workflow
   - Reporter approval/denial
   - Claim notification system

2. **Item Categories**
   - Organize items by type/category
   - Filter by category

3. **QR Code Integration**
   - Generate QR codes for inventory items
   - Scan QR to quick-borrow items
   - *QRScanner.jsx component already created*

4. **Audit Trail**
   - Track all item movements
   - History of borrows and claims
   - Responsible user tracking

5. **Email Notifications**
   - Notify on borrow status changes
   - Alert on lost item claimed
   - Reminder for return dates
