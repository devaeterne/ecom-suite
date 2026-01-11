// src/modules/cart/common/prisma/cart.repo.ts
import { Injectable } from "@nestjs/common";
import { Prisma, CartStatus } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

export type Tx = Prisma.TransactionClient;

@Injectable()
export class CartRepo {
  constructor(private readonly prisma: PrismaService) {}

  private fullInclude = {
    lineItems: true,
    //adjustments: true, // legacy (ileride silebilirsin)
    shippingMethods: { where: { deletedAt: null } },
    cartDiscountApplications: {
      where: { deletedAt: null },
      include: {
        discount: {
          select: {
            id: true,
            // code DB’de unique/lookup için var, listede de göstermek isteriz
            code: true,
          },
        },
      },
    },
  } as const;

  async createCart(
    tx: Tx,
    tenantId: string,
    data: {
      email?: string | null;
      currencyCode: string;
      expiresAt: Date;
    }
  ) {
    return tx.cart.create({
      data: {
        tenantId,
        status: CartStatus.ACTIVE,
        currencyCode: data.currencyCode,
        email: data.email ?? null,
        expiresAt: data.expiresAt,
      },
      include: this.fullInclude,
    });
  }

  async findCartById(tx: Tx, tenantId: string, cartId: string) {
    return tx.cart.findFirst({
      where: { tenantId, id: cartId, deletedAt: null },
      include: this.fullInclude,
    });
  }

  async findActiveCartById(tx: Tx, tenantId: string, cartId: string) {
    return tx.cart.findFirst({
      where: {
        tenantId,
        id: cartId,
        deletedAt: null,
        status: CartStatus.ACTIVE,
      },
      include: this.fullInclude,
    });
  }

  async markCartAbandoned(tx: Tx, cartId: string) {
    return tx.cart.update({
      where: { id: cartId },
      data: { status: CartStatus.ABANDONED },
    });
  }

  async refreshCartExpiry(tx: Tx, cartId: string, expiresAt: Date) {
    return tx.cart.update({
      where: { id: cartId },
      data: { expiresAt },
      include: this.fullInclude,
    });
  }

  async getFullCart(tx: Tx, tenantId: string, cartId: string) {
    return tx.cart.findFirst({
      where: { tenantId, id: cartId, deletedAt: null },
      include: this.fullInclude,
    });
  }

  // ---------- Inventory lock + reservations ----------
  async lockInventoryLevel(
    tx: Tx,
    tenantId: string,
    locationId: string,
    variantId: string
  ) {
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
      const anyRow: any = rows[0];
      return {
        id: anyRow.id,
        stockedQuantity: anyRow.stockedQuantity ?? anyRow.stockedquantity,
        reservedQuantity: anyRow.reservedQuantity ?? anyRow.reservedquantity,
      };
    }

    await tx.inventoryLevel.create({
      data: {
        tenantId,
        locationId,
        variantId,
        stockedQuantity: 0,
        reservedQuantity: 0,
      },
    });

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

  async findActiveReservation(
    tx: Tx,
    tenantId: string,
    cartId: string,
    lineItemId: string
  ) {
    return tx.inventoryReservation.findFirst({
      where: {
        tenantId,
        cartId,
        cartLineItemId: lineItemId,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { id: true, quantity: true },
    });
  }

  // ---------- Cart line items (deterministic qty + snapshots) ----------
  async getLineItemByCartVariant(
    tx: Tx,
    tenantId: string,
    cartId: string,
    variantId: string
  ) {
    return tx.cartLineItem.findFirst({
      where: { tenantId, cartId, variantId },
      select: { id: true, quantity: true, variantId: true },
    });
  }

  async createLineItem(
    tx: Tx,
    tenantId: string,
    cartId: string,
    input: {
      variantId: string;
      quantity: number;
      unitPriceSnapshot: number;
      compareAtSnapshot?: number | null;
      skuSnapshot?: string | null;
      titleSnapshot?: string | null;
      metadata?: any;
    }
  ) {
    return tx.cartLineItem.create({
      data: {
        tenantId,
        cartId,
        variantId: input.variantId,
        quantity: input.quantity,
        unitPriceSnapshot: input.unitPriceSnapshot ?? 0,
        compareAtSnapshot: input.compareAtSnapshot ?? null,
        skuSnapshot: input.skuSnapshot ?? null,
        titleSnapshot: input.titleSnapshot ?? null,
        metadata: input.metadata ?? {},
      },
      select: { id: true, quantity: true, variantId: true },
    });
  }

  async updateLineItemSnapshots(
    tx: Tx,
    tenantId: string,
    lineItemId: string,
    patch: {
      quantity: number;
      unitPriceSnapshot: number;
      compareAtSnapshot?: number | null;
      skuSnapshot?: string | null;
      titleSnapshot?: string | null;
    }
  ) {
    return tx.cartLineItem.update({
      where: { id: lineItemId },
      data: {
        quantity: patch.quantity,
        unitPriceSnapshot: patch.unitPriceSnapshot ?? 0,
        compareAtSnapshot: patch.compareAtSnapshot ?? null,
        skuSnapshot: patch.skuSnapshot ?? null,
        titleSnapshot: patch.titleSnapshot ?? null,
      },
      select: { id: true, quantity: true, variantId: true },
    });
  }
}
