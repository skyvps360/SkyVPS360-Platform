import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Github, InfoIcon, Terminal, Code, RefreshCw, Settings, History, AlertTriangle, CheckCircle } from "lucide-react";
import GitHubDebug from "@/components/github-debug";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function GitHubSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [buildCache, setBuildCache] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Get GitHub connection status
  const { data: githubConnection, isLoading: isLoadingConnection } = useQuery({
    queryKey: ["/api/github/connection-details"],
    queryFn: async () => {
      try {
        return await apiRequest("GET", "/api/github/connection-details");
      } catch (error) {
        return { connected: false };
      }
    }
  });

  // Get recent GitHub activity
  const { data: recentActivity = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ["/api/github/recent-activity"],
    queryFn: async () => {
      try {
        return await apiRequest("GET", "/api/github/recent-activity") || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!githubConnection?.connected
  });

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await apiRequest("POST", "/api/github/disconnect");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/github/connection-details"] });
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
      setIsDisconnecting(false);
    }
  };

  const handleConnectGitHub = async () => {
    try {
      const response = await apiRequest("GET", "/api/github/auth-url");
      if (response?.url) {
        window.location.href = response.url;
      } else {
        throw new Error("Failed to get GitHub authorization URL");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const saveSettings = async () => {
    try {
      await apiRequest("POST", "/api/github/settings", {
        autoDeploy,
        buildCache
      });

      toast({
        title: "Settings saved",
        description: "Your GitHub settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleWebhookSave = async () => {
    try {
      setIsConfiguring(true);
      await apiRequest("POST", "/api/github/webhooks/configure", {
        url: webhookUrl,
        secret: webhookSecret
      });

      toast({
        title: "Webhook configured",
        description: "GitHub webhook settings have been saved",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/github/connection-details"] });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">GitHub Settings</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/deployments">
              View Deployments
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <RefreshCw className="h-4 w-4 mr-2" />
              Deploy New App
            </Link>
          </Button>
        </div>
      </div>

      {githubConnection?.connected ? (
        <div className="flex gap-2">
          <Alert className="bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Connected to GitHub</AlertTitle>
            <AlertDescription>
              Your GitHub account is connected as <strong>{githubConnection.username}</strong>
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <Alert className="bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>GitHub Not Connected</AlertTitle>
          <AlertDescription>
            Connect your GitHub account to deploy repositories directly.
            <Button size="sm" className="ml-4" onClick={handleConnectGitHub}>
              <Github className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="deployments">
            <Code className="h-4 w-4 mr-2" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Terminal className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="debug">
            <InfoIcon className="h-4 w-4 mr-2" />
            Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your GitHub integration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {githubConnection?.connected && (
                <>
                  <div>
                    <div className="text-sm font-medium mb-1">GitHub Username</div>
                    <div className="text-sm text-muted-foreground">{githubConnection.username}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">GitHub Email</div>
                    <div className="text-sm text-muted-foreground">{githubConnection.email || "Not available"}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Connected Since</div>
                    <div className="text-sm text-muted-foreground">
                      {githubConnection.connectedAt ? new Date(githubConnection.connectedAt).toLocaleString() : "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Token Scopes</div>
                    <div className="text-sm text-muted-foreground">
                      {githubConnection.scopes?.join(", ") || "repo"}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reconnect">Reconnect to GitHub</Label>
                      <div className="text-sm text-muted-foreground">
                        Refresh your GitHub authorization token
                      </div>
                    </div>
                    <Button id="reconnect" onClick={handleConnectGitHub}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reconnect
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="disconnect">Disconnect GitHub</Label>
                      <div className="text-sm text-muted-foreground">
                        Remove GitHub integration from your account
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" id="disconnect">
                          Disconnect
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Disconnect GitHub</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to disconnect your GitHub account? Any automatic deployments will stop working.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => document.querySelector('[role="dialog"]')?.querySelector('[aria-label="Close"]')?.dispatchEvent(new MouseEvent("click"))}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDisconnect}
                            disabled={isDisconnecting}
                          >
                            {isDisconnecting ? "Disconnecting..." : "Disconnect GitHub"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              )}

              {!githubConnection?.connected && (
                <div className="flex flex-col items-center py-6">
                  <Github className="h-12 w-12 text-muted-foreground mb-4" />
                  <div className="text-lg font-medium mb-2">GitHub Not Connected</div>
                  <p className="text-muted-foreground text-center mb-4">
                    Connect your GitHub account to deploy repositories and access additional features.
                  </p>
                  <Button onClick={handleConnectGitHub}>
                    <Github className="h-4 w-4 mr-2" />
                    Connect GitHub Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {githubConnection?.connected && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Recent GitHub-related actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivity ? (
                  <div className="flex justify-center py-4">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent activity found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity: any, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                          <History className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm">{activity.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="deployments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Settings</CardTitle>
              <CardDescription>
                Configure how your GitHub repositories are deployed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-deploy">Auto-deploy on push</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically deploy when code is pushed to the configured branch
                  </div>
                </div>
                <Switch
                  id="auto-deploy"
                  checked={autoDeploy}
                  onCheckedChange={setAutoDeploy}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="build-cache">Enable build cache</Label>
                  <div className="text-sm text-muted-foreground">
                    Cache build artifacts to speed up deployments
                  </div>
                </div>
                <Switch
                  id="build-cache"
                  checked={buildCache}
                  onCheckedChange={setBuildCache}
                />
              </div>

              <div className="pt-4">
                <Button onClick={saveSettings}>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Logs</CardTitle>
              <CardDescription>
                View logs related to GitHub integration activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-md p-4 text-green-400 font-mono h-[400px] overflow-y-auto text-sm">
                <div className="opacity-70">
                  [2023-08-12 14:30:22] GitHub OAuth callback received
                </div>
                <div className="opacity-70">
                  [2023-08-12 14:30:23] Successfully authenticated user with GitHub
                </div>
                <div className="opacity-70">
                  [2023-08-12 14:30:23] Token scopes: repo, user:email
                </div>
                <div className="opacity-70">
                  [2023-08-12 14:35:12] Webhook received for repository: user/repo
                </div>
                <div className="opacity-70">
                  [2023-08-12 14:35:13] Deployment triggered for branch: main
                </div>
                <div className="opacity-70">
                  [2023-08-12 14:38:22] Deployment completed successfully
                </div>
                <div className="mt-1">
                  [2023-08-12 15:12:45] GitHub repositories fetched: 12 available
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="mt-4">
          <GitHubDebug />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Settings</CardTitle>
              <CardDescription>
                Configure GitHub webhooks for your repositories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div>
                <Label htmlFor="webhook-secret">Webhook Secret</Label>
                <Input
                  id="webhook-secret"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Enter a secret for webhook validation"
                />
              </div>
              <div className="pt-4">
                <Button onClick={handleWebhookSave} disabled={isConfiguring}>
                  {isConfiguring ? "Saving..." : "Save Webhook Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
