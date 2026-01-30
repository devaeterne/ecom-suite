import { apiFetch } from "@/src/lib/api/_client/http";

export type AdminTenantListItem = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

export const AdminTenantsApi = {
  async list(): Promise<{ items: AdminTenantListItem[] }> {
    return apiFetch("/api/admin/tenants", {
      method: "GET",
      auth: "admin",
      tenant: true, // super admin için header seçimini de taşır
    });
  },
  async switchTenant(input: { targetTenantId: string }) {
    return apiFetch("/api/admin/tenants/switch", {
      method: "POST",
      auth: "admin",
      body: input,
      tenant: true,
    });
  },
};
