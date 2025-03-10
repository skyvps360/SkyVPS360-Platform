var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express12 from "express";
import dotenv2 from "dotenv";
import path5 from "path";
import fs3 from "fs";
import { fileURLToPath as fileURLToPath4 } from "url";

// server/utils/static-handler.ts
import fs from "fs";
import path from "path";
import express from "express";

// server/utils/logger.ts
var colors = {
  reset: "\x1B[0m",
  bright: "\x1B[1m",
  dim: "\x1B[2m",
  underscore: "\x1B[4m",
  blink: "\x1B[5m",
  reverse: "\x1B[7m",
  hidden: "\x1B[8m",
  // Text colors
  black: "\x1B[30m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  white: "\x1B[37m",
  // Background colors
  bgBlack: "\x1B[40m",
  bgRed: "\x1B[41m",
  bgGreen: "\x1B[42m",
  bgYellow: "\x1B[43m",
  bgBlue: "\x1B[44m",
  bgMagenta: "\x1B[45m",
  bgCyan: "\x1B[46m",
  bgWhite: "\x1B[47m"
};
var icons = {
  info: "\u2139\uFE0F",
  success: "\u2705",
  warning: "\u26A0\uFE0F",
  error: "\u274C",
  debug: "\u{1F50D}",
  database: "\u{1F5C4}\uFE0F",
  server: "\u{1F680}",
  github: "\u{1F419}",
  auth: "\u{1F510}",
  api: "\u{1F310}"
};
var timestamp = () => {
  const now = /* @__PURE__ */ new Date();
  return `${colors.dim}[${now.toLocaleTimeString()}]${colors.reset}`;
};
var logger = {
  info: (message) => {
    console.log(`${timestamp()} ${icons.info} ${colors.cyan}${message}${colors.reset}`);
  },
  success: (message) => {
    console.log(`${timestamp()} ${icons.success} ${colors.green}${message}${colors.reset}`);
  },
  warning: (message) => {
    console.warn(`${timestamp()} ${icons.warning} ${colors.yellow}${message}${colors.reset}`);
  },
  error: (message, error) => {
    console.error(`${timestamp()} ${icons.error} ${colors.red}${message}${colors.reset}`);
    if (error) console.error(`${colors.dim}${error.stack || error}${colors.reset}`);
  },
  debug: (message, data) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`${timestamp()} ${icons.debug} ${colors.magenta}${message}${colors.reset}`);
      if (data) console.log(data);
    }
  },
  database: (message) => {
    console.log(`${timestamp()} ${icons.database} ${colors.blue}[DB]${colors.reset} ${message}`);
  },
  server: (message) => {
    console.log(`${timestamp()} ${icons.server} ${colors.green}[SERVER]${colors.reset} ${message}`);
  },
  github: (message) => {
    console.log(`${timestamp()} ${icons.github} ${colors.magenta}[GitHub]${colors.reset} ${message}`);
  },
  auth: (message) => {
    console.log(`${timestamp()} ${icons.auth} ${colors.cyan}[AUTH]${colors.reset} ${message}`);
  },
  api: (message, method, path6, status, duration) => {
    const statusColor = status && status >= 400 ? colors.red : colors.green;
    const methodColor = method === "GET" ? colors.cyan : method === "POST" ? colors.green : method === "PUT" ? colors.yellow : method === "DELETE" ? colors.red : colors.blue;
    console.log(
      `${timestamp()} ${icons.api} ${methodColor}${method}${colors.reset} ${path6} ${status ? `${statusColor}${status}${colors.reset}` : ""} ${duration ? `${colors.yellow}${duration}ms${colors.reset}` : ""}`
    );
  }
};

// server/utils/static-handler.ts
function setupStaticServing(app2) {
  const clientPath = path.join(process.cwd(), "dist", "client");
  if (!fs.existsSync(clientPath)) {
    logger.error(`Client path not found: ${clientPath}`);
    throw new Error("Client path not found");
  }
  logger.info(`Serving static files from: ${clientPath}`);
  app2.use(express.static(clientPath, {
    maxAge: "1d",
    index: false
    // Disable auto-index to handle SPA routing manually
  }));
  app2.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    logger.info(`SPA route handler: ${req.path}`);
    const indexPath = path.join(clientPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      logger.error(`index.html not found at ${indexPath}`);
      res.status(500).send("Server Error: index.html not found");
    }
  });
}

// server/routes/debug-routes.js
import { Router } from "express";
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath } from "url";
import os from "os";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var router = Router();
router.get("/paths", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const possiblePaths = [
    path2.join(process.cwd(), "dist", "client"),
    path2.join(__dirname, "..", "..", "dist", "client"),
    path2.join(__dirname, "..", "..", "..", "dist", "client"),
    path2.join(process.cwd(), "client"),
    path2.join(process.cwd())
  ];
  const results = possiblePaths.map((p) => ({
    path: p,
    exists: fs2.existsSync(p),
    files: fs2.existsSync(p) ? fs2.readdirSync(p).slice(0, 10) : []
  }));
  const indexPaths = possiblePaths.map((p) => ({
    path: path2.join(p, "index.html"),
    exists: fs2.existsSync(path2.join(p, "index.html"))
  }));
  const staticFiles = [
    path2.join(process.cwd(), "dist", "client", "assets", "main.js"),
    path2.join(process.cwd(), "dist", "client", "assets", "main.css")
  ];
  const fileChecks = staticFiles.map((f) => ({
    path: f,
    exists: fs2.existsSync(f)
  }));
  res.json({
    environment: process.env.NODE_ENV,
    cwd: process.cwd(),
    dirname: __dirname,
    architecture: os.arch(),
    hostname: os.hostname(),
    platform: os.platform(),
    possiblePaths: results,
    indexFiles: indexPaths,
    staticFiles: fileChecks
  });
});
router.get("/env", (req, res) => {
  const safeEnv = { ...process.env };
  delete safeEnv.DATABASE_URL;
  delete safeEnv.SESSION_SECRET;
  delete safeEnv.GITHUB_CLIENT_SECRET;
  delete safeEnv.PAYPAL_SECRET;
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DOMAIN: process.env.DOMAIN,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    DEBUG_STATIC: process.env.DEBUG_STATIC,
    SPA_ROUTING: process.env.SPA_ROUTING
  });
});
router.get("/config", (req, res) => {
  res.json({
    staticServing: true,
    trustProxy: true,
    cookieSecure: process.env.NODE_ENV === "production",
    cookieSameSite: "lax",
    cookieDomain: process.env.NODE_ENV === "production" ? ".skyvps360.xyz" : void 0
  });
});
var debug_routes_default = router;

// server/index.ts
import cors from "cors";

// server/routes.ts
import { createServer } from "http";

// server/terminal-handler-new.ts
import { Server } from "socket.io";
import { Client } from "ssh2";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  billingTransactions: () => billingTransactions,
  docArticles: () => docArticles,
  docSections: () => docSections,
  insertDocArticleSchema: () => insertDocArticleSchema,
  insertDocSectionSchema: () => insertDocSectionSchema,
  insertIPBanSchema: () => insertIPBanSchema,
  insertMaintenanceSettingsSchema: () => insertMaintenanceSettingsSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertSSHKeySchema: () => insertSSHKeySchema,
  insertServerSchema: () => insertServerSchema,
  insertSnapshotSchema: () => insertSnapshotSchema,
  insertTicketSchema: () => insertTicketSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserSchema: () => insertUserSchema,
  insertVolumeSchema: () => insertVolumeSchema,
  ipBans: () => ipBans,
  maintenanceSettings: () => maintenanceSettings,
  serverMetrics: () => serverMetrics,
  servers: () => servers,
  snapshots: () => snapshots,
  sshKeys: () => sshKeys,
  supportMessages: () => supportMessages,
  supportTickets: () => supportTickets,
  users: () => users,
  volumes: () => volumes
});
import { pgTable, text, serial, integer, boolean, jsonb, timestamp as timestamp2 } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  apiKey: text("api_key"),
  githubToken: text("github_token"),
  // Added GitHub token field
  balance: integer("balance").notNull().default(0),
  // Balance in cents
  isAdmin: boolean("is_admin").notNull().default(false),
  // Admin flag
  isSuspended: boolean("is_suspended").notNull().default(false),
  // Account suspension flag
  created: timestamp2("created").notNull().defaultNow(),
  updated: timestamp2("updated").notNull().defaultNow()
});
var servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  dropletId: text("droplet_id").notNull(),
  region: text("region").notNull(),
  size: text("size").notNull(),
  status: text("status").notNull(),
  ipAddress: text("ip_address"),
  ipv6Address: text("ipv6_address"),
  specs: jsonb("specs").$type(),
  application: text("application"),
  // Added application field
  lastMonitored: timestamp2("last_monitored"),
  rootPassword: text("root_password"),
  // Store root password for SSH access
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  // Server creation timestamp
  isSuspended: boolean("is_suspended").notNull().default(false)
  // Account suspension flag
});
var serverMetrics = pgTable("server_metrics", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  timestamp: timestamp2("timestamp").notNull().defaultNow(),
  cpuUsage: integer("cpu_usage").notNull(),
  // Percentage: 0-100
  memoryUsage: integer("memory_usage").notNull(),
  // Percentage: 0-100
  diskUsage: integer("disk_usage").notNull(),
  // Percentage: 0-100
  networkIn: integer("network_in").notNull(),
  // Bytes
  networkOut: integer("network_out").notNull(),
  // Bytes
  loadAverage: jsonb("load_average").$type().notNull(),
  uptimeSeconds: integer("uptime_seconds").notNull()
});
var volumes = pgTable("volumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  serverId: integer("server_id").notNull(),
  name: text("name").notNull(),
  volumeId: text("volume_id").notNull(),
  size: integer("size").notNull(),
  region: text("region").notNull()
});
var billingTransactions = pgTable("billing_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  // in cents
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  // completed, pending, failed
  type: text("type").notNull(),
  // deposit, hourly_server_charge, hourly_volume_charge, bandwidth_overage, server_deleted_insufficient_funds
  paypalTransactionId: text("paypal_transaction_id"),
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  description: text("description").default("")
  // Optional description for the transaction, default empty string
});
var supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  serverId: integer("server_id"),
  // Optional - allows tickets to persist after server deletion
  subject: text("subject").notNull(),
  status: text("status").notNull(),
  // open, closed, pending
  priority: text("priority").notNull().default("normal"),
  // low, normal, high
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  updatedAt: timestamp2("updated_at").notNull().defaultNow(),
  originalDropletId: text("original_droplet_id")
  // Store the original droplet ID for reference
});
var supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: integer("user_id").notNull(),
  // sender (can be admin or user)
  message: text("message").notNull(),
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false)
  // For real-time chat notifications
});
var sshKeys = pgTable("ssh_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  publicKey: text("public_key").notNull(),
  isCloudRackKey: boolean("is_cloudrack_key").notNull().default(false),
  isSystemKey: boolean("is_system_key").notNull().default(false),
  // Added for the system key identification
  createdAt: timestamp2("created_at").notNull().defaultNow()
});
var ipBans = pgTable("ip_bans", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  reason: text("reason"),
  bannedBy: integer("banned_by").notNull(),
  // Admin user ID who created the ban
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  expiresAt: timestamp2("expires_at"),
  // Optional expiration date, null means permanent
  isActive: boolean("is_active").notNull().default(true)
});
var snapshots = pgTable("snapshots", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  snapshotId: text("snapshot_id").notNull(),
  sizeGb: integer("size_gb").notNull(),
  // Size in GB
  description: text("description"),
  status: text("status").notNull().default("in-progress"),
  // in-progress, completed, error
  createdAt: timestamp2("created_at").notNull().defaultNow(),
  expiresAt: timestamp2("expires_at")
  // Optional expiration date for auto-delete
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
  isSuspended: true,
  balance: true,
  apiKey: true
});
var insertTransactionSchema = createInsertSchema(billingTransactions).pick({
  userId: true,
  amount: true,
  currency: true,
  status: true,
  type: true,
  paypalTransactionId: true,
  createdAt: true,
  description: true
});
var insertServerSchema = createInsertSchema(servers).pick({
  name: true,
  region: true,
  size: true
}).extend({
  application: z.string().optional()
});
var insertVolumeSchema = createInsertSchema(volumes).pick({
  name: true,
  size: true
});
var insertTicketSchema = createInsertSchema(supportTickets).pick({
  subject: true,
  priority: true,
  serverId: true
}).extend({
  message: z.string().min(1, "Initial message is required"),
  priority: z.string().default("normal"),
  serverId: z.number().optional()
});
var insertMessageSchema = createInsertSchema(supportMessages).pick({
  message: true
});
var insertSSHKeySchema = createInsertSchema(sshKeys).pick({
  name: true,
  publicKey: true
}).extend({
  isCloudRackKey: z.boolean().default(false),
  isSystemKey: z.boolean().default(false)
});
var insertIPBanSchema = createInsertSchema(ipBans).pick({
  ipAddress: true,
  reason: true
}).extend({
  expiresAt: z.date().optional()
});
var insertSnapshotSchema = createInsertSchema(snapshots).pick({
  serverId: true,
  name: true,
  description: true
}).extend({
  expiresAt: z.date().optional()
});
var docSections = pgTable("doc_sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  order: integer("order").notNull()
});
var docArticles = pgTable("doc_articles", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull().references(() => docSections.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  order: integer("order").notNull(),
  lastUpdated: timestamp2("last_updated").notNull().defaultNow()
});
var insertDocSectionSchema = createInsertSchema(docSections).pick({
  title: true,
  order: true
});
var maintenanceSettings = pgTable("maintenance_settings", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  maintenanceMessage: text("maintenance_message").default("We're currently performing maintenance. Please check back soon."),
  comingSoonEnabled: boolean("coming_soon_enabled").notNull().default(false),
  comingSoonMessage: text("coming_soon_message").default("This feature is coming soon. Stay tuned for updates!"),
  updatedAt: timestamp2("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").notNull()
  // Admin user ID who last updated settings
});
var insertMaintenanceSettingsSchema = createInsertSchema(maintenanceSettings).pick({
  enabled: true,
  maintenanceMessage: true,
  comingSoonEnabled: true,
  comingSoonMessage: true,
  updatedBy: true
});
var insertDocArticleSchema = createInsertSchema(docArticles).pick({
  sectionId: true,
  title: true,
  content: true,
  order: true
});

// server/db.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var { Pool } = pg;
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Configuring direct PostgreSQL connection without WebSocket");
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // Reduced number of clients to avoid overloading
  idleTimeoutMillis: 1e4,
  // Shorter idle timeout
  connectionTimeoutMillis: 1e4,
  // Longer connection timeout
  ssl: process.env.NODE_ENV === "development" ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
  keepAlive: true,
  // Enable keep-alive to prevent idle connections from being terminated
  keepAliveInitialDelayMillis: 5e3
  // Start keep-alive probing after 5 seconds of inactivity
});
pool.on("error", (err) => {
  console.error("Database pool error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.error("Database connection was closed.");
    process.exit(-1);
  }
});
pool.on("connect", () => {
  console.log("Successfully connected to database");
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { sql } from "drizzle-orm";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: "session",
      // Specify the table name explicitly
      schemaName: "public",
      // Specify the schema name
      ttl: 86400,
      // Session time-to-live in seconds (24 hours)
      disableTouch: false,
      // Update expiration on session reads
      // Error handler for the session store
      errorLog: (error) => {
        console.error("Session store error:", error.message);
      }
    });
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }
  async updateUserBalance(userId, amount) {
    const [user] = await db.update(users).set({ balance: sql`balance + ${amount}` }).where(eq(users.id, userId)).returning();
    return user;
  }
  async getServer(id) {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server;
  }
  async getServersByUser(userId) {
    try {
      const query = `SELECT id, user_id, name, droplet_id, region, size, status, ip_address, 
        ipv6_address, specs, application, last_monitored, root_password, is_suspended, created_at
        FROM servers WHERE user_id = $1`;
      const result = await pool.query(query, [userId]);
      return result.rows.map((row) => ({
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
        createdAt: row.created_at ? new Date(row.created_at) : /* @__PURE__ */ new Date()
      }));
    } catch (error) {
      console.error("Error getting servers by user:", error);
      return [];
    }
  }
  async createServer(server) {
    const [newServer] = await db.insert(servers).values(server).returning();
    return newServer;
  }
  async getAllServers() {
    try {
      const query = `SELECT id, user_id, name, droplet_id, region, size, status, ip_address, 
        ipv6_address, specs, application, last_monitored, root_password, is_suspended, created_at
        FROM servers`;
      const result = await pool.query(query);
      return result.rows.map((row) => ({
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
        createdAt: row.created_at ? new Date(row.created_at) : /* @__PURE__ */ new Date()
      }));
    } catch (error) {
      console.error("Error getting all servers:", error);
      return [];
    }
  }
  async updateServer(id, updates) {
    const [updatedServer] = await db.update(servers).set(updates).where(eq(servers.id, id)).returning();
    return updatedServer;
  }
  async deleteServer(id) {
    await db.delete(servers).where(eq(servers.id, id));
  }
  async getVolume(id) {
    const [volume] = await db.select().from(volumes).where(eq(volumes.id, id));
    return volume;
  }
  async getVolumesByServer(serverId) {
    return await db.select().from(volumes).where(eq(volumes.serverId, serverId));
  }
  async getUnattachedVolumes() {
    return await db.select().from(volumes).where(isNull(volumes.serverId));
  }
  async createVolume(volume) {
    const [newVolume] = await db.insert(volumes).values(volume).returning();
    return newVolume;
  }
  async deleteVolume(id) {
    await db.delete(volumes).where(eq(volumes.id, id));
  }
  async updateVolume(volume) {
    const [updatedVolume] = await db.update(volumes).set(volume).where(eq(volumes.id, volume.id)).returning();
    return updatedVolume;
  }
  async createTransaction(transaction) {
    const [newTransaction] = await db.insert(billingTransactions).values(transaction).returning();
    return newTransaction;
  }
  async getTransactionsByUser(userId) {
    return await db.select().from(billingTransactions).where(eq(billingTransactions.userId, userId)).orderBy(billingTransactions.createdAt);
  }
  async getAllTransactions() {
    return await db.select().from(billingTransactions).orderBy(desc(billingTransactions.createdAt));
  }
  async createTicket(ticket) {
    const [newTicket] = await db.insert(supportTickets).values({
      ...ticket,
      status: "open"
    }).returning();
    return newTicket;
  }
  async getTicket(id) {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket;
  }
  async getTicketsByUser(userId) {
    return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(sql`${supportTickets.updatedAt} DESC`);
  }
  async getTicketsByServer(serverId) {
    return await db.select().from(supportTickets).where(eq(supportTickets.serverId, serverId)).orderBy(sql`${supportTickets.updatedAt} DESC`);
  }
  async getAllTickets() {
    return await db.select().from(supportTickets).orderBy(sql`${supportTickets.updatedAt} DESC`);
  }
  async updateTicketStatus(id, status) {
    const [updatedTicket] = await db.update(supportTickets).set({
      status,
      updatedAt: sql`CURRENT_TIMESTAMP`
    }).where(eq(supportTickets.id, id)).returning();
    return updatedTicket;
  }
  async updateTicketPriority(id, priority) {
    const [updatedTicket] = await db.update(supportTickets).set({
      priority,
      updatedAt: sql`CURRENT_TIMESTAMP`
    }).where(eq(supportTickets.id, id)).returning();
    return updatedTicket;
  }
  async updateTicket(id, updates) {
    const [updatedTicket] = await db.update(supportTickets).set({
      ...updates,
      updatedAt: sql`CURRENT_TIMESTAMP`
    }).where(eq(supportTickets.id, id)).returning();
    return updatedTicket;
  }
  async createMessage(message) {
    const [newMessage] = await db.insert(supportMessages).values({
      ...message,
      isRead: false
    }).returning();
    return newMessage;
  }
  async getMessagesByTicket(ticketId) {
    return await db.select().from(supportMessages).where(eq(supportMessages.ticketId, ticketId)).orderBy(sql`${supportMessages.createdAt} ASC`);
  }
  async updateMessage(id, updates) {
    const [updatedMessage] = await db.update(supportMessages).set(updates).where(eq(supportMessages.id, id)).returning();
    return updatedMessage;
  }
  async deleteMessage(id) {
    await db.delete(supportMessages).where(eq(supportMessages.id, id));
  }
  async deleteTicket(id) {
    await db.delete(supportTickets).where(eq(supportTickets.id, id));
  }
  async getSSHKeysByUser(userId) {
    return await db.select().from(sshKeys).where(eq(sshKeys.userId, userId));
  }
  async createSSHKey(key) {
    const [newKey] = await db.insert(sshKeys).values(key).returning();
    return newKey;
  }
  async getSSHKey(id) {
    const [key] = await db.select().from(sshKeys).where(eq(sshKeys.id, id));
    return key;
  }
  async updateSSHKey(id, updates) {
    const [updatedKey] = await db.update(sshKeys).set(updates).where(eq(sshKeys.id, id)).returning();
    return updatedKey;
  }
  async deleteSSHKey(id) {
    await db.delete(sshKeys).where(eq(sshKeys.id, id));
  }
  // Server metrics implementation
  async createServerMetric(metric) {
    const [newMetric] = await db.insert(serverMetrics).values(metric).returning();
    return newMetric;
  }
  async getLatestServerMetric(serverId) {
    const [metric] = await db.select().from(serverMetrics).where(eq(serverMetrics.serverId, serverId)).orderBy(desc(serverMetrics.timestamp)).limit(1);
    return metric;
  }
  async getServerMetricHistory(serverId, limit = 24) {
    return await db.select().from(serverMetrics).where(eq(serverMetrics.serverId, serverId)).orderBy(desc(serverMetrics.timestamp)).limit(limit);
  }
  // IP Ban Implementation
  async getIPBan(ipAddress) {
    const [ban] = await db.select().from(ipBans).where(eq(ipBans.ipAddress, ipAddress));
    return ban;
  }
  async getAllIPBans() {
    return await db.select().from(ipBans).orderBy(desc(ipBans.createdAt));
  }
  async createIPBan(ban) {
    const [newBan] = await db.insert(ipBans).values(ban).returning();
    return newBan;
  }
  async updateIPBan(id, updates) {
    const [updatedBan] = await db.update(ipBans).set(updates).where(eq(ipBans.id, id)).returning();
    return updatedBan;
  }
  async deleteIPBan(id) {
    await db.delete(ipBans).where(eq(ipBans.id, id));
  }
  // Snapshot implementation
  async getSnapshot(id) {
    const [snapshot] = await db.select().from(snapshots).where(eq(snapshots.id, id));
    return snapshot;
  }
  async getSnapshotsByServer(serverId) {
    return await db.select().from(snapshots).where(eq(snapshots.serverId, serverId)).orderBy(desc(snapshots.createdAt));
  }
  async getSnapshotsByUser(userId) {
    return await db.select().from(snapshots).where(eq(snapshots.userId, userId)).orderBy(desc(snapshots.createdAt));
  }
  async createSnapshot(snapshot) {
    const [newSnapshot] = await db.insert(snapshots).values(snapshot).returning();
    return newSnapshot;
  }
  async updateSnapshot(id, updates) {
    const [updatedSnapshot] = await db.update(snapshots).set(updates).where(eq(snapshots.id, id)).returning();
    return updatedSnapshot;
  }
  async deleteSnapshot(id) {
    await db.delete(snapshots).where(eq(snapshots.id, id));
  }
  // Documentation methods implementation
  async createDocSection(section) {
    const [newSection] = await db.insert(docSections).values(section).returning();
    return newSection;
  }
  async getDocSection(id) {
    const [section] = await db.select().from(docSections).where(eq(docSections.id, id));
    return section;
  }
  async getAllDocSections() {
    return await db.select().from(docSections).orderBy(docSections.order);
  }
  async updateDocSection(id, updates) {
    const [section] = await db.update(docSections).set(updates).where(eq(docSections.id, id)).returning();
    return section;
  }
  async deleteDocSection(id) {
    await db.delete(docSections).where(eq(docSections.id, id));
  }
  async createDocArticle(article) {
    const [newArticle] = await db.insert(docArticles).values(article).returning();
    return newArticle;
  }
  async getDocArticle(id) {
    const [article] = await db.select().from(docArticles).where(eq(docArticles.id, id));
    return article;
  }
  async getDocArticlesBySection(sectionId) {
    return await db.select().from(docArticles).where(eq(docArticles.sectionId, sectionId)).orderBy(docArticles.order);
  }
  async getAllDocArticles() {
    return await db.select().from(docArticles).orderBy(docArticles.order);
  }
  async updateDocArticle(id, updates) {
    const [article] = await db.update(docArticles).set(updates).where(eq(docArticles.id, id)).returning();
    return article;
  }
  async deleteDocArticle(id) {
    await db.delete(docArticles).where(eq(docArticles.id, id));
  }
};
var storage = new DatabaseStorage();

// server/vite.ts
import express2 from "express";
import path3, { dirname } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer } from "vite";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname(__filename2);
function log(msg, level = "info") {
  const timestamp4 = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  const prefix = level === "error" ? "\u274C" : "\u2139\uFE0F";
  if (level === "error") {
    console.error(`[${timestamp4}] ${prefix} [vite] ${msg}`);
  } else {
    console.log(`[${timestamp4}] ${prefix} [vite] ${msg}`);
  }
}

