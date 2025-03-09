import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

async function runMigration() {
  // Create a database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Create a Drizzle client
  const db = drizzle(pool);

  console.log("Running migration: Adding description column to billing_transactions");

  try {
    // Add the description column to the billing_transactions table
    await db.execute(sql`
      ALTER TABLE billing_transactions
      ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''
    `);

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migration
runMigration();