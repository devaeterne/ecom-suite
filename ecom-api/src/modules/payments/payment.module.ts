import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";

import { PaymentsStoreController } from "@/modules/payments/store/controllers/payments.store.controller";
import { PaymentsStoreService } from "@/modules/payments/store/services/payment.store.service";

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsStoreController],
  providers: [PaymentsStoreService],
  exports: [PaymentsStoreService],
})
export class PaymentsModule {}
