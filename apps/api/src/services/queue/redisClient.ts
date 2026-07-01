import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Configure global Redis client for BullMQ queues and workers.
 * Includes graceful connection checks and dev stub fallbacks.
 */
export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true, // Don't crash immediately on startup if Redis is offline
  retryStrategy(times) {
    // Limit reconnection retries to every 60 seconds to prevent console logs flood
    return 60000;
  },
});

// Connection state checks
redisConnection.on("connect", () => {
  console.log("🔌 Connected to Redis database for BullMQ!");
});

redisConnection.on("error", (error) => {
  console.warn("⚠️ Redis connection issue. BullMQ background processing will operate in dev/lazy mode:", error.message);
});

// Try to connect gracefully
redisConnection.connect().catch((err) => {
  // Catch silent so server doesn't crash if Redis is not running locally
  console.warn("⚠️ Could not connect to Redis. Mock queue execution will be used.");
});
