import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "@/prisma/prisma.service";
import { ActiveTenantService } from "@/infrastructure/tenant-bootstrap/active-tenant.service";
import { TenantConfigService } from "@/infrastructure/tenant-bootstrap/tenant-config.service";
import { Prisma } from "@prisma/client";

function normEmail(v: string) {
  return v.trim().toLowerCase();
}

@Injectable()
export class TenantBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(TenantBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantConfig: TenantConfigService,
    private readonly activeTenant: ActiveTenantService
  ) {}

  async onModuleInit(): Promise<void> {
    // ops toggle (CI / prod kontrollü)
    if (String(process.env.TENANT_BOOTSTRAP_DISABLED ?? "false") === "true") {
      this.logger.warn(
        "Tenant bootstrap is disabled (TENANT_BOOTSTRAP_DISABLED=true)."
      );
      return;
    }

    const cfg = this.tenantConfig.getConfig();

    // prod safety: default şifre ile prod’a çıkmayalım
    if (
      process.env.NODE_ENV === "production" &&
      /changeme|password|12345678/i.test(cfg.bootstrapAdmin.password)
    ) {
      throw new Error(
        "Unsafe bootstrap admin password detected for production. Please set a strong password in tenant.json."
      );
    }

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
      select: { id: true, code: true },
    });

    this.activeTenant.setTenant({ id: tenant.id, code: tenant.code });
    this.logger.log(`Active tenant set: ${tenant.code} (${tenant.id})`);

    // Admin role idempotent
    const adminRole = await this.prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Admin" } },
      create: {
        tenantId: tenant.id,
        name: "Admin",
        scope: "ADMIN",
        description: "System administrator role",
        isActive: true,
      },
      update: { scope: "ADMIN", isActive: true },
      select: { id: true },
    });

    const adminEmail = normEmail(cfg.bootstrapAdmin.email);

    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email: adminEmail, deletedAt: null },
      select: { id: true, email: true },
    });

    if (existingUser) {
      this.logger.log(`Bootstrap admin already exists: ${existingUser.email}`);
      return;
    }

    const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
    const passwordHash = await bcrypt.hash(cfg.bootstrapAdmin.password, rounds);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          name: cfg.bootstrapAdmin.name ?? "Admin",
          isActive: true,
        },
        select: { id: true },
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
