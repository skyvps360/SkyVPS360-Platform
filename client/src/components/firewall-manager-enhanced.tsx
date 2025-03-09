import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmFirewallAction } from "@/components/confirm-firewall-action";
import { Shield, ArrowRight, Plus, Trash2, AlertTriangle, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define FirewallRule interface to match the server implementation
interface FirewallRule {
  protocol: 'tcp' | 'udp' | 'icmp';
  ports: string;
  sources?: {
    addresses?: string[];
  };
  destinations?: {
    addresses?: string[];
  };
}

// Define Firewall interface to match the server implementation
interface Firewall {
  id?: string;
  name: string;
  status?: 'waiting' | 'active' | 'errored';
  created_at?: string;
  droplet_ids: number[];
  inbound_rules: FirewallRule[];
  outbound_rules: FirewallRule[];
}

// Common ports with descriptions
const commonPorts = [
  { port: "22", description: "SSH" },
  { port: "80", description: "HTTP" },
  { port: "443", description: "HTTPS" },
  { port: "3306", description: "MySQL" },
  { port: "5432", description: "PostgreSQL" },
  { port: "27017", description: "MongoDB" },
  { port: "6379", description: "Redis" },
  { port: "25565", description: "Minecraft" },
  { port: "8080", description: "Alternative HTTP" },
  { port: "2222", description: "Alternative SSH" },
];

// Port range examples for users
const portRangeExamples = [
  { range: "1000-2000", description: "Allow ports 1000 through 2000" },
  { range: "8000-8999", description: "Common development ports" },
  { range: "80,443", description: "HTTP and HTTPS" },
];

// Default rules
const defaultInboundRules: FirewallRule[] = [
  { protocol: 'tcp', ports: '22', sources: { addresses: ['0.0.0.0/0', '::/0'] } },
  { protocol: 'tcp', ports: '80', sources: { addresses: ['0.0.0.0/0', '::/0'] } },
  { protocol: 'tcp', ports: '443', sources: { addresses: ['0.0.0.0/0', '::/0'] } }
];

const defaultOutboundRules: FirewallRule[] = [
  { protocol: 'tcp', ports: 'all', destinations: { addresses: ['0.0.0.0/0', '::/0'] } },
  { protocol: 'udp', ports: 'all', destinations: { addresses: ['0.0.0.0/0', '::/0'] } }
];

// Helper to format port description
const getPortDescription = (port: string) => {
  const commonPort = commonPorts.find(p => p.port === port);
  return commonPort ? `${port} (${commonPort.description})` : port;
};

// Helper to validate port range format
const isValidPortRange = (portRange: string): boolean => {
  // Allow 'all' as a special value
  if (portRange === 'all') return true;
  
  // Allow comma-separated list of port numbers or ranges
  const parts = portRange.split(',').map(part => part.trim());
  
  for (const part of parts) {
    // Check if it's a range (e.g., 1000-2000)
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      
      // Ensure both start and end are valid port numbers
      if (isNaN(start) || isNaN(end) || 
          start < 1 || start > 65535 || 
          end < 1 || end > 65535 || 
          start >= end) {
        return false;
      }
    } 
    // Check if it's a single port number
    else {
      const port = Number(part);
      if (isNaN(port) || port < 1 || port > 65535) {
        return false;
      }
    }
  }
  
  return true;
};

interface FirewallManagerProps {
  serverId: number;
}

