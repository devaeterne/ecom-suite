"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"

import PageHeader from "@/components/page-header/PageHeader"

import { ProductsFilters } from "./_components/products-filters"
import { ProductsTable } from "./_components/products-table"

import { apiFetch } from "@/src/lib/api/_client/http"
import { withQuery } from "@/src/lib/api/_client/query"

// types
import type { AdminProductListItem } from "@/src/modules/products/types/products.types"

type AdminProductsResponse = {
  items: any[]
  pagination: { offset: number; limit: number; total: number }
}

function mapApiToListItem(p: any): AdminProductListItem {
  const categoryNames = Array.isArray(p.categories)
    ? p.categories.map((c: any) => c?.name).filter(Boolean)
    : [];

  return {
    id: p.id,
    title: p.title,
    handle: p.handle ?? undefined,
    status: p.status,
    thumbnailUrl: undefined,
    variantsCount: Array.isArray(p.variants) ? p.variants.length : 0,
    inventoryStatus: p.inventoryStatus ?? "in_stock", // backend yoksa fallback
    stockAvailable: typeof p.stockAvailable === "number" ? p.stockAvailable : 0,
    updatedAt: p.updatedAt ?? new Date().toISOString(), // backend dönmüyorsa geçici
    categoryNames: Array.isArray(p.categories)
      ? p.categories.map((c: any) => c.name)
      : [],
  }
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"

  // ✅ URL -> state
  const offset = Number(searchParams.get("offset") ?? "0") || 0
  const limit = Number(searchParams.get("limit") ?? "25") || 25

  const q = searchParams.get("q") ?? ""
  const status = searchParams.get("status") ?? ""
  const categoryId = searchParams.get("categoryId") ?? ""
  const collectionId = searchParams.get("collectionId") ?? ""
  const inventory = searchParams.get("inventory") ?? "" // in_stock|low|out vs

  const [items, setItems] = useState<AdminProductListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const queryForApi = useMemo(() => {
    // 🔒 Contract kilidi:
    // UI & URL: offset/limit  -> API: offset/limit (backend bunları bekliyor varsayıyoruz)
    return {
      q: q || undefined,
      status: status || undefined,
      categoryId: categoryId || undefined,
      collectionId: collectionId || undefined,
      inventory: inventory || undefined,
      limit,
      offset,
    }
  }, [q, status, categoryId, collectionId, inventory, limit, offset])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const path = withQuery("/api/admin/products", queryForApi)
        const res = await apiFetch<AdminProductsResponse>(path, { method: "GET" })

        if (cancelled) return

        const mapped = (res.items ?? []).map(mapApiToListItem)
        setItems(mapped)
        setTotal(res.pagination?.total ?? mapped.length)
      } catch (err: any) {
        if (cancelled) return
        console.error("[ProductsPage] list failed", err)
        // UI stabil kalsın:
        setItems([])
        setTotal(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [queryForApi])


  function setQuery(next: Record<string, string | number | null | undefined>) {
    const sp = new URLSearchParams(searchParams.toString())
    sp.delete("_rsc") // Next internal

    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === undefined || v === "") sp.delete(k)
      else sp.set(k, String(v))
    }

    router.replace(`/${locale}/products?${sp.toString()}`)
  }

  return (
    <div className="space-y-4">
      <PageHeader titleKey="topbar.title.products" subtitleKey="pages.products.subtitle" />

      <ProductsFilters
        value={{ q, status, categoryId, collectionId, inventory, limit }}
        onChange={(patch) => {
          // filtre değişince başa sar
          setQuery({ ...patch, offset: 0 })
        }}
        onClear={() => {
          router.replace(`/${locale}/products?limit=${limit}&offset=0`)
        }}
      />

      {loading ? (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">Loading…</div>
      ) : (
        <ProductsTable
          items={items}
          offset={offset}
          limit={limit}
          total={total}
          onOffsetChange={(nextOffset) => setQuery({ offset: nextOffset })}
          onLimitChange={(nextLimit) => setQuery({ limit: nextLimit, offset: 0 })}
        />
      )}
    </div>
  )
}
