"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/src/lib/api/_client/http"
import { useT } from "@/i18n/use-t"


type Category = { id: string; name: string }
type Collection = { id: string; title?: string; name?: string }

const LIMITS = [10, 25, 50, 100] as const

type FiltersValue = {
  q: string
  status: string
  categoryId: string
  collectionId: string
  inventory: string
  limit: number
}

type Props = {
  value: FiltersValue
  onChange: (patch: Partial<FiltersValue>) => void
  onClear: () => void
}

export function ProductsFilters({ value, onChange, onClear }: Props) {
  const t = useT()

  // Options
  const [categories, setCategories] = useState<Category[]>([])
  const [collections, setCollections] = useState<Collection[]>([])

  useEffect(() => {
    let alive = true
      ; (async () => {
        try {
          const [cats, cols] = await Promise.all([
            apiFetch<{ items?: Category[] } | Category[]>("/api/admin/categories"),
            apiFetch<{ items?: Collection[] } | Collection[]>("/api/admin/collections"),
          ])

          const catItems = Array.isArray(cats) ? cats : cats.items ?? []
          const colItems = Array.isArray(cols) ? cols : cols.items ?? []

          if (!alive) return
          setCategories(catItems)
          setCollections(colItems)
        } catch {
          // filtreler opsiyonel: sessiz geç
        }
      })()

    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
      {/* Search */}
      <input
        className="h-9 w-72 rounded-md border bg-background px-3 text-sm"
        placeholder={t("products.search")}
        value={value.q}
        onChange={(e) => onChange({ q: e.target.value })}
      />

      {/* Status */}
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm"
        value={value.status}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value="">{t("products.filters.statusAll")}</option>
        <option value="draft">{t("pages.product_detail.status.draft")}</option>
        <option value="published">{t("pages.product_detail.status.published")}</option>
        <option value="archived">{t("pages.product_detail.status.archived")}</option>
      </select>

      {/* Category */}
      <select
        className="h-9 min-w-56 rounded-md border bg-background px-2 text-sm"
        value={value.categoryId}
        onChange={(e) => onChange({ categoryId: e.target.value })}
      >
        <option value="">{t("products.filters.categoryAll")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Collection */}
      <select
        className="h-9 min-w-56 rounded-md border bg-background px-2 text-sm"
        value={value.collectionId}
        onChange={(e) => onChange({ collectionId: e.target.value })}
      >
        <option value="">{t("products.filters.collectionAll")}</option>
        {collections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title ?? c.name ?? c.id}
          </option>
        ))}
      </select>

      {/* Inventory */}
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm"
        value={value.inventory}
        onChange={(e) => onChange({ inventory: e.target.value })}
        title={t("products.filters.inventoryHint")}
      >
        <option value="">{t("products.filters.stockAll")}</option>
        <option value="in_stock">{t("products.filters.inStock")}</option>
        <option value="low">{t("products.filters.lowStock")}</option>
        <option value="out">{t("products.filters.outOfStock")}</option>
      </select>


      {/* Limit */}
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm"
        value={String(value.limit)}
        onChange={(e) => onChange({ limit: Number(e.target.value) })}
      >
        {LIMITS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="ml-auto h-9 rounded-md border px-3 text-sm hover:bg-muted"
        onClick={onClear}
      >
        {t("products.filters.clear")}
      </button>

    </div>
  )
}