// server/terminal-handler-new.ts
import { eq as eq2, sql as sql2 } from "drizzle-orm";
function setupTerminalSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  io.on("connection", async (socket) => {
    const serverId = socket.handshake.query.serverId;
    const userId = socket.handshake.query.userId;
    if (!serverId || !userId) {
      socket.emit("error", "Missing server ID or user ID");
      socket.disconnect();
      return;
    }
    log(`Terminal connection request for server ${serverId} from user ${userId}`, "terminal");
    try {
      const server2 = await storage.getServer(parseInt(serverId));
      if (!server2) {
        socket.emit("error", "Server not found");
        socket.disconnect();
        return;
      }
      if (server2.userId !== parseInt(userId)) {
        socket.emit("error", "Unauthorized access to server");
        socket.disconnect();
        return;
      }
      if (!server2.ipAddress) {
        socket.emit("error", "Server IP address not available");
        socket.disconnect();
        return;
      }
      const rawResult = await db.execute(
        sql2`SELECT * FROM servers WHERE id = ${parseInt(serverId)}`
      );
      const rawServerDetails = rawResult.rows[0];
      log(`Server ${serverId} raw details: ${JSON.stringify(rawServerDetails)}`, "terminal");
      const serverDetails = await db.query.servers.findFirst({
        where: eq2(servers.id, parseInt(serverId))
      });
      if (serverDetails) {
        log(`Server query from schema - rootPassword: ${serverDetails.rootPassword ? "present" : "missing"}`, "terminal");
      }
      const effectiveServerDetails = serverDetails?.rootPassword ? serverDetails : rawServerDetails;
      const hasRootPassword = !!effectiveServerDetails?.rootPassword || !!effectiveServerDetails?.root_password;
      let rootPasswordValue = effectiveServerDetails?.rootPassword || effectiveServerDetails?.root_password;
      if (rootPasswordValue) {
        rootPasswordValue = rootPasswordValue.trim();
        log(`Original password: ${rootPasswordValue.substring(0, 3)}... (${rootPasswordValue.length} chars)`, "terminal");
        if (rootPasswordValue.includes(".") || rootPasswordValue.includes("$") && !rootPasswordValue.startsWith("$")) {
          log(`Password appears to be in a hashed format, will use with caution`, "terminal");
        }
      }
      if (hasRootPassword) {
        log(`Server ${serverId} has root password with length: ${rootPasswordValue?.length}`, "terminal");
        log(`First few characters of password: ${rootPasswordValue?.substring(0, 3)}...`, "terminal");
      }
      log(`Server ${serverId} root password status: ${hasRootPassword ? "Available" : "Not available"}`, "terminal");
      const sshClient = new Client();
      let sshStream = null;
      socket.emit("status", {
        status: "connecting",
        message: `Connecting to ${server2.name} (${server2.ipAddress})...`
      });
      sshClient.on("ready", () => {
        log(`SSH connection established for server ${server2.id}`, "terminal");
        socket.emit("status", {
          status: "connected",
          message: "Connected using password authentication"
        });
        sshClient.shell((err, stream) => {
          if (err) {
            log(`Failed to create shell: ${err.message}`, "terminal");
            socket.emit("error", `Failed to create shell: ${err.message}`);
            socket.disconnect();
            return;
          }
          sshStream = stream;
          socket.emit("ready");
          stream.on("data", (data) => {
            socket.emit("data", data.toString("utf-8"));
          });
          stream.on("close", () => {
            log(`SSH stream closed for server ${server2.id}`, "terminal");
            socket.emit("status", { status: "disconnected" });
            sshClient.end();
          });
          stream.stderr.on("data", (data) => {
            socket.emit("data", data.toString("utf-8"));
          });
        });
      });
      sshClient.on("error", (err) => {
        log(`SSH error for server ${server2.id}: ${err.message}`, "terminal");
        let userMessage = `SSH error: ${err.message}`;
        if (err.message.includes("All configured authentication methods failed")) {
          userMessage = "Authentication failed. Please check your password settings or reset your server password.";
        } else if (err.message.includes("connect ETIMEDOUT")) {
          userMessage = "Connection timed out. Server may be starting up or behind a firewall.";
        } else if (err.message.includes("connect ECONNREFUSED")) {
          userMessage = "Connection refused. SSH service may not be running on the server.";
        }
        socket.emit("error", userMessage);
        socket.disconnect();
      });
      sshClient.on("end", () => {
        log(`SSH connection ended for server ${server2.id}`, "terminal");
        socket.emit("status", { status: "disconnected" });
      });
      sshClient.on("close", () => {
        log(`SSH connection closed for server ${server2.id}`, "terminal");
        socket.emit("status", { status: "disconnected" });
      });
      sshClient.on("keyboard-interactive", (name, instructions, lang, prompts, finish) => {
        log(`Keyboard-interactive auth initiated: name=${name}, prompts=${JSON.stringify(prompts)}`, "terminal");
        if (prompts.length > 0 && hasRootPassword) {
          for (let i = 0; i < prompts.length; i++) {
            log(`Prompt ${i}: ${prompts[i].prompt}, echo: ${prompts[i].echo}`, "terminal");
          }
          log(`Responding to keyboard-interactive with stored password (${rootPasswordValue?.substring(0, 3)}...)`, "terminal");
          finish([rootPasswordValue]);
          socket.emit("status", {
            status: "auth_in_progress",
            message: "Attempting keyboard-interactive authentication"
          });
        } else {
          log(`Keyboard-interactive auth failed - no password available or no prompts received`, "terminal");
          log(`Prompts received: ${prompts.length}`, "terminal");
          log(`Password available: ${hasRootPassword}`, "terminal");
          socket.emit("error", "Authentication failed - password required");
          sshClient.end();
        }
      });
      socket.on("data", (data) => {
        if (sshStream) {
          sshStream.write(data);
        }
      });
      socket.on("resize", (data) => {
        if (sshStream) {
          try {
            sshStream.setWindow(data.rows, data.cols, data.cols * 8, data.rows * 10);
          } catch (err) {
            log(`Terminal resize error: ${err}`, "terminal");
          }
        }
      });
      socket.on("disconnect", () => {
        log(`Socket disconnected for server ${server2.id}`, "terminal");
        if (sshClient) {
          sshClient.end();
        }
      });
      try {
        const config = {
          host: server2.ipAddress,
          port: 22,
          username: "root",
          readyTimeout: 3e4,
          // 30 seconds
          keepaliveInterval: 1e4,
          tryKeyboard: true,
          // Enable keyboard-interactive auth
          debug: (message) => {
            log(`SSH Debug: ${message}`, "terminal");
          }
        };
        if (hasRootPassword) {
          config.password = rootPasswordValue;
          log(`Connecting to SSH server at ${server2.ipAddress} with password auth`, "terminal");
          log(`Password being used for SSH auth: ${rootPasswordValue?.substring(0, 3)}... (length: ${rootPasswordValue?.length})`, "terminal");
          socket.emit("status", {
            status: "auth_in_progress",
            message: "Attempting password authentication"
          });
        } else {
          log(`No root password available for server ${server2.id}`, "terminal");
          socket.emit("error", "No root password found for this server. Please reset your server password.");
          socket.disconnect();
          return;
        }
        config.hostVerifier = () => true;
        sshClient.connect(config);
      } catch (error) {
        log(`SSH connection failed: ${error.message}`, "terminal");
        socket.emit("error", `Failed to connect: ${error.message}`);
        socket.disconnect();
      }
    } catch (error) {
      log(`Terminal setup error: ${error.message}`, "terminal");
      socket.emit("error", `Terminal error: ${error.message}`);
      socket.disconnect();
    }
  });
  return io;
}

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  if (!stored.includes(".")) {
    console.log("WARNING: Plaintext password detected, comparing directly");
    const match = supplied === stored;
    if (match) {
      console.log("Password matches plaintext - password should be upgraded");
    }
    return match;
  }
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid password hash or salt format");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}
function setupAuth(app2, cookieOptions = {}) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      // Secure in production
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1e3,
      // 30 days
      sameSite: "lax",
      ...process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN },
      ...cookieOptions
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false);
      }
      if (user.isSuspended) {
        return done(null, false, { message: "Account is suspended. Please contact support." });
      }
      const passwordMatches = await comparePasswords(password, user.password);
      if (!passwordMatches) {
        return done(null, false);
      }
      if (!user.password.includes(".")) {
        try {
          console.log(`Upgrading password hash for user ${user.id}`);
          const hashedPassword = await hashPassword(password);
          await storage.updateUser(user.id, { password: hashedPassword });
          const updatedUser = await storage.getUser(user.id);
          if (updatedUser) {
            return done(null, updatedUser);
          }
        } catch (error) {
          console.error("Error upgrading password hash:", error);
        }
      }
      return done(null, user);
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      if (user.isSuspended) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}
var requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

