import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { verify } from "jsonwebtoken";

type AdminJwtPayload = {
  sub: string; // auth_identity.id
  tenantId: string;
  typ: string; // "admin"
  iat: number;
  exp: number;
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  private getBearer(req: any): string | null {
    const auth = req.headers?.authorization?.toString() ?? "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    return m?.[1] ?? null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: any = context.switchToHttp().getRequest();

    const accessToken = this.getBearer(req);
    if (!accessToken) {
      throw new UnauthorizedException("Admin authentication required");
    }

    const secret =
      process.env.ADMIN_JWT_SECRET ||
      process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_SECRET ||
      process.env.AUTH_JWT_SECRET;

    if (!secret) {
      throw new UnauthorizedException("JWT secret missing");
    }

    let payload: AdminJwtPayload;
    try {
      payload = verify(accessToken, secret) as AdminJwtPayload;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    if (!payload?.sub || !payload?.tenantId || payload.typ !== "admin") {
      throw new UnauthorizedException("Invalid admin token payload");
    }

    // ✅ JWT sub = auth_identity.id
    const identity = await this.prisma.authIdentity.findUnique({
      where: { id: payload.sub },
      include: {
        user: {
          include: {
            roles: {
              where: { tenantId: payload.tenantId },
              include: { role: true },
            },
          },
        },
      },
    });

    const user = identity?.user;
    if (!identity || !user) {
      throw new UnauthorizedException("User not found");
    }

    const hasAdminAccess = user.roles.some((link) =>
      ["ADMIN", "STAFF"].includes(link.role.scope)
    );

    if (!hasAdminAccess) {
      throw new ForbiddenException("Admin access denied");
    }

    req.user = {
      id: user.id,
      identityId: identity.id,
      email: user.email,
      tenantId: payload.tenantId,
      typ: "admin",
      roles: user.roles.map((r) => r.role.name),
    };

    req.tenant = { id: payload.tenantId };

    return true;
  }
}
