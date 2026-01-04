import { Module } from "@nestjs/common";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { StoreAuthModule } from "@/modules/auth/store/store-auth.module"; // <-- ADD THIS
import { PaymentsModule } from "../payments/payment.module";

@Module({
  imports: [PrismaModule, StoreAuthModule, PaymentsModule], // <-- ADD StoreAuthModule
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
