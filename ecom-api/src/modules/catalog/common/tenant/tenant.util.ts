import type { Request } from "express";
import { BadRequestException } from "@nestjs/common";

/**
 * Header standardı:
 * - testlerde: x-tenant-id (process.env.E2E_TENANT_ID)
 * - değer: UUID veya tenant code (örn "acme")
 */
export function getTenantHeaderValue(req: Request): string | null {
  const v = (req.headers?.["x-tenant-id"] as string | undefined)?.trim();
  return v?.length ? v : null;
}

/**
 * Hafif UUID kontrolü (Prisma uuid alanı için yeterli)
 */
export function isUuidLike(v: string): boolean {
  // 8-4-4-4-12
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v,
  );
}

/**
 * Request context'ten tenantId okur (Guard'lar tarafından set edilen alanları kullanır).
 * Öncelik:
 * - req.tenant.id (TenantGuard resolve ettiyse)
 * - req.tenantId (fallback)
 * - req.user.tenantId (token payload fallback)
 */
export function requireTenantId(req: any): string {
  const tenantId = req?.tenant?.id ?? req?.tenantId ?? req?.user?.tenantId;

  if (!tenantId || typeof tenantId !== "string") {
    throw new BadRequestException("Tenant context missing");
  }

  return tenantId;
}
