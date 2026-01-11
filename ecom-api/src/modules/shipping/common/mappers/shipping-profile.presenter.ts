import type { ShippingProfile, ShippingProfileType } from "@prisma/client";
import { ShippingProfileDto } from "../dto/shipping-option.dto";

export type ShippingProfilePresenter = {
  id: string;
  name: string;
  type: ShippingProfileType;
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

export function presentShippingProfile(
  model: ShippingProfile
): ShippingProfileDto {
  return {
    id: model.id,
    name: model.name,
    type: model.type,
    metadata: (model.metadata ?? {}) as Record<string, unknown>,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

export function presentShippingProfiles(
  profiles: ShippingProfile[]
): ShippingProfilePresenter[] {
  return profiles.map(presentShippingProfile);
}
