import { pool } from "../server/db";
import { snapshots } from "../shared/schema";
import { sql } from "drizzle-orm";

export async function runMigration() {
  console.log("Running migration: add-snapshots-table");
  
  try {
    // Create the snapshots table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id SERIAL PRIMARY KEY,
        server_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        snapshot_id TEXT NOT NULL,
        size_gb INTEGER NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'in-progress',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP
      );
    `);
    
    console.log("Successfully created snapshots table");
    
    // Add indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_snapshots_server_id ON snapshots (server_id);
      CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON snapshots (user_id);
    `);
    
    console.log("Successfully added indexes to snapshots table");
    
    return true;
  } catch (error) {
    console.error("Error creating snapshots table:", error);
    return false;
  }
}

// Run the migration if this file is executed directly
if (process.argv[1] === import.meta.url) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}