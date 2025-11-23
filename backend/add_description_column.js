const { Pool } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: 'admin',
  port: 5432,
  database: 'lost_and_found'
};

const pool = new Pool(dbConfig);

async function addDescriptionColumn() {
  try {
    console.log('Checking if description column exists...');
    
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'items' AND column_name = 'description'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Description column already exists');
    } else {
      console.log('Adding description column to items table...');
      await pool.query(`
        ALTER TABLE items
        ADD COLUMN description TEXT
      `);
      console.log('✅ Description column added successfully');
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addDescriptionColumn();
