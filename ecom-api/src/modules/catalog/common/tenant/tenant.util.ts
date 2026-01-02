import type { Request } from "express";

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
    v
  );
}
