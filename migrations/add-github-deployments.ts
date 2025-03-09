import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pool } from '../server/db';
import { logger } from '../server/utils/logger';

export async function runMigration() {
  try {
    const db = drizzle(pool);

    // Check if deployments table already exists
    const tableCheck = await pool.query(`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'deployments'
    )`);

    if (tableCheck.rows[0].exists) {
      logger.warning('Deployments table already exists, skipping migration');
      return false;
    }

    // Create deployments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        app_id TEXT NOT NULL,
        name TEXT NOT NULL,
        repository TEXT NOT NULL,
        branch TEXT NOT NULL,
        status TEXT NOT NULL,
        url TEXT,
        region TEXT NOT NULL,
        size TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create github_connections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS github_connections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        github_user_id INTEGER,
        github_username TEXT,
        access_token TEXT,
        refresh_token TEXT,
        scopes TEXT,
        connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    logger.success('GitHub deployments tables created successfully');
    return true;
  } catch (error) {
    logger.error('Error creating GitHub deployments tables:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
