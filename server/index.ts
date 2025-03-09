import express, { type Request, Response, NextFunction } from "express";
import dotenv from 'dotenv';
import path from 'path'; // Add path import
import fs from 'fs'; // Add fs import
import { fileURLToPath } from 'url'; // Add fileURLToPath import
import { setupStaticServing } from "./utils/static-handler.js";

// Define __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force reload environment variables at startup
dotenv.config({ override: true });

import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Create default users and test data
async function createTestData() {
  try {
    // Check if any admin users exist
    const admins = await db.select().from(users).where(eq(users.isAdmin, true));

    if (admins.length === 0) {
      // Create default admin user
      const admin = await storage.createUser({
        username: "admin",
        password: await hashPassword("admin123"), // Properly hashed password
        isAdmin: true,
        balance: 10000, // $100.00 starting balance
        apiKey: null
      });
      logger.success("Created default admin user: admin / admin123");

      // Create a regular user
      const user = await storage.createUser({
        username: "user",
        password: await hashPassword("user123"), // Properly hashed password
        isAdmin: false,
        balance: 5000, // $50.00 starting balance
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
        rootPassword: "Test123!" // Add default root password for test server
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

// Fix import paths function to handle production vs development
const importPath = (relativePath) => {
  // In production, migrations are copied to dist/
  const isProduction = process.env.NODE_ENV === 'production';

  // Use explicit relative path for ESM imports '.';
  const basePath = isProduction ? './dist' : '.';

  // Convert to a file URL which is compatible with ESM dynamic imports
  const resolvedPath = path.join(basePath, relativePath);
  const fileUrl = new URL(`file://${path.resolve(resolvedPath)}`).href;

  return fileUrl;
};

// Use cwd for better path resolution
const getRootPath = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? path.resolve(process.cwd()) : path.resolve(process.cwd());
};

(async () => {
  try {
    // Test database connection first
    await pool.query('SELECT 1');
    logger.database("Database connection successful");

    // Initialize database tables directly instead of using migrations
    if (process.env.NODE_ENV === 'production') {
      await initializeDatabase();
    } else {
      // Run necessary migrations in development
      try {
        // Run migrations with proper path resolution
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
            // Continue with other migrations rather than stopping
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
    setupAuth(app);

    // Register admin routes before regular routes
    registerAdminRoutes(app);

    const server = await registerRoutes(app);

    app.use("/api/github", githubRoutes);
    app.use("/api/github/deployments", githubDeploymentsRoutes);
    app.use("/api/github/webhooks", githubWebhookRoutes); // Register GitHub webhook routes
    app.use("/api/github/debug", githubDebugRoutes); // Register GitHub debug routes
    app.use("/api/github/connections", githubConnectionsRoutes); // Add this new route
    app.use("/api/app-platform", appPlatformRoutes);
    app.use('/api/debug', apiDebugRoutes);

    // Ensure the route matches what's in the GITHUB_REDIRECT_URI
    app.use("/auth/github", githubRoutes);
    // OR adjust your callback handler to match:
    app.get("/auth/github/callback", async (req, res) => {
      // Existing callback handler logic
    });

    // Fix the path undefined error in the GitHub guide route
    app.get("/github-guide", (req, res) => {
      try {
        const indexPath = path.resolve(__dirname, '../dist/client/index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          // Fallback path for development
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

    // Add this near the end of your route definitions, before the error handler

    // Catch-all route for client-side routing - must be after API routes
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }

      // Skip static assets
      if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
        return next();
      }

      // For all other routes, let the SPA router handle it
      if (process.env.NODE_ENV === 'production') {
        // In production, serve from the client build directory
        res.sendFile(path.resolve(__dirname, '../client/index.html'));
      } else {
        // In development, let Vite handle it
        next();
      }
    });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      logger.error("Express error handler:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      logger.info("Starting server in development mode with Vite middleware...");
      await setupVite(app, server);
    } else {
      // Production mode
      logger.info("Starting server in production mode with static files...");
      setupStaticServing(app);
    }

    // Use port 5000 for development
    const port = process.env.NODE_ENV === 'development' ? 5000 : (process.env.PORT || 8080);
    logger.server(`Starting server on port ${port}, NODE_ENV: ${process.env.NODE_ENV}`);

    server.listen({
      port,
      host: "0.0.0.0", // Explicitly listen on all network interfaces
      reusePort: true,
    }, () => {
      logger.success(`Server running on port ${port} and accessible from all network interfaces`);
    });
  } catch (error) {
    logger.error("Application startup error:", error);
    process.exit(1);
  }
})();