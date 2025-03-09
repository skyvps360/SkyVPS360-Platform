import express from "express";
import crypto from "crypto";
import { logger } from "../utils/logger";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as appPlatform from "../services/app-platform";

const router = express.Router();

// GitHub webhook secret (used to verify webhook signatures)
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

// Raw body parser middleware for GitHub webhooks
// GitHub uses the raw body to generate the signature
router.use(express.json({
  verify: (req: express.Request, res: express.Response, buf: Buffer) => {
    (req as any).rawBody = buf;
  }
}));

function verifyGitHubWebhook(req: express.Request) {
  // Skip verification if webhook secret is not configured
  if (!WEBHOOK_SECRET) {
    logger.warning('GitHub webhook secret not configured, skipping signature verification');
    return true;
  }

  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) {
    logger.warning('No signature found in GitHub webhook');
    return false;
  }

  // Calculate the expected signature
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const calculatedSignature = 'sha256=' + hmac.update((req as any).rawBody).digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature)
  );
}

// Helper function to find users who have auto-deploy configured for a repo/branch
async function findUsersForRepository(repoId: string, branch: string) {
  try {
    // Find deployments that match this repo ID and branch
    // In a real implementation, you would query your database for deployments
    // associated with this repository and branch

    // This is a mock implementation until we have actual repository-deployment associations
    // In a production system, you'd have a table linking users to repositories and branches
    const usersWithAutoDeploy = await db.query.users.findMany({
      where: eq(users.githubToken, null, false) // Only users with GitHub tokens
    });

    return usersWithAutoDeploy;
  } catch (error) {
    logger.error(`Error finding users for repository ${repoId}:${branch}:`, error);
    return [];
  }
}

// Receive GitHub webhook events
router.post("/", async (req, res) => {
  try {
    const event = req.headers['x-github-event'] as string;
    logger.info(`Received GitHub webhook event: ${event}`);

    // Verify webhook signature if enabled
    if (!verifyGitHubWebhook(req)) {
      logger.warning('Invalid GitHub webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Handle push events (for automatic deployments)
    if (event === 'push') {
      const payload = req.body;
      const { repository, ref } = payload;
      const branchName = ref.replace('refs/heads/', '');

      logger.info(`Push event for repository ${repository.full_name} on branch ${branchName}`);

      // Find users who have this repository configured for auto-deploy
      const applicableUsers = await findUsersForRepository(repository.id.toString(), branchName);
      if (applicableUsers.length === 0) {
        logger.info(`No users found with auto-deploy configured for ${repository.full_name}:${branchName}`);
        return res.status(200).json({ message: 'No applicable configurations found' });
      }

      // Trigger deployments for each applicable user
      for (const user of applicableUsers) {
        try {
          logger.info(`Triggering auto-deploy for user ${user.id} (${user.username})`);

          // Find deployment configuration for this user/repo/branch
          // For now, we'll mock this
          const deploymentConfig = {
            name: `${repository.name}-${branchName}`,
            repoFullName: repository.full_name,
            branch: branchName,
            region: 'nyc', // Default region
            size: 'basic-xs' // Default size
          };

          // Trigger the deployment using the app platform service
          await appPlatform.createAppFromGitHub(user.id, {
            name: deploymentConfig.name,
            repository: deploymentConfig.repoFullName,
            branch: deploymentConfig.branch,
            region: deploymentConfig.region,
            size: deploymentConfig.size
          });

          logger.success(`Auto-deploy triggered successfully for ${repository.full_name}:${branchName}`);
        } catch (deployError) {
          logger.error(`Failed to trigger auto-deploy for user ${user.id}:`, deployError);
        }
      }
    }

    // Handle other GitHub webhook events
    else if (event === 'installation' || event === 'installation_repositories') {
      // Handle GitHub App installation events
      const action = req.body.action;
      logger.info(`GitHub App installation event: ${action}`);
      // Add handling for installations
    }

    // Always return success to GitHub
    res.status(200).json({ received: true });

  } catch (error) {
    logger.error(`Error processing GitHub webhook:`, error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router;