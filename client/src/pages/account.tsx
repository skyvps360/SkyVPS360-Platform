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
import { useLocation } from "wouter";
import { Loader2, Save, Key, Github, User, ShieldAlert } from "lucide-react";
import GitHubConnect from "@/components/github-connect";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isGeneratingApiKey, setIsGeneratingApiKey] = useState(false);

  // If URL contains #github, set the active tab to "github"
  useEffect(() => {
    if (location.includes("#github")) {
      setActiveTab("github");
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="general" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center">
            <Github className="h-4 w-4 mr-2" />
            GitHub Integration
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
                  <p className="text-sm text-muted-foreground">
                    Your API key grants full access to your account. Keep it secure and never share it.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="github">
            <div className="grid grid-cols-1 gap-6">
              <GitHubConnect className="w-full" />

              {/* Uncomment this for debugging if needed */}
              {/* <GitHubDebug /> */}

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
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
