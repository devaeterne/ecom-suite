// src/modules/checkout/common/policies/checkout.tenancy.ts
import { UnauthorizedException } from "@nestjs/common";
import type { StoreAuthContext } from "@/modules/auth/store/common/types/store-request";
import { CHECKOUT_ERRORS } from "@/modules/checkout/common/constants/checkout.constants";
import { requireStoreAuth } from "./checkout.auth";

export function getTenantIdOrThrow(req: StoreAuthContext): string {
  requireStoreAuth(req);

  const tenantId =
    req?.tenant?.id ?? req?.user?.tenantId ?? (req as any)?.tenantId;

  if (!tenantId) {
    throw new UnauthorizedException(CHECKOUT_ERRORS.TENANT_NOT_RESOLVED);
  }

  return tenantId;
}
