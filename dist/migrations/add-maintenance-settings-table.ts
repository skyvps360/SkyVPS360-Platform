
import { sql } from 'drizzle-orm';
import { db } from '../server/db';

async function main() {
  console.log('Starting maintenance settings table migration...');
  
  try {
    // Check if the table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'maintenance_settings'
      );
    `);
    
    const tableExists = tableCheck.rows[0]?.exists;
    
    if (!tableExists) {
      console.log('Creating maintenance_settings table...');
      // Create the table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE maintenance_settings (
          id SERIAL PRIMARY KEY,
          enabled BOOLEAN NOT NULL DEFAULT false,
          maintenance_message TEXT DEFAULT 'We''re currently performing maintenance. Please check back soon.',
          coming_soon_enabled BOOLEAN NOT NULL DEFAULT false,
          coming_soon_message TEXT DEFAULT 'This feature is coming soon. Stay tuned for updates!',
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_by INTEGER NOT NULL
        );
      `);
      console.log('maintenance_settings table created successfully');
    } else {
      // Check if the columns exist
      const comingSoonColumnCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'maintenance_settings' AND column_name = 'coming_soon_enabled'
        );
      `);
      
      const comingSoonColumnExists = comingSoonColumnCheck.rows[0]?.exists;
      
      if (!comingSoonColumnExists) {
        console.log('Adding coming_soon_enabled and coming_soon_message columns...');
        await db.execute(sql`
          ALTER TABLE maintenance_settings 
          ADD COLUMN coming_soon_enabled BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN coming_soon_message TEXT DEFAULT 'This feature is coming soon. Stay tuned for updates!';
        `);
        console.log('Columns added successfully');
      } else {
        console.log('coming_soon columns already exist');
      }
    }
    
    console.log('Maintenance settings migration completed successfully');
  } catch (error) {
    console.error('Error in maintenance settings migration:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error in migration:', error);
    process.exit(1);
  });
