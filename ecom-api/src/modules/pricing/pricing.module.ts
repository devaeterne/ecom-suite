import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { PricingAdminService } from "./admin/services/pricing.admin.service";
import { VariantPricesAdminController } from "./admin/controller/variant-prices.admin.controller";
import { DiscountsAdminController } from "./admin/controller/discounts.admin.controller";
import { PriceListsAdminController } from "./admin/controller/price-lists.admin.controller";
import { PriceListsAdminService } from "./admin/services/price-list.admin.service";
import { DiscountsAdminService } from "./admin/services/discounts.admin.service";
import { PricingStoreService } from "./store/services/pricing.store.service";

@Module({
  controllers: [
    VariantPricesAdminController,
    DiscountsAdminController,
    PriceListsAdminController,
  ],
  providers: [
    PrismaService,
    PricingAdminService,
    PriceListsAdminService,
    DiscountsAdminService,
    PricingStoreService,
  ],
  exports: [PricingStoreService],
})
export class PricingModule {}
