// ecom-admin/src/lib/api/auth/admin.ts
import { apiFetch } from "@/src/lib/api/_client/http";

export type AdminAuthResponse = { accessToken?: string };

// ✅ Refresh mutex (tek refresh in-flight)
let refreshPromise: Promise<AdminAuthResponse> | null = null;

export const AdminAuthApi = {
  login: (body: { email: string; password: string }) =>
    apiFetch<AdminAuthResponse>("/api/admin/auth/login", {
      method: "POST",
      body,
      credentials: "include",
    }),

  refresh: () => {
    if (!refreshPromise) {
      refreshPromise = apiFetch<AdminAuthResponse>("/api/admin/auth/refresh", {
        method: "POST",
        credentials: "include",
      }).finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  },

  logout: () =>
    apiFetch<void>("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    }),
};
