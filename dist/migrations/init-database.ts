
import { sql } from 'drizzle-orm';
import { db } from '../server/db';
import * as schema from '@shared/schema';

async function main() {
  console.log('Starting database initialization...');
  
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        api_key TEXT,
        balance INTEGER NOT NULL DEFAULT 0,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        is_suspended BOOLEAN NOT NULL DEFAULT false
      );
    `);
    console.log('Created users table');

    // Create servers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS servers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        droplet_id TEXT NOT NULL,
        region TEXT NOT NULL,
        size TEXT NOT NULL,
        status TEXT NOT NULL,
        ip_address TEXT,
        ipv6_address TEXT,
        specs JSONB,
        application TEXT,
        last_monitored TIMESTAMP,
        root_password TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_suspended BOOLEAN NOT NULL DEFAULT false
      );
    `);
    console.log('Created servers table');

    // Create volumes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS volumes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        server_id INTEGER,
        name TEXT NOT NULL,
        size_gb INTEGER NOT NULL,
        region TEXT NOT NULL,
        volume_id TEXT NOT NULL
      );
    `);
    console.log('Created volumes table');

    // Create billing_transactions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS billing_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        type TEXT NOT NULL,
        paypal_transaction_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        description TEXT DEFAULT ''
      );
    `);
    console.log('Created billing_transactions table');

    // Create support_tickets table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        server_id INTEGER,
        subject TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'normal',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        original_droplet_id TEXT
      );
    `);
    console.log('Created support_tickets table');

    // Create support_messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created support_messages table');

    // Create ssh_keys table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ssh_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        public_key TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created ssh_keys table');

    // Create server_metrics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS server_metrics (
        id SERIAL PRIMARY KEY,
        server_id INTEGER NOT NULL,
        cpu_usage REAL NOT NULL,
        memory_usage REAL NOT NULL,
        disk_usage REAL NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created server_metrics table');

    // Create ip_bans table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ip_bans (
        id SERIAL PRIMARY KEY,
        ip_address TEXT NOT NULL UNIQUE,
        reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP
      );
    `);
    console.log('Created ip_bans table');

    // Create snapshots table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS snapshots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        server_id INTEGER NOT NULL,
        snapshot_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL
      );
    `);
    console.log('Created snapshots table');

    // Create doc_sections table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS doc_sections (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        order INTEGER NOT NULL DEFAULT 0
      );
    `);
    console.log('Created doc_sections table');

    // Create doc_articles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS doc_articles (
        id SERIAL PRIMARY KEY,
        section_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        order INTEGER NOT NULL DEFAULT 0
      );
    `);
    console.log('Created doc_articles table');

    // Create session table for express-session
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS session (
        sid varchar NOT NULL COLLATE "default",
        sess json NOT NULL,
        expire timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);
    console.log('Created session table');

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
