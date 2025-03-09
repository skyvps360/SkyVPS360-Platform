import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pool } from './index';
import * as schema from './schema';
import { logger } from '../utils/logger';

// Initialize the drizzle ORM with our schema
export const setupDb = async () => {
  try {
    const db = drizzle(pool, { schema });

    // Set up prepared queries and enhance db object
    const enhancedDb = {
      ...db,
      query: {
        // Add deployments query methods
        deployments: {
          findMany: async (params: { where: any }) => {
            return await db.select().from(schema.deployments).where(params.where);
          },
          findFirst: async (params: { where: any }) => {
            const results = await db.select().from(schema.deployments).where(params.where).limit(1);
            return results.length > 0 ? results[0] : null;
          }
        }
      }
    };

    logger.success("Database query builder initialized with schema");
    return enhancedDb;
  } catch (error) {
    logger.error("Failed to set up database:", error);
    throw error;
  }
};
