import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

import { ShippingRepo } from "./common/prisma/shipping.repo";

import { ShippingStoreController } from "./store/controllers/shipping.store.controller";
import { ShippingStoreService } from "./store/services/shipping.store.service";

import { ShippingCarriersAdminController } from "./admin/controllers/shipping.carriers.admin.controller";
import { ShippingProfilesAdminController } from "./admin/controllers/shipping.profiles.admin.controller";
import { ShippingOptionsAdminController } from "./admin/controllers/shipping.options.admin.controller";

import { ShippingCarriersAdminService } from "./admin/services/shipping.carriers.admin.service";
import { ShippingProfilesAdminService } from "./admin/services/shipping.profiles.admin.service";
import { ShippingOptionsAdminService } from "./admin/services/shipping.options.admin.service";

@Module({
  controllers: [
    ShippingStoreController,

    ShippingCarriersAdminController,
    ShippingProfilesAdminController,
    ShippingOptionsAdminController,
  ],
  providers: [
    PrismaService,
    ShippingRepo,

    ShippingStoreService,

    ShippingCarriersAdminService,
    ShippingProfilesAdminService,
    ShippingOptionsAdminService,
  ],
  exports: [ShippingRepo],
})
export class ShippingModule {}
