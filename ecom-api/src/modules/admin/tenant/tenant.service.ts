import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TenantMePatchDto } from "@/modules/admin/tenant/dto/tenant-me.patch.dto";

type JsonObj = Record<string, any>;

function asObj(v: any): JsonObj {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as JsonObj) : {};
}

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(tenantId: string) {
    const t = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
    });
    if (!t) throw new NotFoundException("Tenant not found");
    return t;
  }

  async patchMe(tenantId: string, dto: TenantMePatchDto) {
    const t = await this.getMe(tenantId);

    const metadata = asObj(t.metadata);

    // metadata merge (deep-ish)
    const nextMetadata: JsonObj = {
      ...metadata,
      branding: {
        ...asObj(metadata.branding),
        ...asObj(dto.branding),
      },
      i18n: {
        ...asObj(metadata.i18n),
        ...asObj(dto.i18n),
      },
      domains: {
        ...asObj(metadata.domains),
        ...asObj(dto.domains),
      },
    };

    // Optional: canonical tenant.name sync (branding.name gelirse)
    const nextName =
      dto.branding?.name !== undefined ? dto.branding.name : t.name ?? null;

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(nextName !== undefined ? { name: nextName } : {}),
        metadata: nextMetadata as any,
      },
    });

    return updated;
  }
}
