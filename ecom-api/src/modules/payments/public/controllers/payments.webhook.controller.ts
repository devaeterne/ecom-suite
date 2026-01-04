import { Body, Controller, Headers, Post, Req } from "@nestjs/common";
import type { Request } from "express";

import { PaymentWebhookDto } from "@/modules/payments/store/dto/payment-webhook.dto";
import { PaymentsWebhookService } from "@/modules/payments/public/services/payments.webhook.services";
import { assertWebhookSignature } from "@/modules/payments/common/policies/payment.webhook";

@Controller("payments/webhooks")
export class PaymentsWebhookController {
  constructor(private readonly svc: PaymentsWebhookService) {}

  @Post()
  async ingest(
    @Req() req: Request,
    @Headers() headers: any,
    @Body() dto: PaymentWebhookDto
  ) {
    // express.raw() ile gelen buffer
    const rawBody = (req as any).body;

    assertWebhookSignature({
      headers,
      provider: dto.provider,
      rawBody,
    });

    return this.svc.handleWebhook({ headers, dto, rawBody });
  }
}
