import pg from 'pg';
const { Pool } = pg;

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log('Running migration to add createdAt column to servers table');

  try {
    // Check if the column already exists
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'servers' AND column_name = 'created_at'
    `);

    if (result.rows.length === 0) {
      // Add the createdAt column with default value of current timestamp
      await pool.query(`
        ALTER TABLE servers
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL
      `);
      console.log('Successfully added created_at column to servers table');
    } else {
      console.log('created_at column already exists in servers table');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the pool to end the process cleanly
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the migration
runMigration()
  .then(() => console.log('Migration complete'))
  .catch(error => console.error('Migration error:', error));