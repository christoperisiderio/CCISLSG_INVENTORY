const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
          status VARCHAR(50) DEFAULT 'unclaimed',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by INTEGER REFERENCES users(id)
        )
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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER REFERENCES users(id)
        )
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
    const { name, date, location, quantity } = req.body;
    const photo = req.file ? req.file.filename : null;
    try {
      const result = await pool.query(
        'INSERT INTO items (name, quantity, date, location, photo, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, quantity || 1, date, location, photo, req.user.id]
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
    const { name, date, location, quantity, description } = req.body;
    
    try {
      let query = 'UPDATE items SET name = $1, date = $2, location = $3, quantity = $4';
      let params = [name, date, location, quantity];
      let paramCount = 5;
      
      if (description) {
        query += `, description = $${paramCount}`;
        params.push(description);
        paramCount++;
      }
      
      if (req.file) {
        query += `, photo = $${paramCount}`;
        params.push(req.file.filename);
        paramCount++;
      }
      
      query += ` WHERE id = $${paramCount}`;
      params.push(id);
      
      await pool.query(query, params);
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
      // Check if item exists and is available
      const itemCheck = await pool.query(
        'SELECT * FROM items WHERE id = $1',
        [id]
      );
      
      if (itemCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Item not found' });
      }
      const item = itemCheck.rows[0];
      // Only allow borrowing for CCISLSG items with quantity > 0
      if (item.type !== 'CCISLSG') {
        return res.status(400).json({ message: 'Only CCISLSG items can be borrowed by students.' });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ message: 'Item is not available for borrowing (quantity is zero).' });
      }
      // Check if requested quantity is greater than available quantity
      if (quantity > item.quantity) {
        return res.status(400).json({ 
          message: `Cannot borrow ${quantity} items. Only ${item.quantity} items are available.` 
        });
      }
      // Create borrow request
      const result = await pool.query(
        'INSERT INTO borrow_requests (item_id, user_id, student_id, notes, quantity, purpose) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, req.user.id, req.user.student_id, notes, quantity, purpose]
      );
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
      const result = await pool.query("SELECT * FROM items WHERE type = 'CCISLSG'");
      const csv = convertToCSV(result.rows);
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
    const headers = ['id', 'name', 'date', 'location', 'status', 'created_at'];
    const csvRows = [headers.join(',')];
    
    for (const item of items) {
      const values = headers.map(header => {
        const value = item[header];
        return `"${value}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  // Report a lost item (students)
  app.post('/api/reported-items', verifyToken, upload.single('photo'), async (req, res) => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can report lost items' });
    }
    const { name, date, location } = req.body;
    const photo = req.file ? req.file.filename : null;
    try {
      const result = await pool.query(
        'INSERT INTO reported_items (name, date, location, photo, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, date, location, photo, req.user.id]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Report lost item error:', error);
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
      // Merge and sort logs by date descending
      const logs = [
        ...borrowLogs.rows,
        ...inventoryLogs.rows,
        ...lostLogs.rows
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      res.json(logs.slice(0, 40));
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

  if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  module.exports = app;
});