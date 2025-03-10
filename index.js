import 'dotenv/config';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Debug mode for startup issues
const DEBUG_MODE = true;

// Debug helper function
function debug(message, obj = null) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`);
    if (obj) {
      console.dir(obj, { depth: null, colors: true });
    }
  }
}

// Error handler with additional context
function handleError(phase, error) {
  console.error(`\n❌ ERROR during ${phase}:`);
  console.error(error);

  // Additional debug info
  if (DEBUG_MODE) {
    console.error('\nDebug Information:');
    console.error('- Node version:', process.version);
    console.error('- Current directory:', process.cwd());
    console.error('- Available files in dist/server:');
    try {
      const serverDir = resolve(__dirname, 'dist/server');
      if (fs.existsSync(serverDir)) {
        console.error('  ' + fs.readdirSync(serverDir).join('\n  '));
      } else {
        console.error('  (directory does not exist)');
      }
    } catch (e) {
      console.error('  Error listing directory:', e.message);
    }
  }
}

// Add environment validation
const requiredEnvVars = [
  'DATABASE_URL',
  'NODE_ENV'
];

debug('Starting application with environment variables:');
debug('Environment vars:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL ? '***REDACTED***' : undefined,
  DEBUG_STATIC: process.env.DEBUG_STATIC,
  SPA_ROUTING: process.env.SPA_ROUTING
});

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

  debug('Production mode detected. Checking for server file at:', serverPath);

  if (!fs.existsSync(serverPath)) {
    handleError('file checking', new Error(`Built server file not found at ${serverPath}`));
    console.error('Make sure the build process completed successfully.');
    process.exit(1);
  }

  console.log('Starting production server...');

  // Run migrations first
  console.log('Running database migrations...');
  try {
    debug('Attempting to run migrations from:', './migrations/add-deployments-table.js');

    // Use dynamic import for migrations
    import('./migrations/add-deployments-table.js')
      .then(module => {
        debug('Migration module imported successfully');
        return module.runMigration();
      })
      .then(() => console.log('Deployments table migration completed'))
      .catch(error => {
        handleError('migration', error);
      });
  } catch (error) {
    handleError('migration import', error);
  }

  // Check for client files
  debug('Checking for client files:');
  const clientPath = resolve(__dirname, 'dist/client');
  if (fs.existsSync(clientPath)) {
    const clientFiles = fs.readdirSync(clientPath);
    debug(`Found ${clientFiles.length} files in client directory`);
  } else {
    console.warn('⚠️ Client files directory not found at:', clientPath);
  }

  // Import the server in production
  debug('Attempting to import server from:', serverPath);
  import(serverPath).catch(err => {
    handleError('server import', err);
    process.exit(1);
  });
} else {
  // Development mode - use tsx instead of ts-node
  console.log('Starting development server...');

  try {
    debug('Running development server with tsx');
    // Run with tsx which handles TypeScript files better with ESM
    execSync('npx tsx server/index.ts', { stdio: 'inherit' });
  } catch (error) {
    handleError('development server', error);
    process.exit(1);
  }
}
