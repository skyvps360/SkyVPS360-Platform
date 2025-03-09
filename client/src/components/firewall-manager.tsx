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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, ArrowRight, Plus, Trash2, AlertTriangle } from "lucide-react";

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

interface FirewallManagerProps {
  serverId: number;
}

export default function FirewallManager({ serverId }: FirewallManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inbound");
  const [noFirewall, setNoFirewall] = useState(false);
  const [newRule, setNewRule] = useState<{
    protocol: 'tcp' | 'udp' | 'icmp';
    ports: string;
    sourceAddresses: string;
  }>({
    protocol: 'tcp',
    ports: '',
    sourceAddresses: '0.0.0.0/0,::/0', // Default to allow from anywhere
  });

  // Fetch current firewall configuration
  const { data: firewall, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/servers', serverId, 'firewall'],
    queryFn: () => fetch(`/api/servers/${serverId}/firewall`)
      .then(res => {
        if (res.status === 404) {
          // Firewall doesn't exist yet
          setNoFirewall(true);
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
        return res.json();
      }),
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refresh every 3 seconds to get updated status
    staleTime: 2000,       // Consider data stale after 2 seconds
    retry: false           // Don't retry on 404
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
      setNoFirewall(false);
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

  // Handle creating a firewall with no rules
  const handleCreateFirewall = () => {
    // Log the action for debugging
    console.log("Creating new empty firewall");
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
      console.log("Deleting rule:", data);
      return apiRequest(
        'DELETE',
        `/api/servers/${serverId}/firewall/rules`,
        data
      );
    },
    onSuccess: (data) => {
      console.log("Rule deletion successful, response:", data);
      toast({
        title: "Rule deleted",
        description: "Firewall rule deleted successfully",
      });
      // Refresh both this component and parent components
      setTimeout(() => {
        refetch();
        // Invalidate all firewall-related queries to ensure UI updates everywhere
        queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId, 'firewall'] });
      }, 500); // Add a small delay to ensure backend has processed the change
    },
    onError: (error: Error) => {
      console.error("Rule deletion failed:", error);
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

  // Handle deleting a rule
  const handleDeleteRule = (ruleType: 'inbound' | 'outbound', rule: FirewallRule) => {
    deleteRuleMutation.mutate({
      rule_type: ruleType,
      rule
    });
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Firewall Rule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this firewall rule? 
                This will immediately affect network access to your server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleDeleteRule(ruleType, rule)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Rule
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source IP Addresses</label>
                  <Input 
                    placeholder="e.g. 192.168.1.1,10.0.0.0/16" 
                    value={newRule.sourceAddresses}
                    onChange={(e) => setNewRule({...newRule, sourceAddresses: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter comma-separated IPs/CIDR ranges. Use 0.0.0.0/0 for any IPv4, ::/0 for any IPv6.
                  </p>
                </div>
              </div>
              {renderQuickAdd()}
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddRule} disabled={addRuleMutation.isPending} className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="outbound" className="space-y-4 mt-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Outbound Rules</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Control which traffic can leave your server.
            </p>
            
            {!firewall?.outbound_rules || firewall.outbound_rules.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No outbound rules configured. Your server may not be able to reach the internet.
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
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination IP Addresses</label>
                  <Input 
                    placeholder="e.g. 192.168.1.1,10.0.0.0/16" 
                    value={newRule.sourceAddresses}
                    onChange={(e) => setNewRule({...newRule, sourceAddresses: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter comma-separated IPs/CIDR ranges. Use 0.0.0.0/0 for any IPv4, ::/0 for any IPv6.
                  </p>
                </div>
              </div>
              {renderQuickAdd()}
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddRule} disabled={addRuleMutation.isPending} className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}