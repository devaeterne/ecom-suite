// src/modules/checkout/common/types/checkout.types.ts
import type { PaymentProvider } from "@prisma/client";

/**
 * Prisma tarafında enum yoksa (CheckoutAddressType export edilmiyorsa)
 * domain-level string union kullanıyoruz.
 */
export type CheckoutAddressType = "SHIPPING" | "BILLING";

export type AvailableProvider = {
  provider: PaymentProvider;
  reason: string;
};
