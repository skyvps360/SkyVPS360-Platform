import express, { type Request, Response, NextFunction } from "express";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setupStaticServing } from "./utils/static-handler.js";
import debugRoutes from './routes/debug-routes.js';
import { setupSecurityHeaders, inlineFaviconHandler } from './middleware/security.js';
import cors from 'cors';

// Define __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force reload environment variables at startup
dotenv.config({ override: true });

import { registerRoutes } from "./routes.js";
import { setupVite } from "./vite.js";
import { storage } from "./storage.js";
import { db, pool } from "./db.js";
import { users } from "@shared/schema";
import { setupAuth, hashPassword } from "./auth.js";
import { eq } from "drizzle-orm";
import { registerAdminRoutes } from "./admin/routes.js";
import githubRoutes from "./routes/github.js";
import githubWebhookRoutes from "./routes/github-webhooks.js";
import githubDebugRoutes from "./routes/github-debug.js";
import { logger } from "./utils/logger.js";
import githubDeploymentsRoutes from "./routes/github-deployments.js";
import appPlatformRoutes from "./routes/app-platform.js";
import apiDebugRoutes from './routes/api-debug.js';
import githubConnectionsRoutes from "./routes/github-connections.js";
import { loadGitHubCredentials } from './utils/env.js';
import { initializeDatabase } from './utils/init-db.js';

// Initialize Express
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add security headers and favicon handler early
app.use(setupSecurityHeaders);
app.use(inlineFaviconHandler);

// Add CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Make sure we trust proxies if behind a reverse proxy
app.set('trust proxy', true);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.api(
        "Request completed",
        req.method,
        path,
        res.statusCode,
        duration
      );

      // Optional: log response body for debugging in development
      if (process.env.NODE_ENV === "development" && capturedJsonResponse) {
        const responsePreview =
          JSON.stringify(capturedJsonResponse).length > 100
            ? JSON.stringify(capturedJsonResponse).substring(0, 97) + "..."
            : JSON.stringify(capturedJsonResponse);
        logger.debug(`Response: ${responsePreview}`);
      }
    }
  });

  next();
});

// CORS and cookie domain handling
app.use((req, res, next) => {
  // Get the origin from the request headers
  const origin = req.headers.origin || '';

  // Domain handling for cookies - extended to be more permissive
  const allowedDomains = [
    'skyvps360.xyz',
    'www.skyvps360.xyz',
    'localhost',
    req.hostname,
    // You can add specific additional domains here
  ];

  // Set CORS headers - more permissive approach
  const allowOrigin = process.env.NODE_ENV === 'development'
    ? origin  // Allow any origin in development
    : allowedDomains.includes(new URL(origin).hostname)
      ? origin
      : 'https://skyvps360.xyz';

  res.header('Access-Control-Allow-Origin', allowOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Trust proxy for secure cookies over HTTPS when behind load balancers
  app.set('trust proxy', 1);
  next();
});

// Helper for importing migration files
const importPath = (relativePath) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const basePath = isProduction ? './dist' : '.';
  const resolvedPath = path.join(basePath, relativePath);
  const fileUrl = new URL(`file://${path.resolve(resolvedPath)}`).href;
  return fileUrl;
};

// Create default users and test data
async function createTestData() {
  try {
    // Check if any admin users exist
    const admins = await db.select().from(users).where(eq(users.isAdmin, true));

    if (admins.length === 0) {
      // Create default admin user
      const admin = await storage.createUser({
        username: "admin",
        password: await hashPassword("admin123"),
        isAdmin: true,
        balance: 10000,
        apiKey: null
      });
      logger.success("Created default admin user: admin / admin123");

      // Create a regular user
      const user = await storage.createUser({
        username: "user",
        password: await hashPassword("user123"),
        isAdmin: false,
        balance: 5000,
        apiKey: null
      });
      logger.success("Created default regular user: user / user123");

      // Create a test server for the regular user
      const server = await storage.createServer({
        userId: user.id,
        name: "Test Server",
        region: "tor1",
        size: "s-1vcpu-1gb",
        dropletId: "12345",
        status: "active",
        ipAddress: "192.168.1.1",
        ipv6Address: null,
        specs: {
          memory: 1024,
          vcpus: 1,
          disk: 25
        },
        application: null,
        lastMonitored: new Date(),
        rootPassword: "Test123!"
      });

      // Create a test support ticket
      const ticket = await storage.createTicket({
        userId: user.id,
        serverId: server.id,
        subject: "Help with server configuration",
        priority: "normal",
        status: "open",
        originalDropletId: server.dropletId
      });

      // Add a message to the ticket
      await storage.createMessage({
        ticketId: ticket.id,
        userId: user.id,
        message: "I need help configuring my server. Can you assist?"
      });

      logger.success("Created test data (server and support ticket)");
    }
  } catch (error) {
    logger.error("Error creating test data:", error);
  }
}

