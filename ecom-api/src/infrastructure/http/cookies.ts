// src/infrastructure/http/cookies.ts

import { env } from "@/config/env";

export type SameSite = "lax" | "strict" | "none";

export type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: SameSite;
  path: "/";
  domain?: string;
};

export type CookieOptionsWithExtras = CookieOptions & {
  maxAge?: number;
  expires?: Date;
};

const isProd =
  String((env as any).NODE_ENV ?? process.env.NODE_ENV ?? "")
    .toLowerCase()
    .trim() === "production";

function normalizeBool(v: unknown, fallback: boolean) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "" || s === "0" || s === "false" || s === "no" || s === "off")
      return false;
    if (s === "1" || s === "true" || s === "yes" || s === "on") return true;
  }
  return fallback;
}

function normalizeCookieSecure(): boolean {
  const anyEnv = env as any;

  // Prod default: true, Dev default: false
  const fallback = isProd ? true : false;

  // Explicit env wins
  return normalizeBool(anyEnv.COOKIE_SECURE, fallback);
}

function resolveCookieDomain(): string | undefined {
  const anyEnv = env as any;
  const raw =
    typeof anyEnv.COOKIE_DOMAIN === "string" ? anyEnv.COOKIE_DOMAIN : "";
  const val = raw.trim();

  // Dev default: no domain attribute (host-only cookie)
  if (!val) return undefined;

  // Local hostlarda domain set etmek cookie’yi bozar
  if (val === "localhost" || val === "127.0.0.1") return undefined;

  // Domain’i prod’da bile yanlış girersen tüm auth çöker; burada normalize ediyoruz
  // ".domain.com" veya "domain.com" kabul, boşsa zaten undefined döndü.
  const nodeEnv = String(
    anyEnv.NODE_ENV ?? process.env.NODE_ENV ?? "",
  ).toLowerCase();
  if (nodeEnv !== "production") return undefined; // ✅ dev/test’te domain basma
  return val;
}

function normalizeSameSite(secure: boolean, override?: SameSite): SameSite {
  if (override) return override;

  // Cross-site cookie gerekiyorsa (admin.domain.com -> api.domain.com gibi) Secure+None gerekir.
  // Local HTTP’de Secure false => Lax daha stabil.
  return secure ? "none" : "lax";
}

export function baseCookieOptions(
  overrides: Partial<CookieOptionsWithExtras> = {},
): CookieOptionsWithExtras {
  const secure = normalizeCookieSecure();
  const domain = resolveCookieDomain();

  // Overrides secure/samesite/domain verebilir; ama default matrisi sağlam kalsın.
  const sameSite = normalizeSameSite(
    overrides.secure ?? secure,
    overrides.sameSite as SameSite | undefined,
  );

  const out: CookieOptionsWithExtras = {
    httpOnly: true,
    secure: overrides.secure ?? secure,
    sameSite,
    path: "/",
    ...overrides,
  };

  // Domain: override varsa onu kullan, yoksa resolve edilen domain’i ekle
  const domainOverride =
    typeof overrides.domain === "string" ? overrides.domain.trim() : undefined;

  const finalDomain =
    domainOverride &&
    domainOverride !== "localhost" &&
    domainOverride !== "127.0.0.1"
      ? domainOverride
      : domain;

  if (finalDomain) out.domain = finalDomain;

  return out;
}

/**
 * Cookie names
 * - lowercase alanlar runtime’da kullanılıyor
 * - UPPERCASE alias’lar legacy / backwards-compat için bırakıldı
 */
export const COOKIE_NAMES = {
  adminAccess: "admin_access_token",
  adminRefresh: "admin_refresh_token",
  storeAccess: "store_access_token",
  storeRefresh: "store_refresh_token",

  ADMIN_ACCESS: "admin_access_token",
  ADMIN_REFRESH: "admin_refresh_token",
  STORE_ACCESS: "store_access_token",
  STORE_REFRESH: "store_refresh_token",
} as const;

/**
 * Factories
 * Not: Eğer access/refresh için farklı maxAge istiyorsan overrides ile ver.
 */
export function adminAccessCookieOptions(): CookieOptions {
  return baseCookieOptions() as CookieOptions;
}

export function adminRefreshCookieOptions(): CookieOptions {
  return baseCookieOptions() as CookieOptions;
}

export function storeAccessCookieOptions(): CookieOptions {
  return baseCookieOptions() as CookieOptions;
}

export function storeRefreshCookieOptions(): CookieOptions {
  return baseCookieOptions() as CookieOptions;
}

/**
 * Clear factories
 * - maxAge: 0 + expires: epoch => tarayıcılar için en deterministik temizleme
 */
export function clearAdminAccessCookieOptions(): CookieOptionsWithExtras {
  return baseCookieOptions({ maxAge: 0, expires: new Date(0) });
}

export function clearAdminRefreshCookieOptions(): CookieOptionsWithExtras {
  return baseCookieOptions({ maxAge: 0, expires: new Date(0) });
}

export function clearStoreAccessCookieOptions(): CookieOptionsWithExtras {
  return baseCookieOptions({ maxAge: 0, expires: new Date(0) });
}

export function clearStoreRefreshCookieOptions(): CookieOptionsWithExtras {
  return baseCookieOptions({ maxAge: 0, expires: new Date(0) });
}
