import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Github, Loader2, ExternalLink, AlertTriangle, Check } from "lucide-react";

export default function GitHubDebug() {
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<any>(null);

  // Get current configuration and connection status
  const { data: connectionStatus, isLoading: isLoadingConnectionStatus } = useQuery({
    queryKey: ["/api/github/debug/status"],
    queryFn: async () => {
      try {
        return await apiRequest("GET", "/api/github/debug/status");
      } catch (error) {
        return { error: (error as Error).message };
      }
    }
  });

  // Get environment variables (sensitive info redacted)
  const { data: envVars, isLoading: isLoadingEnvVars } = useQuery({
    queryKey: ["/api/debug"],
    queryFn: async () => {
      try {
        return await apiRequest("GET", "/api/debug");
      } catch (error) {
        return { error: (error as Error).message };
      }
    }
  });

  const getAuthUrl = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/github/auth-url");
      if (response && response.url) {
        setDebugInfo(`
OAuth URL: ${response.url}

Client ID: ${response.url.match(/client_id=([^&]+)/)?.[1] || "Not found"}
Redirect URI: ${decodeURIComponent(response.url.match(/redirect_uri=([^&]+)/)?.[1] || "Not found")}
Scope: ${response.url.match(/scope=([^&]+)/)?.[1] || "Not found"}
        `);
      }
    } catch (error) {
      setDebugInfo(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhook = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/github/debug/test-webhook");
      setTestWebhookResult(response);
    } catch (error) {
      setTestWebhookResult({ error: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectAuth = async () => {
    try {
      setIsLoading(true);
      // Use direct server-side redirect
      window.location.href = '/api/github/auth-url';
    } catch (error) {
      setDebugInfo(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="diagnostics">
      <TabsList className="grid grid-cols-3 w-full max-w-md">
        <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        <TabsTrigger value="oauth">OAuth Debug</TabsTrigger>
        <TabsTrigger value="webhook">Webhooks</TabsTrigger>
      </TabsList>

      <TabsContent value="diagnostics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>GitHub API Diagnostics</CardTitle>
            <CardDescription>
              View the current GitHub integration configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingConnectionStatus ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : connectionStatus?.error ? (
              <Alert variant="destructive">
                <AlertDescription>{connectionStatus.error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Connection Status:</span>
                    {connectionStatus?.connected ? (
                      <Badge className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Disconnected
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Environment:</span>
                    <Badge variant="outline">{process.env.NODE_ENV || "development"}</Badge>
                  </div>

                  {connectionStatus?.tokenStatus && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Token Status:</span>
                      {connectionStatus.tokenStatus === "valid" ? (
                        <Badge className="bg-green-500">Valid</Badge>
                      ) : (
                        <Badge variant="destructive">Invalid</Badge>
                      )}
                    </div>
                  )}

                  {connectionStatus?.scopes && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">OAuth Scopes:</span>
                      <span className="text-sm">{connectionStatus.scopes.join(", ")}</span>
                    </div>
                  )}
                </div>

                {connectionStatus?.username && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex items-center mb-2">
                      <Github className="h-4 w-4 mr-2" />
                      <span className="font-medium">Authenticated User</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Username:</span> {connectionStatus.username}</div>
                      <div><span className="font-medium">User ID:</span> {connectionStatus.userId}</div>
                      {connectionStatus.email && (
                        <div><span className="font-medium">Email:</span> {connectionStatus.email}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Environment Variables Section */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Environment Variables</h3>
                  {isLoadingEnvVars ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                      {JSON.stringify(envVars?.env || {}, null, 2)}
                    </pre>
                  )}
                </div>

                {/* System Info Section */}
                {envVars?.system && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">System Information</h3>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                      {JSON.stringify(envVars.system, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="oauth" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>OAuth Debug Tools</CardTitle>
            <CardDescription>
              Test GitHub OAuth authentication flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button onClick={getAuthUrl} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Github className="h-4 w-4 mr-2" />
                )}
                Check OAuth URL
              </Button>

              <Button onClick={handleDirectAuth} variant="secondary">
                <ExternalLink className="h-4 w-4 mr-2" />
                Direct GitHub Auth
              </Button>
            </div>

            {debugInfo && (
              <pre className="p-4 bg-muted rounded-md text-xs whitespace-pre-wrap">
                {debugInfo}
              </pre>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="webhook" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Testing</CardTitle>
            <CardDescription>
              Test GitHub webhook delivery and processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <Button onClick={testWebhook} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Github className="h-4 w-4 mr-2" />
                )}
                Test Push Webhook
              </Button>

              {testWebhookResult && (
                <pre className="p-4 bg-muted rounded-md text-xs whitespace-pre-wrap">
                  {JSON.stringify(testWebhookResult, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
