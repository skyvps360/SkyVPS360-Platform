import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { InfoIcon, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface NetworkUsageProps {
  serverId: number;
  size: string;
}

interface BandwidthData {
  current: number; // Current usage in GB
  limit: number;   // Limit in GB
  periodStart: string;
  periodEnd: string;
  lastUpdated: string;
  overageRate: number; // Rate for overage charges (0.005 = 0.5%)
}

// Custom icon for network
const NetworkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4" />
  </svg>
);

export default function NetworkUsage({ serverId, size }: NetworkUsageProps) {
  // Get bandwidth data from the server
  const { data: bandwidthData, isLoading, isError, error } = useQuery<BandwidthData>({
    queryKey: [`/api/servers/${serverId}/bandwidth`],
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });

  // Determine bandwidth cap based on the server size
  // This would typically come from the backend, but here's a placeholder
  const getBandwidthInfo = () => {
    if (!bandwidthData) return null;
    
    const usagePercent = (bandwidthData.current / bandwidthData.limit) * 100;
    const isCloseToLimit = usagePercent > 80;
    const isOverLimit = usagePercent > 100;
    
    return {
      usagePercent,
      isCloseToLimit,
      isOverLimit,
      remaining: Math.max(0, bandwidthData.limit - bandwidthData.current)
    };
  };

  const bandwidthInfo = getBandwidthInfo();
  
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <NetworkIcon />
            <span>Network Usage</span>
          </CardTitle>
          <CardDescription>Monthly bandwidth consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bandwidthData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <NetworkIcon />
            <span>Network Usage</span>
          </CardTitle>
          <CardDescription>Monthly bandwidth consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Bandwidth data unavailable</AlertTitle>
            <AlertDescription>
              Unable to retrieve bandwidth usage information for this server.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="pb-2 bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-primary">
          <NetworkIcon />
          <span>Network Usage & Bandwidth Monitoring</span>
        </CardTitle>
        <CardDescription>
          Monthly bandwidth consumption
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Bandwidth usage is calculated from your server's creation date.
                  Once you exceed your included bandwidth, additional usage will be charged at 0.5% of your monthly server cost per GB.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="bg-primary/5 p-3 rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Current Usage</div>
              <div className="text-2xl font-semibold">{formatBandwidth(bandwidthData.current)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(bandwidthData.lastUpdated).toLocaleString()}
              </div>
            </div>
            <div className="bg-primary/5 p-3 rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Monthly Limit</div>
              <div className="text-2xl font-semibold">{formatBandwidth(bandwidthData.limit)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Resets on {new Date(bandwidthData.periodEnd).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Usage percentage */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Usage: {bandwidthInfo?.usagePercent.toFixed(1)}%</span>
              <span className="text-xs text-muted-foreground">
                {formatBandwidth(bandwidthInfo?.remaining || 0)} remaining
              </span>
            </div>
            <Progress 
              value={Math.min(100, bandwidthInfo?.usagePercent || 0)} 
              className={`h-3 ${
                bandwidthInfo?.isOverLimit 
                  ? "[&>div]:bg-destructive" 
                  : bandwidthInfo?.isCloseToLimit 
                  ? "[&>div]:bg-amber-500" 
                  : "[&>div]:bg-primary"
              }`}
            />
          </div>
          
          {/* Status message */}
          <div className="text-sm">
            {bandwidthInfo?.isOverLimit ? (
              <div className="text-destructive flex items-start">
                <AlertCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Bandwidth Limit Exceeded</span>
                  <p className="text-xs mt-0.5">Additional usage is charged at ${bandwidthData.overageRate.toFixed(3)} per GB (0.5% of monthly server cost).</p>
                </div>
              </div>
            ) : bandwidthInfo?.isCloseToLimit ? (
              <div className="text-amber-500 flex items-start">
                <AlertCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Approaching Bandwidth Limit</span>
                  <p className="text-xs mt-0.5">You're at {bandwidthInfo.usagePercent.toFixed(1)}% of your monthly bandwidth limit. Consider reducing data transfer or upgrading your plan.</p>
                </div>
              </div>
            ) : (
              <div className="text-green-600 dark:text-green-400 flex items-start">
                <AlertCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Bandwidth Usage Normal</span>
                  <p className="text-xs mt-0.5">Your usage is within the included monthly bandwidth limit.</p>
                </div>
              </div>
            )}
          </div>

          {/* Overage warning */}
          {bandwidthInfo?.isOverLimit && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bandwidth Overage</AlertTitle>
              <AlertDescription>
                Your account will be automatically charged for bandwidth overages at the end of each billing period.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Billing period info */}
          <div className="bg-muted p-3 rounded-md text-xs">
            <p><strong>Billing Period:</strong> {new Date(bandwidthData.periodStart).toLocaleDateString()} to {new Date(bandwidthData.periodEnd).toLocaleDateString()}</p>
            <p><strong>Overage Rate:</strong> ${bandwidthData.overageRate.toFixed(3)}/GB (0.5% of server monthly cost)</p>
            <p><strong>Billing Method:</strong> Overages are automatically calculated and charged at the end of each billing period</p>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => {
                // Create a modal with detailed bandwidth usage history
                window.open(`/servers/${serverId}/bandwidth-details`, '_blank');
              }}
            >
              <span>View Bandwidth Details</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}