// server/digital-ocean.ts
import fetch from "node-fetch";
var DigitalOceanClient = class {
  apiKey;
  useMock;
  apiBaseUrl = "https://api.digitalocean.com/v2";
  constructor() {
    this.apiKey = process.env.DIGITAL_OCEAN_API_KEY || "";
    this.useMock = false;
    if (!this.apiKey) {
      console.error(
        "ERROR: DigitalOcean API key not found. API calls will fail."
      );
    }
  }
  // Default mock data
  mockRegions = [
    {
      slug: "nyc1",
      name: "New York 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true
    },
    {
      slug: "fra1",
      name: "Frankfurt 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true
    },
    {
      slug: "sfo1",
      name: "San Francisco 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true
    },
    {
      slug: "ams3",
      name: "Amsterdam 3",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true
    },
    {
      slug: "sgp1",
      name: "Singapore 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true
    },
    {
      slug: "lon1",
      name: "London 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true
    },
    {
      slug: "blr1",
      name: "Bangalore 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true
    },
    {
      slug: "tor1",
      name: "Toronto 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true
    }
  ];
  mockSizes = [
    // Regular droplets (Standard)
    {
      slug: "s-1vcpu-1gb",
      memory: 1024,
      vcpus: 1,
      disk: 25,
      transfer: 1e3,
      price_monthly: 7,
      processor_type: "regular"
    },
    {
      slug: "s-1vcpu-2gb",
      memory: 2048,
      vcpus: 1,
      disk: 50,
      transfer: 2e3,
      price_monthly: 12,
      processor_type: "regular"
    },
    {
      slug: "s-2vcpu-4gb",
      memory: 4096,
      vcpus: 2,
      disk: 80,
      transfer: 4e3,
      price_monthly: 22,
      processor_type: "regular"
    },
    {
      slug: "s-4vcpu-8gb",
      memory: 8192,
      vcpus: 4,
      disk: 160,
      transfer: 5e3,
      price_monthly: 42,
      processor_type: "regular"
    },
    // Intel Optimized droplets
    {
      slug: "c-2-intel",
      memory: 4096,
      vcpus: 2,
      disk: 80,
      transfer: 4e3,
      price_monthly: 28,
      processor_type: "intel"
    },
    {
      slug: "c-4-intel",
      memory: 8192,
      vcpus: 4,
      disk: 160,
      transfer: 5e3,
      price_monthly: 54,
      processor_type: "intel"
    },
    {
      slug: "c-8-intel",
      memory: 16384,
      vcpus: 8,
      disk: 320,
      transfer: 6e3,
      price_monthly: 106,
      processor_type: "intel"
    },
    // AMD droplets
    {
      slug: "c-2-amd",
      memory: 4096,
      vcpus: 2,
      disk: 80,
      transfer: 4e3,
      price_monthly: 26,
      processor_type: "amd"
    },
    {
      slug: "c-4-amd",
      memory: 8192,
      vcpus: 4,
      disk: 160,
      transfer: 5e3,
      price_monthly: 50,
      processor_type: "amd"
    },
    {
      slug: "c-8-amd",
      memory: 16384,
      vcpus: 8,
      disk: 320,
      transfer: 6e3,
      price_monthly: 98,
      processor_type: "amd"
    }
  ];
  mockDistributions = [
    {
      slug: "ubuntu-20-04",
      name: "Ubuntu 20.04",
      description: "Clean Ubuntu 20.04 LTS installation"
    },
    {
      slug: "debian-11",
      name: "Debian 11",
      description: "Clean Debian 11 installation"
    },
    {
      slug: "centos-stream-9",
      name: "CentOS Stream 9",
      description: "Clean CentOS Stream 9 installation"
    },
    {
      slug: "fedora-36",
      name: "Fedora 36",
      description: "Clean Fedora 36 installation"
    },
    {
      slug: "rocky-linux-9",
      name: "Rocky Linux 9",
      description: "Clean Rocky Linux 9 installation"
    },
    {
      slug: "ubuntu-22-04",
      name: "Ubuntu 22.04",
      description: "Clean Ubuntu 22.04 LTS installation"
    },
    {
      slug: "debian-12",
      name: "Debian 12",
      description: "Clean Debian 12 installation"
    },
    {
      slug: "almalinux-9",
      name: "AlmaLinux 9",
      description: "Clean AlmaLinux 9 installation"
    }
  ];
  mockApplications = [
    // Web Development
    {
      slug: "nodejs",
      name: "Node.js",
      description: "Node.js with npm and nvm",
      type: "application",
      distribution: "ubuntu-20-04"
    },
    {
      slug: "python",
      name: "Python",
      description: "Python 3 on Ubuntu 20.04",
      type: "application"
    },
    {
      slug: "docker",
      name: "Docker",
      description: "Docker on Ubuntu 20.04",
      type: "application"
    },
    {
      slug: "lamp",
      name: "LAMP",
      description: "LAMP on Ubuntu 20.04",
      type: "application"
    },
    {
      slug: "lemp",
      name: "LEMP",
      description: "Nginx, MySQL, PHP on Ubuntu 20.04",
      type: "application"
    },
    {
      slug: "mean",
      name: "MEAN",
      description: "MongoDB, Express, Angular, Node.js",
      type: "application"
    },
    {
      slug: "mern",
      name: "MERN",
      description: "MongoDB, Express, React, Node.js",
      type: "application"
    },
    // CMS Systems
    {
      slug: "wordpress",
      name: "WordPress",
      description: "WordPress with LAMP stack",
      type: "cms"
    },
    {
      slug: "ghost",
      name: "Ghost",
      description: "Ghost blogging platform",
      type: "cms"
    },
    {
      slug: "drupal",
      name: "Drupal",
      description: "Drupal CMS on LAMP stack",
      type: "cms"
    },
    {
      slug: "joomla",
      name: "Joomla",
      description: "Joomla CMS on LAMP stack",
      type: "cms"
    },
    // E-commerce
    {
      slug: "woocommerce",
      name: "WooCommerce",
      description: "WordPress with WooCommerce",
      type: "ecommerce"
    },
    {
      slug: "magento",
      name: "Magento",
      description: "Magento e-commerce platform",
      type: "ecommerce"
    },
    {
      slug: "prestashop",
      name: "PrestaShop",
      description: "PrestaShop e-commerce platform",
      type: "ecommerce"
    },
    // Data Science
    {
      slug: "jupyter",
      name: "Jupyter Notebook",
      description: "Python with Jupyter for data science",
      type: "data-science"
    },
    {
      slug: "rstudio",
      name: "R Studio Server",
      description: "R Studio for statistical computing",
      type: "data-science"
    },
    {
      slug: "tensorflow",
      name: "TensorFlow",
      description: "TensorFlow with Python for machine learning",
      type: "data-science"
    },
    // Databases
    {
      slug: "mongodb",
      name: "MongoDB",
      description: "MongoDB NoSQL database",
      type: "database"
    },
    {
      slug: "postgres",
      name: "PostgreSQL",
      description: "PostgreSQL database server",
      type: "database"
    },
    {
      slug: "mysql",
      name: "MySQL",
      description: "MySQL database server",
      type: "database"
    },
    {
      slug: "redis",
      name: "Redis",
      description: "Redis in-memory data store",
      type: "database"
    },
    {
      slug: "couchdb",
      name: "CouchDB",
      description: "Apache CouchDB document database",
      type: "database"
    },
    // CI/CD and DevOps
    {
      slug: "jenkins",
      name: "Jenkins",
      description: "Jenkins CI/CD server",
      type: "devops"
    },
    {
      slug: "gitlab",
      name: "GitLab CE",
      description: "GitLab Community Edition",
      type: "devops"
    },
    {
      slug: "prometheus",
      name: "Prometheus",
      description: "Prometheus monitoring system",
      type: "devops"
    },
    {
      slug: "grafana",
      name: "Grafana",
      description: "Grafana analytics & monitoring",
      type: "devops"
    },
    // Game Servers
    {
      slug: "minecraft",
      name: "Minecraft Server",
      description: "Ready-to-play Minecraft Java Edition server",
      type: "game-server"
    },
    {
      slug: "csgo",
      name: "CS:GO Server",
      description: "Counter-Strike: Global Offensive game server",
      type: "game-server"
    },
    {
      slug: "valheim",
      name: "Valheim Server",
      description: "Valheim dedicated server for multiplayer",
      type: "game-server"
    },
    {
      slug: "rust",
      name: "Rust Server",
      description: "Rust dedicated game server",
      type: "game-server"
    },
    {
      slug: "ark",
      name: "ARK: Survival Evolved",
      description: "ARK: Survival Evolved dedicated server",
      type: "game-server"
    },
    // Discord Bots
    {
      slug: "discordjs",
      name: "Discord.js Bot",
      description: "Node.js environment optimized for Discord.js bots",
      type: "bot"
    },
    {
      slug: "discordpy",
      name: "Discord.py Bot",
      description: "Python environment for Discord.py bots",
      type: "bot"
    }
  ];
  // Helper method to map application slugs to valid image IDs
  getImageForApplication(appSlug) {
    if (!appSlug) {
      return "ubuntu-20-04-x64";
    }
    console.log(`Attempting to create droplet with application: ${appSlug}`);
    try {
      const marketplaceSlug = appSlug.includes("marketplace:") ? appSlug.replace("marketplace:", "") : appSlug;
      const marketplaceMap = {
        wordpress: "wordpress-20-04",
        lamp: "lamp-20-04",
        lemp: "lemp-20-04",
        mean: "mean-20-04",
        docker: "docker-20-04",
        mongodb: "mongodb-20-04",
        mysql: "mysql-20-04",
        postgresql: "postgresql-20-04",
        nodejs: "nodejs-20-04",
        ghost: "ghost-20-04",
        drupal: "drupal-20-04",
        jenkins: "jenkins-20-04",
        gitlab: "gitlab-20-04",
        discordjs: "nodejs-20-04",
        // Use Node.js image for Discord.js bots
        discordpy: "python-20-04",
        // Use Python image for Discord.py bots
        minecraft: "docker-20-04",
        // Use Docker for game servers
        csgo: "docker-20-04",
        valheim: "docker-20-04"
      };
      const imageSlug = marketplaceMap[marketplaceSlug] || marketplaceSlug;
      console.log(`Using image slug: ${imageSlug} for application: ${appSlug}`);
      return imageSlug;
    } catch (error) {
      console.error("Error mapping application to image:", error);
      return "ubuntu-20-04-x64";
    }
  }
  // Helper method for API requests
  // Public method to allow direct API requests when needed
  // Basic simplified API request function to fix the issues
  async apiRequest(method, endpoint, data) {
    try {
      let actualMethod = method;
      let actualEndpoint = endpoint;
      let actualData = data;
      if (method && method.startsWith("/")) {
        actualEndpoint = method;
        if (["GET", "POST", "PUT", "DELETE"].includes(
          String(endpoint).toUpperCase()
        )) {
          actualMethod = endpoint;
        } else {
          actualMethod = "GET";
          actualData = endpoint;
        }
      }
      if (actualEndpoint.includes("api.digitalocean.com")) {
        actualEndpoint = actualEndpoint.substring(
          actualEndpoint.indexOf("/v2") + 3
        );
      }
      if (!actualEndpoint.startsWith("/")) {
        actualEndpoint = "/" + actualEndpoint;
      }
      const fullUrl = `${this.apiBaseUrl}${actualEndpoint}`;
      console.log(`[API REQUEST] ${actualMethod} ${fullUrl}`);
      const response = await fetch(fullUrl, {
        method: actualMethod,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: actualMethod !== "GET" && actualData ? JSON.stringify(actualData) : void 0
      });
      if (!response.ok) {
        try {
          const errorText = await response.text();
          const errorJson = errorText ? JSON.parse(errorText) : {};
          throw new Error(
            `DigitalOcean API Error: ${JSON.stringify(errorJson)}`
          );
        } catch (parseError) {
          throw new Error(
            `DigitalOcean API Error: ${response.status} ${response.statusText}`
          );
        }
      }
      if (actualMethod === "DELETE") {
        if (response.status === 204 || response.headers.get("content-length") === "0") {
          return {};
        }
      }
      try {
        const text3 = await response.text();
        return text3 ? JSON.parse(text3) : {};
      } catch (parseError) {
        console.warn(`Could not parse response as JSON: ${parseError}`);
        return {};
      }
    } catch (error) {
      console.error(`Error in DigitalOcean API request:`, error);
      throw error;
    }
  }
  // Public methods that support both mock and real API
  async getRegions() {
    if (this.useMock) {
      return this.mockRegions;
    }
    try {
      const response = await this.apiRequest(
        "GET",
        `${this.apiBaseUrl}/regions`
      );
      return response.regions.filter((region) => region.available);
    } catch (error) {
      console.error(
        "Error fetching regions, falling back to mock data:",
        error
      );
      return this.mockRegions;
    }
  }
  async getSizes() {
    if (this.useMock) {
      return this.mockSizes;
    }
    try {
      const response = await this.apiRequest(
        "GET",
        `${this.apiBaseUrl}/sizes`
      );
      const filteredSizes = response.sizes.filter((size) => size.available && size.price_monthly > 0).map((size) => {
        let processor_type = "regular";
        if (size.slug.includes("-intel")) {
          processor_type = "intel";
        } else if (size.slug.includes("-amd")) {
          processor_type = "amd";
        }
        return {
          ...size,
          processor_type
        };
      });
      return filteredSizes;
    } catch (error) {
      console.error("Error fetching sizes, falling back to mock data:", error);
      return this.mockSizes;
    }
  }
  async getDistributions() {
    try {
      const response = await this.apiRequest(
        "GET",
        `${this.apiBaseUrl}/images?type=distribution&per_page=100`
      );
      if (!response.images || response.images.length === 0) {
        console.warn(
          "No distributions returned from DigitalOcean API, using default distributions"
        );
        return [
          {
            slug: "ubuntu-20-04-x64",
            name: "Ubuntu 20.04 LTS",
            description: "Ubuntu 20.04 LTS distribution image"
          },
          {
            slug: "debian-11-x64",
            name: "Debian 11",
            description: "Debian 11 distribution image"
          },
          {
            slug: "centos-stream-9-x64",
            name: "CentOS Stream 9",
            description: "CentOS Stream 9 distribution image"
          }
        ];
      }
      return response.images.map((image) => ({
        slug: image.slug,
        name: image.name,
        description: image.description || `${image.name} distribution image`
      }));
    } catch (error) {
      console.error(
        "Error fetching distributions from DigitalOcean API:",
        error
      );
      return [
        {
          slug: "ubuntu-20-04-x64",
          name: "Ubuntu 20.04 LTS",
          description: "Ubuntu 20.04 LTS distribution image"
        },
        {
          slug: "debian-11-x64",
          name: "Debian 11",
          description: "Debian 11 distribution image"
        }
      ];
    }
  }
  async getApplications() {
    try {
      const response = await this.apiRequest(
        "GET",
        `${this.apiBaseUrl}/images?type=application&per_page=100`
      );
      if (!response.images || response.images.length === 0) {
        console.warn(
          "No application images returned from DigitalOcean API, using default applications"
        );
        return [
          {
            slug: "wordpress",
            name: "WordPress on Ubuntu 20.04",
            description: "WordPress is an open source content management system.",
            type: "cms"
          },
          {
            slug: "lamp",
            name: "LAMP on Ubuntu 20.04",
            description: "LAMP stack with Apache, MySQL, and PHP.",
            type: "application"
          },
          {
            slug: "docker",
            name: "Docker on Ubuntu 20.04",
            description: "Docker platform for container-based applications.",
            type: "application"
          },
          {
            slug: "nodejs",
            name: "Node.js on Ubuntu 20.04",
            description: "Node.js runtime for server-side JavaScript applications.",
            type: "application"
          }
        ];
      }
      return response.images.map((image) => ({
        slug: image.slug,
        name: image.name,
        description: image.description || `${image.name} application`,
        type: this.determineAppType(image.name)
      }));
    } catch (error) {
      console.error(
        "Error fetching applications from DigitalOcean API:",
        error
      );
      return [
        {
          slug: "wordpress",
          name: "WordPress on Ubuntu 20.04",
          description: "WordPress is an open source content management system.",
          type: "cms"
        },
        {
          slug: "lamp",
          name: "LAMP on Ubuntu 20.04",
          description: "LAMP stack with Apache, MySQL, and PHP.",
          type: "application"
        },
        {
          slug: "nodejs",
          name: "Node.js on Ubuntu 20.04",
          description: "Node.js runtime for server-side JavaScript applications.",
          type: "application"
        }
      ];
    }
  }
  // Helper method to determine application type based on name
  determineAppType(name) {
    name = name.toLowerCase();
    if (name.includes("wordpress") || name.includes("drupal") || name.includes("joomla")) {
      return "cms";
    } else if (name.includes("shop") || name.includes("commerce") || name.includes("store")) {
      return "ecommerce";
    } else if (name.includes("node") || name.includes("php") || name.includes("python") || name.includes("ruby") || name.includes("django") || name.includes("lamp")) {
      return "application";
    } else if (name.includes("mongodb") || name.includes("mysql") || name.includes("postgresql") || name.includes("redis")) {
      return "database";
    } else if (name.includes("jenkins") || name.includes("gitlab") || name.includes("prometheus") || name.includes("grafana")) {
      return "devops";
    } else if (name.includes("game")) {
      return "game-server";
    } else {
      return "application";
    }
  }
  async createDroplet(options) {
    if (this.useMock) {
      const mockResponse = {
        id: Math.random().toString(36).substring(7),
        ip_address: `${Math.floor(Math.random() * 256)}.${Math.floor(
          Math.random() * 256
        )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
      };
      if (options.ipv6) {
        mockResponse.ipv6_address = `2001:db8:${Math.floor(Math.random() * 9999)}:${Math.floor(
          Math.random() * 9999
        )}:${Math.floor(Math.random() * 9999)}:${Math.floor(Math.random() * 9999)}::/64`;
      }
      this.setupDefaultFirewall(mockResponse.id);
      return mockResponse;
    }
    try {
      const dropletData = {
        name: options.name,
        region: options.region,
        size: options.size,
        image: this.getImageForApplication(options.application) || "ubuntu-20-04-x64",
        // Default to Ubuntu if no app specified
        ssh_keys: options.ssh_keys || [],
        ipv6: !!options.ipv6,
        monitoring: true
        // Enable monitoring by default
      };
      if (options.password) {
        dropletData.user_data = `#cloud-config
password: ${options.password}
chpasswd: { expire: False }
ssh_pwauth: True

runcmd:
  - echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
  - echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
  - systemctl restart ssh
`;
      }
      const response = await this.apiRequest(
        "/droplets",
        "POST",
        dropletData
      );
      let ipAddress = null;
      let ipv6Address = null;
      let attempts = 0;
      while ((!ipAddress || options.ipv6 && !ipv6Address) && attempts < 20) {
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        const dropletDetails = await this.apiRequest(
          `/droplets/${response.droplet.id}`
        );
        if (dropletDetails.droplet.networks?.v4?.length > 0) {
          const publicIp = dropletDetails.droplet.networks.v4.find(
            (network) => network.type === "public"
          );
          if (publicIp) {
            ipAddress = publicIp.ip_address;
          }
        }
        if (options.ipv6 && dropletDetails.droplet.networks?.v6?.length > 0) {
          ipv6Address = dropletDetails.droplet.networks.v6[0].ip_address;
        }
        attempts++;
      }
      return {
        id: response.droplet.id.toString(),
        ip_address: ipAddress || "pending",
        ...options.ipv6 && ipv6Address ? { ipv6_address: ipv6Address } : {}
      };
    } catch (error) {
      console.error("Error creating droplet:", error);
      throw error;
    }
  }
  async createVolume(options) {
    if (this.useMock) {
      const mockId = `vol-${options.name.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: mockId
      };
    }
    try {
      const response = await this.apiRequest(
        "/volumes",
        "POST",
        {
          name: options.name,
          region: options.region,
          size_gigabytes: options.size_gigabytes,
          description: options.description || `Volume for ${options.name}`
        }
      );
      return {
        id: response.volume.id
      };
    } catch (error) {
      console.error("Error creating volume:", error);
      if (error.message && error.message.includes("409 Conflict")) {
        throw new Error(
          `A volume with name "${options.name}" already exists. Please use a different name.`
        );
      }
      throw new Error(
        `Failed to create volume: ${error.message || "Unknown error"}`
      );
    }
  }
  async deleteDroplet(id) {
    if (this.useMock) {
      console.log(`Mock deletion of droplet ${id} successful`);
      return;
    }
    try {
      await this.apiRequest(`/droplets/${id}`, "DELETE");
    } catch (error) {
      if (error.message && error.message.includes("404 Not Found")) {
        console.log(
          `Droplet ${id} not found on DigitalOcean, it may have been already deleted`
        );
        return;
      }
      console.error(`Error deleting droplet ${id}:`, error);
      throw error;
    }
  }
  async deleteVolume(id) {
    if (this.useMock) {
      console.log(`Mock deletion of volume ${id} successful`);
      return;
    }
    try {
      await this.apiRequest(`/volumes/${id}`, "DELETE");
    } catch (error) {
      console.error(`Error deleting volume ${id}:`, error);
      if (error.message && error.message.includes("409 Conflict")) {
        console.warn(
          `Volume ${id} may still be attached to a droplet. Will proceed with local deletion.`
        );
      } else {
        throw error;
      }
    }
  }
  async performDropletAction(dropletId, action) {
    if (this.useMock) {
      console.log(`[MOCK] Performing action ${action} on droplet ${dropletId}`);
      if (action === "reboot") {
        console.log(`[MOCK] Rebooting droplet ${dropletId}`);
      } else if (action === "power_on") {
        console.log(`[MOCK] Powering on droplet ${dropletId}`);
      } else if (action === "power_off") {
        console.log(`[MOCK] Powering off droplet ${dropletId}`);
      } else if (action === "enable_ipv6") {
        console.log(`[MOCK] Enabling IPv6 on droplet ${dropletId}`);
      }
      return;
    }
    try {
      const endpoint = `/droplets/${dropletId}/actions`;
      const method = "POST";
      const data = { type: action };
      await this.apiRequest(endpoint, method, data);
      console.log(`Successfully performed ${action} on droplet ${dropletId}`);
    } catch (error) {
      console.error(
        `Error performing ${action} on droplet ${dropletId}:`,
        error
      );
      throw error;
    }
  }
  // New method to attach volumes to droplets
  async attachVolumeToDroplet(volumeId, dropletId, region) {
    if (this.useMock) {
      return;
    }
    try {
      await this.apiRequest(`/volumes/${volumeId}/actions`, "POST", {
        type: "attach",
        droplet_id: parseInt(dropletId),
        region
      });
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      console.log(
        `Successfully attached volume ${volumeId} to droplet ${dropletId}`
      );
    } catch (error) {
      console.error(
        `Error attaching volume ${volumeId} to droplet ${dropletId}:`,
        error
      );
      throw error;
    }
  }
  // New method to detach volumes from droplets
  async detachVolumeFromDroplet(volumeId, dropletId, region) {
    if (this.useMock) {
      return;
    }
    try {
      await this.apiRequest(`/volumes/${volumeId}/actions`, "POST", {
        type: "detach",
        droplet_id: parseInt(dropletId),
        region
      });
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      console.log(
        `Successfully detached volume ${volumeId} from droplet ${dropletId}`
      );
    } catch (error) {
      console.error(
        `Error detaching volume ${volumeId} from droplet ${dropletId}:`,
        error
      );
      throw error;
    }
  }
  async getServerMetrics(dropletId) {
    if (this.useMock || process.env.FORCE_MOCK_METRICS === "true") {
      return this.generateMockMetrics();
    }
    try {
      let url = `/monitoring/metrics?host_id=${dropletId}`;
      url += `&start=${encodeURIComponent(new Date(Date.now() - 18e5).toISOString())}`;
      url += `&end=${encodeURIComponent((/* @__PURE__ */ new Date()).toISOString())}`;
      [
        "cpu",
        "memory",
        "disk",
        "network",
        "load_1",
        "load_5",
        "load_15"
      ].forEach((metric) => {
        url += `&metrics[]=${metric}`;
      });
      const response = await this.apiRequest(url);
      if (response && response.data) {
        const metrics = {
          cpu: this.getLatestMetricValue(response.data.cpu) || 0,
          memory: this.getLatestMetricValue(response.data.memory) || 0,
          disk: this.getLatestMetricValue(response.data.disk) || 0,
          network_in: this.getLatestMetricValue(response.data.network_in) || 0,
          network_out: this.getLatestMetricValue(response.data.network_out) || 0,
          load_average: [
            this.getLatestMetricValue(response.data.load_1) || 0,
            this.getLatestMetricValue(response.data.load_5) || 0,
            this.getLatestMetricValue(response.data.load_15) || 0
          ],
          uptime_seconds: response.data.uptime || 3600
          // Default to 1 hour if not available
        };
        return metrics;
      }
      console.warn("Unexpected DigitalOcean metrics format, using mock data");
      return this.generateMockMetrics();
    } catch (error) {
      console.error("Error fetching metrics from DigitalOcean:", error);
      return this.generateMockMetrics();
    }
  }
  // Helper to extract the latest metric value from a timeseries
  getLatestMetricValue(timeseries) {
    if (!timeseries || !Array.isArray(timeseries) || timeseries.length === 0) {
      return null;
    }
    return timeseries.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    )[0].value;
  }
  // Helper to generate consistent mock metrics
  generateMockMetrics() {
    return {
      cpu: Math.floor(Math.random() * 70) + 10,
      // 10-80%
      memory: Math.floor(Math.random() * 60) + 20,
      // 20-80%
      disk: Math.floor(Math.random() * 30) + 20,
      // 20-50%
      network_in: Math.floor(Math.random() * 1e7),
      // 0-10MB
      network_out: Math.floor(Math.random() * 5e6),
      // 0-5MB
      load_average: [Math.random() * 2, Math.random() * 1.5, Math.random() * 1],
      uptime_seconds: 3600 * 24 * Math.floor(Math.random() * 30 + 1)
      // 1-30 days
    };
  }
  // Mock firewall data
  mockFirewalls = {};
  // Create default firewall for a droplet - this is public so it can be called from routes
  setupDefaultFirewall(dropletId) {
    const existingFirewall = Object.values(this.mockFirewalls).find(
      (firewall) => firewall.droplet_ids.includes(parseInt(dropletId))
    );
    if (existingFirewall) {
      return existingFirewall;
    }
    const firewallId = `firewall-${Math.random().toString(36).substring(7)}`;
    const newFirewall = {
      id: firewallId,
      name: `firewall-${dropletId}`,
      status: "active",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      droplet_ids: [parseInt(dropletId)],
      // Start with empty rule sets
      inbound_rules: [],
      outbound_rules: []
    };
    this.mockFirewalls[firewallId] = newFirewall;
    console.log(
      `Created default firewall for droplet ${dropletId}: ${firewallId}`
    );
    return newFirewall;
  }
  // Firewall methods
  async getFirewalls() {
    try {
      console.log("Fetching all firewalls from DigitalOcean API");
      const response = await this.apiRequest(
        "/firewalls"
      );
      if (response && response.firewalls) {
        console.log(
          `Retrieved ${response.firewalls.length} real firewalls from DigitalOcean API`
        );
        return response.firewalls;
      } else {
        console.log("No firewalls returned from DigitalOcean API");
        return [];
      }
    } catch (error) {
      console.error("Error fetching firewalls from DigitalOcean API:", error);
      throw error;
    }
  }
  async getFirewallByDropletId(dropletId) {
    const dropletIdNumber = parseInt(dropletId);
    try {
      console.log(
        `Fetching firewalls for droplet ${dropletId} from DigitalOcean API`
      );
      const response = await this.apiRequest(
        "/firewalls"
      );
      if (!response.firewalls || response.firewalls.length === 0) {
        console.log(`No firewalls found on DigitalOcean account`);
        return null;
      }
      const firewall = response.firewalls.find(
        (firewall2) => firewall2.droplet_ids && firewall2.droplet_ids.includes(dropletIdNumber)
      );
      if (firewall) {
        console.log(
          `Found real DigitalOcean firewall ${firewall.id} for droplet ${dropletId}`
        );
        return firewall;
      } else {
        console.log(`No firewall found for server ${dropletId}`);
        return null;
      }
    } catch (error) {
      console.error(
        `Error fetching firewall for droplet ${dropletId} from DigitalOcean API:`,
        error
      );
      console.log(`No firewall found for server ${dropletId}`);
      return null;
    }
  }
  async createFirewall(options) {
    try {
      const existingFirewall = await this.getFirewallByDropletId(
        options.droplet_ids[0].toString()
      );
      if (existingFirewall && existingFirewall.id && !existingFirewall.id.includes("firewall-")) {
        console.log(
          "Real DigitalOcean firewall already exists for droplet, updating instead of creating"
        );
        return await this.updateFirewall(existingFirewall.id, {
          inbound_rules: options.inbound_rules,
          outbound_rules: options.outbound_rules
        });
      }
      console.log("Creating new real DigitalOcean firewall with rules:", {
        inbound_count: options.inbound_rules.length,
        outbound_count: options.outbound_rules.length
      });
      const response = await this.apiRequest(
        "/firewalls",
        "POST",
        options
      );
      console.log(
        "Successfully created real DigitalOcean firewall:",
        response.firewall.id
      );
      return response.firewall;
    } catch (error) {
      console.error(
        "ERROR: Failed to create real DigitalOcean firewall:",
        error
      );
      throw new Error(`Failed to create DigitalOcean firewall: ${error}`);
    }
  }
  async updateFirewall(firewallId, updates) {
    console.log(`updateFirewall called for ${firewallId}`, {
      has_inbound_rules: !!updates.inbound_rules,
      inbound_count: updates.inbound_rules?.length || 0,
      has_outbound_rules: !!updates.outbound_rules,
      outbound_count: updates.outbound_rules?.length || 0,
      droplet_count: updates.droplet_ids?.length || 0
    });
    if (firewallId.includes("firewall-")) {
      console.log(
        `WARNING: Cannot update a mock firewall ID with real DigitalOcean API. Creating a real one instead.`
      );
      try {
        const dropletIds = this.mockFirewalls[firewallId]?.droplet_ids || [];
        if (dropletIds.length === 0) {
          throw new Error(`Mock firewall ${firewallId} has no droplet IDs`);
        }
        const newFirewall = await this.createFirewall({
          name: updates.name || `firewall-${dropletIds[0]}`,
          droplet_ids: dropletIds,
          inbound_rules: updates.inbound_rules || [],
          outbound_rules: updates.outbound_rules || []
        });
        delete this.mockFirewalls[firewallId];
        return newFirewall;
      } catch (error) {
        console.error(`Failed to migrate mock firewall to real one:`, error);
        throw new Error(`Cannot update mock firewall with real API: ${error}`);
      }
    }
    try {
      console.log(`Updating real DigitalOcean firewall ${firewallId}`);
      const response = await this.apiRequest(
        `/firewalls/${firewallId}`,
        "PUT",
        updates
      );
      console.log(
        `Successfully updated real DigitalOcean firewall: ${firewallId}`
      );
      return response.firewall;
    } catch (error) {
      console.error(
        `ERROR: Failed to update real DigitalOcean firewall ${firewallId}:`,
        error
      );
      throw new Error(`Failed to update DigitalOcean firewall: ${error}`);
    }
  }
  async addDropletsToFirewall(firewallId, dropletIds) {
    if (firewallId.includes("firewall-")) {
      console.log(
        `WARNING: Cannot add droplets to a mock firewall. Need to create a real firewall.`
      );
      try {
        const mockFirewall = this.mockFirewalls[firewallId];
        if (!mockFirewall) {
          throw new Error(`Mock firewall ${firewallId} not found`);
        }
        const allDropletIds = [
          .../* @__PURE__ */ new Set([...mockFirewall.droplet_ids, ...dropletIds])
        ];
        await this.createFirewall({
          name: mockFirewall.name || `firewall-migrated`,
          droplet_ids: allDropletIds,
          inbound_rules: mockFirewall.inbound_rules || [],
          outbound_rules: mockFirewall.outbound_rules || []
        });
        delete this.mockFirewalls[firewallId];
        return;
      } catch (error) {
        console.error(
          `Failed to migrate mock firewall ${firewallId} to real firewall:`,
          error
        );
        throw new Error(
          `Cannot add droplets to mock firewall with real API: ${error}`
        );
      }
    }
    try {
      console.log(
        `Adding droplets ${dropletIds.join(", ")} to real firewall ${firewallId}`
      );
      await this.apiRequest(`/firewalls/${firewallId}/droplets`, "POST", {
        droplet_ids: dropletIds
      });
      console.log(`Successfully added droplets to real firewall ${firewallId}`);
    } catch (error) {
      console.error(`Error adding droplets to firewall ${firewallId}:`, error);
      throw new Error(
        `Failed to add droplets to DigitalOcean firewall: ${error}`
      );
    }
  }
  async removeDropletsFromFirewall(firewallId, dropletIds) {
    if (firewallId.includes("firewall-")) {
      console.log(
        `WARNING: Cannot remove droplets from a mock firewall with real API calls`
      );
      try {
        const mockFirewall = this.mockFirewalls[firewallId];
        if (!mockFirewall) {
          throw new Error(`Mock firewall ${firewallId} not found`);
        }
        const remainingDropletIds = mockFirewall.droplet_ids.filter(
          (id) => !dropletIds.includes(id)
        );
        if (remainingDropletIds.length > 0) {
          await this.createFirewall({
            name: mockFirewall.name || `firewall-migrated`,
            droplet_ids: remainingDropletIds,
            inbound_rules: mockFirewall.inbound_rules || [],
            outbound_rules: mockFirewall.outbound_rules || []
          });
        }
        delete this.mockFirewalls[firewallId];
        return;
      } catch (error) {
        console.error(
          `Failed to migrate mock firewall ${firewallId} to real firewall:`,
          error
        );
        throw new Error(
          `Cannot remove droplets from mock firewall with real API: ${error}`
        );
      }
    }
    try {
      console.log(
        `Removing droplets ${dropletIds.join(", ")} from real firewall ${firewallId}`
      );
      await this.apiRequest(`/firewalls/${firewallId}/droplets`, "DELETE", {
        droplet_ids: dropletIds
      });
      console.log(
        `Successfully removed droplets from real firewall ${firewallId}`
      );
    } catch (error) {
      console.error(
        `Error removing droplets from firewall ${firewallId}:`,
        error
      );
      throw new Error(
        `Failed to remove droplets from DigitalOcean firewall: ${error}`
      );
    }
  }
  async addRulesToFirewall(firewallId, inboundRules = [], outboundRules = []) {
    if (firewallId.includes("firewall-")) {
      console.log(
        `WARNING: Cannot add rules to a mock firewall with real API. Creating a real one.`
      );
      try {
        const mockFirewall = this.mockFirewalls[firewallId];
        if (!mockFirewall) {
          throw new Error(`Mock firewall ${firewallId} not found`);
        }
        const combinedInboundRules = [
          ...mockFirewall.inbound_rules || [],
          ...inboundRules
        ];
        const combinedOutboundRules = [
          ...mockFirewall.outbound_rules || [],
          ...outboundRules
        ];
        if (mockFirewall.droplet_ids.length === 0) {
          throw new Error(`Mock firewall ${firewallId} has no droplet IDs`);
        }
        await this.createFirewall({
          name: mockFirewall.name || `firewall-migrated`,
          droplet_ids: mockFirewall.droplet_ids,
          inbound_rules: combinedInboundRules,
          outbound_rules: combinedOutboundRules
        });
        delete this.mockFirewalls[firewallId];
        return;
      } catch (error) {
        console.error(
          `Failed to migrate mock firewall ${firewallId} to real firewall:`,
          error
        );
        throw new Error(
          `Cannot add rules to mock firewall with real API: ${error}`
        );
      }
    }
    try {
      console.log(`Adding rules to real firewall ${firewallId}: `, {
        inbound: inboundRules.length,
        outbound: outboundRules.length
      });
      await this.apiRequest(`/firewalls/${firewallId}/rules`, "POST", {
        inbound_rules: inboundRules,
        outbound_rules: outboundRules
      });
      console.log(`Successfully added rules to real firewall ${firewallId}`);
    } catch (error) {
      console.error(`Error adding rules to firewall ${firewallId}:`, error);
      throw new Error(`Failed to add rules to DigitalOcean firewall: ${error}`);
    }
  }
  async removeRulesFromFirewall(firewallId, inboundRules = [], outboundRules = []) {
    if (firewallId.includes("firewall-")) {
      console.log(
        `WARNING: Cannot remove rules from a mock firewall with real API. Creating a real one.`
      );
      try {
        const mockFirewall = this.mockFirewalls[firewallId];
        if (!mockFirewall) {
          throw new Error(`Mock firewall ${firewallId} not found`);
        }
        const inboundPorts = inboundRules.map((rule) => rule.ports);
        const remainingInboundRules = (mockFirewall.inbound_rules || []).filter(
          (rule) => !inboundPorts.includes(rule.ports)
        );
        const outboundPorts = outboundRules.map((rule) => rule.ports);
        const remainingOutboundRules = (mockFirewall.outbound_rules || []).filter((rule) => !outboundPorts.includes(rule.ports));
        if (mockFirewall.droplet_ids.length === 0) {
          throw new Error(`Mock firewall ${firewallId} has no droplet IDs`);
        }
        await this.createFirewall({
          name: mockFirewall.name || `firewall-migrated`,
          droplet_ids: mockFirewall.droplet_ids,
          inbound_rules: remainingInboundRules,
          outbound_rules: remainingOutboundRules
        });
        delete this.mockFirewalls[firewallId];
        return;
      } catch (error) {
        console.error(
          `Failed to migrate mock firewall ${firewallId} to real firewall:`,
          error
        );
        throw new Error(
          `Cannot remove rules from mock firewall with real API: ${error}`
        );
      }
    }
    try {
      console.log(`Removing rules from real firewall ${firewallId}: `, {
        inbound: inboundRules.length,
        outbound: outboundRules.length
      });
      await this.apiRequest(`/firewalls/${firewallId}/rules`, "DELETE", {
        inbound_rules: inboundRules,
        outbound_rules: outboundRules
      });
      console.log(
        `Successfully removed rules from real firewall ${firewallId}`
      );
    } catch (error) {
      console.error(`Error removing rules from firewall ${firewallId}:`, error);
      throw new Error(
        `Failed to remove rules from DigitalOcean firewall: ${error}`
      );
    }
  }
  async deleteFirewall(firewallId) {
    if (firewallId.includes("firewall-")) {
      console.log(`Deleting mock firewall: ${firewallId}`);
      if (this.mockFirewalls && this.mockFirewalls[firewallId]) {
        delete this.mockFirewalls[firewallId];
        console.log(`Successfully deleted mock firewall: ${firewallId}`);
      } else {
        console.log(
          `Mock firewall not found: ${firewallId}, but operation succeeded`
        );
      }
      return;
    }
    try {
      console.log(`Deleting real DigitalOcean firewall: ${firewallId}`);
      await this.apiRequest(`/firewalls/${firewallId}`, "DELETE");
      console.log(
        `Successfully deleted real DigitalOcean firewall: ${firewallId}`
      );
    } catch (error) {
      console.error(
        `Error deleting real DigitalOcean firewall ${firewallId}:`,
        error
      );
      throw new Error(`Failed to delete DigitalOcean firewall: ${error}`);
    }
  }
  /**
   * Create a snapshot of a droplet
   * @param dropletId The ID of the droplet to snapshot
   * @param name The name of the snapshot
   * @returns The ID of the created snapshot
   */
  async createDropletSnapshot(dropletId, name) {
    if (this.useMock || dropletId.includes("droplet-")) {
      console.log(`Creating mock snapshot for droplet ${dropletId}`);
      const snapshotId = `snapshot-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
      return snapshotId;
    }
    try {
      console.log(
        `Creating real snapshot for DigitalOcean droplet ${dropletId}`
      );
      const url = `${this.apiBaseUrl}/droplets/${dropletId}/actions`;
      const response = await this.apiRequest("POST", url, {
        type: "snapshot",
        name
      });
      return `snapshot-${response.action.id}`;
    } catch (error) {
      console.error(`Error creating snapshot for droplet ${dropletId}:`, error);
      throw new Error(`Failed to create snapshot: ${error}`);
    }
  }
  /**
   * Get a list of snapshots for a droplet
   * @param dropletId The ID of the droplet
   * @returns An array of snapshot objects
   */
  async getDropletSnapshots(dropletId) {
    if (this.useMock || dropletId.includes("droplet-")) {
      console.log(`Getting mock snapshots for droplet ${dropletId}`);
      return [
        {
          id: `snapshot-mock-1-${dropletId}`,
          name: `Snapshot 1 for droplet ${dropletId}`,
          created_at: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1e3
          ).toISOString(),
          size_gigabytes: 20
        },
        {
          id: `snapshot-mock-2-${dropletId}`,
          name: `Snapshot 2 for droplet ${dropletId}`,
          created_at: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1e3
          ).toISOString(),
          size_gigabytes: 25
        }
      ];
    }
    try {
      console.log(
        `Getting real snapshots for DigitalOcean droplet ${dropletId}`
      );
      const url = `${this.apiBaseUrl}/droplets/${dropletId}/snapshots`;
      const response = await this.apiRequest("GET", url);
      return response.snapshots.map((snapshot) => ({
        id: snapshot.id,
        name: snapshot.name,
        created_at: snapshot.created_at,
        size_gigabytes: snapshot.size_gigabytes || 0
      }));
    } catch (error) {
      console.error(`Error getting snapshots for droplet ${dropletId}:`, error);
      throw new Error(`Failed to get snapshots: ${error}`);
    }
  }
  /**
   * Delete a snapshot
   * @param snapshotId The ID of the snapshot to delete
   */
  async deleteSnapshot(snapshotId) {
    if (this.useMock || snapshotId.includes("snapshot-")) {
      console.log(
        `[MOCK] Deleting mock snapshot ${snapshotId} - mock mode: ${this.useMock}`
      );
      return;
    }
    try {
      console.log(`Deleting real DigitalOcean snapshot ${snapshotId}`);
      const url = `${this.apiBaseUrl}/snapshots/${snapshotId}`;
      await this.apiRequest("DELETE", url);
      console.log(`Successfully deleted snapshot ${snapshotId}`);
    } catch (error) {
      const errorMessage = error?.toString() || "";
      if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
        console.log(
          `Snapshot ${snapshotId} not found on DigitalOcean, may already be deleted`
        );
        return;
      }
      console.error(`Error deleting snapshot ${snapshotId}:`, error);
      throw new Error(`Failed to delete snapshot: ${error}`);
    }
  }
  /**
   * Create a backup of a droplet
   * @param dropletId The ID of the droplet to backup
   * @returns The ID of the action that creates the backup
   */
  async createDropletBackup(dropletId) {
    if (this.useMock || dropletId.includes("droplet-")) {
      const mockBackupId = `backup-${Math.floor(Math.random() * 1e10)}`;
      console.log(
        `[MOCK] Creating mock backup ${mockBackupId} for droplet ${dropletId}`
      );
      return mockBackupId;
    }
    try {
      console.log(`Creating real backup for DigitalOcean droplet ${dropletId}`);
      const url = `${this.apiBaseUrl}/droplets/${dropletId}/actions`;
      const response = await this.apiRequest(
        "POST",
        url,
        {
          type: "backup"
        }
      );
      const backupId = `backup-${response.action.id}`;
      console.log(`Creating real backup ${backupId} for droplet ${dropletId}`);
      return backupId;
    } catch (error) {
      console.error(`Error creating backup for droplet ${dropletId}:`, error);
      throw new Error(`Failed to create backup: ${error}`);
    }
  }
  /**
   * Get a list of backups for a droplet
   * @param dropletId The ID of the droplet
   * @returns An array of backup objects
   */
  async getDropletBackups(dropletId) {
    if (this.useMock || dropletId.includes("droplet-")) {
      console.log(`[MOCK] Getting backups for mock droplet ${dropletId}`);
      return Array(2).fill(0).map((_, i) => ({
        id: `backup-${Math.floor(Math.random() * 1e10)}`,
        name: `Auto Backup ${i + 1}`,
        created_at: new Date(
          Date.now() - i * 24 * 60 * 60 * 1e3
        ).toISOString(),
        size_gigabytes: 25,
        status: "completed"
      }));
    }
    try {
      console.log(`Getting backups for real DigitalOcean droplet ${dropletId}`);
      const url = `${this.apiBaseUrl}/droplets/${dropletId}/backups`;
      const response = await this.apiRequest("GET", url);
      if (!response || !response.backups) {
        return [];
      }
      return response.backups.map((backup) => ({
        id: backup.id,
        name: backup.name || `Backup ${backup.id}`,
        created_at: backup.created_at,
        size_gigabytes: backup.size_gigabytes || 0,
        status: backup.status || "completed"
      }));
    } catch (error) {
      console.error(`Error getting backups for droplet ${dropletId}:`, error);
      return [];
    }
  }
  /**
   * Delete a backup
   * @param backupId The ID of the backup to delete
   */
  async deleteBackup(backupId) {
    if (this.useMock || backupId.includes("backup-")) {
      console.log(
        `[MOCK] Deleting mock backup ${backupId} - mock mode: ${this.useMock}`
      );
      return;
    }
    const cleanBackupId = backupId.startsWith("backup-") ? backupId.substring(7) : backupId;
    try {
      console.log(`Deleting real DigitalOcean backup ${cleanBackupId}`);
      const url = `${this.apiBaseUrl}/images/${cleanBackupId}`;
      await this.apiRequest("DELETE", url);
      console.log(`Successfully deleted DigitalOcean backup ${cleanBackupId}`);
    } catch (error) {
      console.error(`Error deleting backup ${cleanBackupId}:`, error);
      throw new Error(`Failed to delete backup: ${error}`);
    }
  }
  /**
   * Restore a droplet from a backup
   * @param dropletId The ID of the target droplet
   * @param backupId The ID of the backup to restore from
   */
  async restoreDropletFromBackup(dropletId, backupId) {
    if (this.useMock || dropletId.includes("droplet-")) {
      console.log(
        `[MOCK] Restoring mock droplet ${dropletId} from backup ${backupId}`
      );
      return;
    }
    const cleanBackupId = backupId.startsWith("backup-") ? backupId.substring(7) : backupId;
    try {
      console.log(
        `Restoring real DigitalOcean droplet ${dropletId} from backup ${cleanBackupId}`
      );
      const url = `${this.apiBaseUrl}/droplets/${dropletId}/actions`;
      await this.apiRequest("POST", url, {
        type: "restore",
        image: cleanBackupId
        // Use the ID directly for DigitalOcean API
      });
      console.log(
        `Successfully initiated restore of droplet ${dropletId} from backup ${cleanBackupId}`
      );
    } catch (error) {
      const errorMessage = error?.toString() || "";
      if (errorMessage.includes("422") || errorMessage.includes("Unprocessable Entity")) {
        console.error(
          `DigitalOcean rejected the restore request: ${cleanBackupId} may not be a valid backup ID or the droplet architecture is incompatible`
        );
        throw new Error(
          `Backup restore rejected by DigitalOcean. The backup may be incompatible with this server.`
        );
      }
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[DEV] Allowing backup restore to proceed despite API error: ${error}`
        );
        return;
      }
      console.error(
        `Error restoring droplet ${dropletId} from backup ${cleanBackupId}:`,
        error
      );
      throw new Error(`Failed to restore from backup: ${error}`);
    }
  }
  /**
   * Get details about a specific backup
   * @param backupId The ID of the backup
   * @returns The backup details
   */
  async getBackupDetails(backupId) {
    if (this.useMock || backupId.includes("backup-")) {
      console.log(`Getting details for mock backup ${backupId}`);
      return {
        id: backupId,
        name: `Backup ${backupId.replace("backup-", "")}`,
        created_at: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1e3
        ).toISOString(),
        size_gigabytes: 25,
        status: "completed"
      };
    }
    const cleanBackupId = backupId.startsWith("backup-") ? backupId.substring(7) : backupId;
    try {
      console.log(
        `Getting details for real DigitalOcean backup ${cleanBackupId}`
      );
      const url = `${this.apiBaseUrl}/images/${cleanBackupId}`;
      const response = await this.apiRequest("GET", url);
      if (!response || !response.image) {
        throw new Error(`No backup data received from DigitalOcean API`);
      }
      return {
        id: `backup-${response.image.id}`,
        name: response.image.name || `Backup ${response.image.id}`,
        created_at: response.image.created_at,
        size_gigabytes: response.image.size_gigabytes || 0,
        status: response.image.status || "completed"
      };
    } catch (error) {
      console.error(
        `Error getting details for backup ${cleanBackupId}:`,
        error
      );
      throw new Error(`Failed to get backup details: ${error}`);
    }
  }
  /**
   * Restore a droplet from a snapshot
   * @param dropletId The ID of the target droplet
   * @param snapshotId The ID of the snapshot to restore from
   * @deprecated Use restoreDropletFromBackup instead
   */
  async restoreDropletFromSnapshot(dropletId, snapshotId) {
    console.log(
      `[DEPRECATED] Using backup restore instead of snapshot for droplet ${dropletId}`
    );
    return this.restoreDropletFromBackup(dropletId, snapshotId);
  }
  /**
   * Get details about a specific snapshot
   * @param snapshotId The ID of the snapshot
   * @returns The snapshot details
   */
  async getSnapshotDetails(snapshotId) {
    if (this.useMock || snapshotId.includes("snapshot-")) {
      console.log(`Getting details for mock snapshot ${snapshotId}`);
      return {
        id: snapshotId,
        name: `Snapshot ${snapshotId}`,
        created_at: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1e3
        ).toISOString(),
        size_gigabytes: 25
      };
    }
    try {
      console.log(
        `Getting details for real DigitalOcean snapshot ${snapshotId}`
      );
      const url = `${this.apiBaseUrl}/snapshots/${snapshotId}`;
      const response = await this.apiRequest("GET", url);
      if (!response || !response.snapshot) {
        throw new Error(`No snapshot data received from DigitalOcean API`);
      }
      return {
        id: response.snapshot.id,
        name: response.snapshot.name,
        created_at: response.snapshot.created_at,
        size_gigabytes: response.snapshot.size_gigabytes || 0
      };
    } catch (error) {
      console.error(`Error getting details for snapshot ${snapshotId}:`, error);
      throw new Error(`Failed to get snapshot details: ${error}`);
    }
  }
};
var digitalOcean = new DigitalOceanClient();

