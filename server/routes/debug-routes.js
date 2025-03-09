import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// Path info
router.get('/paths', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const possiblePaths = [
    path.join(process.cwd(), 'dist', 'client'),
    path.join(__dirname, '..', '..', 'dist', 'client'),
    path.join(__dirname, '..', '..', '..', 'dist', 'client'),
    path.join(process.cwd(), 'client'),
    path.join(process.cwd()),
  ];

  const results = possiblePaths.map(p => ({
    path: p,
    exists: fs.existsSync(p),
    files: fs.existsSync(p) ?
      fs.readdirSync(p).slice(0, 10) :
      []
  }));

  const indexPaths = possiblePaths.map(p => ({
    path: path.join(p, 'index.html'),
    exists: fs.existsSync(path.join(p, 'index.html')),
  }));

  // Also check for specific files
  const staticFiles = [
    path.join(process.cwd(), 'dist', 'client', 'assets', 'main.js'),
    path.join(process.cwd(), 'dist', 'client', 'assets', 'main.css'),
  ];

  const fileChecks = staticFiles.map(f => ({
    path: f,
    exists: fs.existsSync(f)
  }));

  res.json({
    environment: process.env.NODE_ENV,
    cwd: process.cwd(),
    dirname: __dirname,
    architecture: os.arch(),
    hostname: os.hostname(),
    platform: os.platform(),
    possiblePaths: results,
    indexFiles: indexPaths,
    staticFiles: fileChecks
  });
});

// Environment variables
router.get('/env', (req, res) => {
  const safeEnv = { ...process.env };

  // Remove sensitive data
  delete safeEnv.DATABASE_URL;
  delete safeEnv.SESSION_SECRET;
  delete safeEnv.GITHUB_CLIENT_SECRET;
  delete safeEnv.PAYPAL_SECRET;

  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DOMAIN: process.env.DOMAIN,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    DEBUG_STATIC: process.env.DEBUG_STATIC,
    SPA_ROUTING: process.env.SPA_ROUTING
  });
});

// Server configuration
router.get('/config', (req, res) => {
  res.json({
    staticServing: true,
    trustProxy: true,
    cookieSecure: process.env.NODE_ENV === 'production',
    cookieSameSite: 'lax',
    cookieDomain: process.env.NODE_ENV === 'production' ? '.skyvps360.xyz' : undefined
  });
});

export default router;
