import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  Github,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  XCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DeploymentsList from "@/components/deployments-list";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import DeploymentDetailPage from "./deployment-detail";

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

export default function DeploymentsPage() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check if we're viewing a specific deployment
  const deploymentId = new URLSearchParams(location.split('?')[1]).get('id');

  // If we have a deployment ID, render the detail page
  if (deploymentId) {
    return <DeploymentDetailPage />;
  }

  const { data: deployments = [], isLoading } = useQuery<GitHubDeployment[]>({
    queryKey: ["/api/github/deployments"],
  });

  const refreshDeployments = async () => {
    try {
      setIsRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: ["/api/github/deployments"] });
      toast({
        title: "Refreshed",
        description: "Deployment list has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh deployments",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredDeployments = deployments.filter(deployment => {
    // Apply text search
    const matchesSearch = searchQuery === "" ||
      deployment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deployment.repository.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply status filter
    const matchesStatus = !statusFilter || deployment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">GitHub Deployments</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDeployments}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <Plus className="h-4 w-4 mr-2" />
              New Deployment
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deployments..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-shrink-0 space-x-1">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
            className={statusFilter === "active" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Active
          </Button>
          <Button
            variant={statusFilter === "deploying" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("deploying")}
            className={statusFilter === "deploying" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <Loader2 className="h-4 w-4 mr-1" />
            Deploying
          </Button>
          <Button
            variant={statusFilter === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("failed")}
            className={statusFilter === "failed" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Failed
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDeployments.length === 0 ? (
        <Card className="py-12">
          <div className="text-center">
            {statusFilter || searchQuery ? (
              <>
                <div className="text-lg font-medium mb-2">No matching deployments</div>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setStatusFilter(null);
                }}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="text-lg font-medium mb-2">No GitHub deployments yet</div>
                <p className="text-muted-foreground mb-6">
                  Deploy your first GitHub project to get started
                </p>
                <Button asChild>
                  <Link href="/dashboard">Deploy Your First App</Link>
                </Button>
              </>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredDeployments.map((deployment) => {
            const statusBadgeClass =
              deployment.status === 'active' ? "bg-green-500" :
                deployment.status === 'deploying' ? "bg-blue-500 animate-pulse" :
                  deployment.status === 'failed' ? "bg-red-500" : "bg-gray-500";

            const statusIcon =
              deployment.status === 'active' ? <CheckCircle className="h-3 w-3 mr-1" /> :
                deployment.status === 'deploying' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> :
                  deployment.status === 'failed' ? <XCircle className="h-3 w-3 mr-1" /> :
                    <AlertTriangle className="h-3 w-3 mr-1" />;

            return (
              <Card key={deployment.id} className="overflow-hidden">
                <div className={`h-1 ${statusBadgeClass}`} />
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate" title={deployment.name}>{deployment.name}</h3>
                    <Badge variant="outline" className="flex items-center">
                      {statusIcon}
                      {deployment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 mb-3 flex items-center">
                    <Github className="h-3 w-3 mr-1" />
                    {deployment.repository}
                  </p>

                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(deployment.lastDeployedAt).toLocaleDateString()}
                  </div>

                  <div className="flex space-x-2">
                    {deployment.status === 'active' ? (
                      <Button size="sm" className="flex-1" asChild>
                        <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1" disabled={deployment.status === 'deploying'}>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Redeploy
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link href={`/deployments?id=${deployment.id}`}>
                        Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
