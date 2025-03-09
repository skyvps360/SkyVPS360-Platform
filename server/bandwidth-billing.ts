import { db } from './db';
import { storage } from './storage';
import { BillingTransaction, Server, ServerMetric } from '../shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { serverMetrics } from '../shared/schema';

// Interface for bandwidth usage data
interface BandwidthUsage {
  serverId: number;
  userId: number;
  usage: number;  // in GB
  limit: number;  // in GB
  periodStart: Date;
  periodEnd: Date;
  overageGB: number;
  overageCost: number;
}

/**
 * Get bandwidth information for a specific server
 */
export async function getServerBandwidth(serverId: number): Promise<{
  current: number;  // Current usage in GB
  limit: number;    // Limit in GB based on server size
  periodStart: string;
  periodEnd: string;
  lastUpdated: string;
  overageRate: number; // Rate for overage charges (0.005 = 0.5%)
}> {
  // Get the server info to determine the bandwidth limit
  const server = await storage.getServer(serverId);
  if (!server) {
    throw new Error("Server not found");
  }

  // Get billing period based on server creation date
  const now = new Date();
  
  // Use server creation date if available, otherwise fall back to current month
  let periodStart: Date;
  let periodEnd: Date;
  
  if (server.createdAt) {
    // Get the day of month when server was created
    const creationDate = new Date(server.createdAt);
    const creationDay = creationDate.getDate();
    
    // Current billing cycle start date (same day as creation, current month)
    periodStart = new Date(now.getFullYear(), now.getMonth(), creationDay);
    
    // If we're before the billing cycle start day, use previous month's cycle
    if (now.getDate() < creationDay) {
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, creationDay);
    }
    
    // Billing cycle end date (day before start day, next month)
    periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);
  } else {
    // Fallback to monthly billing if creation date is not available
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  // Get all metrics for the current billing period
  const metrics = await db.select()
    .from(serverMetrics)
    .where(
      and(
        eq(serverMetrics.serverId, serverId),
        gte(serverMetrics.timestamp, periodStart),
        lte(serverMetrics.timestamp, periodEnd)
      )
    );

  // Calculate total inbound and outbound transfer
  let totalNetworkIn = 0;
  let totalNetworkOut = 0;
  let lastUpdated = periodStart.toISOString();

  if (metrics.length > 0) {
    // Calculate cumulative network usage
    for (const metric of metrics) {
      totalNetworkIn += metric.networkIn || 0;
      totalNetworkOut += metric.networkOut || 0;
      
      // Track the latest metric timestamp
      const metricTime = new Date(metric.timestamp);
      if (metricTime > new Date(lastUpdated)) {
        lastUpdated = metric.timestamp.toISOString();
      }
    }
  }

  // Convert bytes to GB
  const totalUsageGB = (totalNetworkIn + totalNetworkOut) / (1024 * 1024 * 1024);
  
  // Determine bandwidth limit based on server size
  // These are example values - in a real system, these would come from a configuration
  // or be determined based on the actual DigitalOcean plan specs
  const sizeToLimit: Record<string, number> = {
    's-1vcpu-1gb': 1000,     // 1TB
    's-1vcpu-2gb': 2000,     // 2TB
    's-2vcpu-2gb': 3000,     // 3TB
    's-2vcpu-4gb': 4000,     // 4TB
    's-4vcpu-8gb': 5000,     // 5TB
    's-8vcpu-16gb': 6000,    // 6TB
    // Add more sizes as needed
  };

  // Default limit if size not found in the mapping
  const bandwidthLimitGB = sizeToLimit[server.size] || 1000;
  
  // Overage rate is 0.5% of the monthly server cost per GB
  const overageRate = 0.005;

  return {
    current: parseFloat(totalUsageGB.toFixed(2)),
    limit: bandwidthLimitGB,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    lastUpdated,
    overageRate
  };
}

/**
 * Calculate bandwidth overage costs for all servers
 * This should be called by the hourly billing job
 */
export async function calculateBandwidthOverages(): Promise<void> {
  // Get all active servers
  const servers = await storage.getAllServers();
  const activeServers = servers.filter(server => server.status === 'active');
  
  // Exit if no active servers
  if (activeServers.length === 0) {
    console.log('No active servers found for bandwidth calculations');
    return;
  }

  const now = new Date();
  
  // Process each server's bandwidth usage
  for (const server of activeServers) {
    try {
      // Skip if server doesn't have a creation date
      if (!server.createdAt) {
        console.log(`Server ${server.id} has no creation date, skipping bandwidth calculation`);
        continue;
      }
      
      // Calculate billing cycle day from server creation date
      const creationDate = new Date(server.createdAt);
      const billingCycleDay = creationDate.getDate();
      
      // Only process if today is the last day of the server's billing cycle
      if (now.getDate() !== billingCycleDay) {
        console.log(`Not billing cycle end date for server ${server.id}, skipping bandwidth overage calculation`);
        continue;
      }
      
      await processBandwidthOverage(server);
    } catch (error) {
      console.error(`Error processing bandwidth overage for server ${server.id}:`, error);
    }
  }
}

/**
 * Process bandwidth overage for a specific server
 */
async function processBandwidthOverage(server: Server): Promise<void> {
  try {
    // Get bandwidth data
    const bandwidthData = await getServerBandwidth(server.id);
    
    // Check if there's an overage
    if (bandwidthData.current <= bandwidthData.limit) {
      // No overage, nothing to charge
      return;
    }
    
    // Calculate overage amount
    const overageGB = bandwidthData.current - bandwidthData.limit;
    
    // Get server's monthly cost to calculate the overage fee
    const serverMonthlyPrice = getServerMonthlyPrice(server.size);
    
    // Calculate overage cost (0.5% of monthly price per GB)
    const overageCost = overageGB * (serverMonthlyPrice * bandwidthData.overageRate);
    
    // Round overage cost to 2 decimal places and convert to cents
    const overageCostCents = Math.round(overageCost * 100);
    
    // Don't charge if the amount is negligible
    if (overageCostCents <= 0) {
      return;
    }
    
    // Record the transaction
    await storage.createTransaction({
      userId: server.userId,
      amount: overageCostCents,
      type: 'bandwidth_overage',
      description: `Bandwidth overage charge for server '${server.name}' (${Math.round(overageGB)}GB above limit)`,
      status: 'completed',
      currency: 'USD',
      paypalTransactionId: null,
      createdAt: new Date()
    });
    
    // Update user balance automatically
    await storage.updateUserBalance(server.userId, -overageCostCents);
    
    console.log(`Charged user ${server.userId} $${(overageCostCents/100).toFixed(2)} for ${Math.round(overageGB)}GB bandwidth overage on server ${server.id}`);
  } catch (error) {
    console.error(`Error processing bandwidth overage for server ${server.id}:`, error);
  }
}

/**
 * Get the monthly price for a server size
 */
function getServerMonthlyPrice(size: string): number {
  // These are example prices - in a real system, these would come from DigitalOcean API
  const sizePrices: Record<string, number> = {
    's-1vcpu-1gb': 5,      // $5/month
    's-1vcpu-2gb': 10,     // $10/month
    's-2vcpu-2gb': 15,     // $15/month
    's-2vcpu-4gb': 20,     // $20/month
    's-4vcpu-8gb': 40,     // $40/month
    's-8vcpu-16gb': 80,    // $80/month
    // Add more sizes as needed
  };
  
  return sizePrices[size] || 5; // Default to $5 if size not found
}