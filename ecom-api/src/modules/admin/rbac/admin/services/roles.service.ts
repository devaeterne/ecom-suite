import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RolePermissionsDto } from "@/modules/admin/rbac/common/dto/role-permissions.dto";
import { RoleCreateDto } from "@/modules/admin/rbac/common/dto/role-create.dto";
import { RolePatchDto } from "@/modules/admin/rbac/common/dto/role-patch.dto";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });

    // permission keys
    const links = await this.prisma.rolePermissionLink.findMany({
      where: {
        tenantId,
        deletedAt: null,
        roleId: { in: roles.map((r) => r.id) },
      },
      include: { permission: { select: { key: true } } },
    });

    const map = new Map<string, string[]>();
    for (const l of links) {
      const arr = map.get(l.roleId) ?? [];
      arr.push(l.permission.key);
      map.set(l.roleId, arr);
    }

    return roles.map((r) => ({
      ...r,
      permissionKeys: (map.get(r.id) ?? []).sort(),
    }));
  }

  async createRole(tenantId: string, dto: RoleCreateDto) {
    // aynı tenant içinde name unique değilse bile soft-delete yüzünden çakışma olabilir
    const existing = await this.prisma.role.findFirst({
      where: { tenantId, name: dto.name, deletedAt: null },
      select: { id: true },
    });
    if (existing) throw new BadRequestException("Role name already exists");

    const role = await this.prisma.role.create({
      data: {
        tenantId,
        name: dto.name,
        scope: dto.scope,
        description: dto.description ?? null,
      },
    });

    return { ...role, permissionKeys: [] as string[] };
  }

  async updateRole(tenantId: string, roleId: string, dto: RolePatchDto) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!role) throw new NotFoundException("Role not found");

    const updated = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    // permission keys return
    const links = await this.prisma.rolePermissionLink.findMany({
      where: { tenantId, roleId, deletedAt: null },
      include: { permission: { select: { key: true } } },
    });

    return {
      ...updated,
      permissionKeys: links.map((x) => x.permission.key).sort(),
    };
  }

  async setRolePermissions(
    tenantId: string,
    roleId: string,
    dto: RolePermissionsDto
  ) {
    const mode = dto.mode ?? "replace";

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!role) throw new NotFoundException("Role not found");

    const perms = await this.prisma.permission.findMany({
      where: { tenantId: null, deletedAt: null },
      select: { id: true, key: true },
    });

    const permByKey = new Map(perms.map((p) => [p.key, p]));
    const wantedKeys = Array.from(new Set(dto.permissionKeys));
    const missing = wantedKeys.filter((k) => !permByKey.has(k));
    if (missing.length)
      throw new BadRequestException(
        `Unknown permission keys: ${missing.join(", ")}`
      );

    const wantedIds = wantedKeys.map((k) => permByKey.get(k)!.id);

    const existing = await this.prisma.rolePermissionLink.findMany({
      where: { tenantId, roleId },
      select: { id: true, permissionId: true, deletedAt: true },
    });

    const existingByPermId = new Map(existing.map((l) => [l.permissionId, l]));
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (mode === "replace") {
        const toDisable = existing.filter(
          (l) => l.deletedAt === null && !wantedIds.includes(l.permissionId)
        );
        if (toDisable.length) {
          await tx.rolePermissionLink.updateMany({
            where: { id: { in: toDisable.map((x) => x.id) } },
            data: { deletedAt: now },
          });
        }
      }

      for (const pid of wantedIds) {
        const link = existingByPermId.get(pid);
        if (link) {
          if (link.deletedAt !== null) {
            await tx.rolePermissionLink.update({
              where: { id: link.id },
              data: { deletedAt: null },
            });
          }
        } else {
          await tx.rolePermissionLink.create({
            data: { tenantId, roleId, permissionId: pid },
          });
        }
      }
    });

    const after = await this.prisma.rolePermissionLink.findMany({
      where: { tenantId, roleId, deletedAt: null },
      include: { permission: { select: { key: true } } },
    });

    return {
      roleId,
      permissionKeys: after.map((x) => x.permission.key).sort(),
    };
  }
}
