"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import type { AdminProductListItem } from "@/src/modules/products/types/products.types";
import { useT } from "@/i18n/use-t";

import { ProductStatusBadge } from "./product-status-badge";
import { InventoryBadge } from "./inventory-badge";
import { RowActionsMenu } from "./row-actions-menu";

type Props = {
  items: AdminProductListItem[];

  // pagination
  offset: number;
  limit: number;
  total: number;

  onOffsetChange: (nextOffset: number) => void;
  onLimitChange: (nextLimit: number) => void;
  onDeleted?: (productId: string) => void; // ✅
};

export function ProductsTable({
  items,
  offset,
  limit,
  total,
  onOffsetChange,
  onLimitChange,
  onDeleted,
}: Props) {
  const t = useT();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  const page = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const newHref = `/${locale}/products/new`;

  return (
    <div className="rounded-xl border">
      {/* header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-medium">
          {t("products.ProductTableTitle")}
        </div>

        <Link
          href={newHref}
          className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <span className="text-base leading-none">+</span>
          {t("products.common.new")}
        </Link>
      </div>

      {/* columns */}
      <div className="grid grid-cols-12 gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
        <div className="col-span-5">{t("products.columns.product")}</div>
        <div className="col-span-2">{t("products.columns.category")}</div>
        <div className="col-span-1">{t("products.columns.status")}</div>
        <div className="col-span-1">{t("products.columns.variants")}</div>
        <div className="col-span-1">{t("products.columns.inventory")}</div>
        <div className="col-span-1">{t("products.columns.updated")}</div>
        <div className="col-span-1 text-right">
          {t("products.columns.actions")}
        </div>
      </div>

      {/* rows */}
      <div className="divide-y">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="text-sm font-medium">
              {t("products.empty.title")}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t("products.empty.body")}
            </div>
          </div>
        ) : (
          items.map((p) => (
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
                {p.categoryNames.length
                  ? p.categoryNames.join(", ")
                  : t("common.emptyDash")}
              </div>

              <div className="col-span-1">
                <ProductStatusBadge status={p.status} />
              </div>

              <div className="col-span-1">{p.variantsCount}</div>

              <div className="col-span-1">
                <InventoryBadge status={p.stockAvailable} />
              </div>

              <div className="col-span-1 text-xs text-muted-foreground">
                {new Date(p.updatedAt).toLocaleDateString(locale)}
              </div>

              <div className="col-span-1 text-right">
                <RowActionsMenu
                  productId={p.id}
                  onDeleted={() => onDeleted?.(p.id)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* footer */}
      <div className="flex flex-wrap items-center gap-3 border-t px-4 py-3 text-sm">
        <div className="text-muted-foreground">
          {total} {t("products.items")} • {t("products.page")} {page}/
          {pageCount}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="h-9 rounded-md border px-3 text-sm disabled:opacity-50"
            disabled={!canPrev}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          >
            {t("products.pagination.prev")}
          </button>

          <button
            type="button"
            className="h-9 rounded-md border px-3 text-sm disabled:opacity-50"
            disabled={!canNext}
            onClick={() => onOffsetChange(offset + limit)}
          >
            {t("products.pagination.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