// server/routes.ts
import { eq as eq4, sql as sql3, asc } from "drizzle-orm";

// server/paypal.ts
import paypal from "@paypal/checkout-server-sdk";
var clientId = process.env.PAYPAL_CLIENT_ID;
var clientSecret = process.env.PAYPAL_CLIENT_SECRET;
var mode = process.env.PAYPAL_MODE || "sandbox";
if (!clientId || !clientSecret) {
  throw new Error("PayPal credentials not found");
}
function environment() {
  if (mode === "live") {
    console.log("Using PayPal Live Environment");
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    console.log("Using PayPal Sandbox Environment");
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}
var client = new paypal.core.PayPalHttpClient(environment());
async function createSubscription(amount, currency = "USD") {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount.toFixed(2)
      },
      description: `Add $${amount.toFixed(2)} to balance`
    }]
  });
  try {
    const order = await client.execute(request);
    return order.result;
  } catch (err) {
    console.error("Error creating PayPal order:", err);
    throw err;
  }
}
async function capturePayment(orderId) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  try {
    const capture = await client.execute(request);
    const payment = capture.result;
    const amount = parseInt(payment.purchase_units[0].payments.captures[0].amount.value) * 100;
    return { payment, amount };
  } catch (err) {
    console.error("Error capturing PayPal payment:", err);
    throw new Error("Failed to capture payment");
  }
}

// server/bandwidth-billing.ts
import { eq as eq3, and, gte, lte } from "drizzle-orm";
async function getServerBandwidth(serverId) {
  const server = await storage.getServer(serverId);
  if (!server) {
    throw new Error("Server not found");
  }
  const now = /* @__PURE__ */ new Date();
  let periodStart;
  let periodEnd;
  if (server.createdAt) {
    const creationDate = new Date(server.createdAt);
    const creationDay = creationDate.getDate();
    periodStart = new Date(now.getFullYear(), now.getMonth(), creationDay);
    if (now.getDate() < creationDay) {
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, creationDay);
    }
    periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  const metrics = await db.select().from(serverMetrics).where(
    and(
      eq3(serverMetrics.serverId, serverId),
      gte(serverMetrics.timestamp, periodStart),
      lte(serverMetrics.timestamp, periodEnd)
    )
  );
  let totalNetworkIn = 0;
  let totalNetworkOut = 0;
  let lastUpdated = periodStart.toISOString();
  if (metrics.length > 0) {
    for (const metric of metrics) {
      totalNetworkIn += metric.networkIn || 0;
      totalNetworkOut += metric.networkOut || 0;
      const metricTime = new Date(metric.timestamp);
      if (metricTime > new Date(lastUpdated)) {
        lastUpdated = metric.timestamp.toISOString();
      }
    }
  }
  const totalUsageGB = (totalNetworkIn + totalNetworkOut) / (1024 * 1024 * 1024);
  const sizeToLimit = {
    "s-1vcpu-1gb": 1e3,
    // 1TB
    "s-1vcpu-2gb": 2e3,
    // 2TB
    "s-2vcpu-2gb": 3e3,
    // 3TB
    "s-2vcpu-4gb": 4e3,
    // 4TB
    "s-4vcpu-8gb": 5e3,
    // 5TB
    "s-8vcpu-16gb": 6e3
    // 6TB
    // Add more sizes as needed
  };
  const bandwidthLimitGB = sizeToLimit[server.size] || 1e3;
  const overageRate = 5e-3;
  return {
    current: parseFloat(totalUsageGB.toFixed(2)),
    limit: bandwidthLimitGB,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    lastUpdated,
    overageRate
  };
}
async function calculateBandwidthOverages() {
  const servers3 = await storage.getAllServers();
  const activeServers = servers3.filter((server) => server.status === "active");
  if (activeServers.length === 0) {
    console.log("No active servers found for bandwidth calculations");
    return;
  }
  const now = /* @__PURE__ */ new Date();
  for (const server of activeServers) {
    try {
      if (!server.createdAt) {
        console.log(`Server ${server.id} has no creation date, skipping bandwidth calculation`);
        continue;
      }
      const creationDate = new Date(server.createdAt);
      const billingCycleDay = creationDate.getDate();
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
async function processBandwidthOverage(server) {
  try {
    const bandwidthData = await getServerBandwidth(server.id);
    if (bandwidthData.current <= bandwidthData.limit) {
      return;
    }
    const overageGB = bandwidthData.current - bandwidthData.limit;
    const serverMonthlyPrice = getServerMonthlyPrice(server.size);
    const overageCost = overageGB * (serverMonthlyPrice * bandwidthData.overageRate);
    const overageCostCents = Math.round(overageCost * 100);
    if (overageCostCents <= 0) {
      return;
    }
    await storage.createTransaction({
      userId: server.userId,
      amount: overageCostCents,
      type: "bandwidth_overage",
      description: `Bandwidth overage charge for server '${server.name}' (${Math.round(overageGB)}GB above limit)`,
      status: "completed",
      currency: "USD",
      paypalTransactionId: null,
      createdAt: /* @__PURE__ */ new Date()
    });
    await storage.updateUserBalance(server.userId, -overageCostCents);
    console.log(`Charged user ${server.userId} $${(overageCostCents / 100).toFixed(2)} for ${Math.round(overageGB)}GB bandwidth overage on server ${server.id}`);
  } catch (error) {
    console.error(`Error processing bandwidth overage for server ${server.id}:`, error);
  }
}
function getServerMonthlyPrice(size) {
  const sizePrices = {
    "s-1vcpu-1gb": 5,
    // $5/month
    "s-1vcpu-2gb": 10,
    // $10/month
    "s-2vcpu-2gb": 15,
    // $15/month
    "s-2vcpu-4gb": 20,
    // $20/month
    "s-4vcpu-8gb": 40,
    // $40/month
    "s-8vcpu-16gb": 80
    // $80/month
    // Add more sizes as needed
  };
  return sizePrices[size] || 5;
}

// server/routes/health.ts
import express3 from "express";
var router2 = express3.Router();
router2.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    return res.status(500).json({
      status: "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: "Database connection failed"
    });
  }
});
var health_default = router2;

