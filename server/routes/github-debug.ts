import express from "express";
import { requireAuth } from "../auth";
import { logger } from "../utils/logger";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import fetch from "node-fetch";

const router = express.Router();

// Require admin access for these debug endpoints
router.use((req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
});

// Get GitHub status
router.get("/status", async (req, res) => {
  try {
    // Get GitHub token status for debugging
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id)
    });

    if (!user?.githubToken) {
      return res.json({
        connected: false,
        tokenStatus: "missing"
      });
    }

    // Test the token by making a request to GitHub API
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${user.githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "SkyVPS360-Platform"
        }
      });

      if (response.ok) {
        const userData = await response.json();

        // Get token scopes
        const scopes = response.headers.get("x-oauth-scopes")?.split(", ") || [];

        return res.json({
          connected: true,
          tokenStatus: "valid",
          username: userData.login,
          userId: userData.id,
          email: userData.email,
          avatarUrl: userData.avatar_url,
          scopes,
          profileUrl: userData.html_url
        });
      } else {
        return res.json({
          connected: false,
          tokenStatus: "invalid",
          error: `GitHub API returned status ${response.status}`
        });
      }
    } catch (error) {
      return res.json({
        connected: false,
        tokenStatus: "error",
        error: (error as Error).message
      });
    }
  } catch (error) {
    logger.error("Error in GitHub debug status endpoint:", error);
    res.status(500).json({ error: "Failed to get GitHub status" });
  }
});

// Test webhook delivery
router.post("/test-webhook", async (req, res) => {
  try {
    logger.info("Simulating GitHub webhook event");

    // Mock a push webhook payload
    const mockPayload = {
      ref: "refs/heads/main",
      repository: {
        id: 123456789,
        name: "test-repo",
        full_name: "testuser/test-repo",
        private: false
      },
      sender: {
        id: req.user.id,
        login: req.user.username
      },
      commits: [
        {
          id: "abc123",
          message: "Test commit",
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Simulate webhook processing
    logger.info("Processing test webhook for repository: testuser/test-repo (main)");

    res.json({
      success: true,
      message: "Webhook test processed successfully",
      payload: mockPayload
    });
  } catch (error) {
    logger.error("Error in GitHub debug test-webhook endpoint:", error);
    res.status(500).json({ error: "Failed to process test webhook" });
  }
});

// Get recent GitHub activity
router.get("/recent-activity", async (req, res) => {
  try {
    // In a real implementation, you'd fetch this from a database
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
    logger.error("Error in GitHub debug recent-activity endpoint:", error);
    res.status(500).json({ error: "Failed to get recent activity" });
  }
});

export default router;
