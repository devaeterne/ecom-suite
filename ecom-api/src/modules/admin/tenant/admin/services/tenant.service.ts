// src/modules/admin/tenant/admin/services/tenant.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TenantMePatchDto } from "@/modules/admin/tenant/common/dto/tenant-me.patch.dto";

type JsonObj = Record<string, any>;

function asObj(v: any): JsonObj {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as JsonObj) : {};
}

function asInt(v: any, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

const DEFAULT_LIMITS = {
  productsPerStatus: 10,
  mediaPerProduct: 1,
  users: 1,
  storageMb: 500,
};

function mergeLimits(planLimits: any): Record<string, any> {
  const pl = asObj(planLimits);
  return { ...DEFAULT_LIMITS, ...pl };
}

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // SUPER ADMIN
  // ---------------------------------------------------------------------------

  /**
   * Super admin için tüm tenant listesi
   * Minimal shape (UI switcher için yeterli)
   */

  // ---------------------------------------------------------------------------
  // TENANT ME
  // ---------------------------------------------------------------------------

  async getMe(tenantId: string) {
    const t = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
    });

    if (!t) throw new NotFoundException("Tenant not found");
    return t;
  }

  async getMeBundle(tenantId: string) {
    const tenant = await this.getMe(tenantId);

    const subs = await this.prisma.tenantSubscription.findMany({
      where: { tenantId, deletedAt: null },
      include: { plan: true },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
    });

    const rankStatus = (s: string) => {
      const x = String(s || "").toUpperCase();
      if (x === "ACTIVE") return 100;
      if (x === "TRIALING") return 90;
      if (x === "PAST_DUE") return 70;
      if (x === "SUSPENDED") return 50;
      if (x === "CANCELED") return 30;
      if (x === "EXPIRED") return 20;
      return 0;
    };

    const best = subs.slice().sort((a: any, b: any) => {
      const ra = rankStatus(a.status);
      const rb = rankStatus(b.status);
      if (ra !== rb) return rb - ra;

      const ea = a.currentPeriodEnd
        ? new Date(a.currentPeriodEnd).getTime()
        : 0;
      const eb = b.currentPeriodEnd
        ? new Date(b.currentPeriodEnd).getTime()
        : 0;
      if (ea !== eb) return eb - ea;

      const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return cb - ca;
    })[0];

    const plan = best?.plan
      ? {
          id: best.plan.id,
          code: best.plan.code,
          name: best.plan.name,
          billingInterval: best.plan.billingInterval,
          isActive: best.plan.isActive,
          priceAmount: best.plan.priceAmount,
          currencyCode: best.plan.currencyCode,
          limits: asObj(best.plan.limits),
          subscription: {
            id: best.id,
            status: best.status,
            currentPeriodStart: best.currentPeriodStart,
            currentPeriodEnd: best.currentPeriodEnd,
            trialEndsAt: best.trialEndsAt,
            cancelAtPeriodEnd: best.cancelAtPeriodEnd,
            canceledAt: best.canceledAt,
            provider: best.provider,
          },
        }
      : null;

    const limits = mergeLimits(plan?.limits);

    const [draftCount, publishedCount, archivedCount] = await Promise.all([
      this.prisma.catalogProduct.count({
        where: { tenantId, deletedAt: null, status: "draft" as any },
      }),
      this.prisma.catalogProduct.count({
        where: { tenantId, deletedAt: null, status: "published" as any },
      }),
      this.prisma.catalogProduct.count({
        where: { tenantId, deletedAt: null, status: "archived" as any },
      }),
    ]);

    const usage = {
      productsByStatus: {
        draft: draftCount,
        published: publishedCount,
        archived: archivedCount,
      },
      productsTotal: draftCount + publishedCount + archivedCount,
    };

    const entitlements = {
      limits,
      remaining: {
        draft: Math.max(0, asInt(limits.productsPerStatus, 10) - draftCount),
        published: Math.max(
          0,
          asInt(limits.productsPerStatus, 10) - publishedCount,
        ),
        archived: Math.max(
          0,
          asInt(limits.productsPerStatus, 10) - archivedCount,
        ),
      },
    };

    return { tenant, plan, entitlements, usage };
  }

  // ---------------------------------------------------------------------------
  // TENANT PATCH
  // ---------------------------------------------------------------------------

  async patchMe(tenantId: string, dto: TenantMePatchDto) {
    const t = await this.getMe(tenantId);

    const metadata = asObj(t.metadata);
    const prevBranding = asObj(metadata.branding);
    const prevI18n = asObj(metadata.i18n);
    const prevDomains = asObj(metadata.domains);

    const brandingPatch = {
      ...(dto.branding ?? {}),
      ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
    };

    const i18nPatch = {
      ...(dto.i18n ?? {}),
      ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
    };

    const domainsPatch = {
      ...(dto.domains ?? {}),
    };

    const nextMetadata: JsonObj = {
      ...metadata,

      ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      ...(dto.currencyCode !== undefined
        ? { currencyCode: dto.currencyCode }
        : {}),

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

    const nextName = dto.name ?? dto.branding?.name ?? t.name ?? null;

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(nextName !== undefined ? { name: nextName } : {}),
        metadata: nextMetadata as any,
      },
    });
  }

  async listTenantsForSwitcher() {
    const rows = await this.prisma.tenant.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return rows.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      isActive: t.isActive,
    }));
  }

  async resolveTenantTarget(dto: {
    targetTenantId?: string;
    targetTenantCode?: string;
  }) {
    const targetTenantId = dto?.targetTenantId?.trim();
    const targetTenantCode = dto?.targetTenantCode?.trim();

    const t = await this.prisma.tenant.findFirst({
      where: {
        deletedAt: null,
        ...(targetTenantId ? { id: targetTenantId } : {}),
        ...(targetTenantCode ? { code: targetTenantCode } : {}),
      },
      select: { id: true, code: true, name: true },
    });

    if (!t) throw new NotFoundException("Tenant not found");
    return t;
  }
}
