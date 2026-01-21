import { ConflictException } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import { resolveTenantLimits } from "./product-limit.policy";

function asInt(v: any, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

const DEFAULT_MEDIA_LIMIT = 1;

/**
 * PR-4: “Her ürün için 1 görsel” enforcement
 * Not:
 * - Eğer productMedia tablosunda deletedAt varsa onu da filtreleyebilirsin.
 * - Şimdilik mevcut kodunda deleteMany ile hard delete var gibi → deletedAt yok varsayıyorum.
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
    throw new ConflictException({
      code: "media_limit_exceeded",
      message: "Media limit reached for this product",
      details: { limit, current, productId },
    });
  }
}
