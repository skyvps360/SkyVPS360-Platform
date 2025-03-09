import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod"; // Add this import for Zod validation library
import { Server, insertServerSchema } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ServerCard from "@/components/server-card";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Search, LockKeyhole, Server as ServerIcon, ChevronLeft, ChevronRight, Github } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GitHubBanner } from "@/components/github-banner";
import { GitHubDeployForm } from "@/components/github-deploy-form";

// Fix the duplicate interface declaration - only define it once
interface Region {
  slug: string;
  name: string;
}

interface Size {
  slug: string;
  vcpus: number;
  price_monthly: number;
  processor_type?: 'regular' | 'intel' | 'amd';
}

interface Application {
  slug: string;
  name: string;
  description: string;
  type: string;
  distribution?: string;
}

interface Distribution {
  slug: string;
  name: string;
  description: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  let strength = 0;
  if (password.match(/[a-z]/)) strength += 20;
  if (password.match(/[A-Z]/)) strength += 20;
  if (password.match(/[0-9]/)) strength += 20;
  if (password.match(/[^a-zA-Z0-9]/)) strength += 20;
  if (password.length >= 8) strength += 20;
  // Penalize if ends with special character
  if (password.match(/[^a-zA-Z0-9]$/)) strength = Math.max(0, strength - 20);
  return strength;
}

