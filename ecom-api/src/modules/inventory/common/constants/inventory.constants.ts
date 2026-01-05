export const INVENTORY = {
  RESERVATION_TTL_MINUTES: 10,
  // Checkout hangi statülerde reserve yapılabilir?
  RESERVE_ALLOWED_CHECKOUT_STATUSES: ["OPEN", "PAYMENT_PENDING"] as const,
} as const;

export type ReserveAllowedCheckoutStatus =
  (typeof INVENTORY.RESERVE_ALLOWED_CHECKOUT_STATUSES)[number];
