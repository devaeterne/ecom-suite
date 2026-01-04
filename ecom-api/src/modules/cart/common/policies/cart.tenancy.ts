import { Request } from "express";

/**
 * TenantId kaynağı: tenant.json (user dediği gibi).
 * Senin projende tenant-bootstrap middleware request'e ekliyor olmalı.
 *
 * Burada 2 olası alanı destekliyoruz:
 * - req.tenantId
 * - req.tenant?.id
 */
export function getTenantIdOrThrow(req: Request): string {
  const anyReq = req as any;
  const tenantId: string | undefined = anyReq.tenantId ?? anyReq.tenant?.id;
  if (!tenantId) {
    // Multi-tenant yok ama schema zorunlu => tenant bootstrap şart.
    throw new Error(
      "Missing tenantId on request. Ensure tenant-bootstrap sets req.tenantId (from tenant.json)."
    );
  }
  return tenantId;
}
