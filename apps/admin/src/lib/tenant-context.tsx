'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getTenant, TenantPublic } from './tenant';

type TenantState = {
  tenant: TenantPublic | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const TenantContext = createContext<TenantState | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log('[TenantProvider] render', { tenant, isLoading, error })

  const refresh = async () => {
    console.log('[TenantProvider] refresh start')
    const t = await getTenant()
    console.log('[TenantProvider] refresh ok', t)
    try {
      setIsLoading(true);
      setError(null);
      const t = await getTenant();
      setTenant(t);
    } catch (e: any) {
      setError(e?.message ?? 'Tenant fetch failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ tenant, isLoading, error, refresh }), [tenant, isLoading, error]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
