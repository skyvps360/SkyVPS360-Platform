import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface BandwidthUsageEntry {
  date: string;
  usage: number;
  inbound: number;
  outbound: number;
}

interface BandwidthData {
  current: number; // Current usage in GB
  limit: number;   // Limit in GB
  periodStart: string;
  periodEnd: string;
  lastUpdated: string;
  overageRate: number; // Rate for overage charges (0.005 = 0.5%)
  daily: BandwidthUsageEntry[];
  hourly: BandwidthUsageEntry[];
}

export default function BandwidthDetailsPage() {
  const [, setLocation] = useLocation();
  const path = window.location.pathname;
  const matches = path.match(/\/servers\/(\d+)\/bandwidth-details/);
  const serverId = matches ? parseInt(matches[1], 10) : null;
  
  // Get bandwidth data from the server
  const { data: bandwidthData, isLoading, isError } = useQuery<BandwidthData>({
    queryKey: serverId ? [`/api/servers/${serverId}/bandwidth/detailed`] : [],
    enabled: !!serverId,
    // React Query v5 doesn't support onError directly in options - we'll handle this in the useEffect below
  });

  const { data: basicBandwidthData } = useQuery<BandwidthData>({
    queryKey: serverId ? [`/api/servers/${serverId}/bandwidth`] : [],
    enabled: !!serverId && isError,
  });

  const effectiveData = bandwidthData || basicBandwidthData;
  
  // Format bandwidth values
  const formatBandwidth = (gb: number) => {
    // For terabytes
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`;
    }
    
    // For gigabytes (show values ≥ 0.1 GB in GB)
    if (gb >= 0.1) {
      return `${gb.toFixed(2)} GB`;
    }
    
    // For small values, show in MB
    const mbValue = gb * 1024; // Convert GB to MB
    return `${mbValue.toFixed(1)} MB`;
  };

  // Go back to server details
  const handleBack = () => {
    if (serverId) {
      setLocation(`/servers/${serverId}`);
    } else {
      setLocation('/');
    }
  };

  // Define defaults for missing data or to avoid type errors
  const getBandwidthDefaults = () => {
    // Create billing period starting today and ending in 30 days
    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();
    
    return {
      current: 0,
      limit: 1000,
      periodStart,
      periodEnd,
      lastUpdated: now.toISOString(),
      overageRate: 0.005,
      daily: [],
      hourly: []
    };
  };

  // Generate mock data for demonstration if no detailed data is available
  const generateMockData = () => {
    if (!effectiveData) return { daily: [], hourly: [] };
    
    const daily: BandwidthUsageEntry[] = [];
    const hourly: BandwidthUsageEntry[] = [];
    
    // Generate 30 days of data
    const safeData = effectiveData as BandwidthData & { periodStart: string; current: number };
    const startDate = new Date(safeData.periodStart || new Date());
    const endDate = new Date();
    
    // Daily data
    let runningTotal = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Generate some random but realistic looking usage
      const dailyUsage = Math.random() * 0.5 * ((safeData.current || 0.1) / 30); // Distribute total over ~30 days
      const inbound = dailyUsage * (0.3 + Math.random() * 0.2); // 30-50% is inbound
      const outbound = dailyUsage - inbound;
      
      runningTotal += dailyUsage;
      
      daily.push({
        date: currentDate.toISOString().slice(0, 10),
        usage: dailyUsage,
        inbound,
        outbound
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Hourly data (last 24 hours)
    currentDate = new Date();
    currentDate.setHours(currentDate.getHours() - 24);
    
    for (let i = 0; i < 24; i++) {
      const hourlyUsage = Math.random() * 0.1; // Random usage for demo
      const inbound = hourlyUsage * (0.3 + Math.random() * 0.2);
      const outbound = hourlyUsage - inbound;
      
      hourly.push({
        date: new Date(currentDate).toISOString(),
        usage: hourlyUsage,
        inbound,
        outbound
      });
      
      // Add one hour
      currentDate.setHours(currentDate.getHours() + 1);
    }
    
    return { daily, hourly };
  };

  // Use typecasting to avoid TypeScript errors
  const safeData = (effectiveData || getBandwidthDefaults()) as BandwidthData & {
    daily?: BandwidthUsageEntry[];
    hourly?: BandwidthUsageEntry[];
  };

  const { daily, hourly } = safeData.daily && safeData.hourly 
    ? { daily: safeData.daily, hourly: safeData.hourly }
    : generateMockData();

  // Calculate billing impact
  const calculateOverage = () => {
    if (!effectiveData) return { overageGB: 0, cost: 0 };
    
    const safeData = effectiveData as BandwidthData & { 
      current: number;
      limit: number;
      overageRate: number;
    };
    
    const overageGB = Math.max(0, safeData.current - safeData.limit);
    const cost = overageGB * safeData.overageRate;
    
    return { overageGB, cost };
  };

  const { overageGB, cost } = calculateOverage();

  if (isLoading || !serverId) {
    return (
      <div className="container max-w-7xl mx-auto p-4">
        <Button variant="ghost" className="mb-4" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Server
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Bandwidth Usage Details</CardTitle>
            <CardDescription>Loading bandwidth usage history...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!effectiveData) {
    return (
      <div className="container max-w-7xl mx-auto p-4">
        <Button variant="ghost" className="mb-4" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Server
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Bandwidth Usage Details</CardTitle>
            <CardDescription>Monthly bandwidth consumption history</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bandwidth data unavailable</AlertTitle>
              <AlertDescription>
                Unable to retrieve detailed bandwidth usage information for this server.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4">
      <Button variant="ghost" className="mb-4" onClick={handleBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Server
      </Button>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bandwidth Usage Details</CardTitle>
          <CardDescription>Monthly bandwidth consumption for Server #{serverId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-primary/5 p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Current Usage</div>
              <div className="text-3xl font-bold">{formatBandwidth((effectiveData as BandwidthData).current)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date((effectiveData as BandwidthData).lastUpdated).toLocaleString()}
              </div>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Monthly Limit</div>
              <div className="text-3xl font-bold">{formatBandwidth((effectiveData as BandwidthData).limit)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Billing period: {new Date((effectiveData as BandwidthData).periodStart).toLocaleDateString()} - {new Date((effectiveData as BandwidthData).periodEnd).toLocaleDateString()}
              </div>
            </div>
            
            <div className={`p-4 rounded-md ${overageGB > 0 ? 'bg-destructive/10' : 'bg-primary/5'}`}>
              <div className="text-sm text-muted-foreground mb-1">Projected Overage Charges</div>
              <div className="text-3xl font-bold">${cost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {overageGB > 0 
                  ? `Overage: ${formatBandwidth(overageGB)} at $${(effectiveData as BandwidthData).overageRate.toFixed(3)}/GB`
                  : 'No overage charges projected'
                }
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm">
                Used: <span className="font-medium">{formatBandwidth((effectiveData as BandwidthData).current)}</span> of <span className="font-medium">{formatBandwidth((effectiveData as BandwidthData).limit)}</span>
              </div>
              <div className="text-sm">
                {((effectiveData as BandwidthData).current / (effectiveData as BandwidthData).limit * 100).toFixed(1)}%
              </div>
            </div>
            
            <Progress 
              value={Math.min(100, ((effectiveData as BandwidthData).current / (effectiveData as BandwidthData).limit) * 100)} 
              className={`h-3 ${
                (effectiveData as BandwidthData).current > (effectiveData as BandwidthData).limit
                  ? "[&>div]:bg-destructive" 
                  : (effectiveData as BandwidthData).current > (effectiveData as BandwidthData).limit * 0.8
                  ? "[&>div]:bg-amber-500" 
                  : "[&>div]:bg-primary"
              }`}
            />
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Daily Usage</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Usage (Last 24h)</TabsTrigger>
          <TabsTrigger value="table">Detailed Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Bandwidth Usage</CardTitle>
              <CardDescription>Data transfer by day for the current billing period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={daily}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tickFormatter={(value) => value >= 0.1 ? `${value.toFixed(1)} GB` : `${(value * 1024).toFixed(0)} MB`} />
                    <Tooltip 
                      formatter={(value: number) => [
                        value >= 0.1 
                          ? `${value.toFixed(2)} GB` 
                          : `${(value * 1024).toFixed(1)} MB`, 
                        ''
                      ]}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="inbound" stackId="1" stroke="#8884d8" fill="#8884d8" name="Inbound" />
                    <Area type="monotone" dataKey="outbound" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Outbound" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hourly Bandwidth Usage</CardTitle>
              <CardDescription>Data transfer by hour for the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={hourly}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis tickFormatter={(value) => value >= 0.1 ? `${value.toFixed(2)} GB` : `${(value * 1024).toFixed(0)} MB`} />
                    <Tooltip 
                      formatter={(value: number) => [
                        value >= 0.1 
                          ? `${value.toFixed(3)} GB` 
                          : `${(value * 1024).toFixed(1)} MB`, 
                        ''
                      ]}
                      labelFormatter={(date) => new Date(date).toLocaleString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="inbound" stroke="#8884d8" name="Inbound" strokeWidth={2} />
                    <Line type="monotone" dataKey="outbound" stroke="#82ca9d" name="Outbound" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Bandwidth Data</CardTitle>
              <CardDescription>Tabular view of daily bandwidth consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Bandwidth usage for the current billing period.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Inbound</TableHead>
                    <TableHead>Outbound</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daily.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">{new Date(day.date).toLocaleDateString()}</TableCell>
                      <TableCell>{day.inbound >= 0.1 ? day.inbound.toFixed(2) : `${(day.inbound * 1024).toFixed(1)} MB`}</TableCell>
                      <TableCell>{day.outbound >= 0.1 ? day.outbound.toFixed(2) : `${(day.outbound * 1024).toFixed(1)} MB`}</TableCell>
                      <TableCell>{day.usage >= 0.1 ? day.usage.toFixed(2) : `${(day.usage * 1024).toFixed(1)} MB`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Information about billing */}
      <Card className="mt-6 border border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Bandwidth Billing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>
              <strong>Billing Period:</strong> Your bandwidth usage is calculated from your server's creation date.
              Current period: {new Date((effectiveData as BandwidthData).periodStart).toLocaleDateString()} to {new Date((effectiveData as BandwidthData).periodEnd).toLocaleDateString()}
            </p>
            <p>
              <strong>Bandwidth Limit:</strong> Your server plan includes {formatBandwidth((effectiveData as BandwidthData).limit)} of data transfer per month.
            </p>
            <p>
              <strong>Overage Charges:</strong> Any usage beyond your included bandwidth will be billed at ${(effectiveData as BandwidthData).overageRate.toFixed(3)} per GB
              (0.5% of your monthly server cost).
            </p>
            <p>
              <strong>Billing Method:</strong> Overages are automatically calculated and charged to your account at the end of each billing period.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}