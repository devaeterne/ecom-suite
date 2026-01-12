import { BadRequestException } from "@nestjs/common";

/**
 * TenantContextMiddleware hangi field'a yazıyorsa onu oku.
 * Fallback: header'lardan oku.
 */
export function getTenantIdOrThrow(req: any): string {
  const tenantId =
    req?.tenantId ??
    req?.context?.tenantId ??
    (req?.headers?.["x-tenant-id"] as string | undefined) ??
    (req?.headers?.["x-tenantid"] as string | undefined) ??
    (req?.headers?.["x-tenant-code"] as string | undefined); // eğer code ile map ediyorsan ayrıca çözmen gerekir

  if (!tenantId) {
    throw new BadRequestException({
      code: "TENANT_REQUIRED",
      message: "Tenant id is required",
    });
  }

  return tenantId;
}
