// src/modules/payments/public/services/payments.webhook.services.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PaymentsRepo } from "@/modules/payments/common/prisma/payments.repo";
import { PaymentWebhookDto } from "@/modules/payments/store/dto/payment-webhook.dto";

@Injectable()
export class PaymentsWebhookService {
  constructor(private readonly repo: PaymentsRepo) {}

  private getTenantIdFromHeaders(headers: any): string {
    const v =
      headers?.["x-tenant-id"] ??
      headers?.["X-Tenant-Id"] ??
      headers?.["x-tenant"] ??
      headers?.["X-Tenant"];

    if (!v || typeof v !== "string") {
      throw new NotFoundException("tenant header missing: x-tenant-id");
    }
    return v;
  }

  async handleWebhook(params: {
    headers: any;
    dto: PaymentWebhookDto;
    rawBody: Buffer | string;
  }) {
    const { headers, dto, rawBody } = params;
    const tenantId = this.getTenantIdFromHeaders(headers);

    // repo.makeEventId string bekliyorsa güvene al
    const rawBodyStr =
      typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");

    return this.repo.transaction(async (tx) => {
      const signature =
        headers?.["x-payments-webhook-signature"] ??
        headers?.["X-Payments-Webhook-Signature"] ??
        null;

      const eventId = this.repo.makeEventId(
        headers,
        dto.provider,
        dto.externalRef ?? null,
        rawBodyStr
      );

      // 1) Event'i kaydet (idempotent)
      await this.repo.createEventIfNew(tx, {
        tenantId,
        provider: dto.provider,
        eventId,
        externalRef: dto.externalRef ?? null,
        signature: typeof signature === "string" ? signature : null,
        status: dto.status ?? null,
        rawPayload: dto.rawPayload ?? {}, // ✅ payload değil
      });

      // 2) Daha önce işlendi mi?
      const existing = await this.repo.getEvent(tx, {
        tenantId,
        provider: dto.provider,
        eventId,
      });

      if (existing?.processedAt && existing.ok) {
        return { ok: true, idempotent: true };
      }

      try {
        const payment = await this.repo.findPaymentByProviderExternalRef(tx, {
          tenantId,
          provider: dto.provider,
          externalRef: dto.externalRef,
        });

        if (!payment) {
          throw new NotFoundException("payment not found for externalRef");
        }

        const updated = await this.repo.updatePaymentFromWebhook(tx, {
          tenantId,
          paymentId: payment.id,
          status: dto.status,
          rawPayload: dto.rawPayload ?? {},
          externalRef: dto.externalRef,
        });

        if (updated.collectionId) {
          await this.repo.finalizeCollectionStatusIfNeeded(tx, {
            tenantId,
            collectionId: updated.collectionId,
            paymentStatus: dto.status,
          });
        }

        await this.repo.markEventProcessed(tx, {
          tenantId,
          provider: dto.provider,
          eventId,
          ok: true,
        });

        return { ok: true, idempotent: false };
      } catch (e: any) {
        await this.repo.markEventProcessed(tx, {
          tenantId,
          provider: dto.provider,
          eventId,
          ok: false,
          errorMessage: e?.message ?? "unknown webhook error", // ✅ error değil
        });
        throw e;
      }
    });
  }
}
