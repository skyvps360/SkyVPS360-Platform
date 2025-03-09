import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Github, LinkIcon, Unlink, ExternalLink, Star, Loader2, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

interface GitHubConnectProps {
  className?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  default_branch: string;
  language: string;
  stargazers_count: number;
  updated_at: string;
}

interface DeploymentOptions {
  region: string;
  env: Record<string, string>;
}

export default function GitHubConnect({ className }: GitHubConnectProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [deploymentOptions, setDeploymentOptions] = useState<DeploymentOptions>({
    region: "nyc",
    env: {}
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [customEnvVars, setCustomEnvVars] = useState<{ key: string, value: string }[]>([
    { key: "", value: "" }
  ]);

  const { data: repos = [], isLoading: isLoadingRepos } = useQuery<GitHubRepo[]>({
    queryKey: ["/api/github/repos"],
    onError: () => {
      // If error occurs, we assume the user isn't connected to GitHub
    },
  });

  const isConnected = repos.length > 0;

  // Get available DigitalOcean regions
  const { data: regions = [] } = useQuery({
    queryKey: ["/api/app-platform/regions"],
    enabled: deployDialogOpen,
  });

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // Simplify by using direct server-side redirect
      window.location.href = '/api/github/auth-url';
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsConnecting(true);

      await apiRequest("POST", "/api/github/disconnect");
      queryClient.invalidateQueries({ queryKey: ["/api/github/repos"] });

      toast({
        title: "Success",
        description: "GitHub account disconnected successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeployRepo = async () => {
    if (!selectedRepo) return;

    try {
      setIsDeploying(true);
      const branch = selectedBranch || selectedRepo.default_branch;

      // Process environment variables
      const envVars = {};
      customEnvVars.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          envVars[key.trim()] = value.trim();
        }
      });

      // Call API to deploy the repository
      const response = await apiRequest("POST", "/api/github/deployments", {
        repoFullName: selectedRepo.full_name,
        branch,
        region: deploymentOptions.region,
        env: envVars
      });

      setDeployDialogOpen(false);

      toast({
        title: "Deployment Started",
        description: `Deploying ${selectedRepo.full_name} (${branch} branch). You'll be notified when it's ready.`,
      });

      // Navigate to deployment status page
      if (response.id) {
        window.location.href = `/deployments/${response.id}`;
      }
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Add environment variable field
  const addEnvVar = () => {
    setCustomEnvVars([...customEnvVars, { key: "", value: "" }]);
  };

  // Update environment variable
  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customEnvVars];
    updated[index][field] = value;
    setCustomEnvVars(updated);
  };

  // Remove environment variable field
  const removeEnvVar = (index: number) => {
    const updated = [...customEnvVars];
    updated.splice(index, 1);
    setCustomEnvVars(updated);
  };

  // Format date string to relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffMonth / 12);

    if (diffSec < 60) return `${diffSec} second${diffSec === 1 ? '' : 's'} ago`;
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
    return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Github className="mr-2 h-5 w-5" />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to deploy repositories directly to your servers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <>
            <div className="mb-4 flex items-center text-sm">
              <LinkIcon className="mr-2 h-4 w-4 text-green-500" />
              <span>Connected to GitHub</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {repos.length} repositories available
              </span>
            </div>

            <div className="mb-4 max-h-64 overflow-y-auto border rounded-md">
              {repos.slice(0, 10).map((repo) => (
                <div key={repo.id} className="flex flex-col border-b last:border-0 p-2 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <GitBranch className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline flex items-center"
                      >
                        {repo.name}
                        <ExternalLink className="h-3 w-3 ml-1 inline" />
                      </a>
                    </div>
                    {repo.private && (
                      <Badge variant="outline" className="text-xs">Private</Badge>
                    )}
                  </div>

                  {repo.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{repo.description}</p>
                  )}

                  <div className="flex items-center mt-2 space-x-3 text-xs text-muted-foreground">
                    {repo.language && <span>{repo.language}</span>}
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        {repo.stargazers_count}
                      </span>
                    )}
                    <span>Updated {formatRelativeTime(repo.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    Deploy Repository
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Deploy GitHub Repository</DialogTitle>
                    <DialogDescription>
                      Select a repository to deploy to DigitalOcean App Platform
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Repository</Label>
                      <Select
                        onValueChange={(value) => {
                          const repo = repos.find(r => r.full_name === value);
                          setSelectedRepo(repo || null);
                          setSelectedBranch(repo?.default_branch || "");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {repos.map(repo => (
                            <SelectItem key={repo.id} value={repo.full_name}>
                              {repo.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRepo && (
                      <>
                        <div className="space-y-2">
                          <Label>Branch</Label>
                          <Input
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            placeholder={selectedRepo.default_branch}
                          />
                          <p className="text-sm text-muted-foreground">
                            Leave empty to use the default branch ({selectedRepo.default_branch})
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Region</Label>
                          <Select
                            value={deploymentOptions.region}
                            onValueChange={(value) => setDeploymentOptions({
                              ...deploymentOptions,
                              region: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a region" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nyc">New York</SelectItem>
                              <SelectItem value="ams">Amsterdam</SelectItem>
                              <SelectItem value="sfo">San Francisco</SelectItem>
                              <SelectItem value="sgp">Singapore</SelectItem>
                              <SelectItem value="lon">London</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 border-t pt-3">
                          <div className="flex items-center justify-between">
                            <Label>Environment Variables</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addEnvVar}
                              type="button"
                            >
                              Add Variable
                            </Button>
                          </div>

                          {customEnvVars.map((envVar, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                placeholder="KEY"
                                value={envVar.key}
                                onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                                className="w-1/3"
                              />
                              <Input
                                placeholder="value"
                                value={envVar.value}
                                onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeEnvVar(index)}
                                disabled={customEnvVars.length === 1}
                                className="shrink-0"
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeployDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeployRepo}
                      disabled={!selectedRepo || isDeploying}
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : "Deploy Repository"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4 mr-2" />
                )}
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Connect to GitHub</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Link your GitHub account to deploy your repositories directly to your servers.
            </p>
            <div className="space-y-2">
              {/* Original button that uses the server-side redirect */}
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="h-4 w-4 mr-2" />
                    Connect GitHub Account
                  </>
                )}
              </Button>

              {/* Direct link fallback button */}
              <div className="text-xs text-muted-foreground mt-2">
                Having trouble connecting?
                <Button variant="link" size="sm" className="px-1 h-auto" onClick={() => {
                  window.location.href = '/api/github/auth-url';
                }}>
                  Try direct link
                </Button>
              </div>

              {/* Add link to GitHub Guide */}
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/github-guide">
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    View GitHub Integration Guide
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
