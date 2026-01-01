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
export class AdminAccessGuard implements CanActivate {
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

    let payload: any;
    try {
      payload = this.tokenService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }

    if (payload?.typ !== "admin") {
      throw new UnauthorizedException("Invalid token type");
    }

    const tenantId = payload.tenantId as string | undefined;
    if (!tenantId) throw new UnauthorizedException("Invalid token payload");

    /**
     * ✅ KRİTİK:
     * access token içindeki kimlik alanları farklı kaynaklarda farklı gelebilir:
     * - payload.identityId varsa: identityId budur
     * - yoksa payload.sub bazen identityId, bazen userId olabilir
     *
     * Bu yüzden iki aşamalı resolve yapıyoruz:
     * 1) authIdentity.id = candidate
     * 2) authIdentity.userId = candidate
     */
    const candidate =
      (payload.identityId as string | undefined) ??
      (payload.sub as string | undefined);

    if (!candidate) throw new UnauthorizedException("Invalid token payload");

    // 1) candidate = identityId varsayımı
    let ident = await this.prisma.authIdentity.findFirst({
      where: { id: candidate, tenantId },
      select: { id: true, userId: true, tenantId: true },
    });

    // 2) candidate = userId olabilir (özellikle refresh sonrası)
    if (!ident) {
      ident = await this.prisma.authIdentity.findFirst({
        where: { userId: candidate, tenantId },
        select: { id: true, userId: true, tenantId: true },
      });
    }

    if (!ident?.userId) {
      throw new UnauthorizedException("Identity has no user");
    }

    // ✅ downstream (PermissionGuard / controller) için tek format
    req.user = {
      ...payload,
      tenantId: ident.tenantId,
      identityId: ident.id,
      id: ident.userId,
      userId: ident.userId,
    };

    req.tenant = { id: ident.tenantId };
    req.auth = { source };

    return true;
  }
}
