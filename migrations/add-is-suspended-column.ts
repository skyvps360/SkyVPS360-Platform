import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../shared/schema";
import { sql } from "drizzle-orm";
import { log } from "../server/vite";

export async function runMigration() {
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("DATABASE_URL is not set!");
    return;
  }
  
  // Create connection
  const connection = postgres(connectionString);
  const db = drizzle(connection);
  
  try {
    console.log("Starting migration: Adding is_suspended column to users table");
    
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_suspended'
    `);
    
    if (result.length === 0) {
      // Column doesn't exist, add it
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log("Migration succeeded: Added is_suspended column to users table");
    } else {
      console.log("Migration skipped: is_suspended column already exists");
    }
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await connection.end();
  }
}

// Automatically run the migration when this file is executed directly
runMigration().then(() => {
  console.log("Migration script completed");
}).catch(err => {
  console.error("Migration script failed:", err);
});