import { OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";

export class OrderDetailDto {
  id!: string;
  orderNo!: string;
  status!: OrderStatus;

  billingAddress!: Record<string, any>;
  shippingAddress!: Record<string, any>;

  items!: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  payment!: {
    provider: PaymentProvider;
    status: PaymentStatus;
    externalRef?: string | null;
  };

  totals!: {
    subtotal: number;
    discountTotal: number;
    shippingTotal: number;
    taxTotal: number;
    grandTotal: number;
  };

  createdAt!: string;
}
