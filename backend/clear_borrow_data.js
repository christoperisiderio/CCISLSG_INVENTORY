const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'lost_and_found',
  password: 'admin',
  port: 5432,
});

async function clearBorrowData() {
  try {
    // First, update all borrowed items back to unclaimed
    await pool.query(`
      UPDATE items 
      SET status = 'unclaimed' 
      WHERE status = 'borrowed'
    `);
    console.log('Updated borrowed items back to unclaimed status');

    // Then, delete all borrow requests
    await pool.query('DELETE FROM borrow_requests');
    console.log('Deleted all borrow requests');

    // Finally, delete any related notifications
    await pool.query(`
      DELETE FROM notifications 
      WHERE message LIKE '%borrow request%'
    `);
    console.log('Deleted borrow-related notifications');

    console.log('Successfully cleared all borrow-related data');
  } catch (err) {
    console.error('Error clearing borrow data:', err);
  } finally {
    await pool.end();
  }
}

clearBorrowData(); 