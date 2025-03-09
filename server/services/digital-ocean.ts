import fetch from "node-fetch";
import { logger } from "../utils/logger";

const DO_API_KEY = process.env.DIGITAL_OCEAN_API_KEY;
const DO_API_URL = "https://api.digitalocean.com/v2";

if (!DO_API_KEY) {
  logger.warning("DIGITAL_OCEAN_API_KEY environment variable not set");
}

/**
 * Deploy a GitHub repository to DigitalOcean App Platform
 */
export async function deployGitHubRepo({
  userId,
  repositoryName,
  repositoryOwner,
  branch = "main",
  githubToken,
  region = "nyc",
  environmentVariables = {}
}) {
  try {
    logger.info(`Deploying ${repositoryOwner}/${repositoryName} (${branch}) to DigitalOcean App Platform`);

    const appName = `${repositoryName.toLowerCase()}-${Math.floor(Date.now() / 1000)}`;

    // Format env vars for DO API
    const formattedEnvVars = Object.entries(environmentVariables).map(([key, value]) => ({
      key,
      value: String(value),
      scope: "RUN_AND_BUILD_TIME",
      type: "GENERAL"
    }));

    // Create app specification
    const appSpec = {
      name: appName,
      region,
      services: [
        {
          name: repositoryName,
          github: {
            repo: `${repositoryOwner}/${repositoryName}`,
            branch,
            deploy_on_push: true
          },
          source_dir: "/",
          envs: formattedEnvVars,
          instance_count: 1,
          instance_size_slug: "basic-xs"
        }
      ],
      github: {
        // Using deployed user's GitHub token for repo access
        repo: `${repositoryOwner}/${repositoryName}`,
        branch,
        deploy_on_push: true
      }
    };

    // Make request to DigitalOcean API
    const response = await fetch(`${DO_API_URL}/apps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DO_API_KEY}`
      },
      body: JSON.stringify(appSpec)
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`DigitalOcean API error (${response.status}):`, errorData);
      throw new Error(`DigitalOcean API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    logger.success(`Successfully deployed app to DigitalOcean. App ID: ${data.app.id}`);

    return {
      app_id: data.app.id,
      live_url: data.app.live_url,
      created_at: data.app.created_at,
      default_ingress: data.app.default_ingress
    };
  } catch (error) {
    logger.error("Error deploying to DigitalOcean:", error);
    throw error;
  }
}

/**
 * Get status of a DigitalOcean App Platform app
 */
export async function getAppStatus(appId) {
  try {
    const response = await fetch(`${DO_API_URL}/apps/${appId}`, {
      headers: {
        "Authorization": `Bearer ${DO_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Error fetching app status (${response.status}):`, errorData);
      return "unknown";
    }

    const data = await response.json();
    return data.app.phase || "unknown";
  } catch (error) {
    logger.error(`Error getting app status for ${appId}:`, error);
    return "error";
  }
}

/**
 * Get all DigitalOcean regions
 */
export async function getRegions() {
  try {
    const response = await fetch(`${DO_API_URL}/regions`, {
      headers: {
        "Authorization": `Bearer ${DO_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Error fetching regions (${response.status}):`, errorData);
      throw new Error(`DigitalOcean API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return data.regions;
  } catch (error) {
    logger.error("Error fetching DigitalOcean regions:", error);
    throw error;
  }
}

/**
 * Delete a DigitalOcean App Platform app
 */
export async function deleteApp(appId) {
  try {
    const response = await fetch(`${DO_API_URL}/apps/${appId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${DO_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Error deleting app (${response.status}):`, errorData);
      throw new Error(`DigitalOcean API error: ${errorData.message || response.statusText}`);
    }

    return true;
  } catch (error) {
    logger.error(`Error deleting app ${appId}:`, error);
    throw error;
  }
}
