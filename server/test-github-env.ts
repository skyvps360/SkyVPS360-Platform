import dotenv from 'dotenv';
import fs from 'fs';

// Force reload of environment variables
dotenv.config({ override: true });

console.log('==== GitHub OAuth Environment Variables Test ====');
console.log(`GITHUB_CLIENT_ID: ${process.env.GITHUB_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
console.log(`GITHUB_CLIENT_SECRET: ${process.env.GITHUB_CLIENT_SECRET ? '✓ Set' : '✗ Missing'}`);
console.log(`GITHUB_REDIRECT_URI: ${process.env.GITHUB_REDIRECT_URI}`);

// Check if .env file exists and read its contents
try {
  const envFile = fs.readFileSync('.env', 'utf8');
  const redirectUri = envFile.match(/GITHUB_REDIRECT_URI=["']?([^"'\n]+)["']?/);
  console.log('\n.env file exists');
  console.log(`GITHUB_REDIRECT_URI in file: ${redirectUri ? redirectUri[1] : 'Not found'}`);
} catch (error) {
  console.log('\n.env file not found or cannot be read');
}

// Check if we're using local or production env vars
console.log(`\nNODE_ENV: ${process.env.NODE_ENV}`);
