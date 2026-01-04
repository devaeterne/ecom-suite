import { ForbiddenException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { PaymentProvider } from "@prisma/client";

/**
 * Güvenlik standardı:
 * - Header: x-tenant-id
 * - Header: x-payments-webhook-timestamp (unix seconds)
 * - Header: x-payments-webhook-signature (hex)
 *
 * signature = HMAC_SHA256(secret, `${timestamp}.${rawBody}`)
 * timestamp drift: +- 300s
 *
 * Env:
 *  PAYMENTS_WEBHOOK_SECRET_<PROVIDER>=...
 *  örn PAYMENTS_WEBHOOK_SECRET_STRIPE=...
 */
export function assertWebhookSignature(params: {
  headers: any;
  provider: PaymentProvider;
  rawBody: Buffer | string;
}) {
  const { headers, provider } = params;

  const tsRaw =
    headers?.["x-payments-webhook-timestamp"] ??
    headers?.["X-Payments-Webhook-Timestamp"];

  const sigRaw =
    headers?.["x-payments-webhook-signature"] ??
    headers?.["X-Payments-Webhook-Signature"];

  if (!tsRaw || !sigRaw) {
    throw new ForbiddenException("missing webhook signature headers");
  }

  const ts = Number(tsRaw);
  if (!Number.isFinite(ts)) {
    throw new ForbiddenException("invalid webhook timestamp");
  }

  const now = Math.floor(Date.now() / 1000);
  const drift = Math.abs(now - ts);
  if (drift > 300) {
    throw new ForbiddenException("webhook timestamp drift too large");
  }

  const envKey = `PAYMENTS_WEBHOOK_SECRET_${String(provider).toUpperCase()}`;
  const secret = process.env[envKey];
  if (!secret) {
    throw new ForbiddenException(`webhook secret not configured: ${envKey}`);
  }

  const bodyStr = Buffer.isBuffer(params.rawBody)
    ? params.rawBody.toString("utf8")
    : String(params.rawBody ?? "");

  const expected = createHmac("sha256", secret)
    .update(`${ts}.${bodyStr}`, "utf8")
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(sigRaw), "utf8");

  // length mismatch => fail fast
  if (a.length !== b.length) throw new ForbiddenException("invalid signature");

  if (!timingSafeEqual(a, b)) throw new ForbiddenException("invalid signature");
}
