import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { CacheService } from "@/cache/cache.service";
import { env } from "@/config/env";

type RateLimitInput = {
  typ: "admin" | "store";
  action: "login" | "register" | "reset_request" | "reset_confirm";
  tenantId: string;
  ip: string | null;
  identityKey: string | null;
};

@Injectable()
export class AuthRateLimitService {
  constructor(private readonly cache: CacheService) {}

  private keyOf(i: RateLimitInput) {
    const t = i.tenantId ?? "global";
    const ip = i.ip ?? "unknown";
    const extra = i.identityKey ? `:${i.identityKey}` : "";
    return `rl:${t}:${i.typ}:${i.action}:${ip}${extra}`;
  }

  async assertAllowed(
    input: RateLimitInput,
    limit: number,
    windowSeconds: number
  ) {
    // E2E / unit testlerde limiter devre dışı
    if (env.NODE_ENV === "test") {
      return { allowed: true, remaining: limit, resetSeconds: windowSeconds };
    }

    const key = this.keyOf(input);
    const { count, ttl } = await this.cache.incrWindow(key, windowSeconds);

    if (count > limit) {
      throw new HttpException(
        {
          message: "Too many requests",
          code: "RATE_LIMITED",
          retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      resetSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  }
}
