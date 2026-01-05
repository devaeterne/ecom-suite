// src/module/auth/admin/common/types/admin-request.ts
import type { Request } from "express";

export type AdminTokenPayload = {
  [k: string]: unknown;
  sub: string; // identityId (veya userId değil, admin tarafında identity daha doğru)
  typ: "admin";
  tenantId?: string;
  identityId?: string; // permission & audit için kritik
};

export type AdminAuthContext = Request & {
  user?: AdminTokenPayload;

  // tenant-context middleware set ediyorsa
  tenant?: { id: string };

  // guard convenience
  tenantId?: string;
  adminId?: string; // çoğu yerde identityId gibi kullanacaksın
  identityId?: string;

  auth?: { source?: "header" | "cookie" };
};
