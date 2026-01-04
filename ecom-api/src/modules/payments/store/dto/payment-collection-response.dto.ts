import {
  PaymentCollectionStatus,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";

export class PaymentCollectionResponseDto {
  id!: string;
  status!: PaymentCollectionStatus;

  amount!: number;
  currencyCode!: string;

  provider!: PaymentProvider;
  paymentStatus!: PaymentStatus;

  // opsiyonel alanların varsa ? yap
  // idempotencyKey?: string | null;

  createdAt!: string;
}
