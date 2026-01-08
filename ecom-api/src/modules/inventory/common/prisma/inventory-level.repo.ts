import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

export type Tx = Prisma.TransactionClient;

@Injectable()
export class InventoryLevelRepo {
  constructor(private readonly prisma: PrismaService) {}

  // ===== Store tarafı: aynen kalsın
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

  // ===== Admin: list
  async list(params: {
    tenantId: string;
    locationId?: string;
    variantId?: string;
    take?: number;
    skip?: number;
  }) {
    return this.prisma.inventoryLevel.findMany({
      where: {
        tenantId: params.tenantId,
        deletedAt: null,
        ...(params.locationId ? { locationId: params.locationId } : {}),
        ...(params.variantId ? { variantId: params.variantId } : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      take: params.take ?? 50,
      skip: params.skip ?? 0,
      select: {
        id: true,
        tenantId: true,
        locationId: true,
        variantId: true,
        stockedQuantity: true,
        reservedQuantity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ===== Admin: upsert stockedQuantity (absolute)
  async upsertStockedQuantity(params: {
    tenantId: string;
    locationId: string;
    variantId: string;
    stockedQuantity: number;
  }) {
    return this.prisma.inventoryLevel.upsert({
      where: {
        tenantId_locationId_variantId: {
          tenantId: params.tenantId,
          locationId: params.locationId,
          variantId: params.variantId,
        },
      },
      create: {
        tenantId: params.tenantId,
        locationId: params.locationId,
        variantId: params.variantId,
        stockedQuantity: params.stockedQuantity,
        reservedQuantity: 0,
      },
      update: {
        stockedQuantity: params.stockedQuantity,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        locationId: true,
        variantId: true,
        stockedQuantity: true,
        reservedQuantity: true,
        updatedAt: true,
      },
    });
  }
}
