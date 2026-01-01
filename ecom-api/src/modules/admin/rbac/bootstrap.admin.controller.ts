import {
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
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

    const tenantId: string | undefined = req.tenant?.id ?? req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException("Missing tenant context");

    // Guard sonrası req.user.id = userId olmalı
    let userId: string | undefined = req.user?.id;

    // Safety: eğer guard eskiyse veya farklı akış varsa identityId'den resolve et
    if (!userId) {
      const identityId: string | undefined =
        req.user?.sub ?? req.user?.identityId;
      if (!identityId) throw new UnauthorizedException("Missing user context");

      const ident = await this.prisma.authIdentity.findFirst({
        where: { id: identityId, tenantId },
        select: { userId: true },
      });

      if (!ident?.userId)
        throw new UnauthorizedException("Identity has no user");
      userId = ident.userId;
    }

    // 1) Ensure Owner role
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

    // 2) Read global permissions
    const perms = await this.prisma.permission.findMany({
      where: { tenantId: null, deletedAt: null },
      select: { id: true, key: true },
      orderBy: { key: "asc" },
    });

    // 3) Read existing links (including soft-deleted)
    const existing = await this.prisma.rolePermissionLink.findMany({
      where: { tenantId, roleId: owner.id },
      select: { id: true, permissionId: true, deletedAt: true },
    });

    const existingByPermId = new Map(existing.map((l) => [l.permissionId, l]));

    // 4) Transaction: undelete existing links, create missing links, ensure user role
    await this.prisma.$transaction(async (tx) => {
      // 4a) ensure each permission link active
      for (const p of perms) {
        const link = existingByPermId.get(p.id);

        if (link) {
          if (link.deletedAt !== null) {
            await tx.rolePermissionLink.update({
              where: { id: link.id },
              data: { deletedAt: null },
            });
          }
        } else {
          await tx.rolePermissionLink.create({
            data: {
              tenantId,
              roleId: owner!.id,
              permissionId: p.id,
              deletedAt: null,
            },
          });
        }
      }

      // 4b) ensure user has Owner role
      await tx.userRoleLink.upsert({
        where: {
          tenantId_userId_roleId: {
            tenantId,
            userId: userId!,
            roleId: owner!.id,
          },
        },
        create: {
          tenantId,
          userId: userId!,
          roleId: owner!.id,
          deletedAt: null,
        },
        update: { deletedAt: null },
      });
    });

    return {
      ok: true,
      tenantId,
      userId,
      role: { id: owner.id, name: owner.name },
      permissionCount: perms.length,
    };
  }
}
