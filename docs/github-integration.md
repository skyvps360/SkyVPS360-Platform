# GitHub Integration Guide

## Overview

This document explains how the GitHub integration works in SkyVPS360 and how to maintain it.

## Files That Handle GitHub Integration

1. **Backend Routes:**
   - `/server/routes/github.ts` - Main GitHub API routes
   - `/server/services/github.ts` - GitHub service functions

2. **Frontend Components:**
   - `/client/src/components/GitHubIntegrationCard.jsx` - Card for GitHub connection
   - `/client/src/components/AccountGitHubSection.jsx` - GitHub section on account page

## Important Notes

### Direct Navigation Required

Always use direct navigation (not AJAX) when connecting to GitHub:

```jsx
// CORRECT WAY - Use direct navigation
<a href="/api/github/auth-url">Connect GitHub</a>

// INCORRECT WAY - Causes CORS errors
const connectToGitHub = async () => {
  const response = await fetch('/api/github/auth-url');
  const data = await response.json();
  window.location.href = data.url; // CORS ERROR
}
```

### Environment Variables

GitHub OAuth requires these environment variables:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`  
- `GITHUB_REDIRECT_URI` - Must EXACTLY match what's registered in GitHub Developer settings

### Database Tables

GitHub integration uses these database tables:

- `users` table includes GitHub-related columns
- `deployments` table for GitHub deployments

## Troubleshooting

If GitHub integration fails:

1. Check that GitHub OAuth redirect URI exactly matches what's in GitHub Developer settings
2. Ensure user is authenticated before trying to connect GitHub
3. Check server logs for detailed GitHub API errors
4. Make sure the deployments table exists in the database
