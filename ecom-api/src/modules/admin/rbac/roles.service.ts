import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RoleCreateDto } from "@/modules/admin/rbac/dto/role-create.dto";
import { RoleUpdateDto } from "@/modules/admin/rbac/dto/role-update.dto";
import { RolePermissionsDto } from "@/modules/admin/rbac/dto/role-permissions.dto";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: [{ scope: "asc" }, { name: "asc" }],
      include: {
        permissions: {
          where: { tenantId, deletedAt: null },
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      scope: r.scope,
      description: r.description,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      permissionKeys: r.permissions
        .filter((l) => l.permission.deletedAt === null)
        .map((l) => l.permission.key)
        .sort(),
    }));
  }

  async createRole(tenantId: string, dto: RoleCreateDto) {
    try {
      const role = await this.prisma.role.create({
        data: {
          tenantId,
          name: dto.name.trim(),
          scope: dto.scope ?? undefined,
          description: dto.description ?? null,
          // isActive default true
          // metadata default {}
        },
      });

      return role;
    } catch (e: any) {
      // uniq_role_tenant_name
      if (String(e?.code) === "P2002") {
        throw new BadRequestException("Role name already exists in tenant");
      }
      throw e;
    }
  }

  async updateRole(tenantId: string, roleId: string, dto: RoleUpdateDto) {
    const role = await this.prisma.role.findFirst({
      where: { tenantId, id: roleId, deletedAt: null },
      select: { id: true },
    });
    if (!role) throw new NotFoundException("Role not found");

    try {
      return await this.prisma.role.update({
        where: {
          tenantId_id: { tenantId, id: roleId },
        },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.scope !== undefined ? { scope: dto.scope } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });
    } catch (e: any) {
      if (String(e?.code) === "P2002") {
        throw new BadRequestException("Role name already exists in tenant");
      }
      throw e;
    }
  }

  /**
   * Replace set:
   * - permissionKeys -> permissionId
   * - mevcut linkleri yeni sete göre soft-delete / reactivate / create
   */
  async replaceRolePermissions(
    tenantId: string,
    roleId: string,
    dto: RolePermissionsDto
  ) {
    const role = await this.prisma.role.findFirst({
      where: { tenantId, id: roleId, deletedAt: null },
      select: { id: true },
    });
    if (!role) throw new NotFoundException("Role not found");

    const keys = Array.from(
      new Set(dto.permissionKeys.map((k) => k.trim()).filter(Boolean))
    );

    const permissions = await this.prisma.permission.findMany({
      where: {
        key: { in: keys },
        deletedAt: null,
      },
      select: { id: true, key: true },
    });

    const foundKeys = new Set(permissions.map((p) => p.key));
    const missing = keys.filter((k) => !foundKeys.has(k));
    if (missing.length) {
      throw new BadRequestException(
        `Unknown permission keys: ${missing.join(", ")}`
      );
    }

    const permissionIds = permissions.map((p) => p.id);

    // mevcut linkler (deletedAt dahil)
    const existingLinks = await this.prisma.rolePermissionLink.findMany({
      where: {
        tenantId,
        roleId,
        permissionId: { in: permissionIds },
      },
      select: { permissionId: true, deletedAt: true },
    });

    const existingSet = new Set(existingLinks.map((l) => l.permissionId));
    const toReactivate = existingLinks
      .filter((l) => l.deletedAt !== null)
      .map((l) => l.permissionId);

    const toCreate = permissionIds.filter((pid) => !existingSet.has(pid));

    const now = new Date();

    await this.prisma.$transaction([
      // yeni sette olmayan aktif linkleri soft-delete
      this.prisma.rolePermissionLink.updateMany({
        where: {
          tenantId,
          roleId,
          deletedAt: null,
          permissionId: { notIn: permissionIds },
        },
        data: { deletedAt: now },
      }),

      // yeni sette olup daha önce soft-delete olmuş olanları geri aç
      ...(toReactivate.length
        ? [
            this.prisma.rolePermissionLink.updateMany({
              where: {
                tenantId,
                roleId,
                permissionId: { in: toReactivate },
              },
              data: { deletedAt: null },
            }),
          ]
        : []),

      // gerçekten olmayanları create et
      ...(toCreate.length
        ? [
            this.prisma.rolePermissionLink.createMany({
              data: toCreate.map((permissionId) => ({
                tenantId,
                roleId,
                permissionId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    // response: güncel permission key listesi
    const links = await this.prisma.rolePermissionLink.findMany({
      where: { tenantId, roleId, deletedAt: null },
      include: { permission: true },
    });

    return {
      roleId,
      tenantId,
      permissionKeys: links
        .filter((l) => l.permission.deletedAt === null)
        .map((l) => l.permission.key)
        .sort(),
    };
  }
}
