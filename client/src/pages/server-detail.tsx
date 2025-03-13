import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Server as SchemaServer, Volume } from "@/types/schema";
import ServerTerminal from "@/components/server-terminal-real";
import { CloudRackTerminalNotice } from "@/components/cloudrack-terminal-notice";
import NetworkUsage from "@/components/network-usage";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Form for disabling firewall with confirmation text - MOVED INSIDE COMPONENT
const confirmFirewallDisableSchema = z.object({
  confirmationText: z
    .string()
    .refine((val) => val === "I CONFIRM DELETION OF RULES", {
      message: "You must type 'I CONFIRM DELETION OF RULES' exactly to confirm",
    }),
});

type ConfirmFirewallDisableFormValues = z.infer<
  typeof confirmFirewallDisableSchema
>;

interface FirewallRule {
  protocol: "tcp" | "udp" | "icmp";
  ports: string;
  sources?: {
    addresses?: string[];
  };
}

// Common ports with descriptions for quick reference
const commonPortDescriptions: Record<string, string> = {
  "22": "SSH",
  "80": "HTTP",
  "443": "HTTPS",
  "3306": "MySQL",
  "5432": "PostgreSQL",
  "27017": "MongoDB",
  "6379": "Redis",
  "25565": "Minecraft",
  "8080": "Alternative HTTP",
  "2222": "Alternative SSH",
  "21": "FTP",
  "25": "SMTP",
  "53": "DNS",
  "3389": "RDP",
};

// Get friendly name for the port
const getPortDescription = (port: string) => {
  return port === "all"
    ? "All Ports"
    : commonPortDescriptions[port]
      ? `${port} (${commonPortDescriptions[port]})`
      : port.includes("-")
        ? `Port Range ${port}`
        : `Port ${port}`;
};

