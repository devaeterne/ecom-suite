export function presentTenant(t: any) {
  const md = (t.metadata ?? {}) as any;

  return {
    id: t.id,
    name: t.name,
    plan: t.plan ?? null,
    isActive: t.isActive ?? true,

    // canonical fields + metadata overlay
    branding: {
      name: md.branding?.name ?? t.name ?? null,
      logoUrl: md.branding?.logoUrl ?? null,
    },
    i18n: {
      locale: md.i18n?.locale ?? md.locale ?? null,
      currency: md.i18n?.currency ?? md.currency ?? null,
    },
    domains: {
      domains: md.domains?.domains ?? md.domains ?? [],
    },

    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}
