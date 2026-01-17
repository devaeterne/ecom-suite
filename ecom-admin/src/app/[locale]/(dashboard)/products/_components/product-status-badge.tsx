"use client";

import type { ProductStatus } from "../_types/products.types";
import { useT } from "@/i18n/use-t";

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const t = useT();

  const map: Record<ProductStatus, string> = {
    draft: t("pages.product_detail.status.draft"),
    published: t("pages.product_detail.status.published"),
    archived: t("pages.product_detail.status.archived"),
  };

  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
      {map[status]}
    </span>
  );
}
