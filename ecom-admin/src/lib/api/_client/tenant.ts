// src/lib/api/_client/tenant.ts
import { apiFetch } from "@/src/lib/api/_client/http";

export const TENANT_ID_HEADER = "x-tenant-id";
export const TENANT_CODE_HEADER = "x-tenant-code";

const LS_TENANT_ID = "tenantId";
const LS_TENANT_CODE = "tenantCode";

export type AdminTenantMeBundle = {
  tenant: {
    id: string;
    code: string | null;
    name: string | null;
    timezone: string | null;
    currencyCode: string | null;
    // NOTE: backend i18n locale dönebiliyor, currencyCode artık metadata root’ta.
    i18n?: { locale?: string | null } | null;
  };
  plan: any | null;
  entitlements: {
    limits: Record<string, any>;
    remaining?: Record<string, any>;
  };
  usage: any;
};

export const AdminTenantApi = {
  me: () =>
    apiFetch<AdminTenantMeBundle>("/api/admin/tenants/me", {
      method: "GET",
      auth: "admin",
      credentials: "include",
      // /tenants/me tenant header gerektirmez (zaten tenant context auth'tan geliyor)
      tenant: false,
    }),
};

export function setTenantContext(input: {
  tenantId: string;
  tenantCode: string;
}) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_TENANT_ID, input.tenantId);
  window.localStorage.setItem(LS_TENANT_CODE, input.tenantCode);
}

export function clearTenantContext() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LS_TENANT_ID);
  window.localStorage.removeItem(LS_TENANT_CODE);
}

const isValid = (v: string | null) =>
  !!v && v !== "undefined" && v !== "null" && v.trim().length > 0;

export function getTenantHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const tenantId = window.localStorage.getItem(LS_TENANT_ID);
  const tenantCode = window.localStorage.getItem(LS_TENANT_CODE);

  const h: Record<string, string> = {};
  if (isValid(tenantId)) h[TENANT_ID_HEADER] = tenantId!;
  if (isValid(tenantCode)) h[TENANT_CODE_HEADER] = tenantCode!;
  return h;
}

export function withTenantHeaders(headers?: Record<string, string>) {
  return { ...(headers ?? {}), ...getTenantHeaders() };
}
