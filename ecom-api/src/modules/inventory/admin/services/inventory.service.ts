import { Injectable } from "@nestjs/common";
import { InventoryLocationsRepo } from "../../common/prisma/inventory.locations.repo";
import { InventoryLevelRepo } from "../../common/prisma/inventory-level.repo";
import { InventoryReservationRepo } from "../../common/prisma/inventory-reservation.repo";

@Injectable()
export class AdminInventoryService {
  constructor(
    private readonly locationsRepo: InventoryLocationsRepo,
    private readonly levelRepo: InventoryLevelRepo,
    private readonly reservationRepo: InventoryReservationRepo
  ) {}

  // -------- Locations
  listLocations(tenantId: string) {
    return this.locationsRepo.list(tenantId);
  }
  async createLocation(tenantId: string, dto: any) {
    const hasAny = await this.locationsRepo.countActive(tenantId);

    // tablo boşsa: otomatik default
    const shouldBeDefault = hasAny === 0 ? true : Boolean(dto?.isDefault);

    const created = await this.locationsRepo.create({
      tenantId,
      ...dto,
      isDefault: shouldBeDefault,
    });

    // dto ile default istendiyse veya bootstrap default olduysa
    if (shouldBeDefault) {
      await this.locationsRepo.setDefault(tenantId, created.id);
      return { ...created, isDefault: true };
    }

    return created;
  }

  async updateLocation(tenantId: string, id: string, dto: any) {
    // “default yap” davranışını update içinde emüle etme; tek kapı: setDefault()
    if (dto?.isDefault === true) {
      await this.locationsRepo.setDefault(tenantId, id);
    }

    // dto’dan isDefault’u kaldır ki updateMany ile yanlışlıkla multi-default yaratma riski olmasın
    const { isDefault, ...rest } = dto ?? {};
    return this.locationsRepo.update({ tenantId, id, ...rest });
  }

  setDefaultLocation(tenantId: string, id: string) {
    return this.locationsRepo.setDefault(tenantId, id);
  }
  deleteLocation(tenantId: string, id: string) {
    return this.locationsRepo.softDelete(tenantId, id);
  }

  // -------- Levels
  listLevels(params: {
    tenantId: string;
    locationId?: string;
    variantId?: string;
    take?: number;
    skip?: number;
  }) {
    return this.levelRepo.list(params);
  }

  async upsertLevels(params: {
    tenantId: string;
    items: Array<{
      locationId: string;
      variantId: string;
      stockedQuantity: number;
    }>;
  }) {
    const out = [];
    for (const it of params.items) {
      out.push(
        await this.levelRepo.upsertStockedQuantity({
          tenantId: params.tenantId,
          locationId: it.locationId,
          variantId: it.variantId,
          stockedQuantity: it.stockedQuantity,
        })
      );
    }
    return out;
  }

  // -------- Reservations (Ops/Debug)
  listReservations(params: {
    tenantId: string;
    locationId?: string;
    variantId?: string;
    checkoutId?: string;
    status?: "ACTIVE" | "COMPLETED" | "CANCELED" | "EXPIRED";
    take?: number;
    skip?: number;
  }) {
    return this.reservationRepo.adminList(params);
  }
}
