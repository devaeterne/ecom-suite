// src/modules/customers/common/policies/customer.tenancy.ts
import { UnauthorizedException } from "@nestjs/common";
import type { StoreAuthContext } from "@/modules/auth/store/common/types/store-request";
import { CUSTOMER_ERRORS } from "@/modules/customers/common/constants/customer.constants";
import { requireStoreAuth } from "./customer.auth";

/**
 * tenant resolution:
 * - prefer req.tenant.id (tenant middleware)
 * - fallback req.user.tenantId (token payload)
 * - fallback req.tenantId (guard convenience)
 */
export function getTenantIdOrThrow(req: StoreAuthContext): string {
  requireStoreAuth(req);

  const tenantId =
    req?.tenant?.id ?? req?.user?.tenantId ?? (req as any)?.tenantId;

  if (!tenantId)
    throw new UnauthorizedException(CUSTOMER_ERRORS.TENANT_NOT_RESOLVED);

  return tenantId;
}
