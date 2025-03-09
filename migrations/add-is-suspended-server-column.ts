import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { log } from '../server/vite';

export async function runMigration() {
  try {
    log("Adding is_suspended column to servers table", "migration");
    
    // Check if the column already exists
    const columnExistsResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'servers' AND column_name = 'is_suspended'
    `);
    
    if (columnExistsResult.rows.length === 0) {
      // Add the column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE servers 
        ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT false
      `);
      log("Added is_suspended column to servers table", "migration");
    } else {
      log("Column is_suspended already exists in servers table", "migration");
    }
    
    return true;
  } catch (error) {
    log(`Migration error: ${error}`, "migration");
    return false;
  }
}

// Self-executing function when run directly
if (import.meta.url.endsWith(process.argv[1])) {
  runMigration()
    .then(result => {
      console.log(`Migration ${result ? 'completed successfully' : 'failed'}`);
      process.exit(result ? 0 : 1);
    })
    .catch(err => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}
