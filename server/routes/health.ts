import express from "express";
import { pool } from "../db.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Health check endpoint that checks database connectivity
router.get("/", async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    // Return success response
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    logger.error("Health check failed:", error);

    // Return error response
    return res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed"
    });
  }
});

export default router;
