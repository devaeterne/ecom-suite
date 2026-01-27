// ecom-api/src/infrastructure/auth/guards/auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenService } from "@/infrastructure/security/token.service";
import { PrismaService } from "@/prisma/prisma.service";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";
import { RoleScope } from "@prisma/client";

export { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";

type Panel = "admin" | "store";
type TokenSource = "header" | "cookie";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function detectPanel(req: any): Panel | undefined {
  const url: string =
    req?.url ??
    req?.raw?.url ??
    req?.originalUrl ??
    req?.routeOptions?.url ??
    "";

  if (url.startsWith("/api/admin")) return "admin";
  if (url.startsWith("/api/store")) return "store";
  return undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    const panel = detectPanel(req);
    if (!panel) {
      throw new UnauthorizedException("Unknown auth panel for this route");
    }

    const { token, source } = this.extractAccessToken(req, panel);
    const payload = this.verifyToken(token, panel);

    if (panel === "admin") {
      await this.hydrateAdminContext(req, payload, source);
      return true;
    }

    this.hydrateStoreContext(req, payload, source);
    return true;
  }

  // ----------------------------
  // token helpers
  // ----------------------------

  private extractAccessToken(
    req: any,
    panel: Panel,
  ): { token: string; source: TokenSource } {
    const auth = req.headers?.authorization as string | undefined;

    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice("Bearer ".length).trim();
      if (token) return { token, source: "header" };
    }

    const cookies = (req.cookies as any) ?? {};
    const token =
      panel === "admin"
        ? cookies[COOKIE_NAMES.adminAccess]
        : cookies[COOKIE_NAMES.storeAccess];

    if (token) return { token, source: "cookie" };

    throw new UnauthorizedException("Missing access token");
  }

  private verifyToken(token: string, panel: Panel): any {
    const payload = this.tokenService.verifyAccessToken(token, panel);

    // belt & suspenders: token typ must match panel
    if (payload?.typ && payload.typ !== panel) {
      throw new UnauthorizedException("Invalid token type");
    }

    return payload;
  }

  // ----------------------------
  // admin hydration
  // ----------------------------

  private async hydrateAdminContext(
    req: any,
    payload: any,
    source?: TokenSource,
  ) {
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
  }

  private async resolveTenantId(rawTenant: string): Promise<string> {
    if (isUuid(rawTenant)) return rawTenant;

    const t = await this.prisma.tenant.findFirst({
      where: { code: rawTenant },
      select: { id: true },
    });

    if (!t?.id) throw new UnauthorizedException("Unknown tenant");
    return t.id;
  }

  // ----------------------------
  // store hydration
  // ----------------------------

  private hydrateStoreContext(req: any, payload: any, source?: TokenSource) {
    const sub = payload?.sub as string | undefined;

    req.user = {
      ...payload,
      typ: "store",
      ...(sub ? { id: payload.id ?? sub, userId: payload.userId ?? sub } : {}),
    };

    if (payload?.tenantId) {
      req.tenant = req.tenant ?? { id: payload.tenantId };
    }

    req.auth = { source, panel: "store" };
  }
}
