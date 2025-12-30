export type SeedPermission = {
  key: string;
  description?: string;
};

export const SEED_PERMISSIONS: SeedPermission[] = [
  // Tenant
  { key: "tenant:read", description: "Tenant bilgilerini görüntüleme" },
  { key: "tenant:write", description: "Tenant ayarlarını güncelleme" },

  // Identities
  {
    key: "identity:read",
    description: "Admin kullanıcıları listeleme/görüntüleme",
  },
  {
    key: "identity:write",
    description: "Admin kullanıcı oluşturma/güncelleme/davet",
  },

  // RBAC
  { key: "rbac:read", description: "Roller & izinleri görüntüleme" },
  { key: "rbac:write", description: "Rol oluşturma/güncelleme ve izin atama" },

  // System (ileride)
  { key: "system:read", description: "Sistem ayarlarını görüntüleme" },
  { key: "system:write", description: "Sistem ayarlarını güncelleme" },

  // Session
  { key: "session:read", description: "Read sessions" },
  { key: "session:write", description: "Revoke sessions" },
];