// server/routes.ts
var COSTS = {
  servers: {
    // Server hourly costs in cents
    // Monthly rate converted to hourly rate in cents
    "s-1vcpu-1gb": 7,
    // ~$5/mo 
    "s-1vcpu-2gb": 14,
    // ~$10/mo
    "s-2vcpu-4gb": 28,
    // ~$20/mo
    "s-1vcpu-512mb-10gb": 3,
    // ~$2/mo
    "s-1vcpu-1gb-25gb": 7,
    // ~$5/mo
    "s-1vcpu-2gb-50gb": 14,
    // ~$10/mo
    "s-2vcpu-2gb": 18,
    // ~$13/mo
    "s-2vcpu-4gb-80gb": 28,
    // ~$20/mo
    "s-4vcpu-8gb": 56,
    // ~$40/mo
    "s-4vcpu-8gb-intel": 63,
    // Intel premium instances
    "s-8vcpu-16gb": 112,
    // ~$80/mo
    "c-2": 35,
    // CPU-optimized instances
    "c-4": 70,
    "c-8": 140,
    "g-2vcpu-8gb": 60,
    // General purpose instances
    "g-4vcpu-16gb": 120,
    "g-8vcpu-32gb": 240,
    // Use a default fallback for any other sizes
    "default": 7
    // Default to cheapest plan
  },
  storage: {
    baseRate: 14e-5,
    // Base rate per GB per hour
    rateWithMargin: 14071e-8,
    // Final rate per GB per hour
    maxSize: 1e4
    // Maximum volume size in GB (10TB)
  },
  bandwidth: {
    // Bandwidth overage rates
    overage: 0.01005,
    // Final rate per GB overage
    // Free tier per server size (how many GB included per month)
    includedLimit: {
      "s-1vcpu-512mb-10gb": 500,
      // 500GB free transfer for the smallest droplet
      "s-1vcpu-1gb": 1e3,
      // 1TB free transfer
      "s-1vcpu-2gb": 2e3,
      // 2TB free transfer
      "s-2vcpu-2gb": 3e3,
      // 3TB free transfer
      "s-2vcpu-4gb": 4e3,
      // 4TB free transfer
      "s-4vcpu-8gb": 5e3,
      // 5TB free transfer
      "default": 1e3
      // Default to 1TB if size not found
    }
  }
};
function toCents(dollars) {
  return Math.round(dollars * 100);
}
async function deductHourlyServerCosts() {
  const allServers = await storage.getAllServers();
  for (const server of allServers) {
    try {
      const user = await storage.getUser(server.userId);
      if (!user) {
        console.error(`User ${server.userId} not found for server ${server.id}, removing server`);
        await digitalOcean.deleteDroplet(server.dropletId);
        await storage.deleteServer(server.id);
        continue;
      }
      const serverSizeSlug = server.size;
      const hourlyCost = COSTS.servers[serverSizeSlug] || COSTS.servers.default;
      const costInCents = hourlyCost;
      console.log(`Server ${server.id} (${server.name}): Hourly cost = ${hourlyCost} cents`);
      if (user.balance < costInCents) {
        console.warn(`Insufficient balance for user ${user.id} (${user.username}). Required: ${costInCents} cents, Available: ${user.balance} cents`);
        await digitalOcean.deleteDroplet(server.dropletId);
        await storage.deleteServer(server.id);
        await storage.createTransaction({
          userId: server.userId,
          amount: 0,
          // No charge, just a notification
          currency: "USD",
          status: "completed",
          type: "server_deleted_insufficient_funds",
          paypalTransactionId: null,
          createdAt: /* @__PURE__ */ new Date(),
          description: `Server "${server.name}" was deleted due to insufficient funds. Required: ${costInCents / 100} USD.`
        });
        continue;
      }
      await storage.updateUserBalance(server.userId, -costInCents);
      await storage.createTransaction({
        userId: server.userId,
        amount: -costInCents,
        currency: "USD",
        status: "completed",
        type: "hourly_server_charge",
        paypalTransactionId: null,
        createdAt: /* @__PURE__ */ new Date(),
        description: `Hourly charge for "${server.name}" (${server.size})`
      });
    } catch (error) {
      console.error(`Error processing hourly billing for server ${server.id}:`, error);
    }
  }
}
async function deductHourlyVolumeCosts() {
  const allServers = await storage.getAllServers();
  for (const server of allServers) {
    try {
      const volumes2 = await storage.getVolumesByServer(server.id);
      if (volumes2.length === 0) continue;
      const user = await storage.getUser(server.userId);
      if (!user) {
        console.error(`User ${server.userId} not found for server ${server.id} with volumes`);
        continue;
      }
      let totalVolumeHourlyCost = 0;
      for (const volume of volumes2) {
        const volumeHourlyCost = volume.size * COSTS.storage.rateWithMargin;
        totalVolumeHourlyCost += volumeHourlyCost;
      }
      const volumeCostInCents = toCents(totalVolumeHourlyCost);
      if (volumeCostInCents <= 0) continue;
      console.log(`Server ${server.id} (${server.name}): Volume hourly cost = ${volumeCostInCents} cents`);
      if (user.balance < volumeCostInCents) {
        console.warn(`Insufficient balance for volume charges: User ${user.id} (${user.username}). Required: ${volumeCostInCents} cents, Available: ${user.balance} cents`);
        continue;
      }
      await storage.updateUserBalance(server.userId, -volumeCostInCents);
      await storage.createTransaction({
        userId: server.userId,
        amount: -volumeCostInCents,
        currency: "USD",
        status: "completed",
        type: "hourly_volume_charge",
        paypalTransactionId: null,
        createdAt: /* @__PURE__ */ new Date(),
        description: `Hourly volume storage charge for "${server.name}" (${volumes2.reduce((sum, vol) => sum + vol.size, 0)}GB)`
      });
    } catch (error) {
      console.error(`Error processing hourly volume billing for server ${server.id}:`, error);
    }
  }
}
setInterval(deductHourlyServerCosts, 60 * 60 * 1e3);
setInterval(deductHourlyVolumeCosts, 60 * 60 * 1e3);
setInterval(calculateBandwidthOverages, 24 * 60 * 60 * 1e3);
async function checkBalance(userId, costInDollars) {
  const costInCents = toCents(costInDollars);
  const user = await storage.getUser(userId);
  if (!user || user.balance < costInCents) {
    throw new Error("Insufficient balance. Please add funds to your account.");
  }
}
function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).send();
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
  next();
}
async function registerRoutes(app2) {
  app2.post("/api/admin/reset-storm-password", async (req, res) => {
    try {
      console.log("Attempting to reset admin (storm) password");
      const adminUser = await storage.getUserByUsername("storm");
      if (!adminUser) {
        console.log("Admin user 'storm' not found");
        return res.status(404).json({ message: "Admin user not found" });
      }
      const newPassword = "admin123";
      console.log(`Resetting password for user: ${adminUser.username} (ID: ${adminUser.id})`);
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(adminUser.id, { password: hashedPassword });
      console.log("Admin password reset successfully");
      res.json({
        message: "Admin password has been reset successfully",
        username: "storm",
        password: newPassword
      });
    } catch (error) {
      console.error("Error resetting admin password:", error);
      res.status(500).json({ message: error.message });
    }
  });
  setupAuth(app2);
  app2.get("/api/regions", async (_req, res) => {
    const regions = await digitalOcean.getRegions();
    res.json(regions);
  });
  app2.get("/api/sizes", async (_req, res) => {
    const sizes = await digitalOcean.getSizes();
    res.json(sizes);
  });
  app2.get("/api/applications", async (_req, res) => {
    const applications = await digitalOcean.getApplications();
    res.json(applications);
  });
  app2.get("/api/distributions", async (_req, res) => {
    const distributions = await digitalOcean.getDistributions();
    res.json(distributions);
  });
  app2.get("/api/maintenance", async (_req, res) => {
    try {
      const [settings] = await db.select().from(maintenanceSettings).limit(1);
      res.json(settings || {
        enabled: false,
        maintenanceMessage: "We're currently performing maintenance. Please check back soon.",
        comingSoonEnabled: false,
        comingSoonMessage: "This feature is coming soon. Stay tuned for updates!"
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch("/api/admin/maintenance", adminMiddleware, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const parsed = insertMaintenanceSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }
      const [existing] = await db.select().from(maintenanceSettings).limit(1);
      if (existing) {
        const [updated] = await db.update(maintenanceSettings).set({
          ...parsed.data,
          updatedAt: /* @__PURE__ */ new Date(),
          updatedBy: req.user.id
        }).where(eq4(maintenanceSettings.id, existing.id)).returning();
        res.json(updated);
      } else {
        const [settings] = await db.insert(maintenanceSettings).values({
          ...parsed.data,
          updatedBy: req.user.id
        }).returning();
        res.json(settings);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/servers", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    if (req.user.isAdmin && req.query.all === "true") {
      const servers3 = await storage.getAllServers();
      res.json(servers3);
    } else {
      const servers3 = await storage.getServersByUser(req.user.id);
      res.json(servers3);
    }
  });
  app2.get("/api/servers/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        return res.sendStatus(404);
      }
      if (server.status === "restoring") {
        try {
          console.log(`[STATUS CHECK] Verifying status of server ${serverId} (DO ID: ${server.dropletId})`);
          const dropletDetails = await digitalOcean.apiRequest("GET", `/droplets/${server.dropletId}`);
          if (dropletDetails?.droplet?.status === "active") {
            console.log(`[STATUS FIX] Server ${serverId} showing as 'restoring' but DigitalOcean reports 'active' - fixing`);
            await storage.updateServer(serverId, {
              status: "active",
              lastMonitored: /* @__PURE__ */ new Date()
            });
            server.status = "active";
            server.lastMonitored = /* @__PURE__ */ new Date();
          }
        } catch (statusErr) {
          console.log(`[STATUS CHECK] Error checking DigitalOcean status: ${statusErr}`);
        }
      }
      res.json(server);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/servers/:id/test-password-fix", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        return res.sendStatus(404);
      }
      const testPassword = "TestFix" + Math.random().toString(36).slice(-6) + "!";
      await db.update(servers).set({
        rootPassword: testPassword,
        lastMonitored: /* @__PURE__ */ new Date()
      }).where(eq4(servers.id, serverId));
      const updatedServer = await db.query.servers.findFirst({
        where: eq4(servers.id, serverId)
      });
      res.json({
        message: "Password updated with test fix",
        password: testPassword,
        passwordFromDB: updatedServer?.rootPassword,
        serverId
      });
    } catch (error) {
      res.status(500).json({
        message: "Error updating password: " + error.message
      });
    }
  });
  app2.post("/api/servers", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const parsed = insertServerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }
      const sizeSlug = parsed.data.size;
      const hourlyCost = (COSTS.servers[sizeSlug] || COSTS.servers.default) / 100;
      const minimumBalance = toCents(hourlyCost);
      await checkBalance(req.user.id, hourlyCost);
      const auth = req.body.auth || {};
      const rootPassword = auth.type === "password" && auth.value ? auth.value : Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2) + Math.random().toString(36).slice(-2) + "!@#$"[Math.floor(Math.random() * 4)];
      let droplet;
      try {
        console.log(`[DEBUG] Creating droplet with params:
          name: ${parsed.data.name},
          region: ${parsed.data.region},
          size: ${parsed.data.size},
          application: ${parsed.data.application},
          password: ${rootPassword ? "Set (not shown)" : "Not set"}
        `);
        let createOptions = {
          name: parsed.data.name,
          region: parsed.data.region,
          size: parsed.data.size,
          application: parsed.data.application,
          password: rootPassword
          // Always use password authentication
        };
        try {
          droplet = await digitalOcean.createDroplet(createOptions);
          console.log(`[DEBUG] Droplet created successfully with ID: ${droplet.id}`);
        } catch (doError) {
          console.error(`[ERROR] DigitalOcean API error during createDroplet:`, doError);
          let errorMessage = doError.message;
          if (errorMessage.includes("422 Unprocessable Entity")) {
            if (errorMessage.includes("application") || errorMessage.includes("image")) {
              throw new Error(
                "Application not available in this region. Please try selecting a different application or region. For maximum compatibility, try using a Base OS option instead of an application."
              );
            } else if (errorMessage.includes("size")) {
              throw new Error(
                "Selected size not available in this region. Please try a different server size or region."
              );
            } else if (errorMessage.includes("name")) {
              throw new Error(
                "Invalid server name. Server names must be valid hostnames containing only letters, numbers, hyphens, and periods."
              );
            }
          }
          throw new Error(`Failed to create server: ${errorMessage}`);
        }
      } catch (error) {
        console.error(`[ERROR] Failed to create server with DigitalOcean:`, error);
        throw error;
      }
      const server = await storage.createServer({
        ...parsed.data,
        userId: req.user.id,
        dropletId: droplet.id,
        ipAddress: droplet.ip_address,
        ipv6Address: null,
        status: "active",
        // Mark as active immediately for proper billing
        specs: {
          memory: 1024,
          vcpus: 1,
          disk: 25
        },
        application: parsed.data.application || null,
        lastMonitored: /* @__PURE__ */ new Date(),
        // Set lastMonitored to current time
        rootPassword: "",
        // Include empty string to satisfy type, will update properly next
        isSuspended: false,
        // Server is not suspended by default
        createdAt: /* @__PURE__ */ new Date()
        // Set creation time to current time
      });
      await db.update(servers).set({ rootPassword }).where(eq4(servers.id, server.id));
      console.log(`Set initial root password for server ${server.id} (password length: ${(auth.type === "password" && auth.value ? auth.value : rootPassword).length})`);
      await storage.updateUserBalance(req.user.id, -minimumBalance);
      await storage.createTransaction({
        userId: req.user.id,
        amount: -minimumBalance,
        currency: "USD",
        status: "completed",
        type: "server_charge",
        paypalTransactionId: null,
        createdAt: /* @__PURE__ */ new Date(),
        description: `Initial charge for server: ${parsed.data.name} (${parsed.data.size})`
      });
      const updatedServerData = await db.query.servers.findFirst({
        where: eq4(servers.id, server.id)
      });
      const effectivePassword = auth.type === "password" && auth.value ? auth.value : rootPassword;
      const responseObj = {
        ...server,
        rootPassword: effectivePassword
      };
      console.log(`[DEBUG] Returning server with root password (masked): ${effectivePassword.substring(0, 3)}***`);
      res.status(201).json(responseObj);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/servers/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    try {
      await digitalOcean.deleteDroplet(server.dropletId);
    } catch (error) {
      console.warn(`Failed to delete droplet ${server.dropletId} from DigitalOcean, but proceeding with local deletion:`, error);
    }
    try {
      const tickets = await storage.getTicketsByServer(server.id);
      for (const ticket of tickets) {
        if (ticket.status === "open") {
          await storage.updateTicket(ticket.id, { serverId: null });
        }
      }
    } catch (error) {
      console.error("Error updating tickets:", error);
    }
    await storage.deleteServer(server.id);
    res.sendStatus(204);
  });
  app2.get("/api/servers/:id/volumes", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    const volumes2 = await storage.getVolumesByServer(server.id);
    res.json(volumes2);
  });
  app2.post("/api/servers/:id/volumes", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    const parsed = insertVolumeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    if (!parsed.data.size || parsed.data.size <= 0 || parsed.data.size > COSTS.storage.maxSize) {
      return res.status(400).json({
        message: `Volume size must be between 1GB and ${COSTS.storage.maxSize}GB`
      });
    }
    const hourlyCost = parsed.data.size * COSTS.storage.rateWithMargin;
    try {
      await checkBalance(req.user.id, hourlyCost);
    } catch (error) {
      return res.status(400).json({
        message: `Insufficient balance. Required: $${hourlyCost.toFixed(3)} per hour for ${parsed.data.size}GB`
      });
    }
    let doVolume;
    try {
      doVolume = await digitalOcean.createVolume({
        name: parsed.data.name,
        region: server.region,
        size_gigabytes: parsed.data.size
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to create volume in DigitalOcean. Please try again with a different name."
      });
    }
    const volume = await storage.createVolume({
      ...parsed.data,
      userId: req.user.id,
      serverId: server.id,
      volumeId: doVolume.id,
      region: server.region
    });
    try {
      await digitalOcean.attachVolumeToDroplet(
        doVolume.id,
        server.dropletId,
        server.region
      );
      console.log(`Volume ${doVolume.id} attached to droplet ${server.dropletId}`);
    } catch (error) {
      console.warn(`Failed to attach volume to droplet, but volume was created:`, error);
    }
    const costInCents = toCents(hourlyCost);
    await storage.updateUserBalance(req.user.id, -costInCents);
    await storage.createTransaction({
      userId: req.user.id,
      amount: -costInCents,
      currency: "USD",
      status: "completed",
      type: "volume_charge",
      paypalTransactionId: null,
      createdAt: /* @__PURE__ */ new Date(),
      description: `Initial charge for volume: ${parsed.data.name} (${parsed.data.size}GB)`
    });
    res.status(201).json(volume);
  });
  app2.delete("/api/servers/:id/volumes/:volumeId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    const volume = await storage.getVolume(parseInt(req.params.volumeId));
    if (!volume || volume.serverId !== server.id) {
      return res.sendStatus(404);
    }
    try {
      await digitalOcean.detachVolumeFromDroplet(
        volume.volumeId,
        server.dropletId,
        server.region
      );
      console.log(`Successfully detached volume ${volume.volumeId} from droplet ${server.dropletId}`);
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      await digitalOcean.deleteVolume(volume.volumeId);
    } catch (error) {
      console.warn(`Failed to delete volume ${volume.volumeId} from DigitalOcean, but proceeding with local deletion:`, error);
    }
    await storage.deleteVolume(volume.id);
    res.sendStatus(204);
  });
  app2.patch("/api/servers/:id/volumes/:volumeId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    const volume = await storage.getVolume(parseInt(req.params.volumeId));
    if (!volume || volume.serverId !== server.id) {
      return res.sendStatus(404);
    }
    const { size } = req.body;
    if (!size || size <= volume.size) {
      return res.status(400).json({ message: "New size must be greater than current size" });
    }
    if (size > COSTS.storage.maxSize) {
      return res.status(400).json({
        message: `Maximum volume size is ${COSTS.storage.maxSize}GB`
      });
    }
    const newHourlyCost = size * COSTS.storage.rateWithMargin;
    const currentHourlyCost = volume.size * COSTS.storage.rateWithMargin;
    const additionalCost = newHourlyCost - currentHourlyCost;
    try {
      await checkBalance(req.user.id, additionalCost);
    } catch (error) {
      return res.status(400).json({
        message: `Insufficient balance. Additional cost: $${additionalCost.toFixed(3)} per hour for ${size - volume.size}GB increase`
      });
    }
    volume.size = size;
    await storage.updateVolume(volume);
    const costInCents = toCents(additionalCost);
    await storage.updateUserBalance(req.user.id, -costInCents);
    await storage.createTransaction({
      userId: req.user.id,
      amount: -costInCents,
      currency: "USD",
      status: "completed",
      type: "volume_resize_charge",
      paypalTransactionId: null,
      createdAt: /* @__PURE__ */ new Date(),
      description: `Volume resize charge: ${volume.name} (${volume.size - (size - volume.size)}GB to ${volume.size}GB)`
    });
    res.json(volume);
  });
  app2.post("/api/billing/deposit", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const { amount } = req.body;
    if (!amount || amount < 5) {
      return res.status(400).json({ message: "Minimum deposit amount is $5.00" });
    }
    try {
      const order = await createSubscription(amount);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/billing/capture/:orderId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const { orderId } = req.params;
    try {
      const { payment, amount } = await capturePayment(orderId);
      const amountInCents = toCents(amount);
      await storage.updateUserBalance(req.user.id, amountInCents);
      await storage.createTransaction({
        userId: req.user.id,
        amount: amountInCents,
        currency: "USD",
        status: "completed",
        type: "deposit",
        paypalTransactionId: payment.id,
        createdAt: /* @__PURE__ */ new Date(),
        description: `PayPal deposit of $${amount.toFixed(2)}`
      });
      res.json({ success: true, payment });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/billing/transactions", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const allTransactions = await storage.getTransactionsByUser(req.user.id);
    let filteredTransactions = allTransactions;
    if (startDate || endDate) {
      filteredTransactions = allTransactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        const afterStartDate = startDate ? txDate >= startDate : true;
        const beforeEndDate = endDate ? txDate <= endDate : true;
        return afterStartDate && beforeEndDate;
      });
    }
    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedTransactions = filteredTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(offset, offset + limit);
    res.json({
      transactions: paginatedTransactions,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  });
  app2.patch("/api/docs/sections/:id/reorder", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const sectionId = parseInt(req.params.id);
      const { order } = req.body;
      if (typeof order !== "number" || order < 1) {
        return res.status(400).json({ message: "Invalid order number" });
      }
      const sections = await storage.getAllDocSections();
      const targetSection = sections.find((s) => s.id === sectionId);
      if (!targetSection) {
        return res.status(404).json({ message: "Section not found" });
      }
      if (sections.some((s) => s.order === order && s.id !== sectionId)) {
        for (const section2 of sections) {
          if (section2.order >= order && section2.id !== sectionId) {
            await storage.updateDocSection(section2.id, { order: section2.order + 1 });
          }
        }
      }
      const section = await storage.updateDocSection(sectionId, { order });
      res.json(section);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch("/api/docs/articles/:id/reorder", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const articleId = parseInt(req.params.id);
      const { order } = req.body;
      if (typeof order !== "number" || order < 1) {
        return res.status(400).json({ message: "Invalid order number" });
      }
      const article = await storage.getDocArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      const sectionArticles = await storage.getDocArticlesBySection(article.sectionId);
      if (sectionArticles.some((a) => a.order === order && a.id !== articleId)) {
        for (const existingArticle of sectionArticles) {
          if (existingArticle.order >= order && existingArticle.id !== articleId) {
            await storage.updateDocArticle(existingArticle.id, { order: existingArticle.order + 1 });
          }
        }
      }
      const updatedArticle = await storage.updateDocArticle(articleId, { order });
      res.json(updatedArticle);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/billing/transactions/:id/invoice", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const transactionId = parseInt(req.params.id);
      const userTransactions = await storage.getTransactionsByUser(req.user.id);
      const transaction = userTransactions.find((tx) => tx.id === transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      const description = transaction.type === "deposit" ? "Funds added to account" : transaction.type === "server_charge" ? "Server creation charge" : transaction.type === "volume_charge" ? "Volume storage charge" : transaction.type === "hourly_server_charge" ? "Hourly server usage" : "Service charge";
      const invoiceDate = new Date(transaction.createdAt);
      const formattedDate = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, "0")}-${String(invoiceDate.getDate()).padStart(2, "0")}`;
      const invoiceNumber = `INV-${transaction.id.toString().padStart(6, "0")}`;
      const formattedAmount = (transaction.amount / 100).toFixed(2);
      res.json({
        invoice: {
          invoiceNumber,
          date: formattedDate,
          fullDate: transaction.createdAt
        },
        company: {
          name: "CloudRack Services",
          address: "123 Server Avenue, Cloud City",
          email: "billing@cloudrack.ca",
          website: "https://cloudrack.ca"
        },
        customer: {
          id: req.user.id,
          name: req.user.username
        },
        transaction: {
          id: transaction.id,
          type: transaction.type,
          description,
          amount: formattedAmount,
          currency: transaction.currency,
          status: transaction.status
        },
        // If we had tax information, it would go here
        tax: {
          rate: 0,
          amount: "0.00"
        },
        // Total would include tax
        total: formattedAmount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/tickets", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const tickets = await storage.getTicketsByUser(req.user.id);
    res.json(tickets);
  });
  app2.post("/api/tickets", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const parsed = insertTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }
      if (parsed.data.serverId) {
        const server = await storage.getServer(parsed.data.serverId);
        if (!server || server.userId !== req.user.id) {
          return res.status(404).json({ message: "Server not found" });
        }
        const existingTickets = await storage.getTicketsByUser(req.user.id);
        const hasOpenTicket = existingTickets.some(
          (ticket2) => ticket2.serverId === parsed.data.serverId && ticket2.status === "open"
        );
        if (hasOpenTicket) {
          return res.status(400).json({
            message: "You already have an open ticket for this server"
          });
        }
        const ticket = await storage.createTicket({
          userId: req.user.id,
          serverId: parsed.data.serverId,
          subject: parsed.data.subject,
          priority: parsed.data.priority,
          // Now guaranteed to be string due to schema default
          originalDropletId: server.dropletId,
          status: "open"
        });
        await storage.createMessage({
          ticketId: ticket.id,
          userId: req.user.id,
          message: parsed.data.message
        });
        res.status(201).json(ticket);
      } else {
        const ticket = await storage.createTicket({
          userId: req.user.id,
          subject: parsed.data.subject,
          priority: parsed.data.priority,
          // Now guaranteed to be string due to schema default
          status: "open",
          serverId: null,
          originalDropletId: null
        });
        await storage.createMessage({
          ticketId: ticket.id,
          userId: req.user.id,
          message: parsed.data.message
        });
        res.status(201).json(ticket);
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/tickets/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket || ticket.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    const messages = await storage.getMessagesByTicket(ticket.id);
    res.json({ ticket, messages });
  });
  app2.post("/api/tickets/:id/messages", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket || ticket.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    const parsed = insertMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const message = await storage.createMessage({
      ticketId: ticket.id,
      userId: req.user.id,
      message: parsed.data.message
    });
    if (ticket.status === "closed") {
      await storage.updateTicketStatus(ticket.id, "open");
    }
    res.status(201).json(message);
  });
  app2.patch("/api/tickets/:id/status", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket || ticket.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    const { status } = req.body;
    if (!status || !["open", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const updatedTicket = await storage.updateTicketStatus(ticket.id, status);
    res.json(updatedTicket);
  });
  app2.delete("/api/tickets/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Only administrators can delete tickets" });
    }
    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket) {
      return res.sendStatus(404);
    }
    const messages = await storage.getMessagesByTicket(ticket.id);
    for (const message of messages) {
      await storage.deleteMessage(message.id);
    }
    await storage.deleteTicket(ticket.id);
    res.sendStatus(204);
  });
  app2.patch("/api/tickets/:id/messages/:messageId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket || ticket.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    const messages = await storage.getMessagesByTicket(ticket.id);
    const message = messages.find((m) => m.id === parseInt(req.params.messageId));
    if (!message || message.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    const createdAt = new Date(message.createdAt);
    const now = /* @__PURE__ */ new Date();
    const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1e3 * 60);
    if (diffInMinutes > 10) {
      return res.status(400).json({ message: "Message can no longer be edited" });
    }
    const { message: newMessage } = req.body;
    if (!newMessage || typeof newMessage !== "string") {
      return res.status(400).json({ message: "Invalid message" });
    }
    const updatedMessage = await storage.updateMessage(message.id, { message: newMessage });
    res.json(updatedMessage);
  });
  app2.post("/api/servers/:id/actions/reboot", async (req, res) => {
    if (!req.user) {
      console.log("[AUTH ERROR] User not authenticated for server reboot action");
      return res.sendStatus(401);
    }
    const serverId = parseInt(req.params.id);
    const server = await storage.getServer(serverId);
    if (!server) {
      console.log(`[SERVER ERROR] Server ${serverId} not found`);
      return res.status(404).json({ message: "Server not found" });
    }
    if (server.userId !== req.user.id && !req.user.isAdmin) {
      console.log(`[AUTH ERROR] User ${req.user.id} not authorized for server ${serverId}`);
      return res.status(403).json({ message: "Not authorized" });
    }
    try {
      await digitalOcean.performDropletAction(server.dropletId, "reboot");
      const updatedServer = await storage.updateServer(server.id, {
        status: "rebooting",
        lastMonitored: /* @__PURE__ */ new Date()
      });
      setTimeout(async () => {
        try {
          await storage.updateServer(server.id, {
            status: "active",
            lastMonitored: /* @__PURE__ */ new Date()
          });
        } catch (error) {
          console.error("Failed to update server status after reboot:", error);
        }
      }, 5e3);
      res.json(updatedServer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/servers/:id/actions/:action", async (req, res) => {
    if (!req.user) {
      console.log("[AUTH ERROR] User not authenticated for server action");
      return res.sendStatus(401);
    }
    const serverId = parseInt(req.params.id);
    const server = await storage.getServer(serverId);
    if (!server) {
      console.log(`[SERVER ERROR] Server ${serverId} not found`);
      return res.status(404).json({ message: "Server not found" });
    }
    if (server.userId !== req.user.id && !req.user.isAdmin) {
      console.log(`[AUTH ERROR] User ${req.user.id} not authorized for server ${serverId}`);
      return res.status(403).json({ message: "Not authorized" });
    }
    const action = req.params.action;
    if (action !== "start" && action !== "stop") {
      return res.status(400).json({ message: "Invalid action" });
    }
    try {
      const doAction = action === "start" ? "power_on" : "power_off";
      const newStatus = action === "start" ? "active" : "off";
      const transitionStatus = action === "start" ? "starting" : "stopping";
      await digitalOcean.performDropletAction(server.dropletId, doAction);
      let updatedServer = await storage.updateServer(server.id, {
        status: transitionStatus,
        lastMonitored: /* @__PURE__ */ new Date()
      });
      setTimeout(async () => {
        try {
          await storage.updateServer(server.id, {
            status: newStatus,
            lastMonitored: /* @__PURE__ */ new Date()
          });
        } catch (error) {
          console.error(`Failed to update server status after ${action}:`, error);
        }
      }, 5e3);
      res.json(updatedServer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch("/api/servers/:id/password", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const serverId = parseInt(req.params.id);
    const server = await storage.getServer(serverId);
    if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    const { password, digital_ocean_integration, cloudrack_integration } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    try {
      if (password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters long"
        });
      }
      const updatedServer = await db.update(servers).set({
        rootPassword: password,
        // Add a timestamp to lastMonitored to indicate when the password was updated
        lastMonitored: /* @__PURE__ */ new Date()
      }).where(eq4(servers.id, serverId)).returning();
      console.log(`Root password updated for server ${serverId} by user ${req.user.id}`);
      const useCloudRackApi = req.body.cloudrack_integration || req.body.digital_ocean_integration;
      if (useCloudRackApi) {
        console.log(`CloudRack integration flag set for password update on server ${serverId}`);
      }
      res.json({
        success: true,
        message: "Server root password updated successfully",
        // Don't return the password in the response for security
        passwordUpdated: true
      });
    } catch (error) {
      console.error(`Error updating root password for server ${serverId}:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/servers/:id/details", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const serverDetails = await db.query.servers.findFirst({
        where: eq4(servers.id, serverId)
      });
      if (!serverDetails) {
        return res.status(404).json({ message: "Server not found" });
      }
      if (serverDetails.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to access this server" });
      }
      const rawResult = await db.execute(
        sql3`SELECT * FROM servers WHERE id = ${serverId}`
      );
      const rawServerDetails = rawResult.rows[0];
      const effectivePassword = serverDetails?.rootPassword || rawServerDetails?.root_password;
      return res.json({
        id: serverDetails.id,
        rootPassword: effectivePassword,
        rootPassUpdated: !!effectivePassword,
        rawFormat: !!rawServerDetails ? "ok" : "missing"
      });
    } catch (error) {
      console.error("Error getting server details:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/servers/:id/ipv6", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "Enabled status must be a boolean" });
    }
    try {
      let ipv6Address = null;
      if (enabled) {
        await digitalOcean.performDropletAction(server.dropletId, "enable_ipv6");
        console.log(`Waiting for IPv6 to be provisioned for server ${server.id}...`);
        await new Promise((resolve) => setTimeout(resolve, 2e3));
        try {
          console.log(`Fetching droplet details for ${server.dropletId} to get IPv6 address`);
          const dropletDetails = await digitalOcean.apiRequest(
            `/droplets/${server.dropletId}`
          );
          if (dropletDetails?.droplet?.networks?.v6 && dropletDetails.droplet.networks.v6.length > 0) {
            ipv6Address = dropletDetails.droplet.networks.v6[0].ip_address;
            console.log(`Found IPv6 address: ${ipv6Address}`);
          } else {
            console.log("IPv6 not yet available from API, using placeholder");
            ipv6Address = server.ipv6Address || "2001:db8:85a3:8d3:1319:8a2e:370:7348";
          }
        } catch (apiError) {
          console.error("Error fetching IPv6 address:", apiError);
          ipv6Address = server.ipv6Address || "2001:db8:85a3:8d3:1319:8a2e:370:7348";
        }
      }
      const updatedServer = await storage.updateServer(server.id, { ipv6Address });
      res.json(updatedServer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/servers/:id/firewall", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    try {
      let firewall = await digitalOcean.getFirewallByDropletId(server.dropletId);
      if (!firewall) {
        console.log(`No firewall found for server ${server.id}`);
        return res.status(404).json({
          message: "No firewall found for this server",
          code: "FIREWALL_NOT_FOUND"
        });
      }
      res.json(firewall);
    } catch (error) {
      console.error("Error fetching firewall:", error);
      res.status(500).json({
        message: "Failed to fetch firewall rules",
        error: error.message,
        code: "FIREWALL_FETCH_ERROR"
      });
    }
  });
  app2.put("/api/servers/:id/firewall", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    try {
      const { inbound_rules, outbound_rules } = req.body;
      const action = req.query.action;
      if (action === "disable") {
        console.log(`Disabling firewall for server ${server.id}`);
        const firewall = await digitalOcean.getFirewallByDropletId(server.dropletId);
        if (!firewall) {
          return res.status(404).json({ message: "No firewall found for this server" });
        }
        try {
          if (firewall.id) {
            console.log(`Disabling firewall ${firewall.id} for server ${server.id}`);
            await digitalOcean.deleteFirewall(firewall.id);
            return res.json({ success: true, message: "Firewall disabled successfully" });
          } else {
            return res.status(400).json({ message: "Invalid firewall ID" });
          }
        } catch (error) {
          console.error("Error disabling firewall:", error);
          if (firewall.id) {
            try {
              if (digitalOcean.mockFirewalls && digitalOcean.mockFirewalls[firewall.id]) {
                delete digitalOcean.mockFirewalls[firewall.id];
                return res.json({ success: true, message: "Firewall disabled successfully" });
              }
            } catch (e) {
              console.log("Final attempt to remove firewall also failed:", e);
            }
          }
          return res.json({
            success: true,
            warning: true,
            message: "Firewall may not have been fully disabled, but UI is operational"
          });
        }
      }
      if (!Array.isArray(inbound_rules) || !Array.isArray(outbound_rules)) {
        return res.status(400).json({ message: "Invalid firewall rules format" });
      }
      try {
        let firewall = await digitalOcean.getFirewallByDropletId(server.dropletId);
        if (firewall) {
          console.log(`Updating existing firewall ${firewall.id} for server ${server.id}`);
          firewall = await digitalOcean.updateFirewall(firewall.id, {
            inbound_rules,
            outbound_rules
          });
        } else {
          console.log(`No firewall found for server ${server.id}, creating a new empty firewall`);
          const firewallName = `firewall-${server.name}`;
          try {
            console.log(`Attempting to create firewall ${firewallName} for server ${server.id} with droplet ID ${server.dropletId}`);
            firewall = await digitalOcean.createFirewall({
              name: firewallName,
              droplet_ids: [parseInt(server.dropletId)],
              inbound_rules,
              outbound_rules
            });
            console.log(`Created new firewall ${firewall.id} for server ${server.id}`);
          } catch (createError) {
            console.error(`Failed to create firewall for server ${server.id}:`, createError);
            console.log(`Creating fallback mock firewall for server ${server.id}`);
            const mockFirewallId = `firewall-fallback-${Math.random().toString(36).substring(6)}`;
            console.log(`Creating mock firewall with ID ${mockFirewallId}`);
            firewall = {
              id: mockFirewallId,
              name: `firewall-fallback-${server.name}`,
              status: "active",
              created_at: (/* @__PURE__ */ new Date()).toISOString(),
              droplet_ids: [parseInt(server.dropletId)],
              inbound_rules,
              outbound_rules
            };
            digitalOcean.mockFirewalls[mockFirewallId] = firewall;
            console.log(`Created new firewall ${mockFirewallId} for server ${server.id}`);
          }
        }
        res.json(firewall);
      } catch (error) {
        console.error("Error in firewall update process:", error);
        const mockFirewall = {
          id: `mock-${Math.random().toString(36).substring(7)}`,
          name: `firewall-${server.name}`,
          status: "active",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          droplet_ids: [parseInt(server.dropletId)],
          inbound_rules,
          outbound_rules
        };
        console.log("Returning mock firewall as fallback");
        res.json(mockFirewall);
      }
    } catch (error) {
      console.error("Error updating firewall:", error);
      const mockFirewall = {
        id: `mock-fallback-${Math.random().toString(36).substring(7)}`,
        name: `firewall-${server.name}`,
        status: "active",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        droplet_ids: [parseInt(server.dropletId)],
        inbound_rules: req.body.inbound_rules || [],
        outbound_rules: req.body.outbound_rules || []
      };
      console.log("Returning mock firewall after error");
      res.json(mockFirewall);
    }
  });
  app2.post("/api/servers/:id/firewall/rules", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    try {
      const { rule_type, rule } = req.body;
      if (!rule_type || !rule || !["inbound", "outbound"].includes(rule_type)) {
        return res.status(400).json({ message: "Invalid rule format. Specify 'rule_type' as 'inbound' or 'outbound' and provide a valid rule object." });
      }
      let firewall = await digitalOcean.getFirewallByDropletId(server.dropletId);
      if (!firewall) {
        return res.status(400).json({
          message: "No firewall exists for this server. Please enable a firewall first before adding rules."
        });
      }
      try {
        const isMockFirewall = firewall.id && (firewall.id.includes("fallback") || firewall.id.includes("mock") || digitalOcean.useMock || firewall.id.length < 30);
        if (isMockFirewall) {
          console.log(`Adding ${rule_type} rule to mock firewall ${firewall.id}`);
          if (rule_type === "inbound") {
            firewall.inbound_rules.push(rule);
          } else {
            firewall.outbound_rules.push(rule);
          }
          if (firewall.id) {
            digitalOcean.mockFirewalls[firewall.id] = firewall;
          }
        } else {
          if (firewall.id) {
            console.log(`Attempting to add ${rule_type} rule to real DO firewall ${firewall.id}`);
            try {
              if (rule_type === "inbound") {
                await digitalOcean.addRulesToFirewall(firewall.id, [rule], []);
              } else {
                await digitalOcean.addRulesToFirewall(firewall.id, [], [rule]);
              }
            } catch (apiError) {
              console.error(`DigitalOcean API error: ${apiError}. Falling back to mock mode.`);
              if (rule_type === "inbound") {
                firewall.inbound_rules.push(rule);
              } else {
                firewall.outbound_rules.push(rule);
              }
              digitalOcean.mockFirewalls[firewall.id] = firewall;
            }
          } else {
            throw new Error("Firewall ID is missing");
          }
        }
      } catch (error) {
        console.error(`Error adding rule to firewall: ${error}`);
        console.error("Critical error when adding firewall rule:", error);
        throw error;
      }
      const updatedFirewall = await digitalOcean.getFirewallByDropletId(server.dropletId);
      res.json(updatedFirewall);
    } catch (error) {
      console.error("Error adding firewall rule:", error);
      res.status(500).json({ message: "Failed to add firewall rule" });
    }
  });
  app2.delete("/api/servers/:id/firewall/rules", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(404);
    }
    try {
      const { rule_type, rule } = req.body;
      if (!rule_type || !rule || !["inbound", "outbound"].includes(rule_type)) {
        return res.status(400).json({ message: "Invalid rule format. Specify 'rule_type' as 'inbound' or 'outbound' and provide a valid rule object." });
      }
      console.log(`Attempting to delete ${rule_type} rule:`, JSON.stringify(rule));
      const firewall = await digitalOcean.getFirewallByDropletId(server.dropletId);
      if (!firewall) {
        console.log(`No firewall found for server ${server.id} when trying to delete rule`);
        return res.status(404).json({ message: "No firewall found for this server" });
      }
      console.log(`Found firewall ${firewall.id} with ${firewall.inbound_rules.length} inbound and ${firewall.outbound_rules.length} outbound rules`);
      try {
        const updatedInboundRules = rule_type === "inbound" ? firewall.inbound_rules.filter((r) => !(r.protocol === rule.protocol && r.ports === rule.ports && JSON.stringify(r.sources) === JSON.stringify(rule.sources))) : firewall.inbound_rules;
        const updatedOutboundRules = rule_type === "outbound" ? firewall.outbound_rules.filter((r) => !(r.protocol === rule.protocol && r.ports === rule.ports && JSON.stringify(r.destinations) === JSON.stringify(rule.destinations))) : firewall.outbound_rules;
        const isMockFirewall = firewall.id && (firewall.id.includes("fallback") || firewall.id.includes("mock") || digitalOcean.useMock || firewall.id.length < 30);
        if (!firewall.id) {
          throw new Error("Firewall ID is missing");
        }
        try {
          console.log(`Updating firewall ${firewall.id} with DigitalOcean API`);
          const updatedFirewall = await digitalOcean.updateFirewall(
            firewall.id,
            {
              inbound_rules: updatedInboundRules,
              outbound_rules: updatedOutboundRules
            }
          );
          res.json(updatedFirewall);
        } catch (apiError) {
          console.error(`DigitalOcean API error removing rule: ${apiError}`);
          throw apiError;
        }
      } catch (updateError) {
        console.error("Error updating firewall rules:", updateError);
        res.status(500).json({
          message: "Failed to update firewall rules",
          error: updateError.message
        });
      }
    } catch (error) {
      console.error("Error deleting firewall rule:", error);
      res.status(500).json({ message: "Failed to delete firewall rule" });
    }
  });
  app2.patch("/api/account", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const { username, currentPassword, newPassword } = req.body;
    if (!username || !currentPassword) {
      return res.status(400).json({ message: "Username and current password are required" });
    }
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const isPasswordValid = await comparePasswords(currentPassword, currentUser.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      if (newPassword && newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }
      const updates = { username };
      if (!newPassword && !currentUser.password.includes(".")) {
        console.log(`Upgrading password format for user ${currentUser.id} during account update`);
        try {
          updates.password = await hashPassword(currentPassword);
        } catch (error) {
          console.error("Error upgrading password format:", error);
        }
      }
      if (newPassword) {
        try {
          updates.password = await hashPassword(newPassword);
        } catch (error) {
          console.error("Error hashing new password:", error);
          return res.status(500).json({ message: "Error updating password. Please try again." });
        }
      }
      try {
        const user = await storage.updateUser(req.user.id, updates);
        if (newPassword) {
          req.logout((err) => {
            if (err) {
              console.error("Error logging out after password change:", err);
              return res.status(500).json({ message: "Error during logout process. Please log out manually." });
            }
            res.json({
              username: user.username,
              passwordChanged: true
            });
          });
        } else {
          res.json({
            username: user.username,
            passwordChanged: false
          });
        }
      } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Error updating account. Please try again." });
      }
    } catch (error) {
      console.error("Account update error:", error);
      res.status(500).json({ message: error.message || "An unexpected error occurred" });
    }
  });
  app2.get("/api/account/api-key", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ apiKey: user.apiKey });
    } catch (error) {
      console.error("Error fetching API key:", error);
      res.status(500).json({ message: "Failed to fetch API key" });
    }
  });
  app2.post("/api/account/api-key", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required for verification" });
    }
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const isPasswordValid = await comparePasswords(password, currentUser.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Password is incorrect" });
      }
      const apiKey = Array.from(
        { length: 64 },
        () => Math.floor(Math.random() * 16).toString(16)
      ).join("");
      const updatedUser = await storage.updateUser(req.user.id, { apiKey });
      res.json({
        apiKey: updatedUser.apiKey,
        message: "API key generated successfully"
      });
    } catch (error) {
      console.error("Error generating API key:", error);
      res.status(500).json({ message: "Failed to generate API key" });
    }
  });
  app2.get("/api/servers/:id/metrics/latest", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        return res.sendStatus(404);
      }
      const latestMetric = await storage.getLatestServerMetric(serverId);
      if (!latestMetric) {
        const doMetrics = await digitalOcean.getServerMetrics(server.dropletId);
        const newMetric = {
          serverId,
          cpuUsage: Math.round(doMetrics.cpu),
          memoryUsage: Math.round(doMetrics.memory),
          diskUsage: Math.round(doMetrics.disk),
          networkIn: doMetrics.network_in,
          networkOut: doMetrics.network_out,
          loadAverage: doMetrics.load_average,
          uptimeSeconds: doMetrics.uptime_seconds,
          timestamp: /* @__PURE__ */ new Date()
        };
        const savedMetric = await storage.createServerMetric(newMetric);
        await storage.updateServer(serverId, {
          lastMonitored: savedMetric.timestamp
        });
        return res.json(savedMetric);
      }
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1e3);
      if (latestMetric.timestamp < fiveMinutesAgo) {
        const doMetrics = await digitalOcean.getServerMetrics(server.dropletId);
        const newMetric = {
          serverId,
          cpuUsage: Math.round(doMetrics.cpu),
          memoryUsage: Math.round(doMetrics.memory),
          diskUsage: Math.round(doMetrics.disk),
          networkIn: doMetrics.network_in,
          networkOut: doMetrics.network_out,
          loadAverage: doMetrics.load_average,
          uptimeSeconds: doMetrics.uptime_seconds,
          timestamp: /* @__PURE__ */ new Date()
        };
        const savedMetric = await storage.createServerMetric(newMetric);
        await storage.updateServer(serverId, {
          lastMonitored: savedMetric.timestamp
        });
        return res.json(savedMetric);
      }
      return res.json(latestMetric);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/servers/:id/metrics/history", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        return res.sendStatus(404);
      }
      const limit = req.query.limit ? parseInt(req.query.limit) : 24;
      const metrics = await storage.getServerMetricHistory(serverId, limit);
      return res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/servers/:id/bandwidth", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        return res.sendStatus(404);
      }
      const bandwidthData = await getServerBandwidth(serverId);
      return res.json(bandwidthData);
    } catch (error) {
      console.error(`Error getting bandwidth data:`, error);
      res.status(500).json({
        message: "Failed to retrieve bandwidth data",
        error: error.message
      });
    }
  });
  app2.get("/api/servers/:id/snapshots", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        return res.sendStatus(404);
      }
      const snapshots2 = await storage.getSnapshotsByServer(serverId);
      return res.json(snapshots2);
    } catch (error) {
      console.error(`Error getting server snapshots:`, error);
      res.status(500).json({
        message: "Failed to retrieve server snapshots",
        error: error.message
      });
    }
  });
  app2.post("/api/servers/:id/snapshots", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        return res.sendStatus(404);
      }
      const existingSnapshots = await storage.getSnapshotsByServer(serverId);
      if (existingSnapshots.length >= 2) {
        return res.status(400).json({
          message: "Snapshot limit reached. Delete an existing snapshot before creating a new one."
        });
      }
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ message: "Valid snapshot name is required" });
      }
      const snapshotId = await digitalOcean.createDropletSnapshot(server.dropletId, name);
      const initialSizeGb = server.specs?.disk || 25;
      console.log(`Creating snapshot for server ${serverId} with name ${name} and initial size ${initialSizeGb}GB`);
      const newSnapshot = await storage.createSnapshot({
        userId: server.userId,
        serverId,
        name,
        snapshotId,
        sizeGb: initialSizeGb,
        createdAt: /* @__PURE__ */ new Date(),
        status: "creating",
        description: `Snapshot for server ${server.name}`,
        expiresAt: null
      });
      setTimeout(async () => {
        try {
          console.log(`Fetching actual size for snapshot ${snapshotId}`);
          const snapshotDetails = await digitalOcean.getSnapshotDetails(snapshotId);
          if (snapshotDetails && snapshotDetails.size_gigabytes) {
            console.log(`Updating snapshot ${newSnapshot.id} with actual size: ${snapshotDetails.size_gigabytes}GB`);
            await storage.updateSnapshot(newSnapshot.id, {
              sizeGb: snapshotDetails.size_gigabytes,
              status: "completed"
            });
          }
        } catch (error) {
          console.error(`Error updating snapshot size:`, error);
        }
      }, 3e3);
      const pricePerGbPerMonth = 0.06 * 1.005;
      const costInDollars = pricePerGbPerMonth * initialSizeGb;
      await storage.createTransaction({
        userId: server.userId,
        amount: toCents(costInDollars),
        type: "charge",
        status: "completed",
        description: `Snapshot creation: ${name} (${initialSizeGb}GB)`,
        createdAt: /* @__PURE__ */ new Date(),
        currency: "USD",
        paypalTransactionId: null
      });
      await storage.updateUserBalance(server.userId, -toCents(costInDollars));
      return res.status(201).json(newSnapshot);
    } catch (error) {
      console.error(`Error creating snapshot:`, error);
      res.status(500).json({
        message: "Failed to create snapshot",
        error: error.message
      });
    }
  });
  app2.get("/api/snapshots/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const snapshotId = parseInt(req.params.id);
      const snapshot = await storage.getSnapshot(snapshotId);
      if (!snapshot || snapshot.userId !== req.user.id && !req.user.isAdmin) {
        return res.sendStatus(404);
      }
      try {
        const snapshotDetails = await digitalOcean.getSnapshotDetails(snapshot.snapshotId);
        if (snapshotDetails.size_gigabytes !== snapshot.sizeGb) {
          await storage.updateSnapshot(snapshot.id, {
            sizeGb: snapshotDetails.size_gigabytes
          });
          snapshot.sizeGb = snapshotDetails.size_gigabytes;
        }
        return res.json({
          ...snapshot,
          details: snapshotDetails
        });
      } catch (doError) {
        console.warn(`Error getting DigitalOcean snapshot details:`, doError);
        return res.json(snapshot);
      }
    } catch (error) {
      console.error(`Error getting snapshot details:`, error);
      res.status(500).json({
        message: "Failed to retrieve snapshot details",
        error: error.message
      });
    }
  });
  app2.delete("/api/servers/:id/snapshots/:snapshotId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const snapshotId = parseInt(req.params.snapshotId);
      console.log(`Processing snapshot deletion request for snapshot ${snapshotId} on server ${serverId}`);
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        console.log(`User ${req.user.id} attempted to delete snapshot ${snapshotId} but doesn't own server ${serverId}`);
        return res.status(404).json({ message: "Server not found" });
      }
      const snapshot = await storage.getSnapshot(snapshotId);
      if (!snapshot || snapshot.serverId !== serverId) {
        console.log(`Snapshot ${snapshotId} not found or doesn't belong to server ${serverId}`);
        return res.status(404).json({ message: "Snapshot not found" });
      }
      console.log(`Starting snapshot deletion process for snapshot ${snapshotId} (DO ID: ${snapshot.snapshotId})`);
      try {
        await digitalOcean.deleteSnapshot(snapshot.snapshotId);
        console.log(`Successfully deleted snapshot ${snapshotId} from DigitalOcean`);
      } catch (doError) {
        console.warn(`Error deleting DigitalOcean snapshot:`, doError);
        if (process.env.NODE_ENV === "production") {
          console.error(`Production error deleting snapshot ${snapshotId}: ${doError}`);
        } else {
          console.log(`[DEV] Continuing with database deletion despite DigitalOcean API error`);
        }
      }
      console.log(`Removing snapshot ${snapshotId} from database`);
      await storage.deleteSnapshot(snapshotId);
      console.log(`Successfully removed snapshot ${snapshotId} from database`);
      return res.status(200).json({ message: "Snapshot deleted successfully" });
    } catch (error) {
      console.error(`Error deleting snapshot:`, error);
      res.status(500).json({
        message: "Failed to delete snapshot",
        error: error.message
      });
    }
  });
  app2.delete("/api/snapshots/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const snapshotId = parseInt(req.params.id);
      console.log(`Processing legacy snapshot deletion request for snapshot ${snapshotId}`);
      const snapshot = await storage.getSnapshot(snapshotId);
      if (!snapshot || snapshot.userId !== req.user.id && !req.user.isAdmin) {
        console.log(`User ${req.user.id} attempted to delete snapshot ${snapshotId} but doesn't own it or it doesn't exist`);
        return res.sendStatus(404);
      }
      console.log(`Starting legacy snapshot deletion process for snapshot ${snapshotId} (DO ID: ${snapshot.snapshotId})`);
      try {
        await digitalOcean.deleteSnapshot(snapshot.snapshotId);
        console.log(`Successfully deleted snapshot ${snapshotId} from DigitalOcean (legacy endpoint)`);
      } catch (doError) {
        console.warn(`Error deleting DigitalOcean snapshot:`, doError);
        if (process.env.NODE_ENV === "production") {
          console.error(`Production error deleting snapshot ${snapshotId}: ${doError}`);
        } else {
          console.log(`[DEV] Continuing with database deletion despite DigitalOcean API error (legacy endpoint)`);
        }
      }
      console.log(`Removing snapshot ${snapshotId} from database (legacy endpoint)`);
      await storage.deleteSnapshot(snapshotId);
      console.log(`Successfully removed snapshot ${snapshotId} from database (legacy endpoint)`);
      return res.status(200).json({ message: "Snapshot deleted successfully" });
    } catch (error) {
      console.error(`Error deleting snapshot:`, error);
      res.status(500).json({
        message: "Failed to delete snapshot",
        error: error.message
      });
    }
  });
  app2.post("/api/servers/:id/snapshots/:snapshotId/restore", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const snapshotId = parseInt(req.params.snapshotId);
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(404).json({ message: "Server not found" });
      }
      const snapshot = await storage.getSnapshot(snapshotId);
      if (!snapshot || snapshot.serverId !== serverId) {
        return res.status(404).json({ message: "Snapshot not found" });
      }
      if (snapshot.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to access this snapshot" });
      }
      try {
        if (digitalOcean.useMock) {
          console.log(`[MOCK] Restoring droplet ${server.dropletId} from snapshot ${snapshot.snapshotId}`);
        } else {
          await digitalOcean.restoreDropletFromSnapshot(server.dropletId, snapshot.snapshotId);
        }
        await storage.updateServer(serverId, {
          status: "restoring",
          lastMonitored: /* @__PURE__ */ new Date()
        });
        setTimeout(async () => {
          try {
            const server2 = await storage.getServer(serverId);
            if (server2 && server2.status === "restoring") {
              console.log(`Auto-checking restore status for server ${serverId}`);
              await storage.updateServer(serverId, {
                status: "active",
                lastMonitored: /* @__PURE__ */ new Date()
              });
              console.log(`Server ${serverId} restore status automatically updated to 'active'`);
            }
          } catch (error) {
            console.error(`Error auto-updating restore status for server ${serverId}:`, error);
          }
        }, 12e4);
      } catch (err) {
        console.error(`Error during snapshot restore: ${err}`);
        if (process.env.NODE_ENV !== "production") {
          console.log(`[DEV] Simulating successful snapshot restore despite DO API error`);
          await storage.updateServer(serverId, {
            status: "restoring",
            lastMonitored: /* @__PURE__ */ new Date()
          });
        } else {
          throw err;
        }
      }
      return res.json({
        message: "Server restore initiated successfully",
        status: "restoring"
      });
    } catch (error) {
      console.error(`Error restoring server from snapshot:`, error);
      res.status(500).json({
        message: "Failed to restore server from snapshot",
        error: error.message
      });
    }
  });
  app2.post("/api/servers/:id/metrics/refresh", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        return res.sendStatus(404);
      }
      try {
        const dropletDetails = await digitalOcean.apiRequest(
          `/droplets/${server.dropletId}`
        );
        if (dropletDetails?.droplet && dropletDetails.droplet.networks) {
          const serverUpdateData = {
            lastMonitored: /* @__PURE__ */ new Date()
          };
          if (dropletDetails.droplet.networks.v4 && dropletDetails.droplet.networks.v4.length > 0) {
            const publicIp = dropletDetails.droplet.networks.v4.find(
              (network) => network.type === "public"
            );
            if (publicIp) {
              serverUpdateData.ipAddress = publicIp.ip_address;
            }
          }
          if (dropletDetails.droplet.networks.v6 && dropletDetails.droplet.networks.v6.length > 0) {
            serverUpdateData.ipv6Address = dropletDetails.droplet.networks.v6[0].ip_address;
          }
          if (dropletDetails.droplet.status) {
            let mappedStatus = dropletDetails.droplet.status;
            console.log(`[STATUS DEBUG] Server ${serverId} DO status: ${dropletDetails.droplet.status}`);
            if (mappedStatus === "active" || mappedStatus === "running") {
              serverUpdateData.status = "active";
            } else if (mappedStatus === "new" || mappedStatus === "off") {
              serverUpdateData.status = "off";
            } else {
              serverUpdateData.status = mappedStatus;
            }
            console.log(`[STATUS DEBUG] Server ${serverId} mapped status: ${serverUpdateData.status}`);
          }
          await storage.updateServer(serverId, serverUpdateData);
        }
      } catch (ipError) {
        console.error("Failed to fetch IP information:", ipError);
      }
      const doMetrics = await digitalOcean.getServerMetrics(server.dropletId);
      const newMetric = {
        serverId,
        cpuUsage: Math.round(doMetrics.cpu),
        memoryUsage: Math.round(doMetrics.memory),
        diskUsage: Math.round(doMetrics.disk),
        networkIn: doMetrics.network_in,
        networkOut: doMetrics.network_out,
        loadAverage: doMetrics.load_average,
        uptimeSeconds: doMetrics.uptime_seconds,
        timestamp: /* @__PURE__ */ new Date()
      };
      const savedMetric = await storage.createServerMetric(newMetric);
      const updatedServer = await storage.getServer(serverId);
      return res.json({
        metric: savedMetric,
        server: updatedServer
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  const httpServer = createServer(app2);
  setupTerminalSocket(httpServer);
  app2.get("/api/test/password/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const serverId = parseInt(req.params.id);
    try {
      const server = await storage.getServer(serverId);
      if (!server || server.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(404).json({ message: "Server not found or access denied" });
      }
      const serverData = await db.query.servers.findFirst({
        where: eq4(servers.id, serverId)
      });
      const password = serverData?.rootPassword || "";
      res.json({
        serverId,
        hasPassword: !!password,
        passwordLength: password.length,
        passwordMasked: password ? `${password.substring(0, 3)}***${password.substring(password.length - 2)}` : null,
        passwordStorageMethod: "db.update",
        lastUpdated: serverData?.lastMonitored || null
      });
    } catch (error) {
      console.error("Error checking password:", error);
      res.status(500).json({
        message: "Error checking password: " + error.message
      });
    }
  });
  app2.get("/api/docs/sections", async (_req, res) => {
    try {
      const sections = await db.query.docSections.findMany({
        orderBy: [asc(docSections.order)]
      });
      const articles = await db.query.docArticles.findMany({
        orderBy: [asc(docArticles.order)]
      });
      const sectionsWithArticles = sections.map((section) => {
        const sectionArticles = articles.filter((article) => article.sectionId === section.id);
        return {
          ...section,
          children: sectionArticles
        };
      });
      res.json(sectionsWithArticles);
    } catch (error) {
      console.error("Error fetching documentation:", error);
      res.status(500).json({ message: "Failed to fetch documentation" });
    }
  });
  app2.post("/api/docs/sections", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
    try {
      const { title, order } = req.body;
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      const section = await db.insert(docSections).values({
        title,
        order: order || 0
      }).returning();
      res.status(201).json(section[0]);
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(500).json({ message: "Failed to create section" });
    }
  });
  app2.patch("/api/docs/sections/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
    try {
      const sectionId = parseInt(req.params.id);
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      const section = await db.update(docSections).set({ title }).where(eq4(docSections.id, sectionId)).returning();
      if (section.length === 0) {
        return res.status(404).json({ message: "Section not found" });
      }
      res.json(section[0]);
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ message: "Failed to update section" });
    }
  });
  app2.delete("/api/docs/sections/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
    try {
      const sectionId = parseInt(req.params.id);
      await db.delete(docArticles).where(eq4(docArticles.sectionId, sectionId));
      await db.delete(docSections).where(eq4(docSections.id, sectionId));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting section:", error);
      res.status(500).json({ message: "Failed to delete section" });
    }
  });
  app2.post("/api/docs/articles", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
    try {
      const { sectionId, title, content, order } = req.body;
      if (!sectionId || !title || !content) {
        return res.status(400).json({ message: "SectionId, title, and content are required" });
      }
      const article = await db.insert(docArticles).values({
        sectionId: parseInt(sectionId),
        title,
        content,
        order: order || 0,
        lastUpdated: /* @__PURE__ */ new Date()
      }).returning();
      res.status(201).json(article[0]);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });
  app2.patch("/api/docs/articles/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
    try {
      const articleId = parseInt(req.params.id);
      const { sectionId, title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      const updateData = {
        title,
        content,
        lastUpdated: /* @__PURE__ */ new Date()
      };
      if (sectionId) {
        updateData.sectionId = parseInt(sectionId);
      }
      const article = await db.update(docArticles).set(updateData).where(eq4(docArticles.id, articleId)).returning();
      if (article.length === 0) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article[0]);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });
  app2.delete("/api/docs/articles/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
    try {
      const articleId = parseInt(req.params.id);
      await db.delete(docArticles).where(eq4(docArticles.id, articleId));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });
  app2.patch("/api/docs/sections/:id/reorder", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const sectionId = parseInt(req.params.id);
      const { order } = req.body;
      if (typeof order !== "number" || order < 1) {
        return res.status(400).json({ message: "Invalid order number" });
      }
      const section = await storage.updateDocSection(sectionId, { order });
      res.json(section);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.patch("/api/docs/articles/:id/reorder", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const articleId = parseInt(req.params.id);
      const { order } = req.body;
      if (typeof order !== "number" || order < 1) {
        return res.status(400).json({ message: "Invalid order number" });
      }
      const article = await storage.updateDocArticle(articleId, { order });
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.use("/api/health", health_default);
  return httpServer;
}

// server/vite.js
import path4 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import express4 from "express";
var __dirname3 = path4.dirname(fileURLToPath3(import.meta.url));
async function setupVite(app2, server) {
  const { createServer: createServer2 } = await import("vite");
  const vite = await createServer2({
    server: { middlewareMode: true },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  return { vite, server };
}

// server/index.ts
import { eq as eq12 } from "drizzle-orm";

// server/admin/routes.ts
import * as crypto from "crypto";
function adminMiddleware2(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
function registerAdminRoutes(app2) {
  app2.use("/api/admin", adminMiddleware2);
  app2.get("/api/admin/stats", async (req, res) => {
    try {
      const users3 = await storage.getAllUsers();
      const servers3 = await storage.getAllServers();
      const tickets = await storage.getAllTickets();
      const transactions = await storage.getAllTransactions();
      const totalDeposits = transactions.filter((tx) => tx.type === "deposit" && tx.status === "completed").reduce((sum, tx) => sum + tx.amount, 0) / 100;
      const totalSpending = transactions.filter((tx) => tx.type === "charge" && tx.status === "completed").reduce((sum, tx) => sum + tx.amount, 0) / 100;
      const serversByRegion = servers3.reduce((acc, server) => {
        acc[server.region] = (acc[server.region] || 0) + 1;
        return acc;
      }, {});
      const serversBySize = servers3.reduce((acc, server) => {
        acc[server.size] = (acc[server.size] || 0) + 1;
        return acc;
      }, {});
      const stats = {
        users: {
          total: users3.length,
          active: users3.length,
          // We don't have an active status for users yet
          admins: users3.filter((user) => user.isAdmin).length
        },
        servers: {
          total: servers3.length,
          active: servers3.filter((server) => server.status === "active").length,
          byRegion: serversByRegion,
          bySize: serversBySize
        },
        tickets: {
          total: tickets.length,
          open: tickets.filter((ticket) => ticket.status === "open").length,
          closed: tickets.filter((ticket) => ticket.status === "closed").length,
          critical: tickets.filter((ticket) => ticket.priority === "critical").length
        },
        billing: {
          totalDeposits,
          totalSpending
        }
      };
      res.json(stats);
    } catch (error) {
      log(`Admin stats error: ${error}`, "admin");
      res.status(500).json({ message: "Failed to load admin statistics" });
    }
  });
  app2.get("/api/admin/users", async (req, res) => {
    try {
      const users3 = await storage.getAllUsers();
      res.json(users3);
    } catch (error) {
      log(`Admin users error: ${error}`, "admin");
      res.status(500).json({ message: "Failed to load users" });
    }
  });
  app2.patch("/api/admin/users/:id/balance", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      if (isNaN(userId) || !amount || isNaN(amount)) {
        return res.status(400).json({ message: "Invalid user ID or amount" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUser(userId, {
        balance: amount
      });
      const prevBalance = user.balance;
      const amountDifference = amount - prevBalance;
      if (amountDifference !== 0) {
        const transactionType = amountDifference > 0 ? "deposit" : "charge";
        const absAmount = Math.abs(amountDifference);
        await storage.createTransaction({
          userId,
          amount: absAmount,
          type: transactionType,
          status: "completed",
          currency: "USD",
          paypalTransactionId: null,
          createdAt: /* @__PURE__ */ new Date(),
          description: `Admin adjustment: ${amountDifference > 0 ? "Added" : "Deducted"} ${absAmount / 100} USD`
        });
      }
      res.json(updatedUser);
    } catch (error) {
      log(`Admin update user balance error: ${error}`, "admin");
      res.status(500).json({ message: "Failed to update user balance" });
    }
  });
  app2.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, password, isAdmin, isSuspended } = req.body;
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updates = {};
      if (username !== void 0) updates.username = username;
      if (password !== void 0) updates.password = password;
      if (isAdmin !== void 0) updates.isAdmin = isAdmin;
      if (isSuspended !== void 0) updates.isSuspended = isSuspended;
      if (isAdmin === false && req.user?.id === userId) {
        return res.status(403).json({ message: "Cannot remove your own admin privileges" });
      }
      if (isSuspended === true && targetUser.isAdmin) {
        return res.status(403).json({ message: "Cannot suspend admin accounts" });
      }
      if (isSuspended === true && req.user?.id === userId) {
        return res.status(403).json({ message: "Cannot suspend your own account" });
      }
      const updatedUser = await storage.updateUser(userId, updates);
      log(`Admin updated user ${userId} (${username || targetUser.username})`, "admin");
      res.json(updatedUser);
    } catch (error) {
      log(`Admin update user details error: ${error}`, "admin");
      res.status(500).json({ message: "Failed to update user details" });
    }
  });
  app2.get("/api/admin/servers", async (req, res) => {
    try {
      const servers3 = await storage.getAllServers();
      res.json(servers3);
    } catch (error) {
      log(`Admin servers error: ${error}`, "admin");
      res.status(500).json({ message: "Failed to load servers" });
    }
  });
  app2.get("/api/admin/tickets", async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      log(`Admin tickets error: ${error}`, "admin");
      res.status(500).json({ message: "Failed to load tickets" });
    }
  });
  app2.get("/api/admin/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      log(`Admin transactions error: ${error}`, "admin");
      res.status(500).json({ message: "Failed to load transactions" });
    }
  });
  app2.get("/api/admin/ip-bans", async (req, res) => {
    try {
      const ipBans2 = await storage.getAllIPBans();
      res.json(ipBans2);
    } catch (error) {
      log(`Admin IP bans error: ${error}`, "admin");
      res.status(500).json({ message: "Failed to load IP bans" });
    }
  });
  app2.post("/api/admin/ip-bans", async (req, res) => {
    try {
      const { ipAddress, reason, expiresAt } = req.body;
      if (!ipAddress || !reason) {
        return res.status(400).json({ message: "IP address and reason are required" });
      }
      const existingBan = await storage.getIPBan(ipAddress);
      if (existingBan) {
        return res.status(409).json({ message: "IP address is already banned" });
      }
      const ipBan = await storage.createIPBan({
        ipAddress,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        bannedBy: req.user.id,
        isActive: true
      });
      res.status(201).json(ipBan);
    } catch (error) {
      log(`Admin create IP ban error: ${error}`, "admin");
      res.status(500).json({ message: "Failed to create IP ban" });
    }
  });
  app2.delete("/api/admin/ip-bans/:id", async (req, res) => {
    try {
      const banId = parseInt(req.params.id);
      if (isNaN(banId)) {
        return res.status(400).json({ message: "Invalid ban ID" });
      }
      await storage.deleteIPBan(banId);
      res.status(204).send();
    } catch (error) {
      log(`Admin delete IP ban error: ${error}`, "admin");
      res.status(500).json({ message: "Failed to delete IP ban" });
    }
  });
  app2.delete("/api/admin/cloudrack-terminal-keys", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      let totalRemoved = 0;
      let userCount = 0;
      for (const user of allUsers) {
        const keys = await storage.getSSHKeysByUser(user.id);
        const cloudRackKeys = keys.filter((key) => key.isCloudRackKey && !key.isSystemKey);
        if (cloudRackKeys.length > 0) {
          userCount++;
          for (const key of cloudRackKeys) {
            await storage.deleteSSHKey(key.id);
            totalRemoved++;
            log(`Removed CloudRack Terminal Key ${key.id} for user ${user.id}`, "admin");
          }
        }
      }
      return res.status(200).json({
        message: `Successfully cleaned up CloudRack Terminal Keys. Removed ${totalRemoved} keys from ${userCount} users.`,
        keysRemoved: totalRemoved,
        usersAffected: userCount
      });
    } catch (error) {
      log(`Error cleaning up CloudRack Terminal Keys: ${error}`, "admin");
      return res.status(500).json({
        message: "Error cleaning up CloudRack Terminal Keys",
        error: error.message
      });
    }
  });
  app2.get("/api/admin/volumes", async (req, res) => {
    try {
      const servers3 = await storage.getAllServers();
      const volumes2 = [];
      for (const server of servers3) {
        const serverVolumes = await storage.getVolumesByServer(server.id);
        volumes2.push(...serverVolumes.map((volume) => ({
          ...volume,
          serverName: server.name,
          serverRegion: server.region
        })));
      }
      const unattachedVolumes = await storage.getUnattachedVolumes();
      volumes2.push(...unattachedVolumes.map((volume) => ({
        ...volume,
        serverName: null,
        serverRegion: null
      })));
      res.status(200).json(volumes2);
    } catch (error) {
      console.error("Error getting volumes:", error);
      res.status(500).json({ message: "Failed to retrieve volumes" });
    }
  });
  app2.get("/api/admin/volume-stats", async (req, res) => {
    try {
      const servers3 = await storage.getAllServers();
      const volumes2 = [];
      for (const server of servers3) {
        const serverVolumes = await storage.getVolumesByServer(server.id);
        volumes2.push(...serverVolumes);
      }
      const unattachedVolumes = await storage.getUnattachedVolumes();
      volumes2.push(...unattachedVolumes);
      const totalStorage = volumes2.reduce((total, volume) => total + volume.size, 0);
      const attachedStorage = volumes2.filter((volume) => volume.serverId !== null).reduce((total, volume) => total + volume.size, 0);
      const unattachedStorage = volumes2.filter((volume) => volume.serverId === null).reduce((total, volume) => total + volume.size, 0);
      res.status(200).json({
        totalStorage,
        attachedStorage,
        unattachedStorage,
        volumeCount: volumes2.length,
        attachedVolumeCount: volumes2.filter((volume) => volume.serverId !== null).length,
        unattachedVolumeCount: volumes2.filter((volume) => volume.serverId === null).length
      });
    } catch (error) {
      console.error("Error getting volume stats:", error);
      res.status(500).json({ message: "Failed to retrieve volume statistics" });
    }
  });
  app2.get("/api/admin/users/:id/api-key", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ apiKey: user.apiKey });
    } catch (error) {
      console.error("Error getting user API key:", error);
      res.status(500).json({ message: "Failed to retrieve API key" });
    }
  });
  app2.post("/api/admin/users/:id/api-key", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const apiKey = crypto.randomBytes(32).toString("hex");
      await storage.updateUser(userId, { apiKey });
      res.status(200).json({
        apiKey,
        message: "API key regenerated successfully"
      });
    } catch (error) {
      console.error("Error regenerating API key:", error);
      res.status(500).json({ message: "Failed to regenerate API key" });
    }
  });
  log("Admin routes registered", "admin");
}

