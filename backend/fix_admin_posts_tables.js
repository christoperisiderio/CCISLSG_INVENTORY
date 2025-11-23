const { Pool } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: 'admin',
  port: 5432,
  database: 'lost_and_found'
};

const pool = new Pool(dbConfig);

async function fixAdminPostsTables() {
  try {
    console.log('Verifying admin_posts and admin_post_replies tables...\n');
    
    // Check admin_posts columns
    const postsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'admin_posts'
      ORDER BY ordinal_position
    `);

    console.log('admin_posts table columns:');
    postsResult.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}: ${row.data_type}`);
    });

    const hasPostPhoto = postsResult.rows.some(r => r.column_name === 'photo');
    
    if (!hasPostPhoto) {
      console.log('\nAdding missing photo column to admin_posts...');
      await pool.query(`ALTER TABLE admin_posts ADD COLUMN photo VARCHAR(255)`);
      console.log('✓ Photo column added to admin_posts\n');
    } else {
      console.log('\n✓ Photo column already exists in admin_posts\n');
    }

    // Check admin_post_replies columns
    const repliesResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'admin_post_replies'
      ORDER BY ordinal_position
    `);

    console.log('admin_post_replies table columns:');
    repliesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}: ${row.data_type}`);
    });

    const hasReplyPhoto = repliesResult.rows.some(r => r.column_name === 'photo');
    
    if (!hasReplyPhoto) {
      console.log('\nAdding missing photo column to admin_post_replies...');
      await pool.query(`ALTER TABLE admin_post_replies ADD COLUMN photo VARCHAR(255)`);
      console.log('✓ Photo column added to admin_post_replies\n');
    } else {
      console.log('\n✓ Photo column already exists in admin_post_replies\n');
    }

    console.log('✅ All tables are ready!');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminPostsTables();
