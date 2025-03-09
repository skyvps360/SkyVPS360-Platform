import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import dotenv from 'dotenv';

// Will use .env by default
dotenv.config();

/**
 * Loads GitHub environment variables from .env first
 */
export function loadGitHubCredentials() {
  try {
    // Read directly from process.env (populated from .env)
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    // Only log first few characters of client ID for security
    const displayClientId = clientId ? `${clientId.substring(0, 5)}...` : "Not set";
    const displayClientSecret = clientSecret ? "Set" : "Not set";

    logger.info(`🐙 [GitHub] GitHub OAuth Configuration:`);
    logger.info(`🐙 [GitHub] - Client ID: ${displayClientId}`);
    logger.info(`🐙 [GitHub] - Client Secret: ${displayClientSecret}`);
    logger.info(`🐙 [GitHub] - Redirect URI: ${redirectUri}`);

    if (clientId && clientSecret && redirectUri) {
      // Make sure they're properly trimmed
      process.env.GITHUB_CLIENT_ID = clientId.trim();
      process.env.GITHUB_CLIENT_SECRET = clientSecret.trim();
      process.env.GITHUB_REDIRECT_URI = redirectUri.trim();

      logger.success("GitHub OAuth credentials successfully loaded. GitHub integration is available.");
      return true;
    } else {
      logger.warning("GitHub OAuth credentials are missing or incomplete. GitHub integration will not work properly.");
      return false;
    }
  } catch (error) {
    logger.error("Error loading GitHub credentials:", error);
    return false;
  }
}
