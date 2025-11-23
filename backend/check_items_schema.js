const { Pool } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: 'admin',
  port: 5432,
  database: 'lost_and_found'
};

const pool = new Pool(dbConfig);

async function checkItemsTable() {
  try {
    console.log('Checking items table structure...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'items'
      ORDER BY ordinal_position
    `);

    console.log('\nItems table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkItemsTable();
