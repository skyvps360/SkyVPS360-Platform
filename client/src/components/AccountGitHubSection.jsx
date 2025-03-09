import React from 'react';
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { Link } from "wouter";

export default function AccountGitHubSection({ user }) {
  const isConnected = !!user?.githubToken;

  return (
    <div className="py-6 px-6 flex flex-col border rounded-lg">
      <h3 className="text-xl font-medium">GitHub Connection</h3>

      {isConnected ? (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Github size={20} />
            <span className="text-green-500 font-medium">Connected to GitHub</span>
          </div>

          {user.githubUsername && (
            <p className="text-muted-foreground mb-4">
              Connected as: <strong>{user.githubUsername}</strong>
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" asChild>
              <a href="/api/github/logout">Disconnect GitHub</a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/github-guide">Manage Repositories</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-muted-foreground mb-4">
            Connect your GitHub account to deploy directly from your repositories.
          </p>

          <Button asChild>
            <Link href="/github-guide">
              <Github className="mr-2" />
              Connect GitHub Account
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
