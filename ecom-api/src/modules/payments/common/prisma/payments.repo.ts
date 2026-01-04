// src/modules/payments/common/prisma/payments.repo.ts
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  PaymentCollectionStatus,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import crypto from "crypto";

type Tx = Prisma.TransactionClient;

@Injectable()
export class PaymentsRepo {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: Tx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  /* -------------------------------------------------
   * Checkout helpers
   * ------------------------------------------------- */
  getCheckoutWithAddresses(
    tx: Tx,
    params: { tenantId: string; checkoutId: string }
  ) {
    const { tenantId, checkoutId } = params;
    return tx.checkout.findFirst({
      where: { tenantId, id: checkoutId, deletedAt: null },
      include: { addresses: true },
    });
  }

  getCheckoutPaymentCollectionRef(
    tx: Tx,
    params: { tenantId: string; checkoutId: string }
  ) {
    const { tenantId, checkoutId } = params;
    return tx.checkout.findFirst({
      where: { tenantId, id: checkoutId, deletedAt: null },
      select: { id: true, customerId: true, paymentCollectionId: true },
    });
  }

  listEnabledTenantProviders(tx: Tx, params: { tenantId: string }) {
    const { tenantId } = params;
    return tx.tenantPaymentProvider.findMany({
      where: { tenantId },
      select: { provider: true },
    });
  }

  /* -------------------------------------------------
   * Collection + Payment (start-payment path)
   * ------------------------------------------------- */
  upsertPaymentCollection(
    tx: Tx,
    params: {
      tenantId: string;
      idempotencyKey: string;
      amount: number;
      currencyCode: string;
      metadata: Record<string, any>;
    }
  ) {
    const { tenantId, idempotencyKey, amount, currencyCode, metadata } = params;

    return tx.paymentCollection.upsert({
      where: {
        tenantId_idempotencyKey: { tenantId, idempotencyKey },
      },
      update: {},
      create: {
        tenantId,
        status: PaymentCollectionStatus.ACTIVE,
        amount,
        currencyCode,
        idempotencyKey,
        metadata,
      },
    });
  }

  attachCollectionToCheckout(
    tx: Tx,
    params: { tenantId: string; checkoutId: string; collectionId: string }
  ) {
    const { tenantId, checkoutId, collectionId } = params;
    return tx.checkout.update({
      where: { tenantId_id: { tenantId, id: checkoutId } },
      data: { paymentCollectionId: collectionId },
    });
  }

  createPayment(
    tx: Tx,
    params: {
      tenantId: string;
      collectionId: string;
      provider: PaymentProvider;
      amount: number;
      currencyCode: string;
      metadata: Record<string, any>;
    }
  ) {
    const { tenantId, collectionId, provider, amount, currencyCode, metadata } =
      params;

    return tx.payment.create({
      data: {
        tenantId,
        collectionId,
        provider,
        status: PaymentStatus.PENDING,
        amount,
        currencyCode,
        metadata,
      },
    });
  }

  getPaymentCollectionWithPayments(
    tx: Tx,
    params: { tenantId: string; collectionId: string }
  ) {
    const { tenantId, collectionId } = params;
    return tx.paymentCollection.findFirst({
      where: { tenantId, id: collectionId, deletedAt: null },
      include: { payments: true },
    });
  }

  /* -------------------------------------------------
   * Webhook path helpers
   * ------------------------------------------------- */

  /**
   * externalRef kolonu yok varsayımıyla:
   * - payment.metadata.externalRef == dto.externalRef
   * - provider match
   *
   * Prisma JSON path filtresi: metadata: { path: ["externalRef"], equals: ... }
   */
  findPaymentByProviderExternalRef(
    tx: Tx,
    params: { tenantId: string; provider: PaymentProvider; externalRef: string }
  ) {
    const { tenantId, provider, externalRef } = params;

    return tx.payment.findFirst({
      where: {
        tenantId,
        provider,
        metadata: {
          path: ["externalRef"],
          equals: externalRef,
        } as any,
      },
    });
  }

