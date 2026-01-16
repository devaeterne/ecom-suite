export const TENANT_ID_HEADER = "x-tenant-id";
export const TENANT_CODE_HEADER = "x-tenant-code";

const LS_TENANT_ID = "tenantId";
const LS_TENANT_CODE = "tenantCode";

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

export function getTenantHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const tenantId = window.localStorage.getItem(LS_TENANT_ID) || "";
  const tenantCode = window.localStorage.getItem(LS_TENANT_CODE) || "";

  const h: Record<string, string> = {};
  if (tenantId) h[TENANT_ID_HEADER] = tenantId;
  if (tenantCode) h[TENANT_CODE_HEADER] = tenantCode;
  return h;
}

export function withTenantHeaders(headers?: Record<string, string>) {
  return { ...(headers ?? {}), ...getTenantHeaders() };
}
