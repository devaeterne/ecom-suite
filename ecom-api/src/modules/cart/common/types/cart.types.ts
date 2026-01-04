export type CurrencyCode = "EUR" | "USD" | "TRY" | string;

export type Money = {
  amount: number; // minor unit değil; senin tablolar "amount Int" gibi görünüyor => burada direkt Int kabul ediyoruz
  currencyCode: CurrencyCode;
};

export type CartStatus = "ACTIVE" | "ABANDONED" | "COMPLETED" | string;

export type CartLineItem = {
  id: string;
  variantId: string;
  quantity: number;

  unitPrice: Money;
  compareAtPrice?: Money | null;

  sku?: string | null;
  title?: string | null;

  metadata?: Record<string, any>;
};

export type CartDiscount = {
  code: string;
  amount: Money;
  description?: string;
};

export type CartShipping = {
  shippingOptionId: string;
  amount: Money;
};

export type CartTotals = {
  subtotal: Money;
  discountTotal: Money;
  shippingTotal: Money;
  taxTotal: Money;
  grandTotal: Money;
};

export type Cart = {
  id: string;
  tenantId: string;

  customerId?: string | null;
  email?: string | null;

  status: CartStatus;
  currencyCode: CurrencyCode;

  items: CartLineItem[];
  discounts: CartDiscount[];
  shipping?: CartShipping;

  totals: CartTotals;

  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;

  metadata?: Record<string, any>;
};
