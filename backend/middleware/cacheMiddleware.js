const { redisClient } = require("../config/redis");

const cacheResponse = (key, ttlSeconds = 300) => {
  return async (req, res, next) => {
    try {
      if (!redisClient.isReady) {
        res.setHeader("X-Cache", "BYPASS");
        return next();
      }

      const cachedData = await redisClient.get(key);

      if (cachedData) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cachedData));
      }

      res.setHeader("X-Cache", "MISS");

      const originalJson = res.json.bind(res);

      res.json = async (body) => {
        try {
          if (redisClient.isReady) {
            await redisClient.setEx(
              key,
              ttlSeconds,
              JSON.stringify(body)
            );
          }
        } catch (error) {
          console.error(
            `Redis cache write failed for ${key}:`,
            error.message
          );
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error(
        `Redis cache read failed for ${key}:`,
        error.message
      );

      res.setHeader("X-Cache", "BYPASS");
      next();
    }
  };
};

const invalidateCache = (...keys) => {
  return (req, res, next) => {
    res.on("finish", async () => {
      if (
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        redisClient.isReady
      ) {
        try {
          if (keys.length > 0) {
            await redisClient.del(keys);
          }
        } catch (error) {
          console.error(
            "Redis cache invalidation failed:",
            error.message
          );
        }
      }
    });

    next();
  };
};

module.exports = {
  cacheResponse,
  invalidateCache,
};