export default function FirewallManager({ serverId }: FirewallManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inbound");
  // Start with assumption that no firewall exists, will be corrected if one is found
  const [noFirewall, setNoFirewall] = useState(true);
  const [deleteRuleConfirmOpen, setDeleteRuleConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<{ rule_type: 'inbound' | 'outbound', rule: FirewallRule } | null>(null);
  const [newRule, setNewRule] = useState<{
    protocol: 'tcp' | 'udp' | 'icmp';
    ports: string;
    sourceAddresses: string;
  }>({
    protocol: 'tcp',
    ports: '',
    sourceAddresses: '0.0.0.0/0,::/0', // Default to allow from anywhere
  });

  // Track refresh button clicks to prevent abuse
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("Never");
  
  // Handle manual refresh with rate limiting
  const handleManualRefresh = () => {
    const now = new Date();
    
    // Check if this is the first refresh or more than 5 minutes have passed
    if (!lastRefreshTime || (now.getTime() - lastRefreshTime.getTime() > 5 * 60 * 1000)) {
      // Reset counter if it's been more than 5 minutes
      setRefreshCount(1);
    } else {
      // Increment the counter
      const newCount = refreshCount + 1;
      setRefreshCount(newCount);
      
      // Check if limit reached (3 clicks within 5 minutes)
      if (newCount >= 3) {
        setRefreshDisabled(true);
        
        // Enable refresh after 5 minutes
        setTimeout(() => {
          setRefreshDisabled(false);
          setRefreshCount(0);
        }, 5 * 60 * 1000);
      }
    }
    
    // Update the last refresh time
    setLastRefreshTime(now);
    
    // Format a human-readable last updated time
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastUpdated(timeString);
    
    // If we know there's no firewall, temporarily enable fetching for just this one refresh
    if (noFirewall) {
      setShouldFetch(true);
      
      // Perform the refresh
      refetch().then(() => {
        // Disable fetching again after this refresh if there's still no firewall
        if (noFirewall) {
          setShouldFetch(false);
        }
      });
    } else {
      // Normal refresh if firewall exists
      refetch();
    }
  };

  // Completely disable auto-fetching for this component
  // We'll manage refetching manually to prevent excessive API calls
  const [shouldFetch, setShouldFetch] = useState(true);
  
  // Fetch current firewall configuration
  const { data: firewall, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/servers', serverId, 'firewall'],
    queryFn: () => {
      if (!shouldFetch) {
        // Return mock data when fetching is disabled
        return Promise.resolve({
          name: `firewall-server-${serverId}`,
          droplet_ids: [],
          inbound_rules: [],
          outbound_rules: []
        });
      }
      
      return fetch(`/api/servers/${serverId}/firewall`)
        .then(res => {
          // Update the last refresh time regardless of outcome
          const now = new Date();
          setLastRefreshTime(now);
          
          // Format a human-readable last updated time
          const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastUpdated(timeString);
          
          if (res.status === 404) {
            // Firewall doesn't exist yet
            setNoFirewall(true);
            // Disable future auto-fetching when no firewall exists
            setShouldFetch(false);
            
            // Return mock data
            return {
              name: `firewall-server-${serverId}`,
              droplet_ids: [],
              inbound_rules: [],
              outbound_rules: []
            };
          }
          
          if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
          }
          
          // We found a firewall, update the state
          setNoFirewall(false);
          return res.json();
        });
    },
    // Completely disable auto-refetching
    refetchOnWindowFocus: false,
    refetchInterval: false,  // No automatic polling
    staleTime: Infinity,     // Data never goes stale automatically
    retry: false,            // Don't retry on errors
    retryOnMount: false,     // Don't retry when component mounts
    gcTime: 0                // Don't cache errors
  });
  
  // Effect to refetch when component mounts
  useEffect(() => {
    refetch();
  }, [serverId, refetch]);

  // Create a new firewall with default rules
  const createFirewallMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(
        'PUT',
        `/api/servers/${serverId}/firewall`,
        {
          inbound_rules: defaultInboundRules, // Use default rules for better security
          outbound_rules: defaultOutboundRules
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Firewall enabled",
        description: "Firewall has been created with default security rules for SSH, HTTP, and HTTPS.",
      });
      // Update state
      setNoFirewall(false);
      // Re-enable fetching since we now have a firewall
      setShouldFetch(true);
      // Update both this component and any parent components
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId, 'firewall'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create firewall",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle creating a firewall with default rules
  const handleCreateFirewall = () => {
    // Log the action for debugging
    console.log("Creating new firewall with default rules");
    createFirewallMutation.mutate();
  };

  // Add a new rule mutation
  const addRuleMutation = useMutation({
    mutationFn: async (data: { rule_type: 'inbound' | 'outbound', rule: FirewallRule }) => {
      return apiRequest(
        'POST',
        `/api/servers/${serverId}/firewall/rules`,
        data
      );
    },
    onSuccess: () => {
      toast({
        title: "Rule added",
        description: "Firewall rule added successfully",
      });
      // Refresh both this component and parent components
      refetch();
      resetNewRuleForm();
      // Invalidate all firewall-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId, 'firewall'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add rule",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete a rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (data: { rule_type: 'inbound' | 'outbound', rule: FirewallRule }) => {
      return apiRequest(
        'DELETE',
        `/api/servers/${serverId}/firewall/rules`,
        data
      );
    },
    onSuccess: () => {
      toast({
        title: "Rule deleted",
        description: "Firewall rule deleted successfully",
      });
      // Refresh both this component and parent components
      refetch();
      // Invalidate all firewall-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId, 'firewall'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete rule",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update entire firewall mutation
  const updateFirewallMutation = useMutation({
    mutationFn: async (data: { inbound_rules: FirewallRule[], outbound_rules: FirewallRule[] }) => {
      return apiRequest(
        'PUT',
        `/api/servers/${serverId}/firewall`,
        data
      );
    },
    onSuccess: () => {
      toast({
        title: "Firewall updated",
        description: "Firewall configuration updated successfully",
      });
      // Refresh both this component and parent components
      refetch();
      // Invalidate all firewall-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId, 'firewall'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update firewall",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Reset the new rule form
  const resetNewRuleForm = () => {
    setNewRule({
      protocol: 'tcp',
      ports: '',
      sourceAddresses: '0.0.0.0/0,::/0',
    });
  };

  // Handle adding a new rule
  const handleAddRule = () => {
    // Validate inputs
    if (!newRule.ports) {
      toast({
        title: "Invalid port",
        description: "Please specify a port or port range",
        variant: "destructive"
      });
      return;
    }

    // Validate port range format
    if (!isValidPortRange(newRule.ports)) {
      toast({
        title: "Invalid port format",
        description: "Please enter a valid port (1-65535) or port range (e.g., 8000-9000) or comma-separated list (e.g., 80,443)",
        variant: "destructive"
      });
      return;
    }

    // Create rule object
    const rule: FirewallRule = {
      protocol: newRule.protocol,
      ports: newRule.ports,
    };

    // Add sources or destinations based on rule type
    if (newRule.sourceAddresses.trim()) {
      const addresses = newRule.sourceAddresses.split(',').map(addr => addr.trim()).filter(Boolean);
      
      if (activeTab === 'inbound') {
        rule.sources = { addresses };
      } else {
        rule.destinations = { addresses };
      }
    }

    // Submit to API
    addRuleMutation.mutate({
      rule_type: activeTab as 'inbound' | 'outbound',
      rule
    });
  };

  // Handle when user clicks delete rule button
  const prepareDeleteRule = (ruleType: 'inbound' | 'outbound', rule: FirewallRule) => {
    setRuleToDelete({ rule_type: ruleType, rule });
    setDeleteRuleConfirmOpen(true);
  };

  // Handle actual deletion after confirmation
  const handleConfirmDeleteRule = () => {
    if (ruleToDelete) {
      // We already have the correct format with rule_type
      deleteRuleMutation.mutate({
        rule_type: ruleToDelete.rule_type,
        rule: ruleToDelete.rule
      });
      setDeleteRuleConfirmOpen(false);
      setRuleToDelete(null);
    }
  };

  // Render a rule item with delete option
  const renderRuleItem = (rule: FirewallRule, ruleType: 'inbound' | 'outbound') => {
    const addressText = ruleType === 'inbound' 
      ? rule.sources?.addresses?.join(', ') || 'Any'
      : rule.destinations?.addresses?.join(', ') || 'Any';
    
    return (
      <div key={`${rule.protocol}-${rule.ports}-${addressText}`} className="flex justify-between items-center p-3 bg-muted rounded-lg mb-2">
        <div className="flex-1">
          <div className="font-medium">
            {rule.protocol.toUpperCase()} {getPortDescription(rule.ports)}
          </div>
          <div className="text-sm text-muted-foreground flex items-center mt-1">
            <span>{ruleType === 'inbound' ? 'From' : 'To'}: {addressText}</span>
            {ruleType === 'inbound' && (
              <>
                <ArrowRight className="h-3 w-3 mx-1" />
                <span>This Server</span>
              </>
            )}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => prepareDeleteRule(ruleType, rule)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    );
  };

  // Add predefined rules
  const addPredefinedRule = (portNumber: string, protocol: 'tcp' | 'udp' = 'tcp') => {
    setNewRule({
      ...newRule,
      protocol,
      ports: portNumber
    });
  };

  // Render quick add buttons for common ports
  const renderQuickAdd = () => (
    <div className="flex flex-wrap gap-2 mt-4 mb-2">
      <span className="text-sm text-muted-foreground py-1">Quick add:</span>
      {commonPorts.slice(0, 5).map(({ port, description }) => (
        <Button 
          key={port} 
          variant="outline" 
          size="sm" 
          onClick={() => addPredefinedRule(port)}
        >
          {description} ({port})
        </Button>
      ))}
    </div>
  );

  // Render port range examples as tooltips
  const renderPortRangeHelp = () => (
    <div className="flex items-center mt-1 mb-4">
      <Info className="h-4 w-4 mr-1 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        Examples: 
        <TooltipProvider>
          {portRangeExamples.map((example, index) => (
            <span key={example.range} className="ml-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs underline"
                    onClick={() => setNewRule({...newRule, ports: example.range})}
                  >
                    {example.range}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{example.description}</p>
                </TooltipContent>
              </Tooltip>
              {index < portRangeExamples.length - 1 && ", "}
            </span>
          ))}
        </TooltipProvider>
      </span>
    </div>
  );

  if (isLoading) {
    return <div className="p-4 text-center">Loading firewall configuration...</div>;
  }

  if (noFirewall) {
    return (
      <div className="p-4 text-center space-y-3 border border-dashed rounded-lg bg-muted/10">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
        <h3 className="text-base font-semibold">No Firewall Configured</h3>
        <p className="text-sm text-muted-foreground">
          This server does not have a firewall enabled. You should enable a firewall and add rules
          to protect your server from unauthorized access.
        </p>
        <Button 
          onClick={handleCreateFirewall} 
          className="mt-2" 
          disabled={createFirewallMutation.isPending}
        >
          <Shield className="h-4 w-4 mr-2" />
          {createFirewallMutation.isPending ? "Enabling..." : "Enable Firewall"}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          This will create a firewall with default rules for SSH, HTTP, and HTTPS.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold">Firewall Configuration</h3>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdated}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={refreshDisabled || isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2v6h-6"></path>
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                    <path d="M3 12a9 9 0 0 0 6 8.5l2-5.5"></path>
                  </svg>
                  Refresh
                </>
              )}
            </Button>
          </div>
          {refreshDisabled && (
            <span className="text-xs text-muted-foreground text-red-500">
              Refresh limit reached. Try again in 5 minutes.
            </span>
          )}
          <span className="text-xs text-gray-500">
            Auto-refresh: {noFirewall ? 'Disabled' : 'Every 1 minute'}
          </span>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="inbound">Inbound Rules</TabsTrigger>
          <TabsTrigger value="outbound">Outbound Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbound" className="space-y-4 mt-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Inbound Rules</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Control which traffic can reach your server from the internet.
            </p>
            
            {!firewall?.inbound_rules || firewall.inbound_rules.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No inbound rules configured. Your server may not be accessible.
              </div>
            ) : (
              <div className="space-y-2">
                {firewall.inbound_rules.map((rule: FirewallRule) => renderRuleItem(rule, 'inbound'))}
              </div>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Inbound Rule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Protocol</label>
                    <Select 
                      value={newRule.protocol} 
                      onValueChange={(value) => setNewRule({...newRule, protocol: value as 'tcp' | 'udp' | 'icmp'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                        <SelectItem value="icmp">ICMP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Port(s)</label>
                    <Input 
                      placeholder="e.g. 80 or 8000-9000" 
                      value={newRule.ports}
                      onChange={(e) => setNewRule({...newRule, ports: e.target.value})}
                    />
                    {renderPortRangeHelp()}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source IP Addresses</label>
                  <Input 
                    placeholder="Comma-separated list of IPs or CIDR ranges" 
                    value={newRule.sourceAddresses}
                    onChange={(e) => setNewRule({...newRule, sourceAddresses: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: 0.0.0.0/0,::/0 (all IPv4 and IPv6 addresses)
                  </p>
                </div>
              </div>
              {renderQuickAdd()}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={resetNewRuleForm}
              >
                Reset
              </Button>
              <Button 
                onClick={handleAddRule}
                disabled={addRuleMutation.isPending || !newRule.ports}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addRuleMutation.isPending ? "Adding..." : "Add Rule"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="outbound" className="space-y-4 mt-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Outbound Rules</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Control where your server can send traffic to.
            </p>
            
            {!firewall?.outbound_rules || firewall.outbound_rules.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No outbound rules configured. Your server may not be able to connect to external services.
              </div>
            ) : (
              <div className="space-y-2">
                {firewall.outbound_rules.map((rule: FirewallRule) => renderRuleItem(rule, 'outbound'))}
              </div>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Outbound Rule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Protocol</label>
                    <Select 
                      value={newRule.protocol} 
                      onValueChange={(value) => setNewRule({...newRule, protocol: value as 'tcp' | 'udp' | 'icmp'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                        <SelectItem value="icmp">ICMP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Port(s)</label>
                    <Input 
                      placeholder="e.g. 80 or 8000-9000 or 'all'" 
                      value={newRule.ports}
                      onChange={(e) => setNewRule({...newRule, ports: e.target.value})}
                    />
                    {renderPortRangeHelp()}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination IP Addresses</label>
                  <Input 
                    placeholder="Comma-separated list of IPs or CIDR ranges" 
                    value={newRule.sourceAddresses}
                    onChange={(e) => setNewRule({...newRule, sourceAddresses: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: 0.0.0.0/0,::/0 (all IPv4 and IPv6 addresses)
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 mb-2">
                <span className="text-sm text-muted-foreground py-1">Quick add:</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setNewRule({...newRule, protocol: 'tcp', ports: 'all'})}
                >
                  All TCP traffic
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setNewRule({...newRule, protocol: 'udp', ports: 'all'})}
                >
                  All UDP traffic
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={resetNewRuleForm}
              >
                Reset
              </Button>
              <Button 
                onClick={handleAddRule}
                disabled={addRuleMutation.isPending || !newRule.ports}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addRuleMutation.isPending ? "Adding..." : "Add Rule"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for Rule Deletion */}
      <ConfirmFirewallAction
        isOpen={deleteRuleConfirmOpen}
        onClose={() => {
          setDeleteRuleConfirmOpen(false);
          setRuleToDelete(null);
        }}
        onConfirm={handleConfirmDeleteRule}
        title="Delete Firewall Rule"
        description={`You are about to delete a ${ruleToDelete?.rule_type || ''} firewall rule for ${ruleToDelete?.rule.protocol || ''} protocol on port(s) ${ruleToDelete?.rule.ports || ''}. This could potentially expose your server to security risks.`}
        confirmationText="I CONFIRM DELETION OF RULES"
        confirmButtonText="Delete Rule"
        confirmButtonVariant="destructive"
      />
    </div>
  );
}