// Main application startup
(async () => {
  try {
    // Test database connection first
    await pool.query('SELECT 1');
    logger.database("Database connection successful");

    // Initialize database tables or run migrations
    if (process.env.NODE_ENV === 'production') {
      await initializeDatabase();
    } else {
      try {
        const migrationsPaths = [
          'migrations/add-snapshots-table.js',
          'migrations/add-github-token.js',
          'migrations/add-deployments-table.js',
          'migrations/fix-deployments-schema.js'
        ];

        for (const migrationPath of migrationsPaths) {
          try {
            const fullPath = importPath(migrationPath);
            console.log(`Attempting to import migration from: ${fullPath}`);
            const { runMigration } = await import(fullPath);
            const result = await runMigration();
            if (result) {
              logger.success(`Migration ${migrationPath} completed successfully`);
            } else {
              logger.warning(`Migration ${migrationPath} was not needed or already applied`);
            }
          } catch (migrationError) {
            logger.error(`Error running migration ${migrationPath}:`, migrationError);
          }
        }
      } catch (migrationError) {
        logger.error("Error running migrations:", migrationError);
      }
    }

    // Load GitHub credentials from .env
    loadGitHubCredentials();

    // Create test data including admin user
    await createTestData();

    // Set up authentication before routes
    setupAuth(app, {
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.skyvps360.xyz' : undefined,
      }
    });

    // Register admin routes
    registerAdminRoutes(app);

    // Register main routes
    const server = await registerRoutes(app);

    // API routes - must come before static serving
    app.use("/api/github", githubRoutes);
    app.use("/api/github/deployments", githubDeploymentsRoutes);
    app.use("/api/github/webhooks", githubWebhookRoutes);
    app.use("/api/github/debug", githubDebugRoutes);
    app.use("/api/github/connections", githubConnectionsRoutes);
    app.use("/api/app-platform", appPlatformRoutes);
    app.use("/api/debug", apiDebugRoutes);

    // Debug routes in production
    if (process.env.NODE_ENV === 'production') {
      app.use('/api/debug-prod', debugRoutes);
    }

    // GitHub OAuth routes
    app.use("/auth/github", githubRoutes);

    // Special routes before the catch-all
    app.get("/github-guide", (req, res) => {
      try {
        const indexPath = path.resolve(__dirname, '../dist/client/index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          const devIndexPath = path.resolve(__dirname, '../client/index.html');
          if (fs.existsSync(devIndexPath)) {
            res.sendFile(devIndexPath);
          } else {
            throw new Error('Could not find index.html');
          }
        }
      } catch (e) {
        logger.error('Error serving index.html for GitHub guide:', e);
        res.status(500).send('Internal Server Error: Could not load GitHub guide');
      }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
    });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      logger.error("Express error handler:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Environment-specific setup
    if (app.get("env") === "development") {
      logger.info("Starting server in development mode with Vite middleware...");
      await setupVite(app, server);
    } else {
      // Production mode
      logger.info("Starting server in production mode with static files...");

      // Remove the explicit root handler and use the complete static serving setup
      // The setupStaticServing function will handle all static files and SPA routes
      setupStaticServing(app);
      logger.info("Static file serving configured");
    }

    // Start the server
    const port = process.env.NODE_ENV === 'development' ? 5000 : (process.env.PORT || 8080);
    logger.server(`Starting server on port ${port}, NODE_ENV: ${process.env.NODE_ENV}`);

    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      logger.success(`Server running on port ${port} and accessible from all network interfaces`);
    });
  } catch (error) {
    logger.error("Application startup error:", error);
    process.exit(1);
  }
})();