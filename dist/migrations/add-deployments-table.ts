import { db, pool } from "../server/db.js";
import { logger } from "../server/utils/logger.js";
import { sql } from "drizzle-orm";

export async function runMigration() {
  try {
    // Check if deployments table already exists
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'deployments'
      );
    `);

    const tableExists = checkTableResult.rows[0].exists;

    if (tableExists) {
      logger.info("Deployments table already exists, skipping migration");
      return false;
    }

    // Create the deployments table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        server_id INTEGER REFERENCES servers(id) ON DELETE SET NULL,
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

      CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);
      CREATE INDEX IF NOT EXISTS idx_deployments_server_id ON deployments(server_id);
      CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
    `);

    logger.success("Successfully created deployments table");
    return true;
  } catch (error) {
    logger.error("Failed to create deployments table:", error);
    throw error;
  }
}
