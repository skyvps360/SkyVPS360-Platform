import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  RefreshCcw, 
  User as UserIcon, 
  Server as ServerIcon, 
  MessageCircle, 
  ArrowLeft, 
  Timer,
  RotateCcw 
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Define interfaces for our data types
interface AdminUser {
  id: number;
  username: string;
  balance: number;
  isAdmin: boolean;
  apiKey: string | null;
}

interface AdminTicket {
  id: number;
  userId: number;
  serverId: number | null;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  originalDropletId: string | null;
}

interface AdminServer {
  id: number;
  userId: number;
  name: string;
  dropletId: string;
  region: string;
  size: string;
  status: string;
  ipAddress: string | null;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [ticketSearchTerm, setTicketSearchTerm] = useState("");
  const [serverSearchTerm, setServerSearchTerm] = useState("");
  
  // Auto-refresh functionality
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const intervalRef = useRef<number | null>(null);

  // Clear interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Set up auto-refresh based on interval selection
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefreshInterval) {
      const interval = window.setInterval(() => {
        if (activeTab === "users") {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        } else if (activeTab === "tickets") {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
        } else if (activeTab === "servers") {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/servers"] });
        }
      }, autoRefreshInterval * 60 * 1000); // Convert minutes to milliseconds
      
      intervalRef.current = interval;
    }
  }, [autoRefreshInterval, activeTab, queryClient]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Redirect if not admin
  if (!user?.isAdmin) {
    return <Redirect to="/dashboard" />;
  }
  
  // Main return with consistent styling

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      return response.json() as Promise<AdminUser[]>;
    },
  });

  // Fetch all tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/admin/tickets"],
    queryFn: async () => {
      const response = await fetch("/api/admin/tickets", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      
      return response.json() as Promise<AdminTicket[]>;
    },
  });

  // Fetch all servers
  const { data: servers = [], isLoading: serversLoading } = useQuery({
    queryKey: ["/api/admin/servers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/servers", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch servers");
      }
      
      return response.json() as Promise<AdminServer[]>;
    },
  });

  // Update ticket status mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status, priority }: { id: number; status?: string; priority?: string }) => {
      const response = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status, priority }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update ticket");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      toast({
        title: "Ticket updated",
        description: "The ticket has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete ticket mutation (admin only)
  const deleteTicketMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tickets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      toast({
        title: "Ticket deleted",
        description: "The ticket has been permanently deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticket",
        variant: "destructive",
      });
    },
  });

  // Filter users by search term
  const filteredUsers = users.filter((user) => 
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Filter tickets by search term
  const filteredTickets = tickets.filter((ticket) => 
    ticket.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase())
  );

  // Filter servers by search term
  const filteredServers = servers.filter((server) => 
    server.name.toLowerCase().includes(serverSearchTerm.toLowerCase())
  );

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <Select
            value={autoRefreshInterval?.toString() || "0"}
            onValueChange={(value) => {
              const interval = parseInt(value, 10);
              setAutoRefreshInterval(interval > 0 ? interval : null);
              if (interval > 0) {
                toast({
                  title: "Auto-refresh enabled",
                  description: `Data will refresh every ${value} minutes`,
                });
              } else {
                setAutoRefreshInterval(null);
                toast({
                  title: "Auto-refresh disabled",
                  description: "Data will not refresh automatically",
                });
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Auto-refresh..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Disabled</SelectItem>
              <SelectItem value="1">Every 1 minute</SelectItem>
              <SelectItem value="5">Every 5 minutes</SelectItem>
              <SelectItem value="10">Every 10 minutes</SelectItem>
              <SelectItem value="15">Every 15 minutes</SelectItem>
            </SelectContent>
          </Select>
          
          {autoRefreshInterval && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setAutoRefreshInterval(null);
                toast({
                  title: "Auto-refresh disabled",
                  description: "Data will no longer refresh automatically",
                });
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="users" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="users">
            <UserIcon className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <MessageCircle className="h-4 w-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="servers">
            <ServerIcon className="h-4 w-4 mr-2" />
            Servers
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all users in the system</CardDescription>
              <div className="flex items-center mt-2">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="ml-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <Table>
                  <TableCaption>List of all registered users</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No users found</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>${(user.balance / 100).toFixed(2)}</TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <Badge variant="default">Admin</Badge>
                            ) : (
                              <Badge variant="outline">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Support Ticket Management</CardTitle>
              <CardDescription>Handle customer support requests</CardDescription>
              <div className="flex items-center mt-2">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tickets..." 
                  value={ticketSearchTerm}
                  onChange={(e) => setTicketSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="ml-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] })}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="text-center py-4">Loading tickets...</div>
              ) : (
                <Table>
                  <TableCaption>List of all support tickets</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No tickets found</TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>{ticket.id}</TableCell>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.status === "open"
                                  ? "default"
                                  : ticket.status === "pending"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.priority === "high"
                                  ? "destructive"
                                  : ticket.priority === "normal"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{ticket.userId}</TableCell>
                          <TableCell className="space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const newStatus = ticket.status === "open" ? "closed" : "open";
                                updateTicketMutation.mutate({ id: ticket.id, status: newStatus });
                              }}
                            >
                              {ticket.status === "open" ? "Close" : "Reopen"}
                            </Button>
                            <Button size="sm" variant="default">
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ticket #${ticket.id}? This action cannot be undone.`)) {
                                  deleteTicketMutation.mutate(ticket.id);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Servers Tab */}
        <TabsContent value="servers">
          <Card>
            <CardHeader>
              <CardTitle>Server Management</CardTitle>
              <CardDescription>Monitor all provisioned servers</CardDescription>
              <div className="flex items-center mt-2">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search servers..." 
                  value={serverSearchTerm}
                  onChange={(e) => setServerSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="ml-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/servers"] })}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {serversLoading ? (
                <div className="text-center py-4">Loading servers...</div>
              ) : (
                <Table>
                  <TableCaption>List of all provisioned servers</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">No servers found</TableCell>
                      </TableRow>
                    ) : (
                      filteredServers.map((server) => (
                        <TableRow key={server.id}>
                          <TableCell>{server.id}</TableCell>
                          <TableCell>{server.name}</TableCell>
                          <TableCell>{server.region}</TableCell>
                          <TableCell>{server.size}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                server.status === "active"
                                  ? "default"
                                  : server.status === "new"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {server.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{server.userId}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}