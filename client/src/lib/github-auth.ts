import { apiRequest } from "./queryClient";

/**
 * Initiates the GitHub OAuth flow by requesting the auth URL and redirecting the user
 * @returns Promise resolving to true if redirect successful
 */
export async function initiateGitHubOAuth(): Promise<boolean> {
  try {
    // Use direct server-side redirect
    window.location.href = '/api/github/auth-url';
    return true;
  } catch (error) {
    console.error("GitHub OAuth initialization failed:", error);
    throw error;
  }
}

/**
 * Creates a direct GitHub OAuth URL without going through the backend
 * This is useful as a fallback if the backend route has issues
 */
export async function createDirectGitHubOAuthUrl(): Promise<string> {
  // Request JSON response instead of redirect
  const response = await apiRequest("GET", "/api/github/auth-url?json=true");
  if (response?.url) {
    return response.url;
  }
  throw new Error("Failed to get GitHub authorization URL");
}
