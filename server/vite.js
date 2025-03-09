import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// Get correct directory paths using ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupVite(app, server) {
  const { createServer } = await import('vite');

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  // Use Vite's development middleware in development mode
  app.use(vite.middlewares);

  return { vite, server };
}

// Serve static files in production mode
export function serveStatic(app) {
  // First try to serve from dist/client
  const clientDistPath = path.resolve(__dirname, '../client');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
  }

  // Fallback to serving from dist directory
  const distPath = path.resolve(__dirname, '..');
  app.use(express.static(distPath));

  // Serve index.html for all non-API routes
  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    try {
      // Try different potential locations for index.html
      let indexHtml;
      const potentialPaths = [
        path.resolve(__dirname, '../client/index.html'),
        path.resolve(__dirname, '../public/index.html'),
        path.resolve(__dirname, '../index.html'),
      ];

      for (const htmlPath of potentialPaths) {
        if (fs.existsSync(htmlPath)) {
          indexHtml = await fs.promises.readFile(htmlPath, 'utf-8');
          break;
        }
      }

      if (!indexHtml) {
        throw new Error('Could not find index.html in any expected location');
      }

      res.setHeader('Content-Type', 'text/html');
      res.status(200).end(indexHtml);
    } catch (e) {
      console.error('Error serving index.html:', e);
      res.status(500).end('Internal Server Error: Could not load index.html');
    }
  });
}

export function log(...args) {
  console.log(`[vite]`, ...args);
}
