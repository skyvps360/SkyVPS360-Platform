// Migration to add isSystemKey column to ssh_keys table

import { sql } from "drizzle-orm";
import { db } from "../server/db";

async function runMigration() {
  console.log("Running migration: Adding isSystemKey column to ssh_keys table");
  
  try {
    // Check if the column already exists to prevent errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ssh_keys' AND column_name = 'is_system_key'
    `);
    
    if (checkResult.rows.length === 0) {
      // Add the column
      await db.execute(sql`
        ALTER TABLE ssh_keys 
        ADD COLUMN is_system_key BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log("Successfully added is_system_key column to ssh_keys table");
    } else {
      console.log("Column is_system_key already exists in ssh_keys table");
    }
  } catch (error) {
    console.error("Error running migration:", error);
    throw error;
  }
}

// Run the migration
runMigration().then(() => {
  console.log("Migration completed successfully");
  process.exit(0);
}).catch(error => {
  console.error("Migration failed:", error);
  process.exit(1);
});