async function createDigitalOceanApp(values: any) {
  const response = await fetch("https://api.digitalocean.com/v2/apps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DIGITALOCEAN_API_TOKEN}`,
    },
    body: JSON.stringify({
      spec: {
        name: values.name,
        region: values.region,
        size: values.size,
        source: {
          type: "github",
          repo: values.githubRepo,
          branch: "main",
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create DigitalOcean app");
  }

  return response.json();
}

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [processorFilter, setProcessorFilter] = useState<string>("all");
  const [installMode, setInstallMode] = useState<"application" | "distribution" | "github">("application");
  const [currentPage, setCurrentPage] = useState(1);
  const SERVERS_PER_PAGE = 9;

  const { data: servers = [], isLoading } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
  });

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: sizes = [] } = useQuery<Size[]>({
    queryKey: ["/api/sizes"],
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: distributions = [] } = useQuery<Distribution[]>({
    queryKey: ["/api/distributions"],
  });

  const { data: githubRepos = [] } = useQuery<GitHubRepo[]>({
    queryKey: ["/api/github/repos"],
  });

  const form = useForm({
    resolver: zodResolver(
      insertServerSchema.extend({
        name: z.string()
          .min(3, "Server name must be at least 3 characters")
          .max(63, "Server name must be 63 characters or less")
          .refine(
            (value) => /^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$/i.test(value),
            "Server name must be a valid hostname (only letters, numbers, hyphens, and periods allowed. Cannot start or end with hyphens or periods)"
          ),
        auth: z.string().min(8).refine(
          (value) => {
            return value && value.length >= 8 && !value.match(/[^a-zA-Z0-9]$/);
          },
          "Password must be at least 8 characters and not end with a special character"
        ),
        application: z.string().optional().nullable(),
        region: z.string().min(1, "Region is required"),
        size: z.string().min(1, "Size is required"),
      })
    ),
    defaultValues: {
      name: "",
      region: "",
      size: "",
      auth: "",
      application: "",
      githubRepo: "",
    },
    mode: "onChange" // Add this to validate on change
  });

  const filteredServers = servers.filter((server) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      server.name.toLowerCase().includes(searchLower) ||
      (server.ipAddress && server.ipAddress.includes(searchQuery))
    );
  });

  // Calculate pagination
  const totalServers = filteredServers.length;
  const totalPages = Math.max(1, Math.ceil(totalServers / SERVERS_PER_PAGE));

  // Get current page servers
  const paginatedServers = filteredServers.slice(
    (currentPage - 1) * SERVERS_PER_PAGE,
    currentPage * SERVERS_PER_PAGE
  );

  const password = form.watch("auth");
  const passwordStrength = calculatePasswordStrength(password);

  async function onSubmit(values: any) {
    try {
      if (installMode === "github") {
        await createDigitalOceanApp(values);
      } else {
        // Validate required fields before submitting
        if (!values.name || !values.region || !values.size || !values.auth) {
          toast({
            title: "Missing required fields",
            description: "Please fill out all required fields to create a server",
            variant: "destructive",
          });
          return;
        }

        // Log the server data being sent for debugging
        console.log("Creating server with:", {
          name: values.name,
          region: values.region,
          size: values.size,
          application: values.application || null,
          authType: "password"
        });

        const serverData = {
          name: values.name,
          region: values.region,
          size: values.size,
          application: values.application || null,
          auth: {
            type: "password",
            value: values.auth,
          },
        };

        await apiRequest("POST", "/api/servers", serverData);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      setCreateOpen(false);
      form.reset();
      toast({
        title: "Server created",
        description: "Your new server is being provisioned",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/billing">Billing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/support">Support</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {user?.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    Edit Account
                  </Link>
                </DropdownMenuItem>
                {user?.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <GitHubBanner />

        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-3xl font-bold">Your Servers</h2>
            <div className="flex gap-2">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Server
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Server</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                      <div className="mb-3">
                        <Label className="text-sm">Installation Type</Label>
                        <div className="flex items-center justify-between mt-2 p-2 border rounded-md">
                          <Button
                            type="button"
                            variant={installMode === "application" ? "default" : "outline"}
                            onClick={() => setInstallMode("application")}
                            className="w-full"
                          >
                            Application
                          </Button>
                          <Button
                            type="button"
                            variant={installMode === "distribution" ? "default" : "outline"}
                            onClick={() => setInstallMode("distribution")}
                            className="w-full"
                          >
                            Clean OS
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {installMode === "application"
                            ? "Install a pre-configured application on your server."
                            : "Install a clean operating system without any pre-configured applications."
                          }
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Server Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-9" placeholder="e.g., my-server" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                            <p className="text-xs text-muted-foreground">
                              Only letters, numbers, hyphens (-) and periods (.) allowed. Must start and end with a letter or number.
                            </p>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Region</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select region" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {regions.map((region) => (
                                    <SelectItem key={region.slug} value={region.slug}>
                                      {region.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        {installMode === "application" && (
                          <FormField
                            control={form.control}
                            name="application"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel className="text-sm">Application</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    // Ensure we pass the correct application slug to the API
                                    const app = applications.find(a => a.slug === value);
                                    field.onChange(app?.slug || value);
                                  }}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select application" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {applications.map((app) => (
                                      <SelectItem key={app.slug} value={app.slug}>
                                        {app.name}
                                        {app.distribution && (
                                          <span className="text-xs ml-1 text-muted-foreground">
                                            {" "}({distributions.find(d => d.slug === app.distribution)?.name || app.distribution})
                                          </span>
                                        )}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        )}

                        {installMode === "distribution" && (
                          <FormField
                            control={form.control}
                            name="application"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel className="text-sm">Distribution</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select distribution" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {distributions.map((distro) => (
                                      <SelectItem key={distro.slug} value={distro.slug}>
                                        {distro.name}
                                        <span className="text-xs ml-1 text-muted-foreground"> ({distro.description})</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Processor Type Filter */}
                        <div className="col-span-2 mb-2">
                          <Label className="text-sm">Processor Type</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={processorFilter === "all" ? "default" : "outline"}
                              onClick={() => setProcessorFilter("all")}
                              className="text-xs h-8"
                            >
                              All Processors
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={processorFilter === "regular" ? "default" : "outline"}
                              onClick={() => setProcessorFilter("regular")}
                              className="text-xs h-8"
                            >
                              Regular SSD
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={processorFilter === "intel" ? "default" : "outline"}
                              onClick={() => setProcessorFilter("intel")}
                              className="text-xs h-8 bg-gradient-to-r from-blue-600 to-sky-600 text-white hover:from-blue-700 hover:to-sky-700 hover:text-white"
                            >
                              🔷 Intel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={processorFilter === "amd" ? "default" : "outline"}
                              onClick={() => setProcessorFilter("amd")}
                              className="text-xs h-8 bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700 hover:text-white"
                            >
                              🔶 AMD
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Select a processor type to filter available server sizes
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="size"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-sm">Server Size</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select server size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {sizes
                                    .filter(size => processorFilter === "all" ? true : (size.processor_type || 'regular') === processorFilter)
                                    .map((size) => (
                                      <SelectItem key={size.slug} value={size.slug}>
                                        {size.processor_type === 'intel' && '🔷 '}
                                        {size.processor_type === 'amd' && '🔶 '}
                                        {size.memory / 1024}GB RAM, {size.vcpus} vCPUs (${(size.price_monthly / (24 * 30)).toFixed(3)}/hr)
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="auth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Root Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="h-9" />
                            </FormControl>
                            <div className="mt-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs">Password Strength</span>
                                <span className="text-xs">{passwordStrength}%</span>
                              </div>
                              <Progress value={passwordStrength} className="h-1.5" />
                            </div>
                            <FormDescription className="text-xs">
                              This password will be used to access your server via the web terminal.
                            </FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <Button type="submit" className="w-full h-9 text-sm" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                          ) : (
                            <ServerIcon className="h-3 w-3 mr-2" />
                          )}
                          Create Server
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Github className="h-4 w-4 mr-2" />
                    Deploy GitHub App
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Deploy from GitHub</DialogTitle>
                    <DialogDescription>
                      Deploy an application directly from your GitHub repository
                    </DialogDescription>
                  </DialogHeader>
                  <GitHubDeployForm />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search servers by name or IP address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }).map((_, index) => (
                  <Button
                    key={index}
                    variant={currentPage === index + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Server display section */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredServers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No servers found matching your search"
                  : "No servers yet. Create your first server to get started."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedServers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>

            {/* Bottom pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: totalPages }).map((_, index) => (
                    <Button
                      key={index}
                      variant={currentPage === index + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
