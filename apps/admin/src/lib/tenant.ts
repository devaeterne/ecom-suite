// apps/admin/src/lib/tenant.ts
import { apiGet } from './api'

export type TenantPublic = {
  name: string
  locale?: string
  currency?: string
  branding?: { logoUrl?: string; primaryColor?: string }
  modules?: { verifone?: boolean; cod_cash?: boolean; shipping_manual?: boolean }
}

export function getTenant() {
  return apiGet<TenantPublic>('/v1/tenant')
}
