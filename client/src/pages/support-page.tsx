import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Send, Edit2, Check, X, HardDrive, Trash2, CheckCircle } from "lucide-react";
import { SupportTicket, SupportMessage, Server, Volume, insertTicketSchema } from "@/types/schema";
import { Link, useLocation, useParams } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Map regions to flag emojis
const regionFlags: { [key: string]: string } = {
  'nyc1': '🇺🇸 New York',
  'nyc2': '🇺🇸 New York',
  'nyc3': '🇺🇸 New York',
  'sfo3': '🇺🇸 San Francisco',
  'sfo2': '🇺🇸 San Francisco',
  'ams3': '🇳🇱 Amsterdam',
  'sgp1': '🇸🇬 Singapore',
  'lon1': '🇬🇧 London',
  'tor1': '🇨🇦 Toronto',
  'blr1': '🇮🇳 Bangalore',
  'syd1': '🇦🇺 Sydney',
};

interface TicketDetails {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

export default function SupportPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const params = useParams();
  const [location, setLocation] = useLocation();
  const [selectedTicket, setSelectedTicket] = React.useState<number | null>(null);
  const [editingMessage, setEditingMessage] = React.useState<number | null>(null);
  const [editText, setEditText] = React.useState("");

  // Handle the case when accessing via /support/:id directly
  React.useEffect(() => {
    if (params && params.id) {
      const ticketId = parseInt(params.id);
      if (!isNaN(ticketId)) {
        setSelectedTicket(ticketId);
      }
    }
  }, [params]);

