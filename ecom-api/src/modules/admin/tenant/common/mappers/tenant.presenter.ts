// src/modules/admin/tenant/common/mappers/tenant.presenter.ts

type TenantLike = {
  id: string;
  name: string | null;
  isActive?: boolean | null;

  code?: string | null;
  tenantCode?: string | null;
  slug?: string | null;

  metadata?: any;
  createdAt?: any;
  updatedAt?: any;

  // legacy / optional (varsa kullanırız)
  domains?: any;
};

function asObj(v: any): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

export function presentTenant(t: TenantLike) {
  const md = asObj(t.metadata);

  return {
    id: t.id,
    code: t.code ?? t.tenantCode ?? t.slug ?? null,
    name: t.name,
    isActive: t.isActive ?? true,

    // ✅ canonical tenant settings (metadata top-level)
    timezone: md.timezone ?? null,
    currencyCode: md.currencyCode ?? null,

    branding: {
      name: md.branding?.name ?? t.name ?? null,
      logoUrl: md.branding?.logoUrl ?? null,
    },

    // ✅ i18n sadece locale (currencyCode burada değil)
    i18n: {
      locale: md.i18n?.locale ?? null,
    },

    domains: {
      domains: md.domains?.domains ?? (t as any).domains ?? [],
    },

    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export function presentTenantMeBundle(bundle: {
  tenant: TenantLike;
  plan: any | null;
  entitlements: any;
  usage?: any;
}) {
  return {
    tenant: presentTenant(bundle.tenant),
    plan: bundle.plan ?? null,
    entitlements: bundle.entitlements ?? { limits: {}, remaining: {} },
    usage: bundle.usage ?? null,
  };
}
