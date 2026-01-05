import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

export type Tx = Prisma.TransactionClient;

@Injectable()
export class InventoryLevelRepo {
  async lockInventoryLevel(
    tx: Tx,
    tenantId: string,
    locationId: string,
    variantId: string
  ) {
    const rows = await tx.$queryRaw<
      Array<{ id: string; stockedquantity: number; reservedquantity: number }>
    >`
      SELECT id,
        "stockedQuantity" as stockedQuantity,
        "reservedQuantity" as reservedQuantity
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

    // yoksa oluştur, sonra tekrar lock al
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
      SELECT id,
        "stockedQuantity" as stockedQuantity,
        "reservedQuantity" as reservedQuantity
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
}
