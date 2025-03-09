import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Loader2, Save, Key, Github, User, ShieldAlert, Code, Copy, Check, ExternalLink } from "lucide-react";
import GitHubConnect from "@/components/github-connect";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

export default function AccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isGeneratingApiKey, setIsGeneratingApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check GitHub connection status
  const { data: repos = [], isLoading: isLoadingGithub } = useQuery<any[]>({
    queryKey: ["/api/github/repos"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isGitHubConnected = repos && repos.length > 0;

  // If URL contains #github, set the active tab to "github"
  useEffect(() => {
    if (location.includes("#github")) {
      setActiveTab("github");
    } else if (location.includes("#api")) {
      setActiveTab("api");
    }
  }, [location]);

  // Password change form
  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordChange = async (values) => {
    try {
      setIsChangingPassword(true);

      if (values.newPassword !== values.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords don't match",
          variant: "destructive",
        });
        return;
      }

      await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      form.reset();

      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      setIsGeneratingApiKey(true);

      await apiRequest("POST", "/api/user/generate-api-key");

      toast({
        title: "API Key Generated",
        description: "Your new API key has been generated successfully",
      });

      // Refresh user data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingApiKey(false);
    }
  };

  const copyApiKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      setCopied(true);
      toast({
        description: "API key copied to clipboard",
      });

      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="general" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center">
            <Key className="h-4 w-4 mr-2" />
            API Access
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center">
            <Github className="h-4 w-4 mr-2" />
            GitHub
            {isGitHubConnected && (
              <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-220px)]">
          <TabsContent value="general">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>View and update your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Username</Label>
                    <Input value={user?.username} disabled />
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <Input value={user?.isAdmin ? "Administrator" : "User"} disabled />
                  </div>
                  <div>
                    <Label>Account Balance</Label>
                    <Input value={`$${(user?.balance || 0) / 100}`} disabled />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <form onSubmit={form.handleSubmit(handlePasswordChange)}>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...form.register("currentPassword")}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...form.register("newPassword")}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...form.register("confirmPassword")}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isChangingPassword} className="ml-auto">
                      {isChangingPassword ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Change Password
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Access</CardTitle>
                  <CardDescription>Manage your API access credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="apiKey"
                        value={user?.apiKey || "No API key generated"}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={copyApiKey}
                        disabled={!user?.apiKey}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleGenerateApiKey}
                        disabled={isGeneratingApiKey}
                      >
                        {isGeneratingApiKey ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Your API key grants full access to your account. Keep it secure and never share it.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Generating a new API key will invalidate your previous key.
                    </p>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">API Documentation</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Learn how to use our API to programmatically manage your servers, volumes, and more.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" asChild className="flex-1">
                        <Link href="/api-docs">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View API Documentation
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="flex-1">
                        <a href="https://github.com/SkyVPS360/api-examples" target="_blank" rel="noreferrer">
                          <Github className="h-4 w-4 mr-2" />
                          API Usage Examples
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Using the API</CardTitle>
                  <CardDescription>Learn the basics of our REST API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Include your API key in the request headers:
                    </p>
                    <div className="bg-muted p-2 rounded-md overflow-x-auto">
                      <code className="text-xs">
                        Authorization: Bearer YOUR_API_KEY
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Base URL</h3>
                    <p className="text-sm text-muted-foreground">
                      All API requests should be made to:
                    </p>
                    <div className="bg-muted p-2 rounded-md overflow-x-auto">
                      <code className="text-xs">
                        https://api.skyvps360.com/v1
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Example Request</h3>
                    <div className="bg-muted p-2 rounded-md overflow-x-auto">
                      <code className="text-xs whitespace-pre">
                        {`fetch('https://api.skyvps360.com/v1/servers', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})`}
                      </code>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/my-api">
                      <Key className="h-4 w-4 mr-2" />
                      Advanced API Management
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="github">
            <div className="grid grid-cols-1 gap-6">
              <GitHubConnect className="w-full" />

              {isGitHubConnected && (
                <Card>
                  <CardHeader>
                    <CardTitle>Connected GitHub Repositories</CardTitle>
                    <CardDescription>Repositories available for deployment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted px-4 py-2 font-medium text-sm flex items-center">
                          <Code className="h-4 w-4 mr-2" />
                          <span>Your Repositories ({repos.length})</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-2">
                          {repos.map(repo => (
                            <div key={repo.id} className="flex items-center justify-between py-2 px-2 border-b last:border-0">
                              <div>
                                <div className="font-medium">{repo.name}</div>
                                <div className="text-xs text-muted-foreground">{repo.full_name}</div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(repo.html_url, '_blank')}
                              >
                                Visit
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Using GitHub Integration</CardTitle>
                  <CardDescription>Learn how to deploy your repositories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Getting Started</h3>
                    <ol className="list-decimal pl-5 space-y-1 text-sm">
                      <li>Connect your GitHub account using the button above</li>
                      <li>Grant permission to access your repositories</li>
                      <li>Once connected, you can deploy your repositories directly to new servers</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Deploying Repositories</h3>
                    <p className="text-sm text-muted-foreground">
                      When creating a new server, you can select the "GitHub Repo" option to deploy
                      directly from your GitHub repositories. You can also deploy from the GitHub
                      tab by clicking the "Deploy Repository" button.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Requirements</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      <li>Repository must contain a valid package.json or Dockerfile</li>
                      <li>Public or private repositories are supported</li>
                      <li>Only repositories to which you have access will be shown</li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => window.location.href = "/github-setup"}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <Github className="h-4 w-4 mr-2" />
                    GitHub Integration Guide
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div >
  );
}
