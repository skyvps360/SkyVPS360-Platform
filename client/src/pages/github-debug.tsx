import { useState } from "react";
import { Link } from "wouter";
import GitHubDebug from "@/components/github-debug";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Github } from "lucide-react";

export default function GitHubDebugPage() {
  const [directAuthUrl, setDirectAuthUrl] = useState("");

  // Manual direct auth link generator
  const generateDirectAuthLink = () => {
    const clientId = "Ov23lis2zEGGv7CCm9SG"; // From your .env file
    const redirectUri = encodeURIComponent("http://localhost:5000/api/github/callback");
    const scope = "repo,user:email";
    const state = Math.random().toString(36).substring(7);

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    setDirectAuthUrl(url);

    // Open in new tab
    window.open(url, "_blank");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GitHub Integration Debug</h1>
          <p className="text-muted-foreground">
            Troubleshoot GitHub authentication and connections
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Direct GitHub Authorization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            If the normal authentication flow isn't working, try a direct link to GitHub's OAuth authorization page.
          </p>
          <div className="flex flex-col space-y-2">
            <Button onClick={generateDirectAuthLink} className="flex items-center">
              <Github className="h-4 w-4 mr-2" />
              Generate Direct Auth Link
            </Button>

            {directAuthUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Direct GitHub Auth URL:</p>
                <div className="bg-muted p-2 rounded-md text-xs overflow-auto">
                  <code>{directAuthUrl}</code>
                </div>
                <Button variant="link" className="mt-2 h-auto p-0" asChild>
                  <a href={directAuthUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in new tab
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <GitHubDebug />
    </div>
  );
}
