import type { ShippingOption, ShippingProvider } from "@prisma/client";
import { ShippingOptionDto } from "../dto/shipping-option.dto";

export type ShippingOptionPresenter = {
  id: string;
  profileId: string;
  name: string;
  provider: ShippingProvider;
  isActive: boolean;

  amount: number | null;
  currencyCode: string;

  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

function safeMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function presentShippingOption(
  model: ShippingOption
): ShippingOptionDto {
  return {
    id: model.id,
    profileId: model.profileId,
    name: model.name,
    provider: model.provider,
    isActive: model.isActive,
    amount: model.amount ?? null,
    currencyCode: model.currencyCode ?? "EUR",
    metadata: (model.metadata ?? {}) as Record<string, unknown>,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

export function presentShippingOptions(
  options: ShippingOption[]
): ShippingOptionPresenter[] {
  return options.map(presentShippingOption);
}
