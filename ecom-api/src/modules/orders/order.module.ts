import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";

import { OrdersStoreController } from "@/modules/orders/store/controllers/orders.store.controller";
import { OrdersStoreService } from "@/modules/orders/store/services/orders.store.service";

@Module({
  imports: [PrismaModule],
  controllers: [OrdersStoreController],
  providers: [OrdersStoreService],
  exports: [OrdersStoreService],
})
export class OrdersModule {}
