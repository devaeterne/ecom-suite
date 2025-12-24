import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { env } from "../config/env";

@Injectable()
export class CacheService {
  readonly client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: 3,
  });
}
