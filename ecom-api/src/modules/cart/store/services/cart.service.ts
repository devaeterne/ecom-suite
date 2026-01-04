import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CartStatus,
  InventoryReservationStatus,
  CartAdjustmentType,
} from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";
import { CartRepo } from "@/modules/cart/common/prisma/cart.repo";
import { prismaCartToDomain } from "@/modules/cart/common/mappers/cart.mappers";
import { Cart } from "@/modules/cart/common/types/cart.types";

import {
  CART_TTL_MS,
  RESERVATION_TTL_MS,
} from "@/modules/cart/common/constants/cart.constants";
import { resolveDefaultInventoryLocationId } from "@/modules/cart/common/policies/cart.locations";

function addMs(d: Date, ms: number) {
  return new Date(d.getTime() + ms);
}

@Injectable()
export class StoreCartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: CartRepo
  ) {}

  private reservationExpiresAt() {
    return addMs(new Date(), RESERVATION_TTL_MS);
  }

  async createCart(
    tenantId: string,
    input?: { email?: string }
  ): Promise<Cart> {
    const now = new Date();
    const expiresAt = addMs(now, CART_TTL_MS);

    const row = await this.prisma.$transaction((tx) =>
      this.repo.createCart(tx, tenantId, {
        email: input?.email ?? null,
        currencyCode: "EUR",
        expiresAt,
      })
    );

    return prismaCartToDomain(row as any);
  }

  async getOrCreateCurrentCart(
    tenantId: string,
    cartId: string | null
  ): Promise<{ cart: Cart; created: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      if (!cartId) {
        const created = await this.repo.createCart(tx, tenantId, {
          email: null,
          currencyCode: "EUR",
          expiresAt: addMs(new Date(), CART_TTL_MS),
        });
        return { cart: prismaCartToDomain(created as any), created: true };
      }

      const found = await this.repo.findCartById(tx, tenantId, cartId);

      if (!found) {
        const created = await this.repo.createCart(tx, tenantId, {
          email: null,
          currencyCode: "EUR",
          expiresAt: addMs(new Date(), CART_TTL_MS),
        });
        return { cart: prismaCartToDomain(created as any), created: true };
      }

      if (found.expiresAt && found.expiresAt.getTime() < Date.now()) {
        await this.repo.markCartAbandoned(tx, found.id);
        const created = await this.repo.createCart(tx, tenantId, {
          email: null,
          currencyCode: "EUR",
          expiresAt: addMs(new Date(), CART_TTL_MS),
        });
        return { cart: prismaCartToDomain(created as any), created: true };
      }

      const refreshed = await this.repo.refreshCartExpiry(
        tx,
        found.id,
        addMs(new Date(), CART_TTL_MS)
      );
      return { cart: prismaCartToDomain(refreshed as any), created: false };
    });
  }

  async addLineItem(
    tenantId: string,
    cartId: string,
    input: { variantId: string; quantity: number }
  ): Promise<Cart> {
    if (input.quantity < 1)
      throw new BadRequestException("quantity must be >= 1");

    const locationId = await resolveDefaultInventoryLocationId(
      this.prisma,
      tenantId
    );

    const row = await this.prisma.$transaction(async (tx) => {
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

      const level = await this.repo.lockInventoryLevel(
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

      const lineItem = await this.repo.upsertLineItem(tx, tenantId, cart.id, {
        variantId: input.variantId,
        quantity: input.quantity,
        unitPriceSnapshot: 0,
        compareAtSnapshot: null,
        skuSnapshot: null,
        titleSnapshot: null,
        metadata: {},
      });

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
        await tx.inventoryReservation.update({
          where: { id: existing.id },
          data: { quantity: { increment: input.quantity }, expiresAt },
        });
        await tx.inventoryLevel.update({
          where: { id: level.id },
          data: { reservedQuantity: { increment: input.quantity } },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { expiresAt: addMs(new Date(), CART_TTL_MS) },
      });

      const full = await this.repo.getFullCart(tx, tenantId, cart.id);
      return full!;
    });

    return prismaCartToDomain(row as any);
  }

  async updateLineItem(
    tenantId: string,
    cartId: string,
    lineItemId: string,
    patch: { quantity?: number }
  ): Promise<Cart> {
    if (patch.quantity !== undefined && patch.quantity < 1)
      throw new BadRequestException("quantity must be >= 1");

    const locationId = await resolveDefaultInventoryLocationId(
      this.prisma,
      tenantId
    );

    const row = await this.prisma.$transaction(async (tx) => {
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
        const full = await this.repo.getFullCart(tx, tenantId, cart.id);
        return full!;
      }

      const newQty = patch.quantity;
      const delta = newQty - li.quantity;

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

      const level = await this.repo.lockInventoryLevel(
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

      await tx.cartLineItem.update({
        where: { id: li.id },
        data: { quantity: newQty },
      });

      await tx.inventoryReservation.update({
        where: { id: resv.id },
        data: { quantity: newQty, expiresAt: this.reservationExpiresAt() },
      });

      if (delta !== 0) {
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

      const full = await this.repo.getFullCart(tx, tenantId, cart.id);
      return full!;
    });

    return prismaCartToDomain(row as any);
  }

  async deleteLineItem(
    tenantId: string,
    cartId: string,
    lineItemId: string
  ): Promise<Cart> {
    const locationId = await resolveDefaultInventoryLocationId(
      this.prisma,
      tenantId
    );

    const row = await this.prisma.$transaction(async (tx) => {
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

      const level = await this.repo.lockInventoryLevel(
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

      const full = await this.repo.getFullCart(tx, tenantId, cart.id);
      return full!;
    });

    return prismaCartToDomain(row as any);
  }

  async applyCoupon(
    tenantId: string,
    cartId: string,
    code: string
  ): Promise<Cart> {
    if (!code?.trim()) throw new BadRequestException("code is required");

    const row = await this.prisma.$transaction(async (tx) => {
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

      const existing = await tx.cartAdjustment.findFirst({
        where: {
          tenantId,
          cartId: cart.id,
          type: CartAdjustmentType.DISCOUNT,
          code,
        },
        select: { id: true },
      });

      if (!existing) {
        await tx.cartAdjustment.create({
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

      await tx.cart.update({
        where: { id: cart.id },
        data: { expiresAt: addMs(new Date(), CART_TTL_MS) },
      });

      const full = await this.repo.getFullCart(tx, tenantId, cart.id);
      return full!;
    });

    return prismaCartToDomain(row as any);
  }

  async setShippingMethod(
    tenantId: string,
    cartId: string,
    shippingOptionId: string
  ): Promise<Cart> {
    if (!shippingOptionId?.trim())
      throw new BadRequestException("shippingOptionId is required");

    const row = await this.prisma.$transaction(async (tx) => {
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

      const option = await tx.shippingOption.findFirst({
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

      const existing = await tx.cartShippingMethod.findFirst({
        where: {
          tenantId,
          cartId: cart.id,
          shippingOptionId: option.id,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!existing) {
        await tx.cartShippingMethod.create({
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
        await tx.cartShippingMethod.update({
          where: { id: existing.id },
          data: { amount, currencyCode, metadata: {}, deletedAt: null },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { expiresAt: addMs(new Date(), CART_TTL_MS) },
      });

      const full = await this.repo.getFullCart(tx, tenantId, cart.id);
      return full!;
    });

    return prismaCartToDomain(row as any);
  }
}
