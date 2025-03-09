import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  apiKey: text("api_key"),
  githubToken: text("github_token"), // Added GitHub token field
  balance: integer("balance").notNull().default(0), // Balance in cents
  isAdmin: boolean("is_admin").notNull().default(false), // Admin flag
  isSuspended: boolean("is_suspended").notNull().default(false), // Account suspension flag
  created: timestamp("created").notNull().defaultNow(),
  updated: timestamp("updated").notNull().defaultNow(),
});

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  dropletId: text("droplet_id").notNull(),
  region: text("region").notNull(),
  size: text("size").notNull(),
  status: text("status").notNull(),
  ipAddress: text("ip_address"),
  ipv6Address: text("ipv6_address"),
  specs: jsonb("specs").$type<{
    memory: number;
    vcpus: number;
    disk: number;
  }>(),
  application: text("application"), // Added application field
  lastMonitored: timestamp("last_monitored"),
  rootPassword: text("root_password"), // Store root password for SSH access
  createdAt: timestamp("created_at").notNull().defaultNow(), // Server creation timestamp
  isSuspended: boolean("is_suspended").notNull().default(false), // Account suspension flag
});

// Server metrics table for monitoring
export const serverMetrics = pgTable("server_metrics", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  cpuUsage: integer("cpu_usage").notNull(), // Percentage: 0-100
  memoryUsage: integer("memory_usage").notNull(), // Percentage: 0-100
  diskUsage: integer("disk_usage").notNull(), // Percentage: 0-100
  networkIn: integer("network_in").notNull(), // Bytes
  networkOut: integer("network_out").notNull(), // Bytes
  loadAverage: jsonb("load_average").$type<number[]>().notNull(),
  uptimeSeconds: integer("uptime_seconds").notNull(),
});

export const volumes = pgTable("volumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  serverId: integer("server_id").notNull(),
  name: text("name").notNull(),
  volumeId: text("volume_id").notNull(),
  size: integer("size").notNull(),
  region: text("region").notNull(),
});

export const billingTransactions = pgTable("billing_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull(),
  status: text("status").notNull(), // completed, pending, failed
  type: text("type").notNull(), // deposit, hourly_server_charge, hourly_volume_charge, bandwidth_overage, server_deleted_insufficient_funds
  paypalTransactionId: text("paypal_transaction_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  description: text("description").default(''), // Optional description for the transaction, default empty string
});

// Updated: Support Tickets with server relation
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  serverId: integer("server_id"), // Optional - allows tickets to persist after server deletion
  subject: text("subject").notNull(),
  status: text("status").notNull(), // open, closed, pending
  priority: text("priority").notNull().default('normal'), // low, normal, high
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  originalDropletId: text("original_droplet_id"), // Store the original droplet ID for reference
});

// Support Messages with real-time chat support
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: integer("user_id").notNull(), // sender (can be admin or user)
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false), // For real-time chat notifications
});

export const sshKeys = pgTable("ssh_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  publicKey: text("public_key").notNull(),
  isCloudRackKey: boolean("is_cloudrack_key").notNull().default(false),
  isSystemKey: boolean("is_system_key").notNull().default(false), // Added for the system key identification
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add IP ban functionality
export const ipBans = pgTable("ip_bans", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  reason: text("reason"),
  bannedBy: integer("banned_by").notNull(), // Admin user ID who created the ban
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date, null means permanent
  isActive: boolean("is_active").notNull().default(true),
});

// Snapshots table for storing server snapshots
export const snapshots = pgTable("snapshots", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  snapshotId: text("snapshot_id").notNull(),
  sizeGb: integer("size_gb").notNull(), // Size in GB
  description: text("description"),
  status: text("status").notNull().default("in-progress"), // in-progress, completed, error
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date for auto-delete
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
  isSuspended: true,
  balance: true,
  apiKey: true,
});

export const insertTransactionSchema = createInsertSchema(billingTransactions).pick({
  userId: true,
  amount: true,
  currency: true,
  status: true,
  type: true,
  paypalTransactionId: true,
  createdAt: true,
  description: true,
});

export const insertServerSchema = createInsertSchema(servers).pick({
  name: true,
  region: true,
  size: true,
}).extend({
  application: z.string().optional(),
});

export const insertVolumeSchema = createInsertSchema(volumes).pick({
  name: true,
  size: true,
});

// Updated: Support Ticket Schema with server relation
export const insertTicketSchema = createInsertSchema(supportTickets).pick({
  subject: true,
  priority: true,
  serverId: true,
}).extend({
  message: z.string().min(1, "Initial message is required"),
  priority: z.string().default("normal"),
  serverId: z.number().optional(),
});

export const insertMessageSchema = createInsertSchema(supportMessages).pick({
  message: true,
});

export const insertSSHKeySchema = createInsertSchema(sshKeys).pick({
  name: true,
  publicKey: true,
}).extend({
  isCloudRackKey: z.boolean().default(false),
  isSystemKey: z.boolean().default(false),
});

export const insertIPBanSchema = createInsertSchema(ipBans).pick({
  ipAddress: true,
  reason: true,
}).extend({
  expiresAt: z.date().optional(),
});

export const insertSnapshotSchema = createInsertSchema(snapshots).pick({
  serverId: true,
  name: true,
  description: true,
}).extend({
  expiresAt: z.date().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Server = typeof servers.$inferSelect;
export type ServerMetric = typeof serverMetrics.$inferSelect;
export type Volume = typeof volumes.$inferSelect;
export type BillingTransaction = typeof billingTransactions.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSSHKey = z.infer<typeof insertSSHKeySchema>;
export type SSHKey = typeof sshKeys.$inferSelect;
export type InsertIPBan = z.infer<typeof insertIPBanSchema>;
export type IPBan = typeof ipBans.$inferSelect;
export type InsertSnapshot = z.infer<typeof insertSnapshotSchema>;
export type Snapshot = typeof snapshots.$inferSelect;

// Documentation schema
export const docSections = pgTable("doc_sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const docArticles = pgTable("doc_articles", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull().references(() => docSections.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  order: integer("order").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Insert schemas for documentation
export const insertDocSectionSchema = createInsertSchema(docSections).pick({
  title: true,
  order: true,
});

// Maintenance settings table
export const maintenanceSettings = pgTable("maintenance_settings", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  maintenanceMessage: text("maintenance_message").default("We're currently performing maintenance. Please check back soon."),
  comingSoonEnabled: boolean("coming_soon_enabled").notNull().default(false),
  comingSoonMessage: text("coming_soon_message").default("This feature is coming soon. Stay tuned for updates!"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").notNull(), // Admin user ID who last updated settings
});

export const insertMaintenanceSettingsSchema = createInsertSchema(maintenanceSettings).pick({
  enabled: true,
  maintenanceMessage: true,
  comingSoonEnabled: true,
  comingSoonMessage: true,
  updatedBy: true,
});

export const insertDocArticleSchema = createInsertSchema(docArticles).pick({
  sectionId: true,
  title: true,
  content: true,
  order: true,
});

export type DocSection = typeof docSections.$inferSelect;
export type DocArticle = typeof docArticles.$inferSelect;
export type InsertDocSection = z.infer<typeof insertDocSectionSchema>;
export type InsertDocArticle = z.infer<typeof insertDocArticleSchema>;
export type MaintenanceSettings = typeof maintenanceSettings.$inferSelect;
export type InsertMaintenanceSettings = z.infer<typeof insertMaintenanceSettingsSchema>;