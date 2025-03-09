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

  // Debug output
  logger.info(`Current working directory: ${process.cwd()}`);
  logger.info(`__dirname: ${__dirname}`);

  // Find the client path - try multiple possible locations
  const possibleClientPaths = [
    path.join(process.cwd(), 'dist', 'client'),
    path.join(__dirname, '..', '..', 'dist', 'client'),
    path.join(__dirname, '..', '..', '..', 'dist', 'client'),
    path.join(process.cwd(), 'client')
  ];

  // Debug all possible paths
  possibleClientPaths.forEach((testPath, index) => {
    const exists = fs.existsSync(testPath);
    logger.info(`Checking path ${index + 1}: ${testPath} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  });

  // Find first existing path
  const clientPath = possibleClientPaths.find(p => fs.existsSync(p)) || possibleClientPaths[0];

  // Create directory if it doesn't exist
  if (!fs.existsSync(clientPath)) {
    try {
      fs.mkdirSync(clientPath, { recursive: true });
      logger.info(`Created client directory at: ${clientPath}`);
    } catch (err) {
      logger.error(`Failed to create client directory: ${err.message}`);
    }
  } else {
    try {
      const files = fs.readdirSync(clientPath).slice(0, 5);
      logger.info(`Found client directory at: ${clientPath}`);
      logger.info(`Files in directory: ${files.join(', ')}`);
    } catch (err) {
      logger.error(`Error reading directory: ${err.message}`);
    }
  }

  // --- REST OF THE FUNCTION STAYS THE SAME ---

  // Add CSP middleware
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' *;"
    );
    next();
  });

  // Handle asset paths with trailing slashes
  app.use((req, res, next) => {
    if (req.path.endsWith('/') && req.path !== '/') {
      const pathWithoutTrailingSlash = req.path.slice(0, -1);
      return res.redirect(301, pathWithoutTrailingSlash);
    }
    next();
  });

  // Serve static files
  app.use(express.static(clientPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));

  // Handle root path
  app.get('/', (req, res) => {
    logger.info('Root path requested, serving index.html');
    const indexPath = path.join(clientPath, 'index.html');
    res.sendFile(indexPath);
  });

  // SPA route handler
  app.get('*', (req, res, next) => {
    // Skip API routes and static files
    if (req.path.startsWith('/api/') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      return next();
    }

    logger.info(`SPA route handler for: ${req.path}, serving index.html`);
    const indexPath = path.join(clientPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.error(`Error sending index.html: ${err.message}`);
        res.status(200).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>SkyVPS360 Platform</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="icon" href="data:,">
            <style>
              body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .content { text-align: center; }
            </style>
          </head>
          <body>
            <div class="content">
              <h1>SkyVPS360 Platform</h1>
              <p>Loading application...</p>
              <script>
                setTimeout(() => { window.location.href = '/auth'; }, 3000);
              </script>
            </div>
          </body>
          </html>
        `);
      }
    });
  });

  logger.success("Static file serving configured successfully");
}
