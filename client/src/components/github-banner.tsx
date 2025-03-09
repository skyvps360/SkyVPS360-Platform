import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, X, LinkIcon, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const GitHubBanner = ({ /* props */ }) => {
  const [dismissed, setDismissed] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  // Check if dismissal state is stored in localStorage
  useEffect(() => {
    const isDismissed = localStorage.getItem("github-banner-dismissed") === "true";
    setDismissed(isDismissed);
  }, []);

  const saveDismissal = () => {
    localStorage.setItem("github-banner-dismissed", "true");
    setDismissed(true);
  };

  // Check if user has already connected GitHub
  const { data: repos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/github/repos"],
    enabled: !dismissed,
    retry: false,
    refetchOnWindowFocus: false,
    onError: () => {
      // No need to handle error - we just want to know if GitHub is connected
    }
  });

  const handleConnect = async () => {
    try {
      setConnecting(true);

      // Simplify by using direct server-side redirect
      window.location.href = '/api/github/auth-url';
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: (error as Error).message || "GitHub integration is currently unavailable",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  // If the user already has GitHub connected, show a success banner instead
  if (repos && repos.length > 0) {
    if (dismissed) return null;

    return (
      <Card className="border-green-600/20 bg-green-50 dark:bg-green-950/20 mb-6">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900 rounded-full p-2 mr-3">
              <LinkIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium">GitHub Connected Successfully</h3>
              <p className="text-sm text-muted-foreground">
                {repos.length} repositories available for deployment
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={saveDismissal}>
              <X className="h-4 w-4" />
            </Button>
            <Button asChild variant="default" size="sm">
              <Link href="/github-guide">
                Manage GitHub
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show anything if loading or dismissed
  if (isLoading || dismissed) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-slate-100 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Github className="mr-2 h-5 w-5" />
          Connect Your GitHub Account
        </CardTitle>
        <CardDescription>
          Deploy applications directly from your GitHub repositories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="text-sm">
            <p className="mb-2">
              Linking your GitHub account enables you to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Deploy applications directly from your repositories</li>
              <li>Automatically update deployments when you push changes</li>
              <li>Access both public and private repositories</li>
            </ul>
            {/* Add link to GitHub guide */}
            <Button variant="link" size="sm" className="pl-0 mt-2" asChild>
              <Link href="/github-guide">
                Learn more about GitHub integration
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center space-x-2 sm:flex-col sm:items-stretch sm:space-y-2 sm:space-x-0">
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <Github className="h-4 w-4 mr-2" />
              {connecting ? "Connecting..." : "Connect GitHub"}
            </Button>
            <Button variant="outline" size="sm" onClick={saveDismissal}>
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GitHubBanner;
