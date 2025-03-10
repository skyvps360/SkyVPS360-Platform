import fs from 'fs';
import path from 'path';
import express, { Express } from 'express';
import { logger } from './logger.js';

/**
 * Sets up static file serving for production environment
 */
export function setupStaticServing(app: Express): void {
  const clientPath = path.join(process.cwd(), 'dist', 'client');

  // Check if client path exists
  if (!fs.existsSync(clientPath)) {
    logger.error(`Client path not found: ${clientPath}`);
    throw new Error('Client path not found');
  }

  logger.info(`Serving static files from: ${clientPath}`);

  // Serve static files with appropriate cache settings
  app.use(express.static(clientPath, {
    maxAge: '1d',
    index: false // Disable auto-index to handle SPA routing manually
  }));

  // This catch-all route must be defined AFTER all API routes
  // but before the 404 handler
  app.get('*', (req, res) => {
    // Skip API routes - they should be handled by their own handlers
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }

    logger.info(`SPA route handler: ${req.path}`);
    const indexPath = path.join(clientPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      logger.error(`index.html not found at ${indexPath}`);
      res.status(500).send('Server Error: index.html not found');
    }
  });
}
