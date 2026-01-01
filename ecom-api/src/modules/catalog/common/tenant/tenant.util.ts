import { BadRequestException } from "@nestjs/common";

export const TENANT_HEADER = "x-tenant-id";

export function requireTenantId(headers: Record<string, any>): string {
  const raw =
    headers?.[TENANT_HEADER] ?? headers?.[TENANT_HEADER.toLowerCase()];
  const tenantId = Array.isArray(raw) ? raw[0] : raw;

  if (!tenantId || typeof tenantId !== "string") {
    throw new BadRequestException(`Missing required header: ${TENANT_HEADER}`);
  }

  return tenantId;
}
