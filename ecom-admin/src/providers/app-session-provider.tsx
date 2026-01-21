// src/providers/app-session-provider.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AdminTenantApi,
  type AdminTenantMeBundle,
  setTenantContext,
  clearTenantContext,
} from "@/src/lib/api/_client/tenant";

export type TenantMe = {
  id: string;
  code: string;
  name?: string | null;
  timezone?: string | null;
  currencyCode?: string | null;
  locale?: string | null;
};

type AppSessionState = {
  loading: boolean;

  tenant: TenantMe | null;

  // PR-6: bundle’ı taşıyoruz (limits/remaining/usage/plan)
  tenantBundle: AdminTenantMeBundle | null;

  defaultCurrencyCode: string;
  supportedCurrencyCodes: string[];

  refreshTenant: () => Promise<void>;
  clear: () => void;
};

const AppSessionContext = createContext<AppSessionState | null>(null);

function pickTenant(bundle: AdminTenantMeBundle | any): TenantMe | null {
  if (!bundle) return null;

  const t = bundle?.tenant ?? bundle;
  if (!t?.id) return null;

  const code = t.code ?? t.tenantCode ?? t.slug ?? null;

  return {
    id: String(t.id),
    code: code ? String(code) : "",
    name: t.name ?? null,
    timezone: t.timezone ?? null,
    currencyCode: t.currencyCode ?? null,
    locale: t.i18n?.locale ?? null,
  };
}

export function AppSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  const [tenantBundle, setTenantBundle] = useState<AdminTenantMeBundle | null>(
    null,
  );
  const [tenant, setTenant] = useState<TenantMe | null>(null);

  // fallbacks
  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState("EUR");
  const [supportedCurrencyCodes, setSupportedCurrencyCodes] = useState<
    string[]
  >(["EUR"]);

  const clear = useCallback(() => {
    clearTenantContext();
    setTenant(null);
    setTenantBundle(null);
    setDefaultCurrencyCode("EUR");
    setSupportedCurrencyCodes(["EUR"]);
  }, []);

  const refreshTenant = useCallback(async () => {
    const bundle = await AdminTenantApi.me();
    const t = pickTenant(bundle);

    if (!t) {
      clear();
      return;
    }

    // bundle state
    setTenantBundle(bundle);
    setTenant(t);

    // tenant headers için localStorage
    if (t.id && t.code) {
      setTenantContext({ tenantId: t.id, tenantCode: t.code });
    }

    // currencyCode (metadata root)
    if (t.currencyCode) setDefaultCurrencyCode(t.currencyCode);

    // PR-6: supportedCurrencyCodes henüz backend’de yoksa fallback kalsın
    // ileride plan/tenant config ile doldururuz.
  }, [clear]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await refreshTenant();
      } catch {
        // admin cookie yoksa 401/403 olabilir → sessiz geç
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refreshTenant]);

  const value = useMemo<AppSessionState>(
    () => ({
      loading,
      tenant,
      tenantBundle,
      defaultCurrencyCode,
      supportedCurrencyCodes,
      refreshTenant,
      clear,
    }),
    [
      loading,
      tenant,
      tenantBundle,
      defaultCurrencyCode,
      supportedCurrencyCodes,
      refreshTenant,
      clear,
    ],
  );

  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const ctx = useContext(AppSessionContext);
  if (!ctx)
    throw new Error("useAppSession must be used within AppSessionProvider");
  return ctx;
}