// ActiveFirewallCheck component to check if a firewall exists
function ActiveFirewallCheck({
  serverId,
  children,
}: {
  serverId: number;
  children: (exists: boolean) => JSX.Element;
}) {
  const {
    data: firewall,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/servers", serverId, "firewall"],
    queryFn: () =>
      fetch(`/api/servers/${serverId}/firewall`).then((res) => {
        if (res.status === 404) {
          return null;
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch firewall`);
        }
        return res.json();
      }),
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refresh every 3 seconds to get updated status
    staleTime: 2000, // Consider data stale after 2 seconds
  });

  // Effect to refetch when the component mounts or when serverId changes
  useEffect(() => {
    refetch();
    // This will make sure firewall status is current whenever we look at it
  }, [serverId, refetch]);

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        Checking Firewall...
      </Button>
    );
  }

  return children(!!firewall);
}

// Active Firewall Rules Component
function ActiveFirewallRules({ serverId }: { serverId: number }) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch current firewall configuration
  const {
    data: firewall,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/servers", serverId, "firewall"],
    queryFn: () =>
      fetch(`/api/servers/${serverId}/firewall`).then((res) => {
        if (res.status === 404) {
          // No firewall exists yet
          return { inbound_rules: [], outbound_rules: [] };
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch firewall rules`);
        }
        return res.json();
      }),
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refresh every 3 seconds to get updated status
    staleTime: 2000, // Consider data stale after 2 seconds
  });

  // Effect to refetch when the component mounts or when serverId changes
  useEffect(() => {
    refetch();
  }, [serverId, refetch]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Loading firewall rules...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-500">Error loading firewall rules.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Please use the "Configure Firewall" button to manage rules.
        </p>
      </div>
    );
  }

  if (error || !firewall) {
    return (
      <div className="p-4 text-center bg-yellow-50 border border-yellow-200 rounded-lg">
        <Shield className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
        <p className="text-sm text-yellow-700">
          No firewall has been created yet
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          Click "Manage Firewall" to create a firewall first
        </p>
      </div>
    );
  }

  if (!firewall.inbound_rules || firewall.inbound_rules.length === 0) {
    return (
      <div className="p-4 text-center bg-yellow-50 border border-yellow-200 rounded-lg">
        <Shield className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
        <p className="text-sm text-yellow-700">No firewall rules configured.</p>
        <p className="text-xs text-yellow-600 mt-1">
          Use "Manage Firewall" to set up protection.
        </p>
      </div>
    );
  }

  // Rules to display (limit to the first few unless expanded)
  const displayRules = isExpanded
    ? firewall.inbound_rules
    : firewall.inbound_rules.slice(0, 3);

  return (
    <div>
      {displayRules.map((rule: FirewallRule, index: number) => (
        <div
          key={`rule-${index}`}
          className="flex justify-between items-center p-2 bg-muted rounded-md mb-2"
        >
          <div className="flex items-center">
            <div className="bg-green-100 text-green-800 p-1 rounded-full mr-3">
              {rule.protocol === "tcp" ? (
                <Globe className="h-4 w-4" />
              ) : rule.protocol === "udp" ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {rule.protocol.toUpperCase()} {getPortDescription(rule.ports)}
              </p>
              <p className="text-xs text-muted-foreground">
                From: {rule.sources?.addresses?.join(", ") || "Any source"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-green-600 bg-green-50">
            <Check className="h-3 w-3 mr-1" /> Allowed
          </Badge>
        </div>
      ))}

      {firewall.inbound_rules.length > 3 && (
        <div className="text-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm"
          >
            {isExpanded
              ? "Show less"
              : `Show ${firewall.inbound_rules.length - 3} more rules`}
          </Button>
        </div>
      )}
    </div>
  );
}

// Map regions to flag emojis
const regionFlags = {
  nyc1: "🇺🇸 New York 1",
  nyc2: "🇺🇸 New York 2",
  sgp1: "🇸🇬 Singapore 1",
  lon1: "🇬🇧 London 1",
  nyc3: "🇺🇸 New York 3",
  ams3: "🇳🇱 Amsterdam 3",
  fra1: "🇩🇪 Frankfurt 1",
  tor1: "🇨🇦 Toronto 1",
  sfo2: "🇺🇸 San Francisco 2",
  blr1: "🇮🇳 Bangalore 1",
  sfo3: "🇺🇸 San Francisco 3",
  syd1: "🇦🇺 Sydney 1",
};

// Add function to get OS display name
const getOSDisplayName = (application: string | null) => {
  if (!application) return "Ubuntu 22.04";
  const appParts = application.split(" on ");
  if (appParts.length > 1) {
    return appParts[0];
  }
  return application;
};

export default function ServerDetailPage() {
  const { pathId } = useParams();
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [ipv6Enabled, setIpv6Enabled] = useState(false);
  const [confirmIpv6Enable, setConfirmIpv6Enable] = useState(false);

  // Form for disabling firewall with confirmation text - MOVED INSIDE COMPONENT
  const disableFirewallForm = useForm<ConfirmFirewallDisableFormValues>({
    resolver: zodResolver(confirmFirewallDisableSchema),
    defaultValues: {
      confirmationText: "",
    },
  });

  // Add mutation for snapshot management
  const createSnapshotMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/servers/${serverId}/snapshots`);
    },
    onSuccess: () => {
      toast({
        title: "Creating Snapshot",
        description: "Your server snapshot is being created. This may take several minutes.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/snapshots`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create snapshot",
        variant: "destructive",
      });
    },
  });

  const restoreSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: string) => {
      return await apiRequest("POST", `/api/servers/${serverId}/snapshots/${snapshotId}/restore`);
    },
    onSuccess: () => {
      toast({
        title: "Restoring Server",
        description: "Your server is being restored from the snapshot. This may take several minutes.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore snapshot",
        variant: "destructive",
      });
    },
  });

  const deleteSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: string) => {
      return await apiRequest("DELETE", `/api/servers/${serverId}/snapshots/${snapshotId}`);
    },
    onSuccess: () => {
      toast({
        title: "Snapshot Deleted",
        description: "The snapshot has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/snapshots`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete snapshot",
        variant: "destructive",
      });
    },
  });

  // Add query to fetch snapshots
  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: [`/api/servers/${serverId}/snapshots`],
    queryFn: async () => {
      const response = await fetch(`/api/servers/${serverId}/snapshots`);
      if (!response.ok) {
        throw new Error("Failed to fetch snapshots");
      }
      return response.json();
    },
    enabled: !isNaN(serverId) && !!user && !!server,
  });

  // Debug info
  console.log("ServerDetailPage Params:", pathId);
  console.log("URL Path:", window.location.pathname);

  // Parse the server ID from the URL - FIXED parsing logic
  let serverId: number = -1;
  if (pathId) {
    try {
      serverId = parseInt(pathId);
      console.log("Parsed server ID:", serverId); // Add more debug info
      if (isNaN(serverId) || serverId <= 0) {
        console.error("Invalid server ID in URL:", pathId);
        serverId = -1;
      }
    } catch (err) {
      console.error("Error parsing server ID:", err);
      serverId = -1;
    }
  } else {
    // Extract ID directly from path if pathId is undefined
    const match = window.location.pathname.match(/\/servers\/(\d+)/);
    if (match && match[1]) {
      serverId = parseInt(match[1]);
      console.log("Extracted server ID from path:", serverId);
    } else {
      console.error("Could not extract server ID from path:", window.location.pathname);
    }
  }

  // Parse URL to check for tab query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "overview");

  // Fetch server details directly with a simplified approach
  const {
    data: server,
    isLoading: serverLoading,
    error: serverError,
    refetch: refetchServer,
  } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    queryFn: async () => {
      if (serverId <= 0) {
        throw new Error("Invalid server ID: " + serverId);
      }
      const response = await fetch(`/api/servers/${serverId}`);
      if (!response.ok) {
        throw new Error(`Error fetching server: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: serverId > 0 && !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 10000, // Shorter stale time for more responsive UI
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Log any server fetch errors to help debug
  useEffect(() => {
    if (serverError) {
      console.error("Error fetching server:", serverError);
      toast({
        title: "Error loading server",
        description: (serverError as Error).message,
        variant: "destructive",
      });
    }
  }, [serverError, toast]);

  // Fetch volumes attached to this server
  const { data: volumes = [], isLoading: volumesLoading } = useQuery<Volume[]>({
    queryKey: [`/api/servers/${serverId}/volumes`],
    queryFn: async () => {
      const response = await fetch(`/api/servers/${serverId}/volumes`);
      if (!response.ok) {
        throw new Error(`Error fetching volumes: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !isNaN(serverId) && !!user && !!server,
  });

  // Server action mutations
  const rebootServerMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        "POST",
        `/api/servers/${serverId}/actions/reboot`,
      );
    },
    onSuccess: () => {
      toast({
        title: "Server Rebooting",
        description: "The server is now rebooting.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reboot server",
        variant: "destructive",
      });
    },
  });

  const powerActionMutation = useMutation({
    mutationFn: async (action: "start" | "stop") => {
      return await apiRequest(
        "POST",
        `/api/servers/${serverId}/actions/${action}`,
      );
    },
    onSuccess: (_data, variables) => {
      toast({
        title: variables === "start" ? "Server Starting" : "Server Stopping",
        description: `The server is now ${variables === "start" ? "starting up" : "shutting down"}.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform power action",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      // CloudRack integration for password update
      return await apiRequest("PATCH", `/api/servers/${serverId}/password`, {
        password,
        cloudrack_integration: true, // Flag to indicate we're using CloudRack API for this
      });
    },
    onSuccess: () => {
      toast({
        title: "Password Updated via CloudRack",
        description:
          "Your server password has been updated through the CloudRack API and will be effective immediately.",
      });
      setIsEditingPassword(false);
      setNewPassword("");

      // Refresh the server details to update the UI
      queryClient.invalidateQueries({
        queryKey: [`/api/servers/${serverId}/details`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "CloudRack API Error",
        description:
          error.message ||
          "Failed to update password through CloudRack API. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleIPv6Mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest("PATCH", `/api/servers/${serverId}/ipv6`, {
        enabled,
      });
    },
    onSuccess: (_, variables) => {
      setIpv6Enabled(variables);
      toast({
        title: variables ? "IPv6 Enabled" : "IPv6 Disabled",
        description: `IPv6 is now ${variables ? "enabled" : "disabled"} for this server.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update IPv6 settings",
        variant: "destructive",
      });
    },
  });

  const deleteServerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/servers/${serverId}`);
    },
    onSuccess: () => {
      toast({
        title: "Server Deleted",
        description: "Your server has been successfully deleted.",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete server",
        variant: "destructive",
      });
    },
  });

  // Set IPv6 status when server data is loaded
  useEffect(() => {
    if (server) {
      setIpv6Enabled(!!server.ipv6Address);
    }
  }, [server]);

  if (serverLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading server details...</span>
        </div>
      </div>
    );
  }

  if (!server) {
    // Add console logging to help diagnose the issue
    console.log("Server data not available:", {
      serverError,
      serverId,
      userLoggedIn: !!user,
    });

    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Server not found</h2>
          <p className="text-muted-foreground mt-2">
            {serverError
              ? `Error: ${(serverError as Error).message}`
              : "The requested server could not be found or you don't have permission to access it."}
          </p>
          <div className="mt-6 space-y-4">
            <Button className="mx-2" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
            <div className="flex flex-col gap-2 items-center mt-2">
              <Button
                variant="outline"
                className="mx-2"
                onClick={() => {
                  // Refetch both user and server data
                  refetchUser();
                  refetchServer(); // Use the refetch function directly

                  toast({
                    title: "Refreshing data",
                    description: "Attempting to reload server information...",
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <p className="text-xs text-muted-foreground">
                If problems persist, try refreshing the page or logging out and
                back in
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const specs = server.specs || { memory: 1024, vcpus: 1, disk: 25 };
  // Servers are always running by default when created
  // Set isRunning to true by default, only show Power On if explicitly powered off
  const isRunning = server.status !== "off";

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">{server.name}</h1>
        {/* Simple VPS status badge */}


        <Badge
          variant={server.status === "active" ? "default" : "secondary"}
          className={server.status === "restoring" ? "animate-pulse" : ""}
        >
          {server.status === "active" && (
            <span className="h-2 w-2 mr-1 rounded-full bg-green-500 inline-block" />
          )}
          {server.status === "off" && (
            <span className="h-2 w-2 mr-1 rounded-full bg-gray-500 inline-block" />
          )}
          {server.status === "restoring" && (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          )}
          {server.status === "active"
            ? "Running"
            : server.status === "off"
              ? "Offline"
              : server.status === "restoring"
                ? "Restoring"
                : server.status}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <ServerIcon className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="volumes">
            <HardDrive className="h-4 w-4 mr-2" />
            Volumes
          </TabsTrigger>

          <TabsTrigger value="networking">
            <Globe className="h-4 w-4 mr-2" />
            Networking
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <BarChart className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="console">
            <Terminal className="h-4 w-4 mr-2" />
            Console
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Server Specifications */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Server Specifications</CardTitle>
                <CardDescription>
                  Technical details about your server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Hardware
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Memory</span>
                        <span className="font-medium">
                          {specs.memory / 1024}GB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>vCPUs</span>
                        <span className="font-medium">{specs.vcpus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disk</span>
                        <span className="font-medium">{specs.disk}GB SSD</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Region</span>
                        <span className="font-medium">
                          {regionFlags[server.region] || server.region}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size</span>
                        <span className="font-medium">{server.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Application</span>
                        <span className="font-medium">
                          {server.application || "No Application"}
                        </span>
                      </div>
                      {/* Display creation date if available */}
                      <div className="flex justify-between">
                        <span>Created</span>
                        <span className="font-medium">
                          {server.createdAt
                            ? new Date(server.createdAt).toLocaleString()
                            : new Date().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Authentication
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Root Password</p>
                      <p className="text-xs text-muted-foreground">
                        Used for console access
                      </p>
                    </div>

                    {isEditingPassword ? (
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="w-48"
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            updatePasswordMutation.mutate(newPassword)
                          }
                          disabled={
                            updatePasswordMutation.isPending || !newPassword
                          }
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingPassword(false);
                            setNewPassword("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingPassword(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Volume Summary */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Storage
                  </h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p>
                        {volumes.length} Volume{volumes.length !== 1 ? "s" : ""}{" "}
                        Attached
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {volumes.reduce((total, v) => total + v.size, 0)}GB
                        additional storage
                      </p>
                    </div>
                    {/* Manage Volumes button removed as requested */}
                  </div>
                </div>
                <Separator className="my-4" />

                {/* Snapshot Management */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Snapshots</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p>{snapshots.length} Snapshot{snapshots.length !== 1 ? 's' : ''} Available</p>
                        <p className="text-xs text-muted-foreground">Snapshots are complete images of your server</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createSnapshotMutation.mutate()}
                        disabled={createSnapshotMutation.isPending || server.status !== 'active'}
                      >
                        <CopyPlus className="h-4 w-4 mr-2" />
                        Create Snapshot
                      </Button>
                    </div>

                    {snapshotsLoading ? (
                      <div className="flex justify-center p-4">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Loading snapshots...</span>
                      </div>
                    ) : snapshots.length > 0 ? (
                      <div className="space-y-2">
                        {snapshots.map((snapshot: any) => (
                          <div key={snapshot.id} className="flex justify-between items-center p-2 bg-muted rounded-md">
                            <div>
                              <p className="text-sm font-medium">{snapshot.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Created {new Date(snapshot.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to restore this snapshot? Your server will be restarted.")) {
                                    restoreSnapshotMutation.mutate(snapshot.id);
                                  }
                                }}
                                disabled={restoreSnapshotMutation.isPending}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this snapshot?")) {
                                    deleteSnapshotMutation.mutate(snapshot.id);
                                  }
                                }}
                                disabled={deleteSnapshotMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-muted p-4 rounded-md text-center">
                        <p className="text-sm text-muted-foreground">No snapshots available</p>
                      </div>
                    )}

                    {server.status !== 'active' && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 inline mr-2" />
                        Server must be powered on to create snapshots
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Server Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Server Controls</CardTitle>
                <CardDescription>Manage your server state</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="default"
                    onClick={() =>
                      powerActionMutation.mutate(isRunning ? "stop" : "start")
                    }
                    disabled={powerActionMutation.isPending}
                    className={`w-full ${isRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                  >
                    {isRunning ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-2" />
                        Power Off
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-2" />
                        Power On
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => rebootServerMutation.mutate()}
                  disabled={!isRunning || rebootServerMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reboot
                </Button>

                <Link href={`/terminal/${serverId}`}>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    disabled={!isRunning || !server.ipAddress}
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fullscreen Terminal
                  </Button>
                </Link>

                <Separator />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Server
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Server</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this server? This action
                        cannot be undone and all data on the server will be
                        permanently lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteServerMutation.mutate()}
                        disabled={deleteServerMutation.isPending}
                      >
                        {deleteServerMutation.isPending
                          ? "Deleting..."
                          : "Delete Server"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Volumes Tab */}
        <TabsContent value="volumes">
          <Card>
            <CardHeader>
              <CardTitle>Volume Management</CardTitle>
              <CardDescription>
                Attach additional block storage to your server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VolumeManager serverId={serverId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Networking Tab */}
        <TabsContent value="networking">
          <Card>
            <CardHeader>
              <CardTitle>Network Configuration</CardTitle>
              <CardDescription>
                Manage your server's network settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Network Configuration
                </h3>
                <div className="space-y-4">
                  {/* IPv4 Configuration */}
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        IPv4 Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Public IPv4 Address
                          </span>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {server.ipAddress}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  server.ipAddress || "",
                                );
                                toast({
                                  title: "Copied",
                                  description: "IP address copied to clipboard",
                                });
                              }}
                            >
                              <CopyPlus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">
                            IPv4 Gateway
                          </span>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {server.ipAddress
                                ? server.ipAddress
                                  .split(".")
                                  .slice(0, 3)
                                  .join(".") + ".1"
                                : "Unavailable"}
                            </code>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          IPv4 Subnet Mask
                        </span>
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            255.255.255.0
                          </code>
                          <span className="ml-2 text-xs text-muted-foreground">
                            (CIDR: /24)
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>
                          Your server has a static public IPv4 address assigned
                          to the eth0 interface.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* IPv6 Configuration */}
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          IPv6 Configuration
                        </div>
                        {ipv6Enabled ? (
                          <div className="text-xs text-green-600 font-medium flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            IPv6 Enabled
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmIpv6Enable(true)}
                            disabled={toggleIPv6Mutation.isPending}
                          >
                            <Wifi className="h-4 w-4 mr-2" />
                            Enable IPv6
                          </Button>
                        )}

                        <Dialog
                          open={confirmIpv6Enable}
                          onOpenChange={setConfirmIpv6Enable}
                        >
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Enable IPv6</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 text-sm">
                              <p className="mb-2">
                                <strong>Warning:</strong> Enabling IPv6 cannot
                                be reversed.
                              </p>
                              <p>
                                Once you enable IPv6 for this server, it cannot
                                be disabled. IPv6 will remain enabled for the
                                life of this server.
                              </p>
                              <p className="mt-2">
                                Are you sure you want to enable IPv6?
                              </p>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setConfirmIpv6Enable(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="default"
                                onClick={() => {
                                  toggleIPv6Mutation.mutate(true);
                                  setConfirmIpv6Enable(false);
                                }}
                              >
                                Enable IPv6
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      {ipv6Enabled && server.ipv6Address ? (
                        <>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Public IPv6 Address
                              </span>
                              <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-sm overflow-x-auto max-w-full">
                                  {server.ipv6Address}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      server.ipv6Address || "",
                                    );
                                    toast({
                                      title: "Copied",
                                      description:
                                        "IPv6 address copied to clipboard",
                                    });
                                  }}
                                >
                                  <CopyPlus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-xs text-muted-foreground">
                              IPv6 Prefix Length
                            </span>
                            <div>
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                /64
                              </code>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            <p>
                              Your server has a static public IPv6 address
                              assigned. IPv6 connectivity is available for all
                              outgoing and incoming connections.
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm py-2">
                          {toggleIPv6Mutation.isPending ? (
                            <p>Updating IPv6 configuration...</p>
                          ) : (
                            <p>
                              IPv6 is currently disabled. Enable IPv6 to get a
                              public IPv6 address assigned to your server.
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Firewall</h3>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-medium">
                        Firewall Configuration
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Configure security rules for your server
                      </p>
                    </div>
                    {/* Create/Manage Firewall Button Group */}
                    <div className="flex gap-2">
                      <ActiveFirewallCheck serverId={serverId}>
                        {(firewallExists: boolean) => (
                          <>
                            {!firewallExists ? (
                              // Create Empty Firewall Button (no default rules)
                              <Button
                                variant="default"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // Create a firewall with no rules by default
                                    const response = await apiRequest(
                                      "PUT",
                                      `/api/servers/${serverId}/firewall`,
                                      {
                                        inbound_rules: [],
                                        outbound_rules: [],
                                      },
                                    );

                                    toast({
                                      title: "Firewall Created",
                                      description:
                                        "Firewall has been enabled with no rules. Add rules for protection.",
                                    });

                                    // Refresh the firewall display
                                    queryClient.invalidateQueries({
                                      queryKey: [
                                        "/api/servers",
                                        serverId,
                                        "firewall",
                                      ],
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Failed to create firewall",
                                      description:
                                        error instanceof Error
                                          ? error.message
                                          : "An unknown error occurred",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Enable Firewall
                              </Button>
                            ) : (
                              // Delete Firewall Button with Confirmation
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Shield className="h-4 w-4 mr-2" />
                                    Disable Firewall
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="text-destructive">
                                      Disable Firewall Protection
                                    </DialogTitle>
                                    <div className="py-2">
                                      <strong>Warning:</strong> This will delete
                                      all firewall rules and leave your server
                                      exposed to all network traffic. This is a
                                      significant security risk.
                                    </div>
                                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md my-3 text-sm">
                                      To confirm, please type{" "}
                                      <span className="font-mono font-bold">
                                        I CONFIRM DELETION OF RULES
                                      </span>{" "}
                                      in the field below.
                                    </div>
                                  </DialogHeader>

                                  <Form {...disableFirewallForm}>
                                    <form
                                      onSubmit={disableFirewallForm.handleSubmit(
                                        async (data) => {
                                          try {
                                            await apiRequest(
                                              "PUT",
                                              `/api/servers/${serverId}/firewall?action=disable`,
                                            );
                                            toast({
                                              title: "Firewall Disabled",
                                              description:
                                                "All firewall rules have been removed.",
                                            });
                                            // Refresh the firewall display
                                            queryClient.invalidateQueries({
                                              queryKey: [
                                                `/api/servers/${serverId}/firewall`,
                                              ],
                                            });
                                            disableFirewallForm.reset(); // Reset the form
                                          } catch (error) {
                                            toast({
                                              title:
                                                "Failed to disable firewall",
                                              description:
                                                error instanceof Error
                                                  ? error.message
                                                  : "An unknown error occurred",
                                            });
                                          }
                                        },
                                      )}
                                    >
                                      <FormField
                                        control={disableFirewallForm.control}
                                        name="confirmationText"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>
                                              Confirmation Text
                                            </FormLabel>
                                            <FormControl>
                                              <Input
                                                placeholder="Type the confirmation phrase"
                                                {...field}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <div className="flex justify-end gap-2 mt-4">
                                        <DialogClose asChild>
                                          <Button
                                            variant="outline"
                                            type="button"
                                          >
                                            Cancel
                                          </Button>
                                        </DialogClose>
                                        <Button
                                          variant="destructive"
                                          type="submit"
                                        >
                                          Disable Firewall
                                        </Button>
                                      </div>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                            )}
                          </>
                        )}
                      </ActiveFirewallCheck>

                      {/* Open Firewall Manager Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Shield className="h-4 w-4 mr-2" />
                            Manage Firewall Rules
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl h-[90vh] max-h-[700px] overflow-y-auto">
                          <DialogHeader className="mb-4">
                            <DialogTitle>Firewall Rules Manager</DialogTitle>
                            <DialogDescription>
                              Add or remove rules to control network traffic to
                              and from your server
                            </DialogDescription>
                          </DialogHeader>
                          <FirewallManager serverId={serverId} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  {/* Active rules section - simplified display */}
                  <div className="space-y-3">
                    {/* Fetch and display actual rules from API */}
                    <ActiveFirewallRules serverId={serverId} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    First, enable the firewall by clicking "Enable Firewall",
                    then use "Manage Firewall Rules" to add protection rules for
                    your server. The firewall starts with no rules by default.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 gap-6">
            {/* Server Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Monitor your server's resource usage and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServerMonitoring serverId={serverId} />
              </CardContent>
            </Card>
            {/* Network Performance & Bandwidth Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle>Network Performance</CardTitle>
                <CardDescription>
                  Network throughput and bandwidth usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Network Performance Info */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                    Network Throughput
                  </p>
                  <p className="text-blue-600 dark:text-blue-400">
                    Your server includes{" "}
                    {server.size.includes("g-") ? "1Gbps" : "500Mbps"} network
                    throughput. Outbound data transfer is limited to{" "}
                    {server.specs?.disk
                      ? Math.max(1, Math.floor(server.specs.disk / 25))
                      : 1}
                    TB per month.
                  </p>
                </div>
                {/* Network Usage Monitoring */}
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                    Bandwidth Monitoring
                  </h3>
                  <NetworkUsage serverId={serverId} size={server.size} />
                </div>
                {/* Bandwidth Details Link */}
                <div className="flex justify-end">
                  <Link href={`/servers/${serverId}/bandwidth-details`}>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Detailed Bandwidth Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Console Tab */}
        <TabsContent value="console">
          <Card>
            <CardHeader>
              <CardTitle>Server Console</CardTitle>
              <CardDescription>
                Access your server's command line interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* CloudRack Terminal Notice */}
              <CloudRackTerminalNotice />
              {/* Server Access Section - Password Authentication */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Remote Access</h3>
                <p className="text-sm mb-4">
                  Connect to your server using SSH with password authentication:
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm flex justify-between items-center">
                  <code>ssh root@{server.ipAddress}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `ssh root@${server.ipAddress}`,
                      );
                      toast({
                        title: "Copied",
                        description: "SSH command copied to clipboard",
                      });
                    }}
                  >
                    <CopyPlus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  You will be prompted for the root password you set during
                  server creation.
                </p>
                {/* Password Authentication */}
                <div className="mt-4">
                  <div className="bg-card border rounded-md p-4">
                    <h4 className="text-sm font-medium mb-2">
                      Password Authentication
                    </h4>

                    <p className="text-xs text-muted-foreground mb-2">
                      {isEditingPassword
                        ? "Enter a new root password for your server."
                        : "Your root password is used to access your server via SSH or the web terminal. Keep it secure."}
                    </p>

                    {isEditingPassword ? (
                      <div className="flex items-center gap-2 mt-3">
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="w-48"
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            updatePasswordMutation.mutate(newPassword)
                          }
                          disabled={
                            updatePasswordMutation.isPending || !newPassword
                          }
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingPassword(false);
                            setNewPassword("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingPassword(true)}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        {server.rootPassUpdated
                          ? "Change Password"
                          : "Set Root Password"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {/* Terminal Section */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-medium mb-4">
                  Interactive Terminal
                </h3>

                <div className="bg-muted/50 rounded-md p-3 mb-4">
                  <div className="flex items-center text-amber-600">
                    <Terminal className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Terminal Access</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This terminal uses secure password authentication with your
                    root password. Full Linux command support with no external
                    clients needed.
                  </p>
                </div>

                <div className="w-full">
                  <ServerTerminal
                    serverId={server.id}
                    serverName={server.name}
                    ipAddress={server.ipAddress || "unknown"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}