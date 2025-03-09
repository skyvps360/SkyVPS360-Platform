import express from "express";
import fetch from "node-fetch";
import { requireAuth } from "../auth";
import { logger } from "../utils/logger";

const router = express.Router();

// Require authentication for all routes
router.use(requireAuth);

// Get available regions for app platform
router.get("/regions", async (req, res) => {
  try {
    // In production, this would call the DigitalOcean API
    const regions = [
      {
        id: "ams",
        slug: "ams",
        name: "Amsterdam, Netherlands",
        available: true,
        data_centers: ["ams3"],
        default: false
      },
      {
        id: "nyc",
        slug: "nyc",
        name: "New York, United States",
        available: true,
        data_centers: ["nyc1", "nyc3"],
        default: true
      },
      {
        id: "fra",
        slug: "fra",
        name: "Frankfurt, Germany",
        available: true,
        data_centers: ["fra1"],
        default: false
      },
      {
        id: "lon",
        slug: "lon",
        name: "London, United Kingdom",
        available: true,
        data_centers: ["lon1"],
        default: false
      },
      {
        id: "sfo",
        slug: "sfo",
        name: "San Francisco, United States",
        available: true,
        data_centers: ["sfo3"],
        default: false
      },
      {
        id: "sgp",
        slug: "sgp",
        name: "Singapore",
        available: true,
        data_centers: ["sgp1"],
        default: false
      }
    ];

    res.json(regions);
  } catch (error) {
    logger.error("Error fetching app platform regions:", error);
    res.status(500).json({ error: "Failed to fetch regions" });
  }
});

// Get available sizes for app platform
router.get("/sizes", async (req, res) => {
  try {
    // In production, this would call the DigitalOcean API
    const sizes = [
      {
        slug: "basic-xxs",
        name: "Basic XXS",
        cpu: 1,
        memory_bytes: 512 * 1024 * 1024,
        usd_per_month: 5,
        usd_per_second: 0.0000019,
        tier_slug: "basic",
        tier_upgrade_to: "professional-xs",
        included_bandwidth_bytes: 40 * 1024 * 1024 * 1024,
      },
      {
        slug: "basic-xs",
        name: "Basic XS",
        cpu: 1,
        memory_bytes: 1024 * 1024 * 1024,
        usd_per_month: 10,
        usd_per_second: 0.0000038,
        tier_slug: "basic",
        tier_upgrade_to: "professional-xs",
        included_bandwidth_bytes: 80 * 1024 * 1024 * 1024,
      },
      {
        slug: "basic-s",
        name: "Basic S",
        cpu: 1,
        memory_bytes: 2 * 1024 * 1024 * 1024,
        usd_per_month: 18,
        usd_per_second: 0.0000069,
        tier_slug: "basic",
        tier_upgrade_to: "professional-xs",
        included_bandwidth_bytes: 160 * 1024 * 1024 * 1024,
      },
      {
        slug: "professional-xs",
        name: "Professional XS",
        cpu: 2,
        memory_bytes: 4 * 1024 * 1024 * 1024,
        usd_per_month: 40,
        usd_per_second: 0.000015,
        tier_slug: "professional",
        tier_upgrade_to: "professional-s",
        included_bandwidth_bytes: 320 * 1024 * 1024 * 1024,
      }
    ];

    res.json(sizes);
  } catch (error) {
    logger.error("Error fetching app platform sizes:", error);
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
});

export default router;
