// src/modules/auth/admin/common/types/admin-auth.types.ts

import type { Request } from "express";
import type { ADMIN_AUTH_TOKEN_TYPE } from "../constants/admin-auth.constants";

/**
 * JWT payload – admin access token
 */
export type AdminTokenPayload = {
  [key: string]: unknown;
  sub: string; // admin identity id
  typ: typeof ADMIN_AUTH_TOKEN_TYPE;
  tenantId?: string;
  roleIds?: string[];
};

/**
 * Admin request context
 * Guard tarafından enrich edilir
 */
export type AdminAuthContext = Request & {
  user?: AdminTokenPayload;
  tenant?: { id: string };
  tenantId?: string;
  adminId?: string;
  auth?: {
    source?: "header" | "cookie";
  };
};
