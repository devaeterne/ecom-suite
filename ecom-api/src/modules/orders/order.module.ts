import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";

import { OrdersRepo } from "@/modules/orders/common/prisma/orders.repo";

import { OrdersStoreController } from "@/modules/orders/store/controllers/orders.store.controller";
import { OrdersStoreService } from "@/modules/orders/store/services/orders.store.service";

@Module({
  imports: [PrismaModule],
  controllers: [OrdersStoreController],
  providers: [OrdersStoreService, OrdersRepo],
  exports: [OrdersRepo],
})
export class OrdersModule {}
