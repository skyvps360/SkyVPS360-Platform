import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { logger } from '../utils/logger';
import { setupDb } from './setup';

const { Pool } = pg;

// Create connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? true : false
});

// Configure direct PostgreSQL connection options
logger.info('Configuring direct PostgreSQL connection without WebSocket');

// Initialize database with schema
let db;
(async () => {
  try {
    db = await setupDb();
  } catch (error) {
    logger.error("Error initializing database:", error);
    // Fallback to basic drizzle setup if enhanced setup fails
    db = drizzle(pool, { schema });
  }
})();

export { db };
