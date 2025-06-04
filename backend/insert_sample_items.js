const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'lost_and_found',
  password: 'admin', // Change if your password is different
  port: 5432,
});

async function insertSampleItems() {
  try {
    await pool.query(`
      INSERT INTO items (name, date, location, status, quantity, description) VALUES
        ('Tablet', '2024-06-13', 'Library', 'unclaimed', 5, 'Samsung Galaxy Tab, ready for use'),
        ('Camera', '2024-06-14', 'Media Room', 'unclaimed', 3, 'Canon DSLR, with lens kit'),
        ('Tripod', '2024-06-15', 'AV Room', 'unclaimed', 7, 'Adjustable tripod, lightweight'),
        ('Lost Wallet', '2024-06-16', 'Hallway', 'lost', 1, 'Black leather wallet')
    `);
    console.log('Sample items inserted successfully!');
  } catch (err) {
    console.error('Error inserting sample items:', err);
  }
}

async function insertSuperadmin() {
  const username = 'topead';
  const password = 'admin1';
  const email = 'superadmin@ccislsuperadmin.edu';
  const role = 'superadmin';
  const student_id = null;
  try {
    // Remove any existing user with this username
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (username, password, email, role, student_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [username, hashedPassword, email, role, student_id]
    );
    console.log('Superadmin inserted!');
  } catch (err) {
    console.error('Error inserting superadmin:', err);
  }
}

async function deleteAllRegisteredItems() {
  try {
    await pool.query('DELETE FROM borrow_requests');
    await pool.query('DELETE FROM items');
    console.log('All registered items and borrow requests deleted!');
  } catch (err) {
    console.error('Error deleting registered items:', err);
  }
}

async function ensureAdminRoleColumn() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role VARCHAR(100)');
    console.log('admin_role column added or already exists');
  } catch (err) {
    console.error('Error ensuring admin_role column:', err);
  }
}

async function deleteAdminsWithoutRole() {
  try {
    await pool.query("DELETE FROM users WHERE role = 'admin' AND (admin_role IS NULL OR admin_role = '')");
    console.log('All accepted admins without a role have been deleted!');
  } catch (err) {
    console.error('Error deleting admins without role:', err);
  }
}

async function insertSampleLostItems() {
  try {
    // Admin-reported lost item
    await pool.query(`
      INSERT INTO items (name, date, location, status, quantity, description)
      VALUES ('Lost Umbrella', '2024-06-17', 'Main Entrance', 'lost', 1, 'Blue umbrella with wooden handle')
    `);
    // Student-reported lost item (user_id=1)
    await pool.query(`
      INSERT INTO reported_items (name, date, location, photo, user_id)
      VALUES ('Lost Notebook', '2024-06-17', 'Library', NULL, 1)
    `);
    console.log('Sample lost items inserted successfully!');
  } catch (err) {
    console.error('Error inserting sample lost items:', err);
  }
}

async function main() {
  await ensureAdminRoleColumn();
  await deleteAdminsWithoutRole();
  await deleteAllRegisteredItems();
  await insertSuperadmin();
  await insertSampleItems();
  await insertSampleLostItems();
  await pool.end();
}

main(); 