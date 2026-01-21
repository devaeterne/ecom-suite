// src/lib/api/admin/tenant.ts
import { apiFetch } from "@/src/lib/api/_client/http";

export type SubscriptionPlanLimits = {
  productsPerStatus?: number; // 10
  mediaPerProduct?: number; // 1
  users?: number; // 1
  storageMb?: number; // 500
  [k: string]: any;
};

export type TenantEntitlements = {
  limits: SubscriptionPlanLimits;
  remaining?: Record<string, number>; // { draft: 9, published: 10, archived: 10 }
};

export type TenantUsage = {
  productsByStatus?: Record<string, number>; // { draft: 1, published: 0, archived: 0 }
  productsTotal?: number;
};

export type AdminTenant = {
  id: string;
  code: string; // ✅ PR-1: backend presentTenant bunu mutlaka dönecek
  name?: string | null;

  branding?: {
    name?: string | null;
    logoUrl?: string | null;
  };

  i18n?: {
    locale?: string | null;
    currencyCode?: string | null;
  };

  domains?: {
    domains?: string[];
  };

  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminTenantPlan = {
  code?: string; // "free", "starter", "pro" vs
  name?: string;
  status?: string; // TRIALING/ACTIVE...
  billingInterval?: string; // MONTHLY/YEARLY
  limits?: SubscriptionPlanLimits;
  [k: string]: any;
};

export type AdminTenantMeBundle = {
  tenant: AdminTenant;
  plan: AdminTenantPlan | null;
  entitlements: TenantEntitlements;
  usage?: TenantUsage | null;
};

export const AdminTenantApi = {
  me: () =>
    apiFetch<AdminTenantMeBundle>("/api/admin/tenants/me", {
      method: "GET",
      credentials: "include",
    }),
};
