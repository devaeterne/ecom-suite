import { Injectable } from "@nestjs/common";
import { Prisma, CartStatus } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

export type Tx = Prisma.TransactionClient;

@Injectable()
export class CartRepo {
  constructor(private readonly prisma: PrismaService) {}

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
      include: { lineItems: true, adjustments: true, shippingMethods: true },
    });
  }

  async findCartById(tx: Tx, tenantId: string, cartId: string) {
    return tx.cart.findFirst({
      where: { tenantId, id: cartId, deletedAt: null },
      include: { lineItems: true, adjustments: true, shippingMethods: true },
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
      include: { lineItems: true, adjustments: true, shippingMethods: true },
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
      include: { lineItems: true, adjustments: true, shippingMethods: true },
    });
  }

  async getFullCart(tx: Tx, tenantId: string, cartId: string) {
    return tx.cart.findFirst({
      where: { tenantId, id: cartId, deletedAt: null },
      include: { lineItems: true, adjustments: true, shippingMethods: true },
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

  async upsertLineItem(tx: Tx, tenantId: string, cartId: string, input: any) {
    return tx.cartLineItem.upsert({
      where: { cartId_variantId: { cartId, variantId: input.variantId } },
      create: {
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
      update: {
        quantity: { increment: input.quantity },
      },
      select: { id: true, quantity: true, variantId: true },
    });
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
}
