import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";

import { CheckoutCartReadRepo } from "./prisma/checkout-cart-read.repo";
import { InventoryLocationsRepo } from "./prisma/inventory.locations.repo";
import { InventoryLevelRepo } from "./prisma/inventory-level.repo";
import { InventoryReservationRepo } from "./prisma/inventory-reservation.repo"; // ✅ EKLE

import { InventoryTenancyPolicy } from "./policies/inventory.tenancy";
import { InventoryLocationsPolicy } from "./policies/inventory.locations";

@Module({
  imports: [PrismaModule],
  providers: [
    CheckoutCartReadRepo,
    InventoryLocationsRepo,
    InventoryLevelRepo,
    InventoryReservationRepo, // ✅ EKLE
    InventoryTenancyPolicy,
    InventoryLocationsPolicy,
  ],
  exports: [
    CheckoutCartReadRepo,
    InventoryLocationsRepo,
    InventoryLevelRepo,
    InventoryReservationRepo, // ✅ EKLE
    InventoryTenancyPolicy,
    InventoryLocationsPolicy,
  ],
})
export class InventoryCommonModule {}
