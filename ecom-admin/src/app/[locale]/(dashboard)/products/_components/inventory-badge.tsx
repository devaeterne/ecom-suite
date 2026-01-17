"use client"

import { Text } from "@medusajs/ui"
import type { InventoryStatus } from "../_types/products.types"
import { useT } from "@/i18n/use-t"

export function InventoryBadge({ status }: { status: InventoryStatus }) {
  const t = useT()

  const map: Record<InventoryStatus, string> = {
    in_stock: t("products.filters.inStock"),
    low: t("products.filters.lowStock"),
    out: t("products.filters.outOfStock"),
  }

  return (
    <Text size="small" className="text-ui-fg-subtle">
      {map[status] ?? status}
    </Text>
  )
}
