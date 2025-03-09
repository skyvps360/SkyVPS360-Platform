// Copy the relevant schema types that the client needs
// This avoids direct imports from @shared/schema in client code

// Add schema definitions for validation
import * as z from 'zod';

// Mock types for pgTable and related functions that are only used on the server
const pgTable = (name: string, schema: any) => schema;
const serial = (name: string) => ({ primaryKey: () => ({}) });
const integer = (name: string) => ({ notNull: () => ({ references: () => ({ onDelete: () => ({}) }) }), references: () => ({}) });
const text = (name: string) => ({ notNull: () => ({ unique: () => ({}) }), unique: () => ({}), default: () => ({}) });
const timestamp = (name: string) => ({ notNull: () => ({ defaultNow: () => ({}), default: () => ({}) }), defaultNow: () => ({}) });
const boolean = (name: string) => ({ notNull: () => ({ default: () => ({}) }) });
const varchar = (name: string, options: any) => ({ notNull: () => ({ default: () => ({}) }) });
const jsonb = (name: string) => ({ $type: <T>() => ({ type: {} as T }) });
const createInsertSchema = (table: any) => ({ pick: () => ({ extend: () => ({}) }) });

// Add the necessary schema types here
export type User = {
  id: number;
  username: string;
  isAdmin: boolean;
  githubToken?: string;
  githubUsername?: string;
  githubUserId?: number;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Server = {
  id: number;
  userId: number;
  name: string;
  region: string;
  size: string;
  dropletId: string;
  status: string;
  ipAddress?: string;
  ipv6Address?: string;
  specs?: {
    memory: number;
    vcpus: number;
    disk: number;
  };
  application?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastMonitored?: string;
};

export type Ticket = {
  id: number;
  userId: number;
  serverId?: number;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt?: string;
};

export type SupportTicket = Ticket;

export type SupportMessage = {
  id: number;
  ticketId: number;
  userId: number;
  message: string;
  createdAt: string;
  updatedAt?: string;
};

export type Volume = {
  id: number;
  name: string;
  size: number;
  region: string;
  filesystemType?: string;
  createdAt: string;
  serverId?: number;
  userId: number;
};

// Define schema definitions for validation
export const insertTicketSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high"]).default("low"),
  serverId: z.number().optional().nullable(),
});

export const insertServerSchema = z.object({
  name: z.string().min(1),
  region: z.string(),
  size: z.string(),
  application: z.string().nullable().optional(),
  auth: z.string().min(8, "Password must be at least 8 characters"),
  githubRepo: z.string().optional(),
});

export const insertVolumeSchema = z.object({
  name: z.string().min(3, "Volume name must be at least 3 characters"),
  size: z.number().min(10, "Minimum volume size is 10GB"),
});

import { z } from 'zod';

// Define schemas
export const ServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  region: z.string(),
  size: z.string(),
  ipAddress: z.string().nullable(),
  ipv6Address: z.string().nullable(),
  specs: z.object({
    memory: z.number(),
    vcpus: z.number(),
    disk: z.number(),
  }),
  createdAt: z.string().optional(),
  application: z.string().nullable(),
});

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  isAdmin: z.boolean(),
  balance: z.number(),
});

// Export types
export type Server = z.infer<typeof ServerSchema>;
export type User = z.infer<typeof UserSchema>;
