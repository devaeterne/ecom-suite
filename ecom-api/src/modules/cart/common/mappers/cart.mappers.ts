// src/modules/cart/common/mappers/cart.mappers.ts
import { Cart, Money } from "@/modules/cart/common/types/cart.types";
import type { CartComputedTotals } from "@/modules/cart/common/services/cart-totals.service";

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

  // legacy (tamamen emekli): mapper kullanmıyor
  adjustments?: Array<{
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
    deletedAt?: Date | null;
  }>;

  // ✅ source-of-truth discounts
  cartDiscountApplications?: Array<{
    id: string;
    deletedAt: Date | null;

    codeSnapshot: string | null;

    methodSnapshot: string;
    valueBpSnapshot: number | null;
    valueSnapshot: number | null;
    currencyCodeSnapshot: string | null;

    discountTotal: number;

    discount?: {
      id: string;
      code: string | null;
    } | null;
  }>;
};

export function prismaCartToDomain(
  entity: PrismaCartEntity,
  computed?: CartComputedTotals
): Cart {
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

  // ✅ discounts: %100 cartDiscountApplications (deletedAt=null)
  const discounts = (entity.cartDiscountApplications ?? [])
    .filter((a) => a && a.deletedAt == null)
    .map((a) => {
      const code = a.codeSnapshot ?? a.discount?.code ?? undefined;

      return {
        code: code ?? "COUPON",
        description: "Discount applied",
        amount: money(
          a.discountTotal ?? 0,
          a.currencyCodeSnapshot ?? currencyCode
        ),
      };
    });

  const shippingRow =
    (entity.shippingMethods ?? []).find((x: any) => x.deletedAt == null) ??
    null;

  const shipping = shippingRow
    ? {
        shippingOptionId: shippingRow.shippingOptionId,
        amount: money(
          shippingRow.amount ?? 0,
          shippingRow.currencyCode ?? currencyCode
        ),
      }
    : undefined;

  const totals = computed
    ? {
        subtotal: money(computed.subtotal, computed.currencyCode),
        discountTotal: money(computed.discountTotal, computed.currencyCode),
        shippingTotal: money(computed.shippingTotal, computed.currencyCode),
        taxTotal: money(computed.taxTotal, computed.currencyCode),
        grandTotal: money(computed.grandTotal, computed.currencyCode),
      }
    : {
        subtotal: money(0, currencyCode),
        discountTotal: money(0, currencyCode),
        shippingTotal: money(0, currencyCode),
        taxTotal: money(0, currencyCode),
        grandTotal: money(0, currencyCode),
      };

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

    totals,

    expiresAt: toIso(entity.expiresAt),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),

    metadata: entity.metadata ?? {},
  };
}

export function cartToResponseDto(cart: Cart) {
  return cart;
}
