// src/config/redis.config.ts or similar
import { RedisModuleOptions } from "@nestjs-modules/ioredis";

export const redisConfig: RedisModuleOptions = {
  type: "single",
  url: process.env.REDIS_URL,
  options: {
    maxRetriesPerRequest: 20, // Increase from default 3
    retryStrategy: (times) => {
      if (times > 10) {
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000); // Exponential backoff
    },
    enableReadyCheck: true,
    lazyConnect: false,
  },
};
