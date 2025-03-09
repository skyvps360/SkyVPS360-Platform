import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Github, GitBranch, Info } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import { Label } from "@/components/ui/label"; // This import was missing or incorrect

// Add a new interface for app platform regions
interface AppPlatformRegion {
  id: string;
  name: string;
  slug: string;
  available: boolean;
  // These are specific to DigitalOcean App Platform regions
  data_centers: string[];
  default: boolean;
}

const deployFormSchema = z.object({
  repo: z.string().min(1, "Repository is required"),
  branch: z.string().min(1, "Branch is required"),
  region: z.string().min(1, "Region is required"),
  size: z.string().min(1, "Size is required"),
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(63, "Name must be 63 characters or less")
    .refine(
      (value) => /^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$/i.test(value),
      "Name must be a valid hostname (only letters, numbers, hyphens, and periods allowed)"
    ),
  envVars: z.string().optional(),
  deploymentType: z.enum(['static', 'container', 'auto']).default('auto'),
});

interface Size {
  slug: string;
  memory: number;
  vcpus: number;
  price_monthly: number;
}

interface Region {
  slug: string;
  name: string;
}

export const GitHubDeployForm = ({ /* props */ }) => {
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [showEnvVarsDialog, setShowEnvVarsDialog] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const form = useForm<z.infer<typeof deployFormSchema>>({
    resolver: zodResolver(deployFormSchema),
    defaultValues: {
      repo: "",
      branch: "main",
      region: "",
      size: "",
      name: "",
      envVars: "",
      deploymentType: 'auto',
    },
  });

  // Load GitHub repos
  const { data: repos = [], isLoading: isLoadingRepos } = useQuery<any[]>({
    queryKey: ["/api/github/repos"],
  });

  // Load GitHub branches for selected repo
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<string[]>({
    queryKey: [`/api/github/repos/${selectedRepo}/branches`],
    enabled: !!selectedRepo,
    // Mock implementation until API endpoint exists
    queryFn: async () => ["main", "develop", "staging"],
  });

  // Load regions and sizes from API
  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: sizes = [] } = useQuery<Size[]>({
    queryKey: ["/api/sizes"],
  });

  // Load app platform regions (separate from VPS regions)
  const { data: appRegions = [] } = useQuery<AppPlatformRegion[]>({
    queryKey: ["/api/app-platform/regions"],
    // This is a temporary mock implementation until the API endpoint exists
    queryFn: async () => [
      {
        id: "ams",
        slug: "ams",
        name: "Amsterdam, Netherlands",
        available: true,
        data_centers: ["ams3"],
        default: false
      },
      {
        id: "nyc",
        slug: "nyc",
        name: "New York, United States",
        available: true,
        data_centers: ["nyc1", "nyc3"],
        default: true
      },
      {
        id: "fra",
        slug: "fra",
        name: "Frankfurt, Germany",
        available: true,
        data_centers: ["fra1"],
        default: false
      },
      {
        id: "lon",
        slug: "lon",
        name: "London, United Kingdom",
        available: true,
        data_centers: ["lon1"],
        default: false
      },
      {
        id: "sfo",
        slug: "sfo",
        name: "San Francisco, United States",
        available: true,
        data_centers: ["sfo3"],
        default: false
      },
      {
        id: "sgp",
        slug: "sgp",
        name: "Singapore",
        available: true,
        data_centers: ["sgp1"],
        default: false
      }
    ],
  });

  // Load app platform sizes (different from VPS sizes)
  const { data: appSizes = [] } = useQuery<any[]>({
    queryKey: ["/api/app-platform/sizes"],
    // Mock implementation
    queryFn: async () => [
      {
        slug: "basic-xxs",
        name: "Basic XXS",
        cpu: 1,
        memory_bytes: 512 * 1024 * 1024,
        usd_per_month: 5,
        usd_per_second: 0.0000019,
        tier_slug: "basic",
        tier_upgrade_to: "professional-xs",
        included_bandwidth_bytes: 40 * 1024 * 1024 * 1024,
      },
      {
        slug: "basic-xs",
        name: "Basic XS",
        cpu: 1,
        memory_bytes: 1024 * 1024 * 1024,
        usd_per_month: 10,
        usd_per_second: 0.0000038,
        tier_slug: "basic",
        tier_upgrade_to: "professional-xs",
        included_bandwidth_bytes: 80 * 1024 * 1024 * 1024,
      },
      {
        slug: "basic-s",
        name: "Basic S",
        cpu: 1,
        memory_bytes: 2 * 1024 * 1024 * 1024,
        usd_per_month: 18,
        usd_per_second: 0.0000069,
        tier_slug: "basic",
        tier_upgrade_to: "professional-xs",
        included_bandwidth_bytes: 160 * 1024 * 1024 * 1024,
      },
      {
        slug: "professional-xs",
        name: "Professional XS",
        cpu: 2,
        memory_bytes: 4 * 1024 * 1024 * 1024,
        usd_per_month: 40,
        usd_per_second: 0.000015,
        tier_slug: "professional",
        tier_upgrade_to: "professional-s",
        included_bandwidth_bytes: 320 * 1024 * 1024 * 1024,
      }
    ]
  });

  // Handle repo change to populate the app name
  const handleRepoChange = (repoFullName: string) => {
    form.setValue("repo", repoFullName);
    setSelectedRepo(repoFullName);

    // Set a default name based on the repo name
    const repoName = repoFullName.split("/")[1];
    if (repoName) {
      const suggestedName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      form.setValue("name", suggestedName);
    }
  };

  async function onSubmit(values: z.infer<typeof deployFormSchema>) {
    try {
      setIsDeploying(true);

      // Format environment variables if provided
      let envVars = {};
      if (values.envVars) {
        try {
          const lines = values.envVars.split("\n");
          lines.forEach(line => {
            if (line.trim() && line.includes("=")) {
              const [key, ...valueParts] = line.split("=");
              const value = valueParts.join("=");
              envVars[key.trim()] = value.trim();
            }
          });
        } catch (err) {
          console.error("Error parsing env vars:", err);
        }
      }

      // Call API to deploy from GitHub
      await apiRequest("POST", "/api/github/deploy", {
        repo: values.repo,
        branch: values.branch,
        name: values.name,
        region: values.region,
        size: values.size,
        env: envVars
      });

      toast({
        title: "Deployment started",
        description: `Deploying ${values.repo} (${values.branch}) to ${values.name}`,
      });

      // Reset form
      form.reset();

      // Refresh servers list
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      toast({
        title: "Deployment failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  }

  // Add deploymentType state to manage deployment options
  const [deploymentType, setDeploymentType] = useState<'static' | 'container' | 'auto'>('auto');

  // Add a function to format memory size
  const formatMemory = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb}GB` : `${bytes / (1024 * 1024)}MB`;
  };

  // Add a function to format bandwidth
  const formatBandwidth = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1000 ? `${gb / 1000}TB` : `${gb}GB`;
  };

  // Loading state when not connected to GitHub
  if (repos.length === 0 && !isLoadingRepos) {
    return (
      <div className="py-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Github className="w-12 h-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="font-medium">GitHub Not Connected</h3>
            <p className="text-sm text-muted-foreground">
              You need to connect your GitHub account before deploying applications.
            </p>
          </div>
          <Button asChild>
            <Link href="/account#github">Connect GitHub Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="repo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repository</FormLabel>
              <Select
                onValueChange={handleRepoChange}
                defaultValue={field.value}
                disabled={isLoadingRepos}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select repository" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-60">
                  {isLoadingRepos ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading repositories...</span>
                    </div>
                  ) : (
                    repos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.full_name}>
                        {repo.full_name}
                        {repo.private && (
                          <span className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">private</span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="branch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!selectedRepo || isLoadingBranches}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingBranches ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading branches...</span>
                    </div>
                  ) : (
                    branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        <div className="flex items-center">
                          <GitBranch className="h-4 w-4 mr-2" />
                          {branch}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Add deployment type selector */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Deployment Type</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={deploymentType === 'auto' ? 'default' : 'outline'}
              onClick={() => setDeploymentType('auto')}
              className="h-auto py-2 px-3"
            >
              <div className="text-left">
                <div className="font-medium text-sm">Auto-Detect</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Automatically detect project type
                </div>
              </div>
            </Button>
            <Button
              type="button"
              variant={deploymentType === 'static' ? 'default' : 'outline'}
              onClick={() => setDeploymentType('static')}
              className="h-auto py-2 px-3"
            >
              <div className="text-left">
                <div className="font-medium text-sm">Static Site</div>
                <div className="text-xs text-muted-foreground mt-1">
                  HTML, JS, CSS files only
                </div>
              </div>
            </Button>
            <Button
              type="button"
              variant={deploymentType === 'container' ? 'default' : 'outline'}
              onClick={() => setDeploymentType('container')}
              className="h-auto py-2 px-3"
            >
              <div className="text-left">
                <div className="font-medium text-sm">Docker</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Use Dockerfile
                </div>
              </div>
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., my-app" />
              </FormControl>
              <FormDescription className="text-xs">
                This will be used as the hostname and URL for your app.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deployment Region</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deployment region" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {appRegions.map((region) => (
                      <SelectItem key={region.slug} value={region.slug}>
                        {region.name}
                        {region.default && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-blue-800 dark:text-blue-200">Recommended</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  App Platform regions are different from VPS regions. Choose the closest to your users.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compute Resources</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resources" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {appSizes.map((size) => (
                      <SelectItem key={size.slug} value={size.slug}>
                        <div className="flex justify-between w-full">
                          <span>{size.name}</span>
                          <span className="text-muted-foreground">
                            ${size.usd_per_month.toFixed(2)}/mo
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {size.cpu} vCPU, {formatMemory(size.memory_bytes)}, {formatBandwidth(size.included_bandwidth_bytes)} Bandwidth
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Resources allocated to your application.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEnvVarsDialog(true)}
            className="w-full"
          >
            Configure Environment Variables
          </Button>
        </div>

        <Alert className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800">
          <AlertTitle className="flex items-center text-sm font-medium">
            <Info className="h-4 w-4 mr-2" /> Deployment Information
          </AlertTitle>
          <AlertDescription className="text-xs mt-2">
            The system will automatically detect your project type and configure the build process.
            Supported frameworks include Node.js, Python, Docker, Ruby, PHP, and static websites.
          </AlertDescription>
        </Alert>

        <Button
          type="submit"
          className="w-full"
          disabled={isDeploying}
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Github className="h-4 w-4 mr-2" />
              Deploy Application
            </>
          )}
        </Button>

        {/* Add a link to deployments page */}
        <div className="text-center">
          <Button
            variant="link"
            className="text-sm"
            asChild
          >
            <Link href="/deployments">
              View Your Deployments
            </Link>
          </Button>
        </div>
      </form>

      <Dialog open={showEnvVarsDialog} onOpenChange={setShowEnvVarsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Environment Variables</DialogTitle>
            <DialogDescription>
              Add environment variables for your application (one per line, in KEY=VALUE format)
            </DialogDescription>
          </DialogHeader>
          <FormField
            control={form.control}
            name="envVars"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <textarea
                    className="w-full min-h-[200px] p-2 border rounded-md font-mono text-sm"
                    placeholder="DATABASE_URL=postgres://user:password@host:port/dbname
PORT=3000
NODE_ENV=production"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  These will be securely stored and made available to your application at runtime.
                </FormDescription>
              </FormItem>
            )}
          />
          <Button onClick={() => setShowEnvVarsDialog(false)}>Save Variables</Button>
        </DialogContent>
      </Dialog>
    </Form>
  );
}

export default GitHubDeployForm;
