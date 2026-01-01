import { env } from "@/config/env";

export const COOKIE_NAMES = {
  adminRefresh: "admin_refresh",
  storeRefresh: "store_refresh",
  adminAccess: "admin_at",
  storeAccess: "store_at",
} as const;

const isProd = () => env.NODE_ENV === "production";
const isTest = () => env.NODE_ENV === "test";

function isSecure() {
  if (isTest()) return false; // e2e http
  if (isProd()) return true; // prod https
  return !!env.COOKIE_SECURE; // dev
}

function sameSite() {
  if (isTest()) return "lax" as const;
  return isProd() ? ("none" as const) : ("lax" as const);
}

function cookieDomain() {
  // ✅ testte domain verme: supertest agent en stabil
  if (isTest()) return undefined;
  return isProd() ? env.COOKIE_DOMAIN || undefined : undefined;
}

function accessMaxAgeSeconds() {
  const s = Number(env.ACCESS_TOKEN_TTL_SECONDS);
  return Number.isFinite(s) && s > 0 ? s : 15 * 60;
}

function refreshMaxAgeSeconds() {
  const d = Number(env.REFRESH_TTL_DAYS);
  const days = Number.isFinite(d) && d > 0 ? d : 30;
  return days * 24 * 60 * 60;
}

/**
 * ✅ ADMIN: tek scope, tek davranış
 * /api/admin altında her endpoint cookie’leri görür.
 */
const ADMIN_PATH = "/api/admin";

export function adminAccessCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecure(),
    sameSite: sameSite(),
    domain: cookieDomain(),
    path: ADMIN_PATH,
    maxAge: accessMaxAgeSeconds(),
  };
}

export function adminRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecure(),
    sameSite: sameSite(),
    domain: cookieDomain(),
    path: ADMIN_PATH,
    maxAge: refreshMaxAgeSeconds(),
  };
}

export function clearAdminAccessCookieOptions() {
  return {
    domain: cookieDomain(),
    path: ADMIN_PATH,
  };
}

export function clearAdminRefreshCookieOptions() {
  return {
    domain: cookieDomain(),
    path: ADMIN_PATH,
  };
}

/**
 * ✅ STORE: tek scope
 */
const STORE_PATH = "/api/store";

export function storeAccessCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecure(),
    sameSite: sameSite(),
    domain: cookieDomain(),
    path: STORE_PATH,
    maxAge: accessMaxAgeSeconds(),
  };
}

export function storeRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecure(),
    sameSite: sameSite(),
    domain: cookieDomain(),
    path: STORE_PATH,
    maxAge: refreshMaxAgeSeconds(),
  };
}

export function clearStoreAccessCookieOptions() {
  return {
    domain: cookieDomain(),
    path: STORE_PATH,
  };
}

export function clearStoreRefreshCookieOptions() {
  return {
    domain: cookieDomain(),
    path: STORE_PATH,
  };
}
