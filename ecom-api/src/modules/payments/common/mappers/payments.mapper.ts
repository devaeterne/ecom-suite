import type { PaymentCollection, Payment } from "@prisma/client";
import { PaymentProvider, PaymentStatus } from "@prisma/client";

import { PaymentCollectionResponseDto } from "@/modules/payments/store/dto/payment-collection-response.dto";
import { PaymentStatusResponseDto } from "@/modules/payments/store/dto/payment-status-response.dto";

const iso = (d: any) =>
  d instanceof Date ? d.toISOString() : new Date(d ?? 0).toISOString();

function pickLatestPayment(payments: Payment[]): Payment | null {
  if (!payments?.length) return null;
  return payments
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt as any).getTime() -
        new Date(a.updatedAt as any).getTime()
    )[0];
}

export function toPaymentCollectionResponse(params: {
  collection: PaymentCollection;
  payment?: Payment | null;
}): PaymentCollectionResponseDto {
  const { collection, payment } = params;

  return {
    id: collection.id,
    status: collection.status,

    amount: collection.amount,
    currencyCode: collection.currencyCode,

    provider: (payment?.provider ?? PaymentProvider.MANUAL) as PaymentProvider,
    paymentStatus: (payment?.status ?? PaymentStatus.PENDING) as PaymentStatus,

    createdAt: iso(collection.createdAt),
  };
}

export function toPaymentStatusResponse(params: {
  collectionId: string;
  payment: Payment | null;
}): PaymentStatusResponseDto {
  const { collectionId, payment } = params;

  return {
    collectionId,
    paymentStatus: (payment?.status ?? PaymentStatus.PENDING) as PaymentStatus,
    updatedAt: iso(payment?.updatedAt ?? new Date()),
  };
}

export function toCollectionAndLatestPayment(params: {
  collection: PaymentCollection & { payments: Payment[] };
}) {
  const latest = pickLatestPayment(params.collection.payments);
  return { latest };
}
