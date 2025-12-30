import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { TokenService } from "@/infrastructure/security/token.service";
import { PrismaService } from "@/prisma/prisma.service";

function firstHeader(v: unknown): string | undefined {
  if (!v) return undefined;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : undefined;
  return typeof v === "string" ? v : undefined;
}

function extractBearer(auth?: string): string | undefined {
  if (!auth) return undefined;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim();
}

function getAdminToken(req: any): string | undefined {
  const h = (req?.headers ?? {}) as Record<string, unknown>;

  const bearer = extractBearer(firstHeader(h["authorization"]));
  if (bearer) return bearer;

  const xAdmin = firstHeader(h["x-admin-token"]);
  if (xAdmin) return xAdmin.trim();

  const c = req?.cookies ?? {};
  const cookieToken =
    (typeof c.admin_access === "string" && c.admin_access) ||
    (typeof c.admin_session === "string" && c.admin_session);

  if (cookieToken) return cookieToken.trim();

  return undefined;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest & any>();

    const token = getAdminToken(req);
    if (!token)
      throw new UnauthorizedException("Admin authentication required");

    const payload = this.tokens.verifyAccessToken(token);
    if (!payload || payload.typ !== "admin") {
      throw new UnauthorizedException("Admin authentication required");
    }

    // ✅ Context her durumda set (bootstrap’ın 500 yememesi için kritik)
    req.tenant = { id: payload.tenantId };
    req.user = { id: payload.sub };
    req.admin = payload;

    // ✅ Identity var mı? (sub -> authIdentity.id varsayımı sende doğruydu)
    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        userId: true, // <-- kritik
      },
    });

    if (!identity) {
      throw new UnauthorizedException("Admin authentication required");
    }

    const userId = identity.userId ?? payload.sub; // userId null ise fallback (geçici)
    req.tenant = { id: payload.tenantId };
    req.user = { id: userId };
    req.admin = payload;

    // ✅ Role’lar userRoleLink.userId üzerinden bağlanıyor
    const userRoleLinks = await this.prisma.userRoleLink.findMany({
      where: {
        tenantId: payload.tenantId,
        userId, // <-- payload.sub değil
      },
      select: { roleId: true },
    });

    const roleIds = userRoleLinks.map((x) => x.roleId);

    // ✅ Permission key’leri flatten
    let permissionKeys: string[] = [];
    if (roleIds.length) {
      const links = await this.prisma.rolePermissionLink.findMany({
        where: {
          tenantId: payload.tenantId,
          roleId: { in: roleIds },
        },
        include: { permission: { select: { key: true } } },
      });

      permissionKeys = Array.from(
        new Set(links.map((l) => l.permission.key).filter(Boolean))
      ).sort();
    }

    req.permissionKeys = permissionKeys;

    return true;
  }
}
