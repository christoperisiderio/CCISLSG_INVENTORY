# CCISLSG Inventory System Setup Guide

This guide will help you set up the CCISLSG Inventory System on your PC.

## Prerequisites

1. **Node.js and npm**
   - Download and install Node.js from [https://nodejs.org/](https://nodejs.org/)
   - Recommended version: Node.js 18.x or later
   - npm will be installed automatically with Node.js

2. **MySQL**
   - Download and install MySQL from [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/)
   - Make sure to remember your MySQL root password during installation

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

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Create a .env file in the backend directory with the following variables:
# DB_HOST=localhost
# DB_USER=your_mysql_username
# DB_PASSWORD=your_mysql_password
# DB_NAME=your_database_name
# JWT_SECRET=your_jwt_secret_key

# Start the backend server
npm run dev
```

## Required Dependencies

### Frontend Dependencies
- React 19.0.0 - Core library for building user interfaces
- Material-UI (@mui/material, @mui/icons-material) - UI component library for consistent design and pre-built components
- React Router DOM 7.5.2 - Handles routing and navigation between different pages
- Axios 1.9.0 - HTTP client for making API requests to the backend
- React Responsive 10.0.1 - Helps create responsive layouts that adapt to different screen sizes

### Backend Dependencies
- Express 4.18.2 - Web framework for Node.js, handles HTTP requests and routing
- MySQL2 3.6.0 - MySQL client for Node.js, enables database operations
- bcrypt 5.1.1 - Password hashing library for secure user authentication
- jsonwebtoken 9.0.2 - Creates and verifies JSON Web Tokens for user authentication
- cors 2.8.5 - Enables Cross-Origin Resource Sharing for API access from frontend
- multer 1.4.5-lts.1 - Handles file uploads in the application

## Development Tools
- Vite 6.3.1 - Modern build tool that provides fast development server and optimized production builds
- ESLint 9.22.0 - Code linting tool to maintain code quality and catch potential errors
- Nodemon 3.0.1 - Automatically restarts the server when code changes are detected

## Troubleshooting

1. If you encounter any issues with node modules:
   ```bash
   # Delete node_modules and reinstall
   rm -rf node_modules
   npm install
   ```

2. If the backend fails to connect to MySQL:
   - Verify MySQL service is running
   - Check your database credentials in the .env file
   - Ensure the database exists

3. If you get port conflicts:
   - Frontend runs on port 5173 by default
   - Backend runs on port 3000 by default
   - Make sure these ports are available

## Support

If you encounter any issues during setup, please contact the development team for assistance.
