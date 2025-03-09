import { db, pool } from "../server/db.js";
import { logger } from "../server/utils/logger.js";

/**
 * This migration fixes the deployments table schema by:
 * 1. Renaming the "name" column to "repository_name" if it exists
 * 2. Adding "repository_name" column if missing
 */
export async function runMigration() {
  try {
    logger.info("Running migration: fix-deployments-schema");

    // Check if 'deployments' table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'deployments'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      logger.info("Deployments table doesn't exist, nothing to fix");
      return false;
    }

    // Check if 'name' column exists
    const nameColumnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'deployments' AND column_name = 'name'
      );
    `);

    // Check if 'repository_name' column exists
    const repoNameColumnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'deployments' AND column_name = 'repository_name'
      );
    `);

    if (nameColumnCheck.rows[0].exists && !repoNameColumnCheck.rows[0].exists) {
      // If 'name' exists but 'repository_name' doesn't, rename the column
      logger.info("Renaming column 'name' to 'repository_name' in deployments table");
      await pool.query(`
        ALTER TABLE deployments
        RENAME COLUMN "name" TO "repository_name";
      `);
      logger.success("Successfully renamed column 'name' to 'repository_name'");
      return true;
    }
    else if (!nameColumnCheck.rows[0].exists && !repoNameColumnCheck.rows[0].exists) {
      // If neither column exists, add 'repository_name'
      logger.info("Adding 'repository_name' column to deployments table");
      await pool.query(`
        ALTER TABLE deployments
        ADD COLUMN "repository_name" VARCHAR(255) NOT NULL DEFAULT 'repository';
      `);
      logger.success("Successfully added 'repository_name' column");
      return true;
    }
    else {
      // Both columns exist or only repository_name exists, no changes needed
      logger.info("Column 'repository_name' already exists in deployments table");
      return false;
    }
  } catch (error) {
    logger.error("Error running fix-deployments-schema migration:", error);
    return false;
  }
}

// Allow running this directly
if (process.argv[1] === import.meta.url) {
  runMigration().then(result => {
    if (result) {
      logger.success("Migration completed successfully");
    } else {
      logger.warning("Migration failed or was not needed");
    }
    process.exit(0);
  }).catch(error => {
    logger.error("Migration failed:", error);
    process.exit(1);
  });
}
