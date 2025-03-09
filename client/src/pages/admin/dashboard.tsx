import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, KeyRound, AlertTriangle, ExternalLink, Download, HardDrive, ShieldAlert, LifeBuoy } from 'lucide-react';
import VolumeManagement from '@/components/admin/volume-management';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  ResponsiveContainer, 
  Bar, 
  Cell, 
  Line, 
  Pie, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  BadgeCheck, 
  BadgeX, 
  Ban, 
  CircleDollarSign, 
  Copy,
  Home,
  Key,
  Laptop, 
  Lock,
  Pencil,
  RefreshCw,
  Server, 
  Settings, 
  ShieldCheck, 
  Ticket, 
  Trash2, 
  Unlock,
  User,
  UserCog,
  Users 
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface AdminUser {
  id: number;
  username: string;
  balance: number;
  isAdmin: boolean;
  apiKey: string | null;
  isSuspended?: boolean;
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

interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

interface IPBan {
  id: number;
  ipAddress: string;
  reason: string;
  createdAt: string;
  expiresAt: string | null;
}

interface AdminVolume {
  id: number;
  userId: number;
  serverId: number | null;
  name: string;
  volumeId: string;
  sizeGb: number;
  region: string;
}

interface VolumeStats {
  totalStorage: number;
  attachedStorage: number;
  unattachedStorage: number;
  volumeCount: number;
  attachedVolumeCount: number;
  unattachedVolumeCount: number;
}

interface AdminStats {
  users: {
    total: number;
    active: number;
    admins: number;
  };
  servers: {
    total: number;
    active: number;
    byRegion: Record<string, number>;
    bySize: Record<string, number>;
  };
  tickets: {
    total: number;
    open: number;
    closed: number;
    critical: number;
  };
  billing: {
    totalDeposits: number;
    totalSpending: number;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editUserBalance, setEditUserBalance] = useState<string>('');
  const [editUserData, setEditUserData] = useState<{
    username: string;
    password: string;
    isAdmin: boolean;
    isSuspended: boolean;
  }>({ username: '', password: '', isAdmin: false, isSuspended: false });
  const [editUserMode, setEditUserMode] = useState<'balance' | 'details'>('balance');
  const [ipBanData, setIpBanData] = useState({ ipAddress: '', reason: '', expiresAt: '' });
  const [ipBanDialogOpen, setIpBanDialogOpen] = useState(false);
  
  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [serverPage, setServerPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [ipBanPage, setIpBanPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [serverSearch, setServerSearch] = useState('');
  const [serverStatusFilter, setServerStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [ipBanSearch, setIpBanSearch] = useState('');

  // Redirect if not an admin
  if (user && !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ShieldCheck className="h-16 w-16 mb-4 text-red-500" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-500">You do not have permission to access the admin dashboard.</p>
      </div>
    );
  }

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      const data = await response.json();
      return data as AdminStats;
    },
    // Refresh data every 5 minutes automatically
    refetchInterval: 5 * 60 * 1000
  });

  // Show toast on error
  React.useEffect(() => {
    if (statsError) {
      toast({
        title: 'Error',
        description: `Failed to load admin stats`,
        variant: 'destructive',
      });
    }
  }, [statsError, toast]);

  // Fetch users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      const data = await response.json();
      return data as AdminUser[];
    }
  });
  
  // Show toast on error
  React.useEffect(() => {
    if (usersError) {
      toast({
        title: 'Error',
        description: `Failed to load users`,
        variant: 'destructive',
      });
    }
  }, [usersError, toast]);

  // Fetch servers
  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ['/api/admin/servers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/servers');
      const data = await response.json();
      return data as AdminServer[];
    }
  });

  // Fetch tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/admin/tickets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/tickets');
      const data = await response.json();
      return data as AdminTicket[];
    }
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/admin/transactions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/transactions');
      const data = await response.json();
      return data as Transaction[];
    }
  });

  // Fetch IP bans
  const { data: ipBans, isLoading: ipBansLoading, refetch: refetchIpBans } = useQuery({
    queryKey: ['/api/admin/ip-bans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/ip-bans');
      const data = await response.json();
      return data as IPBan[];
    }
  });
  
  // Fetch volumes
  const { data: volumes, isLoading: volumesLoading } = useQuery<AdminVolume[]>({
    queryKey: ['/api/admin/volumes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/volumes');
      const data = await response.json();
      return data as AdminVolume[];
    }
  });
  
  // Fetch volume stats
  const { data: volumeStats, isLoading: volumeStatsLoading } = useQuery<VolumeStats>({
    queryKey: ['/api/admin/volume-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/volume-stats');
      const data = await response.json();
      return data as VolumeStats;
    }
  });

  // Update user balance mutation
  const updateUserBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number, amount: number }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/balance`, { amount });
      const data = await response.json();
      return data as AdminUser;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User balance updated successfully',
      });
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update user balance: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Update user details mutation
  const updateUserDetailsMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      username, 
      password, 
      isAdmin,
      isSuspended
    }: { 
      userId: number, 
      username: string, 
      password?: string, 
      isAdmin: boolean,
      isSuspended: boolean
    }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}`, { 
        username, 
        password, 
        isAdmin,
        isSuspended
      });
      const data = await response.json();
      return data as AdminUser;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User details updated successfully',
      });
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update user details: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // CloudRack Terminal Key Cleanup mutation has been removed

  // Create IP ban mutation
  const createIpBanMutation = useMutation({
    mutationFn: async (data: { ipAddress: string, reason: string, expiresAt: string | null }) => {
      const response = await apiRequest('POST', '/api/admin/ip-bans', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'IP address banned successfully',
      });
      setIpBanDialogOpen(false);
      setIpBanData({ ipAddress: '', reason: '', expiresAt: '' });
      refetchIpBans();
    }
  });

  // Remove IP ban mutation
  const removeIpBanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/ip-bans/${id}`);
      return id;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'IP ban removed successfully',
      });
      refetchIpBans();
    }
  });
  
  // Regenerate API key mutation
  const regenerateApiKeyMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/admin/users/${userId}/api-key`);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'API key regenerated successfully',
      });
      
      // Show the new API key in a toast
      toast({
        title: 'New API Key',
        description: (
          <div className="mt-2 p-2 bg-slate-900 text-slate-100 rounded font-mono text-xs break-all">
            {data.apiKey}
          </div>
        ),
        duration: 10000, // Longer duration so user can copy it
      });
      
      // Update user in state with new API key
      if (editingUser) {
        setEditingUser({
          ...editingUser,
          apiKey: data.apiKey
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to regenerate API key: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Delete server mutation
  const queryClient = useQueryClient();
  const deleteServerMutation = useMutation({
    mutationFn: async (serverId: number) => {
      await apiRequest('DELETE', `/api/servers/${serverId}`);
      return serverId;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Server deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/servers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete server: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Reboot server mutation
  const rebootServerMutation = useMutation({
    mutationFn: async (serverId: number) => {
      await apiRequest('POST', `/api/servers/${serverId}/actions/reboot`);
      return serverId;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Server reboot initiated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/servers'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to reboot server: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Update ticket status mutation
  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/tickets/${ticketId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Ticket status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update ticket status: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const chartData = stats ? Object.entries(stats.servers.byRegion).map(([name, value]) => ({
    name,
    value,
  })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const renderPieChart = (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  // Prepare data for server status chart
  const serverStatusData = stats ? [
    { name: 'Active', value: stats.servers.active },
    { name: 'Inactive', value: stats.servers.total - stats.servers.active },
  ] : [];

  const renderServerStatusChart = (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={serverStatusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          <Cell fill="#4CAF50" />
          <Cell fill="#F44336" />
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="h-8 w-8 mr-2" />
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview" className="flex items-center">
            <Laptop className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="servers" className="flex items-center">
            <Server className="h-4 w-4 mr-2" />
            Servers
          </TabsTrigger>
          <TabsTrigger value="volumes" className="flex items-center">
            <HardDrive className="h-4 w-4 mr-2" />
            Volumes
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center">
            <CircleDollarSign className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center">
            <Ticket className="h-4 w-4 mr-2" />
            Support
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Ban className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {statsLoading ? (
            <div className="text-center py-8">Loading statistics...</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.users.admins} admins, {stats.users.total - stats.users.admins} regular users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Server className="h-4 w-4 mr-2" />
                    Active Servers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.servers.active}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.servers.active} of {stats.servers.total} servers online
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Ticket className="h-4 w-4 mr-2" />
                    Open Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.tickets.open}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.tickets.critical} critical issues
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <CircleDollarSign className="h-4 w-4 mr-2" />
                      Total Revenue
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        refetchStats();
                        toast({
                          title: "Refreshing Revenue Data",
                          description: "Updating financial statistics...",
                        });
                      }} 
                      className="h-8 w-8"
                      title="Refresh revenue data"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="lucide lucide-refresh-cw"
                      >
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                        <path d="M21 3v5h-5"></path>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                        <path d="M3 21v-5h5"></path>
                      </svg>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.billing.totalDeposits.toFixed(2)} USD</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${stats.billing.totalSpending.toFixed(2)} USD in spending
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Auto-updates every 5 minutes
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Servers by Region</CardTitle>
                  <CardDescription>Distribution of servers across regions</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderPieChart}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Server Status</CardTitle>
                  <CardDescription>Active vs Inactive servers</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderServerStatusChart}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-red-500">Failed to load statistics</div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all user accounts on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search input for users */}
              <div className="mb-4">
                <Input 
                  placeholder="Search users by username..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1); // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {usersLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : users ? (
                <div>
                  <Table>
                    <TableCaption>List of all registered users on the platform</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Suspended</TableHead>
                        <TableHead>API Key</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter(user => user.username.toLowerCase().includes(userSearch.toLowerCase()))
                        .slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE)
                        .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            <CurrencyDisplay amount={user.balance} showPrefix={true} />
                          </TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <BadgeCheck className="h-5 w-5 text-green-500" />
                            ) : (
                              <BadgeX className="h-5 w-5 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            {user.isSuspended ? (
                              <div title="Account Suspended">
                                <Lock className="h-5 w-5 text-red-500" />
                              </div>
                            ) : (
                              <div title="Account Active">
                                <BadgeCheck className="h-5 w-5 text-green-500" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.apiKey ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono truncate max-w-[140px]">
                                  {user.apiKey.substring(0, 12)}...
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    navigator.clipboard.writeText(user.apiKey!);
                                    toast({
                                      title: "Copied",
                                      description: "API key copied to clipboard",
                                    });
                                  }}
                                  title="Copy API key"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not Set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditUserBalance((user.balance / 100).toString());
                                  setEditUserMode('balance');
                                  // Initialize user data for the details form
                                  setEditUserData({
                                    username: user.username,
                                    password: '',
                                    isAdmin: user.isAdmin,
                                    isSuspended: user.isSuspended || false
                                  });
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              
                              {!user.isAdmin && (
                                <Button 
                                  variant={user.isSuspended ? "default" : "destructive"} 
                                  size="sm"
                                  onClick={() => {
                                    // Quick suspend/unsuspend without opening dialog
                                    updateUserDetailsMutation.mutate({
                                      userId: user.id,
                                      username: user.username,
                                      isAdmin: user.isAdmin,
                                      isSuspended: !user.isSuspended
                                    });
                                  }}
                                >
                                  {user.isSuspended ? (
                                    <>
                                      <Unlock className="h-4 w-4 mr-1" />
                                      Unsuspend
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-4 w-4 mr-1" />
                                      Suspend
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination for users */}
                  {users.filter(user => user.username.toLowerCase().includes(userSearch.toLowerCase())).length > 0 && (
                    <div className="flex items-center justify-center space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                        disabled={userPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {userPage} of {Math.ceil(users.filter(user => 
                          user.username.toLowerCase().includes(userSearch.toLowerCase())
                        ).length / ITEMS_PER_PAGE)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserPage(prev => 
                          Math.min(prev + 1, Math.ceil(users.filter(user => 
                            user.username.toLowerCase().includes(userSearch.toLowerCase())
                          ).length / ITEMS_PER_PAGE))
                        )}
                        disabled={userPage >= Math.ceil(users.filter(user => 
                          user.username.toLowerCase().includes(userSearch.toLowerCase())
                        ).length / ITEMS_PER_PAGE)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-red-500">Failed to load users</div>
              )}
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          {editingUser && (
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Edit User: {editingUser.username}
                  </DialogTitle>
                  <DialogDescription>
                    Update user account settings and permissions
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs value={editUserMode} onValueChange={(v) => setEditUserMode(v as 'balance' | 'details')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="balance" className="flex items-center">
                      <CircleDollarSign className="h-4 w-4 mr-2" />
                      Balance
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex items-center">
                      <UserCog className="h-4 w-4 mr-2" />
                      Account
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Balance Tab */}
                  <TabsContent value="balance" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <label htmlFor="balance" className="text-right min-w-24">
                          Balance ($):
                        </label>
                        <Input
                          id="balance"
                          type="number"
                          step="0.01"
                          value={editUserBalance}
                          onChange={(e) => setEditUserBalance(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Current balance: <CurrencyDisplay amount={editingUser.balance} showPrefix={true} />
                      </p>
                      
                      <div className="pt-2">
                        <Button 
                          onClick={() => {
                            const balanceInCents = Math.round(parseFloat(editUserBalance) * 100);
                            updateUserBalanceMutation.mutate({
                              userId: editingUser.id,
                              amount: balanceInCents
                            });
                          }}
                          disabled={updateUserBalanceMutation.isPending}
                          className="w-full"
                        >
                          {updateUserBalanceMutation.isPending ? 'Updating...' : 'Update Balance'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* User Details Tab */}
                  <TabsContent value="details" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <label htmlFor="username" className="text-right min-w-24">
                          Username:
                        </label>
                        <Input
                          id="username"
                          value={editUserData.username}
                          onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                          className="flex-1"
                        />
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <label htmlFor="password" className="text-right min-w-24">
                          New Password:
                        </label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Leave blank to keep current"
                          value={editUserData.password}
                          onChange={(e) => setEditUserData({...editUserData, password: e.target.value})}
                          className="flex-1"
                        />
                      </div>
                      
                      <div className="flex items-center gap-4 pt-2">
                        <label className="text-right min-w-24">
                          Account Type:
                        </label>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="isAdmin" 
                            checked={editUserData.isAdmin}
                            onCheckedChange={(checked) => 
                              setEditUserData({...editUserData, isAdmin: checked as boolean})
                            }
                            disabled={user?.id === editingUser.id} // Can't change own admin status
                          />
                          <label htmlFor="isAdmin" className="text-sm">
                            Administrator
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <label className="text-right min-w-24">
                          Account Status:
                        </label>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="isSuspended" 
                            checked={editUserData.isSuspended}
                            onCheckedChange={(checked) => 
                              setEditUserData({...editUserData, isSuspended: checked as boolean})
                            }
                            disabled={user?.id === editingUser.id || editingUser.isAdmin} // Can't suspend own account or other admins
                          />
                          <label htmlFor="isSuspended" className="text-sm">
                            Suspended
                          </label>
                          {user?.id === editingUser.id && (
                            <span className="text-xs text-red-500 ml-2">Cannot suspend own account</span>
                          )}
                          {editingUser.isAdmin && user?.id !== editingUser.id && (
                            <span className="text-xs text-amber-500 ml-2">Admin accounts cannot be suspended</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 pt-2">
                        <label className="text-right min-w-24">
                          API Key:
                        </label>
                        <div className="flex flex-col space-y-2 w-full">
                          {editingUser.apiKey ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono truncate max-w-[200px] border rounded px-2 py-1">
                                {editingUser.apiKey.substring(0, 16)}...
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center"
                                onClick={() => {
                                  navigator.clipboard.writeText(editingUser.apiKey!);
                                  toast({
                                    title: "Copied",
                                    description: "API key copied to clipboard",
                                  });
                                }}
                              >
                                <Copy className="h-3.5 w-3.5 mr-2" />
                                Copy
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center text-amber-600"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to regenerate the API key for ${editingUser.username}? This will invalidate the existing key.`)) {
                                    regenerateApiKeyMutation.mutate(editingUser.id);
                                  }
                                }}
                              >
                                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                Regenerate
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-muted-foreground">No API key set</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center"
                                onClick={() => {
                                  if (window.confirm(`Generate a new API key for ${editingUser.username}?`)) {
                                    regenerateApiKeyMutation.mutate(editingUser.id);
                                  }
                                }}
                              >
                                <Key className="h-3.5 w-3.5 mr-2" />
                                Generate Key
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button 
                          onClick={() => {
                            updateUserDetailsMutation.mutate({
                              userId: editingUser.id,
                              username: editUserData.username,
                              password: editUserData.password || undefined,
                              isAdmin: editUserData.isAdmin,
                              isSuspended: editUserData.isSuspended
                            });
                          }}
                          disabled={updateUserDetailsMutation.isPending || 
                                    (user?.id === editingUser.id && !editUserData.isAdmin) || // Can't remove own admin privileges
                                    (user?.id === editingUser.id && editUserData.isSuspended)} // Can't suspend self
                          className="w-full"
                        >
                          {updateUserDetailsMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* Servers Tab */}
        <TabsContent value="servers" className="space-y-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Server Actions</CardTitle>
              <CardDescription>Manage DigitalOcean VPS instances from the console</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => window.open('https://cloud.digitalocean.com/droplets', '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open DigitalOcean Console</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Server Management</CardTitle>
              <CardDescription>View and manage all servers on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and filter controls */}
              <div className="mb-4 flex flex-col md:flex-row gap-4">
                <Input 
                  placeholder="Search servers by name or region..."
                  value={serverSearch}
                  onChange={(e) => {
                    setServerSearch(e.target.value);
                    setServerPage(1); // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
                
                <Select
                  onValueChange={(value: 'all' | 'active' | 'inactive') => {
                    // Filter by status
                    setServerSearch("");
                    setServerStatusFilter(value);
                    if (value !== "all") {
                      toast({
                        title: "Filter Applied",
                        description: `Showing ${value} servers only`,
                      });
                    }
                  }}
                  defaultValue="all"
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter servers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Servers</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {serversLoading ? (
                <div className="text-center py-8">Loading servers...</div>
              ) : servers ? (
                <div>
                  <Table>
                    <TableCaption>List of all servers on the platform</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Droplet ID</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servers
                        .filter(server => {
                          // Apply text search filter
                          const textMatch = server.name.toLowerCase().includes(serverSearch.toLowerCase()) || 
                            server.region.toLowerCase().includes(serverSearch.toLowerCase());
                          
                          // Apply status filter if not "all"
                          if (serverStatusFilter === "active") {
                            return textMatch && server.status === "active";
                          } else if (serverStatusFilter === "inactive") {
                            return textMatch && server.status !== "active";
                          }
                          
                          return textMatch;
                        })
                        .slice((serverPage - 1) * ITEMS_PER_PAGE, serverPage * ITEMS_PER_PAGE)
                        .map((server) => (
                        <TableRow key={server.id}>
                          <TableCell>{server.id}</TableCell>
                          <TableCell>{server.name}</TableCell>
                          <TableCell>{server.userId}</TableCell>
                          <TableCell>{server.region}</TableCell>
                          <TableCell>{server.size}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              server.status === 'active' ? 'bg-green-100 text-green-800' : 
                              server.status === 'new' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {server.status}
                            </span>
                          </TableCell>
                          <TableCell>{server.ipAddress || 'Not assigned'}</TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">{server.dropletId}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`/servers/${server.id}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to reboot this server?')) {
                                    // Implement reboot functionality
                                    rebootServerMutation.mutate(server.id);
                                  }
                                }}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reboot
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
                                    deleteServerMutation.mutate(server.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination for servers */}
                  {servers.filter(server => {
                    // Apply text search filter
                    const textMatch = server.name.toLowerCase().includes(serverSearch.toLowerCase()) || 
                      server.region.toLowerCase().includes(serverSearch.toLowerCase());
                    
                    // Apply status filter if not "all"
                    if (serverStatusFilter === "active") {
                      return textMatch && server.status === "active";
                    } else if (serverStatusFilter === "inactive") {
                      return textMatch && server.status !== "active";
                    }
                    
                    return textMatch;
                  }).length > 0 && (
                    <div className="flex items-center justify-center space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setServerPage(prev => Math.max(prev - 1, 1))}
                        disabled={serverPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {serverPage} of {Math.ceil(servers.filter(server => {
                          // Apply text search filter
                          const textMatch = server.name.toLowerCase().includes(serverSearch.toLowerCase()) || 
                            server.region.toLowerCase().includes(serverSearch.toLowerCase());
                          
                          // Apply status filter if not "all"
                          if (serverStatusFilter === "active") {
                            return textMatch && server.status === "active";
                          } else if (serverStatusFilter === "inactive") {
                            return textMatch && server.status !== "active";
                          }
                          
                          return textMatch;
                        }).length / ITEMS_PER_PAGE)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setServerPage(prev => 
                          Math.min(prev + 1, Math.ceil(servers.filter(server => {
                            // Apply text search filter
                            const textMatch = server.name.toLowerCase().includes(serverSearch.toLowerCase()) || 
                              server.region.toLowerCase().includes(serverSearch.toLowerCase());
                            
                            // Apply status filter if not "all"
                            if (serverStatusFilter === "active") {
                              return textMatch && server.status === "active";
                            } else if (serverStatusFilter === "inactive") {
                              return textMatch && server.status !== "active";
                            }
                            
                            return textMatch;
                          }).length / ITEMS_PER_PAGE))
                        )}
                        disabled={serverPage >= Math.ceil(servers.filter(server => {
                          // Apply text search filter
                          const textMatch = server.name.toLowerCase().includes(serverSearch.toLowerCase()) || 
                            server.region.toLowerCase().includes(serverSearch.toLowerCase());
                          
                          // Apply status filter if not "all"
                          if (serverStatusFilter === "active") {
                            return textMatch && server.status === "active";
                          } else if (serverStatusFilter === "inactive") {
                            return textMatch && server.status !== "active";
                          }
                          
                          return textMatch;
                        }).length / ITEMS_PER_PAGE)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-red-500">Failed to load servers</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Volumes Tab */}
        <TabsContent value="volumes" className="space-y-4">
          <VolumeManagement 
            volumes={volumes}
            volumesLoading={volumesLoading}
            volumeStats={volumeStats}
            volumeStatsLoading={volumeStatsLoading}
          />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Transactions</CardTitle>
              <CardDescription>View all financial transactions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search input for transactions */}
              <div className="mb-4">
                <Input 
                  placeholder="Search transactions by type or description..."
                  value={transactionSearch}
                  onChange={(e) => {
                    setTransactionSearch(e.target.value);
                    setTransactionPage(1); // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {transactionsLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : transactions ? (
                <div>
                  <Table>
                    <TableCaption>List of all financial transactions</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions
                        .filter(transaction => 
                          transaction.type.toLowerCase().includes(transactionSearch.toLowerCase()) || 
                          transaction.description.toLowerCase().includes(transactionSearch.toLowerCase())
                        )
                        .slice((transactionPage - 1) * ITEMS_PER_PAGE, transactionPage * ITEMS_PER_PAGE)
                        .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.id}</TableCell>
                          <TableCell>{transaction.userId}</TableCell>
                          <TableCell className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                            <CurrencyDisplay 
                              amount={transaction.amount} 
                              showPrefix={true} 
                              showSign={transaction.type === 'deposit'}
                            />
                          </TableCell>
                          <TableCell>{transaction.type}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              transaction.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination for transactions */}
                  {transactions.filter(transaction => 
                    transaction.type.toLowerCase().includes(transactionSearch.toLowerCase()) || 
                    transaction.description.toLowerCase().includes(transactionSearch.toLowerCase())
                  ).length > 0 && (
                    <div className="flex items-center justify-center space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionPage(prev => Math.max(prev - 1, 1))}
                        disabled={transactionPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {transactionPage} of {Math.ceil(transactions.filter(transaction => 
                          transaction.type.toLowerCase().includes(transactionSearch.toLowerCase()) || 
                          transaction.description.toLowerCase().includes(transactionSearch.toLowerCase())
                        ).length / ITEMS_PER_PAGE)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionPage(prev => 
                          Math.min(prev + 1, Math.ceil(transactions.filter(transaction => 
                            transaction.type.toLowerCase().includes(transactionSearch.toLowerCase()) || 
                            transaction.description.toLowerCase().includes(transactionSearch.toLowerCase())
                          ).length / ITEMS_PER_PAGE))
                        )}
                        disabled={transactionPage >= Math.ceil(transactions.filter(transaction => 
                          transaction.type.toLowerCase().includes(transactionSearch.toLowerCase()) || 
                          transaction.description.toLowerCase().includes(transactionSearch.toLowerCase())
                        ).length / ITEMS_PER_PAGE)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-red-500">Failed to load transactions</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Manage customer support tickets</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search input for tickets */}
              <div className="mb-4">
                <Input 
                  placeholder="Search tickets by subject..."
                  value={ticketSearch}
                  onChange={(e) => {
                    setTicketSearch(e.target.value);
                    setTicketPage(1); // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {ticketsLoading ? (
                <div className="text-center py-8">Loading tickets...</div>
              ) : tickets ? (
                <div>
                  <Table>
                    <TableCaption>List of all support tickets</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets
                        .filter(ticket => 
                          ticket.subject.toLowerCase().includes(ticketSearch.toLowerCase())
                        )
                        .slice((ticketPage - 1) * ITEMS_PER_PAGE, ticketPage * ITEMS_PER_PAGE)
                        .map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>{ticket.id}</TableCell>
                          <TableCell>{ticket.userId}</TableCell>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              ticket.status === 'open' ? 'bg-green-100 text-green-800' : 
                              ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {ticket.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              ticket.priority === 'critical' ? 'bg-red-100 text-red-800' : 
                              ticket.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {ticket.priority}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{new Date(ticket.updatedAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                              >
                                <Link href={`/support/${ticket.id}`}>
                                  View & Respond
                                </Link>
                              </Button>
                              <Select
                                onValueChange={(value) => {
                                  updateTicketStatusMutation.mutate({
                                    ticketId: ticket.id,
                                    status: value
                                  });
                                }}
                                defaultValue={ticket.status}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue placeholder="Change Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination for tickets */}
                  {tickets.filter(ticket => 
                    ticket.subject.toLowerCase().includes(ticketSearch.toLowerCase())
                  ).length > 0 && (
                    <div className="flex items-center justify-center space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTicketPage(prev => Math.max(prev - 1, 1))}
                        disabled={ticketPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {ticketPage} of {Math.ceil(tickets.filter(ticket => 
                          ticket.subject.toLowerCase().includes(ticketSearch.toLowerCase())
                        ).length / ITEMS_PER_PAGE)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTicketPage(prev => 
                          Math.min(prev + 1, Math.ceil(tickets.filter(ticket => 
                            ticket.subject.toLowerCase().includes(ticketSearch.toLowerCase())
                          ).length / ITEMS_PER_PAGE))
                        )}
                        disabled={ticketPage >= Math.ceil(tickets.filter(ticket => 
                          ticket.subject.toLowerCase().includes(ticketSearch.toLowerCase())
                        ).length / ITEMS_PER_PAGE)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-red-500">Failed to load tickets</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          {/* SSH Key Management section removed */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Ban className="h-5 w-5 mr-2" />
                  IP Ban Management
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setIpBanDialogOpen(true)}
                >
                  Ban New IP
                </Button>
              </CardTitle>
              <CardDescription>Block malicious IP addresses from accessing the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search input for IP bans */}
              <div className="mb-4">
                <Input 
                  placeholder="Search by IP address or reason..."
                  value={ipBanSearch}
                  onChange={(e) => {
                    setIpBanSearch(e.target.value);
                    setIpBanPage(1); // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {ipBansLoading ? (
                <div className="text-center py-8">Loading IP bans...</div>
              ) : ipBans && ipBans.length > 0 ? (
                <div>
                  <Table>
                    <TableCaption>List of all banned IP addresses</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Banned On</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ipBans
                        .filter(ban => 
                          ban.ipAddress.toLowerCase().includes(ipBanSearch.toLowerCase()) || 
                          ban.reason.toLowerCase().includes(ipBanSearch.toLowerCase())
                        )
                        .slice((ipBanPage - 1) * ITEMS_PER_PAGE, ipBanPage * ITEMS_PER_PAGE)
                        .map((ban) => (
                        <TableRow key={ban.id}>
                          <TableCell>{ban.id}</TableCell>
                          <TableCell>{ban.ipAddress}</TableCell>
                          <TableCell>{ban.reason}</TableCell>
                          <TableCell>{new Date(ban.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{ban.expiresAt ? new Date(ban.expiresAt).toLocaleString() : 'Never'}</TableCell>
                          <TableCell>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => removeIpBanMutation.mutate(ban.id)}
                              disabled={removeIpBanMutation.isPending}
                            >
                              {removeIpBanMutation.isPending ? 'Removing...' : 'Remove Ban'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination for IP bans */}
                  {ipBans.filter(ban => 
                    ban.ipAddress.toLowerCase().includes(ipBanSearch.toLowerCase()) || 
                    ban.reason.toLowerCase().includes(ipBanSearch.toLowerCase())
                  ).length > 0 && (
                    <div className="flex items-center justify-center space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIpBanPage(prev => Math.max(prev - 1, 1))}
                        disabled={ipBanPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {ipBanPage} of {Math.ceil(ipBans.filter(ban => 
                          ban.ipAddress.toLowerCase().includes(ipBanSearch.toLowerCase()) || 
                          ban.reason.toLowerCase().includes(ipBanSearch.toLowerCase())
                        ).length / ITEMS_PER_PAGE)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIpBanPage(prev => 
                          Math.min(prev + 1, Math.ceil(ipBans.filter(ban => 
                            ban.ipAddress.toLowerCase().includes(ipBanSearch.toLowerCase()) || 
                            ban.reason.toLowerCase().includes(ipBanSearch.toLowerCase())
                          ).length / ITEMS_PER_PAGE))
                        )}
                        disabled={ipBanPage >= Math.ceil(ipBans.filter(ban => 
                          ban.ipAddress.toLowerCase().includes(ipBanSearch.toLowerCase()) || 
                          ban.reason.toLowerCase().includes(ipBanSearch.toLowerCase())
                        ).length / ITEMS_PER_PAGE)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">No IP bans found</div>
              )}
            </CardContent>
          </Card>

          {/* Ban IP Dialog */}
          <Dialog open={ipBanDialogOpen} onOpenChange={setIpBanDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ban IP Address</DialogTitle>
                <DialogDescription>
                  Block an IP address from accessing the platform
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="ipAddress" className="text-right">
                    IP Address:
                  </label>
                  <Input
                    id="ipAddress"
                    placeholder="e.g. 192.168.1.1"
                    value={ipBanData.ipAddress}
                    onChange={(e) => setIpBanData({ ...ipBanData, ipAddress: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="reason" className="text-right">
                    Reason:
                  </label>
                  <Input
                    id="reason"
                    placeholder="Why is this IP being banned?"
                    value={ipBanData.reason}
                    onChange={(e) => setIpBanData({ ...ipBanData, reason: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="expiresAt" className="text-right">
                    Expires:
                  </label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={ipBanData.expiresAt}
                    onChange={(e) => setIpBanData({ ...ipBanData, expiresAt: e.target.value })}
                    className="col-span-3"
                  />
                  <div className="col-start-2 col-span-3 text-xs text-gray-500">
                    Leave empty for permanent ban
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIpBanDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    createIpBanMutation.mutate({
                      ipAddress: ipBanData.ipAddress,
                      reason: ipBanData.reason,
                      expiresAt: ipBanData.expiresAt ? ipBanData.expiresAt : null
                    });
                  }}
                  disabled={createIpBanMutation.isPending || !ipBanData.ipAddress || !ipBanData.reason}
                >
                  {createIpBanMutation.isPending ? 'Banning...' : 'Ban IP'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}