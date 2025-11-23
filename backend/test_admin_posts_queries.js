const { Pool } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: 'admin',
  port: 5432,
  database: 'lost_and_found'
};

const pool = new Pool(dbConfig);

async function testAdminPostsQueries() {
  try {
    console.log('Testing admin_posts queries...\n');
    
    // Test SELECT with photo column
    console.log('Testing: SELECT id, user_id, username, content, photo, created_at FROM admin_posts');
    const postsResult = await pool.query(
      `SELECT id, user_id, username, content, photo, created_at FROM admin_posts ORDER BY created_at DESC LIMIT 5`
    );
    console.log(`✓ Query successful. Found ${postsResult.rows.length} posts\n`);

    // Test SELECT from admin_post_replies with photo column
    console.log('Testing: SELECT id, user_id, username, content, photo, created_at FROM admin_post_replies');
    const repliesResult = await pool.query(
      `SELECT id, user_id, username, content, photo, created_at FROM admin_post_replies LIMIT 5`
    );
    console.log(`✓ Query successful. Found ${repliesResult.rows.length} replies\n`);

    console.log('✅ All queries are working correctly!');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAdminPostsQueries();
