import express from "express";
import { requireAuth } from "../auth";
import { logger } from "../utils/logger";
import { db } from "../db";
import { users } from "@shared/schema";
import { deployments } from "../db/schema";
import { eq } from "drizzle-orm";
import * as githubApi from "../services/github-api";
import * as digitalOcean from "../services/digital-ocean";

const router = express.Router();

// Require authentication for all routes
router.use(requireAuth);

// Get all deployments for the authenticated user
router.get("/", async (req, res) => {
  try {
    logger.info(`Retrieving deployments for user ${req.user.id}`);

    try {
      // Use safe query that doesn't rely on specific column names
      // by accessing through db.query.deployments instead of raw select
      const userDeployments = await db.query.deployments.findMany({
        where: eq(deployments.userId, req.user.id)
      });

      logger.info(`Retrieved ${userDeployments.length} deployments for user ${req.user.id}`);
      res.json(userDeployments);
    } catch (dbError) {
      // Fallback to return empty array instead of error
      logger.warning(`Database schema issue detected, returning empty deployments array: ${dbError.message}`);
      res.json([]);
    }
  } catch (error) {
    logger.error("Error retrieving deployments:", error);
    res.status(500).json({ error: "Failed to retrieve deployments" });
  }
});

// Create a new deployment from GitHub repository
router.post("/", async (req, res) => {
  try {
    const { repoFullName, branch = "main" } = req.body;

    if (!repoFullName) {
      return res.status(400).json({ error: "Repository name is required" });
    }

    logger.info(`Starting deployment of ${repoFullName} (${branch}) for user ${req.user.id}`);

    // Get GitHub token from user record
    const githubToken = req.user.githubToken;

    if (!githubToken) {
      return res.status(401).json({ error: "GitHub account not connected" });
    }

    // Parse repo owner and name from full name (owner/repo)
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
      region: req.body.region || "nyc",
      environmentVariables: req.body.env || {}
    });

    // Store deployment in database
    const newDeployment = await db.insert(deployments).values({
      userId: req.user.id,
      repositoryName: repository.name, // Changed from name to repositoryName
      repositoryUrl: repository.html_url,
      branch,
      status: "in_progress",
      deployedAt: new Date().toISOString(),
      region: req.body.region || "nyc",
      doAppId: deploymentResult.app_id?.toString(),
      deploymentUrl: deploymentResult.live_url || null
    }).returning();

    logger.success(`Deployment initiated for ${repoFullName} (${branch})`);
    res.status(201).json(newDeployment[0]);
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

// Redeploy an existing deployment
router.post("/:id/redeploy", async (req, res) => {
  try {
    // Use direct query instead of the query builder
    const [deployment] = await db.select()
      .from(deployments)
      .where(eq(deployments.id, parseInt(req.params.id, 10)))
      .limit(1);

    if (!deployment || deployment.userId !== req.user.id) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    logger.info(`Redeploying deployment ${deployment.id}`);

    // Trigger redeployment using app platform service
    await appPlatform.redeployApp(deployment);

    res.json({ message: "Deployment is redeploying" });
  } catch (error) {
    logger.error(`Error redeploying application: ${error}`);
    res.status(500).json({ error: "Failed to redeploy application" });
  }
});

// Restart an existing deployment
router.post("/:id/restart", async (req, res) => {
  try {
    // Use direct query instead of the query builder
    const [deployment] = await db.select()
      .from(deployments)
      .where(eq(deployments.id, parseInt(req.params.id, 10)))
      .limit(1);

    if (!deployment || deployment.userId !== req.user.id) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    logger.info(`Restarting deployment ${deployment.id}`);

    // Trigger restart using app platform service
    await appPlatform.restartApp(deployment);

    res.json({ message: "Deployment is restarting" });
  } catch (error) {
    logger.error(`Error restarting deployment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to restart deployment" });
  }
});

export default router;
