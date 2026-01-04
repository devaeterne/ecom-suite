// src/infrastructure/http/cookies.ts

import { env } from "@/config/env";

type SameSite = "lax" | "strict" | "none";

// Fastify cookie options tipi zorlamayalım; Nest/Fastify tarafı zaten uyumluyor
export type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: SameSite;
  path: "/";
  domain?: string;
};

function resolveCookieDomain(): string | undefined {
  const anyEnv = env as any;

  if (typeof anyEnv.COOKIE_DOMAIN === "string" && anyEnv.COOKIE_DOMAIN.length) {
    return anyEnv.COOKIE_DOMAIN; // örn: ".domain.com"
  }
  if (typeof anyEnv.ROOT_DOMAIN === "string" && anyEnv.ROOT_DOMAIN.length) {
    return `.${anyEnv.ROOT_DOMAIN}`;
  }

  return undefined;
}

function baseCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === "production";
  const sameSite: SameSite = isProd ? "none" : "lax";

  const domain = isProd ? resolveCookieDomain() : undefined;

  return {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

/**
 * Backward compatible cookie names:
 * Kod tabanı COOKIE_NAMES.adminAccess vb bekliyor.
 */
export const COOKIE_NAMES = {
  // legacy keys
  adminAccess: "admin_access_token",
  adminRefresh: "admin_refresh_token",
  storeAccess: "store_access_token",
  storeRefresh: "store_refresh_token",

  // yeni sabitler (ileride geçiş)
  ADMIN_ACCESS: "admin_access_token",
  ADMIN_REFRESH: "admin_refresh_token",
  STORE_ACCESS: "store_access_token",
  STORE_REFRESH: "store_refresh_token",
} as const;

// ✅ Legacy factory exports (controllers CALL these)
export function adminAccessCookieOptions(): CookieOptions {
  return baseCookieOptions();
}
export function adminRefreshCookieOptions(): CookieOptions {
  return baseCookieOptions();
}
export function storeAccessCookieOptions(): CookieOptions {
  return baseCookieOptions();
}
export function storeRefreshCookieOptions(): CookieOptions {
  return baseCookieOptions();
}

export function clearAdminAccessCookieOptions(): CookieOptions {
  return baseCookieOptions();
}
export function clearAdminRefreshCookieOptions(): CookieOptions {
  return baseCookieOptions();
}
export function clearStoreAccessCookieOptions(): CookieOptions {
  return baseCookieOptions();
}
export function clearStoreRefreshCookieOptions(): CookieOptions {
  return baseCookieOptions();
}
