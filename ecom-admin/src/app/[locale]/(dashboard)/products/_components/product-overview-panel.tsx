import { Text } from "@medusajs/ui"
import type { AdminProductDetail } from "../_types/products.types"

export function ProductOverviewPanel({ product }: { product: AdminProductDetail }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border p-4 space-y-2">
        <Text weight="plus">General</Text>
        <div className="space-y-2">
          <label className="block text-sm">
            <span className="text-ui-fg-subtle text-xs">Title</span>
            <input className="mt-1 h-9 w-full rounded-md border px-3 text-sm" defaultValue={product.title} disabled />
          </label>

          <label className="block text-sm">
            <span className="text-ui-fg-subtle text-xs">Status</span>
            <input className="mt-1 h-9 w-full rounded-md border px-3 text-sm" defaultValue={product.status} disabled />
          </label>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <Text weight="plus">Organization</Text>
        <Text size="small" className="text-ui-fg-subtle">
          Category / Collection / Tags will be connected after API integration.
        </Text>
      </div>
    </div>
  )
}
