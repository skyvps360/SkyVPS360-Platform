import { Request, Response, NextFunction, Express } from 'express';
import { storage } from '../storage';
import { Server, User, SupportTicket, BillingTransaction } from '@shared/schema';
import { log } from '../vite';
import * as crypto from 'crypto';
import path from 'path';
import { promises } from 'fs';

// Admin middleware to check if user is an admin
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
}

export function registerAdminRoutes(app: Express) {
  // Apply admin middleware to all admin routes
  app.use('/api/admin', adminMiddleware);
  
  // Get admin statistics
  app.get('/api/admin/stats', async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const servers = await storage.getAllServers();
      const tickets = await storage.getAllTickets();
      const transactions = await storage.getAllTransactions();
      
      // Calculate total deposits (converts cents to dollars)
      const totalDeposits = transactions
        .filter((tx: BillingTransaction) => tx.type === 'deposit' && tx.status === 'completed')
        .reduce((sum: number, tx: BillingTransaction) => sum + tx.amount, 0) / 100; // Convert cents to dollars
      
      // Calculate total spending
      const totalSpending = transactions
        .filter((tx: BillingTransaction) => tx.type === 'charge' && tx.status === 'completed')
        .reduce((sum: number, tx: BillingTransaction) => sum + tx.amount, 0) / 100; // Convert cents to dollars
      
      // Calculate servers by region
      const serversByRegion = servers.reduce((acc: Record<string, number>, server: Server) => {
        acc[server.region] = (acc[server.region] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate servers by size
      const serversBySize = servers.reduce((acc: Record<string, number>, server: Server) => {
        acc[server.size] = (acc[server.size] || 0) + 1;
        return acc;
      }, {});
      
      const stats = {
        users: {
          total: users.length,
          active: users.length, // We don't have an active status for users yet
          admins: users.filter((user: User) => user.isAdmin).length
        },
        servers: {
          total: servers.length,
          active: servers.filter((server: Server) => server.status === 'active').length,
          byRegion: serversByRegion,
          bySize: serversBySize
        },
        tickets: {
          total: tickets.length,
          open: tickets.filter((ticket: SupportTicket) => ticket.status === 'open').length,
          closed: tickets.filter((ticket: SupportTicket) => ticket.status === 'closed').length,
          critical: tickets.filter((ticket: SupportTicket) => ticket.priority === 'critical').length
        },
        billing: {
          totalDeposits,
          totalSpending
        }
      };
      
      res.json(stats);
    } catch (error) {
      log(`Admin stats error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load admin statistics' });
    }
  });
  
  // Get all users
  app.get('/api/admin/users', async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      log(`Admin users error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load users' });
    }
  });
  
  // Update user balance
  app.patch('/api/admin/users/:id/balance', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      
      // Validate input
      if (isNaN(userId) || !amount || isNaN(amount)) {
        return res.status(400).json({ message: 'Invalid user ID or amount' });
      }
      
      // Get user to check if exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Set the user's balance directly to the specified amount
      const updatedUser = await storage.updateUser(userId, {
        balance: amount
      });
      
      // Create a transaction record
      const prevBalance = user.balance;
      const amountDifference = amount - prevBalance;
      
      if (amountDifference !== 0) {
        const transactionType = amountDifference > 0 ? 'deposit' : 'charge';
        const absAmount = Math.abs(amountDifference);
        
        await storage.createTransaction({
          userId,
          amount: absAmount,
          type: transactionType,
          status: 'completed',
          currency: 'USD',
          paypalTransactionId: null,
          createdAt: new Date(),
          description: `Admin adjustment: ${amountDifference > 0 ? 'Added' : 'Deducted'} ${absAmount/100} USD`
        });
      }
      
      res.json(updatedUser);
    } catch (error) {
      log(`Admin update user balance error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to update user balance' });
    }
  });

  // Update user details
  app.patch('/api/admin/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, password, isAdmin, isSuspended } = req.body;
      
      // Validate userId
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Fetch target user to check permissions
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prepare update object
      const updates: Partial<User> = {};
      
      // Only include fields that are provided
      if (username !== undefined) updates.username = username;
      if (password !== undefined) updates.password = password;
      if (isAdmin !== undefined) updates.isAdmin = isAdmin;
      if (isSuspended !== undefined) updates.isSuspended = isSuspended;
      
      // Safety checks
      
      // Don't allow admins to remove their own admin status
      if (isAdmin === false && req.user?.id === userId) {
        return res.status(403).json({ message: "Cannot remove your own admin privileges" });
      }
      
      // Don't allow suspending an admin
      if (isSuspended === true && targetUser.isAdmin) {
        return res.status(403).json({ message: "Cannot suspend admin accounts" });
      }
      
      // Don't allow admins to suspend themselves
      if (isSuspended === true && req.user?.id === userId) {
        return res.status(403).json({ message: "Cannot suspend your own account" });
      }
      
      // Update user details
      const updatedUser = await storage.updateUser(userId, updates);
      
      log(`Admin updated user ${userId} (${username || targetUser.username})`, 'admin');
      
      res.json(updatedUser);
    } catch (error) {
      log(`Admin update user details error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to update user details' });
    }
  });
  
  // Get all servers
  app.get('/api/admin/servers', async (req: Request, res: Response) => {
    try {
      const servers = await storage.getAllServers();
      res.json(servers);
    } catch (error) {
      log(`Admin servers error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load servers' });
    }
  });
  
  // Get all tickets
  app.get('/api/admin/tickets', async (req: Request, res: Response) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      log(`Admin tickets error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load tickets' });
    }
  });
  
  // Get all transactions
  app.get('/api/admin/transactions', async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      log(`Admin transactions error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load transactions' });
    }
  });
  
  // Get all IP bans
  app.get('/api/admin/ip-bans', async (req: Request, res: Response) => {
    try {
      const ipBans = await storage.getAllIPBans();
      res.json(ipBans);
    } catch (error) {
      log(`Admin IP bans error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load IP bans' });
    }
  });
  
  // Create IP ban
  app.post('/api/admin/ip-bans', async (req: Request, res: Response) => {
    try {
      const { ipAddress, reason, expiresAt } = req.body;
      
      // Validate input
      if (!ipAddress || !reason) {
        return res.status(400).json({ message: 'IP address and reason are required' });
      }
      
      // Check if IP is already banned
      const existingBan = await storage.getIPBan(ipAddress);
      if (existingBan) {
        return res.status(409).json({ message: 'IP address is already banned' });
      }
      
      // Create the ban
      const ipBan = await storage.createIPBan({
        ipAddress,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        bannedBy: req.user!.id,
        isActive: true
      });
      
      res.status(201).json(ipBan);
    } catch (error) {
      log(`Admin create IP ban error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to create IP ban' });
    }
  });
  
  // Delete IP ban
  app.delete('/api/admin/ip-bans/:id', async (req: Request, res: Response) => {
    try {
      const banId = parseInt(req.params.id);
      
      // Validate input
      if (isNaN(banId)) {
        return res.status(400).json({ message: 'Invalid ban ID' });
      }
      
      await storage.deleteIPBan(banId);
      res.status(204).send();
    } catch (error) {
      log(`Admin delete IP ban error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to delete IP ban' });
    }
  });
  
  // CloudRack Terminal Key Cleanup Endpoint
  app.delete('/api/admin/cloudrack-terminal-keys', async (req: Request, res: Response) => {
    try {
      // Find all SSH keys that are marked as CloudRack Terminal keys
      const allUsers = await storage.getAllUsers();
      let totalRemoved = 0;
      let userCount = 0;
      
      // For each user, find and remove their CloudRack keys
      for (const user of allUsers) {
        const keys = await storage.getSSHKeysByUser(user.id);
        const cloudRackKeys = keys.filter(key => key.isCloudRackKey && !key.isSystemKey);
        
        if (cloudRackKeys.length > 0) {
          userCount++;
          
          // Delete each CloudRack key
          for (const key of cloudRackKeys) {
            await storage.deleteSSHKey(key.id);
            totalRemoved++;
            log(`Removed CloudRack Terminal Key ${key.id} for user ${user.id}`, 'admin');
          }
        }
      }
      
      return res.status(200).json({
        message: `Successfully cleaned up CloudRack Terminal Keys. Removed ${totalRemoved} keys from ${userCount} users.`,
        keysRemoved: totalRemoved,
        usersAffected: userCount
      });
    } catch (error) {
      log(`Error cleaning up CloudRack Terminal Keys: ${error}`, 'admin');
      return res.status(500).json({
        message: "Error cleaning up CloudRack Terminal Keys",
        error: (error as Error).message
      });
    }
  });

  // Get all volumes across the platform
  app.get('/api/admin/volumes', async (req: Request, res: Response) => {
    try {
      // Get all volumes from the database
      const servers = await storage.getAllServers();
      const volumes = [];
      
      // For each server, get its volumes
      for (const server of servers) {
        const serverVolumes = await storage.getVolumesByServer(server.id);
        // Add volumes to the list with server information
        volumes.push(...serverVolumes.map(volume => ({
          ...volume,
          serverName: server.name,
          serverRegion: server.region
        })));
      }

      // Get unattached volumes (those not associated with any server)
      const unattachedVolumes = await storage.getUnattachedVolumes();
      volumes.push(...unattachedVolumes.map(volume => ({
        ...volume,
        serverName: null,
        serverRegion: null
      })));
      
      // Return volumes list
      res.status(200).json(volumes);
    } catch (error) {
      console.error('Error getting volumes:', error);
      res.status(500).json({ message: 'Failed to retrieve volumes' });
    }
  });

  // Get volume stats for admin dashboard
  app.get('/api/admin/volume-stats', async (req: Request, res: Response) => {
    try {
      // Get all volumes from the database
      const servers = await storage.getAllServers();
      const volumes = [];
      
      // For each server, get its volumes
      for (const server of servers) {
        const serverVolumes = await storage.getVolumesByServer(server.id);
        volumes.push(...serverVolumes);
      }
      
      // Get unattached volumes
      const unattachedVolumes = await storage.getUnattachedVolumes();
      volumes.push(...unattachedVolumes);

      // Calculate total storage
      const totalStorage = volumes.reduce((total, volume) => total + volume.size, 0);
      
      // Calculate attached storage
      const attachedStorage = volumes
        .filter(volume => volume.serverId !== null)
        .reduce((total, volume) => total + volume.size, 0);
      
      // Calculate unattached storage
      const unattachedStorage = volumes
        .filter(volume => volume.serverId === null)
        .reduce((total, volume) => total + volume.size, 0);
      
      // Return stats
      res.status(200).json({
        totalStorage,
        attachedStorage,
        unattachedStorage,
        volumeCount: volumes.length,
        attachedVolumeCount: volumes.filter(volume => volume.serverId !== null).length,
        unattachedVolumeCount: volumes.filter(volume => volume.serverId === null).length
      });
    } catch (error) {
      console.error('Error getting volume stats:', error);
      res.status(500).json({ message: 'Failed to retrieve volume statistics' });
    }
  });
  
  // API Key Management for Admin
  app.get('/api/admin/users/:id/api-key', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return the current API key (or null if not set)
      res.status(200).json({ apiKey: user.apiKey });
    } catch (error) {
      console.error('Error getting user API key:', error);
      res.status(500).json({ message: 'Failed to retrieve API key' });
    }
  });
  
  app.post('/api/admin/users/:id/api-key', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Generate a new API key
      const apiKey = crypto.randomBytes(32).toString('hex');
      
      // Update the user with the new API key
      await storage.updateUser(userId, { apiKey });
      
      res.status(200).json({ 
        apiKey: apiKey,
        message: 'API key regenerated successfully' 
      });
    } catch (error) {
      console.error('Error regenerating API key:', error);
      res.status(500).json({ message: 'Failed to regenerate API key' });
    }
  });

  // Log that routes were registered
  log('Admin routes registered', 'admin');
}