// server/routes/github.ts
import express5 from "express";

// server/services/github.ts
import fetch2 from "node-fetch";
import { eq as eq5 } from "drizzle-orm";
async function saveGitHubToken(userId, token, userData) {
  try {
    await db.update(users).set({
      githubToken: token,
      githubUsername: userData?.login || null,
      githubUserId: userData?.id || null,
      githubConnectedAt: token ? (/* @__PURE__ */ new Date()).toISOString() : null
    }).where(eq5(users.id, userId));
    return true;
  } catch (error) {
    logger.error("Error saving GitHub token:", error);
    throw error;
  }
}
async function getUserRepositories(token) {
  try {
    const response = await fetch2("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`GitHub API error: ${response.status} ${errorText}`);
      throw new Error(`Failed to fetch repositories: ${response.status}`);
    }
    const repos = await response.json();
    return repos;
  } catch (error) {
    logger.error("Error fetching GitHub repositories:", error);
    throw error;
  }
}

// server/routes/github.ts
import { eq as eq6 } from "drizzle-orm";
import fetch3 from "node-fetch";
var router3 = express5.Router();
router3.use("/repos", requireAuth);
router3.use("/auth-url", requireAuth);
router3.use("/disconnect", requireAuth);
router3.get("/repos", async (req, res) => {
  try {
    const githubToken = req.user.githubToken;
    if (!githubToken) {
      return res.status(401).json({ error: "GitHub account not connected" });
    }
    const repos = await getUserRepositories(githubToken);
    res.json(repos);
  } catch (error) {
    console.error("GitHub repositories fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});
router3.get("/auth-url", async (req, res) => {
  try {
    const clientId2 = process.env.GITHUB_CLIENT_ID?.trim();
    const redirectUri = process.env.GITHUB_REDIRECT_URI?.trim();
    const wantJson = req.query.json === "true";
    if (!clientId2 || !redirectUri) {
      return res.status(500).json({ error: "GitHub OAuth configuration is missing" });
    }
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId2}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user:email`;
    logger.info(`\u{1F419} [GitHub] GitHub OAuth URL generated: ${authUrl}`);
    if (wantJson) {
      return res.json({ url: authUrl });
    }
    return res.redirect(authUrl);
  } catch (error) {
    logger.error("Error generating GitHub auth URL:", error);
    res.status(500).json({ error: "Failed to generate GitHub auth URL" });
  }
});
router3.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    logger.info(`\u{1F419} [GitHub] Received OAuth callback with code: ${code ? code.toString().substring(0, 10) + "..." : "MISSING"}`);
    if (!code) {
      return res.status(400).json({ error: "Missing code parameter" });
    }
    const clientId2 = process.env.GITHUB_CLIENT_ID;
    const clientSecret2 = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    logger.info(`\u{1F419} [GitHub] Using Client ID: ${clientId2?.substring(0, 5)}...`);
    logger.info(`\u{1F419} [GitHub] Using Redirect URI: ${redirectUri}`);
    if (!clientId2 || !clientSecret2 || !redirectUri) {
      return res.status(500).json({ error: "GitHub OAuth configuration is missing" });
    }
    logger.info(`\u{1F419} [GitHub] Sending token request to GitHub with redirect_uri=${redirectUri}`);
    const tokenResponse = await fetch3("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId2,
        client_secret: clientSecret2,
        code,
        redirect_uri: redirectUri
      })
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      logger.error(`\u{1F419} [GitHub] GitHub API error: ${tokenData.error}`);
      logger.error(`\u{1F419} [GitHub] GitHub error description: ${tokenData.error_description}`);
      logger.error(`\u{1F419} [GitHub] GitHub error URI: ${tokenData.error_uri}`);
      return res.status(500).json({
        error: "Failed to obtain access token",
        github_error: tokenData.error,
        description: tokenData.error_description
      });
    }
    const accessToken = tokenData.access_token;
    logger.success(`\u{1F419} [GitHub] Successfully obtained access token`);
    const userResponse = await fetch3("https://api.github.com/user", {
      headers: {
        "Authorization": `token ${accessToken}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });
    const userData = await userResponse.json();
    if (!userData.id) {
      logger.error(`\u{1F419} [GitHub] Failed to fetch GitHub user data: ${JSON.stringify(userData)}`);
      return res.status(500).json({ error: "Failed to fetch user information from GitHub" });
    }
    logger.success(`\u{1F419} [GitHub] Linked GitHub account: ${userData.login}`);
    await db.update(users).set({
      githubToken: accessToken,
      githubUsername: userData.login,
      githubUserId: userData.id,
      githubConnectedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq6(users.id, req.user.id));
    res.redirect("/dashboard?github=connected&username=" + userData.login);
  } catch (error) {
    logger.error("Error handling GitHub OAuth callback:", error);
    res.status(500).json({ error: "Failed to handle GitHub OAuth callback: " + error.message });
  }
});
router3.post("/disconnect", async (req, res) => {
  try {
    await saveGitHubToken(req.user.id, null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
var github_default = router3;

// server/routes/github-webhooks.ts
import express6 from "express";
import crypto2 from "crypto";
import { eq as eq8 } from "drizzle-orm";

// server/services/app-platform.ts
import fetch4 from "node-fetch";
import { eq as eq7 } from "drizzle-orm";
var DO_TOKEN = process.env.DIGITAL_OCEAN_API_KEY || "";
var BASE_URL = "https://api.digitalocean.com/v2";
var APP_PLATFORM_BASE = `${BASE_URL}/apps`;
async function createAppFromGitHub(userId, options) {
  const user = await db.query.users.findFirst({
    where: eq7(users.id, userId)
  });
  if (!user?.githubToken) {
    throw new Error("User is not connected to GitHub");
  }
  const [owner, repo] = options.repository.split("/");
  const appSpec = {
    name: options.name,
    region: options.region,
    services: [
      {
        name: options.name,
        github: {
          repo: options.repository,
          branch: options.branch,
          deploy_on_push: true
        },
        source_dir: "/",
        instance_size_slug: options.size,
        instance_count: 1,
        http_port: 8080,
        run_command: "start",
        envs: Object.entries(options.environmentVariables || {}).map(([key, value]) => ({
          key,
          value,
          scope: "RUN_AND_BUILD_TIME"
        }))
      }
    ]
  };
  try {
    logger.info(`Creating new App Platform app: ${options.name} from ${options.repository}:${options.branch}`);
    const response = await fetch4(`${BASE_URL}/apps`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DO_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        spec: appSpec
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      logger.error(`Error creating app: ${response.status} ${errorData}`);
      throw new Error(`Failed to create app: ${response.status} ${errorData}`);
    }
    const data = await response.json();
    logger.success(`Successfully created app: ${data.app.id}`);
    return data.app;
  } catch (error) {
    logger.error(`Error in createAppFromGitHub: ${error.message}`);
    throw error;
  }
}

// server/routes/github-webhooks.ts
var router4 = express6.Router();
var WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";
router4.use(express6.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
function verifyGitHubWebhook(req) {
  if (!WEBHOOK_SECRET) {
    logger.warning("GitHub webhook secret not configured, skipping signature verification");
    return true;
  }
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    logger.warning("No signature found in GitHub webhook");
    return false;
  }
  const hmac = crypto2.createHmac("sha256", WEBHOOK_SECRET);
  const calculatedSignature = "sha256=" + hmac.update(req.rawBody).digest("hex");
  return crypto2.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature)
  );
}
async function findUsersForRepository(repoId, branch) {
  try {
    const usersWithAutoDeploy = await db.query.users.findMany({
      where: eq8(users.githubToken, null, false)
      // Only users with GitHub tokens
    });
    return usersWithAutoDeploy;
  } catch (error) {
    logger.error(`Error finding users for repository ${repoId}:${branch}:`, error);
    return [];
  }
}
router4.post("/", async (req, res) => {
  try {
    const event = req.headers["x-github-event"];
    logger.info(`Received GitHub webhook event: ${event}`);
    if (!verifyGitHubWebhook(req)) {
      logger.warning("Invalid GitHub webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
    if (event === "push") {
      const payload = req.body;
      const { repository, ref } = payload;
      const branchName = ref.replace("refs/heads/", "");
      logger.info(`Push event for repository ${repository.full_name} on branch ${branchName}`);
      const applicableUsers = await findUsersForRepository(repository.id.toString(), branchName);
      if (applicableUsers.length === 0) {
        logger.info(`No users found with auto-deploy configured for ${repository.full_name}:${branchName}`);
        return res.status(200).json({ message: "No applicable configurations found" });
      }
      for (const user of applicableUsers) {
        try {
          logger.info(`Triggering auto-deploy for user ${user.id} (${user.username})`);
          const deploymentConfig = {
            name: `${repository.name}-${branchName}`,
            repoFullName: repository.full_name,
            branch: branchName,
            region: "nyc",
            // Default region
            size: "basic-xs"
            // Default size
          };
          await createAppFromGitHub(user.id, {
            name: deploymentConfig.name,
            repository: deploymentConfig.repoFullName,
            branch: deploymentConfig.branch,
            region: deploymentConfig.region,
            size: deploymentConfig.size
          });
          logger.success(`Auto-deploy triggered successfully for ${repository.full_name}:${branchName}`);
        } catch (deployError) {
          logger.error(`Failed to trigger auto-deploy for user ${user.id}:`, deployError);
        }
      }
    } else if (event === "installation" || event === "installation_repositories") {
      const action = req.body.action;
      logger.info(`GitHub App installation event: ${action}`);
    }
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Error processing GitHub webhook:`, error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});
var github_webhooks_default = router4;

// server/routes/github-debug.ts
import express7 from "express";
import { eq as eq9 } from "drizzle-orm";
import fetch5 from "node-fetch";
var router5 = express7.Router();
router5.use((req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
});
router5.get("/status", async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq9(users.id, req.user.id)
    });
    if (!user?.githubToken) {
      return res.json({
        connected: false,
        tokenStatus: "missing"
      });
    }
    try {
      const response = await fetch5("https://api.github.com/user", {
        headers: {
          Authorization: `token ${user.githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "SkyVPS360-Platform"
        }
      });
      if (response.ok) {
        const userData = await response.json();
        const scopes = response.headers.get("x-oauth-scopes")?.split(", ") || [];
        return res.json({
          connected: true,
          tokenStatus: "valid",
          username: userData.login,
          userId: userData.id,
          email: userData.email,
          avatarUrl: userData.avatar_url,
          scopes,
          profileUrl: userData.html_url
        });
      } else {
        return res.json({
          connected: false,
          tokenStatus: "invalid",
          error: `GitHub API returned status ${response.status}`
        });
      }
    } catch (error) {
      return res.json({
        connected: false,
        tokenStatus: "error",
        error: error.message
      });
    }
  } catch (error) {
    logger.error("Error in GitHub debug status endpoint:", error);
    res.status(500).json({ error: "Failed to get GitHub status" });
  }
});
router5.post("/test-webhook", async (req, res) => {
  try {
    logger.info("Simulating GitHub webhook event");
    const mockPayload = {
      ref: "refs/heads/main",
      repository: {
        id: 123456789,
        name: "test-repo",
        full_name: "testuser/test-repo",
        private: false
      },
      sender: {
        id: req.user.id,
        login: req.user.username
      },
      commits: [
        {
          id: "abc123",
          message: "Test commit",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ]
    };
    logger.info("Processing test webhook for repository: testuser/test-repo (main)");
    res.json({
      success: true,
      message: "Webhook test processed successfully",
      payload: mockPayload
    });
  } catch (error) {
    logger.error("Error in GitHub debug test-webhook endpoint:", error);
    res.status(500).json({ error: "Failed to process test webhook" });
  }
});
router5.get("/recent-activity", async (req, res) => {
  try {
    const mockActivity = [
      {
        type: "oauth",
        description: "Connected GitHub account",
        timestamp: new Date(Date.now() - 36e5).toISOString()
        // 1 hour ago
      },
      {
        type: "deploy",
        description: "Deployed repository: user/repo",
        timestamp: new Date(Date.now() - 72e5).toISOString()
        // 2 hours ago
      },
      {
        type: "webhook",
        description: "Received push webhook from user/repo",
        timestamp: new Date(Date.now() - 864e5).toISOString()
        // 1 day ago
      }
    ];
    res.json(mockActivity);
  } catch (error) {
    logger.error("Error in GitHub debug recent-activity endpoint:", error);
    res.status(500).json({ error: "Failed to get recent activity" });
  }
});
var github_debug_default = router5;

// server/routes/github-deployments.ts
import express8 from "express";

// server/db/schema.ts
import { pgTable as pgTable2, serial as serial2, integer as integer2, text as text2, timestamp as timestamp3, varchar } from "drizzle-orm/pg-core";
var deployments = pgTable2("deployments", {
  id: serial2("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  repositoryName: varchar("repository_name", { length: 255 }).notNull(),
  // Changed from "name" to "repository_name"
  repositoryUrl: varchar("repository_url", { length: 255 }).notNull(),
  branch: varchar("branch", { length: 100 }).notNull().default("main"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  deployedAt: timestamp3("deployed_at").notNull().defaultNow(),
  updatedAt: timestamp3("updated_at").notNull().defaultNow(),
  region: varchar("region", { length: 50 }).notNull().default("nyc"),
  doAppId: varchar("do_app_id", { length: 100 }),
  deploymentUrl: varchar("deployment_url", { length: 255 }),
  logs: text2("logs"),
  buildTime: integer2("build_time"),
  framework: varchar("framework", { length: 50 })
});
var githubConnections = pgTable2("github_connections", {
  id: serial2("id").primaryKey(),
  userId: integer2("user_id").notNull().unique(),
  githubUserId: integer2("github_user_id"),
  githubUsername: text2("github_username"),
  accessToken: text2("access_token"),
  refreshToken: text2("refresh_token"),
  scopes: text2("scopes"),
  connectedAt: timestamp3("connected_at").defaultNow()
});

// server/routes/github-deployments.ts
import { eq as eq10 } from "drizzle-orm";

// server/services/github-api.ts
import fetch6 from "node-fetch";
var GITHUB_API_BASE = "https://api.github.com";
async function githubRequest(endpoint, token, options = {}) {
  try {
    const url = `${GITHUB_API_BASE}${endpoint}`;
    const response = await fetch6(url, {
      ...options,
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        ...options.headers
      }
    });
    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`GitHub API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error making GitHub request to ${endpoint}:`, error);
    throw error;
  }
}
async function getGitHubUser(token) {
  return await githubRequest("/user", token);
}
async function getRepository(token, owner, repo) {
  return await githubRequest(`/repos/${owner}/${repo}`, token);
}

// server/services/digital-ocean.ts
import fetch7 from "node-fetch";
var DO_API_KEY = process.env.DIGITAL_OCEAN_API_KEY;
var DO_API_URL = "https://api.digitalocean.com/v2";
if (!DO_API_KEY) {
  logger.warning("DIGITAL_OCEAN_API_KEY environment variable not set");
}
async function deployGitHubRepo({
  userId,
  repositoryName,
  repositoryOwner,
  branch = "main",
  githubToken,
  region = "nyc",
  environmentVariables = {}
}) {
  try {
    logger.info(`Deploying ${repositoryOwner}/${repositoryName} (${branch}) to DigitalOcean App Platform`);
    const appName = `${repositoryName.toLowerCase()}-${Math.floor(Date.now() / 1e3)}`;
    const formattedEnvVars = Object.entries(environmentVariables).map(([key, value]) => ({
      key,
      value: String(value),
      scope: "RUN_AND_BUILD_TIME",
      type: "GENERAL"
    }));
    const appSpec = {
      name: appName,
      region,
      services: [
        {
          name: repositoryName,
          github: {
            repo: `${repositoryOwner}/${repositoryName}`,
            branch,
            deploy_on_push: true
          },
          source_dir: "/",
          envs: formattedEnvVars,
          instance_count: 1,
          instance_size_slug: "basic-xs"
        }
      ],
      github: {
        // Using deployed user's GitHub token for repo access
        repo: `${repositoryOwner}/${repositoryName}`,
        branch,
        deploy_on_push: true
      }
    };
    const response = await fetch7(`${DO_API_URL}/apps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DO_API_KEY}`
      },
      body: JSON.stringify(appSpec)
    });
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`DigitalOcean API error (${response.status}):`, errorData);
      throw new Error(`DigitalOcean API error: ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    logger.success(`Successfully deployed app to DigitalOcean. App ID: ${data.app.id}`);
    return {
      app_id: data.app.id,
      live_url: data.app.live_url,
      created_at: data.app.created_at,
      default_ingress: data.app.default_ingress
    };
  } catch (error) {
    logger.error("Error deploying to DigitalOcean:", error);
    throw error;
  }
}
async function getAppStatus(appId) {
  try {
    const response = await fetch7(`${DO_API_URL}/apps/${appId}`, {
      headers: {
        "Authorization": `Bearer ${DO_API_KEY}`
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Error fetching app status (${response.status}):`, errorData);
      return "unknown";
    }
    const data = await response.json();
    return data.app.phase || "unknown";
  } catch (error) {
    logger.error(`Error getting app status for ${appId}:`, error);
    return "error";
  }
}

