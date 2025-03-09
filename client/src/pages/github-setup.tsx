import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import GitHubConnect from "@/components/github-connect";
import GitHubDeployForm from "@/components/github-deploy-form";
import { ArrowLeft, Github, Code, Scroll, GitBranch, Settings, AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { initiateGitHubOAuth, createDirectGitHubOAuthUrl } from "@/lib/github-auth";

export default function GitHubSetupPage() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDirectAuth, setShowDirectAuth] = useState(false);

  const handleGitHubConnect = async () => {
    try {
      setIsConnecting(true);
      await initiateGitHubOAuth();
      // No need for toast here as we're redirecting away
    } catch (error) {
      toast({
        title: "Connection Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      setShowDirectAuth(true);
      setIsConnecting(false);
    }
  };

  const handleDirectAuth = () => {
    const directUrl = createDirectGitHubOAuthUrl();
    window.location.href = directUrl;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GitHub Integration</h1>
          <p className="text-muted-foreground">
            Connect and deploy your GitHub repositories
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="connect">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="connect">
            <Github className="h-4 w-4 mr-2" />
            Connect
          </TabsTrigger>
          <TabsTrigger value="deploy">
            <Code className="h-4 w-4 mr-2" />
            Deploy
          </TabsTrigger>
          <TabsTrigger value="manage">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connect">
          <GitHubConnect />

          {showDirectAuth && (
            <Alert variant="warning" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Having trouble connecting?</AlertTitle>
              <AlertDescription>
                Try using a direct GitHub authorization link instead.
                <Button
                  variant="link"
                  className="px-0 py-0 h-auto"
                  onClick={handleDirectAuth}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Direct GitHub Authorization
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="deploy">
          <Card>
            <CardHeader>
              <CardTitle>Deploy from GitHub</CardTitle>
              <CardDescription>
                Deploy your GitHub repository directly to a new server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GitHubDeployForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scroll className="h-5 w-5 mr-2" />
                  Webhook Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configure webhooks for automated deployments when you push to your repositories.
                </p>
              </CardContent>
              <CardFooter>
                <Button disabled>Configure Webhooks</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GitBranch className="h-5 w-5 mr-2" />
                  Deployment Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage build settings, environment variables, and deployment configurations.
                </p>
              </CardContent>
              <CardFooter>
                <Button disabled>Manage Settings</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
