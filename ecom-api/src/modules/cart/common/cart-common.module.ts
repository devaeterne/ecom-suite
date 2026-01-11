import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CartRepo } from "@/modules/cart/common/prisma/cart.repo";
import { CartTotalsService } from "./services/cart-totals.service";
import { PricingEngineService } from "./services/pricing-engine.service";
import { CartDiscountsService } from "./services/cart-discounts.service";

@Module({
  imports: [PrismaModule],
  providers: [
    CartRepo,
    CartTotalsService,
    PricingEngineService,
    CartDiscountsService,
  ],
  exports: [
    CartRepo,
    CartTotalsService,
    PricingEngineService,
    CartDiscountsService,
  ],
})
export class CartCommonModule {}
