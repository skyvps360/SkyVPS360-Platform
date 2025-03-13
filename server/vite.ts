import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";

// Simple logger for debugging
export function log(msg: string, level: 'info' | 'error' = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = level === 'error' ? '❌' : 'ℹ️';

  if (level === 'error') {
    console.error(`[${timestamp}] ${prefix} [vite] ${msg}`);
  } else {
    console.log(`[${timestamp}] ${prefix} [vite] ${msg}`);
  }
}

export async function setupVite(app: Express, server: Server) {
  try {
    // Basic Vite server configuration
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, "..", "vite.config.ts"),
      server: {
        middlewareMode: true,
        hmr: { server },
        watch: {
          usePolling: false,
          interval: 1000,
        },
        cors: true,
        host: '0.0.0.0',
      },
      appType: "custom",
      logLevel: 'info',
      clearScreen: false,
      optimizeDeps: {
        force: true,
      },
    });

    // Apply Vite middleware
    app.use(vite.middlewares);

    // Add MIME type middleware for proper content types
    app.use((req, res, next) => {
      if (req.path.endsWith('.js')) {
        res.type('application/javascript');
      } else if (req.path.endsWith('.css')) {
        res.type('text/css');
      } else if (req.path.endsWith('.tsx') || req.path.endsWith('.ts')) {
        res.type('application/javascript');
      }
      next();
    });

    // Simple SPA catch-all route
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;

      try {
        // Look for index.html in client directory
        const indexPath = path.resolve(__dirname, "..", "client", "index.html");

        if (!fs.existsSync(indexPath)) {
          log(`Cannot find index.html at ${indexPath}`, 'error');
          return next(new Error(`Cannot find index.html at ${indexPath}`));
        }

        // Read the HTML and transform with Vite
        const template = await fs.promises.readFile(indexPath, 'utf-8');
        const html = await vite.transformIndexHtml(url, template);

        res.status(200).set({ 
          "Content-Type": "text/html", 
          "Cache-Control": "no-cache, no-store, must-revalidate" 
        }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        log(`Error processing the request: ${(e as Error).message}`, 'error');
        next(e);
      }
    });

    log("Vite middleware successfully set up");
    return { vite, server };
  } catch (error) {
    log(`Failed to setup Vite: ${(error as Error).message}`, 'error');
    throw error;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "client");

  if (!fs.existsSync(distPath)) {
    log(`Could not find the build directory: ${distPath}`, 'error');
    throw new Error(`Could not find the build directory: ${distPath}`);
  }

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
  
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  log(`Static files will be served from: ${distPath}`);
}
