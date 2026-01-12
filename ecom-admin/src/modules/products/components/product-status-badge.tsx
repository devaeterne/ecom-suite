"use client";

import type { ProductStatus } from "../types/products.types";

const map: Record<ProductStatus, { label: string }> = {
  draft: { label: "Draft" },
  published: { label: "Published" },
  archived: { label: "Archived" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
      {map[status].label}
    </span>
  );
}
