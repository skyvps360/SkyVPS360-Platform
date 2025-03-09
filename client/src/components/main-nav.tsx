import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { UserCircle, Server, CreditCard, LifeBuoy, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export function MainNav() {
  const { user } = useAuth();

  // Check if GitHub is connected
  const { data: repos = [], isError } = useQuery<any[]>({
    queryKey: ["/api/github/repos"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isGitHubConnected = !isError && repos.length > 0;

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/dashboard">
        <Button variant="ghost" className="flex items-center">
          <Server className="h-4 w-4 mr-2" />
          <span>Servers</span>
        </Button>
      </Link>
      <Link href="/billing">
        <Button variant="ghost" className="flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          <span>Billing</span>
        </Button>
      </Link>
      <Link href="/support">
        <Button variant="ghost" className="flex items-center">
          <LifeBuoy className="h-4 w-4 mr-2" />
          <span>Support</span>
        </Button>
      </Link>
      <Link href="/account">
        <Button variant="ghost" className="flex items-center">
          <UserCircle className="h-4 w-4 mr-2" />
          <span>Account</span>
        </Button>
      </Link>
      <Link href="/github-setup">
        <Button variant="ghost" className="flex items-center">
          <Github className="h-4 w-4 mr-2" />
          <span>GitHub</span>
          {!isGitHubConnected && (
            <Badge variant="outline" className="ml-2 px-1 py-0 h-5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800">
              Setup
            </Badge>
          )}
          {isGitHubConnected && (
            <Badge variant="outline" className="ml-2 px-1 py-0 h-5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800">
              Connected
            </Badge>
          )}
        </Button>
      </Link>
    </nav>
  );
}
