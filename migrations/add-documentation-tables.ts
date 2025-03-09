import { sql } from 'drizzle-orm';
import { db } from '../server/db';

async function main() {
  console.log('Running migration: add-documentation-tables');

  // Create the doc_sections table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS doc_sections (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      "order" INTEGER NOT NULL
    );
  `);

  // Create the doc_articles table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS doc_articles (
      id SERIAL PRIMARY KEY,
      section_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      last_updated TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  console.log('Migration completed successfully');
}

main()
  .catch(e => {
    console.error('Migration failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Clean exit, no need to close pool as db connection is managed elsewhere
    process.exit(0);
  });