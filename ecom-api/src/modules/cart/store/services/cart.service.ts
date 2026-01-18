import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CartStatus, InventoryReservationStatus } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";
import { CartRepo } from "@/modules/cart/common/prisma/cart.repo";
import { prismaCartToDomain } from "@/modules/cart/common/mappers/cart.mappers";
import { Cart } from "@/modules/cart/common/types/cart.types";

import {
  CART_TTL_MS,
  RESERVATION_TTL_MS,
} from "@/modules/cart/common/constants/cart.constants";
import { resolveDefaultInventoryLocationId } from "@/modules/cart/common/policies/cart.locations";

import { CartTotalsService } from "@/modules/cart/common/services/cart-totals.service";
import { PricingEngineService } from "@/modules/cart/common/services/pricing-engine.service";
import { CartDiscountsService } from "@/modules/cart/common/services/cart-discounts.service";

function addMs(d: Date, ms: number) {
  return new Date(d.getTime() + ms);
}

type Tx = Parameters<PrismaService["$transaction"]>[0] extends (
  tx: infer T,
) => any
  ? T
  : any;

@Injectable()
export class StoreCartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: CartRepo,
    private readonly totals: CartTotalsService,
    private readonly pricingEngine: PricingEngineService,
    private readonly discounts: CartDiscountsService,
  ) {}

  // =========================================================
  // Helpers (tenant-safe primitives)
  // =========================================================

  private reservationExpiresAt() {
    return addMs(new Date(), RESERVATION_TTL_MS);
  }

  private cartExpiresAt() {
    return addMs(new Date(), CART_TTL_MS);
  }

  private getCartMeta(metadata: unknown): Record<string, any> {
    return metadata && typeof metadata === "object" ? (metadata as any) : {};
  }

  private resolveCartPriceListId(
    cart: { metadata: unknown },
    ctx?: { priceListId?: string | null },
  ) {
    if (ctx && "priceListId" in ctx) return ctx.priceListId ?? null;
    const meta = this.getCartMeta(cart.metadata);
    return meta.priceListId ?? null;
  }

  private async findActiveCartOrThrow(
    tx: Tx,
    tenantId: string,
    cartId: string,
    select?: any,
  ) {
    const cart = await tx.cart.findFirst({
      where: {
        tenantId,
        id: cartId,
        deletedAt: null,
        status: CartStatus.ACTIVE,
      },
      ...(select ? { select } : {}),
    });

    if (!cart) throw new NotFoundException("Cart not found");
    return cart;
  }

  private async touchCartExpiry(tx: Tx, tenantId: string, cartId: string) {
    // Tenant-safe: updateMany(where tenantId+id)
    const r = await tx.cart.updateMany({
      where: { tenantId, id: cartId, deletedAt: null },
      data: { expiresAt: this.cartExpiresAt() },
    });
    if (r.count !== 1) throw new NotFoundException("Cart not found");
  }

  private async recomputeAndLoad(tx: Tx, tenantId: string, cartId: string) {
    const computed = await this.totals.recompute(tx, { tenantId, cartId });
    const full = await this.repo.getFullCart(tx, tenantId, cartId);
    if (!full) throw new NotFoundException("Cart not found");
    return { full, computed };
  }

  // =========================================================
  // Public API
  // =========================================================

  async createCart(
    tenantId: string,
    input?: { email?: string },
  ): Promise<Cart> {
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await this.repo.createCart(tx, tenantId, {
        email: input?.email ?? null,
        currencyCode: "EUR",
        expiresAt: this.cartExpiresAt(),
      });

      const computed = await this.totals.recompute(tx, {
        tenantId,
        cartId: created.id,
      });

      return { full: created, computed };
    });

    return prismaCartToDomain(row.full as any, row.computed);
  }

  async getOrCreateCurrentCart(
    tenantId: string,
    cartId: string | null,
  ): Promise<{ cart: Cart; created: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const makeNew = async () => {
        const created = await this.repo.createCart(tx, tenantId, {
          email: null,
          currencyCode: "EUR",
          expiresAt: this.cartExpiresAt(),
        });

        const computed = await this.totals.recompute(tx, {
          tenantId,
          cartId: created.id,
        });

        return {
          cart: prismaCartToDomain(created as any, computed),
          created: true,
        };
      };

      if (!cartId) return makeNew();

      const found = await this.repo.findCartById(tx, tenantId, cartId);
      if (!found) return makeNew();

      if (found.expiresAt && found.expiresAt.getTime() < Date.now()) {
        await this.repo.markCartAbandoned(tx, found.id);
        return makeNew();
      }

      // refresh TTL (repo update muhtemelen id ile yapıyor; ama found tenant-safe geldi)
      const refreshed = await this.repo.refreshCartExpiry(
        tx,
        found.id,
        this.cartExpiresAt(),
      );

      const computed = await this.totals.recompute(tx, {
        tenantId,
        cartId: refreshed.id,
      });

      return {
        cart: prismaCartToDomain(refreshed as any, computed),
        created: false,
      };
    });
  }

  /**
   * Set / unset cart price list context (stored in cart.metadata.priceListId)
   */
  async setPriceList(
    tenantId: string,
    cartId: string,
    priceListId: string | null,
  ): Promise<Cart> {
    const row = await this.prisma.$transaction(async (tx) => {
      const cart = await this.findActiveCartOrThrow(tx, tenantId, cartId, {
        id: true,
        metadata: true,
      });

      const meta = this.getCartMeta(cart.metadata);

      // tenant-safe update
      const upd = await tx.cart.updateMany({
        where: { tenantId, id: cart.id, deletedAt: null },
        data: {
          metadata: { ...meta, priceListId },
          expiresAt: this.cartExpiresAt(),
        },
      });
      if (upd.count !== 1) throw new NotFoundException("Cart not found");

      return this.recomputeAndLoad(tx, tenantId, cart.id);
    });

    return prismaCartToDomain(row.full as any, row.computed);
  }

  /**
   * Add line item:
   * - inventory lock (location-aware)
   * - delta reservation increment
   * - pricing snapshot (unitPriceSnapshot / compareAtSnapshot)
   * - totals recompute
   */
  async addLineItem(
    tenantId: string,
    cartId: string,
    input: { variantId: string; quantity: number; locationId?: string },
    ctx?: { priceListId?: string | null },
  ): Promise<Cart> {
    if (!Number.isFinite(input.quantity) || input.quantity < 1) {
      throw new BadRequestException("quantity must be >= 1");
    }

    const locationId =
      input.locationId ??
      (await resolveDefaultInventoryLocationId(this.prisma, tenantId));

    const row = await this.prisma.$transaction(async (tx) => {
      const cart = await this.findActiveCartOrThrow(tx, tenantId, cartId, {
        id: true,
        currencyCode: true,
        metadata: true,
      });

      // 1) lock inventory level
      const level = await this.repo.lockInventoryLevel(
        tx,
        tenantId,
        locationId,
        input.variantId,
      );

      // 2) stock check (delta)
      const available = level.stockedQuantity - level.reservedQuantity;
      if (input.quantity > available) {
        throw new ConflictException({
          code: "INSUFFICIENT_STOCK",
          message: "Insufficient stock for reservation",
          available,
          requested: input.quantity,
        });
      }

      // 3) existing line item? (unique cartId+variantId)
      const existing = await tx.cartLineItem.findFirst({
        where: { tenantId, cartId: cart.id, variantId: input.variantId },
        select: { id: true, quantity: true },
      });

      const newQty = (existing?.quantity ?? 0) + input.quantity;

      // 4) price resolve
      const priceListId = this.resolveCartPriceListId(cart, ctx);

      const unit = await this.pricingEngine.resolveUnitPrice(tx, {
        tenantId,
        cartId: cart.id,
        variantId: input.variantId,
        currencyCode: cart.currencyCode ?? "EUR",
        quantity: newQty,
        priceListId,
      });

      if (!unit) {
        throw new BadRequestException({
          code: "PRICING_NOT_CONFIGURED",
          message: "No pricing configured for variant",
          variantId: input.variantId,
        });
      }

      // 5) upsert line item + reservation
      let liId: string;

      if (!existing) {
        const created = await tx.cartLineItem.create({
          data: {
            tenantId,
            cartId: cart.id,
            variantId: input.variantId,
            quantity: input.quantity,
            unitPriceSnapshot: unit.amount,
            compareAtSnapshot: unit.compareAt ?? null,
            metadata: {},
          },
          select: { id: true },
        });

        liId = created.id;

        await tx.inventoryReservation.create({
          data: {
            tenantId,
            cartId: cart.id,
            cartLineItemId: liId,
            variantId: input.variantId,
            locationId,
            quantity: input.quantity,
            status: InventoryReservationStatus.ACTIVE,
            expiresAt: this.reservationExpiresAt(),
            metadata: {},
          },
        });
      } else {
        liId = existing.id;

        // tenant-safe update
        const u = await tx.cartLineItem.updateMany({
          where: { tenantId, id: liId, cartId: cart.id },
          data: {
            quantity: newQty,
            unitPriceSnapshot: unit.amount,
            compareAtSnapshot: unit.compareAt ?? null,
          },
        });
        if (u.count !== 1) throw new NotFoundException("Line item not found");

        // reservation increment (same LI)
        const resv = await tx.inventoryReservation.findFirst({
          where: {
            tenantId,
            cartId: cart.id,
            cartLineItemId: liId,
            status: InventoryReservationStatus.ACTIVE,
            deletedAt: null,
          },
          select: { id: true },
        });

        if (!resv) {
          // self-heal: missing reservation
          await tx.inventoryReservation.create({
            data: {
              tenantId,
              cartId: cart.id,
              cartLineItemId: liId,
              variantId: input.variantId,
              locationId,
              quantity: input.quantity,
              status: InventoryReservationStatus.ACTIVE,
              expiresAt: this.reservationExpiresAt(),
              metadata: {},
            },
          });
        } else {
          await tx.inventoryReservation.updateMany({
            where: { tenantId, id: resv.id },
            data: {
              quantity: { increment: input.quantity },
              expiresAt: this.reservationExpiresAt(),
            },
          });
        }
      }

      // inventory reservedQuantity increment (delta) — tenant-safe
      await tx.inventoryLevel.updateMany({
        where: { tenantId, id: level.id, deletedAt: null },
        data: { reservedQuantity: { increment: input.quantity } },
      });

      // totals + cart TTL refresh
      await this.touchCartExpiry(tx, tenantId, cart.id);
      return this.recomputeAndLoad(tx, tenantId, cart.id);
    });

    return prismaCartToDomain(row.full as any, row.computed);
  }

  /**
   * Update line item quantity:
   * - uses ACTIVE reservation's locationId as source of truth
   * - delta stock check if increasing
   * - reprice snapshot using newQty
   * - reservation.quantity set to newQty (drift yok)
   * - inventoryLevel.reservedQuantity adjusted by delta
   */
  async updateLineItem(
    tenantId: string,
    cartId: string,
    lineItemId: string,
    patch: { quantity?: number },
  ): Promise<Cart> {
    if (
      patch.quantity !== undefined &&
      (!Number.isFinite(patch.quantity) || patch.quantity < 1)
    ) {
      throw new BadRequestException("quantity must be >= 1");
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const cart = await this.findActiveCartOrThrow(tx, tenantId, cartId, {
        id: true,
        currencyCode: true,
        metadata: true,
      });

      const li = await tx.cartLineItem.findFirst({
        where: { tenantId, id: lineItemId, cartId: cart.id },
        select: { id: true, variantId: true, quantity: true },
      });
      if (!li) throw new NotFoundException("Line item not found");

      if (patch.quantity === undefined) {
        await this.touchCartExpiry(tx, tenantId, cart.id);
        return this.recomputeAndLoad(tx, tenantId, cart.id);
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
        select: { id: true, locationId: true },
      });
      if (!resv) throw new Error("ACTIVE reservation not found for line item");

      const level = await this.repo.lockInventoryLevel(
        tx,
        tenantId,
        resv.locationId,
        li.variantId,
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

      const priceListId = this.resolveCartPriceListId(cart);

      const unit = await this.pricingEngine.resolveUnitPrice(tx, {
        tenantId,
        cartId: cart.id,
        variantId: li.variantId,
        currencyCode: cart.currencyCode ?? "EUR",
        quantity: newQty,
        priceListId,
      });

      if (!unit) {
        throw new BadRequestException({
          code: "PRICING_NOT_CONFIGURED",
          message: "No pricing configured for variant",
          variantId: li.variantId,
        });
      }

      const u1 = await tx.cartLineItem.updateMany({
        where: { tenantId, id: li.id, cartId: cart.id },
        data: {
          quantity: newQty,
          unitPriceSnapshot: unit.amount,
          compareAtSnapshot: unit.compareAt ?? null,
        },
      });
      if (u1.count !== 1) throw new NotFoundException("Line item not found");

      if (delta !== 0) {
        await tx.inventoryReservation.updateMany({
          where: { tenantId, id: resv.id },
          data: {
            quantity: newQty,
            expiresAt: this.reservationExpiresAt(),
          },
        });

        await tx.inventoryLevel.updateMany({
          where: { tenantId, id: level.id, deletedAt: null },
          data: { reservedQuantity: { increment: delta } },
        });
      }

      await this.touchCartExpiry(tx, tenantId, cart.id);
      return this.recomputeAndLoad(tx, tenantId, cart.id);
    });

    return prismaCartToDomain(row.full as any, row.computed);
  }

  async deleteLineItem(
    tenantId: string,
    cartId: string,
    lineItemId: string,
  ): Promise<Cart> {
    const row = await this.prisma.$transaction(async (tx) => {
      const cart = await this.findActiveCartOrThrow(tx, tenantId, cartId, {
        id: true,
      });

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
        select: { id: true, quantity: true, locationId: true },
      });

      if (resv) {
        const level = await this.repo.lockInventoryLevel(
          tx,
          tenantId,
          resv.locationId,
          li.variantId,
        );

        await tx.inventoryReservation.updateMany({
          where: { tenantId, id: resv.id },
          data: { status: InventoryReservationStatus.CANCELED },
        });

        await tx.inventoryLevel.updateMany({
          where: { tenantId, id: level.id, deletedAt: null },
          data: { reservedQuantity: { decrement: resv.quantity } },
        });
      }

      // tenant-safe delete: deleteMany(where tenantId+id+cartId)
      await tx.cartLineItem.deleteMany({
        where: { tenantId, id: li.id, cartId: cart.id },
      });

      await this.touchCartExpiry(tx, tenantId, cart.id);
      return this.recomputeAndLoad(tx, tenantId, cart.id);
    });

    return prismaCartToDomain(row.full as any, row.computed);
  }

  async applyCoupon(
    tenantId: string,
    cartId: string,
    code: string,
  ): Promise<Cart> {
    const clean = (code ?? "").trim();
    if (!clean) throw new BadRequestException("code is required");

    const row = await this.prisma.$transaction(async (tx) => {
      const cart = await this.findActiveCartOrThrow(tx, tenantId, cartId, {
        id: true,
      });

      await this.discounts.applyCoupon(tx, {
        tenantId,
        cartId: cart.id,
        code: clean,
      });

      await this.touchCartExpiry(tx, tenantId, cart.id);
      return this.recomputeAndLoad(tx, tenantId, cart.id);
    });

    return prismaCartToDomain(row.full as any, row.computed);
  }

  async removeCoupon(tenantId: string, cartId: string): Promise<Cart> {
    const row = await this.prisma.$transaction(async (tx) => {
      const cart = await this.findActiveCartOrThrow(tx, tenantId, cartId, {
        id: true,
      });

      await this.discounts.removeCoupon(tx, { tenantId, cartId: cart.id });

      await this.touchCartExpiry(tx, tenantId, cart.id);
      return this.recomputeAndLoad(tx, tenantId, cart.id);
    });

    return prismaCartToDomain(row.full as any, row.computed);
  }

  async setShippingMethod(
    tenantId: string,
    cartId: string,
    shippingOptionId: string,
  ): Promise<Cart> {
    if (!shippingOptionId?.trim()) {
      throw new BadRequestException("shippingOptionId is required");
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const cart = await this.findActiveCartOrThrow(tx, tenantId, cartId, {
        id: true,
        currencyCode: true,
      });

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
      const currencyCode = option.currencyCode ?? cart.currencyCode ?? "EUR";

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
        // tek shipping method politikası: diğerlerini soft-delete
        await tx.cartShippingMethod.updateMany({
          where: { tenantId, cartId: cart.id, deletedAt: null },
          data: { deletedAt: new Date() },
        });

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
        await tx.cartShippingMethod.updateMany({
          where: { tenantId, id: existing.id, cartId: cart.id },
          data: {
            amount,
            currencyCode,
            metadata: {},
            deletedAt: null,
          },
        });
      }

      await this.touchCartExpiry(tx, tenantId, cart.id);
      return this.recomputeAndLoad(tx, tenantId, cart.id);
    });

    return prismaCartToDomain(row.full as any, row.computed);
  }
}
