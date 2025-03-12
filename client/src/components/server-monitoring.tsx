import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Server, Volume } from "@/types/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { Activity, Database, HardDrive, Cpu, MemoryStick, Router, Wifi, Clock, Server as ServerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServerMetricsProps {
  serverId: number;
}

interface MetricData {
  id: number;
  serverId: number;
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  loadAverage: number[];
  uptimeSeconds: number;
}

export default function ServerMonitoring({ serverId }: ServerMetricsProps) {
  const { toast } = useToast();
  const [activeMetric, setActiveMetric] = useState<string>("cpu");
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds default
  
  // Force auto-refresh every refreshInterval ms (default 30 seconds)
  useEffect(() => {
    if (refreshInterval <= 0) return;
    
    console.log(`Setting up metrics refresh interval: ${refreshInterval}ms for server ${serverId}`);
    const timer = setInterval(() => {
      console.log(`Auto-refreshing metrics for server ${serverId}`);
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/metrics/latest`] });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/metrics/history`] });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
    }, refreshInterval);
    
    return () => {
      console.log(`Clearing metrics refresh interval for server ${serverId}`);
      clearInterval(timer);
    };
  }, [serverId, refreshInterval]);

  // Mock data for fallback when API is not available yet
  const defaultMetric: MetricData = {
    id: 0,
    serverId,
    timestamp: new Date().toISOString(),
    cpuUsage: 25,
    memoryUsage: 40,
    diskUsage: 30,
    networkIn: 1024 * 500, // 500 KB
    networkOut: 1024 * 200, // 200 KB
    loadAverage: [0.5, 0.4, 0.3],
    uptimeSeconds: 3600 * 24 // 1 day
  };

  // Query for latest metrics
  const { 
    data: latestMetric,
    isLoading: isLoadingLatest,
    error: latestError,
    refetch: refetchLatestMetric
  } = useQuery<MetricData>({
    queryKey: [`/api/servers/${serverId}/metrics/latest`],
    enabled: !isNaN(serverId),
    refetchInterval: refreshInterval > 0 ? refreshInterval : undefined,
    refetchOnWindowFocus: true,
    staleTime: refreshInterval > 0 ? refreshInterval - 1000 : 30000 // Slightly less than refresh to ensure data is stale
  });

  // Query for historical metrics
  const { 
    data: metricsHistoryData,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistoryMetrics
  } = useQuery<MetricData[]>({
    queryKey: [`/api/servers/${serverId}/metrics/history`],
    enabled: !isNaN(serverId),
    refetchInterval: refreshInterval > 0 ? refreshInterval : undefined,
    refetchOnWindowFocus: true,
    staleTime: refreshInterval > 0 ? refreshInterval - 1000 : 30000
  });

  // Server Details Query - to get the server specs for context
  const { data: server, refetch: refetchServer } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !isNaN(serverId),
    refetchInterval: refreshInterval > 0 ? refreshInterval : undefined,
    refetchOnWindowFocus: true
  });
  
  // Query to get volumes attached to this server
  const { data: volumes, refetch: refetchVolumes } = useQuery<Volume[]>({
    queryKey: [`/api/servers/${serverId}/volumes`],
    enabled: !isNaN(serverId),
    refetchInterval: refreshInterval > 0 ? refreshInterval : undefined,
    refetchOnWindowFocus: true
  });

  // Safe access to metrics data with fallbacks
  const currentMetrics = latestMetric || defaultMetric;
  const metricsHistory = metricsHistoryData || [defaultMetric];

  // Force refresh metrics 
  const { mutate: refreshServerMetrics, isPending: isRefreshing } = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/servers/${serverId}/metrics/refresh`);
    },
    onSuccess: (data) => {
      toast({
        title: "Metrics refreshed",
        description: "Server performance data and IP information has been updated.",
      });
      // Handle the updated response format with metric and server data
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/metrics/latest`] });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/metrics/history`] });
      // Also invalidate the server details since we've updated IP information
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error refreshing metrics",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Format data for charts
  const chartData = [...metricsHistory].map((metric: MetricData) => ({
    name: new Date(metric.timestamp).toLocaleTimeString(),
    cpu: metric.cpuUsage,
    memory: metric.memoryUsage,
    disk: metric.diskUsage,
    networkIn: metric.networkIn / 1024 / 1024, // Convert to MB
    networkOut: metric.networkOut / 1024 / 1024, // Convert to MB
    load: metric.loadAverage[0],
  })).reverse(); // Reverse to get chronological order

  // Function to format bytes to a human-readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Function to format time elapsed since creation as a relative time
  const formatRelativeTime = (createdAt: string | null) => {
    if (!createdAt) return "Unknown";
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
    
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    
    // Convert to appropriate time unit
    if (diffSeconds < 60) {
      return rtf.format(-diffSeconds, 'second');
    } else if (diffSeconds < 3600) {
      return rtf.format(-Math.floor(diffSeconds / 60), 'minute');
    } else if (diffSeconds < 86400) {
      return rtf.format(-Math.floor(diffSeconds / 3600), 'hour');
    } else if (diffSeconds < 604800) {
      return rtf.format(-Math.floor(diffSeconds / 86400), 'day');
    } else if (diffSeconds < 2592000) {
      return rtf.format(-Math.floor(diffSeconds / 604800), 'week');
    } else if (diffSeconds < 31536000) {
      return rtf.format(-Math.floor(diffSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffSeconds / 31536000), 'year');
    }
  };

  // Function to refresh metrics
  const handleRefreshMetrics = () => {
    // First try the mutation which fetches fresh metrics from the server
    refreshServerMetrics();
    
    // Also directly refetch from the API to ensure immediate UI update
    refetchLatestMetric();
    refetchHistoryMetrics();
    refetchServer();
    refetchVolumes();
    console.log("Manual refresh triggered for server metrics");
  };

  // Function to toggle auto-refresh
  const toggleAutoRefresh = () => {
    setRefreshInterval(prev => prev ? 0 : 30000);
  };

  // Error handling
  useEffect(() => {
    if (latestError) {
      toast({
        title: "Error loading metrics",
        description: (latestError as Error).message,
        variant: "destructive",
      });
    }
    if (historyError) {
      toast({
        title: "Error loading metrics history",
        description: (historyError as Error).message,
        variant: "destructive",
      });
    }
  }, [latestError, historyError, toast]);

  const specs = server?.specs || { memory: 1024, vcpus: 1, disk: 25 };

  // Loading state
  if (isLoadingLatest && !currentMetrics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2">Loading server metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Monitoring</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant={refreshInterval > 0 ? "outline" : "ghost"} 
            size="sm" 
            onClick={toggleAutoRefresh}
            className={refreshInterval > 0 ? "border-green-500 text-green-600" : ""}
          >
            {refreshInterval > 0 ? (
              <span className="flex items-center">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Auto-refresh: On
              </span>
            ) : "Auto-refresh: Off"}
          </Button>
          <Button 
            size="sm" 
            onClick={handleRefreshMetrics} 
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Now"}
          </Button>
        </div>
      </div>

      {/* Server Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <ServerIcon className="h-5 w-5 mr-2 text-blue-600" />
              Server Information
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Server Creation Time */}
            <div className="space-y-2">
              <div className="flex items-center text-sm font-medium">
                <Clock className="h-4 w-4 mr-2 text-slate-600" />
                Server Age
              </div>
              <div className="text-sm">
                <div className="font-semibold">
                  {/* Show when the server was last refreshed */}
                  Refreshed {formatRelativeTime(server?.lastMonitored ? server.lastMonitored.toString() : null)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {server?.lastMonitored ? 
                    `Server monitoring started: ${new Date(server.lastMonitored).toLocaleString()}` : 
                    "Monitoring not started yet"
                  }
                </div>
              </div>
            </div>
            
            {/* Volume Information */}
            <div className="space-y-2">
              <div className="flex items-center text-sm font-medium">
                <Database className="h-4 w-4 mr-2 text-slate-600" />
                Attached Volumes
              </div>
              <div className="text-sm">
                <div className="font-semibold">{volumes?.length || 0} volumes</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {volumes?.length 
                    ? `Total: ${volumes.reduce((sum, vol) => sum + (vol.size || 0), 0)} GB` 
                    : "No volumes attached"}
                </div>
              </div>
            </div>
            
            {/* Network Info */}
            <div className="space-y-2">
              <div className="flex items-center text-sm font-medium">
                <Router className="h-4 w-4 mr-2 text-slate-600" />
                Network Traffic
              </div>
              <div className="text-sm">
                <div className="text-xs">
                  <span className="text-green-500">▲</span> Out: {formatBytes(currentMetrics.networkOut)}/s
                </div>
                <div className="text-xs">
                  <span className="text-blue-500">▼</span> In: {formatBytes(currentMetrics.networkIn)}/s
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-500" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{currentMetrics.cpuUsage}%</div>
            <Progress value={currentMetrics.cpuUsage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              Load Avg: {currentMetrics.loadAverage.map((l: number) => l.toFixed(2)).join(', ')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MemoryStick className="h-4 w-4 mr-2 text-green-500" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{currentMetrics.memoryUsage}%</div>
            <Progress value={currentMetrics.memoryUsage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((specs.memory * currentMetrics.memoryUsage) / 100)} MB of {specs.memory} MB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <HardDrive className="h-4 w-4 mr-2 text-orange-500" />
              Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{currentMetrics.diskUsage}%</div>
            <Progress value={currentMetrics.diskUsage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((specs.disk * currentMetrics.diskUsage) / 100)} GB of {specs.disk} GB
              {volumes?.length ? 
                <span className="ml-1">+ {volumes.reduce((sum, vol) => sum + (vol.size || 0), 0)} GB external</span> 
                : null
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Data Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeMetric} onValueChange={setActiveMetric}>
            <TabsList className="mb-4">
              <TabsTrigger value="cpu">CPU</TabsTrigger>
              <TabsTrigger value="memory">Memory</TabsTrigger>
              <TabsTrigger value="disk">Disk</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
            </TabsList>

            <TabsContent value="cpu" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f680" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="memory" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Area type="monotone" dataKey="memory" stroke="#22c55e" fill="#22c55e80" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="disk" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Area type="monotone" dataKey="disk" stroke="#f97316" fill="#f9731680" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="network" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${typeof value === 'number' ? value.toFixed(2) : value} MB/s`} />
                  <Bar dataKey="networkIn" name="In" fill="#3b82f6" />
                  <Bar dataKey="networkOut" name="Out" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}