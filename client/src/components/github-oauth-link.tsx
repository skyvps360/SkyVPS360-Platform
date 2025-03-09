import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Github, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function GitHubOAuthLink({ className = "" }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState("");

  useEffect(() => {
    const getAuthUrl = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/github/auth-url");
        if (response && response.url) {
          setAuthUrl(response.url);
        }
      } catch (error) {
        console.error("Failed to get GitHub auth URL:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getAuthUrl();
  }, []);

  return (
    <Button
      href={authUrl}
      component="a"
      className={className}
      target="_self"
      disabled={isLoading || !authUrl}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Github className="h-4 w-4 mr-2" />
      )}
      Connect GitHub Account
    </Button>
  );
}
