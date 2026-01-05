import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CheckoutCartReadRepo } from "@modules/inventory/common/prisma/checkout-cart-read.repo";
import { InventoryLevelRepo } from "@modules/inventory/common/prisma/inventory-level.repo";

@Module({
  imports: [PrismaModule],
  providers: [CheckoutCartReadRepo, InventoryLevelRepo],
  exports: [CheckoutCartReadRepo, InventoryLevelRepo],
})
export class InventoryCommonModule {}
