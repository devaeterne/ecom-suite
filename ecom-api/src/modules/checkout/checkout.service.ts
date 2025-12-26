import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  PrismaClient,
  CheckoutStatus,
  CartStatus,
  PaymentStatus,
  OrderStatus,
} from "@prisma/client";

// ✅ Alias yerine relative import (şu an en stabil çözüm)
import { PrismaService } from "@prisma/prisma.service";

type Tx = Prisma.TransactionClient;

type PlaceOrderInput = {
  // şimdilik opsiyonel; ileride Verifone intent / bank ref vs.
  provider?: string; // default: "verifone"
  externalRef?: string | null;
  locationId?: string | null; // ileride pickup location seçimi
};

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * checkoutId ile idempotent Place Order
   * - var olan order varsa geri döner
   * - cart + checkout doğrular
   * - order + line item snapshot yazar
   * - payment row yazar (PENDING)
   * - reservation consume eder (önce lineItemId, yoksa reference fallback)
   * - cart/checkout kapatır
   */
  async placeOrder(checkoutId: string, input?: PlaceOrderInput) {
    const provider = input?.provider ?? "verifone";

    return this.prisma.$transaction(async (tx: Tx) => {
      // 1) Checkout + Cart yükle
      const checkout = await tx.checkout.findUnique({
        where: { id: checkoutId },
        include: {
          cart: {
            include: {
              lineItems: true,
              adjustments: true,
            },
          },
          payments: true,
        },
      });

      if (!checkout) throw new NotFoundException("Checkout not found");

      // Idempotency: checkout'a bağlı order varsa direkt dön
      const existingOrder = await tx.order.findUnique({
        where: { checkoutId: checkout.id },
        include: { lineItems: true, payments: true },
      });
      if (existingOrder) return existingOrder;

      if (!checkout.cartId || !checkout.cart) {
        throw new BadRequestException("Checkout has no cart attached");
      }

      if (checkout.status !== CheckoutStatus.OPEN) {
        throw new BadRequestException(
          `Checkout status must be OPEN to place order. Current: ${checkout.status}`
        );
      }

      const cart = checkout.cart;

      if (cart.status !== CartStatus.ACTIVE) {
        throw new BadRequestException(
          `Cart must be ACTIVE. Current: ${cart.status}`
        );
      }

      if (!cart.lineItems?.length) {
        throw new BadRequestException("Cart has no line items");
      }

      // 2) Totals
      const subtotal = cart.lineItems.reduce(
        (sum, li) => sum + li.unitPriceSnapshot * li.quantity,
        0
      );

      const discountTotal = cart.adjustments
        .filter((a) => a.type === "DISCOUNT")
        .reduce((sum, a) => sum + a.amount, 0);

      const shippingTotal = cart.adjustments
        .filter((a) => a.type === "SHIPPING")
        .reduce((sum, a) => sum + a.amount, 0);

      // şimdilik tax yok
      const taxTotal = 0;

      const grandTotal = Math.max(
        0,
        subtotal - discountTotal + shippingTotal + taxTotal
      );

      // Currency: şimdilik EUR, ileride cart.currencyCode üzerinden de ilerleriz
      const currencyCode = cart.currencyCode ?? "EUR";

      // 3) OrderNo üret (basit, deterministik değil ama kısa vadede yeterli)
      // Kurumsal hali: DB sequence / ayrı tablo / gün bazlı format vs.
      const orderNo = `EC-${new Date().getFullYear()}-${checkout.id
        .slice(0, 8)
        .toUpperCase()}`;

      // 4) Order create
      const order = await tx.order.create({
        data: {
          orderNo,
          checkoutId: checkout.id,
          cartId: cart.id,
          customerId: cart.customerId,
          email: cart.email,

          status: OrderStatus.PENDING,
          currencyCode,
          regionId: cart.regionId,

          subtotal,
          discountTotal,
          shippingTotal,
          taxTotal,
          grandTotal,

          metadata: {
            source: "checkout",
            checkoutId: checkout.id,
            cartId: cart.id,
          } as Prisma.JsonObject,
        },
      });

      // 5) Order line items snapshot
      await tx.orderLineItem.createMany({
        data: cart.lineItems.map((li) => ({
          orderId: order.id,
          variantId: li.variantId,
          quantity: li.quantity,
          unitPrice: li.unitPriceSnapshot,
          compareAt: li.compareAtSnapshot ?? null,
          currencyCode,

          skuSnapshot: li.skuSnapshot ?? null,
          titleSnapshot: li.titleSnapshot ?? null,

          metadata: (li.metadata ?? {}) as Prisma.InputJsonValue,
        })),
      });

      // 6) Payment row (PENDING)
      await tx.orderPayment.create({
        data: {
          orderId: order.id,
          checkoutId: checkout.id,

          provider,
          status: PaymentStatus.PENDING,

          amount: grandTotal,
          totalAmount: grandTotal,
          currencyCode,

          externalRef: input?.externalRef ?? null,

          metadata: {
            note: "Payment intent will be created by provider integration later",
          } as Prisma.JsonObject,
        },
      });

      // 7) Reservation consume (önce lineItemId, yoksa reference fallback)
      const cartLineItemIds = cart.lineItems.map((x) => x.id);

      const consumedByLineItem = await tx.inventoryReservation.updateMany({
        where: {
          status: "active",
          deletedAt: null,
          lineItemId: { in: cartLineItemIds },
        },
        data: {
          status: "consumed",
          referenceType: "order",
          referenceId: order.id,
          expiresAt: null,
          updatedAt: new Date(),
        },
      });

      // fallback: lineItemId yoksa checkout ref ile kapat
      const consumedByRef = await tx.inventoryReservation.updateMany({
        where: {
          status: "active",
          deletedAt: null,
          lineItemId: null,
          referenceType: "checkout",
          referenceId: checkout.id,
        },
        data: {
          status: "consumed",
          referenceType: "order",
          referenceId: order.id,
          expiresAt: null,
          updatedAt: new Date(),
        },
      });

      // 8) Cart + Checkout kapat
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.COMPLETED },
      });

      await tx.checkout.update({
        where: { id: checkout.id },
        data: { status: CheckoutStatus.PAYMENT_PENDING },
      });

      // 9) Return
      return tx.order.findUnique({
        where: { id: order.id },
        include: { lineItems: true, payments: true },
      });
    });
  }
}
