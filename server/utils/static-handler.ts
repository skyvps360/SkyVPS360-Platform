import fs from 'fs';
import path from 'path';
import express, { Express } from 'express';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sets up static file serving for production environment
 */
export function setupStaticServing(app: Express): void {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    logger.info("Not in production, skipping static file setup");
    return;
  }

  // Find the client path
  const possibleClientPaths = [
    path.join(process.cwd(), 'dist', 'client'),
    path.join(__dirname, '..', '..', 'client'),
    path.join(__dirname, '..', '..', 'dist', 'client'),
    path.join(__dirname, '../../..', 'dist', 'client')
  ];

  let clientPath: string | null = null;

  for (const testPath of possibleClientPaths) {
    if (fs.existsSync(testPath)) {
      clientPath = testPath;
      logger.info(`Found client files at: ${clientPath}`);
      break;
    } else {
      logger.debug(`Client path not found at: ${testPath}`);
    }
  }

  if (!clientPath) {
    logger.error("Could not find client build files! Static serving will not work.");
    return;
  }

  // Test if index.html exists
  const indexPath = path.join(clientPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    logger.error(`Index.html not found at ${indexPath}`);
  } else {
    logger.info(`Found index.html at ${indexPath}`);
  }

  // Setup static file serving
  app.use(express.static(clientPath));

  // Setup SPA catch-all route
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Skip static assets which should have been handled by express.static
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      return next();
    }

    logger.debug(`Serving index.html for route: ${req.path}`);

    // For all SPA routes, serve the index.html
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.error(`Error sending index.html for ${req.path}: ${err.message}`);
        res.status(500).send('Server Error: Could not serve application');
      }
    });
  });

  logger.success("Static file serving configured successfully");
}
