# CCISLSG Inventory System Setup Guide

A comprehensive inventory management system supporting both borrowable equipment and lost & found items.

## 🐳 Quick Setup with Docker (Recommended for Groupmates)

**New to the project? Use Docker for the easiest setup!**

```bash
# 1. Clone repository
git clone <repository-url>
cd CCISLSG_INVENTORY

# 2. Create environment file
cp .env.example .env

# 3. Edit .env (change DB_PASSWORD and JWT_SECRET to something secure)

# 4. Start everything
docker-compose up -d

# 5. Open browser: http://localhost:3001
```

**📖 Full Docker Guide:** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions with troubleshooting.

**⚡ TL;DR Version:** See [QUICK_START.md](QUICK_START.md)

---

## 📋 System Overview

The CCISLSG Inventory System has **two distinct features**:

1. **📦 Inventory Management** - Equipment/assets available for students to borrow
2. **🔍 Lost & Found** - System for reporting and claiming lost items

### Key Features

- **Role-Based Access Control** - Students, Admins, and Superadmins
- **JWT Authentication** - Secure login with token-based sessions
- **Mobile Responsive** - Works on desktop, tablet, and mobile devices
- **Real-time Status Updates** - Track borrow requests and claim status
- **File Upload Support** - Add photos to items and reports
- **Search & Filter** - Find items by name or location
- **QR Code Support** - Generate and scan QR codes for items (coming soon)

## Prerequisites

