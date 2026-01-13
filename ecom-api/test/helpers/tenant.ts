// test/utils/tenant.ts
type TenantOpts = { tenantId?: string; tenantCode?: string };

const DEFAULT_TENANT_ID =
  process.env.E2E_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
const DEFAULT_TENANT_CODE = process.env.E2E_TENANT_CODE ?? "test";

export function withTenantHeaders(req: any, opts?: TenantOpts) {
  const tenantId = opts?.tenantId ?? DEFAULT_TENANT_ID;
  const tenantCode = opts?.tenantCode ?? DEFAULT_TENANT_CODE;

  return req.set("x-tenant-id", tenantId).set("x-tenant-code", tenantCode);
}
