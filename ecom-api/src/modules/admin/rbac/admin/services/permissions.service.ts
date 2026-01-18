import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SEED_PERMISSIONS } from "@/modules/admin/rbac/common/seeds/permissions.seed";

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSeeded();
  }

  /**
   * İdempotent seed:
   * - Permission.key unique olduğu için upsert ile güvenli
   * - tenantId = null (global) tutuyoruz
   */
  async listForTenant(tenantId: string) {
    // global (tenantId: null) + tenant-specific (tenantId)
    return this.prisma.permission.findMany({
      where: {
        deletedAt: null,
        OR: [{ tenantId: null }, { tenantId }],
      },
      orderBy: { key: "asc" },
    });
  }

  async ensureSeeded() {
    for (const p of SEED_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { key: p.key },
        create: {
          key: p.key,
          description: p.description ?? null,
          tenantId: null,
        },
        update: {
          description: p.description ?? null,
          deletedAt: null,
        },
      });
    }

    this.logger.log(`Seeded permissions: ${SEED_PERMISSIONS.length}`);
  }

  async listAll() {
    return this.prisma.permission.findMany({
      where: {
        tenantId: null,
        deletedAt: null,
      },
      orderBy: { key: "asc" },
    });
  }
}
