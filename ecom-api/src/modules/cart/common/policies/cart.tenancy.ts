import { Request } from "express";

/**
 * TenantId kaynağı: tenant.json (user dediği gibi).
 * Senin projende tenant-bootstrap middleware request'e ekliyor olmalı.
 *
 * Burada 2 olası alanı destekliyoruz:
 * - req.tenantId
 * - req.tenant?.id
 */
export function getTenantIdOrThrow(req: any): string {
  const tenantId =
    req?.tenantId ??
    req?.tenant?.id ??
    req?.tenant?.tenantId ??
    (req?.headers?.["x-tenant-id"] as string | undefined);

  if (!tenantId) {
    const err = new Error(
      "Missing tenantId on request. Ensure tenant context is set (middleware) or x-tenant-id header is provided."
    ) as any;
    err.status = 400;
    throw err;
  }

  return tenantId;
}
