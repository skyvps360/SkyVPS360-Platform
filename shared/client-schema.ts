/**
 * This file serves as a bridge for client imports of schema related types.
 * It re-exports the schema types that client code needs access to.
 */

// Re-export needed types from the server schema
export * from './schema';

// Add any client-specific schema extensions here
export const clientSchema = {
  version: '1.0.0',
};
