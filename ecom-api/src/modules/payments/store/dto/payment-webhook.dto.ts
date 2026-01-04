import { PaymentProvider, PaymentStatus } from "@prisma/client";

export class PaymentWebhookDto {
  provider!: PaymentProvider;
  externalRef!: string;
  status!: PaymentStatus;

  amount!: number;
  currencyCode!: string;

  rawPayload!: Record<string, any>;
}
