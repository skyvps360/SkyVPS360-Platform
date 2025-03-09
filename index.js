import 'dotenv/config';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Add environment validation
const requiredEnvVars = [
  'DATABASE_URL',
  'NODE_ENV'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`- ${envVar}`);
  });
  console.error('\nPlease set these variables in your .env file or environment');
  process.exit(1);
}

console.log('Database:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown');
console.log('Environment:', process.env.NODE_ENV || 'development');

// Check if we're in production
if (process.env.NODE_ENV === 'production') {
  const serverPath = resolve(__dirname, 'dist/server/index.js');

  if (!fs.existsSync(serverPath)) {
    console.error('Error: Built server file not found at', serverPath);
    console.error('Make sure the build process completed successfully.');
    process.exit(1);
  }

  console.log('Starting production server...');

  // Run migrations first
  console.log('Running database migrations...');
  try {
    // Use dynamic import for migrations
    import('./migrations/add-deployments-table.js')
      .then(module => module.runMigration())
      .then(() => console.log('Deployments table migration completed'))
      .catch(error => console.error('Error running deployments migration:', error));
  } catch (error) {
    console.error('Error importing migration module:', error);
  }

  // Import the server in production
  import(serverPath).catch(err => {
    console.error('Failed to start production server:', err);
    process.exit(1);
  });
} else {
  // Development mode - use tsx instead of ts-node
  console.log('Starting development server...');

  try {
    // Run with tsx which handles TypeScript files better with ESM
    execSync('npx tsx server/index.ts', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to start development server:', error);
    process.exit(1);
  }
}
