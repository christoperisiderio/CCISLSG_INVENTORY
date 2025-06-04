const { Pool } = require('pg');

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

// Function to clear all data from tables
const clearAllData = async () => {
  try {
    console.log('Starting to clear all data from the database...');
    
    // Disable foreign key constraints temporarily
    await pool.query('SET session_replication_role = replica;');
    
    // Clear data from all tables
    await pool.query('TRUNCATE TABLE notifications CASCADE;');
    await pool.query('TRUNCATE TABLE borrow_requests CASCADE;');
    await pool.query('TRUNCATE TABLE reported_items CASCADE;');
    await pool.query('TRUNCATE TABLE items CASCADE;');
    await pool.query('TRUNCATE TABLE users CASCADE;');
    
    // Re-enable foreign key constraints
    await pool.query('SET session_replication_role = DEFAULT;');
    
    console.log('All data has been cleared successfully!');
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
};

// Execute the function
clearAllData(); 