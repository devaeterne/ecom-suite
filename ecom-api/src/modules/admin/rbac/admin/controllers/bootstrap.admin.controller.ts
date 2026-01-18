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

function requireTenantId(req: any): string {
  const tenantId = req?.tenant?.id ?? req?.tenantId ?? req?.user?.tenantId;
  if (!tenantId) throw new UnauthorizedException("Missing tenant context");
  return String(tenantId);
}

@Controller("admin/rbac")
@UseGuards(AdminAuthGuard)
export class RbacBootstrapAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("bootstrap")
  async bootstrap(@Req() req: any) {
    if ((process.env.NODE_ENV ?? "development") === "production") {
      throw new ForbiddenException("Bootstrap disabled in production");
    }

    const tenantId = requireTenantId(req);

    let userId: string | undefined = req.user?.id;

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

    let owner = await this.prisma.role.findFirst({
      where: { tenantId, name: "owner", deletedAt: null },
    });

    if (!owner) {
      owner = await this.prisma.role.create({
        data: {
          tenantId,
          name: "owner",
          scope: RoleScope.ADMIN,
          description: "Bootstrap owner role",
          isActive: true,
        },
      });
    }

    const perms = await this.prisma.permission.findMany({
      where: { tenantId: null, deletedAt: null },
      select: { id: true, key: true },
      orderBy: { key: "asc" },
    });

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.rolePermissionLink.findMany({
        where: { tenantId, roleId: owner!.id },
        select: { id: true, permissionId: true, deletedAt: true },
      });

      const existingByPermId = new Map(
        existing.map((l) => [l.permissionId, l]),
      );

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
