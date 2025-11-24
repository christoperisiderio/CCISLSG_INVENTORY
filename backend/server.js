const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const port = 3001;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variables

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// PostgreSQL connection configuration
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: 'admin', // Change if your local password is different
  port: 5432,
  database: 'lost_and_found'
};

// Function to create database if it doesn't exist
const createDatabaseIfNotExists = async () => {
  // First connect to the default 'postgres' database
  const defaultPool = new Pool({
    ...dbConfig,
    database: 'postgres'
  });

  try {
    // Check if database exists
    const result = await defaultPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'lost_and_found'"
    );
    
    // If database doesn't exist, create it
    if (result.rows.length === 0) {
      console.log('Creating database lost_and_found...');
      await defaultPool.query('CREATE DATABASE lost_and_found');
      console.log('Database created successfully');
    } else {
      console.log('Database lost_and_found already exists');
    }
  } catch (error) {
    console.error('Error checking/creating database:', error);
  } finally {
    // Close the connection to the default database
    await defaultPool.end();
  }
};

// Create database if it doesn't exist
createDatabaseIfNotExists().then(() => {
  // Now connect to the lost_and_found database
  const pool = new Pool({
    ...dbConfig,
    database: 'lost_and_found'
  });

  // Create tables if they don't exist
  const initializeDatabase = async () => {
    try {
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          role VARCHAR(50) DEFAULT 'student',
          student_id VARCHAR(50),
          admin_role VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create items table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          date DATE NOT NULL,
          location VARCHAR(255) NOT NULL,
          photo VARCHAR(255),
          status VARCHAR(50) DEFAULT 'available',
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by INTEGER REFERENCES users(id)
        )
      `);

      // Add description column if it doesn't exist (for existing tables)
      await pool.query(`
        ALTER TABLE items
        ADD COLUMN IF NOT EXISTS description TEXT
      `);

      // Create borrow_requests table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS borrow_requests (
          id SERIAL PRIMARY KEY,
          item_id INTEGER REFERENCES items(id),
          user_id INTEGER REFERENCES users(id),
          student_id VARCHAR(50),
          request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) DEFAULT 'pending',
          return_date TIMESTAMP,
          notes TEXT,
          quantity INTEGER,
          purpose TEXT
        )
      `);

      // Create reported_items table for lost items reported by users
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reported_items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          date DATE NOT NULL,
          location VARCHAR(255) NOT NULL,
          photo VARCHAR(255),
          description TEXT,
          status VARCHAR(50) DEFAULT 'unclaimed',
          claimed_by_user VARCHAR(255),
          claim_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER REFERENCES users(id)
        )
      `);

      // Add missing columns to reported_items if they don't exist
      await pool.query(`
        ALTER TABLE reported_items
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'unclaimed',
        ADD COLUMN IF NOT EXISTS claimed_by_user VARCHAR(255),
        ADD COLUMN IF NOT EXISTS claim_notes TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);

      // Create notifications table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create user_sessions table for logout tracking
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(255) NOT NULL UNIQUE,
          login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          logout_at TIMESTAMP,
          ip_address VARCHAR(45),
          user_agent VARCHAR(500)
        )
      `);

      // Create admin_posts table for news feed
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          username VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          photo VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add photo column to admin_posts if it doesn't exist
      await pool.query(`
        ALTER TABLE admin_posts
        ADD COLUMN IF NOT EXISTS photo VARCHAR(255)
      `);

      // Create admin_post_replies table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_post_replies (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES admin_posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          username VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          photo VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add photo column to admin_post_replies if it doesn't exist
      await pool.query(`
        ALTER TABLE admin_post_replies
        ADD COLUMN IF NOT EXISTS photo VARCHAR(255)
      `);

      // Create claim_requests table for lost item claims
      await pool.query(`
        CREATE TABLE IF NOT EXISTS claim_requests (
          id SERIAL PRIMARY KEY,
          item_id INTEGER NOT NULL REFERENCES reported_items(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          username VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          claim_notes TEXT,
          photo VARCHAR(255),
          student_id VARCHAR(255),
          approval_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add approval_admin_id column if it doesn't exist (migration for existing databases)
      await pool.query(`
        ALTER TABLE claim_requests
        ADD COLUMN IF NOT EXISTS approval_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL
      `);

      console.log('Database tables created or already exist');
    } catch (err) {
      console.error('Error creating tables:', err);
    }
  };

  // Initialize database
  initializeDatabase();

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage: storage });

  // Helper function to hash token
  const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
  };

  // Helper function to get client IP
  const getClientIp = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '';
  };

  // Middleware to verify JWT token
  const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(403).json({ message: 'No token provided' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      req.user = decoded;
      next();
    });
  };

  // Middleware to check if user is admin
  const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  };

  // Auth Routes
  // Register
  app.post('/api/auth/register', async (req, res) => {
    let { username, password, email, role, student_id } = req.body;
    try {
      // If user selects admin, set role to pending_admin
      if (role === 'admin') {
        role = 'pending_admin';
      }
      // Check if user already exists
      const userCheck = await pool.query(
        'SELECT * FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );
      if (userCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Insert new user
      const result = await pool.query(
        'INSERT INTO users (username, password, email, role, student_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, student_id',
        [username, hashedPassword, email, role || 'student', student_id]
      );
      res.status(201).json({ 
        message: 'User registered successfully',
        user: result.rows[0]
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, student_id: user.student_id, admin_role: user.admin_role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      // Store session in database
      const tokenHash = hashToken(token);
      const clientIp = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      
      await pool.query(
        'INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
        [user.id, tokenHash, clientIp, userAgent]
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          student_id: user.student_id,
          admin_role: user.admin_role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get current user
  app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, username, email, role, student_id, admin_role FROM users WHERE id = $1',
        [req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Logout
  app.post('/api/auth/logout', verifyToken, async (req, res) => {
    try {
      const token = req.headers['authorization']?.split(' ')[1];
      
      if (!token) {
        return res.status(400).json({ message: 'No token provided' });
      }
      
      const tokenHash = hashToken(token);
      
      // Mark session as logged out
      const result = await pool.query(
        'UPDATE user_sessions SET logout_at = CURRENT_TIMESTAMP WHERE token_hash = $1 AND logout_at IS NULL RETURNING id',
        [tokenHash]
      );
      
      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Session not found or already logged out' });
      }
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user session history (for user's own sessions)
  app.get('/api/auth/sessions', verifyToken, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, login_at, logout_at, ip_address, last_activity FROM user_sessions WHERE user_id = $1 ORDER BY login_at DESC LIMIT 10',
        [req.user.id]
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Logout from all devices (invalidate all sessions)
  app.post('/api/auth/logout-all', verifyToken, async (req, res) => {
    try {
      const result = await pool.query(
        'UPDATE user_sessions SET logout_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND logout_at IS NULL',
        [req.user.id]
      );
      
      res.json({ 
        message: 'Logged out from all devices',
        sessionsTerminated: result.rowCount
      });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Item Routes
  // Get all items with total borrowed and available
  app.get('/api/items', verifyToken, async (req, res) => {
    const sortBy = req.query.sort || 'dateAdded';
    let orderBy = 'created_at DESC';
    switch(sortBy) {
      case 'name':
        orderBy = 'name ASC';
        break;
      case 'status':
        orderBy = 'status ASC';
        break;
    }
    try {
      const result = await pool.query(`SELECT *, true as is_admin_reported FROM items ORDER BY ${orderBy}`);
      // For each item, calculate total borrowed and available
      const items = result.rows;
      for (let item of items) {
        const borrowedRes = await pool.query('SELECT SUM(quantity) as total_borrowed FROM borrow_requests WHERE item_id = $1 AND (status = $2 OR status = $3)', [item.id, 'approved', 'partial']);
        item.total_borrowed = parseInt(borrowedRes.rows[0].total_borrowed, 10) || 0;
        item.available = item.quantity - item.total_borrowed;
      }
      res.json(items);
    } catch (error) {
      console.error('Get items error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Search items
  app.get('/api/items/search', verifyToken, async (req, res) => {
    const searchQuery = req.query.q;
    const sortBy = req.query.sort || 'dateAdded';
    let orderBy = 'created_at DESC';
    
    switch(sortBy) {
      case 'name':
        orderBy = 'name ASC';
        break;
      case 'status':
        orderBy = 'status ASC';
        break;
    }
    
    try {
      const result = await pool.query(
        `SELECT * FROM items 
         WHERE name ILIKE $1 OR location ILIKE $1 
         ORDER BY ${orderBy}`,
        [`%${searchQuery}%`]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Search items error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add new item (admin only)
  app.post('/api/items', verifyToken, isAdmin, upload.single('photo'), async (req, res) => {
    const { name, date, location, quantity, status, description } = req.body;
    const photo = req.file ? req.file.filename : null;
    try {
      const result = await pool.query(
        'INSERT INTO items (name, quantity, date, location, photo, status, description, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [name, quantity || 1, date, location, photo, status || 'available', description || null, req.user.id]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Add item error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add new item (student report)
  app.post('/api/items/report', verifyToken, upload.single('photo'), async (req, res) => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can report lost items' });
    }
    const { name, date, location, quantity } = req.body;
    const photo = req.file ? req.file.filename : null;
    try {
      const result = await pool.query(
        'INSERT INTO items (name, quantity, date, location, photo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, quantity || 1, date, location, photo]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Student report item error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update item status (admin only)
  app.patch('/api/items/:id/status', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      await pool.query(
        'UPDATE items SET status = $1 WHERE id = $2',
        [status, id]
      );
      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update item details (admin only)
  app.put('/api/items/:id', verifyToken, isAdmin, upload.single('photo'), async (req, res) => {
    const { id } = req.params;
    const { name, date, location, quantity, description, status } = req.body;
    
    try {
      let query = 'UPDATE items SET name = $1, date = $2, location = $3, quantity = $4';
      let params = [name, date, location, quantity];
      let paramCount = 5;
      
      if (description !== undefined) {
        query += `, description = $${paramCount}`;
        params.push(description);
        paramCount++;
      }
      
      if (status) {
        query += `, status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }
      
      if (req.file) {
        query += `, photo = $${paramCount}`;
        params.push(req.file.filename);
        paramCount++;
      }
      
      query += ` WHERE id = $${paramCount}`;
      params.push(id);
      
      const result = await pool.query(query, params);
      res.json({ message: 'Item updated successfully' });
    } catch (error) {
      console.error('Update item error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete item (admin only)
  app.delete('/api/items/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
      // Check if item exists
      const itemCheck = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
      if (itemCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Check if item has any borrow requests
      const borrowCheck = await pool.query('SELECT * FROM borrow_requests WHERE item_id = $1', [id]);
      if (borrowCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete item with active borrow requests. Please handle all borrow requests first.' 
        });
      }
      
      // Delete the item
      await pool.query('DELETE FROM items WHERE id = $1', [id]);
      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Delete item error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Borrow request (student only)
  app.post('/api/items/:id/borrow', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { notes, quantity, purpose } = req.body;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can request to borrow items' });
    }
    
    try {
      console.log(`[BORROW] Student ${req.user.id} requesting to borrow item ${id}, quantity: ${quantity}`);
      
      // Check if item exists and is available
      const itemCheck = await pool.query(
        'SELECT * FROM items WHERE id = $1',
        [id]
      );
      
      if (itemCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Item not found' });
      }
      const item = itemCheck.rows[0];
      console.log(`[BORROW] Item found: ${item.name}, status: ${item.status}, quantity: ${item.quantity}`);
      
      // Check if item is available (not maintenance or damaged)
      if (item.status && (item.status === 'maintenance' || item.status === 'damaged')) {
        console.log(`[BORROW] Item is ${item.status}, cannot borrow`);
        return res.status(400).json({ message: `Item is currently ${item.status} and cannot be borrowed.` });
      }
      
      if (item.quantity <= 0) {
        console.log(`[BORROW] Item quantity is ${item.quantity}, not available`);
        return res.status(400).json({ message: 'Item is not available for borrowing (quantity is zero).' });
      }
      
      // Check if requested quantity is greater than available quantity
      if (quantity > item.quantity) {
        console.log(`[BORROW] Requested ${quantity} but only ${item.quantity} available`);
        return res.status(400).json({ 
          message: `Cannot borrow ${quantity} items. Only ${item.quantity} items are available.` 
        });
      }
      
      console.log(`[BORROW] All checks passed, creating borrow request for user ${req.user.id}`);
      
      // Create borrow request
      const result = await pool.query(
        'INSERT INTO borrow_requests (item_id, user_id, student_id, notes, quantity, purpose) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, req.user.id, req.user.student_id || null, notes, quantity, purpose]
      );
      
      console.log(`[BORROW] Borrow request created with ID: ${result.rows[0].id}`);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Borrow request error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get borrow requests (admin only)
  app.get('/api/borrow-requests', verifyToken, isAdmin, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT br.*, u.username, u.email, i.name as item_name 
        FROM borrow_requests br
        JOIN users u ON br.user_id = u.id
        JOIN items i ON br.item_id = i.id
        ORDER BY br.request_date DESC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Get borrow requests error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to send notification
  async function sendNotification(user_id, message) {
    await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [user_id, message]);
  }

  // Update borrow request status (admin only)
  app.patch('/api/borrow-requests/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, return_date, returned_quantity } = req.body;
    try {
      // Get the borrow request
      const requestCheck = await pool.query(
        'SELECT * FROM borrow_requests WHERE id = $1',
        [id]
      );
      if (requestCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Borrow request not found' });
      }
      let request = requestCheck.rows[0];
      let newStatus = status;
      // If returned, check for partial return and update status only
      if (status === 'returned') {
        const returnedQty = parseInt(returned_quantity, 10);
        if (isNaN(returnedQty) || returnedQty <= 0) {
          return res.status(400).json({ message: 'Returned quantity must be a positive integer.' });
        }
        if (returnedQty > (request.quantity || 1)) {
          return res.status(400).json({ message: 'Returned quantity cannot exceed borrowed quantity.' });
        }
        // If partial return, set status to 'partial'
        if (returnedQty < (request.quantity || 1)) {
          newStatus = 'partial';
        }
        // No update to item.quantity here!
        // Optionally, send notification to student
        await sendNotification(request.user_id, `Your borrowed item (ID ${request.item_id}) has been returned.`);
      }
      // Update the borrow request
      await pool.query(
        'UPDATE borrow_requests SET status = $1, return_date = $2 WHERE id = $3',
        [newStatus, return_date, id]
      );
      res.json({ message: 'Borrow request updated successfully' });
    } catch (error) {
      console.error('Update borrow request error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's borrow requests
  app.get('/api/my-borrow-requests', verifyToken, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT br.*, i.name as item_name 
        FROM borrow_requests br
        JOIN items i ON br.item_id = i.id
        WHERE br.user_id = $1
        ORDER BY br.request_date DESC
      `, [req.user.id]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Get my borrow requests error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin-only routes
  // Export to CSV
  app.get('/api/admin/export', verifyToken, isAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM items');
      const csv = convertToCSV(result.rows);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
      res.send(csv);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Export only CCISLSG items to CSV
  app.get('/api/admin/export-ccislsg', verifyToken, isAdmin, async (req, res) => {
    try {
      const result = await pool.query("SELECT id, name, quantity, date, location, status, description, created_at FROM items ORDER BY created_at DESC");
      
      // For each item, calculate total borrowed and available
      const items = result.rows;
      for (let item of items) {
        const borrowedRes = await pool.query('SELECT SUM(quantity) as total_borrowed FROM borrow_requests WHERE item_id = $1 AND (status = $2 OR status = $3)', [item.id, 'approved', 'partial']);
        item.total_borrowed = parseInt(borrowedRes.rows[0].total_borrowed, 10) || 0;
        item.available = item.quantity - item.total_borrowed;
      }
      
      const csv = convertToCSV(items);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ccislsg_inventory.csv');
      res.send(csv);
    } catch (error) {
      console.error('Export CCISLSG error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Helper function to convert JSON to CSV
  function convertToCSV(items) {
    const headers = ['id', 'name', 'quantity', 'available', 'total_borrowed', 'date', 'location', 'status', 'description', 'created_at'];
    const csvRows = [headers.join(',')];
    
    for (const item of items) {
      const values = headers.map(header => {
        const value = item[header];
        // Escape quotes and wrap in quotes if value contains comma
        if (value === null || value === undefined) {
          return '""';
        }
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  // Report a lost item (admin/superadmin only)
  app.post('/api/reported-items', verifyToken, upload.single('photo'), async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'pending_admin') {
      return res.status(403).json({ message: 'Only admins can report lost items' });
    }
    const { name, date, location, description } = req.body;
    const photo = req.file ? req.file.filename : null;
    try {
      const result = await pool.query(
        'INSERT INTO reported_items (name, date, location, photo, user_id, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, date, location, photo, req.user.id, description || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Report lost item error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update reported item status (admin/superadmin only - mark as surrendered to owner)
  app.patch('/api/reported-items/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'pending_admin') {
      return res.status(403).json({ message: 'Only admins can update lost items' });
    }
    const { id } = req.params;
    const { status, claimed_by_user, claim_notes } = req.body;
    
    try {
      const result = await pool.query(
        'UPDATE reported_items SET status = $1, claimed_by_user = $2, claim_notes = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [status, claimed_by_user || null, claim_notes || null, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update lost item error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Student submit claim request for lost item (students only)
  app.post('/api/reported-items/:id/claim', verifyToken, upload.single('photo'), async (req, res) => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can claim lost items' });
    }
    const { id } = req.params;
    const { claim_notes, student_id } = req.body;
    const photoFile = req.file ? req.file.filename : null;
    
    try {
      // Check if item exists and is unclaimed
      const itemCheck = await pool.query('SELECT * FROM reported_items WHERE id = $1', [id]);
      if (itemCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      const item = itemCheck.rows[0];
      if (item.status !== 'unclaimed') {
        return res.status(400).json({ message: 'Item is no longer available for claiming' });
      }
      
      // Check if student already has a pending claim for this item
      const existingClaim = await pool.query(
        'SELECT * FROM claim_requests WHERE item_id = $1 AND user_id = $2 AND status = $3',
        [id, req.user.id, 'pending']
      );
      
      if (existingClaim.rows.length > 0) {
        return res.status(400).json({ message: 'You already have a pending claim for this item' });
      }
      
      // Create claim request
      const result = await pool.query(
        'INSERT INTO claim_requests (item_id, user_id, username, status, claim_notes, photo, student_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *',
        [id, req.user.id, req.user.username, 'pending', claim_notes || '', photoFile, student_id || '']
      );
      
      res.json({ message: 'Claim request submitted successfully. Waiting for admin approval.', claim: result.rows[0] });
    } catch (error) {
      console.error('Claim lost item error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all claim requests (admin/superadmin only)
  app.get('/api/claim-requests', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'pending_admin') {
      return res.status(403).json({ message: 'Only admins can view claim requests' });
    }

    const statusFilter = req.query.status; // optional: 'pending', 'approved', 'rejected'
    let query = `
      SELECT 
        cr.*,
        ri.name as item_name,
        ri.photo as item_photo,
        ri.location,
        ri.description as item_description
      FROM claim_requests cr
      JOIN reported_items ri ON cr.item_id = ri.id
    `;
    let params = [];

    if (statusFilter) {
      query += ' WHERE cr.status = $1';
      params.push(statusFilter);
    }

    query += ' ORDER BY cr.created_at DESC';

    try {
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Get claim requests error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Approve or reject claim request (admin/superadmin only)
  app.patch('/api/claim-requests/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'pending_admin') {
      return res.status(403).json({ message: 'Only admins can update claim requests' });
    }

    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    try {
      // Get the claim request
      const claimCheck = await pool.query('SELECT * FROM claim_requests WHERE id = $1', [id]);
      if (claimCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Claim request not found' });
      }

      const claim = claimCheck.rows[0];

      // Update claim status
      const result = await pool.query(
        'UPDATE claim_requests SET status = $1, approval_admin_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [status, req.user.id, id]
      );

      // If approved, update the reported_items record
      if (status === 'approved') {
        await pool.query(
          'UPDATE reported_items SET status = $1, claimed_by_user = $2, updated_at = NOW() WHERE id = $3',
          ['claimed', claim.username, claim.item_id]
        );
      }

      res.json({ message: `Claim request ${status} successfully`, claim: result.rows[0] });
    } catch (error) {
      console.error('Update claim request error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get/search reported lost items (students)
  app.get('/api/reported-items', verifyToken, async (req, res) => {
    const searchQuery = req.query.q;
    let query = 'SELECT * FROM reported_items';
    let params = [];
    if (searchQuery) {
      query += ' WHERE name ILIKE $1 OR location ILIKE $1';
      params.push(`%${searchQuery}%`);
    }
    query += ' ORDER BY created_at DESC';
    try {
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Get reported items error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Logs endpoint for recent actions
  app.get('/api/logs', verifyToken, async (req, res) => {
    try {
      // Recent borrow actions (approved/partial/returned)
      const borrowLogs = await pool.query(`
        SELECT br.id, 'borrow' as action, u.username, u.role, i.name as item_name, br.quantity, br.request_date as date, br.status, br.return_date
        FROM borrow_requests br
        JOIN users u ON br.user_id = u.id
        JOIN items i ON br.item_id = i.id
        WHERE br.status IN ('approved', 'partial', 'returned')
        ORDER BY br.request_date DESC
        LIMIT 20
      `);
      // Recent inventory additions (admin only, correct join)
      const inventoryLogs = await pool.query(`
        SELECT i.id, 'add_inventory' as action, u.username, u.role, i.name as item_name, i.quantity, i.date as date
        FROM items i
        JOIN users u ON i.created_by = u.id
        WHERE i.created_at > NOW() - INTERVAL '30 days'
        ORDER BY i.created_at DESC
        LIMIT 20
      `);
      // Recent lost item reports (students and admins)
      const lostLogs = await pool.query(`
        SELECT r.id, 'report_lost' as action, u.username, u.role, r.name as item_name, 1 as quantity, r.date as date
        FROM reported_items r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
        LIMIT 20
      `);
      // Recent claim requests (students submitting claims)
      const claimRequestLogs = await pool.query(`
        SELECT cr.id, 'claim_request' as action, u.username, u.role, ri.name as item_name, cr.status, cr.created_at as date
        FROM claim_requests cr
        JOIN users u ON cr.user_id = u.id
        JOIN reported_items ri ON cr.item_id = ri.id
        ORDER BY cr.created_at DESC
        LIMIT 20
      `);
      // Recent claim approvals/rejections (admin responses)
      const claimResponseLogs = await pool.query(`
        SELECT cr.id, 'claim_response' as action, COALESCE(u_admin.username, 'Unknown') as username, COALESCE(u_admin.role, 'admin') as role, ri.name as item_name, cr.status, cr.updated_at as date
        FROM claim_requests cr
        JOIN reported_items ri ON cr.item_id = ri.id
        LEFT JOIN users u_admin ON cr.approval_admin_id = u_admin.id
        WHERE cr.status IN ('approved', 'rejected')
        ORDER BY cr.updated_at DESC
        LIMIT 20
      `);
      // Merge and sort logs by date descending
      const logs = [
        ...borrowLogs.rows,
        ...inventoryLogs.rows,
        ...lostLogs.rows,
        ...claimRequestLogs.rows,
        ...claimResponseLogs.rows
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      res.json(logs.slice(0, 60));
    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending admin requests (superadmin only)
  app.get('/api/admin-requests', verifyToken, async (req, res) => {
    try {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required' });
      }
      const result = await pool.query(
        `SELECT id, username, email, student_id, created_at, admin_role FROM users WHERE role = 'pending_admin' ORDER BY created_at DESC`
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get admin requests error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all current admins (superadmin only)
  app.get('/api/admins/all', verifyToken, async (req, res) => {
    try {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required' });
      }
      const result = await pool.query(
        `SELECT id, username, email, admin_role, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC`
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get all admins error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Approve or reject admin requests (superadmin only)
  app.patch('/api/admin-requests/:id', verifyToken, async (req, res) => {
    try {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required' });
      }
      const { id } = req.params;
      const { action, admin_role } = req.body;
      if (action === 'approve') {
        if (!admin_role) {
          return res.status(400).json({ message: 'Admin role is required for approval.' });
        }
        await pool.query(
          'UPDATE users SET role = $1, admin_role = $2 WHERE id = $3',
          ['admin', admin_role, id]
        );
        return res.json({ message: 'Admin request approved and role assigned.' });
      } else if (action === 'reject') {
        await pool.query(
          'UPDATE users SET role = $1, admin_role = NULL WHERE id = $2',
          ['student', id]
        );
        return res.json({ message: 'Admin request rejected and user reverted to student.' });
      } else {
        return res.status(400).json({ message: 'Invalid action.' });
      }
    } catch (error) {
      console.error('Update admin request error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all admin posts with replies (news feed)
  app.get('/api/admin-posts', verifyToken, async (req, res) => {
    try {
      const posts = await pool.query(
        `SELECT id, user_id, username, content, photo, created_at FROM admin_posts ORDER BY created_at DESC LIMIT 100`
      );
      
      // For each post, fetch its replies
      const postsWithReplies = await Promise.all(posts.rows.map(async (post) => {
        const replies = await pool.query(
          `SELECT id, user_id, username, content, photo, created_at FROM admin_post_replies WHERE post_id = $1 ORDER BY created_at ASC`,
          [post.id]
        );
        return { ...post, replies: replies.rows };
      }));
      
      res.json(postsWithReplies);
    } catch (error) {
      console.error('Get admin posts error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create admin post with optional photo
  app.post('/api/admin-posts', verifyToken, upload.single('photo'), async (req, res) => {
    try {
      // Allow admin, superadmin, and pending_admin to create posts
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'pending_admin') {
        return res.status(403).json({ message: 'Only admins can create posts' });
      }
      const { content } = req.body;
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Post content cannot be empty' });
      }
      const photo = req.file ? req.file.filename : null;
      const result = await pool.query(
        `INSERT INTO admin_posts (user_id, username, content, photo) VALUES ($1, $2, $3, $4) RETURNING id, user_id, username, content, photo, created_at`,
        [req.user.id, req.user.username, content, photo]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create admin post error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete admin post (only by creator or superadmin)
  app.delete('/api/admin-posts/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await pool.query('SELECT user_id FROM admin_posts WHERE id = $1', [id]);
      
      if (post.rows.length === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (post.rows[0].user_id !== req.user.id && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Unauthorized to delete this post' });
      }

      await pool.query('DELETE FROM admin_posts WHERE id = $1', [id]);
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Delete admin post error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create reply to admin post
  app.post('/api/admin-posts/:postId/replies', verifyToken, upload.single('photo'), async (req, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'pending_admin') {
        return res.status(403).json({ message: 'Only admins can reply' });
      }
      const { postId } = req.params;
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Reply content cannot be empty' });
      }

      // Check if post exists
      const postExists = await pool.query('SELECT id FROM admin_posts WHERE id = $1', [postId]);
      if (postExists.rows.length === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const photo = req.file ? req.file.filename : null;
      const result = await pool.query(
        `INSERT INTO admin_post_replies (post_id, user_id, username, content, photo) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, username, content, photo, created_at`,
        [postId, req.user.id, req.user.username, content, photo]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create reply error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete reply (only by creator or superadmin)
  app.delete('/api/admin-posts/replies/:replyId', verifyToken, async (req, res) => {
    try {
      const { replyId } = req.params;
      const reply = await pool.query('SELECT user_id FROM admin_post_replies WHERE id = $1', [replyId]);
      
      if (reply.rows.length === 0) {
        return res.status(404).json({ message: 'Reply not found' });
      }

      if (reply.rows[0].user_id !== req.user.id && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Unauthorized to delete this reply' });
      }

      await pool.query('DELETE FROM admin_post_replies WHERE id = $1', [replyId]);
      res.json({ message: 'Reply deleted successfully' });
    } catch (error) {
      console.error('Delete reply error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete all lost items data (superadmin only)
  app.delete('/api/admin/clear-lost-items', verifyToken, async (req, res) => {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can clear lost items' });
    }

    try {
      // Delete all claim requests first (foreign key constraint)
      await pool.query('DELETE FROM claim_requests');
      // Delete all reported items
      await pool.query('DELETE FROM reported_items');
      res.json({ message: 'All lost items and claim requests have been deleted successfully' });
    } catch (error) {
      console.error('Clear lost items error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel claim request (student only - own claims)
  app.delete('/api/claim-requests/:id/cancel', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can cancel their own claims' });
    }

    const { id } = req.params;

    try {
      // Check if claim exists and belongs to the student
      const claimCheck = await pool.query(
        'SELECT * FROM claim_requests WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (claimCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Claim request not found or not yours' });
      }

      const claim = claimCheck.rows[0];

      // Only allow cancellation if status is pending
      if (claim.status !== 'pending') {
        return res.status(400).json({ message: `Cannot cancel ${claim.status} claim request` });
      }

     
      await pool.query('DELETE FROM claim_requests WHERE id = $1', [id]);

      res.json({ message: 'Claim request cancelled successfully' });
    } catch (error) {
      console.error('Cancel claim request error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  module.exports = app;
});