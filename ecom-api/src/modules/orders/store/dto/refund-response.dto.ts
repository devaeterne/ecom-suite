import { RefundStatus } from "@prisma/client";

export class RefundResponseDto {
  id!: string;
  status!: RefundStatus;
  amountTotal!: number;
  currencyCode!: string;
  createdAt!: string;
}
