#!/usr/bin/env node

/**
 * PayPal Migration Script
 * Runs the PayPal database migration to add necessary tables and columns
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting PayPal migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../db/paypal-migration.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Run the migration
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ PayPal migration completed successfully!');
    console.log('   - Added PayPal columns to payments table');
    console.log('   - Created processed_webhooks table');
    console.log('   - Added database constraints and indexes');
    console.log('   - Created analytics views');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Verify database connection first
async function verifyConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Please check your DATABASE_URL environment variable');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Verifying database connection...');
  
  if (!(await verifyConnection())) {
    process.exit(1);
  }
  
  console.log('📊 Running PayPal database migration...');
  await runMigration();
  
  console.log('🎉 Migration process completed!');
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run the migration
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runMigration };