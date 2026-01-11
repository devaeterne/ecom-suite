// src/modules/cart/common/services/cart-discounts.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { DiscountMethod } from "@prisma/client";

type Tx = Prisma.TransactionClient;

@Injectable()
export class CartDiscountsService {
  /**
   * Tek aktif coupon kuralı (deterministik):
   * - Önce cart üzerindeki tüm aktif CartDiscountApplication kayıtlarını soft-delete et.
   * - Sonra ilgili discount için upsert ile aktive et (deletedAt=null).
   * - discountTotal hesapla (subtotal bazlı) ve app.discountTotal'a yaz.
   *
   * Not: Totals %100 CartDiscountApplication üzerinden gidiyor (legacy adjustments yok).
   */
  async applyCoupon(
    tx: Tx,
    args: { tenantId: string; cartId: string; code: string }
  ) {
    const tenantId = args.tenantId;
    const cartId = args.cartId;
    const code = (args.code ?? "").trim();
    if (!code) throw new BadRequestException("code is required");

    const cart = await tx.cart.findFirst({
      where: { tenantId, id: cartId, deletedAt: null },
      include: { lineItems: true },
    });
    if (!cart) throw new NotFoundException("Cart not found");

    const discount = await tx.discount.findFirst({
      where: { tenantId, deletedAt: null, code },
      select: {
        id: true,
        method: true,
        valueBp: true,
        value: true,
        currencyCode: true,
      },
    });
    if (!discount) throw new NotFoundException("Discount not found");

    const subtotal = (cart.lineItems ?? []).reduce((sum, li) => {
      const unit = li.unitPriceSnapshot ?? 0;
      return sum + li.quantity * unit;
    }, 0);

    const method = discount.method as DiscountMethod;
    const valueBp = Number(discount.valueBp ?? 0);
    const value = Number(discount.value ?? 0);

    let discountAmount = 0;

    if (method === DiscountMethod.PERCENT) {
      discountAmount = Math.floor((subtotal * valueBp) / 10000);
    } else if (method === DiscountMethod.FIXED) {
      discountAmount = value;
    }

    // Cap: subtotal’dan fazla olmasın
    discountAmount = Math.max(0, Math.min(subtotal, discountAmount));

    // ✅ 0) tek aktif coupon: önce hepsini soft-delete
    const now = new Date();
    await tx.cartDiscountApplication.updateMany({
      where: { tenantId, cartId, deletedAt: null },
      data: { deletedAt: now },
    });

    // ✅ 1) upsert (unique: @@unique([tenantId, cartId, discountId]))
    const app = await tx.cartDiscountApplication.upsert({
      where: {
        tenantId_cartId_discountId: {
          tenantId,
          cartId,
          discountId: discount.id,
        },
      },
      update: {
        deletedAt: null,
        codeSnapshot: code,
        methodSnapshot: method,
        valueBpSnapshot: method === DiscountMethod.PERCENT ? valueBp : null,
        valueSnapshot: method === DiscountMethod.FIXED ? value : null,
        currencyCodeSnapshot: discount.currencyCode ?? cart.currencyCode,
        discountTotal: discountAmount,
      },
      create: {
        tenantId,
        cartId,
        discountId: discount.id,
        codeSnapshot: code,
        methodSnapshot: method,
        valueBpSnapshot: method === DiscountMethod.PERCENT ? valueBp : null,
        valueSnapshot: method === DiscountMethod.FIXED ? value : null,
        currencyCodeSnapshot: discount.currencyCode ?? cart.currencyCode,
        discountTotal: discountAmount,
        metadata: {},
      },
      select: { id: true, discountTotal: true },
    });

    return { applicationId: app.id, discountTotal: app.discountTotal };
  }

  async removeCoupon(tx: Tx, args: { tenantId: string; cartId: string }) {
    const { tenantId, cartId } = args;

    const cart = await tx.cart.findFirst({
      where: { tenantId, id: cartId, deletedAt: null },
      select: { id: true },
    });
    if (!cart) throw new NotFoundException("Cart not found");

    await tx.cartDiscountApplication.updateMany({
      where: { tenantId, cartId: cart.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return { ok: true };
  }
}
