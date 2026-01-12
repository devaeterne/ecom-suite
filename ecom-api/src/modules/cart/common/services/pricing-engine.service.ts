// src/modules/cart/common/services/pricing-engine.service.ts
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type ResolvedUnitPrice = {
  amount: number;
  compareAt?: number | null;
};

export type ResolveUnitPriceInput = {
  tenantId: string;
  cartId: string;
  variantId: string;
  currencyCode: string;
  quantity: number;
  priceListId?: string | null;
};

@Injectable()
export class PricingEngineService {
  async resolveUnitPrice(
    tx: Tx,
    args: ResolveUnitPriceInput
  ): Promise<ResolvedUnitPrice | null> {
    const { tenantId, variantId, currencyCode, quantity } = args;
    const priceListId = args.priceListId ?? null;

    const findPrice = async (scopePriceListId: string | null) => {
      return tx.catalogMoneyAmount.findFirst({
        where: {
          tenantId,
          currencyCode,
          isActive: true,
          deletedAt: null,
          priceSet: {
            tenantId,
            variantId,
            isActive: true,
            deletedAt: null,
            // ✅ kritik ayrım
            priceListId: scopePriceListId,
            // İstersen scoped list aktif mi/date window vs burada da enforce edersin
            // ...(scopePriceListId ? { priceList: { isActive: true, deletedAt: null } } : {}),
          },
          AND: [
            { OR: [{ minQuantity: null }, { minQuantity: { lte: quantity } }] },
            { OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }] },
          ],
        },
        orderBy: [{ minQuantity: "desc" }, { createdAt: "desc" }],
        select: { amount: true, compareAt: true },
      });
    };

    // 1) scoped varsa önce scoped dene
    if (priceListId) {
      const scoped = await findPrice(priceListId);
      if (scoped)
        return { amount: scoped.amount, compareAt: scoped.compareAt ?? null };
      // 2) yoksa base fallback
      const base = await findPrice(null);
      if (!base) return null;
      return { amount: base.amount, compareAt: base.compareAt ?? null };
    }

    // 3) scoped yoksa sadece base
    const base = await findPrice(null);
    if (!base) return null;
    return { amount: base.amount, compareAt: base.compareAt ?? null };
  }
}
