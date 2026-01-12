"use client";

import type { InventoryStatus } from "../types/products.types";

const map: Record<InventoryStatus, { label: string }> = {
  in_stock: { label: "In stock" },
  low: { label: "Low" },
  out: { label: "Out" },
};

export function InventoryBadge({ status }: { status: InventoryStatus }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
      {map[status].label}
    </span>
  );
}
