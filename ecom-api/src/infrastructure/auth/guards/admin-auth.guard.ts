import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenService } from "@/infrastructure/security/token.service";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";
import { PrismaService } from "@/prisma/prisma.service";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    const auth = req.headers?.authorization as string | undefined;

    let token: string | undefined;
    let source: "header" | "cookie" | undefined;

    if (auth?.startsWith("Bearer ")) {
      token = auth.slice("Bearer ".length).trim();
      source = "header";
    }

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

    const identityId = payload.sub as string | undefined;
    const rawTenant = payload.tenantId as string | undefined;

    if (!identityId || !rawTenant) {
      throw new UnauthorizedException("Invalid token payload");
    }

    // ✅ tenantId normalize: UUID değilse slug/handle → UUID resolve
    let tenantId = rawTenant;
    if (!isUuid(tenantId)) {
      const t = await this.prisma.tenant.findFirst({
        where: { code: tenantId }, // sende alan adı farklıysa: slug / code / key
        select: { id: true },
      });
      if (!t?.id) throw new UnauthorizedException("Unknown tenant");
      tenantId = t.id;
    }

    // identity resolve (artık tenantId UUID)
    const ident = await this.prisma.authIdentity.findFirst({
      where: { id: identityId, tenantId },
      select: { id: true, userId: true, tenantId: true },
    });

    if (!ident?.userId) {
      throw new UnauthorizedException("Identity has no user");
    }

    req.user = {
      ...payload,
      // ✅ downstream için tenantId'yi UUID yap
      tenantId,
      id: ident.userId,
      userId: ident.userId,
      identityId: ident.id,
    };

    req.tenant = { id: tenantId };
    req.auth = { source };

    return true;
  }
}
