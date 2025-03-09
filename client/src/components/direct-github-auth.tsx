import React from 'react';
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export default function DirectGitHubAuth() {
  const handleDirectAuth = () => {
    // These values should match what's in your .env file
    const clientId = "Ov23lis2zEGGv7CCm9SG";
    const redirectUri = encodeURIComponent("http://localhost:5000/api/github/callback");
    const scope = "repo,user:email";
    const state = Math.random().toString(36).substring(7);

    // Construct the GitHub OAuth URL
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    // Navigate directly to GitHub's OAuth page
    window.location.href = authUrl;
  };

  return (
    <Button onClick={handleDirectAuth} className="w-full">
      <Github className="h-4 w-4 mr-2" />
      Connect GitHub Account (Direct Link)
    </Button>
  );
}
