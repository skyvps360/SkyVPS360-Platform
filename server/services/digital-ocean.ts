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
  environmentVariables = {},
  size = "basic-xs"
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

    // Create app specification following DO App Platform spec format
    const appSpec = {
      name: appName,
      region: region,
      spec: {
        name: appName,
        services: [
          {
            name: repositoryName,
            source_dir: "/",
            github: {
              branch: branch,
              deploy_on_push: true,
              repo: `${repositoryOwner}/${repositoryName}`,
              // Add GitHub token for private repos
              auth: {
                type: "GITHUB",
                token: githubToken
              }
            },
            instance_count: 1,
            instance_size_slug: size,
            routes: [{ path: "/" }],
            envs: formattedEnvVars,
            run_command: "npm start",
            build_command: "npm install && npm run build"
          }
        ]
      }
    };

    // Make request to DigitalOcean API
    const response = await fetch(`${DO_API_URL}/apps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DO_API_KEY}`,
        "Accept": "application/json"
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
      live_url: data.app.live_url || data.app.default_ingress,
      created_at: data.app.created_at,
      status: data.app.status
    };
  } catch (error) {
    logger.error("Error deploying to DigitalOcean:", error);
    throw error;
  }
}

/**
 * Get status of a DigitalOcean App Platform app
 */
export async function getAppStatus(appId: string) {
  try {
    const response = await fetch(`${DO_API_URL}/apps/${appId}`, {
      headers: {
        "Authorization": `Bearer ${DO_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || response.statusText);
    }

    const data = await response.json();
    return data.app.status;
  } catch (error) {
    logger.error(`Error getting app status for ${appId}:`, error);
    throw error;
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
