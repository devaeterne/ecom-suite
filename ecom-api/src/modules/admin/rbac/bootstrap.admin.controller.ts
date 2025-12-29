import {
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { RoleScope } from "@prisma/client";

@Controller("admin/rbac")
@UseGuards(AdminAuthGuard)
export class RbacBootstrapAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("bootstrap")
  async bootstrap(@Req() req: any) {
    if ((process.env.NODE_ENV ?? "development") === "production") {
      throw new ForbiddenException("Bootstrap disabled in production");
    }

    const tenantId = req.tenant.id as string;
    const userId = req.user.id as string;

    // 1) Tenant-scoped Owner role
    let owner = await this.prisma.role.findFirst({
      where: { tenantId, name: "Owner", deletedAt: null },
    });

    if (!owner) {
      owner = await this.prisma.role.create({
        data: {
          tenantId,
          name: "Owner",
          scope: RoleScope.ADMIN,
          description: "Bootstrap owner role",
          isActive: true,
        },
      });
    }

    // 2) Global permissions (tenantId = null)
    const perms = await this.prisma.permission.findMany({
      where: { tenantId: null, deletedAt: null },
      select: { id: true, key: true },
    });

    const now = new Date();

    await this.prisma.$transaction([
      // 3) clear existing role perms (soft)
      this.prisma.rolePermissionLink.updateMany({
        where: { tenantId, roleId: owner.id, deletedAt: null },
        data: { deletedAt: now },
      }),

      // 4) add all permissions
      this.prisma.rolePermissionLink.createMany({
        data: perms.map((p) => ({
          tenantId,
          roleId: owner!.id,
          permissionId: p.id,
        })),
        skipDuplicates: true,
      }),

      // 5) attach role to current user
      this.prisma.userRoleLink.upsert({
        where: {
          tenantId_userId_roleId: { tenantId, userId, roleId: owner.id },
        },
        create: { tenantId, userId, roleId: owner.id },
        update: { deletedAt: null },
      }),
    ]);

    return {
      ok: true,
      tenantId,
      userId,
      role: { id: owner.id, name: owner.name },
      permissionCount: perms.length,
    };
  }
}
