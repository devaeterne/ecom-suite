import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenService } from "@/infrastructure/security/token.service";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";
import type {
  AdminAuthContext,
  AdminTokenPayload,
} from "@/modules/auth/admin/common/types/admin-request";
import { ADMIN_AUTH_ERRORS } from "@/modules/auth/admin/common/constants/admin-auth.constants";

@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AdminAuthContext>();
    const auth = req.headers?.authorization as string | undefined;

    // 1) Bearer öncelikli
    let token: string | undefined;
    let source: "header" | "cookie" | undefined;

    if (auth?.startsWith("Bearer ")) {
      token = auth.slice("Bearer ".length).trim();
      source = "header";
    }

    // 2) Cookie fallback (browser/e2e)
    if (!token) {
      const cookieToken = (req.cookies as any)?.[COOKIE_NAMES.adminAccess];
      if (cookieToken) {
        token = cookieToken;
        source = "cookie";
      }
    }

    if (!token)
      throw new UnauthorizedException(ADMIN_AUTH_ERRORS.MISSING_ACCESS_TOKEN);

    const payload = this.tokenService.verifyAccessToken(
      token
    ) as AdminTokenPayload;

    if (!payload?.sub)
      throw new UnauthorizedException(ADMIN_AUTH_ERRORS.INVALID_TOKEN);
    if (payload.typ !== "admin")
      throw new UnauthorizedException(ADMIN_AUTH_ERRORS.INVALID_TOKEN_TYPE);

    req.user = payload;
    req.adminId = payload.sub;
    req.identityId = (payload.identityId as string | undefined) ?? payload.sub;

    if (payload.tenantId) req.tenantId = payload.tenantId;

    req.auth = { source };
    return true;
  }
}
