// test/utils/tenant.ts
type TenantOpts = { tenantId?: string; tenantCode?: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanEnv(v?: string) {
  return (v ?? "").trim().replace(/^"+|"+$/g, "");
}

export function withTenantHeaders(req: any, opts?: TenantOpts) {
  const tenantId = cleanEnv(opts?.tenantId ?? process.env.E2E_TENANT_ID);
  const tenantCode = cleanEnv(opts?.tenantCode ?? process.env.E2E_TENANT_CODE);

  if (tenantId) {
    if (!UUID_RE.test(tenantId)) {
      throw new Error(`[tenant] invalid uuid: "${tenantId}"`);
    }
    req.set("x-tenant-id", tenantId);
  }

  if (tenantCode) req.set("x-tenant-code", tenantCode);

  return req;
}
