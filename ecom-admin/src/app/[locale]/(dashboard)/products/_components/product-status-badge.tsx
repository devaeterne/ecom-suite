"use client";

import type { ProductStatus } from "../_types/products.types";

const map: Record<ProductStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
      {map[status]}
    </span>
  );
}
