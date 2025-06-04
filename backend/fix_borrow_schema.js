const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'lost_and_found',
  password: 'admin',
  port: 5432,
});

async function fixBorrowSchema() {
  try {
    // Check if purpose column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'borrow_requests' AND column_name = 'purpose'
    `);
    
    if (checkResult.rows.length === 0) {
      // Add purpose column if it doesn't exist
      await pool.query(`
        ALTER TABLE borrow_requests 
        ADD COLUMN purpose TEXT
      `);
      console.log('Added purpose column to borrow_requests table');
    } else {
      console.log('Purpose column already exists in borrow_requests table');
    }
    
    // Check if quantity column exists
    const checkQuantityResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'borrow_requests' AND column_name = 'quantity'
    `);
    
    if (checkQuantityResult.rows.length === 0) {
      // Add quantity column if it doesn't exist
      await pool.query(`
        ALTER TABLE borrow_requests 
        ADD COLUMN quantity INTEGER
      `);
      console.log('Added quantity column to borrow_requests table');
    } else {
      console.log('Quantity column already exists in borrow_requests table');
    }
    
    console.log('Schema check completed successfully');
  } catch (err) {
    console.error('Error fixing borrow schema:', err);
  } finally {
    await pool.end();
  }
}

fixBorrowSchema(); 