"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useT } from "@/i18n/use-t";
import { apiFetch } from "@/src/lib/api/_client/http";
import { toast } from "@medusajs/ui";
import {
  ProductNewDraftProvider,
  useProductNewDraft,
} from "./_state/product-new-draft.provider";

type TabKey =
  | "details"
  | "organize"
  | "variants"
  | "media"
  | "inventory"
  | "translations";

type Tab = {
  key: TabKey;
  label: string;
  requiresDraft: boolean;
};

function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function pickCreatedId(res: any): string | null {
  if (!res) return null;
  if (res.product?.id) return String(res.product.id);
  if (res.id) return String(res.id);
  return null;
}

function buildEditHref(locale: string, productId: string, tab: TabKey) {
  const base = `/${locale}/products/${productId}`;
  switch (tab) {
    case "details":
      return base;
    case "organize":
      return `${base}/organize`;
    case "variants":
      return `${base}/variants`;
    case "media":
      return `${base}/media`;
    case "inventory":
      return `${base}/inventory`;
    case "translations":
      return `${base}/translations`;
    default:
      return base;
  }
}

function ProductNewLayoutInner({ children }: { children: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  const baseNew = `/${locale}/products/new`;

  const { draftId, setDraftId, canDraft, draftBody } = useProductNewDraft();
  const [creatingDraft, setCreatingDraft] = useState(false);

  const tabs: Tab[] = useMemo(
    () => [
      {
        key: "details",
        label: t("products.product_detail.tabs.details"),
        requiresDraft: false,
      },
      {
        key: "organize",
        label: t("products.product_detail.tabs.organize"),
        requiresDraft: false,
      },
      {
        key: "variants",
        label: t("products.product_detail.tabs.variants"),
        requiresDraft: true,
      },
      {
        key: "media",
        label: t("products.product_detail.tabs.media"),
        requiresDraft: true,
      },
      {
        key: "inventory",
        label: t("products.tabs.inventory"),
        requiresDraft: true,
      },
      {
        key: "translations",
        label: t("pages.product_detail.tabs.translations"),
        requiresDraft: true,
      },
    ],
    [t],
  );

  function newHrefFor(tab: TabKey) {
    if (tab === "details") return baseNew;
    return `${baseNew}/${tab}`;
  }

  async function ensureDraftAndGo(tab: TabKey) {
    if (tab === "details" || tab === "organize") {
      router.push(newHrefFor(tab));
      return;
    }

    if (draftId) {
      router.push(buildEditHref(locale, draftId, tab));
      return;
    }

    if (!canDraft) {
      toast.error(t("products.product_detail.hints.titleHandleRequired"));
      router.push(baseNew);
      return;
    }

    if (creatingDraft) return;

    setCreatingDraft(true);
    try {
      const res = await apiFetch<any>("/api/admin/products", {
        method: "POST",
        credentials: "include",
        body: draftBody,
      });

      const id = pickCreatedId(res);
      if (!id) {
        toast.error(t("notifications.saveFailed"));
        router.push(baseNew);
        return;
      }

      setDraftId(id);
      toast.success(t("notifications.saved"));

      router.push(buildEditHref(locale, id, tab));
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error(t("notifications.saveFailed"));
      router.push(baseNew);
    } finally {
      setCreatingDraft(false);
    }
  }

  // ---- UI helpers ----
  const activeTabKey: TabKey = (() => {
    // pathname üzerinden new route için aktif tab’ı çıkar
    // /{locale}/products/new -> details
    // /{locale}/products/new/media -> media
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "new");
    const suffix = idx >= 0 ? parts[idx + 1] : undefined;
    const key = (suffix as TabKey) ?? "details";
    return (tabs.some((x) => x.key === key) ? key : "details") as TabKey;
  })();

  const tabBtnBase = "h-9 rounded-md border px-3 text-sm transition-colors";
  const tabBtnActive = "bg-muted";
  const tabBtnIdle = "hover:bg-muted/60";

  return (
    <div className="space-y-4 min-w-0">
      <div className="rounded-xl border min-w-0">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-sm font-medium">
              {t("products.product_detail.mode.new")}
            </div>

            {/* ===== Mobile: dropdown (temiz, taşmaz) ===== */}
            <div className="ml-auto flex items-center gap-2 md:hidden">
              <select
                className="h-9 max-w-[70vw] rounded-md border bg-background px-2 text-sm"
                value={activeTabKey}
                onChange={(e) => ensureDraftAndGo(e.target.value as TabKey)}
              >
                {tabs.map((tab) => {
                  const disabled = tab.requiresDraft && !draftId && !canDraft;
                  const label =
                    tab.requiresDraft && !draftId
                      ? `${tab.label} • ${t("common.save")}`
                      : tab.label;

                  return (
                    <option key={tab.key} value={tab.key} disabled={disabled}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* ===== Desktop: scrollable tab strip (wrap yok) ===== */}
          <div className="mt-3 hidden md:block">
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 whitespace-nowrap">
                {tabs.map((tab) => {
                  const href = newHrefFor(tab.key);
                  const active = isTabActive(pathname, href);

                  const needsDraft = tab.requiresDraft;
                  const busy = needsDraft && creatingDraft;
                  const disabled = needsDraft && !draftId; // draft yoksa “button” davranışı var, ama görünüm disabled

                  const className = [
                    tabBtnBase,
                    active ? tabBtnActive : tabBtnIdle,
                    disabled ? "opacity-50" : "",
                    busy ? "cursor-wait" : "",
                    "shrink-0",
                  ].join(" ");

                  if (!needsDraft) {
                    return (
                      <Link key={tab.key} href={href} className={className}>
                        {tab.label}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      className={className}
                      onClick={() => ensureDraftAndGo(tab.key)}
                      title={
                        !draftId
                          ? t("products.product_detail.hints.createFirst")
                          : ""
                      }
                      disabled={busy}
                    >
                      {busy ? t("common.saving") : tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* mini helper text */}
            {!draftId ? (
              <div className="mt-2 text-xs text-muted-foreground">
                {t("products.product_detail.hints.createFirst")}
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-4 min-w-0">{children}</div>
      </div>
    </div>
  );
}

export default function ProductNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProductNewDraftProvider>
      <ProductNewLayoutInner>{children}</ProductNewLayoutInner>
    </ProductNewDraftProvider>
  );
}
