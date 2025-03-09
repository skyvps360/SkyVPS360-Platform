import { pgTable, serial, integer, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from "@shared/schema";

// Define the deployments table schema
export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  repositoryName: varchar("repository_name", { length: 255 }).notNull(), // Changed from "name" to "repository_name"
  repositoryUrl: varchar("repository_url", { length: 255 }).notNull(),
  branch: varchar("branch", { length: 100 }).notNull().default("main"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  deployedAt: timestamp("deployed_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  region: varchar("region", { length: 50 }).notNull().default("nyc"),
  doAppId: varchar("do_app_id", { length: 100 }),
  deploymentUrl: varchar("deployment_url", { length: 255 }),
  logs: text("logs"),
  buildTime: integer("build_time"),
  framework: varchar("framework", { length: 50 }),
});

// Define GitHub connections table
export const githubConnections = pgTable('github_connections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  githubUserId: integer('github_user_id'),
  githubUsername: text('github_username'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  scopes: text('scopes'),
  connectedAt: timestamp('connected_at').defaultNow()
});

// Add the schema to typescript declarations
declare global {
  interface DB {
    deployments: typeof deployments;
    githubConnections: typeof githubConnections;
  }
}
