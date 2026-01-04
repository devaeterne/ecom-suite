import { Cart, Money } from "@/modules/cart/common/types/cart.types";

function money(amount: number | null | undefined, currencyCode: string): Money {
  return { amount: amount ?? 0, currencyCode };
}

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export type PrismaCartEntity = {
  id: string;
  tenantId: string;

  customerId: string | null;
  email: string | null;

  status: string;
  currencyCode: string;

  subtotal: number | null;
  discountTotal: number | null;
  shippingTotal: number | null;
  taxTotal: number | null;
  grandTotal: number | null;

  expiresAt: Date | null;

  metadata: any;

  createdAt: Date;
  updatedAt: Date;

  lineItems: Array<{
    id: string;
    variantId: string;
    quantity: number;

    unitPriceSnapshot: number | null;
    compareAtSnapshot: number | null;

    skuSnapshot: string | null;
    titleSnapshot: string | null;

    metadata: any;
  }>;

  adjustments: Array<{
    id: string;
    type: string; // DISCOUNT
    code: string | null;
    description: string | null;
    amount: number | null;
  }>;

  shippingMethods: Array<{
    id: string;
    shippingOptionId: string;
    amount: number | null;
    currencyCode: string | null;
  }>;
};

export function prismaCartToDomain(entity: PrismaCartEntity): Cart {
  const currencyCode = entity.currencyCode ?? "EUR";

  const items = (entity.lineItems ?? []).map((li) => ({
    id: li.id,
    variantId: li.variantId,
    quantity: li.quantity,
    unitPrice: money(li.unitPriceSnapshot ?? 0, currencyCode),
    compareAtPrice: li.compareAtSnapshot
      ? money(li.compareAtSnapshot, currencyCode)
      : null,
    sku: li.skuSnapshot,
    title: li.titleSnapshot,
    metadata: li.metadata ?? {},
  }));

  const discounts = (entity.adjustments ?? [])
    .filter((a) => a.type === "DISCOUNT" && !!a.code)
    .map((a) => ({
      code: a.code!,
      description: a.description ?? undefined,
      amount: money(a.amount ?? 0, currencyCode),
    }));

  const shippingRow = (entity.shippingMethods ?? [])[0];
  const shipping = shippingRow
    ? {
        shippingOptionId: shippingRow.shippingOptionId,
        amount: money(
          shippingRow.amount ?? 0,
          shippingRow.currencyCode ?? currencyCode
        ),
      }
    : undefined;

  return {
    id: entity.id,
    tenantId: entity.tenantId,
    customerId: entity.customerId,
    email: entity.email,

    status: entity.status,
    currencyCode,

    items,
    discounts,
    shipping,

    totals: {
      subtotal: money(entity.subtotal, currencyCode),
      discountTotal: money(entity.discountTotal, currencyCode),
      shippingTotal: money(entity.shippingTotal, currencyCode),
      taxTotal: money(entity.taxTotal, currencyCode),
      grandTotal: money(entity.grandTotal, currencyCode),
    },

    expiresAt: toIso(entity.expiresAt),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),

    metadata: entity.metadata ?? {},
  };
}

/**
 * Storefront response DTO mapper:
 * - Domain => API response
 * - İstersen burada field isimlerini sabit tutarız (items/discounts/totals vs.)
 */
export function cartToResponseDto(cart: Cart) {
  return cart;
}
