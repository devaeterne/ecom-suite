// src/modules/auth/store/guards/store-access.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { TokenService } from "@/infrastructure/security/token.service";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";
import type {
  StoreAuthContext,
  StoreTokenPayload,
} from "@/modules/auth/store/common/types/store-request";

/**
 * StoreAccessGuard
 * - Bearer token öncelikli
 * - Cookie fallback (browser / e2e)
 * - req.user typ === "store" sözleşmesini garanti eder
 */
@Injectable()
export class StoreAccessGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<StoreAuthContext>();
    const auth =
      (req.headers?.authorization as string | undefined) ?? undefined;

    let token: string | undefined;
    let source: "header" | "cookie" | undefined;

    // 1) Bearer
    if (auth?.startsWith("Bearer ")) {
      token = auth.slice("Bearer ".length).trim();
      source = "header";
    }

    // 2) Cookie fallback
    if (!token) {
      const cookieToken = (req.cookies as any)?.[COOKIE_NAMES.storeAccess] as
        | string
        | undefined;
      if (cookieToken) {
        token = cookieToken;
        source = "cookie";
      }
    }

    if (!token) throw new UnauthorizedException("Missing access token");

    const payload = this.tokenService.verifyAccessToken(
      token,
      "store"
    ) as StoreTokenPayload;

    if (!payload?.sub) throw new UnauthorizedException("Invalid token payload");
    if (payload.typ !== "store")
      throw new UnauthorizedException("Invalid token type");

    // contract
    req.user = payload;
    req.customerId = payload.sub;
    req.tenantId = payload.tenantId;
    req.auth = { source };

    return true;
  }
}
