// ...existing code...

// Ensure the auth route is properly configured
router.get('/auth', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GITHUB_REDIRECT_URI)}&scope=repo,user:email`;

  // For direct browser navigation, redirect instead of returning JSON
  res.redirect(githubAuthUrl);
});

// Ensure the callback route properly handles the response
router.get('/callback', async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.redirect('/github-setup?error=missing_code');
    }

    // Exchange code for token
    // ...existing code for token exchange...

    // After successful authentication, redirect to the GitHub setup page
    res.redirect('/github-setup?success=true');
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    res.redirect(`/github-setup?error=${encodeURIComponent(error.message || 'unknown_error')}`);
  }
});

// ...existing code...
