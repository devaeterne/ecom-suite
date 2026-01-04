import { OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";

export class OrderListItemDto {
  id!: string;
  orderNo!: string;
  status!: OrderStatus;

  grandTotal!: number;
  currencyCode!: string;

  paymentProvider!: PaymentProvider;
  paymentStatus!: PaymentStatus;

  createdAt!: string;
}
