// ecom-admin/src/lib/api/auth/admin.ts
import { apiFetch } from "@/src/lib/api/_client/http";

/* ============================================================
   Types
============================================================ */

export type AdminAuthResponse = { accessToken?: string };

export type AdminMeResponse = {
  user: {
    id: string;
    email?: string | null;
    role: "admin" | "super_admin";
    tenantId?: string | null;
  };
};

/* ============================================================
   Refresh mutex (tek refresh in-flight)
============================================================ */

let refreshPromise: Promise<AdminAuthResponse> | null = null;

function refreshOnce(): Promise<AdminAuthResponse> {
  if (!refreshPromise) {
    refreshPromise = apiFetch<AdminAuthResponse>("/api/admin/auth/refresh", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/* ============================================================
   AdminMe cache (single-flight + TTL)
============================================================ */

const ME_TTL_MS = 30_000; // 30s: navigation/perf için ideal, istersen 5dk yaparız

let meCache: { at: number; value: AdminMeResponse } | null = null;
let meInFlight: Promise<AdminMeResponse> | null = null;

async function fetchMe(): Promise<AdminMeResponse> {
  return apiFetch<AdminMeResponse>("/api/admin/me", {
    method: "GET",
    auth: "admin",
    credentials: "include",
    tenant: false,
  });
}

function invalidateMe() {
  meCache = null;
  meInFlight = null;
}

async function meCached(opts?: { force?: boolean }): Promise<AdminMeResponse> {
  const now = Date.now();

  if (!opts?.force && meCache && now - meCache.at < ME_TTL_MS) {
    return meCache.value;
  }

  if (!opts?.force && meInFlight) {
    return meInFlight;
  }

  meInFlight = (async () => {
    try {
      const v = await fetchMe();
      meCache = { at: Date.now(), value: v };
      return v;
    } catch (e) {
      // auth fail / network fail -> cache kirletmeyelim
      invalidateMe();
      throw e;
    } finally {
      meInFlight = null;
    }
  })();

  return meInFlight;
}

/* ============================================================
   Public APIs
============================================================ */

export const AdminAuthApi = {
  login: (body: { email: string; password: string }) =>
    apiFetch<AdminAuthResponse>("/api/admin/auth/login", {
      method: "POST",
      body,
      credentials: "include",
    }),

  refresh: refreshOnce,

  logout: async () => {
    try {
      await apiFetch<void>("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      // logout sonrası role/user cache temizliği
      invalidateMe();
    }
  },
};

export const AdminMeApi = {
  /**
   * Raw me (no cache) — nadiren lazım olur.
   */
  me: fetchMe,

  /**
   * Cached me (single-flight + TTL)
   */
  meCached,

  /**
   * Logout / role değişimi / user switch sonrası cache temizliği
   */
  invalidate: invalidateMe,
};
