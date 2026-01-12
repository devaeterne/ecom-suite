// src/modules/pricing/store/services/pricing.store.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

type Tx = Prisma.TransactionClient;

export type ResolvedUnitPrice = {
  amount: number;
  compareAt: number | null;
};

@Injectable()
export class PricingStoreService {
  constructor(private readonly prisma: PrismaService) {}

  async attachPriceListToCart(
    tenantId: string,
    cartId: string,
    priceListId: string | null
  ) {
    const cart = await this.prisma.cart.findFirst({
      where: { id: cartId, tenantId, deletedAt: null },
      select: { id: true, metadata: true },
    });
    if (!cart) throw new NotFoundException("Cart not found");

    const meta =
      cart.metadata && typeof cart.metadata === "object"
        ? (cart.metadata as any)
        : {};

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        metadata: {
          ...meta,
          priceListId: priceListId ?? null, // ✅ tek kaynak, net null
        },
      },
    });
  }

  async resolveUnitPrice(
    tx: Tx,
    params: {
      tenantId: string;
      cartId: string; // signature stabil
      variantId: string;
      currencyCode: string;
      quantity: number;
      priceListId?: string | null;
    }
  ): Promise<ResolvedUnitPrice | null> {
    const { tenantId, variantId, currencyCode, quantity } = params;
    const pl = params.priceListId ?? null;

    const pick = async (plId: string | null) => {
      const money = await tx.catalogMoneyAmount.findFirst({
        where: {
          tenantId,
          currencyCode,
          isActive: true,
          deletedAt: null,

          // ✅ tier window (NULL-safe)
          AND: [
            { OR: [{ minQuantity: null }, { minQuantity: { lte: quantity } }] },
            { OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }] },
          ],

          // ✅ priceSet scope (relation filter)
          priceSet: {
            tenantId,
            variantId,
            deletedAt: null,
            isActive: true,
            priceListId: plId, // null => base
          },
        },
        orderBy: [{ minQuantity: "desc" }, { createdAt: "desc" }],
        select: { amount: true, compareAt: true },
      });

      if (!money) return null;
      return { amount: money.amount, compareAt: money.compareAt ?? null };
    };

    // 1) scoped (priceList)
    if (pl) {
      const scoped = await pick(pl);
      if (scoped) return scoped;
    }

    // 2) base fallback
    return await pick(null);
  }
}
