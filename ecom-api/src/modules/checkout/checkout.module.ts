// src/modules/checkout/checkout.module.ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CheckoutRepo } from "@/modules/checkout/common/prisma/checkout.repo";
import { CheckoutService } from "@/modules/checkout/store/services/checkout.service";
import { CheckoutStoreController } from "@/modules/checkout/store/controllers/checkout.store.controller";

@Module({
  imports: [PrismaModule],
  controllers: [CheckoutStoreController],
  providers: [CheckoutRepo, CheckoutService],
  exports: [CheckoutRepo, CheckoutService],
})
export class CheckoutModule {}
