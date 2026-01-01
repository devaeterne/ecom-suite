import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenService } from "@/infrastructure/security/token.service";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    const auth = req.headers?.authorization as string | undefined;

    // 1) Bearer öncelikli
    let token: string | undefined;
    let source: "header" | "cookie" | undefined;

    if (auth?.startsWith("Bearer ")) {
      token = auth.slice("Bearer ".length).trim();
      source = "header";
    }

    // 2) Cookie fallback (E2E agent + browser)
    if (!token) {
      const cookieToken = (req.cookies as any)?.[COOKIE_NAMES.adminAccess];
      if (cookieToken) {
        token = cookieToken;
        source = "cookie";
      }
    }

    if (!token) throw new UnauthorizedException("Missing access token");

    const payload = this.tokenService.verifyAccessToken(token);
    if (payload?.typ !== "admin") {
      throw new UnauthorizedException("Invalid token type");
    }

    // payload.sub = identityId kabul ediyoruz
    const identityId = payload.sub as string | undefined;
    const tenantId = payload.tenantId as string | undefined;

    if (!identityId || !tenantId) {
      throw new UnauthorizedException("Invalid token payload");
    }

    // ✅ KRİTİK: identity -> userId resolve et
    const ident = await this.prisma.authIdentity.findFirst({
      where: { id: identityId, tenantId },
      select: { id: true, userId: true, tenantId: true },
    });

    if (!ident?.userId) {
      throw new UnauthorizedException("Identity has no user");
    }

    // req.user.id artık GERÇEK userId
    req.user = {
      ...payload,
      id: ident.userId,
      userId: ident.userId,
      identityId: ident.id,
    };

    // tenant context
    req.tenant = { id: tenantId };

    // debug/observability
    req.auth = { source };

    return true;
  }
}
