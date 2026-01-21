"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/src/lib/api/_client/http";
import {
  setTenantContext,
  clearTenantContext,
} from "@/src/lib/api/_client/tenant";

export type TenantMe = {
  id: string;
  code: string;
  name?: string | null;

  timezone?: string | null; // ✅
  currencyCode?: string | null; // ✅

  defaultCurrencyCode?: string; // UI convenience
  supportedCurrencyCodes?: string[];
};

type TenantMeBundle = {
  tenant: {
    id: string;
    code: string | null;
    name: string | null;

    timezone?: string | null; // ✅
    currencyCode?: string | null; // ✅

    // legacy (kalsın ama artık currency buradan okunmuyor)
    i18n?: { locale?: string | null };
  };
  plan: any | null;
  entitlements: any;
  usage: any;
};

type AppSessionState = {
  loading: boolean;
  tenant: TenantMe | null;
  defaultCurrencyCode: string;
  supportedCurrencyCodes: string[];
  refreshTenant: () => Promise<void>;
  clear: () => void;
};

const AppSessionContext = createContext<AppSessionState | null>(null);

function pickTenant(raw: any): TenantMe | null {
  if (!raw) return null;

  const t = raw.tenant ?? raw;
  if (!t?.id) return null;

  const code = t.code ?? t.tenantCode ?? t.slug ?? null;

  // ✅ currencyCode root’tan
  const currencyCode = t.currencyCode ?? t.currency ?? null;

  return {
    id: String(t.id),
    code: code ? String(code) : "",
    name: t.name ?? null,
    timezone: t.timezone ?? null,
    currencyCode: currencyCode ? String(currencyCode) : null,
    defaultCurrencyCode: currencyCode ? String(currencyCode) : undefined,
    supportedCurrencyCodes: undefined,
  };
}

export function AppSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<TenantMe | null>(null);

  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState("EUR");
  const [supportedCurrencyCodes, setSupportedCurrencyCodes] = useState<
    string[]
  >(["EUR"]);

  const clear = useCallback(() => {
    clearTenantContext();
    setTenant(null);
    setDefaultCurrencyCode("EUR");
    setSupportedCurrencyCodes(["EUR"]);
  }, []);

  const refreshTenant = useCallback(async () => {
    const raw = await apiFetch<TenantMeBundle>("/api/admin/tenants/me", {
      method: "GET",
      credentials: "include",
    });

    const t = pickTenant(raw);
    if (!t) {
      clear();
      return;
    }

    if (t.id && t.code) {
      setTenantContext({ tenantId: t.id, tenantCode: t.code });
    }

    setTenant(t);

    if (t.defaultCurrencyCode) setDefaultCurrencyCode(t.defaultCurrencyCode);
    if (t.supportedCurrencyCodes?.length)
      setSupportedCurrencyCodes(t.supportedCurrencyCodes);
  }, [clear]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await refreshTenant();
      } catch {
        // ignore 401/403
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
      defaultCurrencyCode,
      supportedCurrencyCodes,
      refreshTenant,
      clear,
    }),
    [
      loading,
      tenant,
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
