import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "@/prisma/prisma.service";
import { ActiveTenantService } from "@/infrastructure/tenant-bootstrap/active-tenant.service";
import { TenantConfigService } from "@/infrastructure/tenant-bootstrap/tenant-config.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class TenantBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(TenantBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantConfig: TenantConfigService,
    private readonly activeTenant: ActiveTenantService
  ) {}

  async onModuleInit(): Promise<void> {
    const cfg = this.tenantConfig.getConfig();

    const tenant = await this.prisma.tenant.upsert({
      where: { code: cfg.code },
      create: {
        code: cfg.code,
        name: cfg.name,
        isActive: cfg.isActive,
        metadata: (cfg.metadata ?? {}) as Prisma.JsonObject,
      },
      update: {
        name: cfg.name,
        isActive: cfg.isActive,
        metadata: (cfg.metadata ?? {}) as Prisma.JsonObject,
      },
    });

    this.activeTenant.setTenantId(tenant.id);
    this.logger.log(`Active tenant set: ${tenant.code} (${tenant.id})`);

    const adminRole = await this.prisma.role.upsert({
      where: {
        tenantId_name: { tenantId: tenant.id, name: "Admin" },
      },
      create: {
        tenantId: tenant.id,
        name: "Admin",
        scope: "ADMIN",
        description: "System administrator role",
        isActive: true,
      },
      update: {
        scope: "ADMIN",
        isActive: true,
      },
    });

    const adminEmail = cfg.bootstrapAdmin.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email: adminEmail, deletedAt: null },
      select: { id: true, email: true },
    });

    if (existingUser) {
      this.logger.log(`Bootstrap admin already exists: ${existingUser.email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(cfg.bootstrapAdmin.password, 12);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          name: cfg.bootstrapAdmin.name ?? "Admin",
          isActive: true,
        },
      });

      await tx.userRoleLink.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      await tx.authIdentity.create({
        data: {
          tenantId: tenant.id,
          provider: "EMAIL_PASSWORD",
          providerId: adminEmail,
          userId: user.id,
          passwordHash,
          passwordAlgo: "bcrypt",
          passwordUpdatedAt: new Date(),
        },
      });
    });

    this.logger.log(`Bootstrap admin created: ${adminEmail}`);
  }
}
