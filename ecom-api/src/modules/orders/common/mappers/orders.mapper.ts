import { PaymentProvider, PaymentStatus } from "@prisma/client";

import { OrderListItemDto } from "@/modules/orders/store/dto/order-list-item.dto";
import { OrderDetailDto } from "@/modules/orders/store/dto/order-detail.dto";
import { OrderResponseDto } from "@/modules/orders/store/dto/order-response.dto";

const iso = (d: any) =>
  d instanceof Date ? d.toISOString() : new Date(d ?? 0).toISOString();

const num = (v: any) => (typeof v === "number" ? v : Number(v ?? 0));

const fallbackProvider = (v: any) =>
  (v ?? PaymentProvider.MANUAL) as PaymentProvider;

const fallbackPaymentStatus = (v: any) =>
  (v ?? PaymentStatus.PENDING) as PaymentStatus;

/**
 * LIST ITEM
 * DTO: currencyCode + paymentProvider + paymentStatus zorunlu
 */
export function toOrderListItem(row: any): OrderListItemDto {
  const provider =
    row.paymentProvider ?? row.payment?.provider ?? PaymentProvider.MANUAL;

  const status =
    row.paymentStatus ?? row.payment?.status ?? PaymentStatus.PENDING;

  return {
    id: row.id,
    orderNo: row.orderNo,
    status: row.status,

    grandTotal: num(row.grandTotal),
    currencyCode: row.currencyCode,

    paymentProvider: fallbackProvider(provider),
    paymentStatus: fallbackPaymentStatus(status),

    createdAt: iso(row.createdAt),
  };
}

/**
 * DETAIL
 * DTO: billingAddress + shippingAddress + items + payment + totals zorunlu
 */
export function toOrderDetail(row: any): OrderDetailDto {
  const provider =
    row.paymentProvider ?? row.payment?.provider ?? PaymentProvider.MANUAL;

  const status =
    row.paymentStatus ?? row.payment?.status ?? PaymentStatus.PENDING;

  return {
    id: row.id,
    orderNo: row.orderNo,
    status: row.status,

    // Eğer order modelinde address relation yoksa bile DTO'yu kırmamak için boş objeler dönüyoruz.
    billingAddress: row.billingAddress ?? {},
    shippingAddress: row.shippingAddress ?? {},

    // Eğer items yoksa boş liste
    items: Array.isArray(row.items)
      ? row.items.map((it: any) => ({
          id: it.id,
          title: it.title,
          quantity: num(it.quantity),
          unitPrice: num(it.unitPrice),
          total: num(it.total),
        }))
      : [],

    payment: {
      provider: fallbackProvider(provider),
      status: fallbackPaymentStatus(status),
      externalRef: row.payment?.externalRef ?? null,
    },

    totals: {
      subtotal: num(row.subtotal),
      discountTotal: num(row.discountTotal),
      shippingTotal: num(row.shippingTotal),
      taxTotal: num(row.taxTotal),
      grandTotal: num(row.grandTotal),
    },

    createdAt: iso(row.createdAt),
  };
}

/**
 * CREATE/LIGHT RESPONSE
 * DTO: currencyCode + totals + payment zorunlu
 */
export function toOrderResponse(row: any): OrderResponseDto {
  const provider =
    row.paymentProvider ?? row.payment?.provider ?? PaymentProvider.MANUAL;

  const status =
    row.paymentStatus ?? row.payment?.status ?? PaymentStatus.PENDING;

  return {
    id: row.id,
    orderNo: row.orderNo,
    status: row.status,
    currencyCode: row.currencyCode,

    itemsSubtotal: num(row.subtotal),
    shippingTotal: num(row.shippingTotal),
    taxTotal: num(row.taxTotal),
    discountTotal: num(row.discountTotal),
    grandTotal: num(row.grandTotal),

    payment: {
      provider: fallbackProvider(provider),
      status: fallbackPaymentStatus(status),
    },

    createdAt: iso(row.createdAt),
  };
}
