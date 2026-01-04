// src/modules/customers/common/policies/customer.auth.ts
import { UnauthorizedException } from "@nestjs/common";
import type { StoreAuthContext } from "@/modules/auth/store/common/types/store-request";
import { CUSTOMER_ERRORS } from "@/modules/customers/common/constants/customer.constants";

/**
 * Customers modülü store auth context ile çalışır.
 * Sözleşme: req.user.typ === "store" ve req.user.sub customerId'yi taşır.
 */
export function requireStoreAuth(req: StoreAuthContext): StoreAuthContext {
  const u = req?.user;
  if (!u) throw new UnauthorizedException(CUSTOMER_ERRORS.UNAUTHENTICATED);
  if (u.typ !== "store") throw new UnauthorizedException("Invalid token type");
  if (!u.sub) throw new UnauthorizedException(CUSTOMER_ERRORS.UNAUTHENTICATED);
  return req;
}

export function getCustomerIdOrThrow(req: StoreAuthContext): string {
  requireStoreAuth(req);
  return req.user!.sub;
}
