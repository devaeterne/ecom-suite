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

// response picker (senin pattern)
function pickCreatedId(res: any): string | null {
  if (!res) return null;
  if (res.product?.id) return String(res.product.id);
  if (res.id) return String(res.id);
  return null;
}

// new->edit route mapping (gerekirse suffixleri projene göre değiştir)
function buildEditHref(locale: string, productId: string, tab: TabKey) {
  const base = `/${locale}/products/${productId}`;
  switch (tab) {
    case "details":
      return base;
    case "organize":
      return `${base}/organize`; // eğer edit'te organize route'un yoksa `${base}` yap
    case "variants":
      return `${base}/variants`;
    case "media":
      return `${base}/media`;
    case "inventory":
      return `${base}/inventory`; // edit örneğin varsa doğru
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
      }, // organize ID istemiyorsa free
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
    // details/organize: new içinde kalabilir
    if (tab === "details" || tab === "organize") {
      router.push(newHrefFor(tab));
      return;
    }

    // zaten draft var: direkt edit'e
    if (draftId) {
      router.push(buildEditHref(locale, draftId, tab));
      return;
    }

    // draft yok: validation
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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <div className="text-sm font-medium">
            {t("products.product_detail.mode.new")}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const href = newHrefFor(tab.key);
              const active = isTabActive(pathname, href);

              const disabled = tab.requiresDraft && !draftId;
              const busy = tab.requiresDraft && creatingDraft;

              const className = [
                "h-9 rounded-md border px-3 text-sm",
                active ? "bg-muted" : "hover:bg-muted/60",
                disabled ? "opacity-50" : "",
                busy ? "cursor-wait" : "",
              ].join(" ");

              // details/organize: normal link
              if (!tab.requiresDraft) {
                return (
                  <Link key={tab.key} href={href} className={className}>
                    {tab.label}
                  </Link>
                );
              }

              // requiresDraft: button -> ensure draft -> go
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
                >
                  {busy ? t("common.saving") : tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4">{children}</div>
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
