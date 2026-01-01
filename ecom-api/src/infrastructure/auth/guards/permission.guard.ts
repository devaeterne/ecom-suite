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

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler()
    );

    if (!requiredPermission) return true;

    const req: any = context.switchToHttp().getRequest();

    // Tenant context (AdminAuthGuard / AdminAccessGuard zaten set ediyor ama safe fallback)
    const tenantId =
      req?.tenant?.id ?? req?.user?.tenantId ?? req?.user?.tenant?.id ?? null;

    // User context: Permission sistemi userId ile çalışıyor (identityId değil)
    const rawUser = req?.user ?? {};
    const userId = rawUser.id ?? rawUser.userId ?? null;

    // Debug için gerekirse (payload.sub çoğu yerde identityId)
    const identityId = rawUser.identityId ?? rawUser.sub ?? null;

    if (!tenantId || !userId) {
      throw new ForbiddenException("Tenant or user context missing");
    }

    // 1) ADMIN scope role varsa permission check bypass
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

    // 2) Permission kontrolü (rolePermissionLink -> role -> users join)
    const link = await this.prisma.rolePermissionLink.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        permission: { key: requiredPermission, deletedAt: null },
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
      select: { id: true },
    });

    if (!link) {
      // istersen burada debug meta ekleyebilirsin (identityId vb.)
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }

    return true;
  }
}
