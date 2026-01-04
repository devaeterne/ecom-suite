import { OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";

export class OrderResponseDto {
  id!: string;
  orderNo!: string;
  status!: OrderStatus;
  currencyCode!: string;

  itemsSubtotal!: number;
  shippingTotal!: number;
  taxTotal!: number;
  discountTotal!: number;
  grandTotal!: number;

  payment!: {
    provider: PaymentProvider;
    status: PaymentStatus;
  };

  createdAt!: string;
}
