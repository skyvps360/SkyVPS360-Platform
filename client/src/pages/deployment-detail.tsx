import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
  Github,
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Terminal,
  Settings,
  BarChart,
  Clock,
  RefreshCw,
  Loader2,
  Home,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HardDrive,
  Globe,
  Cpu
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";

export default function DeploymentDetailPage() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRedeploy, setIsRedeploy] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Extract deployment ID from the URL or query params
  const deploymentId = new URLSearchParams(location.split('?')[1]).get('id');

  // Get deployment details
  const { data: deployment, isLoading, error } = useQuery({
    queryKey: [`/api/github/deployments/${deploymentId}`],
    queryFn: async () => {
      if (!deploymentId) throw new Error("Deployment ID is required");
      return await apiRequest("GET", `/api/github/deployments/${deploymentId}`);
    },
    enabled: !!deploymentId
  });

  // Get deployment logs
  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: [`/api/github/deployments/${deploymentId}/logs`],
    queryFn: async () => {
      if (!deploymentId) throw new Error("Deployment ID is required");
      return await apiRequest("GET", `/api/github/deployments/${deploymentId}/logs`);
    },
    enabled: !!deploymentId
  });

  const handleRedeploy = async () => {
    try {
      setIsRedeploy(true);
      await apiRequest("POST", `/api/github/deployments/${deploymentId}/redeploy`);

      toast({
        title: "Redeployment started",
        description: "Your application is being redeployed",
      });

      // Refresh the deployment details
      queryClient.invalidateQueries({ queryKey: [`/api/github/deployments/${deploymentId}`] });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsRedeploy(false);
    }
  };

  const handleRestart = async () => {
    try {
      setIsRestarting(true);
      await apiRequest("POST", `/api/github/deployments/${deploymentId}/restart`);

      toast({
        title: "Restart initiated",
        description: "Your application is restarting",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsRestarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/deployments">Deployments</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Skeleton className="h-4 w-20" />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load deployment details.
            {error ? ` ${(error as Error).message}` : ''}
            <div className="mt-2">
              <Button variant="outline" asChild>
                <Link href="/deployments">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Deployments
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (deployment.status) {
      case 'active': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'deploying': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'stopped': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default: return null;
    }
  };

  const getStatusText = () => {
    switch (deployment.status) {
      case 'active': return "Active - Running normally";
      case 'deploying': return "Deployment in progress";
      case 'failed': return "Deployment failed";
      case 'stopped': return "Application stopped";
      default: return "Unknown status";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">
                <Home className="h-3.5 w-3.5 mr-1" />
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/deployments">
                <Github className="h-3.5 w-3.5 mr-1" />
                Deployments
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {deployment.name}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center">
            {getStatusIcon()}
            <span className="ml-2">{deployment.name}</span>
          </h1>
          <p className="text-muted-foreground">
            {getStatusText()}
          </p>
        </div>
        {deployment.url && deployment.status === 'active' && (
          <Button variant="outline" asChild>
            <a href={deployment.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Application
            </a>
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Repository Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-sm font-medium">Repository:</div>
                  <div className="text-sm col-span-2 flex items-center">
                    <Github className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span>{deployment.repository}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-sm font-medium">Branch:</div>
                  <div className="text-sm col-span-2 flex items-center">
                    <GitBranch className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span>{deployment.branch}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-sm font-medium">Created:</div>
                  <div className="text-sm col-span-2 text-muted-foreground">
                    {format(new Date(deployment.createdAt), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-sm font-medium">Last Deployed:</div>
                  <div className="text-sm col-span-2 text-muted-foreground">
                    {format(new Date(deployment.lastDeployedAt), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex space-x-2 w-full">
                  <Button
                    onClick={handleRedeploy}
                    className="flex-1"
                    disabled={isRedeploy}
                  >
                    {isRedeploy ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Redeploy
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resource Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-sm font-medium">Region:</div>
                  <div className="text-sm col-span-2 flex items-center">
                    <Globe className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span>{deployment.region}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-sm font-medium">Size:</div>
                  <div className="text-sm col-span-2 flex items-center">
                    <HardDrive className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span>{deployment.size}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-sm font-medium">Status:</div>
                  <div className="text-sm col-span-2">
                    <Badge
                      variant={deployment.status === 'active' ? "outline" : "secondary"}
                      className={deployment.status === 'active' ? "text-green-500 bg-green-50 border-green-200" : ""}
                    >
                      {deployment.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex space-x-2 w-full">
                  <Button
                    variant="outline"
                    onClick={handleRestart}
                    className="flex-1"
                    disabled={isRestarting}
                  >
                    {isRestarting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Restart App
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Environment Variables Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Environment Variables</CardTitle>
              <CardDescription>Configured environment variables for this application</CardDescription>
            </CardHeader>
            <CardContent>
              {deployment.envVars && Object.keys(deployment.envVars).length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 font-medium text-sm">Name</th>
                        <th className="text-left p-2 font-medium text-sm">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(deployment.envVars).map(([key, value]) => (
                        <tr key={key} className="border-t">
                          <td className="p-2 text-sm font-mono">{key}</td>
                          <td className="p-2 text-sm font-mono">{value as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No environment variables configured.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Deployment Logs</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No logs available for this deployment.
                </div>
              ) : (
                <div className="bg-black rounded-md p-4 text-green-400 font-mono text-sm h-[400px] overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent >

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Settings</CardTitle>
              <CardDescription>Configure your deployment settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Danger Zone</h3>
                  <div className="border border-red-200 dark:border-red-900 rounded-md">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Delete this deployment</p>
                        <p className="text-sm text-muted-foreground">
                          This will permanently delete this deployment and all associated resources.
                        </p>
                      </div>
                      <Button variant="destructive">Delete</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >
    </div >
  );
}