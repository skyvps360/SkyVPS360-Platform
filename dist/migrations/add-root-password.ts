import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Starting migration to add rootPassword column to servers table');
  
  try {
    // Check if the root_password column already exists
    const checkColumnResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'servers' AND column_name = 'root_password'
    `);
    
    if (checkColumnResult.rows.length === 0) {
      // Add the root_password column if it doesn't exist
      console.log('Adding root_password column to servers table...');
      await db.execute(sql`
        ALTER TABLE servers
        ADD COLUMN root_password TEXT
      `);
      console.log('Successfully added root_password column to servers table');
    } else {
      console.log('root_password column already exists in servers table');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration().catch(console.error);