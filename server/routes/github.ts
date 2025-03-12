import express from "express";
import { getGitHubOAuthURL, exchangeCodeForToken, saveGitHubToken, getUserRepositories } from "../services/github";
import { requireAuth } from "../auth";
import { logger } from "../utils/logger";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import fetch from "node-fetch";

const router = express.Router();

// Authentication required for most GitHub routes
router.use("/repos", requireAuth);
router.use("/auth-url", requireAuth);
router.use("/disconnect", requireAuth);

// Get GitHub repositories
router.get("/repos", async (req, res) => {
  try {
    // Check if user has GitHub token
    if (!req.user.githubToken) {
      return res.status(401).json({ 
        error: "GitHub account not connected",
        code: "github_not_connected"
      });
    }

    const repos = await getUserRepositories(req.user.githubToken);
    res.json(repos);
  } catch (error) {
    logger.error("GitHub repositories fetch error:", error);
    
    // Check if token is invalid
    if (error.status === 401) {
      // Clear invalid token
      await saveGitHubToken(req.user.id, null);
      return res.status(401).json({
        error: "GitHub token is invalid. Please reconnect your account.",
        code: "github_token_invalid"
      });
    }

    res.status(500).json({ error: error.message });
  }
});

// Get GitHub OAuth URL
router.get("/auth-url", async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    const redirectUri = process.env.GITHUB_REDIRECT_URI?.trim();

    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: "GitHub OAuth configuration is missing" });
    }

    // Generate the GitHub OAuth URL with necessary scopes
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user:email`;

    // Check if JSON response is requested
    if (req.query.json === 'true') {
      return res.json({ url: authUrl });
    }

    // Otherwise redirect to GitHub
    res.redirect(authUrl);
  } catch (error) {
    logger.error("Error generating GitHub auth URL:", error);
    res.status(500).json({ error: "Failed to generate GitHub auth URL" });
  }
});

// Handle OAuth callback
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code || !req.user) {
      return res.status(400).json({ error: "Missing code or not authenticated" });
    }

    // Exchange code for token
    const { access_token: accessToken } = await exchangeCodeForToken(code.toString());

    if (!accessToken) {
      return res.status(500).json({ error: "Failed to get access token from GitHub" });
    }

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SkyVPS360-Platform"
      }
    });

    if (!userResponse.ok) {
      return res.status(500).json({ error: "Failed to fetch user information from GitHub" });
    }

    const userData = await userResponse.json();

    // Save GitHub info to database
    await db.update(users)
      .set({
        githubToken: accessToken,
        githubUsername: userData.login,
        githubUserId: userData.id,
        githubConnectedAt: new Date().toISOString()
      })
      .where(eq(users.id, req.user.id));

    // Redirect with success
    res.redirect("/dashboard?github=connected&username=" + userData.login);
  } catch (error) {
    logger.error("Error handling GitHub OAuth callback:", error);
    res.redirect("/dashboard?github=error&message=" + encodeURIComponent(error.message));
  }
});

// Disconnect GitHub account
router.post("/disconnect", async (req, res) => {
  try {
    await saveGitHubToken(req.user.id, null);
    res.json({ success: true });
  } catch (error) {
    logger.error("Error disconnecting GitHub account:", error);
    res.status(500).json({ error: "Failed to disconnect GitHub account" });
  }
});

export default router;
