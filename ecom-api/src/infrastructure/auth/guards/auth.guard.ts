import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenService } from "@/infrastructure/security/token.service";
import { PrismaService } from "@/prisma/prisma.service";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";

export { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";

type Panel = "admin" | "store";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
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
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    const panel = detectPanel(req);
    const auth = req.headers?.authorization as string | undefined;

    let token: string | undefined;
    let source: "header" | "cookie" | undefined;

    if (auth?.startsWith("Bearer ")) {
      token = auth.slice("Bearer ".length).trim();
      source = "header";
    }

    if (!token) {
      const cookies = (req.cookies as any) ?? {};
      if (panel === "admin") token = cookies[COOKIE_NAMES.adminAccess];
      else if (panel === "store") token = cookies[COOKIE_NAMES.storeAccess];
      else
        token =
          cookies[COOKIE_NAMES.adminAccess] ?? cookies[COOKIE_NAMES.storeAccess];
      if (token) source = "cookie";
    }

    if (!token) throw new UnauthorizedException("Missing access token");

    const payload = this.tokenService.verifyAccessToken(token, panel);

    if (panel && payload?.typ && payload.typ !== panel) {
      throw new UnauthorizedException("Invalid token type");
    }

    if (panel === "admin") {
      await this.hydrateAdminContext(req, payload, source);
      return true;
    }

    this.hydrateStoreContext(req, payload, source);
    return true;
  }

  private async hydrateAdminContext(
    req: any,
    payload: any,
    source?: "header" | "cookie"
  ) {
    const identityId = payload?.sub as string | undefined;
    const rawTenant = payload?.tenantId as string | undefined;

    if (!identityId || !rawTenant) {
      throw new UnauthorizedException("Invalid token payload");
    }

    let tenantId = rawTenant;
    if (!isUuid(tenantId)) {
      const t = await this.prisma.tenant.findFirst({
        where: { code: tenantId },
        select: { id: true },
      });
      if (!t?.id) throw new UnauthorizedException("Unknown tenant");
      tenantId = t.id;
    }

    const ident = await this.prisma.authIdentity.findFirst({
      where: { id: identityId, tenantId },
      select: { id: true, userId: true, tenantId: true },
    });

    if (!ident?.userId) {
      throw new UnauthorizedException("Identity has no user");
    }

    req.user = {
      ...payload,
      typ: "admin",
      tenantId,
      id: ident.userId,
      userId: ident.userId,
      identityId: ident.id,
    };

    req.tenant = { id: tenantId };
    req.auth = { source, panel: "admin" };
  }

  private hydrateStoreContext(
    req: any,
    payload: any,
    source?: "header" | "cookie"
  ) {
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
