"use client"

import { Text } from "@medusajs/ui"
import type { InventoryStatus } from "../_types/products.types"

export function InventoryBadge({ status }: { status: InventoryStatus }) {
  return (
    <Text size="small" className="text-ui-fg-subtle">
      {status}
    </Text>
  )
}
