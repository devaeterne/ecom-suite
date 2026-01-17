"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/src/lib/api/_client/http"
import { setTenantContext, clearTenantContext } from "@/src/lib/api/_client/tenant"

export type TenantMe = {
  id: string
  code: string
  name?: string
  // sende backend’de yoksa sorun değil; UI için opsiyonel
  defaultCurrencyCode?: string
  supportedCurrencyCodes?: string[]
}

type AppSessionState = {
  loading: boolean
  tenant: TenantMe | null
  defaultCurrencyCode: string
  supportedCurrencyCodes: string[]
  refreshTenant: () => Promise<void>
  clear: () => void
}

const AppSessionContext = createContext<AppSessionState | null>(null)

function pickTenant(raw: any): TenantMe | null {
  if (!raw) return null
  // bazı backend’ler direkt döner, bazıları {tenant: ...}
  const t = raw.tenant ?? raw
  if (!t?.id) return null

  return {
    id: t.id,
    code: t.code ?? t.tenantCode ?? t.slug ?? "",
    name: t.name,
    defaultCurrencyCode: t.defaultCurrencyCode ?? t.currencyCode ?? undefined,
    supportedCurrencyCodes: Array.isArray(t.supportedCurrencyCodes)
      ? t.supportedCurrencyCodes
      : undefined,
  }
}

export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<TenantMe | null>(null)

  // fallbacks (tenant API henüz bu alanları dönmüyorsa)
  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState("EUR")
  const [supportedCurrencyCodes, setSupportedCurrencyCodes] = useState<string[]>(["EUR"])

  const clear = useCallback(() => {
    clearTenantContext()
    setTenant(null)
    setDefaultCurrencyCode("EUR")
    setSupportedCurrencyCodes(["EUR"])
  }, [])

  const refreshTenant = useCallback(async () => {
    // AuthGuard zaten cookie var diye burayı çağıracak; yine de patlarsa sessiz düşeriz.
    const raw = await apiFetch<any>("/api/admin/tenants/me", {
      method: "GET",
      credentials: "include",
    })

    const t = pickTenant(raw)
    if (!t) {
      clear()
      return
    }

    // Tenant headers için localStorage'ı besle
    if (t.id && t.code) {
      setTenantContext({ tenantId: t.id, tenantCode: t.code })
    }

    setTenant(t)

    // Currency: tenant endpointinden geliyorsa kullan, gelmiyorsa fallback kalsın
    if (t.defaultCurrencyCode) setDefaultCurrencyCode(t.defaultCurrencyCode)
    if (t.supportedCurrencyCodes?.length) setSupportedCurrencyCodes(t.supportedCurrencyCodes)
  }, [clear])

  useEffect(() => {
    let alive = true
      ; (async () => {
        setLoading(true)
        try {
          await refreshTenant()
        } catch {
          // AuthGuard altında değilse 401/403 olabilir → ignore
        } finally {
          if (alive) setLoading(false)
        }
      })()
    return () => {
      alive = false
    }
  }, [refreshTenant])

  const value = useMemo<AppSessionState>(
    () => ({
      loading,
      tenant,
      defaultCurrencyCode,
      supportedCurrencyCodes,
      refreshTenant,
      clear,
    }),
    [loading, tenant, defaultCurrencyCode, supportedCurrencyCodes, refreshTenant, clear]
  )

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>
}

export function useAppSession() {
  const ctx = useContext(AppSessionContext)
  if (!ctx) throw new Error("useAppSession must be used within AppSessionProvider")
  return ctx
}
