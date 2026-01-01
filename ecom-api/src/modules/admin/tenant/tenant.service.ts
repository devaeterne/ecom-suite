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
    const prevBranding = asObj(metadata.branding);
    const prevI18n = asObj(metadata.i18n);
    const prevDomains = asObj(metadata.domains);

    // Flat alanlar -> nested normalize (geriye dönük uyum)
    const brandingPatch = {
      ...(dto.branding ?? {}),
      ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
    };

    const i18nPatch = {
      ...(dto.i18n ?? {}),
      ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
      ...(dto.currencyCode !== undefined
        ? { currencyCode: dto.currencyCode }
        : {}),
    };

    const domainsPatch = {
      ...(dto.domains ?? {}),
    };

    const nextMetadata: JsonObj = {
      ...metadata,
      branding: {
        ...prevBranding,
        ...asObj(brandingPatch),
      },
      i18n: {
        ...prevI18n,
        ...asObj(i18nPatch),
      },
      domains: {
        ...prevDomains,
        ...asObj(domainsPatch),
      },
    };

    // Canonical tenant.name güncellemesi:
    // - dto.name varsa o
    // - yoksa branding.name varsa o
    // - yoksa mevcut t.name
    const nextName = dto.name ?? dto.branding?.name ?? t.name ?? null;

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
