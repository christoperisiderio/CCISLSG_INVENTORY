# CCISLSG Inventory System - AI Coding Agent Instructions

## Project Overview
**CCISLSG Inventory** is a full-stack inventory and lost-and-found management system for academic institutions. It features role-based access (students, admins, superadmins), item borrowing workflows, and inventory tracking.

**Tech Stack:**
- Frontend: React 19 + Vite + Material-UI
- Backend: Express.js + PostgreSQL
- Authentication: JWT tokens + bcrypt password hashing

---

## Architecture & Data Flow

### Core Components
1. **Authentication Layer** (`src/components/Login.jsx`, `src/components/Register.jsx`)
   - JWT tokens stored in localStorage
   - Token passed via `Authorization: Bearer <token>` header
   - Token verified at `GET /api/auth/me`

2. **Role-Based Access Control**
   - **student**: Can search items, request borrowing, report lost items
   - **admin**: Can manage inventory, approve borrow requests, export data
   - **superadmin**: Can approve admin applications, manage admin roles
   - User role stored in JWT and checked on protected routes

3. **Dashboard Routing** (`src/App.jsx`)
   - `/` routes to AdminDashboard (role='admin') or StudentDashboard (role='student')
   - `/superadmin` only accessible if `user.admin_role === 'superadmin'`
   - Protected routes check both token validity and role permissions

### Data Relationships
- **items**: Core inventory (quantity, location, status, created_by→users)
- **borrow_requests**: Links items + users + quantities + status (pending/approved/partial/returned)
- **users**: Stores role hierarchy (student→pending_admin→admin; or superadmin)
- **reported_items**: Student-submitted lost item reports
- **notifications**: Action updates sent to users

### Key Business Logic
- **Item Availability**: `available = quantity - total_borrowed` (calculated per item on GET /api/items)
- **Borrow Workflow**: Student requests → Admin approves/rejects → Status tracked (partial returns allowed)
- **Admin Approval**: pending_admin users await superadmin review; assigned admin_role on approval

---

## Critical Workflows & Commands

### Development Setup
```bash
# Frontend: Terminal at project root
npm install
npm run dev  # Starts Vite dev server on port 5173

# Backend: Terminal at /backend
npm install
npm run dev  # Starts Express on port 3001 (watches with nodemon)
```

### Database Initialization
- PostgreSQL tables auto-created on first backend startup (see `initializeDatabase()` in `server.js`)
- Seed with: `node backend/insert_sample_items.js`
- Add superadmin: `node backend/add_superadmin.js` (hardcoded username: 'topead', password: 'admin1')

### Build & Deploy
- **Frontend build**: `npm run build` → Vite compiles to dist/
- **Backend**: Stateless Express server; deploy server.js directly
- **Vercel deployment**: `vercel.json` configured at root; backend has separate config

---

## Project-Specific Patterns

### API Request Pattern
All authenticated requests require JWT:
```javascript
fetch('http://localhost:3001/api/endpoint', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
```

### File Upload Handling
- Multer configured for single photo uploads to `/backend/uploads/`
- Filenames: `Date.now() + file.extension`
- Served statically at `http://localhost:3001/uploads/{filename}`
- Used for: item photos, item reports

### Component Structure
- Dashboard components fetch stats on mount; no state management library (plain useState)
- CSS modules: `Component.jsx` pairs with `Component.css` in same directory
- MUI Button/Input/Card components used for consistent styling (see AdminDashboard imports)

### Error Handling
- API errors returned as JSON objects with `message` field
- Frontend catches errors and updates local state for display (see Login.jsx pattern)
- No global error boundary; errors logged to console

---

## Important Implementation Details

### Borrow Request Status Flow
- **pending** → admin review state
- **approved** → borrowed, tracked in requests
- **partial** → some items returned, not all
- **returned** → completed (sets return_date)
- Quantity checked against available stock before approval

### Utility Scripts (backend/)
- `add_superadmin.js`: Creates/updates superadmin user for bootstrap
- `insert_sample_items.js`: Populates test inventory
- `clear_all_data.js`: Wipes database (dev only)
- `clear_borrow_data.js`: Resets borrow requests

### Frontend Routing Guards
- `ProtectedRoute` component checks: token validity + role requirements
- adminOnly routes redirect non-admins to `/`
- Login/Register routes redirect authenticated users away

---

## Key Files to Reference

**Backend Core:**
- `backend/server.js` - All API endpoints, DB initialization, middleware
- `backend/.env` - Database credentials (uses Supabase in production)

**Frontend Core:**
- `src/App.jsx` - Routing, auth state, ProtectedRoute logic
- `src/components/AdminDashboard.jsx` - Admin stats/export template
- `src/components/AdminInventory.jsx` - Item CRUD
- `src/components/BorrowRequests.jsx` - Request approval workflow

---

## Common Tasks

### Adding a New Admin-Only Endpoint
1. Define in `backend/server.js`: `app.method('/api/path', verifyToken, isAdmin, handler)`
2. Handler receives `req.user` (from JWT) with id, username, role, student_id, admin_role
3. Frontend calls with `Authorization` header; catch 403 for auth failures

### Debugging Token Issues
- Check localStorage for 'token' key
- Verify JWT_SECRET matches between `server.js` and token generation
- Token expires in 24 hours (set in login endpoint)

### Modifying Item Model
- Schema in `server.js` CREATE TABLE (PostgreSQL syntax)
- Update both frontend and backend when adding fields
- Recalculate `available` quantity after schema changes

