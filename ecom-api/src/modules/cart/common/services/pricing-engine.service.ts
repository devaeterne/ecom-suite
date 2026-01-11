// src/modules/cart/common/services/pricing-engine.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type ResolvedUnitPrice = {
  amount: number; // minor units
  compareAt?: number | null;
};

@Injectable()
export class PricingEngineService {
  /**
   * Şimdilik baseline:
   * - Variant'ın satış fiyatı snapshot'lanır.
   * - Tier pricing varsa ileride burada devreye alırız (quantity paramı hazır).
   */
  async resolveUnitPrice(
    tx: Tx,
    args: {
      tenantId: string;
      cartId: string; // şimdilik kullanılmıyor ama signature stabil kalsın
      variantId: string;
      currencyCode: string;
      quantity: number;
    }
  ): Promise<ResolvedUnitPrice> {
    const { tenantId, variantId } = args;

    // ❗️deletedAt bu modelde yok → where'den kaldırıyoruz
    const v = await tx.catalogProductVariant.findFirst({
      where: { tenantId, id: variantId },
      select: {
        id: true,
        // Bu alanlar sende farklıysa compile patlar → o zaman schema'dan alan adını söyle
        price: true,
        compareAtPrice: true,
      } as any,
    });

    if (!v) throw new NotFoundException("variant not found");

    const amount = Number((v as any).price ?? 0);
    const compareAt = (v as any).compareAtPrice ?? null;

    return { amount, compareAt };
  }
}
