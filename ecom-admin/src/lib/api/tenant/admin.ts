import { apiFetch } from "@/src/lib/api/_client/http";

export type AdminTenantMe = {
  id: string; // tenantId (uuid)
  code: string; // tenantCode (acme)
  name?: string;
};

export const AdminTenantApi = {
  me: () =>
    apiFetch<AdminTenantMe>("/api/admin/tenants/me", {
      method: "GET",
      credentials: "include",
    }),
};
