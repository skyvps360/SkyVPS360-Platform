import { Request, Response } from "express";
import { getGitHubOAuthURL, exchangeCodeForToken, saveGitHubToken, getUserRepositories } from "../services/github";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Handler for getting GitHub authorization URL
export async function getAuthUrlHandler(req: Request, res: Response) {
  try {
    const url = await getGitHubOAuthURL();
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

// Handler for OAuth callback
export async function callbackHandler(req: Request, res: Response) {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Invalid code" });
    }

    const token = await exchangeCodeForToken(code);

    if (!token) {
      return res.status(400).json({ error: "Failed to obtain token" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await saveGitHubToken(req.user.id, token);

    // Redirect to account page
    res.redirect("/account?github_connected=true");
  } catch (error) {
    console.error("GitHub callback error:", error);
    res.redirect("/account?github_error=true");
  }
}

// Handler for disconnecting GitHub account
export async function disconnectHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await db.update(users)
      .set({ githubToken: null })
      .where(eq(users.id, req.user.id));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

// Handler for getting repositories
export async function getReposHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const githubToken = req.user.githubToken;
    if (!githubToken) {
      return res.status(401).json({ error: "GitHub account not connected" });
    }

    const repos = await getUserRepositories(githubToken);
    res.json(repos);
  } catch (error) {
    console.error("GitHub repositories fetch error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
}
