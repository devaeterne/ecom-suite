import type { ShippingCarrier } from "@prisma/client";
import { ShippingCarrierDto } from "../dto/shipping-option.dto";

export type ShippingCarrierPresenter = {
  id: string;
  name: string;
  code: string | null;
  provider: string | null;
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

export function presentShippingCarrier(
  model: ShippingCarrier
): ShippingCarrierDto {
  return {
    id: model.id,
    name: model.name,
    code: model.code ?? null,
    provider: model.provider ?? null,
    metadata: (model.metadata ?? {}) as Record<string, unknown>,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

export function presentShippingCarriers(
  carriers: ShippingCarrier[]
): ShippingCarrierPresenter[] {
  return carriers.map(presentShippingCarrier);
}
