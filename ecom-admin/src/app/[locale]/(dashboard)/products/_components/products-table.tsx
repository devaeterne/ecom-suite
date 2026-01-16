"use client"

import type { AdminProductListItem } from "@/src/modules/products/types/products.types"
import { ProductStatusBadge } from "./product-status-badge"
import { InventoryBadge } from "./inventory-badge"
import { RowActionsMenu } from "./row-actions-menu"

type Props = {
  items: AdminProductListItem[]

  // pagination
  offset: number
  limit: number
  total: number

  onOffsetChange: (nextOffset: number) => void
  onLimitChange: (nextLimit: number) => void
}

export function ProductsTable({
  items,
  offset,
  limit,
  total,
  onOffsetChange,
  onLimitChange,
}: Props) {
  const page = Math.floor(offset / limit) + 1
  const pageCount = Math.max(1, Math.ceil(total / limit))

  const canPrev = offset > 0
  const canNext = offset + limit < total

  return (
    <div className="rounded-xl border">
      <div className="grid grid-cols-12 gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
        <div className="col-span-5">Product</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Variants</div>
        <div className="col-span-1">Inventory</div>
        <div className="col-span-1">Updated</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      <div className="divide-y">
        {items.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-muted/40"
          >
            <div className="col-span-5">
              <div className="font-medium">{p.title}</div>


              <div className="text-xs text-muted-foreground">
                {p.handle ? `@${p.handle}` : ""}
              </div>
            </div>
            <div className="col-span-2 text-xs text-muted-foreground">
              {p.categoryNames.length ? p.categoryNames.join(", ") : "—"}
            </div>

            <div className="col-span-1">
              <ProductStatusBadge status={p.status} />
            </div>


            <div className="col-span-1">{p.variantsCount}</div>

            <div className="col-span-1">
              <InventoryBadge status={p.stockAvailable} />
            </div>

            <div className="col-span-1 text-xs text-muted-foreground">
              {new Date(p.updatedAt).toLocaleDateString()}
            </div>

            <div className="col-span-1 text-right">
              <RowActionsMenu productId={p.id} />
            </div>
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="flex flex-wrap items-center gap-3 border-t px-4 py-3 text-sm">
        <div className="text-muted-foreground">
          {total} items • Page {page}/{pageCount}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>

          <button
            type="button"
            className="h-9 rounded-md border px-3 text-sm disabled:opacity-50"
            disabled={!canPrev}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          >
            Prev
          </button>

          <button
            type="button"
            className="h-9 rounded-md border px-3 text-sm disabled:opacity-50"
            disabled={!canNext}
            onClick={() => onOffsetChange(offset + limit)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
