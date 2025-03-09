/**
 * IMPORTANT: Use direct navigation for GitHub OAuth, not API calls
 * 
 * This avoids CORS issues and ensures the GitHub OAuth flow works correctly
 */
export const connectToGitHub = () => {
  window.location.href = '/api/github/auth-url';
};

// Export a helper to format GitHub repository names
export const formatRepoName = (fullName) => {
  if (!fullName) return '';
  return fullName.split('/')[1] || fullName;
};

// Export a helper to get GitHub avatar URL from username
export const getGitHubAvatarUrl = (username) => {
  if (!username) return '';
  return `https://github.com/${username}.png`;
};