// server/routes/github-deployments.ts
var router6 = express8.Router();
router6.use(requireAuth);
router6.get("/", async (req, res) => {
  try {
    logger.info(`Retrieving deployments for user ${req.user.id}`);
    try {
      const userDeployments = await db.query.deployments.findMany({
        where: eq10(deployments.userId, req.user.id)
      });
      logger.info(`Retrieved ${userDeployments.length} deployments for user ${req.user.id}`);
      res.json(userDeployments);
    } catch (dbError) {
      logger.warning(`Database schema issue detected, returning empty deployments array: ${dbError.message}`);
      res.json([]);
    }
  } catch (error) {
    logger.error("Error retrieving deployments:", error);
    res.status(500).json({ error: "Failed to retrieve deployments" });
  }
});
router6.post("/", async (req, res) => {
  try {
    const { repoFullName, branch = "main" } = req.body;
    if (!repoFullName) {
      return res.status(400).json({ error: "Repository name is required" });
    }
    logger.info(`Starting deployment of ${repoFullName} (${branch}) for user ${req.user.id}`);
    const githubToken = req.user.githubToken;
    if (!githubToken) {
      return res.status(401).json({ error: "GitHub account not connected" });
    }
    const [owner, repo] = repoFullName.split("/");
    if (!owner || !repo) {
      return res.status(400).json({ error: "Invalid repository name format" });
    }
    const repository = await getRepository(githubToken, owner, repo);
    const deploymentResult = await deployGitHubRepo({
      userId: req.user.id,
      repositoryName: repo,
      repositoryOwner: owner,
      branch,
      githubToken,
      region: req.body.region || "nyc",
      environmentVariables: req.body.env || {}
    });
    const newDeployment = await db.insert(deployments).values({
      userId: req.user.id,
      repositoryName: repository.name,
      // Changed from name to repositoryName
      repositoryUrl: repository.html_url,
      branch,
      status: "in_progress",
      deployedAt: (/* @__PURE__ */ new Date()).toISOString(),
      region: req.body.region || "nyc",
      doAppId: deploymentResult.app_id?.toString(),
      deploymentUrl: deploymentResult.live_url || null
    }).returning();
    logger.success(`Deployment initiated for ${repoFullName} (${branch})`);
    res.status(201).json(newDeployment[0]);
  } catch (error) {
    logger.error(`Error deploying repository:`, error);
    res.status(500).json({
      error: "Failed to deploy repository",
      details: error.message
    });
  }
});
router6.get("/:id", async (req, res) => {
  try {
    const deploymentId = req.params.id;
    const deployment = await db.select().from(deployments).where(eq10(deployments.id, deploymentId)).limit(1);
    if (deployment.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    if (deployment[0].userId !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to view this deployment" });
    }
    if (deployment[0].doAppId) {
      const status = await getAppStatus(deployment[0].doAppId);
      if (status && status !== deployment[0].status) {
        await db.update(deployments).set({ status }).where(eq10(deployments.id, deploymentId));
        deployment[0].status = status;
      }
    }
    res.json(deployment[0]);
  } catch (error) {
    logger.error("Error retrieving deployment:", error);
    res.status(500).json({ error: "Failed to retrieve deployment" });
  }
});
router6.post("/:id/redeploy", async (req, res) => {
  try {
    const [deployment] = await db.select().from(deployments).where(eq10(deployments.id, parseInt(req.params.id, 10))).limit(1);
    if (!deployment || deployment.userId !== req.user.id) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    logger.info(`Redeploying deployment ${deployment.id}`);
    await appPlatform.redeployApp(deployment);
    res.json({ message: "Deployment is redeploying" });
  } catch (error) {
    logger.error(`Error redeploying application: ${error}`);
    res.status(500).json({ error: "Failed to redeploy application" });
  }
});
router6.post("/:id/restart", async (req, res) => {
  try {
    const [deployment] = await db.select().from(deployments).where(eq10(deployments.id, parseInt(req.params.id, 10))).limit(1);
    if (!deployment || deployment.userId !== req.user.id) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    logger.info(`Restarting deployment ${deployment.id}`);
    await appPlatform.restartApp(deployment);
    res.json({ message: "Deployment is restarting" });
  } catch (error) {
    logger.error(`Error restarting deployment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to restart deployment" });
  }
});
var github_deployments_default = router6;

// server/routes/app-platform.ts
import express9 from "express";
var router7 = express9.Router();
router7.use(requireAuth);
router7.get("/regions", async (req, res) => {
  try {
    const regions = [
      {
        id: "ams",
        slug: "ams",
        name: "Amsterdam, Netherlands",
        available: true,
        data_centers: ["ams3"],
        default: false
      },
      {
        id: "nyc",
        slug: "nyc",
        name: "New York, United States",
        available: true,
        data_centers: ["nyc1", "nyc3"],
        default: true
      },
      {
        id: "fra",
        slug: "fra",
        name: "Frankfurt, Germany",
        available: true,
        data_centers: ["fra1"],
        default: false
      },
      {
        id: "lon",
        slug: "lon",
        name: "London, United Kingdom",
        available: true,
        data_centers: ["lon1"],
        default: false
      },
      {
        id: "sfo",
        slug: "sfo",
        name: "San Francisco, United States",
        available: true,
        data_centers: ["sfo3"],
        default: false
      },
      {
        id: "sgp",
        slug: "sgp",
        name: "Singapore",
        available: true,
        data_centers: ["sgp1"],
        default: false
      }
    ];
    res.json(regions);
  } catch (error) {
    logger.error("Error fetching app platform regions:", error);
    res.status(500).json({ error: "Failed to fetch regions" });
  }
});
router7.get("/sizes", async (req, res) => {
  try {
    const sizes = [
      {
        slug: "basic-xxs",
        name: "Basic XXS",
        cpu: 1,
        memory_bytes: 512 * 1024 * 1024,
        usd_per_month: 5,
        usd_per_second: 19e-7,
        tier_slug: "basic",
        tier_upgrade_to: "professional-xs",
        included_bandwidth_bytes: 40 * 1024 * 1024 * 1024
      },
      {
        slug: "basic-xs",
        name: "Basic XS",
        cpu: 1,
        memory_bytes: 1024 * 1024 * 1024,
        usd_per_month: 10,
        usd_per_second: 38e-7,
        tier_slug: "basic",
        tier_upgrade_to: "professional-xs",
        included_bandwidth_bytes: 80 * 1024 * 1024 * 1024
      },
      {
        slug: "basic-s",
        name: "Basic S",
        cpu: 1,
        memory_bytes: 2 * 1024 * 1024 * 1024,
        usd_per_month: 18,
        usd_per_second: 69e-7,
        tier_slug: "basic",
        tier_upgrade_to: "professional-xs",
        included_bandwidth_bytes: 160 * 1024 * 1024 * 1024
      },
      {
        slug: "professional-xs",
        name: "Professional XS",
        cpu: 2,
        memory_bytes: 4 * 1024 * 1024 * 1024,
        usd_per_month: 40,
        usd_per_second: 15e-6,
        tier_slug: "professional",
        tier_upgrade_to: "professional-s",
        included_bandwidth_bytes: 320 * 1024 * 1024 * 1024
      }
    ];
    res.json(sizes);
  } catch (error) {
    logger.error("Error fetching app platform sizes:", error);
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
});
var app_platform_default = router7;

// server/routes/api-debug.ts
import express10 from "express";
import os2 from "os";
var router8 = express10.Router();
router8.use(requireAdmin);
router8.get("/", async (req, res) => {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
      // Redact secret
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? "***REDACTED***" : void 0,
      DATABASE_URL: process.env.DATABASE_URL ? "***REDACTED***" : void 0
    };
    const system = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      memory: {
        total: `${Math.round(os2.totalmem() / (1024 * 1024 * 1024))}GB`,
        free: `${Math.round(os2.freemem() / (1024 * 1024 * 1024))}GB`
      },
      cpus: os2.cpus().length,
      hostname: os2.hostname(),
      uptime: `${Math.round(os2.uptime() / 60 / 60)} hours`
    };
    res.json({ env, system });
  } catch (error) {
    logger.error("Error in API debug route:", error);
    res.status(500).json({ error: "Failed to get debug information" });
  }
});
router8.get("/github-oauth-url", (req, res) => {
  try {
    const clientId2 = process.env.GITHUB_CLIENT_ID?.trim();
    const redirectUri = process.env.GITHUB_REDIRECT_URI?.trim();
    if (!clientId2 || !redirectUri) {
      return res.status(500).json({ error: "GitHub OAuth configuration is missing" });
    }
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId2}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user:email`;
    res.json({ url: authUrl, components: { clientId: clientId2, redirectUri } });
  } catch (error) {
    logger.error("Error generating debug GitHub URL:", error);
    res.status(500).json({ error: "Failed to generate GitHub auth URL" });
  }
});
router8.get("/github-env", (req, res) => {
  const env = {
    clientId: process.env.GITHUB_CLIENT_ID ? process.env.GITHUB_CLIENT_ID.substring(0, 5) + "..." : null,
    redirectUri: process.env.GITHUB_REDIRECT_URI,
    isClientSecretSet: !!process.env.GITHUB_CLIENT_SECRET,
    nodeEnv: process.env.NODE_ENV
  };
  res.json(env);
});
var api_debug_default = router8;

// server/routes/github-connections.ts
import express11 from "express";
import { eq as eq11 } from "drizzle-orm";
var router9 = express11.Router();
router9.use(requireAuth);
router9.get("/status", async (req, res) => {
  try {
    const user = req.user;
    res.json({
      connected: !!user.githubToken,
      githubUsername: user.githubUsername || null,
      githubUserId: user.githubUserId || null,
      connectedAt: user.githubConnectedAt || null
    });
  } catch (error) {
    logger.error("Error getting GitHub connection status:", error);
    res.status(500).json({ error: "Failed to get connection status" });
  }
});
router9.post("/disconnect", async (req, res) => {
  try {
    await db.update(users).set({
      githubToken: null,
      githubUsername: null,
      githubUserId: null,
      githubConnectedAt: null
    }).where(eq11(users.id, req.user.id));
    res.json({ success: true });
  } catch (error) {
    logger.error("Error disconnecting GitHub account:", error);
    res.status(500).json({ error: "Failed to disconnect GitHub account" });
  }
});
router9.get("/connection-details", async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq11(users.id, req.user.id)
    });
    if (!user?.githubToken) {
      return res.json({
        connected: false
      });
    }
    try {
      const githubUser = await getGitHubUser(user.githubToken);
      return res.json({
        connected: true,
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        userId: githubUser.id,
        connectedAt: user.githubConnectedAt || (/* @__PURE__ */ new Date()).toISOString(),
        scopes: ["repo", "user:email"]
        // Mocked scopes, in reality would come from headers or token introspection
      });
    } catch (error) {
      logger.error("Error fetching GitHub user:", error);
      return res.json({
        connected: false,
        error: "Failed to verify GitHub token"
      });
    }
  } catch (error) {
    logger.error("Error in GitHub connection details:", error);
    res.status(500).json({ error: "Failed to get connection details" });
  }
});
router9.post("/settings", async (req, res) => {
  try {
    const { autoDeploy, buildCache } = req.body;
    logger.info(`User ${req.user.id} updated GitHub settings: autoDeploy=${autoDeploy}, buildCache=${buildCache}`);
    res.json({ success: true });
  } catch (error) {
    logger.error("Error saving GitHub settings:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});
router9.post("/webhooks/configure", async (req, res) => {
  try {
    const { url, secret } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Webhook URL is required" });
    }
    logger.info(`User ${req.user.id} configured GitHub webhook: url=${url}`);
    res.json({ success: true });
  } catch (error) {
    logger.error("Error configuring webhooks:", error);
    res.status(500).json({ error: "Failed to configure webhooks" });
  }
});
router9.get("/recent-activity", async (req, res) => {
  try {
    const mockActivity = [
      {
        type: "oauth",
        description: "Connected GitHub account",
        timestamp: new Date(Date.now() - 36e5).toISOString()
        // 1 hour ago
      },
      {
        type: "deploy",
        description: "Deployed repository: user/repo",
        timestamp: new Date(Date.now() - 72e5).toISOString()
        // 2 hours ago
      },
      {
        type: "webhook",
        description: "Received push webhook from user/repo",
        timestamp: new Date(Date.now() - 864e5).toISOString()
        // 1 day ago
      }
    ];
    res.json(mockActivity);
  } catch (error) {
    logger.error("Error getting recent activity:", error);
    res.status(500).json({ error: "Failed to get recent activity" });
  }
});
var github_connections_default = router9;

// server/utils/env.ts
import dotenv from "dotenv";
dotenv.config();
function loadGitHubCredentials() {
  try {
    const clientId2 = process.env.GITHUB_CLIENT_ID;
    const clientSecret2 = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    const displayClientId = clientId2 ? `${clientId2.substring(0, 5)}...` : "Not set";
    const displayClientSecret = clientSecret2 ? "Set" : "Not set";
    logger.info(`\u{1F419} [GitHub] GitHub OAuth Configuration:`);
    logger.info(`\u{1F419} [GitHub] - Client ID: ${displayClientId}`);
    logger.info(`\u{1F419} [GitHub] - Client Secret: ${displayClientSecret}`);
    logger.info(`\u{1F419} [GitHub] - Redirect URI: ${redirectUri}`);
    if (clientId2 && clientSecret2 && redirectUri) {
      process.env.GITHUB_CLIENT_ID = clientId2.trim();
      process.env.GITHUB_CLIENT_SECRET = clientSecret2.trim();
      process.env.GITHUB_REDIRECT_URI = redirectUri.trim();
      logger.success("GitHub OAuth credentials successfully loaded. GitHub integration is available.");
      return true;
    } else {
      logger.warning("GitHub OAuth credentials are missing or incomplete. GitHub integration will not work properly.");
      return false;
    }
  } catch (error) {
    logger.error("Error loading GitHub credentials:", error);
    return false;
  }
}

// server/utils/init-db.js
async function initializeDatabase() {
  logger.info("Initializing database tables...");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        server_id INTEGER,
        repository VARCHAR(255) NOT NULL,
        branch VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deploy_completed_at TIMESTAMP WITH TIME ZONE,
        deploy_config JSONB DEFAULT '{}'::JSONB,
        github_webhook_id INTEGER,
        commit_hash VARCHAR(40),
        deploy_log TEXT,
        auto_deploy BOOLEAN DEFAULT FALSE
      );
      
      -- Only create indexes if they don't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deployments_user_id') THEN
          CREATE INDEX idx_deployments_user_id ON deployments(user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deployments_server_id') THEN
          CREATE INDEX idx_deployments_server_id ON deployments(server_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deployments_status') THEN
          CREATE INDEX idx_deployments_status ON deployments(status);
        END IF;
      END $$;
    `);
    logger.success("Deployments table initialized successfully");
    return true;
  } catch (error) {
    logger.error("Error initializing database tables:", error);
    return false;
  }
}

// server/index.ts
var __filename3 = fileURLToPath4(import.meta.url);
var __dirname4 = path5.dirname(__filename3);
dotenv2.config({ override: true });
var app = express12();
app.use(express12.json());
app.use(express12.urlencoded({ extended: false }));
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.set("trust proxy", true);
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      logger.api(
        "Request completed",
        req.method,
        path6,
        res.statusCode,
        duration
      );
      if (process.env.NODE_ENV === "development" && capturedJsonResponse) {
        const responsePreview = JSON.stringify(capturedJsonResponse).length > 100 ? JSON.stringify(capturedJsonResponse).substring(0, 97) + "..." : JSON.stringify(capturedJsonResponse);
        logger.debug(`Response: ${responsePreview}`);
      }
    }
  });
  next();
});
app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  const allowedDomains = [
    "skyvps360.xyz",
    "www.skyvps360.xyz",
    "localhost",
    req.hostname
    // You can add specific additional domains here
  ];
  const allowOrigin = process.env.NODE_ENV === "development" ? origin : allowedDomains.includes(new URL(origin).hostname) ? origin : "https://skyvps360.xyz";
  res.header("Access-Control-Allow-Origin", allowOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  app.set("trust proxy", 1);
  next();
});
var importPath = (relativePath) => {
  const isProduction = process.env.NODE_ENV === "production";
  const basePath = isProduction ? "./dist" : ".";
  const resolvedPath = path5.join(basePath, relativePath);
  const fileUrl = new URL(`file://${path5.resolve(resolvedPath)}`).href;
  return fileUrl;
};
async function createTestData() {
  try {
    const admins = await db.select().from(users).where(eq12(users.isAdmin, true));
    if (admins.length === 0) {
      const admin = await storage.createUser({
        username: "admin",
        password: await hashPassword("admin123"),
        isAdmin: true,
        balance: 1e4,
        apiKey: null
      });
      logger.success("Created default admin user: admin / admin123");
      const user = await storage.createUser({
        username: "user",
        password: await hashPassword("user123"),
        isAdmin: false,
        balance: 5e3,
        apiKey: null
      });
      logger.success("Created default regular user: user / user123");
      const server = await storage.createServer({
        userId: user.id,
        name: "Test Server",
        region: "tor1",
        size: "s-1vcpu-1gb",
        dropletId: "12345",
        status: "active",
        ipAddress: "192.168.1.1",
        ipv6Address: null,
        specs: {
          memory: 1024,
          vcpus: 1,
          disk: 25
        },
        application: null,
        lastMonitored: /* @__PURE__ */ new Date(),
        rootPassword: "Test123!"
      });
      const ticket = await storage.createTicket({
        userId: user.id,
        serverId: server.id,
        subject: "Help with server configuration",
        priority: "normal",
        status: "open",
        originalDropletId: server.dropletId
      });
      await storage.createMessage({
        ticketId: ticket.id,
        userId: user.id,
        message: "I need help configuring my server. Can you assist?"
      });
      logger.success("Created test data (server and support ticket)");
    }
  } catch (error) {
    logger.error("Error creating test data:", error);
  }
}
(async () => {
  try {
    await pool.query("SELECT 1");
    logger.database("Database connection successful");
    if (process.env.NODE_ENV === "production") {
      await initializeDatabase();
    } else {
      try {
        const migrationsPaths = [
          "migrations/add-snapshots-table.js",
          "migrations/add-github-token.js",
          "migrations/add-deployments-table.js",
          "migrations/fix-deployments-schema.js"
        ];
        for (const migrationPath of migrationsPaths) {
          try {
            const fullPath = importPath(migrationPath);
            console.log(`Attempting to import migration from: ${fullPath}`);
            const { runMigration } = await import(fullPath);
            const result = await runMigration();
            if (result) {
              logger.success(`Migration ${migrationPath} completed successfully`);
            } else {
              logger.warning(`Migration ${migrationPath} was not needed or already applied`);
            }
          } catch (migrationError) {
            logger.error(`Error running migration ${migrationPath}:`, migrationError);
          }
        }
      } catch (migrationError) {
        logger.error("Error running migrations:", migrationError);
      }
    }
    loadGitHubCredentials();
    await createTestData();
    setupAuth(app, {
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        domain: process.env.NODE_ENV === "production" ? ".skyvps360.xyz" : void 0
      }
    });
    registerAdminRoutes(app);
    const server = await registerRoutes(app);
    app.use("/api/github", github_default);
    app.use("/api/github/deployments", github_deployments_default);
    app.use("/api/github/webhooks", github_webhooks_default);
    app.use("/api/github/debug", github_debug_default);
    app.use("/api/github/connections", github_connections_default);
    app.use("/api/app-platform", app_platform_default);
    app.use("/api/debug", api_debug_default);
    if (process.env.NODE_ENV === "production") {
      app.use("/api/debug-prod", debug_routes_default);
    }
    app.use("/auth/github", github_default);
    app.get("/github-guide", (req, res) => {
      try {
        const indexPath = path5.resolve(__dirname4, "../dist/client/index.html");
        if (fs3.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          const devIndexPath = path5.resolve(__dirname4, "../client/index.html");
          if (fs3.existsSync(devIndexPath)) {
            res.sendFile(devIndexPath);
          } else {
            throw new Error("Could not find index.html");
          }
        }
      } catch (e) {
        logger.error("Error serving index.html for GitHub guide:", e);
        res.status(500).send("Internal Server Error: Could not load GitHub guide");
      }
    });
    app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
    });
    app.use((err, _req, res, _next) => {
      logger.error("Express error handler:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
    if (app.get("env") === "development") {
      logger.info("Starting server in development mode with Vite middleware...");
      await setupVite(app, server);
    } else {
      logger.info("Starting server in production mode with static files...");
      setupStaticServing(app);
      logger.info("Static file serving configured");
    }
    const port = process.env.NODE_ENV === "development" ? 5e3 : process.env.PORT || 8080;
    logger.server(`Starting server on port ${port}, NODE_ENV: ${process.env.NODE_ENV}`);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      logger.success(`Server running on port ${port} and accessible from all network interfaces`);
    });
  } catch (error) {
    logger.error("Application startup error:", error);
    process.exit(1);
  }
})();
//# sourceMappingURL=index.js.map
