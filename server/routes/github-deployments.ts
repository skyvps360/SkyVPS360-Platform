import express from "express";
import { requireAuth } from "../auth";
import { logger } from "../utils/logger";
import { db } from "../db";
import { deployments } from "../db/schema";
import { eq } from "drizzle-orm";
import * as digitalOcean from "../services/digital-ocean";
import * as githubApi from "../services/github";

const router = express.Router();

// Require authentication for all routes
router.use(requireAuth);

// Get all deployments for the authenticated user
router.get("/", async (req, res) => {
  try {
    const userDeployments = await db.select()
      .from(deployments)
      .where(eq(deployments.userId, req.user.id))
      .orderBy(deployments.createdAt, "desc");

    res.json(userDeployments);
  } catch (dbError) {
    logger.error("Database error retrieving deployments:", dbError);
    res.status(500).json({ error: "Failed to retrieve deployments" });
  }
});

// Create a new deployment from GitHub repository
router.post("/", async (req, res) => {
  try {
    const {
      repoFullName,
      branch = "main",
      region = "nyc",
      environmentVariables = {},
      size = "basic-xs"
    } = req.body;

    if (!repoFullName) {
      return res.status(400).json({ error: "Repository name is required" });
    }

    logger.info(`Starting deployment of ${repoFullName} (${branch}) for user ${req.user.id}`);

    // Get GitHub token from user record
    const githubToken = req.user.githubToken;

    if (!githubToken) {
      return res.status(401).json({ error: "GitHub account not connected" });
    }

    // Parse repo owner and name
    const [owner, repo] = repoFullName.split('/');

    if (!owner || !repo) {
      return res.status(400).json({ error: "Invalid repository name format" });
    }

    // Fetch repository details from GitHub
    const repository = await githubApi.getRepository(githubToken, owner, repo);

    // Start DigitalOcean App Platform deployment
    const deploymentResult = await digitalOcean.deployGitHubRepo({
      userId: req.user.id,
      repositoryName: repo,
      repositoryOwner: owner,
      branch,
      githubToken,
      region,
      size,
      environmentVariables
    });

    // Store deployment in database
    const [newDeployment] = await db.insert(deployments).values({
      userId: req.user.id,
      repository: repoFullName,
      repositoryUrl: repository.html_url,
      branch,
      status: deploymentResult.status || "in_progress",
      deployedAt: new Date().toISOString(),
      region,
      doAppId: deploymentResult.app_id?.toString(),
      url: deploymentResult.live_url || null
    }).returning();

    logger.success(`Deployment initiated for ${repoFullName} (${branch})`);
    res.status(201).json(newDeployment);

  } catch (error) {
    logger.error(`Error deploying repository:`, error);
    res.status(500).json({
      error: "Failed to deploy repository",
      details: error.message
    });
  }
});

// Get deployment status
router.get("/:id", async (req, res) => {
  try {
    const deploymentId = req.params.id;

    const deployment = await db.select()
      .from(deployments)
      .where(eq(deployments.id, deploymentId))
      .limit(1);

    if (deployment.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    // Check if deployment belongs to user
    if (deployment[0].userId !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to view this deployment" });
    }

    // If DigitalOcean App ID exists, get live status
    if (deployment[0].doAppId) {
      const status = await digitalOcean.getAppStatus(deployment[0].doAppId);

      // Update status in database if changed
      if (status && status !== deployment[0].status) {
        await db.update(deployments)
          .set({ status })
          .where(eq(deployments.id, deploymentId));

        deployment[0].status = status;
      }
    }

    res.json(deployment[0]);
  } catch (error) {
    logger.error("Error retrieving deployment:", error);
    res.status(500).json({ error: "Failed to retrieve deployment" });
  }
});

// Delete deployment
router.delete("/:id", async (req, res) => {
  try {
    const deploymentId = req.params.id;

    const deployment = await db.select()
      .from(deployments)
      .where(eq(deployments.id, deploymentId))
      .limit(1);

    if (deployment.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    // Check if deployment belongs to user
    if (deployment[0].userId !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to delete this deployment" });
    }

    // Delete from DigitalOcean if app ID exists
    if (deployment[0].doAppId) {
      await digitalOcean.deleteApp(deployment[0].doAppId);
    }

    // Delete from database
    await db.delete(deployments)
      .where(eq(deployments.id, deploymentId));

    res.json({ success: true });
  } catch (error) {
    logger.error("Error deleting deployment:", error);
    res.status(500).json({ error: "Failed to delete deployment" });
  }
});

export default router;
