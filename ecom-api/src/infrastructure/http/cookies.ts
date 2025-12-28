import { env } from "@/config/env";

export const COOKIE_NAMES = {
  adminRefresh: "admin_refresh",
  storeRefresh: "store_refresh",
} as const;

function isProd() {
  return env.NODE_ENV === "production";
}

/**
 * Admin refresh cookie sadece refresh endpoint’ine scoped.
 * Böylece XSS olsa bile erişemez (HttpOnly) ve gereksiz endpoint’lere taşınmaz.
 */
export function adminRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: isProd() ? ("none" as const) : ("lax" as const),
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/api/admin/auth/refresh",
    maxAge: env.REFRESH_TTL_DAYS * 24 * 60 * 60, // seconds
  };
}

export function clearAdminRefreshCookieOptions() {
  return {
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/api/admin/auth/refresh",
  };
}

/**
 * Store refresh cookie sadece store refresh endpoint’ine scoped.
 */
export function storeRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: isProd() ? ("none" as const) : ("lax" as const),
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/api/store/auth/refresh",
    maxAge: env.REFRESH_TTL_DAYS * 24 * 60 * 60,
  };
}

export function clearStoreRefreshCookieOptions() {
  return {
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/api/store/auth/refresh",
  };
}
