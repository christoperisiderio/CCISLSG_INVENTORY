const { Pool } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: 'admin',
  port: 5432,
  database: 'lost_and_found'
};

const pool = new Pool(dbConfig);

async function fixItemsTable() {
  try {
    console.log('Verifying items table structure...\n');
    
    // Check current columns
    const checkResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'items'
      ORDER BY ordinal_position
    `);

    console.log('Current items table columns:');
    checkResult.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}: ${row.data_type}`);
    });

    const hasDescription = checkResult.rows.some(r => r.column_name === 'description');
    
    if (!hasDescription) {
      console.log('\nAdding missing description column...');
      await pool.query(`ALTER TABLE items ADD COLUMN description TEXT`);
      console.log('✓ Description column added\n');
    } else {
      console.log('\n✓ Description column already exists\n');
    }

    // Test insert to verify it works
    console.log('Testing INSERT statement...');
    const testResult = await pool.query(`
      INSERT INTO items 
      (name, quantity, date, location, photo, status, description, created_by) 
      VALUES 
      ('Test Item', 1, '2025-11-23', 'Test Location', NULL, 'available', 'Test Description', 1) 
      RETURNING id
    `);
    
    if (testResult.rows.length > 0) {
      console.log('✓ INSERT test successful\n');
      
      // Delete the test item
      await pool.query('DELETE FROM items WHERE id = $1', [testResult.rows[0].id]);
      console.log('✓ Test item cleaned up\n');
    }

    console.log('✅ All checks passed! The database is ready.');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixItemsTable();
