import express from "express";
import { requireAuth } from "../auth";
import { logger } from "../utils/logger";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as githubApi from "../services/github-api";

const router = express.Router();

// Require authentication for all routes
router.use(requireAuth);

// Get GitHub connection status for the current user
router.get("/status", async (req, res) => {
  try {
    const user = req.user;

    // Return connection status
    res.json({
      connected: !!user.githubToken,
      githubUsername: user.githubUsername || null,
      githubUserId: user.githubUserId || null,
      connectedAt: user.githubConnectedAt || null
    });
  } catch (error) {
    logger.error("Error getting GitHub connection status:", error);
    res.status(500).json({ error: "Failed to get connection status" });
  }
});

// Disconnect GitHub
router.post("/disconnect", async (req, res) => {
  try {
    // Update the user's GitHub token to null
    await db.update(users)
      .set({
        githubToken: null,
        githubUsername: null,
        githubUserId: null,
        githubConnectedAt: null
      })
      .where(eq(users.id, req.user.id));

    res.json({ success: true });
  } catch (error) {
    logger.error("Error disconnecting GitHub account:", error);
    res.status(500).json({ error: "Failed to disconnect GitHub account" });
  }
});

// Get connection details
router.get("/connection-details", async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id)
    });

    if (!user?.githubToken) {
      return res.json({
        connected: false
      });
    }

    // Fetch user information from GitHub to verify token
    try {
      const githubUser = await githubApi.getGitHubUser(user.githubToken);

      return res.json({
        connected: true,
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        userId: githubUser.id,
        connectedAt: user.githubConnectedAt || new Date().toISOString(),
        scopes: ["repo", "user:email"] // Mocked scopes, in reality would come from headers or token introspection
      });
    } catch (error) {
      logger.error("Error fetching GitHub user:", error);
      return res.json({
        connected: false,
        error: "Failed to verify GitHub token"
      });
    }
  } catch (error) {
    logger.error("Error in GitHub connection details:", error);
    res.status(500).json({ error: "Failed to get connection details" });
  }
});

// Save GitHub settings
router.post("/settings", async (req, res) => {
  try {
    const { autoDeploy, buildCache } = req.body;

    // In a real implementation, you would store these settings in the database
    // For now, just log them and return success
    logger.info(`User ${req.user.id} updated GitHub settings: autoDeploy=${autoDeploy}, buildCache=${buildCache}`);

    res.json({ success: true });
  } catch (error) {
    logger.error("Error saving GitHub settings:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// Configure webhooks
router.post("/webhooks/configure", async (req, res) => {
  try {
    const { url, secret } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Webhook URL is required" });
    }

    // In a real implementation, you would store these webhook settings
    // and configure webhooks for repositories
    logger.info(`User ${req.user.id} configured GitHub webhook: url=${url}`);

    res.json({ success: true });
  } catch (error) {
    logger.error("Error configuring webhooks:", error);
    res.status(500).json({ error: "Failed to configure webhooks" });
  }
});

// Get recent activity
router.get("/recent-activity", async (req, res) => {
  try {
    // In a real implementation, you would fetch this from a database
    // For now, just return mock data
    const mockActivity = [
      {
        type: "oauth",
        description: "Connected GitHub account",
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        type: "deploy",
        description: "Deployed repository: user/repo",
        timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      },
      {
        type: "webhook",
        description: "Received push webhook from user/repo",
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ];

    res.json(mockActivity);
  } catch (error) {
    logger.error("Error getting recent activity:", error);
    res.status(500).json({ error: "Failed to get recent activity" });
  }
});

export default router;
