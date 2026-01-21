// src/modules/catalog/common/policies/product-media.policy.ts

import type { PrismaClient } from "@prisma/client";
import { limitExceeded } from "@/infrastructure/errors/domain.errors";
import { resolveTenantLimits } from "./product-limit.policy";

function asInt(v: any, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

const DEFAULT_MEDIA_LIMIT = 1;

/**
 * “Her ürün için 1 görsel” enforcement
 */
export async function assertMediaLimitOrThrow(input: {
  prisma: PrismaClient;
  tenantId: string;
  productId: string;
}) {
  const { prisma, tenantId, productId } = input;

  const limits = await resolveTenantLimits(prisma, tenantId);
  const limit = asInt(limits.mediaPerProduct, DEFAULT_MEDIA_LIMIT);

  const current = await prisma.productMedia.count({
    where: { tenantId, productId },
  });

  if (current >= limit) {
    throw limitExceeded({
      resource: "product_media",
      limit,
      current,
      tenantId,
      productId,
    });
  }
}
