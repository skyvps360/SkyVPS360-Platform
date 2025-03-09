// ...existing code...

// Import all routes
import githubRoutes from "./github.js";
import githubWebhookRoutes from "./github-webhooks.js";
import githubDeploymentsRoutes from "./github-deployments.js";

// Register routes
export function registerRoutes(app: Express) {
  // ...existing code...

  // GitHub routes
  app.use("/api/github", githubRoutes);
  app.use("/api/github/webhooks", githubWebhookRoutes);
  app.use("/api/github/deployments", githubDeploymentsRoutes);

  // ...existing code...
}
