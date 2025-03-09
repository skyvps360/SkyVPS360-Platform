import express from 'express';
import { requireAdmin } from '../auth';
import os from 'os';
import { logger } from '../utils/logger';

const router = express.Router();

// Require admin authorization for all routes
router.use(requireAdmin);

// GET environment variables and system info for debugging
router.get('/', async (req, res) => {
  try {
    // Get relevant environment variables (redact sensitive values)
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
      // Redact secret
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? '***REDACTED***' : undefined,
      DATABASE_URL: process.env.DATABASE_URL ? '***REDACTED***' : undefined,
    };

    // Get system info
    const system = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      memory: {
        total: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
        free: `${Math.round(os.freemem() / (1024 * 1024 * 1024))}GB`,
      },
      cpus: os.cpus().length,
      hostname: os.hostname(),
      uptime: `${Math.round(os.uptime() / 60 / 60)} hours`,
    };

    res.json({ env, system });
  } catch (error) {
    logger.error('Error in API debug route:', error);
    res.status(500).json({ error: 'Failed to get debug information' });
  }
});

// Add a route to test GitHub OAuth URL
router.get('/github-oauth-url', (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    const redirectUri = process.env.GITHUB_REDIRECT_URI?.trim();

    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: 'GitHub OAuth configuration is missing' });
    }

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user:email`;

    res.json({ url: authUrl, components: { clientId, redirectUri } });
  } catch (error) {
    logger.error('Error generating debug GitHub URL:', error);
    res.status(500).json({ error: 'Failed to generate GitHub auth URL' });
  }
});

// Add this to your existing api-debug.ts routes
router.get('/github-env', (req, res) => {
  const env = {
    clientId: process.env.GITHUB_CLIENT_ID ? process.env.GITHUB_CLIENT_ID.substring(0, 5) + '...' : null,
    redirectUri: process.env.GITHUB_REDIRECT_URI,
    isClientSecretSet: !!process.env.GITHUB_CLIENT_SECRET,
    nodeEnv: process.env.NODE_ENV
  };

  res.json(env);
});

export default router;
