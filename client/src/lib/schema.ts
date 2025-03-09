import { z } from 'zod';

// Define your schemas here
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

export type Server = z.infer<typeof ServerSchema>;
export type User = z.infer<typeof UserSchema>;
