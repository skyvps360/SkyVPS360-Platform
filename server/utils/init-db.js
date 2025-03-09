import { pool } from '../db.js';
import { logger } from '../utils/logger.js';

/**
 * Creates necessary database tables if they don't exist
 */
export async function initializeDatabase() {
  logger.info('Initializing database tables...');

  try {
    // Create deployments table if it doesn't exist
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

    logger.success('Deployments table initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing database tables:', error);
    return false;
  }
}
