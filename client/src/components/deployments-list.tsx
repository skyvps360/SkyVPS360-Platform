import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Github, ExternalLink, GitBranch, Clock } from "lucide-react";
import { format } from "date-fns";

interface GitHubDeployment {
  id: string;
  name: string;
  repository: string;
  branch: string;
  status: 'deploying' | 'active' | 'failed' | 'stopped';
  url: string;
  region: string;
  size: string;
  createdAt: string;
  lastDeployedAt: string;
}

interface DeploymentsListProps {
  limit?: number;
  showViewAllLink?: boolean;
}

export default function DeploymentsList({ limit = 3, showViewAllLink = false }: DeploymentsListProps) {
  const { data: deployments = [], isLoading } = useQuery<GitHubDeployment[]>({
    queryKey: ["/api/github/deployments"],
  });

  // Limit the number of deployments shown if a limit is provided
  const limitedDeployments = limit ? deployments.slice(0, limit) : deployments;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'deploying': return 'bg-blue-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      case 'stopped': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'deploying': return 'Deploying';
      case 'failed': return 'Failed';
      case 'stopped': return 'Stopped';
      default: return 'Unknown';
    }
  };

  // If deployments are loading, show skeletons
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].slice(0, limit).map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">No GitHub Apps Deployed</p>
          <p className="text-muted-foreground mb-6">
            Deploy your first GitHub application to get started.
          </p>
          <Button asChild>
            <Link href="/dashboard">Deploy Your First App</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {limitedDeployments.map((deployment) => (
          <Card key={deployment.id} className="overflow-hidden">
            <div className={`h-1 ${getStatusColor(deployment.status)}`} />
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{deployment.name}</CardTitle>
                <Badge variant="outline">{getStatusLabel(deployment.status)}</Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <Github className="h-3.5 w-3.5" />
                {deployment.repository}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5 mr-1" />
                <span>{deployment.branch}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>Updated {format(new Date(deployment.lastDeployedAt), 'MMM d, yyyy')}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {deployment.url && deployment.status === "active" && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    Open Application
                  </a>
                </Button>
              )}
              {(!deployment.url || deployment.status !== "active") && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/deployments?id=${deployment.id}`}>
                    View Details
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {showViewAllLink && deployments.length > 0 && (
        <div className="mt-4 text-center">
          <Button variant="link" asChild>
            <Link href="/deployments">
              View All Deployments ({deployments.length})
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
