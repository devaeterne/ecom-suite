import { ConflictException } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";

type JsonObj = Record<string, any>;
function asObj(v: any): JsonObj {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as JsonObj) : {};
}
function asInt(v: any, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

/**
 * PR-4 defaults (plan.limits override eder)
 * Not: Buradaki resolve, TenantService'deki ile aynı mantık.
 */
const DEFAULT_LIMITS = {
  productsPerStatus: 10,
  mediaPerProduct: 1,
  users: 1,
  storageMb: 500,
};

function mergeLimits(planLimits: any) {
  return { ...DEFAULT_LIMITS, ...asObj(planLimits) };
}

function rankStatus(s: any) {
  const x = String(s || "").toUpperCase();
  if (x === "ACTIVE") return 100;
  if (x === "TRIALING") return 90;
  if (x === "PAST_DUE") return 70;
  if (x === "SUSPENDED") return 50;
  if (x === "CANCELED") return 30;
  if (x === "EXPIRED") return 20;
  return 0;
}

export async function resolveTenantLimits(
  prisma: PrismaClient,
  tenantId: string,
) {
  // plan + subscription resolve (ACTIVE/TRIALING öncelikli)
  const subs = await prisma.tenantSubscription.findMany({
    where: { tenantId, deletedAt: null },
    include: { plan: true },
    orderBy: [{ createdAt: "desc" }],
    take: 20,
  });

  const best = subs.slice().sort((a: any, b: any) => {
    const ra = rankStatus(a.status);
    const rb = rankStatus(b.status);
    if (ra !== rb) return rb - ra;

    const ea = a.currentPeriodEnd ? new Date(a.currentPeriodEnd).getTime() : 0;
    const eb = b.currentPeriodEnd ? new Date(b.currentPeriodEnd).getTime() : 0;
    if (ea !== eb) return eb - ea;

    const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return cb - ca;
  })[0];

  const planLimits = best?.plan?.limits ?? null;
  return mergeLimits(planLimits);
}

export async function assertProductLimitOrThrow(input: {
  prisma: PrismaClient;
  tenantId: string;
  status: "draft" | "published" | "archived";
  excludeProductId?: string; // update sırasında mevcut ürünü hariç tutmak için
}) {
  const { prisma, tenantId, status, excludeProductId } = input;

  const limits = await resolveTenantLimits(prisma, tenantId);
  const limit = asInt(
    limits.productsPerStatus,
    DEFAULT_LIMITS.productsPerStatus,
  );

  const where: any = { tenantId, deletedAt: null, status };
  if (excludeProductId) where.id = { not: excludeProductId };

  const current = await prisma.catalogProduct.count({ where });

  if (current >= limit) {
    throw new ConflictException({
      code: "product_limit_exceeded",
      message: `Product limit reached for status '${status}'`,
      details: { limit, current, status },
    });
  }
}
