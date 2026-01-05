import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { CheckoutStatus, InventoryReservationStatus } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

import { resolveDefaultInventoryLocationId } from "@/modules/cart/common/policies/cart.locations";
import { CheckoutCartReadRepo } from "../../common/prisma/checkout-cart-read.repo";
import { InventoryLevelRepo } from "../../common/prisma/inventory-level.repo";

import { ReserveStockDto, ReleaseStockDto } from "../dto/inventory.dto";

function sameSet(a: Array<{ k: string }>, b: Array<{ k: string }>) {
  const A = a
    .map((x) => x.k)
    .sort()
    .join("|");
  const B = b
    .map((x) => x.k)
    .sort()
    .join("|");
  return A === B;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkoutRead: CheckoutCartReadRepo,
    private readonly levels: InventoryLevelRepo
  ) {}

  private assertCheckoutReservable(status: CheckoutStatus) {
    if (
      status !== CheckoutStatus.OPEN &&
      status !== CheckoutStatus.PAYMENT_PENDING
    ) {
      throw new BadRequestException("CHECKOUT_NOT_RESERVABLE");
    }
  }

  async reserveForCheckout(
    tenantId: string,
    checkoutId: string,
    dto: ReserveStockDto
  ) {
    const checkout = await this.checkoutRead.getCheckoutOrThrow(
      tenantId,
      checkoutId
    );
    this.assertCheckoutReservable(checkout.status);

    const locationId =
      dto.locationId ??
      (await resolveDefaultInventoryLocationId(this.prisma, tenantId));

    if (!checkout.cartId) {
      throw new BadRequestException("CHECKOUT_CART_MISSING");
    }
    const cartItems = await this.checkoutRead.getCartLineItems(
      tenantId,
      checkout.cartId
    );

    // boş checkout => noop
    if (cartItems.length === 0) {
      return { checkoutId, locationId, noop: true, items: [] };
    }

    // mevcut ACTIVE reservation set’i
    const active = await this.prisma.inventoryReservation.findMany({
      where: {
        tenantId,
        checkoutId,
        locationId,
        status: InventoryReservationStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
        cartLineItemId: true,
        variantId: true,
        quantity: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const demandKeyed = cartItems.map((li) => ({
      k: `${li.id}:${li.variantId}:${li.quantity}`,
      li,
    }));
    const activeKeyed = active.map((r) => ({
      k: `${r.cartLineItemId ?? ""}:${r.variantId}:${r.quantity}`,
      r,
    }));

    // aynıysa idempotent noop (istersen expiresAt refresh de ekleriz)
    if (active.length > 0 && sameSet(demandKeyed, activeKeyed)) {
      const status = await this.getStockStatus(tenantId, checkoutId, {
        locationId,
      });
      return {
        checkoutId,
        locationId,
        expiresAt: active[0]?.expiresAt ?? null,
        noop: true,
        items: status.items,
      };
    }

    // set değiştiyse: release -> reserve
    return this.prisma.$transaction(async (tx) => {
      // 1) varsa aktifleri cancel + reservedQuantity geri al
      if (active.length > 0) {
        for (const r of active) {
          const lvl = await this.levels.lockInventoryLevel(
            tx,
            tenantId,
            locationId,
            r.variantId
          );
          await tx.inventoryLevel.update({
            where: { id: lvl.id },
            data: { reservedQuantity: { decrement: r.quantity } },
          });
        }

        await tx.inventoryReservation.updateMany({
          where: {
            tenantId,
            checkoutId,
            locationId,
            status: InventoryReservationStatus.ACTIVE,
            deletedAt: null,
          },
          data: { status: InventoryReservationStatus.CANCELED },
        });
      }

      // 2) reserve et
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      for (const li of cartItems) {
        const lvl = await this.levels.lockInventoryLevel(
          tx,
          tenantId,
          locationId,
          li.variantId
        );
        const available = lvl.stockedQuantity - lvl.reservedQuantity;
        if (li.quantity > available) {
          throw new ConflictException({
            code: "INSUFFICIENT_STOCK",
            variantId: li.variantId,
            available,
            requested: li.quantity,
          });
        }

        const existing = await tx.inventoryReservation.findFirst({
          where: {
            tenantId,
            checkoutId,
            cartLineItemId: li.id,
            locationId,
            deletedAt: null,
          },
          select: { id: true },
        });

        if (existing) {
          await tx.inventoryReservation.update({
            where: { id: existing.id },
            data: {
              variantId: li.variantId,
              cartId: checkout.cartId,
              quantity: li.quantity,
              status: InventoryReservationStatus.ACTIVE,
              expiresAt,
              idempotencyKey: dto.idempotencyKey ?? null,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.inventoryReservation.create({
            data: {
              tenantId,
              locationId,
              variantId: li.variantId,
              cartId: checkout.cartId,
              checkoutId,
              cartLineItemId: li.id,
              quantity: li.quantity,
              status: InventoryReservationStatus.ACTIVE,
              expiresAt,
              idempotencyKey: dto.idempotencyKey ?? null,
              metadata: {},
            },
          });
        }

        await tx.inventoryLevel.update({
          where: { id: lvl.id },
          data: { reservedQuantity: { increment: li.quantity } },
        });
      }

      const status = await this.getStockStatus(tenantId, checkoutId, {
        locationId,
      });
      return {
        checkoutId,
        locationId,
        expiresAt,
        noop: false,
        items: status.items,
      };
    });
  }

  async releaseForCheckout(
    tenantId: string,
    checkoutId: string,
    dto: ReleaseStockDto
  ) {
    const checkout = await this.checkoutRead.getCheckoutOrThrow(
      tenantId,
      checkoutId
    );

    const locationId =
      dto.locationId ??
      (await resolveDefaultInventoryLocationId(this.prisma, tenantId));

    const active = await this.prisma.inventoryReservation.findMany({
      where: {
        tenantId,
        checkoutId,
        locationId,
        status: InventoryReservationStatus.ACTIVE,
        deletedAt: null,
      },
      select: { id: true, variantId: true, quantity: true },
    });

    if (active.length === 0) {
      return {
        checkoutId: checkout.id,
        locationId,
        releasedCount: 0,
        noop: true,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      for (const r of active) {
        const lvl = await this.levels.lockInventoryLevel(
          tx,
          tenantId,
          locationId,
          r.variantId
        );
        await tx.inventoryLevel.update({
          where: { id: lvl.id },
          data: { reservedQuantity: { decrement: r.quantity } },
        });
      }

      const res = await tx.inventoryReservation.updateMany({
        where: {
          tenantId,
          checkoutId,
          locationId,
          status: InventoryReservationStatus.ACTIVE,
          deletedAt: null,
        },
        data: { status: InventoryReservationStatus.CANCELED },
      });

      return {
        checkoutId: checkout.id,
        locationId,
        releasedCount: res.count,
        noop: false,
      };
    });
  }

  async getStockStatus(
    tenantId: string,
    checkoutId: string,
    opts: { locationId?: string }
  ) {
    const checkout = await this.checkoutRead.getCheckoutOrThrow(
      tenantId,
      checkoutId
    );

    const locationId =
      opts.locationId ??
      (await resolveDefaultInventoryLocationId(this.prisma, tenantId));

    if (!checkout.cartId) {
      throw new BadRequestException("CHECKOUT_CART_MISSING");
    }
    const cartItems = await this.checkoutRead.getCartLineItems(
      tenantId,
      checkout.cartId
    );

    const variantIds = Array.from(new Set(cartItems.map((x) => x.variantId)));

    const levels = await this.prisma.inventoryLevel.findMany({
      where: {
        tenantId,
        locationId,
        variantId: { in: variantIds },
        deletedAt: null,
      },
      select: {
        variantId: true,
        stockedQuantity: true,
        reservedQuantity: true,
      },
    });

    const byVariant = new Map(levels.map((l) => [l.variantId, l]));

    const items = cartItems.map((li) => {
      const lvl = byVariant.get(li.variantId) ?? {
        variantId: li.variantId,
        stockedQuantity: 0,
        reservedQuantity: 0,
      };

      const available = lvl.stockedQuantity - lvl.reservedQuantity;

      return {
        cartLineItemId: li.id,
        variantId: li.variantId,
        required: li.quantity,
        stockedQuantity: lvl.stockedQuantity,
        reservedQuantity: lvl.reservedQuantity,
        available,
        ok: available >= li.quantity,
      };
    });

    return { checkoutId, locationId, items };
  }
}
