#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine if we're running in production or development
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running migrations in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

// Calculate paths based on environment
const rootDir = path.resolve(__dirname, '..');
const migrationsDir = isProduction
  ? path.join(rootDir, 'dist', 'migrations')
  : path.join(rootDir, 'migrations');

console.log(`Looking for migrations in: ${migrationsDir}`);

async function runMigrations() {
  try {
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory not found: ${migrationsDir}`);
      if (isProduction) {
        console.error('Make sure migrations were copied to dist/ during build');
      }
      process.exit(1);
    }

    // Find all migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js') || file.endsWith('.mjs'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    // Import and run each migration
    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      console.log(`Running migration: ${file}`);

      try {
        const { runMigration } = await import(migrationPath);
        const result = await runMigration();

        if (result) {
          console.log(`✅ Migration ${file} completed successfully`);
        } else {
          console.log(`⚠️ Migration ${file} was not needed or already applied`);
        }
      } catch (error) {
        console.error(`❌ Error running migration ${file}:`, error);
        // Continue with other migrations even if one fails
      }
    }

    console.log('All migrations completed');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

runMigrations();
