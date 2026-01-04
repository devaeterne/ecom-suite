import { UnauthorizedException } from "@nestjs/common";
import type {
  AdminAuthContext,
  AdminTokenPayload,
} from "../types/admin-request";
import { ADMIN_AUTH_ERRORS } from "../constants/admin-auth.constants";

export function requireAdminAuth(ctx: AdminAuthContext): AdminTokenPayload {
  const u = ctx.user;
  if (!u?.sub)
    throw new UnauthorizedException(ADMIN_AUTH_ERRORS.UNAUTHENTICATED);
  if (u.typ !== "admin")
    throw new UnauthorizedException(ADMIN_AUTH_ERRORS.INVALID_TOKEN_TYPE);
  return u;
}

export function getTenantIdOrThrow(ctx: AdminAuthContext): string {
  return (
    ctx.tenantId ??
    ctx.tenant?.id ??
    (ctx.user?.tenantId as string | undefined) ??
    (() => {
      throw new UnauthorizedException("Tenant not resolved");
    })()
  );
}

export function getIdentityIdOrThrow(ctx: AdminAuthContext): string {
  const u = requireAdminAuth(ctx);
  return (u.identityId as string | undefined) ?? u.sub;
}