  const { data: tickets = [], isLoading: loadingTickets } = useQuery<SupportTicket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: selectedTicketData, isLoading: loadingTicketDetails } = useQuery<TicketDetails>({
    queryKey: ["/api/tickets", selectedTicket],
    enabled: selectedTicket !== null,
    queryFn: async () => {
      if (!selectedTicket) throw new Error("No ticket selected");
      const response = await apiRequest("GET", `/api/tickets/${selectedTicket}`);
      return response.json();
    }
  });

  // Get user's servers for ticket creation
  const { data: servers = [] } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
  });

  // Add query for volumes
  const { data: volumesMap = {} } = useQuery<Record<number, Volume[]>>({
    queryKey: ["/api/volumes"],
    queryFn: async () => {
      const serverVolumes: Record<number, Volume[]> = {};
      for (const server of servers || []) {
        const response = await apiRequest("GET", `/api/servers/${server.id}/volumes`);
        const volumes = await response.json();
        serverVolumes[server.id] = volumes;
      }
      return serverVolumes;
    },
    enabled: !!servers?.length,
  });


  const createTicketForm = useForm({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      subject: "",
      message: "",
      priority: "low",
      serverId: undefined as number | undefined,
    },
  });

  const onSubmit = (data: any) => {
    createTicketMutation.mutate({
      ...data,
      serverId: data.serverId ? Number(data.serverId) : undefined
    });
  };

  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/tickets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Success",
        description: "Support ticket created successfully",
      });
      createTicketForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const response = await apiRequest("PATCH", `/api/tickets/${ticketId}/status`, {
        status: "closed"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", selectedTicket] });
      toast({
        title: "Success",
        description: "Ticket closed successfully",
      });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      await apiRequest("DELETE", `/api/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setSelectedTicket(null); // Reset selection after deletion
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
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

  const replyForm = useForm({
    defaultValues: {
      message: "",
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      if (!selectedTicket) return;
      const response = await apiRequest(
        "POST",
        `/api/tickets/${selectedTicket}/messages`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", selectedTicket] });
      replyForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, message }: { messageId: number; message: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/tickets/${selectedTicket}/messages/${messageId}`,
        { message }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", selectedTicket] });
      setEditingMessage(null);
      setEditText("");
      toast({
        title: "Success",
        description: "Message updated successfully",
      });
    },
  });

  const canEditMessage = (message: SupportMessage) => {
    // Admins can always edit messages
    if (user?.isAdmin) return true;

    // Regular users can only edit within 10 minutes
    const createdAt = new Date(message.createdAt);
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffInMinutes <= 10;
  };

  if (loadingTickets) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Support</h1>
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
              </DialogHeader>
              <Form {...createTicketForm}>
                <form
                  onSubmit={createTicketForm.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={createTicketForm.control}
                    name="serverId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Server (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a server" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {servers.map((server) => (
                              <SelectItem
                                key={server.id}
                                value={server.id.toString()}
                                className="flex flex-col items-start"
                              >
                                <div className="font-medium">{server.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {regionFlags[server.region] || server.region} - {server.ipAddress}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {server.specs?.memory && `${server.specs.memory / 1024}GB RAM`},
                                  {server.specs?.vcpus && `${server.specs.vcpus} vCPUs`},
                                  {server.specs?.disk && `${server.specs.disk}GB Disk`}
                                </div>
                                {volumesMap[server.id]?.length > 0 && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    <div className="flex items-center gap-1">
                                      <HardDrive className="h-3 w-3" />
                                      Attached Volumes:
                                    </div>
                                    {volumesMap[server.id].map((volume) => (
                                      <div key={volume.id} className="ml-4">
                                        • {volume.name}: {volume.size}GB ({regionFlags[volume.region] || volume.region})
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createTicketForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createTicketForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createTicketForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="w-full"
                  >
                    {createTicketMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Create Ticket
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </nav>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Tickets</h2>
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No tickets yet
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedTicket === ticket.id ? "border-primary" : ""
                    }`}
                  onClick={() => setSelectedTicket(ticket.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge>{ticket.status}</Badge>
                        <Badge variant="outline">{ticket.priority}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Conversation</h2>
            <div className="flex space-x-2">
              {selectedTicketData?.ticket?.status === "open" && (
                <Button
                  variant="outline"
                  onClick={() => selectedTicketData?.ticket && closeTicketMutation.mutate(selectedTicketData.ticket.id)}
                  disabled={closeTicketMutation.isPending}
                >
                  {closeTicketMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Close Ticket
                    </>
                  )}
                </Button>
              )}

              {/* Admin-only delete button */}
              {user?.isAdmin && selectedTicketData?.ticket && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedTicketData?.ticket && window.confirm(`Are you sure you want to delete ticket #${selectedTicketData.ticket.id}? This action cannot be undone.`)) {
                      deleteTicketMutation.mutate(selectedTicketData.ticket.id);
                    }
                  }}
                  disabled={deleteTicketMutation.isPending}
                >
                  {deleteTicketMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Ticket
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          {selectedTicket ? (
            loadingTicketDetails ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </CardContent>
              </Card>
            ) : selectedTicketData && selectedTicketData.ticket ? (
              <div className="space-y-4">
                {/* Server information if available */}
                {selectedTicketData.ticket.serverId && (
                  <Card className="bg-muted/30">
                    <CardContent className="py-4">
                      <h3 className="text-sm font-medium mb-2">Related Server</h3>
                      {servers.filter(s => s.id === selectedTicketData.ticket.serverId).map(server => (
                        <div key={server.id} className="space-y-1">
                          <div className="font-medium">{server.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {regionFlags[server.region] || server.region} - {server.ipAddress || 'No IP'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {server.specs ? (
                              <>
                                {server.specs.memory && `${server.specs.memory / 1024}GB RAM`}
                                {server.specs.vcpus && `, ${server.specs.vcpus} vCPUs`}
                                {server.specs.disk && `, ${server.specs.disk}GB Disk`}
                              </>
                            ) : (
                              `${server.size}`
                            )}
                          </div>
                          {volumesMap[server.id]?.length > 0 && (
                            <div className="text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                Attached Volumes:
                              </div>
                              {volumesMap[server.id].map((volume) => (
                                <div key={volume.id} className="ml-4">
                                  • {volume.name}: {volume.size}GB ({regionFlags[volume.region] || volume.region})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Conversation history */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 border rounded-lg">
                  {selectedTicketData.messages && selectedTicketData.messages.length > 0 ? (
                    selectedTicketData.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex flex-col ${message.userId !== selectedTicketData.ticket.userId
                          ? "items-end"
                          : "items-start"
                          }`}
                      >
                        {/* Message sender identification */}
                        <div className="mb-1 text-xs font-medium px-1">
                          {message.userId !== selectedTicketData.ticket.userId
                            ? "Admin"
                            : "User"}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${message.userId !== selectedTicketData.ticket.userId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                            }`}
                        >
                          {editingMessage === message.id ? (
                            <div className="space-y-2">
                              <Input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="bg-background"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingMessage(null);
                                    setEditText("");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    editMessageMutation.mutate({
                                      messageId: message.id,
                                      message: editText,
                                    })
                                  }
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p>{message.message}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs opacity-70">
                                  {new Date(message.createdAt).toLocaleString()}
                                </p>
                                {((message.userId === selectedTicketData.ticket.userId || user?.isAdmin) &&
                                  canEditMessage(message)) && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        setEditingMessage(message.id);
                                        setEditText(message.message);
                                      }}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No messages in this conversation
                    </div>
                  )}
                </div>

                {/* Reply form */}
                {selectedTicketData.ticket.status === "open" && (
                  <form
                    onSubmit={replyForm.handleSubmit((data) =>
                      replyMutation.mutate(data)
                    )}
                    className="flex gap-2"
                  >
                    <Input
                      {...replyForm.register("message")}
                      placeholder="Type your message..."
                    />
                    <Button
                      type="submit"
                      disabled={replyMutation.isPending}
                      size="icon"
                    >
                      {replyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Could not load ticket details
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a ticket to view the conversation
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}