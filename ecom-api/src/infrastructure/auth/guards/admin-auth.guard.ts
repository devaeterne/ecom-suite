import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { createHash } from "crypto";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  private hashToken(raw: string) {
    // Not: Projede token hash algoritmanız farklıysa bunu aynı şekilde değiştirin.
    return createHash("sha256").update(raw).digest("hex");
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: any = context.switchToHttp().getRequest();

    const rawToken =
      req.cookies?.admin_access ||
      req.cookies?.admin_session ||
      req.headers["x-admin-token"];

    if (!rawToken || typeof rawToken !== "string") {
      throw new UnauthorizedException("Admin authentication required");
    }

    const tokenHash = this.hashToken(rawToken);

    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        typ: "admin",
      },
      select: {
        tenantId: true,
        identity: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!session || !session.identity?.userId) {
      throw new UnauthorizedException("Invalid admin session");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.identity.userId },
      include: {
        roles: {
          where: { tenantId: session.tenantId, deletedAt: null },
          include: { role: true },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException("User not found");
    }

    // Admin erişimi: role.scope in (ADMIN, STAFF)
    const hasAdminAccess = user.roles.some((link) =>
      ["ADMIN", "STAFF"].includes(link.role.scope)
    );

    if (!hasAdminAccess) {
      throw new ForbiddenException("Admin access denied");
    }

    // req.user contract
    req.user = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId, // User zaten tenant scoped
      sessionTenantId: session.tenantId, // guard/debug için
      roles: user.roles.map((r) => r.role.name),
    };

    return true;
  }
}