  updatePaymentFromWebhook(
    tx: Tx,
    params: {
      tenantId: string;
      paymentId: string;
      status: PaymentStatus;
      rawPayload: Record<string, any>;
      externalRef: string;
    }
  ) {
    const { tenantId, paymentId, status, rawPayload, externalRef } = params;

    return tx.payment.update({
      where: { tenantId_id: { tenantId, id: paymentId } },
      data: {
        status,
        metadata: {
          externalRef,
          webhook: rawPayload,
        } as any,
      },
    });
  }

  finalizeCollectionStatusIfNeeded(
    tx: Tx,
    params: {
      tenantId: string;
      collectionId: string;
      paymentStatus: PaymentStatus;
    }
  ) {
    const { tenantId, collectionId, paymentStatus } = params;

    if (paymentStatus === PaymentStatus.AUTHORIZED) {
      return tx.paymentCollection.update({
        where: { tenantId_id: { tenantId, id: collectionId } },
        data: { status: PaymentCollectionStatus.COMPLETED },
      });
    }

    if (
      paymentStatus === PaymentStatus.FAILED ||
      paymentStatus === PaymentStatus.CANCELED
    ) {
      return tx.paymentCollection.update({
        where: { tenantId_id: { tenantId, id: collectionId } },
        data: { status: PaymentCollectionStatus.CANCELED },
      });
    }

    return null;
  }

  /* -------------------------------------------------
   * PaymentWebhookEvent (idempotency + audit)
   * ------------------------------------------------- */

  /**
   * Deterministik eventId üret:
   * - provider + externalRef + signature + rawBody -> sha256
   * Not: provider kendi eventId'sini veriyorsa (stripe event.id gibi) bunu direkt kullanmak daha iyi,
   * ama şu an DTO'da yok, o yüzden hash ile stabil gidiyoruz.
   */
  makeEventId(
    headers: Record<string, string | string[] | undefined>,
    provider: PaymentProvider,
    externalRef: string | null | undefined,
    rawBody: string
  ) {
    const pick = (k: string) => {
      const v = headers[k] ?? headers[k.toLowerCase()];
      if (Array.isArray(v)) return v.join(",");
      return v ?? "";
    };

    // yaygın imzalar (opsiyonel)
    const signature =
      pick("stripe-signature") ||
      pick("x-signature") ||
      pick("x-paytr-signature") ||
      pick("x-verifone-signature") ||
      "";

    const base = [
      "v1",
      provider,
      externalRef ?? "",
      signature,
      rawBody ?? "",
    ].join("|");

    return crypto.createHash("sha256").update(base).digest("hex");
  }

  createEventIfNew(
    tx: Tx,
    params: {
      tenantId: string;
      provider: PaymentProvider;
      eventId: string;
      externalRef?: string | null;
      signature?: string | null;
      status?: PaymentStatus | null;
      rawPayload: Record<string, any>;
    }
  ) {
    const {
      tenantId,
      provider,
      eventId,
      externalRef,
      signature,
      status,
      rawPayload,
    } = params;

    // @@unique([tenantId, provider, eventId])
    return tx.paymentWebhookEvent.upsert({
      where: {
        tenantId_provider_eventId: { tenantId, provider, eventId },
      },
      update: {},
      create: {
        tenantId,
        provider,
        eventId,
        externalRef: externalRef ?? null,
        status: status ?? null,
        signature: signature ?? null,
        payload: rawPayload as any,
      },
      select: {
        id: true,
        tenantId: true,
        provider: true,
        eventId: true,
        processedAt: true,
        ok: true,
        error: true,
      },
    });
  }

  getEvent(
    tx: Tx,
    params: { tenantId: string; provider: PaymentProvider; eventId: string }
  ) {
    const { tenantId, provider, eventId } = params;
    return tx.paymentWebhookEvent.findUnique({
      where: {
        tenantId_provider_eventId: { tenantId, provider, eventId },
      },
    });
  }

  markEventProcessed(
    tx: Tx,
    params: {
      tenantId: string;
      provider: PaymentProvider;
      eventId: string;
      ok: boolean;
      errorMessage?: string | null;
    }
  ) {
    const { tenantId, provider, eventId, ok, errorMessage } = params;

    return tx.paymentWebhookEvent.update({
      where: {
        tenantId_provider_eventId: { tenantId, provider, eventId },
      },
      data: {
        processedAt: new Date(),
        ok,
        error: ok ? null : errorMessage ?? "unknown",
      },
    });
  }
}
