import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Github } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "./ui/badge";

export function GitHubButton() {
  const { data: repos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/github/repos"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isConnected = repos.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" asChild>
            <Link href="/account#github">
              <div className="relative">
                <Github className="h-4 w-4" />
                {isConnected && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full" />
                )}
              </div>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isConnected
            ? `GitHub Connected (${repos.length} repos available)`
            : "Connect GitHub Account"
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
