// src/infrastructure/entitlements/tenant-entitlements.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

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
  return { ...DEFAULT_LIMITS, ...asObj(planLimits) };
}

@Injectable()
export class TenantEntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  private rankStatus(s: string) {
    const x = String(s || "").toUpperCase();
    if (x === "ACTIVE") return 100;
    if (x === "TRIALING") return 90;
    if (x === "PAST_DUE") return 70;
    if (x === "SUSPENDED") return 50;
    if (x === "CANCELED") return 30;
    if (x === "EXPIRED") return 20;
    return 0;
  }

  async resolve(tenantId: string) {
    // subscription + plan
    const subs = await this.prisma.tenantSubscription.findMany({
      where: { tenantId, deletedAt: null },
      include: { plan: true },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
    });

    const best = subs.slice().sort((a: any, b: any) => {
      const ra = this.rankStatus(a.status);
      const rb = this.rankStatus(b.status);
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

    // usage (products)
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

    return { plan, entitlements, usage };
  }
}
