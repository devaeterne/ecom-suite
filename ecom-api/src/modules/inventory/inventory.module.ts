import { Module } from "@nestjs/common";
import { InventoryCommonModule } from "./common/inventory-common.module";

import { AdminInventoryService } from "./admin/services/inventory.service";
import { AdminInventoryLocationsController } from "./admin/controllers/admin.inventory.locations.controller";
import { AdminInventoryLevelsController } from "./admin/controllers/admin.inventory.levels.controller";
import { AdminInventoryReservationsController } from "./admin/controllers/admin.inventory.reservations.controller";
import { StoreInventoryController } from "./store/controllers/inventory.controller";
import { StoreInventoryService } from "./store/services/inventory.service";

@Module({
  imports: [InventoryCommonModule], // ✅ şart
  controllers: [
    AdminInventoryLocationsController,
    AdminInventoryLevelsController,
    AdminInventoryReservationsController,
    StoreInventoryController,
  ],
  providers: [AdminInventoryService, StoreInventoryService],
})
export class InventoryModule {}
