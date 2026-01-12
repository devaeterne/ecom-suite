import { Module } from "@nestjs/common";
import { StoreCartController } from "@/modules/cart/store/controllers/cart.controller";
import { StoreCartService } from "@/modules/cart/store/services/cart.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { CartCommonModule } from "@/modules/cart/common/cart-common.module";
import { PricingStoreService } from "../pricing/store/services/pricing.store.service";
import { PricingModule } from "../pricing/pricing.module";

@Module({
  imports: [PrismaModule, CartCommonModule, PricingModule],
  controllers: [StoreCartController],
  providers: [StoreCartService, PricingStoreService],
})
export class StoreCartModule {}
