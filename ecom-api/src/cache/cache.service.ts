import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { env } from "@/config/env";

type TTLSeconds = number;

@Injectable()
export class CacheService {
  // Kurumsal: tek yerden yönetilen “anlamlı” TTL’ler
  private readonly TTL = {
    SHORT: 5 * 60, // 5 dk (OTP, linking token, kısa yaşam)
    MEDIUM: 30 * 60, // 30 dk (geçici state, kısa cache)
    LONG: 24 * 60 * 60, // 24 saat (liste cache vs.)
  } as const;

  readonly client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: 20,
  });

  // ----------------------------
  // Primitive ops (string)
  // ----------------------------

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: TTLSeconds
  ): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, "EX", ttlSeconds);
      return;
    }
    await this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const n = await this.client.exists(key);
    return n === 1;
  }

  async ttl(key: string): Promise<number> {
    // -2: key yok, -1: ttl yok
    return this.client.ttl(key);
  }

  // ----------------------------
  // JSON ops (typed)
  // ----------------------------

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      // Kirli veri varsa null dön; üst katman patlamasın
      return null;
    }
  }

  async setJson<T>(
    key: string,
    value: T,
    ttlSeconds?: TTLSeconds
  ): Promise<void> {
    const raw = JSON.stringify(value);
    await this.set(key, raw, ttlSeconds);
  }

  // ----------------------------
  // Semantic TTL helpers
  // ----------------------------

  async setShort(key: string, value: string): Promise<void> {
    await this.set(key, value, this.TTL.SHORT);
  }

  async setMedium(key: string, value: string): Promise<void> {
    await this.set(key, value, this.TTL.MEDIUM);
  }

  async setLong(key: string, value: string): Promise<void> {
    await this.set(key, value, this.TTL.LONG);
  }

  async setJsonShort<T>(key: string, value: T): Promise<void> {
    await this.setJson(key, value, this.TTL.SHORT);
  }

  async setJsonMedium<T>(key: string, value: T): Promise<void> {
    await this.setJson(key, value, this.TTL.MEDIUM);
  }

  async setJsonLong<T>(key: string, value: T): Promise<void> {
    await this.setJson(key, value, this.TTL.LONG);
  }

  async setWithTTL(
    key: string,
    value: string,
    ttlSeconds: TTLSeconds
  ): Promise<void> {
    await this.set(key, value, ttlSeconds);
  }

  // ----------------------------
  // Convenience: remember pattern
  // ----------------------------
  async rememberJson<T>(
    key: string,
    ttlSeconds: TTLSeconds,
    factory: () => Promise<T>
  ): Promise<T> {
    const cached = await this.getJson<T>(key);
    if (cached !== null) return cached;

    const fresh = await factory();
    await this.setJson(key, fresh, ttlSeconds);
    return fresh;
  }
  // ----------------------------
  // Rate limit primitives (atomic)
  // ----------------------------

  /**
   * Atomic window counter:
   * - INCR
   * - if first hit -> EXPIRE(windowSeconds)
   * - return {count, ttl}
   */
  async incrWindow(
    key: string,
    windowSeconds: number
  ): Promise<{ count: number; ttl: number }> {
    const script = `
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      local ttl = redis.call("TTL", KEYS[1])
      return {current, ttl}
    `;

    const res = (await this.client.eval(
      script,
      1,
      key,
      String(windowSeconds)
    )) as [number, number];

    return { count: Number(res[0]), ttl: Number(res[1]) };
  }
}
