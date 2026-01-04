// src/modules/checkout/common/constants/checkout.constants.ts

export const CHECKOUT_DEFAULT_CURRENCY = "EUR" as const;

export const CHECKOUT_ERRORS = {
  UNAUTHENTICATED: "Unauthenticated",
  TENANT_NOT_RESOLVED: "Tenant not resolved",
  CUSTOMER_NOT_RESOLVED: "Customer not resolved",
  CHECKOUT_NOT_FOUND: "Checkout not found",
  FORBIDDEN: "Forbidden",
  UNKNOWN_COUNTRY: "Unknown countryIso2",
} as const;
