
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

console.log("NODE_ENV:", process.env.NODE_ENV);

// Use direct connection without WebSocket
console.log("Configuring direct PostgreSQL connection without WebSocket");
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with more robust settings for Replit
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Reduced number of clients to avoid overloading
  idleTimeoutMillis: 10000, // Shorter idle timeout
  connectionTimeoutMillis: 10000, // Longer connection timeout
  ssl: process.env.NODE_ENV === 'development' ? 
    { rejectUnauthorized: true } : 
    { rejectUnauthorized: false },
  keepAlive: true, // Enable keep-alive to prevent idle connections from being terminated
  keepAliveInitialDelayMillis: 5000 // Start keep-alive probing after 5 seconds of inactivity
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Only exit on critical errors
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
    process.exit(-1);
  }
});

// Add connection success logging
pool.on('connect', () => {
  console.log('Successfully connected to database');
});

export const db = drizzle(pool, { schema });
