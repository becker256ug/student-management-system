const { createClient } = require("redis");

// Redis is optional.
// If REDIS_URL is not configured, StudentHub will run without Redis.

let redisClient = null;

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  // No Redis configured → continue normally
  if (!redisUrl) {
    console.log("Redis not configured. Continuing without Redis.");
    return;
  }

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on("error", (error) => {
    console.error("Redis Client Error:", error.message);
  });

  redisClient.on("connect", () => {
    console.log("Redis connecting...");
  });

  redisClient.on("ready", () => {
    console.log("Redis connected and ready.");
  });

  redisClient.on("reconnecting", () => {
    console.log("Redis reconnecting...");
  });

  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Redis connection failed:", error.message);
    console.log("StudentHub will continue without Redis caching.");
  }
};

module.exports = {
  get redisClient() {
    return redisClient;
  },
  connectRedis,
};