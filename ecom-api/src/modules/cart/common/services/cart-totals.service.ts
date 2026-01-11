// src/modules/cart/common/services/cart-totals.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type CartComputedTotals = {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  currencyCode: string;
};

@Injectable()
export class CartTotalsService {
  /**
   * Kurallar (deterministik):
   * - subtotal = Σ(qty * unitPriceSnapshot)
   * - discountTotal = Σ(cartDiscountApplications.discountTotal) WHERE deletedAt IS NULL
   * - shippingTotal = aktif (deletedAt=null) ilk shipping method amount
   * - taxTotal = 0 (ileride TaxService)
   * - grandTotal = subtotal - discountTotal + shippingTotal + taxTotal
   *
   * Not: Cart modelinde subtotal/grandTotal kolonları yok → persist etmiyoruz.
   */
  async recompute(
    tx: Tx,
    args: { tenantId: string; cartId: string }
  ): Promise<CartComputedTotals> {
    const cart = await tx.cart.findFirst({
      where: { tenantId: args.tenantId, id: args.cartId, deletedAt: null },
      include: {
        lineItems: true,
        shippingMethods: true,
        cartDiscountApplications: {
          where: { deletedAt: null },
          select: { discountTotal: true, currencyCodeSnapshot: true },
        },
      },
    });

    if (!cart) throw new NotFoundException("Cart not found");

    const currencyCode = cart.currencyCode ?? "EUR";

    const subtotal = (cart.lineItems ?? []).reduce((sum, li) => {
      const unit = li.unitPriceSnapshot ?? 0;
      return sum + li.quantity * unit;
    }, 0);

    // ✅ %100 source-of-truth: CartDiscountApplication
    const discountTotal = (cart.cartDiscountApplications ?? []).reduce(
      (sum, a) => {
        return sum + (a.discountTotal ?? 0);
      },
      0
    );

    const shippingRow =
      (cart.shippingMethods ?? []).find((s) => (s as any).deletedAt == null) ??
      null;
    const shippingTotal = shippingRow?.amount ?? 0;

    const taxTotal = 0;

    const grandTotal = subtotal - discountTotal + shippingTotal + taxTotal;

    return {
      subtotal,
      discountTotal,
      shippingTotal,
      taxTotal,
      grandTotal,
      currencyCode,
    };
  }

  /**
   * Geriye dönük uyumluluk:
   * Eski kodlar recomputeAndPersist çağırıyorsa patlamasın.
   * Persist yok; sadece recompute çağırır.
   */
  async recomputeAndPersist(
    tx: Tx,
    args: { tenantId: string; cartId: string }
  ) {
    return this.recompute(tx, args);
  }
}
