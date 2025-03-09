import { users, servers, volumes, billingTransactions, supportTickets, supportMessages, sshKeys, serverMetrics, ipBans, snapshots, docSections, docArticles, type User, type Server, type Volume, type InsertUser, type BillingTransaction, type SupportTicket, type SupportMessage, type SSHKey, type ServerMetric, type IPBan, type InsertIPBan, type Snapshot, type InsertSnapshot, type DocSection, type DocArticle, type InsertDocSection, type InsertDocArticle } from "@shared/schema";
import { db } from "./db";
import { eq, desc, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { sql } from 'drizzle-orm';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>; // Added for admin dashboard
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  getServer(id: number): Promise<Server | undefined>;
  getServersByUser(userId: number): Promise<Server[]>;
  getAllServers(): Promise<Server[]>; // Already exists, confirmed
  createServer(server: Omit<Server, "id">): Promise<Server>;
  updateServer(id: number, updates: Partial<Server>): Promise<Server>;
  deleteServer(id: number): Promise<void>;

  getVolume(id: number): Promise<Volume | undefined>;
  getVolumesByServer(serverId: number): Promise<Volume[]>;
  getUnattachedVolumes(): Promise<Volume[]>;
  createVolume(volume: Omit<Volume, "id">): Promise<Volume>;
  deleteVolume(id: number): Promise<void>;
  updateVolume(volume: Volume): Promise<Volume>;

  // Server metrics methods
  createServerMetric(metric: Omit<ServerMetric, "id">): Promise<ServerMetric>;
  getLatestServerMetric(serverId: number): Promise<ServerMetric | undefined>;
  getServerMetricHistory(serverId: number, limit?: number): Promise<ServerMetric[]>;

  createTransaction(transaction: Omit<BillingTransaction, "id">): Promise<BillingTransaction>;
  getTransactionsByUser(userId: number): Promise<BillingTransaction[]>;
  getAllTransactions(): Promise<BillingTransaction[]>; // Added for admin dashboard

  createTicket(ticket: Omit<SupportTicket, "id" | "createdAt" | "updatedAt">): Promise<SupportTicket>;
  getTicket(id: number): Promise<SupportTicket | undefined>;
  getTicketsByUser(userId: number): Promise<SupportTicket[]>;
  getTicketsByServer(serverId: number): Promise<SupportTicket[]>;
  getAllTickets(): Promise<SupportTicket[]>;
  updateTicketStatus(id: number, status: string): Promise<SupportTicket>;
  updateTicketPriority(id: number, priority: string): Promise<SupportTicket>;
  updateTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket>;
  deleteTicket(id: number): Promise<void>;

  createMessage(message: Omit<SupportMessage, "id" | "createdAt" | "isRead">): Promise<SupportMessage>;
  getMessagesByTicket(ticketId: number): Promise<SupportMessage[]>;
  updateMessage(id: number, updates: Partial<SupportMessage>): Promise<SupportMessage>;
  deleteMessage(id: number): Promise<void>;

  getSSHKeysByUser(userId: number): Promise<SSHKey[]>;
  createSSHKey(key: Omit<SSHKey, "id">): Promise<SSHKey>;
  getSSHKey(id: number): Promise<SSHKey | undefined>;
  updateSSHKey(id: number, updates: Partial<SSHKey>): Promise<SSHKey>;
  deleteSSHKey(id: number): Promise<void>;

  // IP Ban functionality
  getIPBan(ipAddress: string): Promise<IPBan | undefined>;
  getAllIPBans(): Promise<IPBan[]>;
  createIPBan(ban: Omit<IPBan, "id" | "createdAt">): Promise<IPBan>;
  updateIPBan(id: number, updates: Partial<IPBan>): Promise<IPBan>;
  deleteIPBan(id: number): Promise<void>;

  // Snapshot functionality
  getSnapshot(id: number): Promise<Snapshot | undefined>;
  getSnapshotsByServer(serverId: number): Promise<Snapshot[]>;
  getSnapshotsByUser(userId: number): Promise<Snapshot[]>;
  createSnapshot(snapshot: Omit<Snapshot, "id">): Promise<Snapshot>;
  updateSnapshot(id: number, updates: Partial<Snapshot>): Promise<Snapshot>;
  deleteSnapshot(id: number): Promise<void>;

  // Documentation methods
  createDocSection(section: InsertDocSection): Promise<DocSection>;
  getDocSection(id: number): Promise<DocSection | undefined>;
  getAllDocSections(): Promise<DocSection[]>;
  updateDocSection(id: number, updates: Partial<DocSection>): Promise<DocSection>;
  deleteDocSection(id: number): Promise<void>;

  createDocArticle(article: InsertDocArticle): Promise<DocArticle>;
  getDocArticle(id: number): Promise<DocArticle | undefined>;
  getDocArticlesBySection(sectionId: number): Promise<DocArticle[]>;
  getAllDocArticles(): Promise<DocArticle[]>;
  updateDocArticle(id: number, updates: Partial<DocArticle>): Promise<DocArticle>;
  deleteDocArticle(id: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Configure session store with more robust settings
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session', // Specify the table name explicitly
      schemaName: 'public', // Specify the schema name
      ttl: 86400, // Session time-to-live in seconds (24 hours)
      disableTouch: false, // Update expiration on session reads
      // Error handler for the session store
      errorLog: (error) => {
        console.error('Session store error:', error.message);
      }
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: sql`balance + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getServer(id: number): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server;
  }

  async getServersByUser(userId: number): Promise<Server[]> {
    try {
      // Use raw SQL query with snake_case column names
      const query = `SELECT id, user_id, name, droplet_id, region, size, status, ip_address, 
        ipv6_address, specs, application, last_monitored, root_password, is_suspended, created_at
        FROM servers WHERE user_id = $1`;
      const result = await pool.query(query, [userId]);

      // Convert snake_case keys to camelCase
      return result.rows.map(row => ({
        id: Number(row.id),
        userId: Number(row.user_id),
        name: String(row.name),
        dropletId: String(row.droplet_id),
        region: String(row.region),
        size: String(row.size),
        status: String(row.status),
        ipAddress: row.ip_address ? String(row.ip_address) : null,
        ipv6Address: row.ipv6_address ? String(row.ipv6_address) : null,
        specs: row.specs,
        application: row.application ? String(row.application) : null,
        lastMonitored: row.last_monitored ? new Date(row.last_monitored) : null,
        rootPassword: row.root_password ? String(row.root_password) : null,
        isSuspended: Boolean(row.is_suspended),
        createdAt: row.created_at ? new Date(row.created_at) : new Date()
      }));
    } catch (error) {
      console.error("Error getting servers by user:", error);
      // Return empty array instead of throwing
      return [];
    }
  }

  async createServer(server: Omit<Server, "id">): Promise<Server> {
    const [newServer] = await db.insert(servers).values(server).returning();
    return newServer;
  }

  async getAllServers(): Promise<Server[]> {
    try {
      // Use raw SQL query with snake_case column names
      const query = `SELECT id, user_id, name, droplet_id, region, size, status, ip_address, 
        ipv6_address, specs, application, last_monitored, root_password, is_suspended, created_at
        FROM servers`;
      const result = await pool.query(query);

      // Convert snake_case keys to camelCase
      return result.rows.map(row => ({
        id: Number(row.id),
        userId: Number(row.user_id),
        name: String(row.name),
        dropletId: String(row.droplet_id),
        region: String(row.region),
        size: String(row.size),
        status: String(row.status),
        ipAddress: row.ip_address ? String(row.ip_address) : null,
        ipv6Address: row.ipv6_address ? String(row.ipv6_address) : null,
        specs: row.specs,
        application: row.application ? String(row.application) : null,
        lastMonitored: row.last_monitored ? new Date(row.last_monitored) : null,
        rootPassword: row.root_password ? String(row.root_password) : null,
        isSuspended: Boolean(row.is_suspended),
        createdAt: row.created_at ? new Date(row.created_at) : new Date()
      }));
    } catch (error) {
      console.error("Error getting all servers:", error);
      // Return empty array instead of throwing
      return [];
    }
  }

  async updateServer(id: number, updates: Partial<Server>): Promise<Server> {
    const [updatedServer] = await db
      .update(servers)
      .set(updates)
      .where(eq(servers.id, id))
      .returning();
    return updatedServer;
  }

  async deleteServer(id: number): Promise<void> {
    await db.delete(servers).where(eq(servers.id, id));
  }

  async getVolume(id: number): Promise<Volume | undefined> {
    const [volume] = await db.select().from(volumes).where(eq(volumes.id, id));
    return volume;
  }

  async getVolumesByServer(serverId: number): Promise<Volume[]> {
    return await db.select().from(volumes).where(eq(volumes.serverId, serverId));
  }

  async getUnattachedVolumes(): Promise<Volume[]> {
    return await db.select().from(volumes).where(isNull(volumes.serverId));
  }

  async createVolume(volume: Omit<Volume, "id">): Promise<Volume> {
    const [newVolume] = await db.insert(volumes).values(volume).returning();
    return newVolume;
  }

  async deleteVolume(id: number): Promise<void> {
    await db.delete(volumes).where(eq(volumes.id, id));
  }

  async updateVolume(volume: Volume): Promise<Volume> {
    const [updatedVolume] = await db
      .update(volumes)
      .set(volume)
      .where(eq(volumes.id, volume.id))
      .returning();
    return updatedVolume;
  }

  async createTransaction(transaction: Omit<BillingTransaction, "id">): Promise<BillingTransaction> {
    const [newTransaction] = await db.insert(billingTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getTransactionsByUser(userId: number): Promise<BillingTransaction[]> {
    return await db
      .select()
      .from(billingTransactions)
      .where(eq(billingTransactions.userId, userId))
      .orderBy(billingTransactions.createdAt);
  }

  async getAllTransactions(): Promise<BillingTransaction[]> {
    return await db
      .select()
      .from(billingTransactions)
      .orderBy(desc(billingTransactions.createdAt));
  }

  async createTicket(ticket: Omit<SupportTicket, "id" | "createdAt" | "updatedAt">): Promise<SupportTicket> {
    const [newTicket] = await db.insert(supportTickets)
      .values({
        ...ticket,
        status: 'open',
      })
      .returning();
    return newTicket;
  }

  async getTicket(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket;
  }

  async getTicketsByUser(userId: number): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(sql`${supportTickets.updatedAt} DESC`);
  }

  async getTicketsByServer(serverId: number): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.serverId, serverId))
      .orderBy(sql`${supportTickets.updatedAt} DESC`);
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .orderBy(sql`${supportTickets.updatedAt} DESC`);
  }

  async updateTicketStatus(id: number, status: string): Promise<SupportTicket> {
    const [updatedTicket] = await db.update(supportTickets)
      .set({
        status,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket;
  }

  async updateTicketPriority(id: number, priority: string): Promise<SupportTicket> {
    const [updatedTicket] = await db.update(supportTickets)
      .set({
        priority,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket;
  }

  async updateTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const [updatedTicket] = await db.update(supportTickets)
      .set({
        ...updates,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket;
  }

  async createMessage(message: Omit<SupportMessage, "id" | "createdAt" | "isRead">): Promise<SupportMessage> {
    const [newMessage] = await db.insert(supportMessages)
      .values({
        ...message,
        isRead: false
      })
      .returning();
    return newMessage;
  }

  async getMessagesByTicket(ticketId: number): Promise<SupportMessage[]> {
    return await db.select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, ticketId))
      .orderBy(sql`${supportMessages.createdAt} ASC`);
  }

  async updateMessage(id: number, updates: Partial<SupportMessage>): Promise<SupportMessage> {
    const [updatedMessage] = await db.update(supportMessages)
      .set(updates)
      .where(eq(supportMessages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(supportMessages).where(eq(supportMessages.id, id));
  }

  async deleteTicket(id: number): Promise<void> {
    await db.delete(supportTickets).where(eq(supportTickets.id, id));
  }

  async getSSHKeysByUser(userId: number): Promise<SSHKey[]> {
    return await db.select().from(sshKeys).where(eq(sshKeys.userId, userId));
  }

  async createSSHKey(key: Omit<SSHKey, "id">): Promise<SSHKey> {
    const [newKey] = await db.insert(sshKeys).values(key).returning();
    return newKey;
  }

  async getSSHKey(id: number): Promise<SSHKey | undefined> {
    const [key] = await db.select().from(sshKeys).where(eq(sshKeys.id, id));
    return key;
  }

  async updateSSHKey(id: number, updates: Partial<SSHKey>): Promise<SSHKey> {
    const [updatedKey] = await db.update(sshKeys)
      .set(updates)
      .where(eq(sshKeys.id, id))
      .returning();
    return updatedKey;
  }

  async deleteSSHKey(id: number): Promise<void> {
    await db.delete(sshKeys).where(eq(sshKeys.id, id));
  }

  // Server metrics implementation
  async createServerMetric(metric: Omit<ServerMetric, "id">): Promise<ServerMetric> {
    const [newMetric] = await db.insert(serverMetrics).values(metric).returning();
    return newMetric;
  }

  async getLatestServerMetric(serverId: number): Promise<ServerMetric | undefined> {
    const [metric] = await db
      .select()
      .from(serverMetrics)
      .where(eq(serverMetrics.serverId, serverId))
      .orderBy(desc(serverMetrics.timestamp))
      .limit(1);
    return metric;
  }

  async getServerMetricHistory(serverId: number, limit: number = 24): Promise<ServerMetric[]> {
    return await db
      .select()
      .from(serverMetrics)
      .where(eq(serverMetrics.serverId, serverId))
      .orderBy(desc(serverMetrics.timestamp))
      .limit(limit);
  }

  // IP Ban Implementation
  async getIPBan(ipAddress: string): Promise<IPBan | undefined> {
    const [ban] = await db.select()
      .from(ipBans)
      .where(eq(ipBans.ipAddress, ipAddress));
    return ban;
  }

  async getAllIPBans(): Promise<IPBan[]> {
    return await db.select()
      .from(ipBans)
      .orderBy(desc(ipBans.createdAt));
  }

  async createIPBan(ban: Omit<IPBan, "id" | "createdAt">): Promise<IPBan> {
    const [newBan] = await db.insert(ipBans)
      .values(ban)
      .returning();
    return newBan;
  }

  async updateIPBan(id: number, updates: Partial<IPBan>): Promise<IPBan> {
    const [updatedBan] = await db.update(ipBans)
      .set(updates)
      .where(eq(ipBans.id, id))
      .returning();
    return updatedBan;
  }

  async deleteIPBan(id: number): Promise<void> {
    await db.delete(ipBans).where(eq(ipBans.id, id));
  }

  // Snapshot implementation
  async getSnapshot(id: number): Promise<Snapshot | undefined> {
    const [snapshot] = await db.select()
      .from(snapshots)
      .where(eq(snapshots.id, id));
    return snapshot;
  }

  async getSnapshotsByServer(serverId: number): Promise<Snapshot[]> {
    return await db.select()
      .from(snapshots)
      .where(eq(snapshots.serverId, serverId))
      .orderBy(desc(snapshots.createdAt));
  }

  async getSnapshotsByUser(userId: number): Promise<Snapshot[]> {
    return await db.select()
      .from(snapshots)
      .where(eq(snapshots.userId, userId))
      .orderBy(desc(snapshots.createdAt));
  }

  async createSnapshot(snapshot: Omit<Snapshot, "id">): Promise<Snapshot> {
    const [newSnapshot] = await db.insert(snapshots)
      .values(snapshot)
      .returning();
    return newSnapshot;
  }

  async updateSnapshot(id: number, updates: Partial<Snapshot>): Promise<Snapshot> {
    const [updatedSnapshot] = await db.update(snapshots)
      .set(updates)
      .where(eq(snapshots.id, id))
      .returning();
    return updatedSnapshot;
  }

  async deleteSnapshot(id: number): Promise<void> {
    await db.delete(snapshots).where(eq(snapshots.id, id));
  }

  // Documentation methods implementation
  async createDocSection(section: InsertDocSection): Promise<DocSection> {
    const [newSection] = await db.insert(docSections).values(section).returning();
    return newSection;
  }

  async getDocSection(id: number): Promise<DocSection | undefined> {
    const [section] = await db.select().from(docSections).where(eq(docSections.id, id));
    return section;
  }

  async getAllDocSections(): Promise<DocSection[]> {
    return await db.select().from(docSections).orderBy(docSections.order);
  }

  async updateDocSection(id: number, updates: Partial<DocSection>): Promise<DocSection> {
    const [section] = await db.update(docSections)
      .set(updates)
      .where(eq(docSections.id, id))
      .returning();
    return section;
  }

  async deleteDocSection(id: number): Promise<void> {
    await db.delete(docSections).where(eq(docSections.id, id));
  }

  async createDocArticle(article: InsertDocArticle): Promise<DocArticle> {
    const [newArticle] = await db.insert(docArticles).values(article).returning();
    return newArticle;
  }

  async getDocArticle(id: number): Promise<DocArticle | undefined> {
    const [article] = await db.select().from(docArticles).where(eq(docArticles.id, id));
    return article;
  }

  async getDocArticlesBySection(sectionId: number): Promise<DocArticle[]> {
    return await db.select()
      .from(docArticles)
      .where(eq(docArticles.sectionId, sectionId))
      .orderBy(docArticles.order);
  }

  async getAllDocArticles(): Promise<DocArticle[]> {
    return await db.select().from(docArticles).orderBy(docArticles.order);
  }

  async updateDocArticle(id: number, updates: Partial<DocArticle>): Promise<DocArticle> {
    const [article] = await db.update(docArticles)
      .set(updates)
      .where(eq(docArticles.id, id))
      .returning();
    return article;
  }

  async deleteDocArticle(id: number): Promise<void> {
    await db.delete(docArticles).where(eq(docArticles.id, id));
  }
}

export const storage = new DatabaseStorage();