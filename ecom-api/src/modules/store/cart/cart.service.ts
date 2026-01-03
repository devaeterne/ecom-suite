import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  PrismaClient,
  Prisma,
  CartStatus,
  InventoryReservationStatus,
  CartAdjustmentType,
} from "@prisma/client";

import {
  CART_TTL_MS,
  RESERVATION_TTL_MS,
} from "@modules/store/cart/cart.contants";
import { resolveDefaultInventoryLocationId } from "@modules/store/cart/cart.locations";

function addMs(d: Date, ms: number) {
  return new Date(d.getTime() + ms);
}

@Injectable()
export class StoreCartService {
  constructor(private readonly prisma: PrismaService) {}

  async createCart(tenantId: string, input?: { email?: string }) {
    const now = new Date();
    const expiresAt = addMs(now, CART_TTL_MS);

    const cart = await this.prisma.cart.create({
      data: {
        tenantId,
        status: CartStatus.ACTIVE,
        currencyCode: "EUR",
        email: input?.email ?? null,
        expiresAt,
      },
      include: {
        lineItems: true,
        adjustments: true,
        shippingMethods: true,
      },
    });

    return cart;
  }

  async getOrCreateCurrentCart(tenantId: string, cartId: string | null) {
    if (!cartId) {
      const cart = await this.createCart(tenantId);
      return { cart, created: true };
    }

    const cart = await this.prisma.cart.findFirst({
      where: { tenantId, id: cartId, deletedAt: null },
      include: {
        lineItems: true,
        adjustments: true,
        shippingMethods: true,
      },
    });

    if (!cart) {
      const fresh = await this.createCart(tenantId);
      return { cart: fresh, created: true };
    }

    // expired ise ABANDONED yapıp yenisini açalım (storefront için temiz UX)
    if (cart.expiresAt && cart.expiresAt.getTime() < Date.now()) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.ABANDONED },
      });
      const fresh = await this.createCart(tenantId);
      return { cart: fresh, created: true };
    }

    // aktif cart refresh
    const refreshed = await this.prisma.cart.update({
      where: { id: cart.id },
      data: { expiresAt: addMs(new Date(), CART_TTL_MS) },
      include: {
        lineItems: true,
        adjustments: true,
        shippingMethods: true,
      },
    });

    return { cart: refreshed, created: false };
  }

  /**
   * InventoryLevel row lock + availability check.
   * Postgres'te FOR UPDATE ile yarış koşullarını minimize ediyoruz.
   */
  private async lockInventoryLevel(
    tx: Prisma.TransactionClient,
    tenantId: string,
    locationId: string,
    variantId: string
  ) {
    // inventory_level: @@map("inventory_level")
    const rows = await tx.$queryRaw<
      Array<{ id: string; stockedquantity: number; reservedquantity: number }>
    >`
      SELECT id, "stockedQuantity" as stockedQuantity, "reservedQuantity" as reservedQuantity
      FROM inventory_level
      WHERE "tenantId" = ${tenantId}::uuid
        AND "locationId" = ${locationId}::uuid
        AND "variantId" = ${variantId}::uuid
        AND "deletedAt" IS NULL
      FOR UPDATE
    `;

    if (rows.length > 0) {
      // Prisma raw dönüşte key casing driver'a göre değişebiliyor; normalize edelim
      const anyRow: any = rows[0];
      return {
        id: anyRow.id,
        stockedQuantity: anyRow.stockedQuantity ?? anyRow.stockedquantity,
        reservedQuantity: anyRow.reservedQuantity ?? anyRow.reservedquantity,
      };
    }

    // yoksa create et (stock 0)
    await tx.inventoryLevel.create({
      data: {
        tenantId,
        locationId,
        variantId,
        stockedQuantity: 0,
        reservedQuantity: 0,
      },
    });

    // tekrar lock
    const again = await tx.$queryRaw<
      Array<{ id: string; stockedquantity: number; reservedquantity: number }>
    >`
      SELECT id, "stockedQuantity" as stockedQuantity, "reservedQuantity" as reservedQuantity
      FROM inventory_level
      WHERE "tenantId" = ${tenantId}::uuid
        AND "locationId" = ${locationId}::uuid
        AND "variantId" = ${variantId}::uuid
        AND "deletedAt" IS NULL
      FOR UPDATE
    `;
    const anyRow: any = again[0];
    return {
      id: anyRow.id,
      stockedQuantity: anyRow.stockedQuantity ?? anyRow.stockedquantity,
      reservedQuantity: anyRow.reservedQuantity ?? anyRow.reservedquantity,
    };
  }

  private reservationExpiresAt() {
    return addMs(new Date(), RESERVATION_TTL_MS);
  }

  async addLineItem(
    tenantId: string,
    cartId: string,
    input: { variantId: string; quantity: number }
  ) {
    if (input.quantity < 1)
      throw new BadRequestException("quantity must be >= 1");

    const locationId = await resolveDefaultInventoryLocationId(
      this.prisma,
      tenantId
    );

    return this.prisma.$transaction(async (tx) => {
      // cart check
      const cart = await tx.cart.findFirst({
        where: {
          tenantId,
          id: cartId,
          deletedAt: null,
          status: CartStatus.ACTIVE,
        },
        select: { id: true, currencyCode: true },
      });
      if (!cart) throw new NotFoundException("Cart not found");

      // inventory lock
      const level = await this.lockInventoryLevel(
        tx,
        tenantId,
        locationId,
        input.variantId
      );
      const available = level.stockedQuantity - level.reservedQuantity;
      if (input.quantity > available) {
        throw new ConflictException({
          code: "INSUFFICIENT_STOCK",
          message: "Insufficient stock for reservation",
          available,
          requested: input.quantity,
        });
      }

      // line item upsert (unique: cartId+variantId)
      const lineItem = await tx.cartLineItem.upsert({
        where: {
          cartId_variantId: { cartId: cart.id, variantId: input.variantId },
        },
        create: {
          tenantId,
          cartId: cart.id,
          variantId: input.variantId,
          quantity: input.quantity,
          // snapshot alanları zorunlu/opsiyonel durumuna göre:
          unitPriceSnapshot: 0, // pricing modülü gelince burayı gerçek snapshot yaparız
          compareAtSnapshot: null,
          skuSnapshot: null,
          titleSnapshot: null,
          metadata: {},
        },
        update: {
          quantity: { increment: input.quantity }, // merge
        },
        select: { id: true, quantity: true },
      });

      // ACTIVE reservation (tek kayıt) bul
      const existing = await tx.inventoryReservation.findFirst({
        where: {
          tenantId,
          cartId: cart.id,
          cartLineItemId: lineItem.id,
          status: InventoryReservationStatus.ACTIVE,
          deletedAt: null,
        },
        select: { id: true, quantity: true },
      });

      const expiresAt = this.reservationExpiresAt();

      if (!existing) {
        await tx.inventoryReservation.create({
          data: {
            tenantId,
            locationId,
            variantId: input.variantId,
            cartId: cart.id,
            cartLineItemId: lineItem.id,
            quantity: input.quantity,
            status: InventoryReservationStatus.ACTIVE,
            expiresAt,
            metadata: {},
          },
        });
        await tx.inventoryLevel.update({
          where: { id: level.id },
          data: { reservedQuantity: { increment: input.quantity } },
        });
      } else {
        // line item upsert ile quantity zaten arttı; reservation'ı da aynı miktar artır
        await tx.inventoryReservation.update({
          where: { id: existing.id },
          data: {
            quantity: { increment: input.quantity },
            expiresAt,
          },
        });
        await tx.inventoryLevel.update({
          where: { id: level.id },
          data: { reservedQuantity: { increment: input.quantity } },
        });
      }

      // cart TTL refresh
      await tx.cart.update({
        where: { id: cart.id },
        data: { expiresAt: addMs(new Date(), CART_TTL_MS) },
      });

      // response cart
      const full = await tx.cart.findFirst({
        where: { tenantId, id: cart.id, deletedAt: null },
        include: { lineItems: true, adjustments: true, shippingMethods: true },
      });
      return full!;
    });
  }

  async updateLineItem(
    tenantId: string,
    cartId: string,
    lineItemId: string,
    patch: { quantity?: number }
  ) {
    if (patch.quantity !== undefined && patch.quantity < 1)
      throw new BadRequestException("quantity must be >= 1");

    const locationId = await resolveDefaultInventoryLocationId(
      this.prisma,
      tenantId
    );

    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: {
          tenantId,
          id: cartId,
          deletedAt: null,
          status: CartStatus.ACTIVE,
        },
        select: { id: true },
      });
      if (!cart) throw new NotFoundException("Cart not found");

      const li = await tx.cartLineItem.findFirst({
        where: { tenantId, id: lineItemId, cartId: cart.id },
        select: { id: true, variantId: true, quantity: true },
      });
      if (!li) throw new NotFoundException("Line item not found");

      if (patch.quantity === undefined) {
        const full = await tx.cart.findFirst({
          where: { tenantId, id: cart.id, deletedAt: null },
          include: {
            lineItems: true,
            adjustments: true,
            shippingMethods: true,
          },
        });
        return full!;
      }

      const newQty = patch.quantity;
      const delta = newQty - li.quantity;

      // reservation
      const resv = await tx.inventoryReservation.findFirst({
        where: {
          tenantId,
          cartId: cart.id,
          cartLineItemId: li.id,
          status: InventoryReservationStatus.ACTIVE,
          deletedAt: null,
        },
        select: { id: true, quantity: true },
      });
      if (!resv) throw new Error("ACTIVE reservation not found for line item");

      // inventory lock
      const level = await this.lockInventoryLevel(
        tx,
        tenantId,
        locationId,
        li.variantId
      );
      if (delta > 0) {
        const available = level.stockedQuantity - level.reservedQuantity;
        if (delta > available) {
          throw new ConflictException({
            code: "INSUFFICIENT_STOCK",
            message: "Insufficient stock for reservation increase",
            available,
            requestedIncrease: delta,
          });
        }
      }

      // apply updates
      await tx.cartLineItem.update({
        where: { id: li.id },
        data: { quantity: newQty },
      });

      await tx.inventoryReservation.update({
        where: { id: resv.id },
        data: { quantity: newQty, expiresAt: this.reservationExpiresAt() },
      });

      if (delta !== 0) {
        // delta negatif ise decrement (reservedQuantity asla negatif olmamalı)
        await tx.inventoryLevel.update({
          where: { id: level.id },
          data: {
            reservedQuantity:
              delta > 0 ? { increment: delta } : { decrement: Math.abs(delta) },
          },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { expiresAt: addMs(new Date(), CART_TTL_MS) },
      });

      const full = await tx.cart.findFirst({
        where: { tenantId, id: cart.id, deletedAt: null },
        include: { lineItems: true, adjustments: true, shippingMethods: true },
      });
      return full!;
    });
  }

  async deleteLineItem(tenantId: string, cartId: string, lineItemId: string) {
    const locationId = await resolveDefaultInventoryLocationId(
      this.prisma,
      tenantId
    );

    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: {
          tenantId,
          id: cartId,
          deletedAt: null,
          status: CartStatus.ACTIVE,
        },
        select: { id: true },
      });
      if (!cart) throw new NotFoundException("Cart not found");

      const li = await tx.cartLineItem.findFirst({
        where: { tenantId, id: lineItemId, cartId: cart.id },
        select: { id: true, variantId: true, quantity: true },
      });
      if (!li) throw new NotFoundException("Line item not found");

      const resv = await tx.inventoryReservation.findFirst({
        where: {
          tenantId,
          cartId: cart.id,
          cartLineItemId: li.id,
          status: InventoryReservationStatus.ACTIVE,
          deletedAt: null,
        },
        select: { id: true, quantity: true },
      });

      const level = await this.lockInventoryLevel(
        tx,
        tenantId,
        locationId,
        li.variantId
      );

      if (resv) {
        await tx.inventoryReservation.update({
          where: { id: resv.id },
          data: { status: InventoryReservationStatus.CANCELED },
        });

        await tx.inventoryLevel.update({
          where: { id: level.id },
          data: { reservedQuantity: { decrement: resv.quantity } },
        });
      }

      await tx.cartLineItem.delete({ where: { id: li.id } });

      await tx.cart.update({
        where: { id: cart.id },
        data: { expiresAt: addMs(new Date(), CART_TTL_MS) },
      });

      const full = await tx.cart.findFirst({
        where: { tenantId, id: cart.id, deletedAt: null },
        include: { lineItems: true, adjustments: true, shippingMethods: true },
      });
      return full!;
    });
  }

  /**
   * Apply coupon - şimdilik stub:
   * Discount modülünü (Discount + code lookup) eklediğinde bunu CartDiscountApplication'a çeviririz.
   */
  async applyCoupon(tenantId: string, cartId: string, code: string) {
    if (!code?.trim()) throw new BadRequestException("code is required");

    const cart = await this.prisma.cart.findFirst({
      where: {
        tenantId,
        id: cartId,
        deletedAt: null,
        status: CartStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (!cart) throw new NotFoundException("Cart not found");

    // aynı kodu tekrar uygularken idempotent olsun diye upsert benzeri davranalım:
    // CartAdjustment için unique yok, o yüzden önce bulup güncelleyelim.
    const existing = await this.prisma.cartAdjustment.findFirst({
      where: {
        tenantId,
        cartId: cart.id,
        type: CartAdjustmentType.DISCOUNT,
        code,
      },
      select: { id: true },
    });

    if (!existing) {
      await this.prisma.cartAdjustment.create({
        data: {
          tenantId,
          cartId: cart.id,
          type: CartAdjustmentType.DISCOUNT,
          code,
          description: "Coupon applied (stub)",
          amount: 0,
          metadata: {},
        },
      });
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { expiresAt: addMs(new Date(), CART_TTL_MS) },
    });

    return this.prisma.cart.findFirst({
      where: { tenantId, id: cart.id, deletedAt: null },
      include: { lineItems: true, adjustments: true, shippingMethods: true },
    });
  }

  async setShippingMethod(
    tenantId: string,
    cartId: string,
    shippingOptionId: string
  ) {
    if (!shippingOptionId?.trim())
      throw new BadRequestException("shippingOptionId is required");

    const cart = await this.prisma.cart.findFirst({
      where: {
        tenantId,
        id: cartId,
        deletedAt: null,
        status: CartStatus.ACTIVE,
      },
      select: { id: true, currencyCode: true },
    });
    if (!cart) throw new NotFoundException("Cart not found");

    const option = await this.prisma.shippingOption.findFirst({
      where: {
        tenantId,
        id: shippingOptionId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true, amount: true, currencyCode: true },
    });
    if (!option) throw new NotFoundException("ShippingOption not found");

    const amount = option.amount ?? 0;
    const currencyCode = option.currencyCode ?? cart.currencyCode;

    const existing = await this.prisma.cartShippingMethod.findFirst({
      where: {
        tenantId,
        cartId: cart.id,
        shippingOptionId: option.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      await this.prisma.cartShippingMethod.create({
        data: {
          tenantId,
          cartId: cart.id,
          shippingOptionId: option.id,
          amount,
          currencyCode,
          metadata: {},
        },
      });
    } else {
      await this.prisma.cartShippingMethod.update({
        where: { id: existing.id },
        data: {
          amount,
          currencyCode,
          metadata: {},
          deletedAt: null,
        },
      });
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { expiresAt: addMs(new Date(), CART_TTL_MS) },
    });

    return this.prisma.cart.findFirst({
      where: { tenantId, id: cart.id, deletedAt: null },
      include: { lineItems: true, adjustments: true, shippingMethods: true },
    });
  }
}
