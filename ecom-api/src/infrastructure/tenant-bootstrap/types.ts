/**
 * Runtime'da aktif olan tenant bilgisi.
 * Middleware (req.tenant) + bootstrap + background job'lar için ortak tip.
 */
export type ActiveTenant = {
  id: string;
  code?: string;
};

/**
 * tenant.json'dan okunan bootstrap konfigürasyonu
 * (tek tenant varsayımı, ileride array'e genişler)
 */
export type TenantBootstrapConfig = {
  code: string;
  name: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;

  bootstrapAdmin: {
    email: string;
    password: string;
    name?: string;
  };
};

/**
 * Request context'e enjekte edilen tenant bilgisi
 * (Express Request augmentation için)
 */
export type TenantRequestContext = {
  tenant?: ActiveTenant;
};
