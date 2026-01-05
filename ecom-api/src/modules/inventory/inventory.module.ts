import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { InventoryCommonModule } from "@/modules/inventory/common/inventory-common.module";
import { StoreInventoryController } from "@/modules/inventory/store/controllers/inventory.controller";
import { InventoryService } from "@/modules/inventory/store/services/inventory.service";

@Module({
  imports: [PrismaModule, InventoryCommonModule],
  controllers: [StoreInventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
