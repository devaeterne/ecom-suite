// src/modules/auth/admin/common/constants/admin-auth.constants.ts

export const ADMIN_AUTH_TOKEN_TYPE = "admin" as const;
export type ADMIN_AUTH_TOKEN_TYPE = typeof ADMIN_AUTH_TOKEN_TYPE;

export const ADMIN_AUTH_ERRORS = {
  UNAUTHENTICATED: "Unauthenticated",
  INVALID_TOKEN: "Invalid token",
  INVALID_TOKEN_TYPE: "Invalid token type",
  MISSING_ACCESS_TOKEN: "Missing access token",
  MISSING_REFRESH_COOKIE: "Missing refresh cookie",
  INVALID_CREDENTIALS: "Invalid credentials",
  SESSION_EXPIRED: "Session expired",
  SESSION_INVALID: "Invalid session",
  REFRESH_REUSE: "Refresh reuse detected",
} as const;

export const ADMIN_AUTH_LIMITS = {
  MAX_ACTIVE_SESSIONS: 10,
} as const;
