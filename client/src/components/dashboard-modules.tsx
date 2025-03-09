import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Github, ExternalLink, Server, Activity } from "lucide-react";
import DeploymentsList from "./deployments-list";

export function GitHubAppsModule() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Github className="h-5 w-5 mr-2" />
            GitHub Applications
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/deployments">
              View All
            </Link>
          </Button>
        </div>
        <CardDescription>
          Applications deployed from your GitHub repositories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DeploymentsList limit={3} showViewAllLink={true} />
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href="/dashboard">
            <Github className="h-4 w-4 mr-2" />
            Deploy New GitHub App
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Add more dashboard modules here as needed...
