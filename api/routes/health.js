const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  const dbStatus = mongoose.connection.readyState;

  const dbState = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const isHealthy = dbStatus === 1;

  const memoryUsage = process.memoryUsage();

  const health = {
    status: isHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + "s",
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || "1.0.0",

    system: {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB",
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
      },
    },

    services: {
      database: {
        status: dbState[dbStatus],
        healthy: isHealthy,
      },
    },
  };

  return res.status(isHealthy ? 200 : 503).json(health);
});

module.exports = router;
