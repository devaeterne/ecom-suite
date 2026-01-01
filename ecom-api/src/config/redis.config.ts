// src/config/redis.config.ts
import { RedisModuleOptions } from "@nestjs-modules/ioredis";

export const redisConfig: RedisModuleOptions = {
  type: "single",
  url: process.env.REDIS_URL ?? "redis://redis:6379",
  options: {
    maxRetriesPerRequest: 20,
    retryStrategy: (times: number) => {
      if (times > 10) return null;
      return Math.min(times * 100, 2000);
    },
    enableReadyCheck: true,
    lazyConnect: false,
  },
};
