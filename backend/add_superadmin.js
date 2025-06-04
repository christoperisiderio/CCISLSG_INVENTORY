const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// PostgreSQL connection configuration
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: 'admin', // Default PostgreSQL password, change this to your actual password
  port: 5432,
  database: 'lost_and_found'
};

// Create a new pool
const pool = new Pool(dbConfig);

// Function to add a superadmin user
const addSuperAdmin = async () => {
  try {
    console.log('Adding superadmin user...');
    
    // User details
    const username = 'topead';
    const password = 'admin1';
    const email = 'topead@example.com'; // Using a placeholder email
    const role = 'superadmin';
    const adminRole = 'superadmin';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (userCheck.rows.length > 0) {
      console.log('User already exists. Updating to superadmin...');
      
      // Update existing user to superadmin
      await pool.query(
        'UPDATE users SET role = $1, admin_role = $2, password = $3 WHERE username = $4',
        [role, adminRole, hashedPassword, username]
      );
      
      console.log('User updated to superadmin successfully!');
    } else {
      // Insert new superadmin user
      await pool.query(
        'INSERT INTO users (username, password, email, role, admin_role) VALUES ($1, $2, $3, $4, $5)',
        [username, hashedPassword, email, role, adminRole]
      );
      
      console.log('Superadmin user added successfully!');
    }
  } catch (error) {
    console.error('Error adding superadmin:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
};

// Execute the function
addSuperAdmin(); 