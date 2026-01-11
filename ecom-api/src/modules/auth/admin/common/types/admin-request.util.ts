import { UnauthorizedException } from "@nestjs/common";
import type { AdminAuthContext } from "./admin-request";

export function requireAdminTenantId(req: AdminAuthContext): string {
  const tenantId = req.tenantId ?? req.tenant?.id ?? req.user?.tenantId;
  if (!tenantId) throw new UnauthorizedException("TENANT_ID_MISSING");
  return tenantId;
}
