#!/usr/bin/env node

/**
 * Script to clear all lost items and claim requests data from the database
 * Usage: node clear_lost_items.js
 */

const pg = require('pg');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ccislsg_inventory'
});

async function clearLostItemsData() {
  try {
    console.log('Starting to clear lost items data...');
    
    // Delete all claim requests first (foreign key constraint)
    const claimResult = await pool.query('DELETE FROM claim_requests');
    console.log(`✓ Deleted ${claimResult.rowCount} claim requests`);
    
    // Delete all reported items
    const itemResult = await pool.query('DELETE FROM reported_items');
    console.log(`✓ Deleted ${itemResult.rowCount} reported items`);
    
    console.log('✓ All lost items and claim requests have been cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing lost items data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearLostItemsData();