1. **Node.js and npm**
   - Download and install Node.js from [https://nodejs.org/](https://nodejs.org/)
   - Recommended version: Node.js 18.x or later
   - npm will be installed automatically with Node.js

2. **PostgreSQL**
   - Download and install PostgreSQL from [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
   - Default port: 5432
   - Remember your postgres username and password during installation

## Setup Instructions

### 1. Clone the Repository
```bash
git clone [repository-url]
cd CCISLSG_INVENTORY
```

### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Create a .env file in the backend directory with these variables:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=ccislsg_inventory
JWT_SECRET=your_secure_jwt_secret_key

# Start the backend server
npm run dev
```

The backend API will run on `http://localhost:3001`

### 4. Initialize Sample Data (Optional)

```bash
# Add 10 sample inventory items
cd backend
node insert_sample_inventory.js
```

This adds ready-to-borrow items like Projectors, Cameras, Microphones, etc.

## Required Dependencies

### Frontend Dependencies
- React 19.0.0 - Core library for building user interfaces
- Material-UI (@mui/material, @mui/icons-material) - UI component library
- React Router DOM 7.5.2 - Handles routing and navigation
- Axios 1.9.0 - HTTP client for API requests
- qrcode.react - QR code generation

### Backend Dependencies
- Express 4.18.2 - Web framework for Node.js
- PostgreSQL (pg 8.15.6) - PostgreSQL client
- bcrypt 5.1.1 - Password hashing for authentication
- jsonwebtoken 9.0.2 - JWT token management
- cors 2.8.5 - Cross-Origin Resource Sharing
- multer 1.4.5-lts.1 - File upload handling

## Development Tools
- Vite 6.3.1 - Fast build tool and dev server
- ESLint 9.22.0 - Code linting and quality
- Nodemon 3.0.1 - Auto-restart on code changes

## Understanding the Two Item Types

### 📦 Inventory Items (For Borrowing)

**What:** Equipment/assets managed by admins for students to borrow

**Examples:** Projectors, Laptops, Cameras, Microphones, etc.

**Who creates:** Admins and Superadmins only

**Student actions:**
1. View available items in Dashboard
2. Click "Borrow" to request an item
3. Specify quantity, purpose, and notes
4. Wait for admin approval
5. Pick up the item
6. Return before deadline

**Admin actions:**
1. Add new items (name, quantity, location, status, photo)
2. Set status (available, unavailable, maintenance, damaged)
3. Edit or delete items
4. Approve/deny borrow requests
5. Track borrowed items

**Related documentation:** See [ITEM_TYPES_QUICK_REFERENCE.md](ITEM_TYPES_QUICK_REFERENCE.md)

### 🔍 Lost & Found Items (For Claiming)

**What:** Items reported as lost or found by students

**Examples:** Wallets, keys, phones, documents, headphones, etc.

**Who creates:** Any authenticated student

**Student actions:**
1. Report a lost or found item using "Report Lost Item"
2. Provide item name, date, location, photo, description
3. Other students can search for lost items
4. If found, click "Claim" to submit a claim request
5. Original reporter reviews and approves/denies
6. Pick up item from office if approved

**Search & Browse:**
1. Go to Search page
2. View "Lost & Found Items (Available to Claim)" section
3. Search by name or location
4. Click item to view details
5. Submit claim if it's yours

**Related documentation:** See [ITEM_TYPES_ARCHITECTURE.md](ITEM_TYPES_ARCHITECTURE.md)

## Database Structure

### Inventory Items Table (`items`)
```
- id (Primary Key)
- name (Item name)
- quantity (Number available)
- date (Date added)
- location (Storage location)
- photo (Photo path)
- status (available/unavailable/maintenance/damaged)
- description (Item details)
- created_at (Creation timestamp)
- created_by (Admin who created it)
```

### Lost & Found Items Table (`reported_items`)
```
- id (Primary Key)
- name (Item name)
- date (Date reported/lost)
- location (Where found/lost)
- photo (Photo path)
- description (Item details)
- created_at (Report timestamp)
- user_id (Student who reported it)
```

### Borrow Requests Table (`borrow_requests`)
```
- id (Primary Key)
- user_id (Student borrowing)
- item_id (Item being borrowed)
- quantity (How many)
- purpose (Reason for borrowing)
- notes (Additional notes)
- status (pending/approved/rejected/completed)
- created_at (Request timestamp)
- return_date (Expected return)
```

## API Endpoints

### Inventory Items API
- `GET /api/items` - List all inventory items
- `POST /api/items` - Create new item (admin only)
- `PUT /api/items/:id` - Update item (admin only)
- `DELETE /api/items/:id` - Delete item (admin only)
- `POST /api/items/:id/borrow` - Request to borrow item (students)
- `GET /api/my-borrow-requests` - Get user's borrow requests

### Lost & Found API
- `GET /api/reported-items` - List all reported items
- `POST /api/reported-items` - Report lost/found item
- `DELETE /api/reported-items/:id` - Delete report

### Authentication API
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/logout-all` - Logout from all sessions

See [ITEM_TYPES_ARCHITECTURE.md](ITEM_TYPES_ARCHITECTURE.md) for complete API documentation.

## Troubleshooting

1. **Node modules issues:**
   ```bash
   rm -rf node_modules
   npm install
   ```

2. **Backend can't connect to PostgreSQL:**
   - Verify PostgreSQL service is running
   - Check credentials in `.env` file
   - Ensure database exists or auto-create it
   - Default: `localhost:5432`

3. **Port conflicts:**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`
   - Make sure these ports are available

4. **CORS errors:**
   - Ensure backend is running
   - Check `CORS` configuration in `backend/server.js`
   - Frontend should request from `http://localhost:3001`

5. **Authentication issues:**
   - Clear browser cookies and localStorage
   - Check JWT_SECRET in `.env` file
   - Verify token is being sent in Authorization header

## Documentation

- **[ITEM_TYPES_QUICK_REFERENCE.md](ITEM_TYPES_QUICK_REFERENCE.md)** - User guide for understanding item types
- **[ITEM_TYPES_ARCHITECTURE.md](ITEM_TYPES_ARCHITECTURE.md)** - Technical reference for developers
- **[ITEM_TYPES_VISUAL_GUIDE.md](ITEM_TYPES_VISUAL_GUIDE.md)** - UI/UX visual design guide
- **[ITEM_TYPES_VERIFICATION.md](ITEM_TYPES_VERIFICATION.md)** - Implementation verification report
- **[FEATURES.md](FEATURES.md)** - Complete feature documentation
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Feature integration steps
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI agent guidance

## Quick Start Example

### For Students

1. **Login:** Use your college email and password
2. **Browse items:** Go to Dashboard → "Available Items to Borrow"
3. **Borrow:** Click any item, specify quantity and purpose, submit
4. **Search lost items:** Go to Search, check "Lost & Found Items"
5. **Report lost item:** Click "Report Lost Item" on sidebar

### For Admins

1. **Login:** Use admin credentials
2. **Add items:** Go to Inventory, fill form with details
3. **Manage requests:** Go to "Borrow Requests" to approve/deny
4. **Check logs:** View all activity in Logs section

## Architecture Highlights

- **Secure Authentication:** JWT tokens with 24-hour expiry, bcrypt password hashing
- **Role-Based Access:** Student, Admin, Superadmin, Pending Admin roles
- **Responsive Design:** Mobile, tablet, and desktop views
- **Scalable Database:** PostgreSQL with proper indexing and relationships
- **File Management:** Multer for image uploads with organized storage
- **Session Tracking:** Multi-device logout, session management

## Contributing

To contribute to this project:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review documentation in the repo
3. Contact the development team

## License

This project is for educational purposes within the college system.