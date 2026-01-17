"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { apiFetch } from "@/src/lib/api/_client/http"
import type { AdminProductDetail } from "@/src/modules/products/types/products.types"

type Ctx = {
  loading: boolean
  product: AdminProductDetail | null
  reload: () => Promise<void>
}

const ProductDetailContext = createContext<Ctx | null>(null)

export function ProductDetailProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""

  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<AdminProductDetail | null>(null)

  async function reload() {
    if (!id) return
    setLoading(true)
    try {
      const res = await apiFetch<{ product: AdminProductDetail }>(`/api/admin/products/${id}`, {
        method: "GET",
      })
      setProduct(res.product ?? null)
    } catch {
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let alive = true
      ; (async () => {
        if (!alive) return
        await reload()
      })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const value = useMemo<Ctx>(() => ({ loading, product, reload }), [loading, product])

  return <ProductDetailContext.Provider value={value}>{children}</ProductDetailContext.Provider>
}

export function useProductDetail() {
  const ctx = useContext(ProductDetailContext)
  if (!ctx) throw new Error("useProductDetail must be used within ProductDetailProvider")
  return ctx
}
