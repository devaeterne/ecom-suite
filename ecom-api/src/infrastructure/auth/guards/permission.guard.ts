import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@/prisma/prisma.service";
import { REQUIRE_PERMISSION_KEY } from "@/infrastructure/auth/decorators/permission.decorator";

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
    const user = req.user;
    const tenant = req.tenant;

    if (!user?.id || !tenant?.id) {
      throw new ForbiddenException("Tenant or user context missing");
    }

    // Permission.key global unique. Tenant override yoksa tenantId null kalır.
    const permission = await this.prisma.permission.findFirst({
      where: {
        key: requiredPermission,
        deletedAt: null,
        roleLinks: {
          some: {
            tenantId: tenant.id,
            role: {
              users: {
                some: {
                  tenantId: tenant.id,
                  userId: user.id,
                  deletedAt: null,
                },
              },
            },
            deletedAt: null,
          },
        },
      },
      select: { id: true },
    });

    if (!permission) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }

    return true;
  }
}
