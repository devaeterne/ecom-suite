import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TokenService } from "@/infrastructure/security/token.service";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";

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

    // 1) Authorization header
    const auth = req.headers?.authorization as string | undefined;
    let token: string | undefined;
    let source: "header" | "cookie" | undefined;

    if (auth?.startsWith("Bearer ")) {
      token = auth.slice("Bearer ".length).trim();
      source = "header";
    }

    // 2) Cookie fallback
    if (!token) {
      const cookies = (req.cookies as any) ?? {};
      token = cookies[COOKIE_NAMES.adminAccess];
      if (token) source = "cookie";
    }

    if (!token) throw new UnauthorizedException("Missing admin access token");

    const payload = this.tokenService.verifyAccessToken(token, "admin");

    const identityId = payload?.sub as string | undefined;
    const rawTenant = payload?.tenantId as string | undefined;
    if (payload?.typ && payload.typ !== "admin") {
      throw new UnauthorizedException("Invalid token type");
    }
    if (!identityId || !rawTenant) {
      throw new UnauthorizedException("Invalid token payload");
    }

    // tenant normalize: uuid değilse tenant.code üzerinden id resolve
    let tenantId = rawTenant;
    if (!isUuid(tenantId)) {
      const t = await this.prisma.tenant.findUnique({
        where: { code: tenantId },
        select: { id: true },
      });
      if (!t?.id) throw new UnauthorizedException("Unknown tenant");
      tenantId = t.id;
    }

    // identity -> user resolve
    const ident = await this.prisma.authIdentity.findFirst({
      where: { id: identityId, tenantId },
      select: { id: true, userId: true, tenantId: true },
    });

    if (!ident?.userId) {
      throw new UnauthorizedException("Identity has no user");
    }

    // ✅ standard request context
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

    return true;
  }
}
