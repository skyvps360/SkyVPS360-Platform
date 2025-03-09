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

// Routes
router.get("/repos", async (req, res) => {
  try {
    const githubToken = req.user.githubToken;

    if (!githubToken) {
      return res.status(401).json({ error: "GitHub account not connected" });
    }

    const repos = await getUserRepositories(githubToken);
    res.json(repos);
  } catch (error) {
    console.error("GitHub repositories fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get GitHub OAuth URL - Modified to support both redirect and JSON response
router.get("/auth-url", async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    const redirectUri = process.env.GITHUB_REDIRECT_URI?.trim();

    // Check if the request wants JSON response instead of redirect
    const wantJson = req.query.json === 'true';

    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: "GitHub OAuth configuration is missing" });
    }

    // Generate the GitHub OAuth URL
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user:email`;

    // Log the URL for debugging
    logger.info(`🐙 [GitHub] GitHub OAuth URL generated: ${authUrl}`);

    // If JSON response is requested, return the URL as JSON
    if (wantJson) {
      return res.json({ url: authUrl });
    }

    // Otherwise, redirect directly to GitHub (this is now the default behavior)
    return res.redirect(authUrl);
  } catch (error) {
    logger.error("Error generating GitHub auth URL:", error);
    res.status(500).json({ error: "Failed to generate GitHub auth URL" });
  }
});

// Handle OAuth callback
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    logger.info(`🐙 [GitHub] Received OAuth callback with code: ${code ? code.toString().substring(0, 10) + '...' : 'MISSING'}`);

    if (!code) {
      return res.status(400).json({ error: "Missing code parameter" });
    }

    // Access environment variables directly
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    // Log the exact values being used
    logger.info(`🐙 [GitHub] Using Client ID: ${clientId?.substring(0, 5)}...`);
    logger.info(`🐙 [GitHub] Using Redirect URI: ${redirectUri}`);

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({ error: "GitHub OAuth configuration is missing" });
    }

    // Exchange code for access token with DETAILED error logging
    logger.info(`🐙 [GitHub] Sending token request to GitHub with redirect_uri=${redirectUri}`);

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    // Log FULL error details from GitHub
    if (tokenData.error) {
      logger.error(`🐙 [GitHub] GitHub API error: ${tokenData.error}`);
      logger.error(`🐙 [GitHub] GitHub error description: ${tokenData.error_description}`);
      logger.error(`🐙 [GitHub] GitHub error URI: ${tokenData.error_uri}`);
      return res.status(500).json({
        error: "Failed to obtain access token",
        github_error: tokenData.error,
        description: tokenData.error_description
      });
    }

    const accessToken = tokenData.access_token;
    logger.success(`🐙 [GitHub] Successfully obtained access token`);

    // Fetch user information from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `token ${accessToken}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    const userData = await userResponse.json();

    if (!userData.id) {
      logger.error(`🐙 [GitHub] Failed to fetch GitHub user data: ${JSON.stringify(userData)}`);
      return res.status(500).json({ error: "Failed to fetch user information from GitHub" });
    }

    logger.success(`🐙 [GitHub] Linked GitHub account: ${userData.login}`);

    // Save GitHub token and user information in the database
    await db.update(users)
      .set({
        githubToken: accessToken,
        githubUsername: userData.login,
        githubUserId: userData.id,
        githubConnectedAt: new Date().toISOString()
      })
      .where(eq(users.id, req.user.id));

    // Redirect with success message
    res.redirect("/dashboard?github=connected&username=" + userData.login);
  } catch (error) {
    logger.error("Error handling GitHub OAuth callback:", error);
    res.status(500).json({ error: "Failed to handle GitHub OAuth callback: " + error.message });
  }
});

// Disconnect GitHub account
router.post("/disconnect", async (req, res) => {
  try {
    await saveGitHubToken(req.user.id, null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
