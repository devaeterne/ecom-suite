import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@/prisma/prisma.service";
import { REQUIRE_PERMISSION_KEY } from "@/infrastructure/auth/decorators/permission.decorator";
import { RoleScope } from "@prisma/client";

type RequiredPerm = string | string[];

function normalizePermissions(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  return [String(v)];
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ✅ class + handler metadata (handler override wins)
    const meta = this.reflector.getAllAndOverride<RequiredPerm>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    const requiredPermissions = normalizePermissions(meta);
    if (requiredPermissions.length === 0) return true;

    const req: any = context.switchToHttp().getRequest();

    // Bu guard tipik olarak admin tarafı için.
    // Store request’te yanlışlıkla kullanıldıysa güvenli tarafta kalalım.
    if (req?.user?.typ === "store") {
      throw new ForbiddenException(
        "Permission checks are not available for store context"
      );
    }

    // Tenant context (AuthGuard/AdminAuthGuard set ediyor ama safe fallback)
    const tenantId =
      req?.tenant?.id ?? req?.user?.tenantId ?? req?.user?.tenant?.id ?? null;

    // Permission sistemi userId ile çalışıyor (identityId değil)
    const rawUser = req?.user ?? {};
    const userId = rawUser.id ?? rawUser.userId ?? null;

    if (!tenantId || !userId) {
      throw new ForbiddenException("Tenant or user context missing");
    }

    // 1) ADMIN scope role varsa bypass
    const isAdminScoped = await this.prisma.userRoleLink.findFirst({
      where: {
        tenantId,
        userId,
        deletedAt: null,
        role: {
          tenantId,
          scope: RoleScope.ADMIN,
          deletedAt: null,
          isActive: true,
        },
      },
      select: { id: true },
    });

    if (isAdminScoped) return true;

    // 2) Permission kontrolü:
    // requiredPermissions içinde EN AZ BİRİ varsa allow (OR semantics).
    // İstersen AND semantics’e çevirmek kolay.
    const link = await this.prisma.rolePermissionLink.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        permission: {
          key: { in: requiredPermissions },
          deletedAt: null,
        },
        role: {
          tenantId,
          deletedAt: null,
          isActive: true,
          users: {
            some: {
              tenantId,
              userId,
              deletedAt: null,
            },
          },
        },
      },
      select: { id: true, permission: { select: { key: true } } },
    });

    if (!link) {
      throw new ForbiddenException(
        `Missing permission: ${requiredPermissions.join(" | ")}`
      );
    }

    // İstersen req.authz = { matchedPermission: link.permission.key } gibi meta ekleyebiliriz.
    return true;
  }
}
