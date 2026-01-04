// src/modules/checkout/common/policies/checkout.auth.ts
import { UnauthorizedException } from "@nestjs/common";
import type { StoreAuthContext } from "@/modules/auth/store/store-request";
import { CHECKOUT_ERRORS } from "@/modules/checkout/common/constants/checkout.constants";

export function requireStoreAuth(req: StoreAuthContext): StoreAuthContext {
  const u = req?.user;
  if (!u) throw new UnauthorizedException(CHECKOUT_ERRORS.UNAUTHENTICATED);
  if (u.typ !== "store") throw new UnauthorizedException("Invalid token type");
  if (!u.sub) throw new UnauthorizedException(CHECKOUT_ERRORS.UNAUTHENTICATED);
  return req;
}

export function getCustomerIdOrThrow(req: StoreAuthContext): string {
  requireStoreAuth(req);
  return req.user!.sub;
}
