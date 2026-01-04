// src/modules/checkout/common/mappers/checkout.mapper.ts

import type {
  CheckoutAddressType,
  AvailableProvider,
} from "../types/checkout.types";

/**
 * Mapper, domain shape'i varsaymaz.
 * Structural typing kullanır.
 */
type CheckoutLike = {
  id: string;
  status: string;
  currencyCode: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  createdAt: Date;
  updatedAt: Date;

  billingAddress?: CheckoutAddressLike | null;
  shippingAddress?: CheckoutAddressLike | null;
  availablePaymentProviders?: AvailableProvider[];
};

type CheckoutAddressLike = {
  type: CheckoutAddressType;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  postalCode: string;
  countryCode: string;
};

export class CheckoutMapper {
  static toResponse(checkout: CheckoutLike) {
    return {
      id: checkout.id,
      status: checkout.status,
      currencyCode: checkout.currencyCode,
      subtotal: checkout.subtotal,
      discountTotal: checkout.discountTotal,
      shippingTotal: checkout.shippingTotal,
      taxTotal: checkout.taxTotal,
      grandTotal: checkout.grandTotal,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt,
    };
  }

  static toDetailedResponse(checkout: CheckoutLike) {
    return {
      ...CheckoutMapper.toResponse(checkout),
      billingAddress: checkout.billingAddress
        ? CheckoutMapper.mapAddress(checkout.billingAddress)
        : null,
      shippingAddress: checkout.shippingAddress
        ? CheckoutMapper.mapAddress(checkout.shippingAddress)
        : null,
      availablePaymentProviders:
        checkout.availablePaymentProviders?.map((p) => ({
          provider: p.provider,
          reason: p.reason,
        })) ?? [],
    };
  }

  private static mapAddress(address: CheckoutAddressLike) {
    return {
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone ?? null,
      address1: address.address1,
      address2: address.address2 ?? null,
      city: address.city,
      postalCode: address.postalCode,
      countryCode: address.countryCode,
    };
  }
}
