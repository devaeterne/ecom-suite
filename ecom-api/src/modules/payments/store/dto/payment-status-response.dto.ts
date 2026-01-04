import { PaymentStatus } from "@prisma/client";

export class PaymentStatusResponseDto {
  collectionId!: string;
  paymentStatus!: PaymentStatus;
  updatedAt!: string;
}
