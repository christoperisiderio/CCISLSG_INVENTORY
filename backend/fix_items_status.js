const { Pool } = require('pg');

// PostgreSQL connection configuration
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: 'admin',
  port: 5432,
  database: 'lost_and_found'
};

// Create a new pool
const pool = new Pool(dbConfig);

async function fixItemsStatus() {
  try {
    console.log('Fixing item statuses...\n');
    
    // Update all items with status='CCISLSG' to 'available'
    const result = await pool.query(
      `UPDATE items SET status = 'available' WHERE status = 'CCISLSG' OR status = 'unclaimed'
       RETURNING id, name, status;`
    );
    
    if (result.rows.length > 0) {
      console.log(`✓ Updated ${result.rows.length} items:`);
      result.rows.forEach(item => {
        console.log(`  - ${item.name} (ID: ${item.id}) -> status: ${item.status}`);
      });
    } else {
      console.log('✓ No items needed updating - all statuses are correct');
    }
    
    console.log('\n✅ Item status fix complete!');
    
  } catch (error) {
    console.error('❌ Error fixing items:', error.message);
  } finally {
    await pool.end();
  }
}

// Execute the function
fixItemsStatus();
