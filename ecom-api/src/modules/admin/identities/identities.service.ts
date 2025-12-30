import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  AdminRoleScopeDto,
  IdentityCreateDto,
} from "@/modules/admin/dto/identity-create.dto";
import { IdentityPatchDto } from "@/modules/admin/dto/identity-patch.dto";
import { RoleScope } from "@prisma/client";
import { PasswordResetService } from "@/modules/auth/reset/password-reset.service";
import { MailService } from "@/infrastructure/mail/mail.service";

@Injectable()
export class IdentitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordReset: PasswordResetService,
    private readonly mail: MailService
  ) {}

  async list(tenantId: string) {
    // tenant içinde ADMIN/STAFF scope role’u olan user’lar
    return this.prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        roles: {
          some: {
            tenantId,
            deletedAt: null,
            role: { scope: { in: [RoleScope.ADMIN, RoleScope.STAFF] } },
          },
        },
      },
      include: {
        roles: {
          where: { tenantId, deletedAt: null },
          include: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(tenantId: string, dto: IdentityCreateDto) {
    const roleScope =
      dto.roleScope === AdminRoleScopeDto.ADMIN
        ? RoleScope.ADMIN
        : RoleScope.STAFF;

    // 1) role'u bul (seed yoksa create edebilirsin)
    const role = await this.prisma.role.findFirst({
      where: { tenantId, scope: roleScope, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });

    // role yoksa minimal create
    const ensuredRole =
      role ??
      (await this.prisma.role.create({
        data: {
          tenantId,
          name: roleScope === RoleScope.ADMIN ? "Admin" : "Staff",
          scope: roleScope,
          isActive: true,
        },
      }));

    // 2) user upsert
    const user = await this.prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email: dto.email,
        },
      },
      create: {
        tenantId,
        email: dto.email,
        name: dto.name ?? null,
        isActive: true,
      },
      update: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        deletedAt: null,
        // isActive update etmek istiyorsan burada da set edebilirsin
      },
    });

    // 3) role link
    await this.prisma.userRoleLink.upsert({
      where: {
        tenantId_userId_roleId: {
          tenantId,
          userId: user.id,
          roleId: ensuredRole.id,
        },
      },
      create: { tenantId, userId: user.id, roleId: ensuredRole.id },
      update: { deletedAt: null },
    });

    return this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          where: { tenantId, deletedAt: null },
          include: { role: true },
        },
      },
    });
  }

  async patch(tenantId: string, userId: string, dto: IdentityPatchDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      include: {
        roles: {
          where: { tenantId, deletedAt: null },
          include: { role: true },
        },
      },
    });
  }

  async invite(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });
    if (!user) return { ok: true };

    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        tenantId,
        userId: user.id,
        provider: "EMAIL_PASSWORD",
        providerId: { equals: user.email, mode: "insensitive" },
      },
    });

    // Eğer identity yoksa create et (login için şart)
    const ensuredIdentity =
      identity ??
      (await this.prisma.authIdentity.create({
        data: {
          tenantId,
          userId: user.id,
          provider: "EMAIL_PASSWORD",
          providerId: user.email.toLowerCase(),
          passwordHash: null,
          passwordAlgo: null,
          passwordUpdatedAt: null,
        },
      }));

    // token üret (DEV’de dönecek)
    return this.passwordReset.issue({
      tenantId,
      typ: "admin",
      identityId: ensuredIdentity.id,
      sendMail: true, // istersen false
      email: user.email,
    });
  }
}
