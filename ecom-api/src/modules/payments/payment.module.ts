import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";

import { PaymentsRepo } from "@/modules/payments/common/prisma/payments.repo";

import { PaymentsStoreController } from "@/modules/payments/store/controllers/payments.store.controller";
import { PaymentsStoreService } from "@/modules/payments/store/services/payment.store.service";

import { PaymentsWebhookController } from "@/modules/payments/public/controllers/payments.webhook.controller";
import { PaymentsWebhookService } from "@/modules/payments/public/services/payments.webhook.services";

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsStoreController, PaymentsWebhookController],
  providers: [PaymentsStoreService, PaymentsWebhookService, PaymentsRepo],
  exports: [PaymentsRepo, PaymentsStoreService],
})
export class PaymentsModule {}
