"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import type { AdminProductListItem } from "@/src/modules/products/types/products.types";
import { useT } from "@/i18n/use-t";
import { toast } from "@medusajs/ui";

import { ProductStatusBadge } from "./product-status-badge";
import { InventoryBadge } from "./inventory-badge";
import { RowActionsMenu } from "./row-actions-menu";

import { useTenantEntitlements } from "@/src/lib/api/tenant/use-tenant-entitlements";

type Props = {
  items: AdminProductListItem[];

  offset: number;
  limit: number;
  total: number;

  onOffsetChange: (nextOffset: number) => void;
  onLimitChange: (nextLimit: number) => void;
  onDeleted?: (productId: string) => void;
};

function asInt(v: any, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

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

  // ---- PR-6: quota aware ----
  const { limits, remaining, loading } = useTenantEntitlements();
  const productsPerStatus = asInt((limits as any)?.productsPerStatus, 0); // 0 => unlimited
  const remainingDraft = asInt((remaining as any)?.draft, 0);

  const limitEnabled = productsPerStatus > 0;
  const usedDraft = limitEnabled
    ? Math.max(0, productsPerStatus - remainingDraft)
    : 0;

  const canCreate = !limitEnabled ? true : remainingDraft > 0;

  const quotaLabel =
    limitEnabled && !loading
      ? `Limit: ${usedDraft}/${productsPerStatus}`
      : null;

  const disabledReason =
    limitEnabled && !canCreate
      ? `Plan limitine ulaşıldı (draft). Limit: ${productsPerStatus}.`
      : null;

  function onClickNewDisabled() {
    toast.error(disabledReason ?? "Ürün limiti dolu");
  }

  // küçük helper: mobilde tarih formatı daha kısa olsun
  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(locale);
    } catch {
      return "";
    }
  };

  return (
    <div className="rounded-xl border">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="text-sm font-medium">
          {t("products.ProductTableTitle")}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quotaLabel ? (
            <span className="rounded-md border bg-muted/20 px-2 py-1 text-xs text-muted-foreground">
              {quotaLabel}
            </span>
          ) : null}

          {canCreate ? (
            <Link
              href={newHref}
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <span className="text-base leading-none">+</span>
              {t("products.common.new")}
            </Link>
          ) : (
            <button
              type="button"
              title={disabledReason ?? undefined}
              onClick={onClickNewDisabled}
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium opacity-50"
            >
              <span className="text-base leading-none">+</span>
              {t("products.common.new")}
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP columns */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
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
            <div key={p.id} className="px-4 py-3">
              {/* MOBILE row */}
              <div className="grid gap-2 md:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.handle ? `@${p.handle}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <RowActionsMenu
                      productId={p.id}
                      onDeleted={() => onDeleted?.(p.id)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <ProductStatusBadge status={p.status} />
                  <span className="text-muted-foreground">
                    {t("products.columns.inventory")}:{" "}
                    <InventoryBadge status={p.stockAvailable} />
                  </span>
                  <span className="text-muted-foreground">
                    {t("products.columns.variants")}: {p.variantsCount}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  {t("products.columns.category")}:{" "}
                  {p.categoryNames.length
                    ? p.categoryNames.join(", ")
                    : t("common.emptyDash")}
                </div>

                <div className="text-xs text-muted-foreground">
                  {t("products.columns.updated")}: {fmtDate(p.updatedAt)}
                </div>
              </div>

              {/* DESKTOP row */}
              <div className="hidden md:grid md:grid-cols-12 md:gap-2 text-sm hover:bg-muted/40 rounded-md">
                <div className="col-span-5 py-1">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.handle ? `@${p.handle}` : ""}
                  </div>
                </div>

                <div className="col-span-2 py-1 text-xs text-muted-foreground">
                  {p.categoryNames.length
                    ? p.categoryNames.join(", ")
                    : t("common.emptyDash")}
                </div>

                <div className="col-span-1 py-1">
                  <ProductStatusBadge status={p.status} />
                </div>

                <div className="col-span-1 py-1">{p.variantsCount}</div>

                <div className="col-span-1 py-1">
                  <InventoryBadge status={p.stockAvailable} />
                </div>

                <div className="col-span-1 py-1 text-xs text-muted-foreground">
                  {fmtDate(p.updatedAt)}
                </div>

                <div className="col-span-1 py-1 text-right">
                  <RowActionsMenu
                    productId={p.id}
                    onDeleted={() => onDeleted?.(p.id)}
                  />
                </div>
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
