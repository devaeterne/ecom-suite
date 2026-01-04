// src/modules/auth/store/store-request.ts
import type { Request } from "express";

/**
 * Store token payload standardı.
 * - sub: customerId (JWT subject)
 * - typ: token discriminator ("store")
 * - tenantId: multi-tenant context (opsiyonel)
 */
export type StoreTokenPayload = {
  [k: string]: unknown;
  sub: string;
  typ: "store";
  tenantId?: string;
};

/**
 * Store request contract (tek kaynak).
 * Guard ve middleware'lerin req üzerine yazdığı alanlar burada konsolide edilir.
 *
 * Kurumsal prensip:
 * - Request shape tek yerde tanımlanır
 * - Modüller (checkout/customers/cart) kendi StoreRequest tipini üretmez
 */
export type StoreRequest = Request & {
  user?: StoreTokenPayload;

  // Tenant context (tenant-context.middleware) veya guard set edebilir
  tenant?: { id: string };
  tenantId?: string;

  // Guard convenience: customerId
  customerId?: string;

  // Observability/debug (token kaynağı)
  auth?: { source?: "header" | "cookie" };
};

/**
 * Backward compat alias:
 * Eski isimleri kullanan yerler varsa kırılmasın diye.
 */
export type StoreAuthContext = StoreRequest;
