// ecom-api/src/infrastructure/auth/guards/admin-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TokenService } from "@/infrastructure/security/token.service";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";
import { RoleScope } from "@prisma/client";

type TokenSource = "cookie";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    const { token, source } = this.extractAdminAccessToken(req);
    const payload = this.verifyAdminToken(token);

    const identityId = payload?.sub as string | undefined;
    const rawTenant = payload?.tenantId as string | undefined;
    if (!identityId || !rawTenant) {
      throw new UnauthorizedException("Invalid token payload");
    }

    const tenantId = await this.resolveTenantId(rawTenant);

    const ident = await this.prisma.authIdentity.findFirst({
      where: { id: identityId, tenantId },
      select: { id: true, userId: true, tenantId: true },
    });

    if (!ident?.userId) {
      throw new UnauthorizedException("Identity has no user");
    }

    // ✅ role hydrate (deterministic from DB)
    const isSuperAdmin = await this.prisma.userRoleLink.findFirst({
      where: {
        tenantId,
        userId: ident.userId,
        deletedAt: null,
        role: {
          tenantId,
          scope: RoleScope.SUPER_ADMIN,
          deletedAt: null,
          isActive: true,
        },
      },
      select: { id: true },
    });

    const role: "super_admin" | "admin" = isSuperAdmin
      ? "super_admin"
      : "admin";

    // ✅ standard request context
    req.user = {
      ...payload,
      typ: "admin",
      tenantId,
      id: ident.userId,
      userId: ident.userId,
      identityId: ident.id,
      role,
    };

    req.tenant = { id: tenantId };
    req.auth = { source, panel: "admin" };

    return true;
  }

  private extractAdminAccessToken(req: any): {
    token: string;
    source: TokenSource;
  } {
    const cookies = (req.cookies as any) ?? {};
    const token = cookies[COOKIE_NAMES.adminAccess];

    if (token) return { token, source: "cookie" };

    throw new UnauthorizedException("Missing admin access token");
  }

  private verifyAdminToken(token: string): any {
    const payload = this.tokenService.verifyAccessToken(token, "admin");

    // typ check (belt & suspenders)
    if (payload?.typ && payload.typ !== "admin") {
      throw new UnauthorizedException("Invalid token type");
    }

    return payload;
  }

  private async resolveTenantId(rawTenant: string): Promise<string> {
    if (isUuid(rawTenant)) return rawTenant;

    const t = await this.prisma.tenant.findUnique({
      where: { code: rawTenant },
      select: { id: true },
    });

    if (!t?.id) throw new UnauthorizedException("Unknown tenant");
    return t.id;
  }
}
