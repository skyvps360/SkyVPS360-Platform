import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Github, CheckCircle, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter"; // Make sure we're using wouter here

export default function GitHubGuidePage() {
  // Check if GitHub is connected
  const { data: repos = [], isError } = useQuery<any[]>({
    queryKey: ["/api/github/repos"],
    retry: false,
  });

  const isConnected = !isError && repos.length > 0;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">GitHub Integration Guide</h1>
          <p className="text-muted-foreground mt-1">Learn how to connect and deploy from GitHub repositories</p>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center text-green-500">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>GitHub Connected</span>
            </div>
          ) : (
            <Button asChild>
              <Link href="/account#github">
                <Github className="h-4 w-4 mr-2" />
                Connect GitHub
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with GitHub Integration</CardTitle>
              <CardDescription>Follow these steps to connect and deploy your repositories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-primary/10 rounded-full w-8 h-8 mt-0.5 mr-3">
                    <span className="font-medium">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Connect your GitHub account</h3>
                    <p className="text-sm text-muted-foreground">
                      Navigate to the Account page and click on the GitHub tab. Then click the "Connect GitHub Account" button and authorize the application.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-primary/10 rounded-full w-8 h-8 mt-0.5 mr-3">
                    <span className="font-medium">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Select repositories to deploy</h3>
                    <p className="text-sm text-muted-foreground">
                      After connecting, you'll see a list of your GitHub repositories. You can deploy any repository by clicking the "Deploy Repository" button.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-primary/10 rounded-full w-8 h-8 mt-0.5 mr-3">
                    <span className="font-medium">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Configure deployment settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Select the branch you want to deploy, choose server specifications, and configure any environment variables needed for your application.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-primary/10 rounded-full w-8 h-8 mt-0.5 mr-3">
                    <span className="font-medium">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Deploy your application</h3>
                    <p className="text-sm text-muted-foreground">
                      Click the "Deploy" button to start the deployment process. Your code will be automatically deployed to a new server.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="ml-auto">
                <Link href="/github-setup">
                  Go to GitHub Integration
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Repository Requirements</CardTitle>
              <CardDescription>Make sure your repositories meet these requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <span className="font-medium">Node.js Applications</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Must have a valid package.json file with start script defined.
                  </p>
                </li>
                <li>
                  <span className="font-medium">Docker Applications</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Must have a valid Dockerfile in the root directory.
                  </p>
                </li>
                <li>
                  <span className="font-medium">Static Websites</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    HTML files should be in the root directory or in a directory specified by your configuration.
                  </p>
                </li>
                <li>
                  <span className="font-medium">Framework Detection</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Popular frameworks like React, Vue, and Angular are automatically detected and configured.
                  </p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/github-setup">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub Integration Settings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://docs.github.com/en/actions" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  GitHub Actions Documentation
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>GitHub Connection</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${isConnected ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}>
                    {isConnected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                {isConnected && (
                  <div className="flex items-center justify-between">
                    <span>Available Repositories</span>
                    <span className="font-medium">{repos.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
            {!isConnected && (
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/github-setup">
                    Connect GitHub Account
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
