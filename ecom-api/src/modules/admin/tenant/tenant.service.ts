import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TenantMePatchDto } from "@/modules/admin/dto/tenant-me.patch.dto";

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.deletedAt)
      throw new NotFoundException("Tenant not found");
    return tenant;
  }

  async updateMe(tenantId: string, dto: TenantMePatchDto) {
    const tenant = await this.getMe(tenantId);

    // Prisma JsonValue -> güvenli object cast
    let metadata: any = tenant.metadata ?? {};
    if (
      typeof metadata !== "object" ||
      metadata === null ||
      Array.isArray(metadata)
    ) {
      metadata = {};
    }

    const nextMetadata: any = {
      ...metadata,
      branding: {
        ...(metadata.branding ?? {}),
        ...(dto.logoUrl ? { logoUrl: dto.logoUrl } : {}),
      },
      i18n: {
        ...(metadata.i18n ?? {}),
        ...(dto.locale ? { locale: dto.locale } : {}),
        ...(dto.currencyCode ? { currencyCode: dto.currencyCode } : {}),
      },
      domains: {
        ...(metadata.domains ?? {}),
        ...(dto.domains ?? {}),
      },
    };

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        metadata: nextMetadata,
      },
    });
  }
}
