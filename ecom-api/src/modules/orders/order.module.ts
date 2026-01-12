import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";

import { OrdersRepo } from "@/modules/orders/common/prisma/orders.repo";

import { OrdersStoreController } from "@/modules/orders/store/controllers/orders.store.controller";
import { OrdersStoreService } from "@/modules/orders/store/services/orders.store.service";
import { FullfilmentsAdminController } from "./admin/controllers/fullfilments.admin.controller";
import { ShipmentsAdminController } from "./admin/controllers/shipments.admin.controller";
import { FullfillmentsAdminService } from "./admin/services/fullfillments.admin.service";
import { ShipmentsAdminService } from "./admin/services/shipments.admin.service";

@Module({
  imports: [PrismaModule],
  controllers: [
    OrdersStoreController,
    FullfilmentsAdminController,
    ShipmentsAdminController,
  ],
  providers: [
    OrdersStoreService,
    OrdersRepo,
    FullfillmentsAdminService,
    ShipmentsAdminService,
  ],
  exports: [OrdersRepo],
})
export class OrdersModule {}
