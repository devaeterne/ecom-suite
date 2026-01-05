import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  ActiveReservationRow,
  DemandLine,
} from "../types/inventory.types";

@Injectable()
export class InventoryReservationRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByCheckout(params: {
    tenantId: string;
    checkoutId: string;
    locationId: string;
  }): Promise<ActiveReservationRow[]> {
    const rows = await this.prisma.inventoryReservation.findMany({
      where: {
        tenantId: params.tenantId,
        checkoutId: params.checkoutId,
        locationId: params.locationId,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        locationId: true,
        variantId: true,
        cartLineItemId: true,
        checkoutId: true,
        quantity: true,
        status: true,
        expiresAt: true,
      },
      orderBy: [{ createdAt: "asc" }],
    });

    return rows as ActiveReservationRow[];
  }

  async createActiveForCheckout(params: {
    tenantId: string;
    checkoutId: string;
    cartId: string;
    locationId: string;
    idempotencyKey?: string;
    expiresAt: Date | null;
    lines: DemandLine[];
  }) {
    // Tek tek create yapıyoruz (MVP). İstersen createMany de olur.
    // cartLineItemId dolu gelecek.
    for (const l of params.lines) {
      await this.prisma.inventoryReservation.create({
        data: {
          tenantId: params.tenantId,
          locationId: params.locationId,
          variantId: l.variantId,
          cartId: params.cartId,
          checkoutId: params.checkoutId,
          cartLineItemId: l.cartLineItemId,
          idempotencyKey: params.idempotencyKey,
          quantity: l.quantity,
          status: "ACTIVE",
          expiresAt: params.expiresAt,
        },
      });
    }
  }

  async markActiveAsCanceled(params: {
    tenantId: string;
    checkoutId: string;
    locationId: string;
  }): Promise<number> {
    const res = await this.prisma.inventoryReservation.updateMany({
      where: {
        tenantId: params.tenantId,
        checkoutId: params.checkoutId,
        locationId: params.locationId,
        status: "ACTIVE",
        deletedAt: null,
      },
      data: {
        status: "CANCELED",
        updatedAt: new Date(),
      },
    });

    return res.count;
  }
}
