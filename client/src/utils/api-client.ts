// Add this function to your API client

/**
 * Connect to GitHub - IMPORTANT: This must be a direct navigation, not an API call
 */
export const connectToGitHub = () => {
  // Direct navigation prevents CORS issues
  window.location.href = '/api/github/auth-url';
};

// Remove any existing connectToGitHub functions that use fetch/axios
// For example, if you have code like this:
// export const connectToGitHub = async () => {
//   const response = await fetch('/api/github/auth-url');
//   const data = await response.json();
//   window.location.href = data.url;  // THIS CAUSES CORS ISSUES
// };
