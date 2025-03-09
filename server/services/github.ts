import fetch from "node-fetch";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger";

// Get OAuth URL for GitHub authentication
export async function getGitHubOAuthURL() {
  try {
    // Make sure to trim the client ID to avoid spaces
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    const redirectUri = process.env.GITHUB_REDIRECT_URI?.trim();

    if (!clientId || !redirectUri) {
      throw new Error("GitHub OAuth configuration is missing");
    }

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user:email`;

    // Log the URL for debugging
    logger.info(`🐙 [GitHub] Generated OAuth URL: ${authUrl}`);
    console.log(`Generated GitHub OAuth URL: ${authUrl}`);

    return authUrl;
  } catch (error) {
    logger.error("Error generating GitHub auth URL:", error);
    throw error;
  }
}

// Exchange code for access token
export async function exchangeCodeForToken(code: string) {
  try {
    // Make sure to trim the client ID and secret to avoid spaces
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
    const redirectUri = process.env.GITHUB_REDIRECT_URI?.trim();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("GitHub OAuth configuration is missing");
    }

    const response = await fetch("https://github.com/login/oauth/access_token", {
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

    const data = await response.json();

    if (!data.access_token) {
      logger.error(`GitHub token exchange returned no token: ${JSON.stringify(data)}`);
      throw new Error("No access token in response");
    }

    return data.access_token;
  } catch (error) {
    logger.error("Error exchanging code for token:", error);
    throw error;
  }
}

// Save GitHub token to user
export async function saveGitHubToken(userId: number, token: string | null, userData?: any) {
  try {
    await db.update(users)
      .set({
        githubToken: token,
        githubUsername: userData?.login || null,
        githubUserId: userData?.id || null,
        githubConnectedAt: token ? new Date().toISOString() : null
      })
      .where(eq(users.id, userId));

    return true;
  } catch (error) {
    logger.error("Error saving GitHub token:", error);
    throw error;
  }
}

// Get user's GitHub repositories
export async function getUserRepositories(token: string) {
  try {
    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`GitHub API error: ${response.status} ${errorText}`);
      throw new Error(`Failed to fetch repositories: ${response.status}`);
    }

    const repos = await response.json();
    return repos;
  } catch (error) {
    logger.error("Error fetching GitHub repositories:", error);
    throw error;
  }
}

// Get branches for a GitHub repository
export async function getRepositoryBranches(token: string, owner: string, repo: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`GitHub API error: ${response.status} ${errorText}`);
      throw new Error(`Failed to fetch branches: ${response.status}`);
    }

    const branches = await response.json();
    return branches;
  } catch (error) {
    logger.error("Error fetching GitHub branches:", error);
    throw error;
  }
}

export async function createGitHubDeployment(token: string, repo: string, values: any) {
  // This would integrate with GitHub Actions or Deployments
  // For now, we'll just return a success message
  return { success: true, message: "Deployment initialized" };
}

// Get GitHub user information to verify connection
export async function getGitHubUser(token: string) {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`GitHub API error: ${response.status} ${errorText}`);
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const user = await response.json();
    return user;
  } catch (error) {
    logger.error("Error fetching GitHub user:", error);
    throw error;
  }
}
